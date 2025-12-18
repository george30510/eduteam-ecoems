import { motion } from 'framer-motion';
import { Circle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  questionNumber: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selectedAnswer?: 'A' | 'B' | 'C' | 'D';
  onSelectAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
}

const optionLabels = ['A', 'B', 'C', 'D'] as const;

export const QuestionCard = ({
  questionNumber,
  text,
  options,
  selectedAnswer,
  onSelectAnswer,
}: QuestionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6"
      role="group"
      aria-labelledby={`question-${questionNumber}`}
    >
      {/* Question */}
      <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 card-shadow">
        <p 
          id={`question-${questionNumber}`}
          className="text-foreground text-base sm:text-lg md:text-xl leading-relaxed"
        >
          <span className="font-bold text-primary">{questionNumber}.</span>{' '}
          {text}
        </p>
      </div>

      {/* Options */}
      <fieldset className="grid gap-2 sm:gap-3">
        <legend className="sr-only">Select an answer for question {questionNumber}</legend>
        {optionLabels.map((label) => {
          const isSelected = selectedAnswer === label;
          
          return (
            <motion.button
              key={label}
              onClick={() => onSelectAnswer(label)}
              whileHover={{ scale: 1.005, boxShadow: '0 8px 30px -10px hsl(var(--primary) / 0.2)' }}
              whileTap={{ scale: 0.995 }}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Option ${label}: ${options[label]}`}
              className={cn(
                'relative w-full p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 text-left',
                'transition-all duration-200 ease-out',
                'hover:shadow-lg',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
                isSelected 
                  ? 'border-primary bg-primary/10 shadow-md' 
                  : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Radio Button Style */}
                <div className="flex-shrink-0" aria-hidden="true">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/50" />
                  )}
                </div>
                
                {/* Option Label */}
                <span 
                  className={cn(
                    'flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm transition-all',
                    isSelected 
                      ? 'gradient-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  )}
                  aria-hidden="true"
                >
                  {label}
                </span>
                
                {/* Option Text */}
                <span className={cn(
                  'text-sm sm:text-base md:text-lg transition-colors flex-1',
                  isSelected ? 'text-foreground font-medium' : 'text-foreground/80'
                )}>
                  {options[label]}
                </span>
              </div>
            </motion.button>
          );
        })}
      </fieldset>
    </motion.div>
  );
};
