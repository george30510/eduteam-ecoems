import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavigationPaletteProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: number[];
  onNavigate: (index: number) => void;
}

export const NavigationPalette = ({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onNavigate,
}: NavigationPaletteProps) => {
  return (
    <div className="bg-card rounded-xl p-3 sm:p-4 card-shadow" role="navigation" aria-label="Navegación de preguntas">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
          Navegación de Preguntas
        </h3>
        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full gradient-primary" aria-hidden="true" />
            <span className="text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-success" aria-hidden="true" />
            <span className="text-muted-foreground">Respondida</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-muted" aria-hidden="true" />
            <span className="text-muted-foreground">Sin responder</span>
          </div>
        </div>
      </div>
      
      <ScrollArea className="w-full max-h-[140px] sm:max-h-[200px]">
        <div 
          className="flex flex-wrap gap-1.5 sm:gap-2 pb-2" 
          role="listbox" 
          aria-label="Questions"
        >
          {Array.from({ length: totalQuestions }, (_, i) => {
            const questionNum = i + 1;
            const isAnswered = answeredQuestions.includes(questionNum);
            const isCurrent = currentQuestion === i;
            
            return (
              <motion.button
                key={i}
                onClick={() => onNavigate(i)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                role="option"
                aria-selected={isCurrent}
                aria-label={`Pregunta ${questionNum}${isAnswered ? ', respondida' : ', sin responder'}${isCurrent ? ', actual' : ''}`}
                className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200',
                  'flex items-center justify-center flex-shrink-0',
                  'shadow-sm hover:shadow-md',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
                  isCurrent 
                    ? 'gradient-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' 
                    : isAnswered 
                      ? 'bg-success text-success-foreground hover:bg-success/90' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {questionNum}
              </motion.button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
