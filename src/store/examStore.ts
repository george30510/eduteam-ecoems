import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface Question {
  id: number;
  subject: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface ExamResult {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number;
  subjectScores: Record<string, { correct: number; total: number }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
}

interface ExamState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;

  // Exam
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  examStartTime: number | null;
  examTimeRemaining: number;
  isExamActive: boolean;
  
  // Results
  examHistory: ExamResult[];
  currentResult: ExamResult | null;

  // Actions
  startExam: () => void;
  setAnswer: (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishExam: () => Promise<void>;
  updateTimer: (remaining: number) => void;
  clearCurrentResult: () => void;
}

const SUBJECTS = [
  'Habilidad verbal',
  'Habilidad matemática', 
  'Español',
  'Historia',
  'Geografía',
  'Formación cívica y ética',
  'Matemáticas',
  'Física',
  'Química',
  'Biología'
];

const generateQuestions = (): Question[] => {
  const questions: Question[] = [];
  
  for (let i = 1; i <= 128; i++) {
    const subjectIndex = (i - 1) % SUBJECTS.length;
    questions.push({
      id: i,
      subject: SUBJECTS[subjectIndex],
      text: `Pregunta ${i}: En el contexto de ${SUBJECTS[subjectIndex]}, ¿cuál de las siguientes afirmaciones es correcta respecto al tema evaluado en esta sección del examen ECOEMS?`,
      options: {
        A: `Opción A: Primera alternativa relacionada con ${SUBJECTS[subjectIndex]} que presenta una posible respuesta al planteamiento.`,
        B: `Opción B: Segunda alternativa que ofrece otra perspectiva sobre el tema de ${SUBJECTS[subjectIndex]}.`,
        C: `Opción C: Tercera opción que considera un enfoque diferente para abordar la pregunta.`,
        D: `Opción D: Cuarta alternativa que completa las opciones de respuesta disponibles.`,
      },
      correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] as 'A' | 'B' | 'C' | 'D',
    });
  }
  
  return questions;
};

const EXAM_DURATION = 3 * 60 * 60; // 3 hours in seconds

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) {
            return { success: false, error: authError.message };
          }

          if (!authData.user) {
            return { success: false, error: 'No se pudo iniciar sesión' };
          }

          // Fetch user profile from user_profiles table
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          }

          const user: User = {
            id: authData.user.id,
            email: authData.user.email || email,
            name: profile?.full_name || authData.user.email?.split('@')[0] || 'Usuario',
            role: profile?.role || 'student',
          };

          set({
            user,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (error) {
          console.error('Login error:', error);
          return { success: false, error: 'Error al iniciar sesión' };
        }
      },
      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          isAuthenticated: false,
          isExamActive: false,
          answers: {},
          currentQuestionIndex: 0,
        });
      },
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      // Exam
      questions: generateQuestions(),
      currentQuestionIndex: 0,
      answers: {},
      examStartTime: null,
      examTimeRemaining: EXAM_DURATION,
      isExamActive: false,

      // Results
      examHistory: [],
      currentResult: null,

      // Actions
      startExam: () => {
        set({
          isExamActive: true,
          examStartTime: Date.now(),
          examTimeRemaining: EXAM_DURATION,
          answers: {},
          currentQuestionIndex: 0,
          questions: generateQuestions(),
        });
      },

      setAnswer: (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => {
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
        }));
      },

      goToQuestion: (index: number) => {
        const { questions } = get();
        if (index >= 0 && index < questions.length) {
          set({ currentQuestionIndex: index });
        }
      },

      nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex < questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      prevQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      finishExam: async () => {
        const { questions, answers, examStartTime, examTimeRemaining, user, examHistory } = get();
        
        const subjectScores: Record<string, { correct: number; total: number }> = {};
        let totalCorrect = 0;

        questions.forEach((q) => {
          if (!subjectScores[q.subject]) {
            subjectScores[q.subject] = { correct: 0, total: 0 };
          }
          subjectScores[q.subject].total++;
          
          if (answers[q.id] === q.correctAnswer) {
            totalCorrect++;
            subjectScores[q.subject].correct++;
          }
        });

        const timeSpent = examStartTime 
          ? Math.round((Date.now() - examStartTime) / 1000)
          : EXAM_DURATION - examTimeRemaining;

        const percentage = Math.round((totalCorrect / questions.length) * 100);

        const result: ExamResult = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          score: totalCorrect,
          totalQuestions: questions.length,
          percentage,
          timeSpent,
          subjectScores,
        };

        // Save to Supabase if user is logged in
        if (user?.id) {
          try {
            const examNumber = examHistory.length + 1;
            
            const { error } = await supabase.from('generated_exams').insert({
              user_id: user.id,
              exam_type: 'completo',
              exam_number: examNumber,
              score: totalCorrect,
              total_questions: questions.length,
              percentage,
              time_taken_seconds: timeSpent,
              completed_at: new Date().toISOString(),
              subject_scores: subjectScores,
              status: 'completed',
            });

            if (error) {
              console.error('Error saving exam to Supabase:', error);
            }
          } catch (error) {
            console.error('Error saving exam:', error);
          }
        }

        // Update local state (backward compatibility)
        set((state) => ({
          isExamActive: false,
          currentResult: result,
          examHistory: [result, ...state.examHistory].slice(0, 10),
        }));
      },

      updateTimer: (remaining: number) => {
        set({ examTimeRemaining: remaining });
      },

      clearCurrentResult: () => {
        set({ currentResult: null });
      },
    }),
    {
      name: 'eduteam-exam-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        examHistory: state.examHistory,
      }),
    }
  )
);
