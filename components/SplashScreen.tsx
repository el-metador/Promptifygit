import React from 'react';
import { Sparkles } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary blur-[40px] opacity-20 animate-pulse"></div>
        <Sparkles className="h-20 w-20 text-primary animate-pulse" />
      </div>
      <h1 className="text-3xl font-black tracking-tight text-white mb-2">
        Promptify
      </h1>
      <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase">
        Loading Assets...
      </p>
      
      {/* Loading Bar */}
      <div className="mt-8 h-1 w-48 bg-zinc-900 rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite] w-full origin-left scale-x-0"></div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); transform-origin: right; opacity: 0;}
        }
      `}</style>
    </div>
  );
};