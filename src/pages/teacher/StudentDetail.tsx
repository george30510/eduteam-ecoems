import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface StudentProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  school: string | null
  grade: string | null
  exams_purchased: number
  exams_remaining: number
  free_diagnostic_used: boolean
  created_at: string
}

interface ExamHistory {
  id: string
  exam_type: string
  exam_number: number
  completed_at: string
  score: number
  total_questions: number
  percentage: number
  time_taken_seconds: number
}

interface SubjectAnalysis {
  subject: string
  total: number
  correctas: number
  percentage: number
}

export default function StudentDetail() {
  const navigate = useNavigate()
  const { studentId } = useParams()

  const [teacherProfile, setTeacherProfile] = useState<any>(null)
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [exams, setExams] = useState<ExamHistory[]>([])
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [showExamDetails, setShowExamDetails] = useState(false)

  /* =============================
     AUTH + PROFILE
  ============================== */
  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      navigate('/')
      return
    }

    const user = session.user

    const { data: profileData, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !profileData || profileData.role !== 'profesor') {
      navigate('/dashboard')
      return
    }

    setTeacherProfile(profileData)
    
    if (studentId) {
      await loadStudentData(studentId)
      await loadExams(studentId)
      await loadSubjectAnalysis(studentId)
    }
    
    setLoading(false)
  }

  /* =============================
     LOAD STUDENT DATA
  ============================== */
  const loadStudentData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'student')
        .single()

      if (error || !data) {
        console.error('Error loading student:', error)
        return
      }

      setStudent(data)
    } catch (error) {
      console.error('Error loading student data:', error)
    }
  }

  /* =============================
     LOAD EXAMS
  ============================== */
  const loadExams = async (id: string) => {
    try {
      const { data } = await supabase
        .from('generated_exams')
        .select('*')
        .eq('user_id', id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      setExams(data || [])
    } catch (error) {
      console.error('Error loading exams:', error)
    }
  }

  /* =============================
     LOAD SUBJECT ANALYSIS
  ============================== */
  const loadSubjectAnalysis = async (id: string) => {
    try {
      const { data } = await supabase
        .from('student_answers')
        .select('subject, is_correct')
        .eq('student_id', id)

      if (!data || data.length === 0) {
        setSubjectAnalysis([])
        return
      }

      // Agrupar por materia
      const subjectMap: { [key: string]: { total: number; correctas: number } } = {}

      data.forEach((answer) => {
        const subject = answer.subject
        if (!subjectMap[subject]) {
          subjectMap[subject] = { total: 0, correctas: 0 }
        }
        subjectMap[subject].total++
        if (answer.is_correct) {
          subjectMap[subject].correctas++
        }
      })

      // Convertir a array
      const analysis: SubjectAnalysis[] = Object.entries(subjectMap).map(
        ([subject, stats]) => ({
          subject,
          total: stats.total,
          correctas: stats.correctas,
          percentage: Math.round((stats.correctas / stats.total) * 100),
        })
      )

      // Ordenar por porcentaje ascendente
      analysis.sort((a, b) => a.percentage - b.percentage)

      setSubjectAnalysis(analysis)
    } catch (error) {
      console.error('Error loading subject analysis:', error)
    }
  }

  /* =============================
     CALCULATE STATS
  ============================== */
  const calculateStats = () => {
    if (exams.length === 0) {
      return {
        avgScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalTime: 0,
        avgTime: 0,
        approvalRate: 0
      }
    }

    const totalScore = exams.reduce((sum, exam) => sum + exam.percentage, 0)
    const avgScore = Math.round(totalScore / exams.length)
    const bestScore = Math.max(...exams.map(e => e.percentage))
    const worstScore = Math.min(...exams.map(e => e.percentage))
    const totalTime = exams.reduce((sum, exam) => sum + (exam.time_taken_seconds || 0), 0)
    const avgTime = Math.round(totalTime / exams.length)
    const approvedExams = exams.filter(e => e.percentage >= 70).length
    const approvalRate = Math.round((approvedExams / exams.length) * 100)

    return { avgScore, bestScore, worstScore, totalTime, avgTime, approvalRate }
  }

  /* =============================
     FORMAT TIME
  ============================== */
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  /* =============================
     FORMAT DATE
  ============================== */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return date.toLocaleDateString('es-MX', options)
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
    return date.toLocaleDateString('es-MX', options)
  }

  /* =============================
     LOGOUT
  ============================== */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  /* =============================
     LOADING
  ============================== */
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
            Cargando detalles del estudiante...
          </p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          background: 'white',
          padding: '48px',
          borderRadius: '24px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.gray900, marginBottom: '12px' }}>
            Estudiante no encontrado
          </h2>
          <p style={{ fontSize: '16px', color: colors.gray600, marginBottom: '32px' }}>
            No se pudo cargar la información de este estudiante.
          </p>
          <button
            onClick={() => navigate('/teacher')}
            style={{
              padding: '16px 32px',
              background: gradients.primary,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ← Volver al Panel
          </button>
        </div>
      </div>
    )
  }

  const stats = calculateStats()

  /* =============================
     UI
  ============================== */
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)' }}>

      {/* HEADER */}
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
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/teacher')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: `2px solid ${colors.gray200}`,
                background: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Volver
            </button>
            <div style={{ width: '2px', height: '40px', background: colors.gray200 }} />
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                background: gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                Detalle del Estudiante
              </h1>
              <p style={{ color: colors.gray500, fontSize: '14px', margin: 0 }}>
                {student.full_name}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: colors.gray50,
              border: `1px solid ${colors.gray200}`
            }}>
              👨‍🏫 {teacherProfile?.full_name ?? 'Profesor'}
            </div>
            <button onClick={handleLogout} style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: `2px solid ${colors.gray200}`,
              background: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              🚪 Salir
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>

        {/* INFORMACIÓN DEL ESTUDIANTE */}
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: colors.gray900,
                marginBottom: '16px'
              }}>
                {student.full_name}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📧</span>
                  <span style={{ color: colors.gray600 }}>{student.email}</span>
                </div>
                
                {student.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📱</span>
                    <span style={{ color: colors.gray600 }}>{student.phone}</span>
                  </div>
                )}
                
                {student.school && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🏫</span>
                    <span style={{ color: colors.gray600 }}>{student.school}</span>
                  </div>
                )}
                
                {student.grade && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📚</span>
                    <span style={{ color: colors.gray600 }}>{student.grade}</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📅</span>
                  <span style={{ color: colors.gray500, fontSize: '14px' }}>
                    Registrado el {formatDateShort(student.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minWidth: '200px'
            }}>
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: colors.gray50,
                border: `2px solid ${colors.gray200}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: colors.gray600, marginBottom: '4px' }}>
                  Exámenes disponibles
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                  {student.exams_remaining}
                </div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: colors.gray50,
                border: `2px solid ${colors.gray200}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: colors.gray600, marginBottom: '4px' }}>
                  Exámenes adquiridos
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.secondary }}>
                  {student.exams_purchased}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ESTADÍSTICAS GENERALES */}
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '24px',
            color: colors.gray900
          }}>
            📊 Estadísticas de Rendimiento
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {/* Total Exámenes */}
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: colors.gray50,
              border: `2px solid ${colors.gray200}`
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
              <div style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: '4px'
              }}>
                {exams.length}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray600 }}>
                Exámenes realizados
              </div>
            </div>

            {/* Promedio */}
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: colors.gray50,
              border: `2px solid ${colors.gray200}`
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
              <div style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: stats.avgScore >= 70 ? colors.success : colors.error,
                marginBottom: '4px'
              }}>
                {stats.avgScore}%
              </div>
              <div style={{ fontSize: '14px', color: colors.gray600 }}>
                Promedio general
              </div>
            </div>

            {/* Mejor Score */}
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: colors.gray50,
              border: `2px solid ${colors.gray200}`
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌟</div>
              <div style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: colors.success,
                marginBottom: '4px'
              }}>
                {stats.bestScore}%
              </div>
              <div style={{ fontSize: '14px', color: colors.gray600 }}>
                Mejor calificación
              </div>
            </div>

            {/* Peor Score */}
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: colors.gray50,
              border: `2px solid ${colors.gray200}`
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📉</div>
              <div style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: colors.error,
                marginBottom: '4px'
              }}>
                {stats.worstScore}%
              </div>
              <div style={{ fontSize: '14px', color: colors.gray600 }}>
                Calificación más baja
              </div>
            </div>

            {/* Tasa de Aprobación */}
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: colors.gray50,
              border: `2px solid ${colors.gray200}`
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
              <div style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: stats.approvalRate >= 70 ? colors.success : colors.warning,
                marginBottom: '4px'
              }}>
                {stats.approvalRate}%
              </div>
              <div style={{ fontSize: '14px', color: colors.gray600 }}>
                Tasa de aprobación
              </div>
            </div>

            {/* Tiempo Promedio */}
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: colors.gray50,
              border: `2px solid ${colors.gray200}`
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏱️</div>
              <div style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: colors.accent,
                marginBottom: '4px'
              }}>
                {formatTime(stats.avgTime)}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray600 }}>
                Tiempo promedio
              </div>
            </div>
          </div>
        </div>

        {/* RENDIMIENTO POR MATERIA */}
        {subjectAnalysis.length > 0 && (
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
              color: colors.gray900
            }}>
              📚 Rendimiento por Materia
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {subjectAnalysis.map((subject) => (
                <div
                  key={subject.subject}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: colors.gray50,
                    border: `2px solid ${subject.percentage >= 70 ? colors.success : colors.gray200}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: colors.gray900,
                      margin: 0
                    }}>
                      {subject.subject}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: subject.percentage >= 70 ? colors.success : colors.error
                      }}>
                        {subject.percentage}%
                      </span>
                      {subject.percentage < 70 && (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: gradients.warning,
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}>
                          ⚠️ Requiere refuerzo
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    width: '100%',
                    height: '12px',
                    background: colors.gray200,
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: `${subject.percentage}%`,
                      height: '100%',
                      background: subject.percentage >= 70 ? gradients.success : gradients.error,
                      transition: 'width 0.5s ease-out',
                      borderRadius: '6px'
                    }} />
                  </div>

                  <p style={{
                    fontSize: '14px',
                    color: colors.gray600,
                    margin: 0
                  }}>
                    {subject.correctas} de {subject.total} preguntas correctas
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORIAL DE EXÁMENES */}
        {exams.length > 0 && (
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
                color: colors.gray900
              }}>
                📋 Historial de Exámenes
              </h2>

              <button
                onClick={() => setShowExamDetails(!showExamDetails)}
                style={{
                  padding: '10px 20px',
                  background: showExamDetails ? colors.gray200 : gradients.primary,
                  color: showExamDetails ? colors.gray700 : 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {showExamDetails ? 'Ocultar Detalles' : 'Ver Detalles'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: colors.gray50,
                    border: `2px solid ${exam.percentage >= 70 ? colors.success : colors.error}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        marginBottom: '8px',
                        color: colors.gray900
                      }}>
                        {exam.exam_type === 'diagnostico'
                          ? '🎯 Diagnóstico Gratuito'
                          : `📝 Examen Completo #${exam.exam_number}`}
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '16px',
                        marginBottom: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          fontSize: '32px',
                          fontWeight: 'bold',
                          color: exam.percentage >= 70 ? colors.success : colors.error
                        }}>
                          {exam.percentage}%
                        </span>
                        <span style={{
                          fontSize: '16px',
                          color: colors.gray600,
                          fontWeight: '500'
                        }}>
                          {exam.score}/{exam.total_questions} correctas
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: colors.gray500
                        }}>
                          ⏱️ {formatTime(exam.time_taken_seconds || 0)}
                        </span>
                      </div>

                      <p style={{
                        fontSize: '13px',
                        color: colors.gray500,
                        margin: 0
                      }}>
                        📅 {formatDate(exam.completed_at)}
                      </p>
                    </div>

                    {showExamDetails && (
                      <button
                        onClick={() => navigate(`/results/${exam.id}`)}
                        style={{
                          padding: '10px 20px',
                          background: gradients.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Ver Respuestas
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIN EXÁMENES */}
        {exams.length === 0 && (
          <div style={{
            background: 'white',
            padding: '60px 40px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: colors.gray700,
              marginBottom: '8px'
            }}>
              Sin exámenes completados
            </h3>
            <p style={{ color: colors.gray500, fontSize: '16px' }}>
              Este estudiante aún no ha completado ningún examen.
            </p>
          </div>
        )}

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