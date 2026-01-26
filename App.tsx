import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Coins } from 'lucide-react';
import { Prompt, User, FilterState } from './types';
import { mockService } from './services/mockService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

import { Button } from './components/Button';
import { PromptCard } from './components/PromptCard';
import { PromptModal } from './components/PromptModal';
import { LoginModal } from './components/LoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { SplashScreen } from './components/SplashScreen';
import { BottomNav } from './components/BottomNav';
import { ProfilePage } from './components/ProfilePage';
import { NotFound } from './components/NotFound';
import { AdBanner } from './components/AdBanner';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'home' | 'library' | 'profile' | 'admin'>('home');
  const [showSplash, setShowSplash] = useState(true);

  const [user, setUser] = useState<User | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [promptsError, setPromptsError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    model: 'All',
    onlyTrending: false,
    search: '',
    sort: 'rating'
  });

  // ===== FETCH PROFILE FROM SUPABASE (WITH AUTO-CREATE) =====
  const fetchUserProfile = async (sbUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();

      if (error) throw error;

      let resolvedProfile = profile;

      if (!resolvedProfile) {
        const newProfile = {
          id: sbUser.id,
          email: sbUser.email || '',
          name:
            sbUser.user_metadata?.full_name ||
            sbUser.user_metadata?.name ||
            sbUser.email?.split('@')[0] ||
            'User',
          avatar_url: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || '',
          role: 'user',
          coins: 10,
        };

        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          if (createError.code !== '23505') {
            throw createError;
          }
          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sbUser.id)
            .maybeSingle();
          resolvedProfile = retryProfile;
        } else {
          resolvedProfile = created;
        }
      }

      if (!resolvedProfile) {
        throw new Error('Profile not found');
      }

      const unlockedPromptIds = await mockService.getUnlockedPromptIds(resolvedProfile.id);

      setUser({
        id: resolvedProfile.id,
        name: resolvedProfile.name || 'User',
        email: resolvedProfile.email,
        avatar: resolvedProfile.avatar_url || '',
        role: resolvedProfile.role,
        coins: resolvedProfile.coins ?? 0,
        unlockedPromptIds,
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setAuthError('Failed to load profile. Please sign in again.');
      setUser(null);
    }
  };

  // ===== AUTH SESSION =====
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error('Auth session error:', error);
        setAuthError('Failed to restore session. Please sign in again.');
        setUser(null);
      }
      if (data.session?.user) {
        fetchUserProfile(data.session.user);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ===== INIT DATA =====
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);

    if (!isSupabaseConfigured) {
      setLoading(false);
      return () => clearTimeout(timer);
    }

    mockService
      .getPrompts()
      .then((data) => setPrompts(data))
      .catch((err) => {
        console.error('Failed to load prompts:', err);
        setPromptsError('Failed to load prompts. Please try again.');
      })
      .finally(() => setLoading(false));

    return () => clearTimeout(timer);
  }, []);

  // ===== AUTH HANDLERS =====
  const handleLogin = async (
    args: { provider: 'google' } | { provider: 'email'; email: string; password?: string }
  ) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    setAuthError(null);
    if (args.provider === 'google') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      return;
    }

    if (args.password) {
      const { error } = await supabase.auth.signInWithPassword({
        email: args.email,
        password: args.password,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email: args.email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentTab('home');
  };

  // ===== UNLOCK HANDLER ===== ✅ НОВАЯ ФУНКЦИЯ
  const handleUnlockPrompt = async (promptId: string): Promise<void> => {
    if (!user || user.coins < 1) {
      return;
    }

    try {
      const result = await mockService.unlockPrompt(promptId);
      setUser((prev) => {
        if (!prev) return prev;
        const nextIds = result.unlocked
          ? Array.from(new Set([...prev.unlockedPromptIds, promptId]))
          : prev.unlockedPromptIds;
        return {
          ...prev,
          coins: result.coinsLeft ?? prev.coins,
          unlockedPromptIds: nextIds,
        };
      });
    } catch (err) {
      console.error('Unlock error:', err);
      throw err;
    }
  };

  // ===== FILTERING =====
  const filteredPrompts = prompts
    .filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.description.toLowerCase().includes(filters.search.toLowerCase());
      const matchesModel = filters.model === 'All' || p.aiModel === filters.model;
      const matchesTrend = filters.onlyTrending ? p.isTrending : true;
      return matchesSearch && matchesModel && matchesTrend;
    })
    .sort((a, b) => {
      if (a.isTrending && !b.isTrending) return -1;
      if (!a.isTrending && b.isTrending) return 1;
      return b.ratingAvg - a.ratingAvg;
    });

  const libraryPrompts = user
    ? prompts.filter(p => user.unlockedPromptIds.includes(p.id))
    : [];

  const activeAd = useMemo(
    () => (currentTab === 'home' ? mockService.getRandomAd() : null),
    [currentTab]
  );

  // ===== SPLASH / LOADING =====
  if (showSplash || loading || authLoading) {
    return <SplashScreen />;
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-black">Missing configuration</h1>
          <p className="text-zinc-400 text-sm">
            Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to start the app.
          </p>
        </div>
      </div>
    );
  }

  // ===== LOGIN SCREEN =====
  if (!user) {
    return (
      <LoginModal
        allowClose={false}
        onClose={() => {}}
        onLogin={handleLogin}
        errorMessage={authError || undefined}
      />
    );
  }

  // ===== ADMIN PANEL =====
  if (currentTab === 'admin' && user.role === 'admin') {
    return (
      <AdminDashboard
        prompts={prompts}
        onRefresh={() => {}}
        onLogout={handleLogout}
        onBack={() => setCurrentTab('home')}
      />
    );
  }

  // ===== PROFILE =====
  if (currentTab === 'profile') {
    return (
      <>
        <ProfilePage
          user={user}
          unlockedPrompts={libraryPrompts}
          onLogout={handleLogout}
          onPromptClick={setActivePrompt}
          onGoHome={() => setCurrentTab('home')}
        />
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          userRole={user.role}
        />
      </>
    );
  }

  // ===== MAIN =====
  return (
    <div className="min-h-screen pb-24 bg-black text-white">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab('home')}>
            <Sparkles className="h-6 w-6 text-primary fill-current" />
            <span className="text-xl font-black">Promptify</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 border border-zinc-800">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm">{user.coins}</span>
            </div>
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`}
              alt="User avatar"
              className="h-8 w-8 rounded-full border border-zinc-800 cursor-pointer"
              onClick={() => setCurrentTab('profile')}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-black mb-6">
          {currentTab === 'library' ? 'Your Collection' : 'Explore Ideas'}
        </h2>

        {promptsError && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {promptsError}
          </div>
        )}

        {currentTab === 'home' && activeAd && <AdBanner ad={activeAd} />}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(currentTab === 'home' ? filteredPrompts : libraryPrompts).map(prompt => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              isUnlocked={user.unlockedPromptIds.includes(prompt.id)}
              onClick={() => setActivePrompt(prompt)}
            />
          ))}
        </div>

        {!filteredPrompts.length && currentTab === 'home' && (
          <NotFound
            onHome={() =>
              setFilters({
                model: 'All',
                onlyTrending: false,
                search: '',
                sort: 'rating'
              })
            }
          />
        )}
      </main>

      {/* ✅ ИСПРАВЛЕННЫЙ PromptModal */}
      {activePrompt && (
        <PromptModal
          prompt={activePrompt}
          user={user}
          isUnlocked={user.unlockedPromptIds.includes(activePrompt.id)}
          onClose={() => setActivePrompt(null)}
          onUnlock={handleUnlockPrompt}
        />
      )}

      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        userRole={user.role}
      />
    </div>
  );
};

export default App;
