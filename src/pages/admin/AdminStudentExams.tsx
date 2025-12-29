import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface Exam {
  id: string
  exam_type: string
  completed_at: string
  time_taken_seconds: number
  score: number
  total_questions: number
  percentage: number
  status: string
}

interface StudentInfo {
  full_name: string
  email: string
  school: string
  grade: string
}

export default function AdminStudentExams() {
  const navigate = useNavigate()
  const { studentId } = useParams<{ studentId: string }>()
  
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [studentId])

  const loadData = async () => {
    try {
      // Cargar info del estudiante
      const { data: studentData, error: studentError } = await supabase
        .from('user_profiles')
        .select('full_name, email, school, grade')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      // Cargar exámenes del estudiante
      const { data: examsData, error: examsError } = await supabase
        .from('generated_exams')
        .select('*')
        .eq('user_id', studentId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      if (examsError) throw examsError
      setExams(examsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error al cargar información del estudiante')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getExamTypeName = (type: string) => {
    return type === 'diagnostico' ? '📋 Diagnóstico' : '📝 Completo'
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981'
    if (percentage >= 60) return '#F59E0B'
    return '#EF4444'
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid rgba(107, 141, 214, 0.2)',
            borderTop: `4px solid ${colors.primary}`,
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }} />
          <p style={{ color: colors.gray600, fontSize: '18px', fontWeight: '500' }}>
            Cargando información...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: `2px solid ${colors.gray100}`,
        padding: '20px 40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              background: gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 4px 0'
            }}>
              📊 Historial de Exámenes
            </h1>
            <p style={{ color: colors.gray600, margin: 0, fontSize: '14px' }}>
              {student?.full_name} • {student?.school} • {student?.grade}
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/students')}
            style={{
              padding: '12px 24px',
              border: `2px solid ${colors.gray200}`,
              borderRadius: '12px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              color: colors.gray700,
              transition: 'all 0.2s'
            }}
          >
            ← Volver a Estudiantes
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray100}`
          }}>
            <p style={{ fontSize: '14px', color: colors.gray600, margin: '0 0 8px 0', fontWeight: '600' }}>
              Total Exámenes
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: colors.primary }}>
              {exams.length}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray100}`
          }}>
            <p style={{ fontSize: '14px', color: colors.gray600, margin: '0 0 8px 0', fontWeight: '600' }}>
              Promedio General
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#10B981' }}>
              {exams.length > 0 
                ? Math.round(exams.reduce((sum, e) => sum + e.percentage, 0) / exams.length)
                : 0}%
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray100}`
          }}>
            <p style={{ fontSize: '14px', color: colors.gray600, margin: '0 0 8px 0', fontWeight: '600' }}>
              Diagnósticos
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#F59E0B' }}>
              {exams.filter(e => e.exam_type === 'diagnostico').length}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray100}`
          }}>
            <p style={{ fontSize: '14px', color: colors.gray600, margin: '0 0 8px 0', fontWeight: '600' }}>
              Completos
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#8B6FC9' }}>
              {exams.filter(e => e.exam_type === 'completo').length}
            </p>
          </div>
        </div>

        {/* Exams List */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: `1px solid ${colors.gray100}`,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px 28px',
            borderBottom: `2px solid ${colors.gray100}`
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
              📝 Exámenes Realizados ({exams.length})
            </h2>
          </div>

          {exams.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
              <p style={{ color: colors.gray600, fontSize: '18px' }}>
                Este estudiante aún no ha realizado ningún examen
              </p>
            </div>
          ) : (
            <div>
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  style={{
                    padding: '24px 28px',
                    borderBottom: `1px solid ${colors.gray100}`,
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/admin/exam-result/${exam.id}`)}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(107, 141, 214, 0.02)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '700',
                          background: exam.exam_type === 'diagnostico' 
                            ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                            : 'linear-gradient(135deg, #8B6FC9 0%, #E85D9A 100%)',
                          color: 'white'
                        }}>
                          {getExamTypeName(exam.exam_type)}
                        </span>

                        <span style={{
                          fontSize: '14px',
                          color: colors.gray600
                        }}>
                          {formatDate(exam.completed_at)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
                        <div>
                          <p style={{ fontSize: '12px', color: colors.gray500, margin: '0 0 4px 0' }}>
                            Calificación
                          </p>
                          <p style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            margin: 0,
                            color: getGradeColor(exam.percentage)
                          }}>
                            {exam.percentage}%
                          </p>
                        </div>

                        <div>
                          <p style={{ fontSize: '12px', color: colors.gray500, margin: '0 0 4px 0' }}>
                            Aciertos
                          </p>
                          <p style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: colors.gray700 }}>
                            {exam.score}/{exam.total_questions}
                          </p>
                        </div>

                        <div>
                          <p style={{ fontSize: '12px', color: colors.gray500, margin: '0 0 4px 0' }}>
                            Tiempo
                          </p>
                          <p style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: colors.gray700 }}>
                            {formatTime(exam.time_taken_seconds)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '12px 20px',
                      background: gradients.primary,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      Ver Detalles →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}