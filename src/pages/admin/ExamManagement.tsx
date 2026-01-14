import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface ExamConfig {
  id: string
  exam_number: number
  exam_name: string
  available_from: string
  total_questions: number
  is_active: boolean
}

interface ExamStats {
  exam_number: number
  approved: number
  pending: number
  rejected: number
  total: number
}

export default function ExamManagement() {
  const navigate = useNavigate()
  const [exams, setExams] = useState<ExamConfig[]>([])
  const [stats, setStats] = useState<ExamStats[]>([])
  const [loading, setLoading] = useState(true)
  const [editingExam, setEditingExam] = useState<ExamConfig | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/')
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      navigate('/dashboard')
      return
    }

    await loadExams()
    await loadStats()
    setLoading(false)
  }

  const loadExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_configs')
        .select('*')
        .order('exam_number', { ascending: true })

      if (error) throw error
      setExams(data || [])
    } catch (error) {
      console.error('Error loading exams:', error)
    }
  }

  const loadStats = async () => {
    try {
      // Obtener conteo de preguntas por examen y estado
      const { data, error } = await supabase
        .from('question_bank')
        .select('exam_assignment, status')

      if (error) throw error

      const statsMap: { [key: number]: ExamStats } = {}

      // Inicializar stats para los 6 exámenes
      for (let i = 1; i <= 6; i++) {
        statsMap[i] = {
          exam_number: i,
          approved: 0,
          pending: 0,
          rejected: 0,
          total: 0
        }
      }

      // Contar preguntas
      data?.forEach((q: any) => {
        if (!q.exam_assignment) return
        
        // Extraer número del formato "examen_1", "examen_2", etc
        const match = q.exam_assignment.match(/examen_(\d+)/)
        if (!match) return
        
        const examNum = parseInt(match[1])
        if (examNum < 1 || examNum > 6) return

        if (!statsMap[examNum]) {
          statsMap[examNum] = {
            exam_number: examNum,
            approved: 0,
            pending: 0,
            rejected: 0,
            total: 0
          }
        }

        statsMap[examNum].total++
        
        if (q.status === 'approved') statsMap[examNum].approved++
        else if (q.status === 'pending') statsMap[examNum].pending++
        else if (q.status === 'rejected') statsMap[examNum].rejected++
      })

      setStats(Object.values(statsMap))
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleEditExam = (exam: ExamConfig) => {
    setEditingExam({ ...exam })
    setShowEditModal(true)
  }

  const handleSaveExam = async () => {
    if (!editingExam) return

    try {
      const { error } = await supabase
        .from('exam_configs')
        .update({
          exam_name: editingExam.exam_name,
          available_from: editingExam.available_from,
          is_active: editingExam.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingExam.id)

      if (error) throw error

      alert('✅ Examen actualizado correctamente')
      setShowEditModal(false)
      setEditingExam(null)
      await loadExams()
    } catch (error: any) {
      console.error('Error updating exam:', error)
      alert(`❌ Error: ${error.message}`)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const isDatePassed = (dateString: string) => {
    const examDate = new Date(dateString)
    const now = new Date()
    return now >= examDate
  }

  const getDaysUntil = (dateString: string) => {
    const examDate = new Date(dateString)
    const now = new Date()
    const diff = examDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const getExamStats = (examNumber: number) => {
    return stats.find(s => s.exam_number === examNumber) || {
      exam_number: examNumber,
      approved: 0,
      pending: 0,
      rejected: 0,
      total: 0
    }
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
          <p style={{ color: colors.gray600 }}>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              color: colors.gray900
            }}>
              📝 Gestión de Exámenes
            </h1>
            <p style={{
              fontSize: '16px',
              color: colors.gray600,
              margin: 0
            }}>
              Configura fechas y asigna reactivos a cada examen
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/admin/questions')}
              style={{
                padding: '14px 24px',
                background: gradients.primary,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(232, 93, 154, 0.3)'
              }}
            >
              📚 Banco de Reactivos
            </button>
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '14px 24px',
                background: 'white',
                color: colors.gray700,
                border: `2px solid ${colors.gray200}`,
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Grid de Exámenes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {exams.map(exam => {
            const examStats = getExamStats(exam.exam_number)
            const isPassed = isDatePassed(exam.available_from)
            const daysUntil = getDaysUntil(exam.available_from)
            const progress = examStats.total > 0 
              ? Math.round((examStats.approved / 128) * 100)
              : 0

            return (
              <div
                key={exam.id}
                style={{
                  background: 'white',
                  padding: '32px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `2px solid ${
                    examStats.approved >= 128 ? colors.success :
                    examStats.total > 0 ? colors.warning :
                    colors.gray200
                  }`,
                  transition: 'all 0.2s'
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '20px'
                }}>
                  <div>
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      margin: '0 0 4px 0',
                      color: colors.gray900
                    }}>
                      {exam.exam_name}
                    </h2>
                    <p style={{
                      fontSize: '14px',
                      color: colors.gray600,
                      margin: 0
                    }}>
                      Examen #{exam.exam_number}
                    </p>
                  </div>

                  {examStats.approved >= 128 && (
                    <span style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      background: gradients.success,
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '700'
                    }}>
                      ✓ Completo
                    </span>
                  )}
                </div>

                {/* Fecha */}
                <div style={{
                  padding: '16px',
                  background: isPassed 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <p style={{
                    fontSize: '13px',
                    color: colors.gray600,
                    margin: '0 0 6px 0',
                    fontWeight: '600'
                  }}>
                    {isPassed ? '✓ Habilitado desde:' : '📅 Se habilita:'}
                  </p>
                  <p style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: isPassed ? colors.success : colors.warning,
                    margin: 0
                  }}>
                    {formatDate(exam.available_from)}
                  </p>
                  {!isPassed && daysUntil > 0 && (
                    <p style={{
                      fontSize: '13px',
                      color: colors.gray600,
                      margin: '6px 0 0 0'
                    }}>
                      Faltan {daysUntil} días
                    </p>
                  )}
                </div>

                {/* Estadísticas de Reactivos */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '12px'
                  }}>
                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: colors.gray900,
                      margin: 0
                    }}>
                      Reactivos
                    </h3>
                    <span style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: examStats.approved >= 128 ? colors.success : colors.gray700
                    }}>
                      {examStats.approved}/128
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div style={{
                    width: '100%',
                    height: '12px',
                    background: colors.gray200,
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: examStats.approved >= 128 
                        ? gradients.success 
                        : gradients.warning,
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>

                  {/* Desglose */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                  }}>
                    <div style={{
                      padding: '12px',
                      background: colors.gray50,
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: colors.success,
                        marginBottom: '4px'
                      }}>
                        {examStats.approved}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: colors.gray600,
                        fontWeight: '600'
                      }}>
                        Aprobados
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: colors.gray50,
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: colors.warning,
                        marginBottom: '4px'
                      }}>
                        {examStats.pending}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: colors.gray600,
                        fontWeight: '600'
                      }}>
                        Pendientes
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: colors.gray50,
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: colors.error,
                        marginBottom: '4px'
                      }}>
                        {examStats.rejected}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: colors.gray600,
                        fontWeight: '600'
                      }}>
                        Rechazados
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div style={{
                  display: 'flex',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => handleEditExam(exam)}
                    style={{
                      flex: 1,
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
                    ⚙️ Configurar
                  </button>

                  <button
                    onClick={() => navigate(`/admin/questions?exam=${exam.exam_number}`)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'white',
                      color: colors.gray700,
                      border: `2px solid ${colors.gray300}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary
                      e.currentTarget.style.color = colors.primary
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.gray300
                      e.currentTarget.style.color = colors.gray700
                    }}
                  >
                    Ver Reactivos →
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Resumen Global */}
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 24px 0',
            color: colors.gray900
          }}>
            📊 Resumen Global
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
              borderRadius: '16px',
              border: `2px solid ${colors.success}`
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: colors.success,
                marginBottom: '8px'
              }}>
                {stats.reduce((sum, s) => sum + s.approved, 0)}
              </div>
              <div style={{
                fontSize: '14px',
                color: colors.gray700,
                fontWeight: '600'
              }}>
                Total Aprobados
              </div>
            </div>

            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))',
              borderRadius: '16px',
              border: `2px solid ${colors.warning}`
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: colors.warning,
                marginBottom: '8px'
              }}>
                {stats.reduce((sum, s) => sum + s.pending, 0)}
              </div>
              <div style={{
                fontSize: '14px',
                color: colors.gray700,
                fontWeight: '600'
              }}>
                Total Pendientes
              </div>
            </div>

            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(107, 141, 214, 0.1), rgba(52, 183, 200, 0.1))',
              borderRadius: '16px',
              border: `2px solid ${colors.primary}`
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: '8px'
              }}>
                {Math.round((stats.reduce((sum, s) => sum + s.approved, 0) / 768) * 100)}%
              </div>
              <div style={{
                fontSize: '14px',
                color: colors.gray700,
                fontWeight: '600'
              }}>
                Progreso Total (768)
              </div>
            </div>

            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
              borderRadius: '16px',
              border: `2px solid ${colors.error}`
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: colors.error,
                marginBottom: '8px'
              }}>
                {768 - stats.reduce((sum, s) => sum + s.total, 0)}
              </div>
              <div style={{
                fontSize: '14px',
                color: colors.gray700,
                fontWeight: '600'
              }}>
                Faltantes
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Editar Examen */}
      {showEditModal && editingExam && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '40px',
              borderRadius: '24px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0 0 24px 0',
              color: colors.gray900
            }}>
              ⚙️ Configurar Examen {editingExam.exam_number}
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '14px',
                color: colors.gray700
              }}>
                Nombre del Examen
              </label>
              <input
                type="text"
                value={editingExam.exam_name}
                onChange={(e) => setEditingExam({ ...editingExam, exam_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: `2px solid ${colors.gray200}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '14px',
                color: colors.gray700
              }}>
                Fecha de Habilitación
              </label>
              <input
                type="date"
                value={editingExam.available_from}
                onChange={(e) => setEditingExam({ ...editingExam, available_from: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: `2px solid ${colors.gray200}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{
                fontSize: '13px',
                color: colors.gray500,
                margin: '8px 0 0 0'
              }}>
                💡 Esta fecha aplica para TODOS los estudiantes
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px'
            }}>
              <button
                onClick={handleSaveExam}
                style={{
                  flex: 1,
                  padding: '16px',
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
                ✓ Guardar Cambios
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '16px 24px',
                  background: colors.gray100,
                  color: colors.gray700,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}