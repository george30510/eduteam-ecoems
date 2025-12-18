import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flag, AlertTriangle, CheckCircle, Clock, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { QuestionCard } from '@/components/QuestionCard';
import { NavigationPalette } from '@/components/NavigationPalette';
import { ExamTimer } from '@/components/ExamTimer';
import { PageTransition } from '@/components/PageTransition';
import { useExamStore } from '@/store/examStore';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const Exam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [showNavigationMobile, setShowNavigationMobile] = useState(false);
  
  const {
    questions,
    currentQuestionIndex,
    answers,
    examTimeRemaining,
    setAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    finishExam,
    updateTimer,
  } = useExamStore();

  const currentQuestion = questions[currentQuestionIndex];
  const answeredQuestions = Object.keys(answers).map(Number);
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFinishDialog || showTimeUpDialog) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (!isFirstQuestion) prevQuestion();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!isLastQuestion) nextQuestion();
          break;
        case 'a':
        case 'A':
        case '1':
          e.preventDefault();
          setAnswer(currentQuestion.id, 'A');
          break;
        case 'b':
        case 'B':
        case '2':
          e.preventDefault();
          setAnswer(currentQuestion.id, 'B');
          break;
        case 'c':
        case 'C':
        case '3':
          e.preventDefault();
          setAnswer(currentQuestion.id, 'C');
          break;
        case 'd':
        case 'D':
        case '4':
          e.preventDefault();
          setAnswer(currentQuestion.id, 'D');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion.id, isFirstQuestion, isLastQuestion, nextQuestion, prevQuestion, setAnswer, showFinishDialog, showTimeUpDialog]);

  const handleTimeUp = useCallback(() => {
    setShowTimeUpDialog(true);
  }, []);

  const handleTimeUpConfirm = () => {
    finishExam();
    toast({
      title: "¡Se acabó el tiempo!",
      description: "Tu examen ha sido enviado automáticamente.",
      variant: "destructive",
    });
    navigate('/results');
  };

  const handleFinishExam = () => {
    finishExam();
    toast({
      title: "Examen completado",
      description: `Respondiste ${answeredQuestions.length} de ${questions.length} preguntas.`,
    });
    navigate('/results');
  };

  const handleSelectAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
    setAnswer(currentQuestion.id, answer);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Sticky Header */}
        <header className="bg-card border-b border-border sticky top-0 z-50" role="banner">
          <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
            <Logo size="sm" className="hidden sm:flex" />
            <Logo size="xs" className="flex sm:hidden" />
            
            <div 
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-muted-foreground"
              role="status"
              aria-label={`Pregunta ${currentQuestionIndex + 1} de ${questions.length}`}
            >
              <span className="hidden sm:inline">Pregunta</span>
              <span className="text-foreground font-bold text-base sm:text-lg">
                {currentQuestionIndex + 1}
              </span>
              <span>de</span>
              <span className="text-foreground font-bold text-base sm:text-lg">
                {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ExamTimer 
                initialTime={examTimeRemaining}
                onTimeUpdate={updateTimer}
                onTimeUp={handleTimeUp}
              />
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowFinishDialog(true)}
                className="hidden md:flex"
                aria-label="Finalizar examen"
              >
                <Flag className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => setShowFinishDialog(true)}
                    className="md:hidden h-9 w-9"
                    aria-label="Finalizar examen"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Finalizar examen</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Keyboard shortcut hint - Desktop only */}
        <div className="hidden lg:flex items-center justify-center gap-2 py-2 bg-muted/30 text-xs text-muted-foreground border-b border-border">
          <Keyboard className="h-3.5 w-3.5" />
          <span>Atajos: <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">←</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">→</kbd> navegar • <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">A</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">B</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">C</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">D</kbd> seleccionar</span>
        </div>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6" role="main">
          <div className="max-w-4xl mx-auto">
            {/* Subject Badge */}
            <motion.div 
              key={currentQuestion.subject}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4"
            >
              <span 
                className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium gradient-primary text-primary-foreground"
                role="note"
              >
                {currentQuestion.subject}
              </span>
            </motion.div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <QuestionCard
                key={currentQuestion.id}
                questionNumber={currentQuestion.id}
                text={currentQuestion.text}
                options={currentQuestion.options}
                selectedAnswer={answers[currentQuestion.id]}
                onSelectAnswer={handleSelectAnswer}
              />
            </AnimatePresence>
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="bg-card border-t border-border sticky bottom-0 z-40" role="navigation" aria-label="Navegación de preguntas">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={isFirstQuestion}
                  className="min-w-[100px] sm:min-w-[120px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Ir a la pregunta anterior"
                >
                  <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Ant.</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowNavigationMobile(!showNavigationMobile)}
                  className="sm:hidden"
                  aria-expanded={showNavigationMobile}
                  aria-label={`${answeredQuestions.length} de ${questions.length} preguntas respondidas. Toca para ver navegación`}
                >
                  {answeredQuestions.length}/{questions.length}
                </Button>

                {isLastQuestion ? (
                  <Button
                    variant="gradient"
                    onClick={() => setShowFinishDialog(true)}
                    className="min-w-[100px] sm:min-w-[120px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Finalizar y enviar examen"
                  >
                    <CheckCircle className="h-4 w-4 mr-1 sm:mr-2" />
                    Finalizar
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    onClick={nextQuestion}
                    className="min-w-[100px] sm:min-w-[120px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Ir a la siguiente pregunta"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
                  </Button>
                )}
              </div>

              {/* Navigation Palette - Desktop */}
              <div className="hidden sm:block">
                <NavigationPalette
                  totalQuestions={questions.length}
                  currentQuestion={currentQuestionIndex}
                  answeredQuestions={answeredQuestions}
                  onNavigate={goToQuestion}
                />
              </div>

              {/* Navigation Palette - Mobile */}
              <AnimatePresence>
                {showNavigationMobile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="sm:hidden overflow-hidden"
                  >
                    <NavigationPalette
                      totalQuestions={questions.length}
                      currentQuestion={currentQuestionIndex}
                      answeredQuestions={answeredQuestions}
                      onNavigate={(index) => {
                        goToQuestion(index);
                        setShowNavigationMobile(false);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </footer>

        {/* Finish Exam Dialog */}
        <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                ¿Estás seguro?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 sm:space-y-4 pt-2">
                  <div className="p-3 sm:p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-muted-foreground">Preguntas respondidas:</span>
                      <span className="font-bold text-foreground">{answeredQuestions.length}/{questions.length}</span>
                    </div>
                    {answeredQuestions.length < questions.length && (
                      <div className="flex justify-between items-center text-warning text-sm sm:text-base">
                        <span>Sin responder:</span>
                        <span className="font-bold">{questions.length - answeredQuestions.length} preguntas</span>
                      </div>
                    )}
                  </div>
                  
                  {examTimeRemaining > 0 && (
                    <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-primary/10 text-xs sm:text-sm">
                      <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-foreground">
                        Aún tienes <strong>{Math.floor(examTimeRemaining / 60)}</strong> minutos restantes.
                      </span>
                    </div>
                  )}
                  
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Una vez enviado, no podrás cambiar tus respuestas.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto">Continuar examen</AlertDialogCancel>
              <AlertDialogAction onClick={handleFinishExam} className="w-full sm:w-auto gradient-primary">
                <CheckCircle className="h-4 w-4 mr-2" />
                Enviar respuestas finales
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Time Up Dialog */}
        <AlertDialog open={showTimeUpDialog}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                ¡Se acabó el tiempo!
              </AlertDialogTitle>
              <AlertDialogDescription>
                El tiempo del examen ha expirado. Tus respuestas serán enviadas automáticamente.
                <span className="block mt-2">
                  Respondiste <strong>{answeredQuestions.length}</strong> de <strong>{questions.length}</strong> preguntas.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleTimeUpConfirm} className="w-full sm:w-auto gradient-primary">
                Ver resultados
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

export default Exam;