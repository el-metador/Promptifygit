import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'google' | 'neon';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  size = 'md',
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-primary text-black hover:bg-primary-dark shadow-[0_0_15px_-3px_rgba(217,255,0,0.3)] hover:shadow-[0_0_20px_-3px_rgba(217,255,0,0.5)]",
    neon: "bg-transparent border border-primary text-primary hover:bg-primary hover:text-black shadow-[0_0_10px_rgba(217,255,0,0.2)]",
    secondary: "bg-surface-highlight text-white hover:bg-zinc-800 border border-white/10",
    outline: "border border-white/10 bg-transparent hover:bg-white/5 text-zinc-300 hover:text-white hover:border-white/20",
    ghost: "hover:bg-white/5 text-zinc-400 hover:text-white",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20",
    google: "bg-white text-black hover:bg-zinc-200 border border-zinc-200",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-14 px-8 text-base",
    xl: "h-16 px-10 text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};
