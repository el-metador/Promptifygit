import React from 'react';
import { Home, Users, FolderOpen, User, Plus } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, userRole }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Feed' },
    { id: 'community', icon: Users, label: 'Chat', link: 'https://t.me/promptify_community' },
    { id: 'create', icon: Plus, label: 'Create', isSpecial: true },
    { id: 'library', icon: FolderOpen, label: 'Library' },
    { id: 'profile', icon: User, label: 'Me' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-[360px] mx-auto bg-[#09090b]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50 pointer-events-auto h-16 flex items-center justify-between px-2">
        {navItems.map((item) => {
            const isActive = currentTab === item.id;
            
            if (item.isSpecial) {
                return (
                    <button 
                        key={item.id}
                        onClick={() => userRole === 'admin' ? onTabChange('admin') : onTabChange('create_placeholder')}
                        className="group relative -top-6 mx-1"
                    >
                        <div className="absolute inset-0 bg-primary blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
                        <div className="relative bg-primary text-black h-14 w-14 rounded-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95 border-4 border-black group-hover:-translate-y-1">
                            <Plus className="w-6 h-6 stroke-[3]" />
                        </div>
                    </button>
                )
            }

            return (
              <button
                key={item.id}
                onClick={() => item.link ? window.open(item.link, '_blank') : onTabChange(item.id)}
                className={`flex flex-col items-center justify-center w-14 h-full rounded-full transition-all duration-200 ${isActive ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <item.icon className={`w-5 h-5 mb-0.5 ${isActive ? 'fill-current' : ''}`} strokeWidth={2} />
                <span className="text-[9px] font-medium tracking-wide">{item.label}</span>
                {isActive && <div className="absolute bottom-2 w-1 h-1 bg-primary rounded-full"></div>}
              </button>
            );
        })}
      </div>
    </div>
  );
};
