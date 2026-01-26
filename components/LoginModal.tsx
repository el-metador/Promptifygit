import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (args: { provider: 'google' } | { provider: 'email'; email: string; password?: string }) => Promise<void>;
  allowClose?: boolean;
  errorMessage?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onLogin,
  allowClose = true,
  errorMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setFormError(null);
    try {
      await onLogin({ provider: 'email', email, password: password || undefined });
      if (allowClose) onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setFormError(null);
    try {
      await onLogin({ provider: 'google' });
      if (allowClose) onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-surface rounded-3xl border border-white/10 p-8 shadow-2xl relative">
        {allowClose && (
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
             <div className="w-6 h-6 bg-primary rounded-lg transform rotate-45"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-zinc-400 text-sm">Sign in to access your creative studio</p>
        </div>

        {/* GOOGLE BUTTON - Main CTA */}
        <Button 
            variant="google" 
            className="w-full mb-6 relative flex items-center justify-center gap-3 py-3" 
            onClick={handleGoogleLogin}
            disabled={isLoading}
        >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="font-medium">Continue with Google</span>
        </Button>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-surface px-3 text-zinc-500">Or use email</span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
             <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full h-11 rounded-xl border border-zinc-700 bg-black/50 px-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-zinc-600"
                required
             />
          </div>
          <div>
             <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-11 rounded-xl border border-zinc-700 bg-black/50 px-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-zinc-600"
             />
          </div>
          
          <Button type="submit" variant="secondary" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        {(formError || errorMessage) && (
          <p className="mt-4 text-center text-xs text-red-400">
            {formError || errorMessage}
          </p>
        )}
        
        <p className="mt-6 text-center text-xs text-zinc-600">
           New accounts receive <span className="text-primary font-bold">10 free coins</span> instantly.
        </p>
      </div>
    </div>
  );
};
