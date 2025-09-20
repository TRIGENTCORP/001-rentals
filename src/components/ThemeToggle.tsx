import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'default' | 'compact' | 'floating';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'default', 
  className 
}) => {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Switch to Dark';
      case 'dark':
        return 'Switch to Light';
      default:
        return 'Toggle Theme';
    }
  };

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          "bg-white/10 dark:bg-black/10 backdrop-blur-md",
          "border border-white/20 dark:border-white/10",
          "hover:bg-white/20 dark:hover:bg-black/20",
          "hover:scale-105 active:scale-95",
          "shadow-lg hover:shadow-xl",
          className
        )}
      >
        <div className="relative z-10 transition-transform duration-300">
          {getIcon()}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </Button>
    );
  }

  if (variant === 'floating') {
    return (
      <Button
        onClick={toggleTheme}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "h-14 w-14 rounded-full",
          "bg-white/10 dark:bg-black/10 backdrop-blur-xl",
          "border border-white/20 dark:border-white/10",
          "hover:bg-white/20 dark:hover:bg-black/20",
          "hover:scale-110 active:scale-95",
          "shadow-2xl hover:shadow-3xl",
          "transition-all duration-300 ease-out",
          "group",
          className
        )}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-sm group-hover:blur-md transition-all duration-300" />
          <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">
            {getIcon()}
          </div>
        </div>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={toggleTheme}
      className={cn(
        "relative overflow-hidden group",
        "bg-white/5 dark:bg-black/5 backdrop-blur-md",
        "border border-white/20 dark:border-white/10",
        "hover:bg-white/10 dark:hover:bg-black/10",
        "hover:border-white/30 dark:hover:border-white/20",
        "transition-all duration-300",
        "shadow-lg hover:shadow-xl",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
          {getIcon()}
        </div>
        <span className="relative z-10 font-medium">
          {getLabel()}
        </span>
      </div>
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000" />
    </Button>
  );
};

export default ThemeToggle;
