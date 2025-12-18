import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Trophy, 
  Target, 
  BookOpen, 
  Clock, 
  TrendingUp,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useExamStore } from '@/store/examStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, examHistory, startExam } = useExamStore();

  const handleStartExam = () => {
    startExam();
    navigate('/exam');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Calculate stats
  const totalExams = examHistory.length;
  const averageScore = totalExams > 0 
    ? Math.round(examHistory.reduce((acc, e) => acc + e.percentage, 0) / totalExams)
    : 0;
  const topicsCount = 10;

  // Prepare chart data from last exam or mock data
  const lastExam = examHistory[0];
  const chartData = lastExam 
    ? Object.entries(lastExam.subjectScores).map(([subject, data]) => ({
        subject: subject.substring(0, 10),
        score: Math.round((data.correct / data.total) * 100),
      }))
    : [
        { subject: 'Hab. verbal', score: 0 },
        { subject: 'Hab. mat.', score: 0 },
        { subject: 'Español', score: 0 },
        { subject: 'Historia', score: 0 },
        { subject: 'Geografía', score: 0 },
      ];

  const stats = [
    { icon: Trophy, label: 'Exámenes Realizados', value: totalExams, color: 'text-warning' },
    { icon: Target, label: 'Promedio General', value: `${averageScore}%`, color: 'text-success' },
    { icon: BookOpen, label: 'Materias Cubiertas', value: topicsCount, color: 'text-primary' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants} className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              ¡Hola, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground">
              Continúa tu preparación para el ECOEMS
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="card-shadow card-shadow-hover">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Start Exam Button */}
          <motion.div variants={itemVariants}>
            <Card className="card-shadow overflow-hidden">
              <div className="gradient-primary p-8 text-center">
                <h2 className="text-2xl font-bold text-primary-foreground mb-2">
                  ¿Listo para practicar?
                </h2>
                <p className="text-primary-foreground/80 mb-6">
                  Simula un examen completo de 128 preguntas en 3 horas
                </p>
                <Button 
                  onClick={handleStartExam}
                  size="xl"
                  className="bg-card text-foreground hover:bg-card/90 shadow-xl"
                >
                  <Play className="h-5 w-5 mr-2" />
                  INICIAR NUEVO SIMULACRO
                </Button>
              </div>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Progress Chart */}
            <motion.div variants={itemVariants}>
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Progreso por Materia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totalExams > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="subject" type="category" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.score >= 70 ? 'hsl(var(--success))' : entry.score >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <p>Realiza tu primer examen para ver tu progreso</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Exams */}
            <motion.div variants={itemVariants}>
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Historial de Exámenes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {examHistory.length > 0 ? (
                    <div className="space-y-3">
                      {examHistory.slice(0, 5).map((exam, index) => (
                        <div 
                          key={exam.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              exam.percentage >= 70 ? 'bg-success' : 
                              exam.percentage >= 50 ? 'bg-warning' : 'bg-destructive'
                            }`} />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Examen #{examHistory.length - index}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(exam.date).toLocaleDateString('es-MX', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${
                              exam.percentage >= 70 ? 'text-success' : 
                              exam.percentage >= 50 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {exam.percentage}%
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <p>No hay exámenes anteriores</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
