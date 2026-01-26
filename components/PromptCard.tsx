import React from 'react';
import { Lock, Zap, Image as ImageIcon } from 'lucide-react';
import { Prompt } from '../types';

interface PromptCardProps {
  prompt: Prompt;
  isUnlocked: boolean;
  onClick: () => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, isUnlocked, onClick }) => {
  // ✅ Защита от undefined/null значений
  const modelName = prompt.aiModel?.split(' ')[0] || 'AI';
  const imageUrl = prompt.imageUrl || 'https://placehold.co/400x600/1a1a1a/ffffff?text=No+Image';
  const title = prompt.title || 'Untitled';

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-highlight border border-white/5 cursor-pointer aspect-[9/16] transition-all duration-300 hover:border-white/20 hover:-translate-y-1"
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-zinc-900">
        <img 
          src={imageUrl} 
          alt={title} 
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          onError={(e) => {
            // ✅ Fallback если изображение не загрузилось
            (e.target as HTMLImageElement).src = 'https://placehold.co/400x600/1a1a1a/ffffff?text=No+Image';
          }}
        />
      </div>
      
      {/* Cinematic Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

      {/* Top Badges */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10">
        {prompt.isTrending && (
          <div className="flex items-center gap-1 rounded-md bg-primary/90 px-2 py-1 text-[10px] font-bold text-black uppercase tracking-wider shadow-lg shadow-black/20">
            <Zap className="h-3 w-3 fill-current" />
            Viral
          </div>
        )}
      </div>

      {/* Model Badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className="rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold text-white/90 border border-white/10 backdrop-blur-md">
          {modelName}
        </div>
      </div>

      {/* Unlock Status Icon (Only locked) */}
      {!isUnlocked && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="rounded-full bg-black/40 p-3 backdrop-blur-md border border-white/10">
            <Lock className="h-5 w-5 text-white" />
          </div>
        </div>
      )}

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex flex-col items-start text-left">
        <h3 className="text-lg font-bold text-white leading-snug mb-2 line-clamp-2">
          {title}
        </h3>
        
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
            <ImageIcon className="w-3 h-3" />
            <span>Prompt</span>
          </div>
           
          {/* Dynamic Status Text */}
          <div>
            {isUnlocked ? (
              <span className="text-[10px] font-bold text-primary tracking-wide">OWNED</span>
            ) : (
              <span className="text-[10px] font-bold text-white/80 bg-white/10 px-2 py-0.5 rounded border border-white/10">1 COIN</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Active State Ring */}
      <div className="absolute inset-0 border-2 border-primary/0 group-active:border-primary/50 rounded-2xl transition-colors duration-100 pointer-events-none" />
    </div>
  );
};
