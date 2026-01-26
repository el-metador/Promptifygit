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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PROMPTS
create table public.prompts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  prompt_text text not null, -- RLS must hide this for non-owners/non-unlocked
  ai_model text not null,
  author_id uuid references public.profiles(id),
  is_trending boolean default false,
  image_url text,
  rating_avg numeric(3,2) default 0,
  unlock_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. UNLOCKS (Transaction Table)
create table public.unlocks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  prompt_id uuid references public.prompts(id) not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, prompt_id) -- Prevents double unlocking
);

-- 4. REVIEWS
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  prompt_id uuid references public.prompts(id) not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, prompt_id) -- SECURITY: Enforces 1 review per user per prompt
);

-- ROW LEVEL SECURITY (RLS) --

alter table profiles enable row level security;
alter table prompts enable row level security;
alter table unlocks enable row level security;
alter table reviews enable row level security;

-- Policies

-- Profiles: Public read, Self update
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Prompts: Public read (Prompt Text hidden via API logic usually, or separate table)
create policy "Prompts are viewable by everyone." on prompts for select using (true);
create policy "Admins can insert prompts" on prompts for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Unlocks: Users see their own
create policy "Users see own unlocks" on unlocks for select using (auth.uid() = user_id);
create policy "Users can insert unlock" on unlocks for insert with check (auth.uid() = user_id);

-- Reviews: Public read, Authenticated create
create policy "Reviews are public" on reviews for select using (true);
create policy "Users create reviews" on reviews for insert with check (auth.uid() = user_id);

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
