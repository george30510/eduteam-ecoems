import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  school: string | null;
  grade: string | null;
  role: 'student' | 'admin';
  exams_purchased: number;
  exams_remaining: number;
  free_diagnostic_used: boolean;
  created_at: string;
}

export interface ExamRecord {
  id: string;
  user_id: string;
  exam_type: 'diagnostic' | 'simulation';
  exam_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  completed_at: string;
  subject_scores: Record<string, { correct: number; total: number }>;
}

export interface Question {
  id: string;
  materia: string;
  pregunta: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
  respuesta_correcta_original: string;
  imagen_url: string | null;
  explicacion: string | null;
  tipo_examen: string;
}
