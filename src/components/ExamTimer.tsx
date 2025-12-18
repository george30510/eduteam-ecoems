import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ExamTimerProps {
  initialTime: number;
  onTimeUpdate: (remaining: number) => void;
  onTimeUp: () => void;
}

export const ExamTimer = ({ initialTime, onTimeUpdate, onTimeUp }: ExamTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        onTimeUpdate(newTime);
        
        if (newTime <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeUpdate, onTimeUp]);

  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  const isLowTime = timeRemaining < 30 * 60; // Less than 30 minutes
  const isCriticalTime = timeRemaining < 10 * 60; // Less than 10 minutes
  const isUrgentTime = timeRemaining < 5 * 60; // Less than 5 minutes

  return (
    <motion.div 
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${hours} hours, ${minutes} minutes, ${seconds} seconds`}
      animate={isUrgentTime ? { scale: [1, 1.02, 1] } : {}}
      transition={isUrgentTime ? { repeat: Infinity, duration: 1 } : {}}
      className={cn(
        'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-mono text-sm sm:text-lg font-semibold transition-all duration-300',
        isUrgentTime 
          ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30' 
          : isCriticalTime 
            ? 'bg-destructive/10 text-destructive' 
            : isLowTime 
              ? 'bg-warning/10 text-warning' 
              : 'bg-muted text-foreground'
      )}
    >
      <Clock className={cn(
        'h-4 w-4 sm:h-5 sm:w-5',
        isUrgentTime && 'animate-pulse'
      )} />
      <span className="tabular-nums">
        {String(hours).padStart(2, '0')}:
        {String(minutes).padStart(2, '0')}:
        {String(seconds).padStart(2, '0')}
      </span>
    </motion.div>
  );
};