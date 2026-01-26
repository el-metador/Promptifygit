-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  name text,
  avatar_url text,
  coins integer default 10,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PROMPTS (Public metadata only)
create table public.prompts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  ai_model text not null,
  author text,
  category text,
  author_id uuid references public.profiles(id) on delete set null,
  is_trending boolean default false,
  image_url text,
  rating_avg numeric(3,2) default 0,
  unlock_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PROMPT SECRETS (Protected content)
create table public.prompt_secrets (
  prompt_id uuid primary key references public.prompts(id) on delete cascade,
  prompt_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. UNLOCKS (Transaction Table)
create table public.unlocks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  prompt_id uuid references public.prompts(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, prompt_id)
);

-- 5. REVIEWS
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_name text,
  user_avatar text,
  prompt_id uuid references public.prompts(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, prompt_id)
);

-- ROW LEVEL SECURITY (RLS) --

alter table profiles enable row level security;
alter table prompts enable row level security;
alter table prompt_secrets enable row level security;
alter table unlocks enable row level security;
alter table reviews enable row level security;

-- Policies

-- Profiles: Self read/update (admins can read all)
create policy "Users can view own profile." on profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Prompts: Public read, Admin write
create policy "Prompts are viewable by everyone." on prompts
  for select using (true);
create policy "Admins can insert prompts" on prompts
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can update prompts" on prompts
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can delete prompts" on prompts
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Prompt secrets: only unlocked users or admins can read, admins can write
create policy "Unlocked users can view prompt text" on prompt_secrets
  for select using (
    exists (
      select 1 from unlocks
      where unlocks.prompt_id = prompt_secrets.prompt_id
        and unlocks.user_id = auth.uid()
    )
    or exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
create policy "Admins can insert prompt secrets" on prompt_secrets
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can update prompt secrets" on prompt_secrets
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can delete prompt secrets" on prompt_secrets
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Unlocks: Users see/insert their own
create policy "Users see own unlocks" on unlocks
  for select using (auth.uid() = user_id);
create policy "Users can insert unlock" on unlocks
  for insert with check (auth.uid() = user_id);

-- Reviews: Public read, Authenticated create/update/delete own
create policy "Reviews are public" on reviews
  for select using (true);
create policy "Users create reviews" on reviews
  for insert with check (auth.uid() = user_id);
create policy "Users update own reviews" on reviews
  for update using (auth.uid() = user_id);
create policy "Users delete own reviews" on reviews
  for delete using (auth.uid() = user_id);

-- FUNCTION to update prompt rating after review changes
create or replace function public.update_prompt_rating(p_prompt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric(3,2);
begin
  select coalesce(round(avg(rating)::numeric, 2), 0)
    into v_avg
  from reviews
  where prompt_id = p_prompt_id;

  update prompts
    set rating_avg = v_avg,
        updated_at = timezone('utc'::text, now())
  where id = p_prompt_id;
end;
$$;

revoke all on function public.update_prompt_rating(uuid) from public;
grant execute on function public.update_prompt_rating(uuid) to authenticated;

-- FUNCTION to unlock prompt atomically (coins + unlock + counter)
create or replace function public.unlock_prompt(p_prompt_id uuid)
returns table (unlocked boolean, coins_left integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_coins integer;
  v_row_count integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coins
    into v_coins
  from profiles
  where id = v_user_id
  for update;

  if v_coins is null then
    raise exception 'Profile not found';
  end if;

  if v_coins < 1 then
    if exists (select 1 from unlocks where user_id = v_user_id and prompt_id = p_prompt_id) then
      unlocked := false;
      coins_left := v_coins;
      return next;
    end if;
    raise exception 'Insufficient coins';
  end if;

  insert into unlocks (user_id, prompt_id)
  values (v_user_id, p_prompt_id)
  on conflict do nothing;

  get diagnostics v_row_count = row_count;

  if v_row_count = 1 then
    update profiles
      set coins = coins - 1,
          updated_at = timezone('utc'::text, now())
      where id = v_user_id
      returning coins into v_coins;

    update prompts
      set unlock_count = unlock_count + 1,
          updated_at = timezone('utc'::text, now())
      where id = p_prompt_id;

    unlocked := true;
    coins_left := v_coins;
  else
    unlocked := false;
    coins_left := v_coins;
  end if;

  return next;
end;
$$;

revoke all on function public.unlock_prompt(uuid) from public;
grant execute on function public.unlock_prompt(uuid) to authenticated;

-- FUNCTION to handle new user signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
