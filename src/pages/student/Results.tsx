import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { colors, gradients } from '../../styles/theme'

interface ResultsState {
  score: number
  total: number
  percentage: number
  examType: 'diagnostic' | 'complete'
}

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ResultsState

  if (!state) {
    navigate('/dashboard')
    return null
  }

  const { score, total, percentage, examType } = state

  const getGrade = () => {
    if (percentage >= 90) return { text: '¡Excelente!', emoji: '🌟', color: '#10B981' }
    if (percentage >= 80) return { text: 'Muy Bien', emoji: '🎉', color: '#10B981' }
    if (percentage >= 70) return { text: 'Bien', emoji: '👍', color: '#3B82F6' }
    if (percentage >= 60) return { text: 'Regular', emoji: '📚', color: '#F59E0B' }
    return { text: 'Necesitas Mejorar', emoji: '💪', color: '#EF4444' }
  }

  const grade = getGrade()

  const recommendations = [
    {
      subject: 'Matemáticas',
      percentage: 65,
      status: 'regular',
      advice: 'Refuerza álgebra y geometría básica'
    },
    {
      subject: 'Español',
      percentage: 80,
      status: 'good',
      advice: 'Continúa practicando comprensión lectora'
    },
    {
      subject: 'Historia',
      percentage: 55,
      status: 'low',
      advice: 'Repasa historia de México del siglo XX'
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header con Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <img
            src="/logo-eduteam.png"
            alt="Eduteam"
            style={{ height: '50px', marginBottom: '16px' }}
          />
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            background: gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            Resultados del Examen
          </h1>
        </div>

        {/* Resultado Principal */}
        <div style={{
          background: 'white',
          padding: '48px',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: `1px solid ${colors.gray100}`,
          textAlign: 'center',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '200px',
            height: '200px',
            background: gradients.primary,
            borderRadius: '50%',
            opacity: 0.08
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '160px',
            height: '160px',
            background: gradients.secondary,
            borderRadius: '50%',
            opacity: 0.08
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '80px',
              marginBottom: '16px'
            }}>
              {grade.emoji}
            </div>

            <h2 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              margin: '0 0 12px 0',
              color: grade.color
            }}>
              {grade.text}
            </h2>

            <p style={{
              fontSize: '18px',
              color: colors.gray600,
              margin: '0 0 32px 0'
            }}>
              Has completado el {examType === 'diagnostic' ? 'Examen Diagnóstico' : 'Examen Completo'}
            </p>

            {/* Score Circle */}
            <div style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: `conic-gradient(${grade.color} ${percentage * 3.6}deg, ${colors.gray100} 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 32px',
              position: 'relative'
            }}>
              <div style={{
                width: '170px',
                height: '170px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: grade.color
                }}>
                  {percentage}%
                </div>
                <div style={{
                  fontSize: '16px',
                  color: colors.gray600,
                  fontWeight: '600'
                }}>
                  {score}/{total} aciertos
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: colors.gray50
              }}>
                <p style={{
                  fontSize: '13px',
                  color: colors.gray600,
                  margin: '0 0 4px 0',
                  fontWeight: '600'
                }}>
                  Aciertos
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: 0,
                  color: '#10B981'
                }}>
                  {score}
                </p>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: colors.gray50
              }}>
                <p style={{
                  fontSize: '13px',
                  color: colors.gray600,
                  margin: '0 0 4px 0',
                  fontWeight: '600'
                }}>
                  Errores
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: 0,
                  color: '#EF4444'
                }}>
                  {total - score}
                </p>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: colors.gray50
              }}>
                <p style={{
                  fontSize: '13px',
                  color: colors.gray600,
                  margin: '0 0 4px 0',
                  fontWeight: '600'
                }}>
                  Preguntas
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: 0,
                  color: colors.gray700
                }}>
                  {total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Análisis por Materia (solo para diagnóstico) */}
        {examType === 'diagnostic' && (
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: `1px solid ${colors.gray100}`,
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '22px',
              fontWeight: '700',
              margin: '0 0 24px 0',
              color: colors.gray900
            }}>
              📊 Análisis por Materia
            </h3>

            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {recommendations.map((rec, index) => {
                const barColor = rec.status === 'good' ? '#10B981' :
                                rec.status === 'regular' ? '#F59E0B' : '#EF4444'

                return (
                  <div
                    key={index}
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      background: colors.gray50,
                      border: `1px solid ${colors.gray200}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: 0,
                        color: colors.gray900
                      }}>
                        {rec.subject}
                      </h4>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: barColor
                      }}>
                        {rec.percentage}%
                      </span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      background: colors.gray200,
                      overflow: 'hidden',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: `${rec.percentage}%`,
                        height: '100%',
                        background: barColor,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>

                    <p style={{
                      fontSize: '14px',
                      color: colors.gray600,
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      💡 {rec.advice}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recomendaciones */}
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          border: `1px solid ${colors.gray100}`,
          marginBottom: '32px'
        }}>
          <h3 style={{
            fontSize: '22px',
            fontWeight: '700',
            margin: '0 0 20px 0',
            color: colors.gray900
          }}>
            💡 Recomendaciones
          </h3>

          <div style={{
            background: 'linear-gradient(135deg, rgba(107, 141, 214, 0.08) 0%, rgba(52, 183, 200, 0.08) 100%)',
            padding: '24px',
            borderRadius: '12px',
            border: `2px solid ${colors.primary}`
          }}>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {percentage >= 80 ? (
                <>
                  <li style={{ fontSize: '15px', color: colors.gray700, marginBottom: '12px' }}>
                    ✓ Excelente dominio del contenido. Continúa practicando para mantener tu nivel.
                  </li>
                  <li style={{ fontSize: '15px', color: colors.gray700, marginBottom: '12px' }}>
                    ✓ Considera tomar exámenes completos para familiarizarte con el tiempo real.
                  </li>
                  <li style={{ fontSize: '15px', color: colors.gray700 }}>
                    ✓ Enfócate en las áreas donde tuviste menor puntaje para perfeccionar.
                  </li>
                </>
              ) : percentage >= 60 ? (
                <>
                  <li style={{ fontSize: '15px', color: colors.gray700, marginBottom: '12px' }}>
                    ✓ Buen progreso. Identifica tus áreas débiles y dedícales más tiempo de estudio.
                  </li>
                  <li style={{ fontSize: '15px', color: colors.gray700, marginBottom: '12px' }}>
                    ✓ Practica con más exámenes para mejorar tu velocidad de respuesta.
                  </li>
                  <li style={{ fontSize: '15px', color: colors.gray700 }}>
                    ✓ Consulta material de apoyo en las materias con menor puntaje.
                  </li>
                </>
              ) : (
                <>
                  <li style={{ fontSize: '15px', color: colors.gray700, marginBottom: '12px' }}>
                    ✓ Necesitas reforzar conceptos básicos. Considera tomar clases de apoyo.
                  </li>
                  <li style={{ fontSize: '15px', color: colors.gray700, marginBottom: '12px' }}>
                    ✓ Dedica al menos 2 horas diarias al estudio sistemático.
                  </li>
                  <li style={{ fontSize: '15px', color: colors.gray700 }}>
                    ✓ Enfócate primero en las materias con menor puntaje antes de tomar otro examen.
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          border: `1px solid ${colors.gray100}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '18px',
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
            🏠 Volver al Dashboard
          </button>

          {examType === 'diagnostic' && (
            <button
              onClick={() => navigate('/exam/complete')}
              style={{
                padding: '18px',
                background: 'white',
                color: colors.primary,
                border: `2px solid ${colors.primary}`,
                borderRadius: '12px',
                fontSize: '17px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = colors.primary
                e.currentTarget.style.color = 'white'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.color = colors.primary
              }}
            >
              📝 Tomar Examen Completo
            </button>
          )}

          <button
            onClick={() => window.print()}
            style={{
              padding: '14px',
              background: colors.gray50,
              color: colors.gray700,
              border: `2px solid ${colors.gray200}`,
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🖨️ Imprimir Resultados
          </button>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '24px',
          color: colors.gray600,
          fontSize: '14px'
        }}>
          <p style={{ margin: 0 }}>
            ¿Necesitas ayuda personalizada? Contáctanos para más información sobre cursos y asesorías.
          </p>
        </div>
      </div>
    </div>
  )
}