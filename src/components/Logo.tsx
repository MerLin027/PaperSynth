import React from 'react';
import { cn } from '@/lib/utils';
import logo from '@/assets/papersynth-logo.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
  xl: 'h-32 w-32'
};

export const Logo: React.FC<LogoProps> = ({ className, size = 'lg' }) => {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <img 
        src={logo} 
        alt="PaperSynth Logo" 
        className={cn(
          sizeClasses[size],
          "object-contain electric-glow transition-all duration-300"
        )}
      />
      <span className="font-logo text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
        PaperSynth
      </span>
    </div>
  );
};