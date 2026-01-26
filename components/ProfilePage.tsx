import React from 'react';
import { User, Prompt } from '../types';
import { Button } from './Button';
import { Settings, Coins, LogOut, Grid } from 'lucide-react';
import { PromptCard } from './PromptCard';

interface ProfilePageProps {
  user: User;
  unlockedPrompts: Prompt[];
  onLogout: () => void;
  onPromptClick: (prompt: Prompt) => void;
  onGoHome: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  unlockedPrompts,
  onLogout,
  onPromptClick,
  onGoHome,
}) => {
  const avatarUrl =
    user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`;
  const handleName = user.email ? user.email.split('@')[0] : 'user';

  return (
    <div className="min-h-screen bg-black text-white pb-24 animate-fade-in">
        {/* Header Cover */}
        <div className="h-32 bg-gradient-to-b from-zinc-800 to-black relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>

        <div className="px-4 -mt-16 relative">
            {/* Avatar & Actions */}
            <div className="flex justify-between items-end mb-4">
                <div className="relative">
                    <img 
                        src={avatarUrl} 
                        alt={user.name} 
                        className="w-24 h-24 rounded-full border-4 border-black bg-zinc-800 object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full border border-black">
                        PRO
                    </div>
                </div>
                <div className="flex gap-2 mb-2">
                    <button className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button onClick={onLogout} className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Name & Bio */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <p className="text-zinc-500 text-sm">@{handleName} • Creator</p>
            </div>

            {/* Stats Card */}
            <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white">{unlockedPrompts.length}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Collection</span>
                </div>
                <div className="flex-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 opacity-20">
                        <Coins className="w-8 h-8 rotate-12" />
                    </div>
                    <span className="text-xl font-bold text-primary">{user.coins}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Coins</span>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="border-b border-zinc-800 mb-6 flex gap-8">
                <button className="pb-3 border-b-2 border-primary text-white font-medium text-sm flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    Collection
                </button>
                <button className="pb-3 border-b-2 border-transparent text-zinc-500 font-medium text-sm">
                    Likes
                </button>
            </div>

            {/* Grid */}
            {unlockedPrompts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {unlockedPrompts.map(prompt => (
                        <PromptCard 
                            key={prompt.id} 
                            prompt={prompt} 
                            isUnlocked={true} 
                            onClick={() => onPromptClick(prompt)} 
                        />
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center text-zinc-500 flex flex-col items-center">
                    <Grid className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">No prompts unlocked yet.</p>
                    <Button variant="neon" size="sm" className="mt-4" onClick={onGoHome}>
                      Explore Feed
                    </Button>
                </div>
            )}
        </div>
    </div>
  );
};
