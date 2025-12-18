import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  School, 
  GraduationCap,
  Calendar,
  Clock,
  Trophy,
  FileText,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import { useExamStore } from '@/store/examStore';
import { supabase, UserProfile } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface ExamRecord {
  id: string;
  exam_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  completed_at: string;
  subject_scores: Record<string, { correct: number; total: number }>;
}

const AdminStudentDetail = () => {
  const { user, logout } = useExamStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [student, setStudent] = useState<UserProfile | null>(null);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStudentData();
    }
  }, [id]);

  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      // Fetch student profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setStudent(profileData);
      }

      // Fetch student exams
      const { data: examsData, error: examsError } = await supabase
        .from('generated_exams')
        .select('*')
        .eq('user_id', id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true });

      if (examsError) {
        console.error('Error fetching exams:', examsError);
      } else {
        setExams(examsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Prepare chart data for subject performance (last exam)
  const getSubjectChartData = () => {
    if (exams.length === 0) return [];
    const lastExam = exams[exams.length - 1];
    if (!lastExam.subject_scores) return [];

    return Object.entries(lastExam.subject_scores).map(([subject, scores]) => ({
      subject: subject.length > 12 ? subject.slice(0, 12) + '...' : subject,
      fullSubject: subject,
      percentage: scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0,
    }));
  };

  // Prepare chart data for progress over time
  const getProgressChartData = () => {
    return exams.map((exam, index) => ({
      exam: `Examen ${index + 1}`,
      percentage: exam.percentage,
    }));
  };

  // Calculate circular progress
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-muted"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={getScoreColor(percentage)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${getScoreColor(percentage)}`}>
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Estudiante no encontrado</p>
          <Button onClick={() => navigate('/admin')}>Volver al panel</Button>
        </div>
      </div>
    );
  }

  const subjectChartData = getSubjectChartData();
  const progressChartData = getProgressChartData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              Panel Admin
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80">{user?.email}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al panel
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Student Profile Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="text-center pb-2">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-2xl">
                    {getInitials(student.full_name)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{student.full_name}</CardTitle>
                <Badge 
                  variant="secondary" 
                  className="mt-2 bg-purple-100 text-purple-700"
                >
                  {student.role === 'admin' ? 'Administrador' : 'Estudiante'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{student.email}</span>
                </div>
                {student.phone && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{student.phone}</span>
                  </div>
                )}
                {student.school && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <School className="h-4 w-4" />
                    <span className="text-sm">{student.school}</span>
                  </div>
                )}
                {student.grade && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-sm">{student.grade}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exámenes restantes:</span>
                    <span className="font-semibold">{student.exams_remaining}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Exámenes comprados:</span>
                    <span className="font-semibold">{student.exams_purchased}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Resumen de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exams.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Este estudiante aún no ha completado ningún examen.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">{exams.length}</p>
                      <p className="text-sm text-muted-foreground">Exámenes</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-3xl font-bold text-indigo-600">
                        {Math.round(exams.reduce((acc, e) => acc + e.percentage, 0) / exams.length)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Promedio</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">
                        {Math.max(...exams.map(e => e.percentage))}%
                      </p>
                      <p className="text-sm text-muted-foreground">Mejor</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-3xl font-bold text-orange-600">
                        {exams[exams.length - 1]?.percentage || 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Último</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          {exams.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Subject Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rendimiento por Materia (Último Examen)</CardTitle>
                </CardHeader>
                <CardContent>
                  {subjectChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={subjectChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          type="category" 
                          dataKey="subject" 
                          width={100}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value}%`, 'Porcentaje']}
                          labelFormatter={(label) => {
                            const item = subjectChartData.find(d => d.subject === label);
                            return item?.fullSubject || label;
                          }}
                        />
                        <Bar 
                          dataKey="percentage" 
                          fill="url(#colorGradient)"
                          radius={[0, 4, 4, 0]}
                        />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#9333ea" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No hay datos de materias disponibles.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Progress Over Time Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progreso en el Tiempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Porcentaje']} />
                      <Line 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#9333ea" 
                        strokeWidth={3}
                        dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, fill: '#9333ea' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Exam History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historial de Exámenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exams.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No hay exámenes completados aún.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exams.map((exam, index) => (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-2 hover:border-purple-300 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500">
                              Examen {index + 1}
                            </Badge>
                            <CircularProgress percentage={exam.percentage} />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(exam.completed_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Trophy className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {exam.score}/{exam.total_questions} correctas
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{formatTime(exam.time_taken_seconds)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminStudentDetail;
