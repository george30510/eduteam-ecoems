import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface UserProfile {
  full_name: string
  email: string
  exams_remaining: number
  free_diagnostic_used: boolean
}

interface ExamHistory {
  id: string
  exam_type: string
  completed_at: string
  score: number
  total_questions: number
  percentage: number
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [exams, setExams] = useState<ExamHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
    loadExams()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('generated_exams')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      setExams(data || [])
    } catch (error) {
      console.error('Error loading exams:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
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

  if (!profile) {
    return <div>Error cargando perfil</div>
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)'
    }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src="/logo-eduteam.png"
              alt="Eduteam"
              style={{ height: '42px' }}
            />
            <div style={{
              width: '2px',
              height: '40px',
              background: colors.gray200
            }} />
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
              <p style={{ color: colors.gray500, margin: '2px 0 0 0', fontSize: '14px' }}>
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
              <p style={{
                fontSize: '13px',
                color: colors.gray600,
                margin: 0,
                fontWeight: '600'
              }}>
                👋 {profile.full_name}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '10px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.gray700
              }}
            >
              🚪 Salir
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Welcome Section */}
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          marginBottom: '32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          border: `1px solid ${colors.gray100}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: gradients.primary,
            borderRadius: '50%',
            opacity: 0.1
          }} />

          <div style={{ position: 'relative' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              margin: '0 0 12px 0',
              color: colors.gray900
            }}>
              ¡Bienvenido de vuelta, {profile.full_name.split(' ')[0]}! 👋
            </h2>
            <p style={{
              fontSize: '18px',
              color: colors.gray600,
              margin: 0
            }}>
              Continúa preparándote para el ECOEMS. Tienes{' '}
              <strong style={{ color: colors.primary }}>
                {profile.exams_remaining} exámenes disponibles
              </strong>
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Exámenes Disponibles */}
          <div style={{
            background: 'white',
            padding: '28px',
            borderRadius: '18px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: `1px solid ${colors.gray100}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  color: colors.gray600,
                  margin: 0,
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Exámenes Disponibles
                </p>
                <p style={{
                  fontSize: '42px',
                  fontWeight: 'bold',
                  margin: '12px 0 0 0',
                  background: gradients.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {profile.exams_remaining}
                </p>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: gradients.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                boxShadow: '0 8px 16px rgba(232, 93, 154, 0.3)'
              }}>
                📝
              </div>
            </div>
          </div>

          {/* Exámenes Completados */}
          <div style={{
            background: 'white',
            padding: '28px',
            borderRadius: '18px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: `1px solid ${colors.gray100}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  color: colors.gray600,
                  margin: 0,
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Completados
                </p>
                <p style={{
                  fontSize: '42px',
                  fontWeight: 'bold',
                  margin: '12px 0 0 0',
                  color: '#10B981'
                }}>
                  {exams.length}
                </p>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)'
              }}>
                ✅
              </div>
            </div>
          </div>

          {/* Promedio */}
          <div style={{
            background: 'white',
            padding: '28px',
            borderRadius: '18px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: `1px solid ${colors.gray100}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  color: colors.gray600,
                  margin: 0,
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Promedio
                </p>
                <p style={{
                  fontSize: '42px',
                  fontWeight: 'bold',
                  margin: '12px 0 0 0',
                  background: gradients.secondary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {exams.length > 0
                    ? Math.round(exams.reduce((acc, e) => acc + e.percentage, 0) / exams.length)
                    : 0}%
                </p>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: gradients.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                boxShadow: '0 8px 16px rgba(139, 111, 201, 0.3)'
              }}>
                📊
              </div>
            </div>
          </div>
        </div>

        {/* Exámenes Disponibles */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          border: `1px solid ${colors.gray100}`,
          overflow: 'hidden',
          marginBottom: '32px'
        }}>
          <div style={{
            padding: '28px 32px',
            borderBottom: `2px solid ${colors.gray100}`,
            background: 'linear-gradient(135deg, rgba(107, 141, 214, 0.05) 0%, rgba(52, 183, 200, 0.05) 100%)'
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '700',
              margin: 0,
              color: colors.gray900
            }}>
              🎯 Exámenes Disponibles
            </h2>
          </div>

          <div style={{ padding: '32px' }}>
            {/* Examen Diagnóstico */}
            {!profile.free_diagnostic_used && (
              <div style={{
                padding: '28px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)',
                border: '2px solid #10B981',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '20px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: '#10B981',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '700',
                      marginBottom: '12px'
                    }}>
                      🎁 GRATIS
                    </div>
                    <h3 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      margin: '0 0 8px 0',
                      color: colors.gray900
                    }}>
                      Examen Diagnóstico
                    </h3>
                    <p style={{
                      fontSize: '16px',
                      color: colors.gray600,
                      margin: '0 0 16px 0'
                    }}>
                      30 preguntas • 30 minutos • Identifica tu nivel actual
                    </p>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0
                    }}>
                      <li style={{ fontSize: '15px', color: colors.gray700, marginBottom: '8px' }}>
                        ✓ Evalúa las 10 áreas del ECOEMS
                      </li>
                      <li style={{ fontSize: '15px', color: colors.gray700, marginBottom: '8px' }}>
                        ✓ Resultados detallados por materia
                      </li>
                      <li style={{ fontSize: '15px', color: colors.gray700 }}>
                        ✓ Recomendaciones personalizadas
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => navigate('/exam/diagnostic')}
                    style={{
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    🚀 Iniciar Diagnóstico
                  </button>
                </div>
              </div>
            )}

            {/* Exámenes Completos */}
            <div style={{
              padding: '28px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(107, 141, 214, 0.08) 0%, rgba(139, 111, 201, 0.08) 100%)',
              border: `2px solid ${colors.primary}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: gradients.primary,
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '700',
                    marginBottom: '12px'
                  }}>
                    {profile.exams_remaining} DISPONIBLES
                  </div>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 8px 0',
                    color: colors.gray900
                  }}>
                    Exámenes Completos
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: colors.gray600,
                    margin: '0 0 16px 0'
                  }}>
                    128 preguntas • 3 horas • Simulación real del ECOEMS
                  </p>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    <li style={{ fontSize: '15px', color: colors.gray700, marginBottom: '8px' }}>
                      ✓ Estructura oficial del examen
                    </li>
                    <li style={{ fontSize: '15px', color: colors.gray700, marginBottom: '8px' }}>
                      ✓ Cronómetro y condiciones reales
                    </li>
                    <li style={{ fontSize: '15px', color: colors.gray700 }}>
                      ✓ Análisis detallado de resultados
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    if (profile.exams_remaining > 0) {
                      navigate('/exam/complete')
                    } else {
                      alert('Ya no tienes exámenes disponibles. Compra más para continuar.')
                    }
                  }}
                  disabled={profile.exams_remaining === 0}
                  style={{
                    padding: '16px 32px',
                    background: profile.exams_remaining > 0
                      ? gradients.primary
                      : colors.gray300,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: profile.exams_remaining > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: profile.exams_remaining > 0
                      ? '0 4px 12px rgba(232, 93, 154, 0.3)'
                      : 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (profile.exams_remaining > 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(232, 93, 154, 0.4)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (profile.exams_remaining > 0) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(232, 93, 154, 0.3)'
                    }
                  }}
                >
                  {profile.exams_remaining > 0 ? '📝 Iniciar Examen' : '🔒 Sin exámenes'}
                </button>
              </div>
            </div>

            {/* Comprar más */}
            {profile.exams_remaining === 0 && (
              <div style={{
                padding: '24px',
                borderRadius: '12px',
                background: colors.gray50,
                border: `2px dashed ${colors.gray300}`,
                textAlign: 'center',
                marginTop: '20px'
              }}>
                <p style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: colors.gray700,
                  margin: '0 0 16px 0'
                }}>
                  ¿Necesitas más exámenes?
                </p>
                <button
                  onClick={() => navigate('/purchase')}
                  style={{
                    padding: '14px 28px',
                    background: gradients.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(232, 93, 154, 0.3)'
                  }}
                >
                  🛒 Comprar Paquete de Exámenes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Historial */}
        {exams.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: `1px solid ${colors.gray100}`,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '28px 32px',
              borderBottom: `2px solid ${colors.gray100}`,
              background: 'linear-gradient(135deg, rgba(107, 141, 214, 0.05) 0%, rgba(52, 183, 200, 0.05) 100%)'
            }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '700',
                margin: 0,
                color: colors.gray900
              }}>
                📈 Historial de Exámenes
              </h2>
            </div>

            <div style={{ padding: '32px' }}>
              {exams.map((exam, index) => (
                <div
                  key={exam.id}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: colors.gray50,
                    marginBottom: index < exams.length - 1 ? '16px' : 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: '0 0 8px 0',
                      color: colors.gray900
                    }}>
                      {exam.exam_type === 'diagnostic' ? 'Examen Diagnóstico' : 'Examen Completo'}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: colors.gray600,
                      margin: 0
                    }}>
                      {new Date(exam.completed_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: 'bold',
                      background: exam.percentage >= 70
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : exam.percentage >= 50
                          ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                          : 'linear-gradient(135deg, #EF4444, #DC2626)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      margin: '0 0 4px 0'
                    }}>
                      {exam.percentage}%
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: colors.gray600
                    }}>
                      {exam.score}/{exam.total_questions} aciertos
                    </div>
                  </div>
                </div>
              ))}
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