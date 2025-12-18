import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Clock, 
  Download, 
  RefreshCcw, 
  ArrowLeft,
  TrendingDown,
  Sparkles,
  BookOpen,
  Target,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useExamStore } from '@/store/examStore';
import confetti from 'canvas-confetti';

const Results = () => {
  const navigate = useNavigate();
  const { currentResult, startExam, clearCurrentResult } = useExamStore();

  // Confetti effect on load
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#667eea', '#764ba2', '#10b981', '#f59e0b'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  useEffect(() => {
    if (!currentResult) {
      navigate('/dashboard');
      return;
    }
    
    // Fire confetti on load
    const timer = setTimeout(() => {
      fireConfetti();
    }, 500);

    return () => clearTimeout(timer);
  }, [currentResult, navigate, fireConfetti]);

  if (!currentResult) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} ${hours > 1 ? 'horas' : 'hora'} ${minutes} ${minutes !== 1 ? 'minutos' : 'minuto'}`;
    }
    return `${minutes} ${minutes !== 1 ? 'minutos' : 'minuto'}`;
  };

  const chartData = Object.entries(currentResult.subjectScores)
    .map(([subject, data]) => ({
      subject,
      score: Math.round((data.correct / data.total) * 100),
      correct: data.correct,
      total: data.total,
    }))
    .sort((a, b) => b.score - a.score);

  // Get 3 weakest subjects
  const weakSubjects = [...chartData].sort((a, b) => a.score - b.score).slice(0, 3);

  const getBarColor = (percentage: number) => {
    if (percentage >= 70) return 'from-success to-success/70';
    if (percentage >= 50) return 'from-warning to-warning/70';
    return 'from-destructive to-destructive/70';
  };

  const getRecommendation = (subject: string, score: number) => {
    const tips: Record<string, string> = {
      'Habilidad verbal': 'Practica lectura de comprensión y análisis de textos. Identifica ideas principales y secundarias.',
      'Habilidad matemática': 'Resuelve problemas de razonamiento lógico. Practica series numéricas y operaciones básicas.',
      'Español': 'Repasa reglas ortográficas y gramaticales. Practica redacción y análisis sintáctico.',
      'Historia': 'Estudia líneas del tiempo y eventos clave. Relaciona causas y consecuencias históricas.',
      'Geografía': 'Repasa mapas, coordenadas y regiones naturales. Estudia fenómenos geográficos.',
      'Formación cívica y ética': 'Repasa derechos humanos y valores cívicos. Estudia la Constitución mexicana.',
      'Matemáticas': 'Practica álgebra, geometría y trigonometría. Resuelve ejercicios paso a paso.',
      'Física': 'Comprende las leyes fundamentales y sus aplicaciones. Practica resolución de problemas.',
      'Química': 'Estudia la tabla periódica y reacciones químicas. Practica balanceo de ecuaciones.',
      'Biología': 'Repasa sistemas del cuerpo humano y ecología. Estudia procesos celulares.',
    };
    return tips[subject] || 'Repasa los fundamentos y practica con ejercicios adicionales.';
  };

  const handleNewExam = () => {
    clearCurrentResult();
    startExam();
    navigate('/exam');
  };

  const handleGoToDashboard = () => {
    clearCurrentResult();
    navigate('/dashboard');
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) return '¡Excelente desempeño!';
    if (percentage >= 70) return '¡Muy buen trabajo!';
    if (percentage >= 60) return 'Resultado aprobatorio';
    if (percentage >= 50) return '¡Casi lo logras!';
    return 'Sigue practicando';
  };

  const getScoreEmoji = (percentage: number) => {
    if (percentage >= 80) return '🎉';
    if (percentage >= 70) return '👏';
    if (percentage >= 60) return '👍';
    if (percentage >= 50) return '💪';
    return '📚';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <Logo size="sm" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-shadow overflow-hidden">
              <div className="gradient-primary p-8 md:p-12 text-center relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                  <Sparkles className="absolute top-4 left-8 h-8 w-8 text-white/20 animate-pulse" />
                  <Sparkles className="absolute top-12 right-12 h-6 w-6 text-white/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <Sparkles className="absolute bottom-8 left-1/4 h-5 w-5 text-white/20 animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="w-28 h-28 mx-auto mb-6 bg-card rounded-full flex items-center justify-center shadow-lg"
                >
                  <Trophy className="h-14 w-14 text-primary" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground">
                    {currentResult.score}/{currentResult.totalQuestions}
                  </h1>
                  <p className="text-2xl md:text-3xl font-semibold text-primary-foreground/90">
                    correctas ({currentResult.percentage}%)
                  </p>
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-xl text-primary-foreground/80 mt-4"
                >
                  {getScoreEmoji(currentResult.percentage)} {getScoreMessage(currentResult.percentage)}
                </motion.p>
              </div>

              <CardContent className="p-6 bg-card">
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span className="text-lg">Tiempo empleado: <strong className="text-foreground">{formatTime(currentResult.timeSpent)}</strong></span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subject Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Resultados por Materia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {chartData.map((item, index) => (
                  <motion.div
                    key={item.subject}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.subject}</span>
                      <span className="text-muted-foreground">
                        {item.correct}/{item.total} ({item.score}%)
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ delay: 0.6 + index * 0.05, duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${getBarColor(item.score)}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="card-shadow border-l-4 border-l-warning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  Áreas de Oportunidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {weakSubjects.map((subject, index) => (
                  <motion.div
                    key={subject.subject}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="p-4 rounded-xl bg-muted/50 border border-border"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-warning" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground">{subject.subject}</h4>
                          <span className="text-sm font-bold text-destructive">{subject.score}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5 text-warning" />
                          {getRecommendation(subject.subject, subject.score)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Download className="h-5 w-5 mr-2" />
                Descargar resultados
              </Button>
              <Button variant="gradient" size="lg" onClick={handleNewExam} className="w-full sm:w-auto">
                <RefreshCcw className="h-5 w-5 mr-2" />
                Nuevo simulacro
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={handleGoToDashboard}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Results;