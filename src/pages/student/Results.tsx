import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface Answer {
  question_number: number
  question_text: string
  subject: string
  student_answer: string | null
  correct_answer: string
  is_correct: boolean
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  explanation_text?: string
}

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()
  const { examId, score, total, percentage, examType } = location.state || {}
  
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [filterSubject, setFilterSubject] = useState<string>('all')

  useEffect(() => {
    if (examId) {
      loadAnswers()
    } else {
      setLoading(false)
    }
  }, [examId])

  const loadAnswers = async () => {
    try {
      const { data: exam } = await supabase
        .from('generated_exams')
        .select('questions_data')
        .eq('id', examId)
        .single()

      if (exam && exam.questions_data) {
        // Cargar explicaciones de las preguntas
        const questionIds = exam.questions_data
          .map((a: any) => a.question_id)
          .filter((id: string) => id && !id.startsWith('mock'))

        let explanations: any = {}
        
        if (questionIds.length > 0) {
          const { data: questionsData } = await supabase
            .from('question_bank')
            .select('id, explanation_text')
            .in('id', questionIds)

          if (questionsData) {
            explanations = questionsData.reduce((acc: any, q: any) => {
              acc[q.id] = q.explanation_text
              return acc
            }, {})
          }
        }

        // Combinar datos
        const answersWithExplanations = exam.questions_data.map((a: any) => ({
          ...a,
          explanation_text: explanations[a.question_id] || null
        }))

        setAnswers(answersWithExplanations)
      }
    } catch (error) {
      console.error('Error loading answers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!score && !total) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>No hay resultados para mostrar</h2>
        <button onClick={() => navigate('/dashboard')}>Volver al Dashboard</button>
      </div>
    )
  }

  const getGrade = () => {
    if (percentage >= 90) return { text: '¡Excelente!', color: '#10B981', emoji: '🌟' }
    if (percentage >= 70) return { text: 'Bien', color: '#F59E0B', emoji: '👍' }
    return { text: 'Necesitas mejorar', color: '#EF4444', emoji: '📚' }
  }

  const grade = getGrade()

  // Agrupar por materia
  const subjects = answers.reduce((acc: any, answer) => {
    if (!acc[answer.subject]) {
      acc[answer.subject] = { correct: 0, total: 0 }
    }
    acc[answer.subject].total++
    if (answer.is_correct) acc[answer.subject].correct++
    return acc
  }, {})

  const filteredAnswers = filterSubject === 'all' 
    ? answers 
    : answers.filter(a => a.subject === filterSubject)

  const incorrectAnswers = answers.filter(a => !a.is_correct)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header de Resultados */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '48px',
          marginBottom: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>
            {grade.emoji}
          </div>
          <h1 style={{
            fontSize: '40px',
            fontWeight: 'bold',
            margin: '0 0 16px 0',
            color: grade.color
          }}>
            {grade.text}
          </h1>
          <div style={{
            fontSize: '64px',
            fontWeight: 'bold',
            background: gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '24px'
          }}>
            {percentage}%
          </div>
          <p style={{
            fontSize: '24px',
            color: colors.gray600,
            margin: 0
          }}>
            {score} de {total} respuestas correctas
          </p>
        </div>

        {/* Resultados por Materia */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 24px 0',
            color: colors.gray900
          }}>
            📊 Resultados por Materia
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {Object.entries(subjects).map(([subject, stats]: [string, any]) => {
              const subjectPercentage = Math.round((stats.correct / stats.total) * 100)
              return (
                <div key={subject} style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: colors.gray50,
                  border: `2px solid ${colors.gray200}`
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    margin: '0 0 12px 0',
                    color: colors.gray900
                  }}>
                    {subject}
                  </h3>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: subjectPercentage >= 70 ? '#10B981' : '#EF4444',
                    marginBottom: '8px'
                  }}>
                    {subjectPercentage}%
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: colors.gray600,
                    margin: 0
                  }}>
                    {stats.correct} / {stats.total} correctas
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Toggle Ver Detalles */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: '16px 32px',
              background: showDetails ? colors.gray200 : gradients.primary,
              color: showDetails ? colors.gray700 : 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: showDetails ? 'none' : '0 4px 12px rgba(232, 93, 154, 0.3)'
            }}
          >
            {showDetails ? '✕ Ocultar Detalles' : '📝 Ver Respuestas Detalladas'}
          </button>
        </div>

        {/* Detalles de Respuestas */}
        {showDetails && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
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
                📋 Revisión Detallada
              </h2>

              {/* Filtro por Materia */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: `2px solid ${colors.gray200}`,
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Todas las materias</option>
                {Object.keys(subjects).map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Contador */}
            <p style={{
              fontSize: '15px',
              color: colors.gray600,
              marginBottom: '24px'
            }}>
              Mostrando {filteredAnswers.length} de {total} preguntas
            </p>

            {/* Lista de Preguntas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {filteredAnswers.map((answer, index) => (
                <div
                  key={index}
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    border: `3px solid ${answer.is_correct ? '#10B981' : '#EF4444'}`,
                    background: answer.is_correct 
                      ? 'rgba(16, 185, 129, 0.05)'
                      : 'rgba(239, 68, 68, 0.05)'
                  }}
                >
                  {/* Header de pregunta */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: gradients.primary,
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '700',
                        marginRight: '12px'
                      }}>
                        Pregunta {answer.question_number}
                      </span>
                      <span style={{
                        fontSize: '13px',
                        color: colors.gray600,
                        fontWeight: '600'
                      }}>
                        {answer.subject}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '28px'
                    }}>
                      {answer.is_correct ? '✅' : '❌'}
                    </div>
                  </div>

                  {/* Pregunta */}
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 20px 0',
                    color: colors.gray900,
                    lineHeight: '1.6'
                  }}>
                    {answer.question_text}
                  </h3>

                  {/* Opciones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['A', 'B', 'C', 'D'].map(opt => {
                      const isCorrect = opt === answer.correct_answer
                      const isStudentAnswer = opt === answer.student_answer
                      
                      let borderColor = colors.gray200
                      let backgroundColor = 'white'
                      
                      if (isCorrect) {
                        borderColor = '#10B981'
                        backgroundColor = 'rgba(16, 185, 129, 0.1)'
                      } else if (isStudentAnswer && !isCorrect) {
                        borderColor = '#EF4444'
                        backgroundColor = 'rgba(239, 68, 68, 0.1)'
                      }

                      return (
                        <div
                          key={opt}
                          style={{
                            padding: '16px',
                            borderRadius: '10px',
                            border: `2px solid ${borderColor}`,
                            background: backgroundColor,
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'start'
                          }}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isCorrect ? '#10B981' : (isStudentAnswer ? '#EF4444' : colors.gray200),
                            color: (isCorrect || isStudentAnswer) ? 'white' : colors.gray600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '14px',
                            flexShrink: 0
                          }}>
                            {opt}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              margin: 0,
                              fontSize: '15px',
                              color: colors.gray900,
                              lineHeight: '1.5'
                            }}>
                              {answer[`option_${opt.toLowerCase()}` as keyof Answer]}
                            </p>
                            {isCorrect && (
                              <p style={{
                                margin: '8px 0 0 0',
                                fontSize: '13px',
                                color: '#059669',
                                fontWeight: '600'
                              }}>
                                ✓ Respuesta correcta
                              </p>
                            )}
                            {isStudentAnswer && !isCorrect && (
                              <p style={{
                                margin: '8px 0 0 0',
                                fontSize: '13px',
                                color: '#DC2626',
                                fontWeight: '600'
                              }}>
                                ✗ Tu respuesta (incorrecta)
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Explicación */}
                  {answer.explanation_text && (
                    <div style={{
                      marginTop: '20px',
                      padding: '16px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(107, 141, 214, 0.08) 0%, rgba(52, 183, 200, 0.08) 100%)',
                      border: `2px solid ${colors.primary}`
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: colors.primary,
                        margin: '0 0 8px 0'
                      }}>
                        💡 Explicación:
                      </h4>
                      <p style={{
                        fontSize: '15px',
                        color: colors.gray700,
                        margin: 0,
                        lineHeight: '1.6'
                      }}>
                        {answer.explanation_text}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '16px 32px',
              background: gradients.primary,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(232, 93, 154, 0.3)'
            }}
          >
            🏠 Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}