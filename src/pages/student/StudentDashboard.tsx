import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface ExamHistory {
  id: string
  exam_type: string
  exam_number: number
  completed_at: string
  score: number
  total_questions: number
  percentage: number
}

interface SubjectAnalysis {
  subject: string
  total: number
  correctas: number
  percentage: number
}

export default function StudentDashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<any>(null)
  const [profileMissing, setProfileMissing] = useState(false)
  const [exams, setExams] = useState<ExamHistory[]>([])
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
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

    if (error || !profileData) {
      setProfile(null)
      setProfileMissing(true)
      setLoading(false)
      return
    }

    if (profileData.role === 'admin') {
      navigate('/admin')
      setLoading(false)
      return
    }

    setProfile(profileData)
    setProfileMissing(false)
    await loadExams(user.id)
    await loadSubjectAnalysis(user.id)
    setLoading(false)
  }

  const loadExams = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('generated_exams')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      setExams(data || [])
    } catch (error) {
      console.error('Error loading exams:', error)
    }
  }

  const loadSubjectAnalysis = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('student_answers')
        .select('subject, is_correct')
        .eq('student_id', userId)

      if (!data || data.length === 0) {
        setSubjectAnalysis([])
        return
      }

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

      const analysis: SubjectAnalysis[] = Object.entries(subjectMap).map(
        ([subject, stats]) => ({
          subject,
          total: stats.total,
          correctas: stats.correctas,
          percentage: Math.round((stats.correctas / stats.total) * 100),
        })
      )

      analysis.sort((a, b) => a.percentage - b.percentage)
      setSubjectAnalysis(analysis)
    } catch (error) {
      console.error('Error loading subject analysis:', error)
    }
  }

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // Calcular qué exámenes están disponibles
  const getAvailableExams = () => {
    const examsPurchased = profile?.exams_purchased || 0
    const examsRemaining = profile?.exams_remaining || 0
    
    return Array.from({ length: 6 }, (_, i) => {
      const examNumber = i + 1
      const completed = exams.find(e => e.exam_type === 'completo' && e.exam_number === examNumber)
      const canTake = examNumber <= examsPurchased && examsRemaining > 0
      const isLocked = examNumber > examsPurchased
      
      return {
        number: examNumber,
        completed,
        canTake,
        isLocked
      }
    })
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
            Cargando tu dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (profile?.role === 'admin') {
    return null
  }

  const availableExams = getAvailableExams()

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
            <img src="/logo-eduteam.png" alt="Eduteam" style={{ height: '42px' }} />
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
                Simulador ECOEMS
              </h1>
              <p style={{ color: colors.gray500, fontSize: '14px', margin: 0 }}>
                Tu preparación para el examen
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
              👋 {profile?.full_name ?? 'Bienvenido'}
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

      {profileMissing && (
        <div style={{
          margin: '24px auto',
          maxWidth: '1400px',
          padding: '20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.15))',
          border: '2px solid #F59E0B',
          display: 'flex',
          gap: '16px'
        }}>
          <div style={{ fontSize: '32px' }}>⚙️</div>
          <div>
            <h3 style={{ margin: 0, fontWeight: '700' }}>
              Estamos preparando tu perfil
            </h3>
            <p style={{ margin: 0 }}>
              Puedes comenzar tu diagnóstico mientras terminamos la configuración.
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>

        {/* BIENVENIDA */}
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '32px', margin: 0 }}>
            ¡Bienvenido, {profile?.full_name?.split(' ')[0] ?? 'Alumno'}! 👋
          </h2>
          <p style={{ color: colors.gray600, fontSize: '18px', marginTop: '8px' }}>
            Tienes <strong style={{ color: colors.primary }}>{profile?.exams_remaining ?? 0}</strong> exámenes disponibles
          </p>

          {/* DIAGNÓSTICO GRATIS */}
          {profile && !profile.free_diagnostic_used && (
            <button
              onClick={() => navigate('/exam/diagnostic')}
              style={{
                marginTop: '20px',
                padding: '18px 32px',
                borderRadius: '12px',
                background: gradients.success,
                color: 'white',
                border: 'none',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              🚀 Iniciar diagnóstico gratuito
            </button>
          )}
        </div>

        {/* 6 EXÁMENES ÚNICOS */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: colors.gray900
          }}>
            📝 Exámenes COMIPEMS
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {availableExams.map(exam => (
              <div
                key={exam.number}
                style={{
                  background: 'white',
                  padding: '28px',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: `2px solid ${
                    exam.completed ? colors.success :
                    exam.canTake ? colors.primary :
                    colors.gray200
                  }`,
                  transition: 'all 0.2s',
                  opacity: exam.isLocked ? 0.6 : 1
                }}
              >
                {/* Header del examen */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: colors.gray900,
                    margin: 0
                  }}>
                    Examen {exam.number}
                  </h3>
                  
                  {exam.completed && (
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: gradients.success,
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      ✓ Completado
                    </span>
                  )}
                  
                  {exam.isLocked && (
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: colors.gray200,
                      color: colors.gray600,
                      fontSize: '12px',
                      fontWeight: '700'
                    }}>
                      🔒 Bloqueado
                    </span>
                  )}
                </div>

                {/* Info del examen */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{
                    fontSize: '14px',
                    color: colors.gray600,
                    margin: '0 0 8px 0'
                  }}>
                    128 preguntas • 3 horas
                  </p>
                  
                  {exam.completed && (
                    <div>
                      <div style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: exam.completed.percentage >= 70 ? colors.success : colors.error,
                        marginBottom: '4px'
                      }}>
                        {exam.completed.percentage}%
                      </div>
                      <p style={{
                        fontSize: '13px',
                        color: colors.gray500,
                        margin: 0
                      }}>
                        {exam.completed.score}/{exam.completed.total_questions} correctas
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón de acción */}
                {exam.completed ? (
                  <button
                    onClick={() => navigate(`/results/${exam.completed.id}`)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: gradients.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Ver Resultados →
                  </button>
                ) : exam.canTake ? (
                  <button
                    onClick={() => navigate('/exam/complete')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: gradients.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      boxShadow: '0 4px 12px rgba(107, 141, 214, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(107, 141, 214, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 141, 214, 0.3)'
                    }}
                  >
                    🚀 Iniciar Examen
                  </button>
                ) : (
                  <div style={{
                    padding: '12px',
                    background: colors.gray100,
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: colors.gray600,
                    fontWeight: '600'
                  }}>
                    {exam.isLocked ? '🔒 Compra para desbloquear' : '⏳ No disponible'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BOTÓN COMPRAR cuando no tiene exámenes */}
        {profile && profile.exams_remaining === 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(232, 93, 154, 0.05) 0%, rgba(139, 111, 201, 0.05) 100%)',
            border: `2px dashed ${colors.primary}`,
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: colors.gray900,
              margin: '0 0 12px 0'
            }}>
              ¿Necesitas más exámenes?
            </h3>
            <p style={{
              fontSize: '15px',
              color: colors.gray600,
              margin: '0 0 24px 0',
              lineHeight: '1.6'
            }}>
              Adquiere 6 exámenes completos de 128 preguntas cada uno
              <br />
              <strong style={{ color: colors.primary }}>$150 MXN</strong> - Solo $25 MXN por examen
            </p>
            <button
              onClick={() => navigate('/purchase')}
              style={{
                padding: '16px 32px',
                background: gradients.primary,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '17px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(232, 93, 154, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(232, 93, 154, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(232, 93, 154, 0.3)'
              }}
            >
              🛒 Comprar Exámenes
            </button>
          </div>
        )}

        {/* RENDIMIENTO POR MATERIA */}
        {subjectAnalysis.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: colors.gray900
            }}>
              📈 Mi Rendimiento por Materia
            </h2>

            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {subjectAnalysis.map((subject) => (
                  <div
                    key={subject.subject}
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      background: colors.gray50,
                      border: `2px solid ${
                        subject.percentage >= 70 ? colors.success : colors.gray200
                      }`,
                      transition: 'all 0.2s'
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
                            fontWeight: '700',
                            whiteSpace: 'nowrap'
                          }}>
                            ⚠️ Enfócate aquí
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