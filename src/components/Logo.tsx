import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizes = {
    xs: { icon: 16, text: 'text-sm', padding: 'p-1.5' },
    sm: { icon: 20, text: 'text-lg', padding: 'p-2' },
    md: { icon: 28, text: 'text-2xl', padding: 'p-2' },
    lg: { icon: 36, text: 'text-3xl', padding: 'p-2.5' },
  };

  return (
    <div 
      className={cn('flex items-center gap-2', className)} 
      role="img" 
      aria-label="EDUTEAM logo"
    >
      <div className={cn('gradient-primary rounded-xl', sizes[size].padding)}>
        <GraduationCap 
          className="text-primary-foreground" 
          size={sizes[size].icon} 
          aria-hidden="true" 
        />
      </div>
      <span className={cn('font-bold text-gradient', sizes[size].text)}>
        EDUTEAM
      </span>
    </div>
  );
};
