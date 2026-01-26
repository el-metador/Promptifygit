import React, { useState, useEffect } from 'react';
import { Sparkles, Coins } from 'lucide-react';
import { Prompt, User, FilterState } from './types';
import { mockService } from './services/mockService';
import { supabase } from './services/supabaseClient';

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

  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    model: 'All',
    onlyTrending: false,
    search: '',
    sort: 'rating'
  });

  // ===== FETCH PROFILE FROM SUPABASE (WITH AUTO-CREATE) =====
  const fetchUserProfile = async (sbUser: any) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();

      if (profile) {
        console.log('✅ Profile loaded successfully');
        setUser({
          id: profile.id,
          name: profile.name || 'User',
          email: profile.email,
          avatar: profile.avatar_url || '',
          role: profile.role,
          coins: profile.coins,
          unlockedPromptIds: profile.unlocked_prompt_ids || []  // ✅ Загружаем из БД
        });
        return;
      }

      console.log(`⏳ Profile not found, attempt ${attempts + 1}/${maxAttempts}`);
      attempts++;
      
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // ✅ СОЗДАЕМ ПРОФИЛЬ ВРУЧНУЮ
    console.log('🔧 Creating profile manually...');
    
    const newProfile = {
      id: sbUser.id,
      email: sbUser.email || '',
      name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
      avatar_url: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || '',
      role: 'user',
      coins: 10,
      unlocked_prompt_ids: []  // ✅ Добавляем поле
    };

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert([newProfile])
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create profile:', createError);
      setUser({
        id: sbUser.id,
        name: newProfile.name,
        email: newProfile.email,
        avatar: newProfile.avatar_url,
        role: 'user',
        coins: 10,
        unlockedPromptIds: []
      });
      return;
    }

    console.log('✅ Profile created successfully!');
    setUser({
      id: created.id,
      name: created.name || 'User',
      email: created.email,
      avatar: created.avatar_url || '',
      role: created.role,
      coins: created.coins,
      unlockedPromptIds: created.unlocked_prompt_ids || []
    });
  };

  // ===== AUTH SESSION =====
  useEffect(() => {
    console.log('🔄 Checking auth session...');
    
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('📦 getSession result:', { 
        hasSession: !!data.session, 
        hasUser: !!data.session?.user,
        email: data.session?.user?.email,
        error 
      });
      
      if (data.session?.user) {
        fetchUserProfile(data.session.user);
      } else {
        console.log('❌ No session found');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state changed:', event, {
        hasSession: !!session,
        hasUser: !!session?.user,
        email: session?.user?.email
      });
      
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ===== INIT DATA =====
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);

    mockService
      .getPrompts()
      .then(data => setPrompts(data))
      .finally(() => setLoading(false));

    return () => clearTimeout(timer);
  }, []);

  // ===== AUTH HANDLERS =====
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentTab('home');
  };

  // ===== UNLOCK HANDLER ===== ✅ НОВАЯ ФУНКЦИЯ
  const handleUnlockPrompt = async (promptId: string): Promise<void> => {
    if (!user || user.coins < 1) {
      console.log('❌ Cannot unlock: no user or insufficient coins');
      return;
    }

    try {
      const newUnlockedIds = [...user.unlockedPromptIds, promptId];
      
      // Обновляем в Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ 
          coins: user.coins - 1,
          unlocked_prompt_ids: newUnlockedIds
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Failed to unlock prompt:', error);
        throw error;
      }

      // Обновляем локальное состояние
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          coins: prev.coins - 1,
          unlockedPromptIds: newUnlockedIds
        };
      });

      console.log('✅ Prompt unlocked:', promptId);
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

  // ===== SPLASH / LOADING =====
  if (showSplash || loading) {
    return <SplashScreen />;
  }

  // ===== LOGIN SCREEN =====
  if (!user) {
    return (
      <LoginModal
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
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
              src={user.avatar || '/avatar.png'}
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

        {currentTab === 'home' && mockService.getRandomAd() && (
          <AdBanner ad={mockService.getRandomAd()!} />
        )}

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
