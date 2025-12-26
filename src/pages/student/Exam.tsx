import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface Question {
  id: string
  subject: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
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
]

export default function Exam() {
  const navigate = useNavigate()
  const { type } = useParams<{ type: 'diagnostic' | 'complete' }>()
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [examStarted, setExamStarted] = useState(false)
  const [showOverview, setShowOverview] = useState(false)

  const isDiagnostic = type === 'diagnostic'
  const totalQuestions = isDiagnostic ? 10 : 10
  const totalMinutes = isDiagnostic ? 30 : 180

  useEffect(() => {
    loadQuestions()
  }, [type])

  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleFinish()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [examStarted, timeLeft])

  const loadQuestions = async () => {
    try {
      // Intentar cargar desde DB
      const { data, error } = await supabase
        .from('question_bank')
        .select('*')
        .eq('status', 'approved')
        .eq('active', true)
        .order('subject', { ascending: true })
        .limit(totalQuestions)

      if (error) throw error

      // Si hay suficientes preguntas, usarlas; si no, generar mock
      if (data && data.length >= totalQuestions) {
        console.log(`Loaded ${data.length} questions from database`)
        setQuestions(data)
      } else {
        console.log(`Only ${data?.length || 0} in DB, generating mock`)
        const mockQuestions = generateMockQuestions(totalQuestions)
        setQuestions(mockQuestions)
      }

      setTimeLeft(totalMinutes * 60)
    } catch (error) {
      console.error('Error loading questions:', error)
      const mockQuestions = generateMockQuestions(totalQuestions)
      setQuestions(mockQuestions)
      setTimeLeft(totalMinutes * 60)
    } finally {
      setLoading(false)
    }
  }

  const generateMockQuestions = (count: number): Question[] => {
    const questionsPerSubject = Math.ceil(count / SUBJECTS.length)
    const allQuestions: Question[] = []
    
    SUBJECTS.forEach((subject) => {
      for (let i = 0; i < questionsPerSubject && allQuestions.length < count; i++) {
        allQuestions.push({
          id: `mock-${allQuestions.length + 1}`,
          subject: subject,
          question_text: `Pregunta ${allQuestions.length + 1} de ${subject}. ¿Cuál de las siguientes opciones es la correcta?`,
          option_a: 'Opción A - Primera alternativa de respuesta',
          option_b: 'Opción B - Segunda alternativa de respuesta',
          option_c: 'Opción C - Tercera alternativa de respuesta',
          option_d: 'Opción D - Cuarta alternativa de respuesta',
          correct_option: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
        })
      }
    })
    
    console.log(`Generated ${allQuestions.length} mock questions`)
    return allQuestions
  }

  const handleAnswer = (option: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: option
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleFinish = async () => {
  console.log('🏁 ===================================')
  console.log('🏁 INICIANDO FINALIZACIÓN DE EXAMEN')
  console.log('🏁 ===================================')
  
  let correct = 0
  const answersArray: any[] = []

  questions.forEach((q, index) => {
    const studentAnswer = answers[index] ?? null
    const isCorrect = studentAnswer === q.correct_option

    if (isCorrect) correct++

    answersArray.push({
      question_id: q.id,
      question_number: index + 1,
      question_text: q.question_text,
      subject: q.subject || 'Sin clasificar', // ✅ AGREGADO
      student_answer: studentAnswer,
      correct_answer: q.correct_option,
      is_correct: isCorrect,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d
    })
  })

  const percentage = Math.round((correct / questions.length) * 100)
  const timeTaken = (totalMinutes * 60) - timeLeft
  const avgTimePerQuestion = Math.floor(timeTaken / questions.length)

  console.log('📊 Resultados:')
  console.log('   ✓ Correctas:', correct)
  console.log('   ✗ Incorrectas:', questions.length - correct - (questions.length - Object.keys(answers).length))
  console.log('   ⊘ Sin responder:', questions.length - Object.keys(answers).length)
  console.log('   % Porcentaje:', percentage)
  console.log('   ⏱ Tiempo:', `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    console.log('👤 Usuario ID:', user.id)

    // ✅ MAPEAR exam_type de inglés a español
    const examTypeForDB = type === 'diagnostic' ? 'diagnostico' : 'completo'
    
    console.log('💾 Insertando examen...')
    console.log('   Type URL:', type)
    console.log('   Type DB:', examTypeForDB)

    const { data: examData, error: examError } = await supabase
      .from('generated_exams')
      .insert({
        user_id: user.id,
        exam_type: examTypeForDB, // ✅ CORREGIDO: 'diagnostico' o 'completo'
        exam_number: null,
        questions_order: questions.map(q => q.id),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        time_taken_seconds: timeTaken,
        score: correct,
        total_questions: questions.length,
        percentage,
        status: 'completed', // ✅ VÁLIDO según tu schema
        questions_data: answersArray // ✅ Snapshot completo
      })
      .select()
      .single()

    if (examError) {
      console.error('❌ Error insertando examen:')
      console.error('   Código:', examError.code)
      console.error('   Mensaje:', examError.message)
      console.error('   Detalle:', examError.details)
      console.error('   Hint:', examError.hint)
      throw examError
    }

    console.log('✅ Examen guardado, ID:', examData.id)

    // ✅ Insertar respuestas individuales
    console.log('💾 Insertando respuestas...')
    
    const answersToInsert = answersArray
      .filter(a => !a.question_id.startsWith('mock-')) // Solo reales
      .filter(a => a.student_answer !== null) // Solo respondidas
      .map(a => ({
        exam_id: examData.id,
        student_id: user.id,
        question_id: a.question_id,
        question_number: a.question_number,
        subject: a.subject, // ✅ AGREGADO
        student_answer: a.student_answer,
        correct_answer: a.correct_answer,
        is_correct: a.is_correct,
        time_spent_seconds: avgTimePerQuestion, // ✅ Promedio por ahora
        answered_at: new Date().toISOString()
      }))

    console.log(`📝 Total a insertar: ${answersToInsert.length} respuestas`)
    if (answersToInsert.length > 0) {
      console.log('📝 Muestra primera:')
      console.log(JSON.stringify(answersToInsert[0], null, 2))
    }

    if (answersToInsert.length > 0) {
      const { error: answersError } = await supabase
        .from('student_answers')
        .insert(answersToInsert)

      if (answersError) {
        console.error('❌ Error insertando respuestas:', answersError)
        console.warn('⚠️ Continuando (datos en questions_data)')
      } else {
        console.log('✅ Respuestas guardadas')
      }
    }

    // ✅ Actualizar contadores
    if (type === 'complete') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('exams_remaining')
        .eq('id', user.id)
        .single()

      if (profile?.exams_remaining > 0) {
        await supabase
          .from('user_profiles')
          .update({ exams_remaining: profile.exams_remaining - 1 })
          .eq('id', user.id)
        console.log('✅ Contador actualizado')
      }
    }

    if (type === 'diagnostic') {
      await supabase
        .from('user_profiles')
        .update({ free_diagnostic_used: true })
        .eq('id', user.id)
      console.log('✅ Diagnóstico marcado')
    }

    console.log('🎉 EXAMEN COMPLETADO EXITOSAMENTE')
    
    navigate('/results', {
      state: {
        examId: examData.id,
        score: correct,
        total: questions.length,
        percentage,
        examType: type
      }
    })

  } catch (error: any) {
    console.error('💥 ERROR CRÍTICO:', error)
    console.error('💥 Mensaje:', error?.message)
    console.error('💥 Detalles:', error?.details)
    console.error('💥 Hint:', error?.hint)
    console.error('💥 Code:', error?.code)

    alert(
      'Error al guardar el examen:\n\n' +
      `${error?.message}\n\n` +
      'Revisa la consola (F12) para más detalles.'
    )
    
    // NO navegar si falló
    return
  }
}

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    const percentage = (timeLeft / (totalMinutes * 60)) * 100
    if (percentage > 50) return '#10B981'
    if (percentage > 25) return '#F59E0B'
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
            Cargando examen...
          </p>
        </div>
      </div>
    )
  }

  if (!examStarted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '48px',
          borderRadius: '24px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: gradients.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              margin: '0 auto 24px',
              boxShadow: '0 8px 24px rgba(232, 93, 154, 0.3)'
            }}>
              📝
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              margin: '0 0 12px 0',
              color: colors.gray900
            }}>
              {isDiagnostic ? 'Examen Diagnóstico' : 'Examen Completo ECOEMS'}
            </h1>
            <p style={{
              fontSize: '18px',
              color: colors.gray600,
              margin: 0
            }}>
              {totalQuestions} preguntas • {totalMinutes} minutos
            </p>
          </div>

          <div style={{
            background: colors.gray50,
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              margin: '0 0 16px 0',
              color: colors.gray900
            }}>
              📋 Instrucciones:
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{
                fontSize: '15px',
                color: colors.gray700,
                marginBottom: '12px',
                display: 'flex',
                gap: '12px'
              }}>
                <span>✓</span>
                <span>Lee cuidadosamente cada pregunta antes de responder</span>
              </li>
              <li style={{
                fontSize: '15px',
                color: colors.gray700,
                marginBottom: '12px',
                display: 'flex',
                gap: '12px'
              }}>
                <span>✓</span>
                <span>Las preguntas están agrupadas por materia</span>
              </li>
              <li style={{
                fontSize: '15px',
                color: colors.gray700,
                marginBottom: '12px',
                display: 'flex',
                gap: '12px'
              }}>
                <span>✓</span>
                <span>Puedes navegar entre preguntas libremente</span>
              </li>
              <li style={{
                fontSize: '15px',
                color: colors.gray700,
                display: 'flex',
                gap: '12px'
              }}>
                <span>✓</span>
                <span>El examen se enviará automáticamente al terminar el tiempo</span>
              </li>
            </ul>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '16px 32px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '12px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: colors.gray700
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => setExamStarted(true)}
              style={{
                padding: '16px 32px',
                border: 'none',
                borderRadius: '12px',
                background: gradients.primary,
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '700',
                color: 'white',
                boxShadow: '0 4px 12px rgba(232, 93, 154, 0.3)'
              }}
            >
              🚀 Comenzar Examen
            </button>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const answeredCount = Object.keys(answers).length

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)'
    }}>
      {/* Header con cronómetro */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: `2px solid ${colors.gray100}`,
        padding: '16px 32px',
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
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              color: colors.gray900
            }}>
              {isDiagnostic ? 'Examen Diagnóstico' : 'Examen Completo'}
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.gray600,
              margin: '4px 0 0 0'
            }}>
              Pregunta {currentQuestion + 1} de {questions.length} • {answeredCount} respondidas
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: colors.gray50,
              border: `2px solid ${getTimeColor()}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>⏱️</span>
              <div>
                <p style={{
                  fontSize: '12px',
                  color: colors.gray600,
                  margin: 0,
                  fontWeight: '600'
                }}>
                  TIEMPO RESTANTE
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: 0,
                  color: getTimeColor()
                }}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Pregunta */}
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          border: `1px solid ${colors.gray100}`,
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: '8px',
            background: gradients.primary,
            color: 'white',
            fontSize: '13px',
            fontWeight: '700',
            marginBottom: '20px'
          }}>
            {question.subject}
          </div>

          <h2 style={{
            fontSize: '22px',
            fontWeight: '600',
            color: colors.gray900,
            margin: '0 0 32px 0',
            lineHeight: '1.6'
          }}>
            {question.question_text}
          </h2>

          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            {['A', 'B', 'C', 'D'].map(opt => {
              const isSelected = answers[currentQuestion] === opt
              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  style={{
                    padding: '20px',
                    textAlign: 'left',
                    border: `3px solid ${isSelected ? colors.primary : colors.gray200}`,
                    borderRadius: '14px',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(107, 141, 214, 0.08) 0%, rgba(52, 183, 200, 0.08) 100%)'
                      : 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: isSelected ? '600' : '400',
                    color: colors.gray900,
                    transition: 'all 0.2s',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = colors.primary
                      e.currentTarget.style.background = 'rgba(107, 141, 214, 0.03)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = colors.gray200
                      e.currentTarget.style.background = 'white'
                    }
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isSelected ? gradients.primary : colors.gray100,
                    color: isSelected ? 'white' : colors.gray700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    {opt}
                  </div>
                  <span>{question[`option_${opt.toLowerCase()}` as keyof Question]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Navegación */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: `1px solid ${colors.gray100}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            style={{
              padding: '14px 24px',
              border: `2px solid ${colors.gray200}`,
              borderRadius: '12px',
              background: 'white',
              cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              color: currentQuestion === 0 ? colors.gray400 : colors.gray700,
              opacity: currentQuestion === 0 ? 0.5 : 1
            }}
          >
            ← Anterior
          </button>

          <div style={{
            fontSize: '14px',
            color: colors.gray600,
            fontWeight: '600'
          }}>
            {currentQuestion + 1} / {questions.length}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleFinish}
              style={{
                padding: '14px 28px',
                border: 'none',
                borderRadius: '12px',
                background: gradients.primary,
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '700',
                color: 'white',
                boxShadow: '0 4px 12px rgba(232, 93, 154, 0.3)'
              }}
            >
              ✓ Finalizar Examen
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{
                padding: '14px 24px',
                border: 'none',
                borderRadius: '12px',
                background: gradients.primary,
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '700',
                color: 'white',
                boxShadow: '0 4px 12px rgba(232, 93, 154, 0.3)'
              }}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>

      {/* Tablero Panorámico - Botón Flotante */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 100
      }}>
        <button
          onClick={() => setShowOverview(!showOverview)}
          style={{
            padding: '16px 24px',
            borderRadius: '16px',
            background: gradients.primary,
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(232, 93, 154, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '16px',
            fontWeight: '700',
            transition: 'all 0.3s',
            minWidth: '200px',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(232, 93, 154, 0.5)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(232, 93, 154, 0.4)'
          }}
        >
          <span style={{ fontSize: '24px' }}>🗂️</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>
              Ver Todas
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '500' }}>
              {answeredCount}/{questions.length} respondidas
            </div>
          </div>
        </button>
        
        {/* Tooltip */}
        {answeredCount < 3 && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: '12px',
            padding: '12px 16px',
            background: colors.gray900,
            color: 'white',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            animation: 'fadeInUp 0.3s ease'
          }}>
            💡 Click aquí para ver todas las preguntas
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              right: '20px',
              width: '12px',
              height: '12px',
              background: colors.gray900,
              transform: 'rotate(45deg)'
            }} />
          </div>
        )}
      </div>

      {/* Modal Tablero Panorámico */}
      {showOverview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 99,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowOverview(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '40px',
              maxWidth: '1200px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <div>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0',
                  background: gradients.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  📋 Tablero Panorámico
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: colors.gray600,
                  margin: 0
                }}>
                  {answeredCount} de {questions.length} respondidas
                </p>
              </div>
              <button
                onClick={() => setShowOverview(false)}
                style={{
                  padding: '12px 24px',
                  background: colors.gray100,
                  color: colors.gray700,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Leyenda */}
            <div style={{
              display: 'flex',
              gap: '24px',
              marginBottom: '32px',
              padding: '20px',
              background: colors.gray50,
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: colors.gray700 }}>
                  Respondida
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: colors.gray200
                }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: colors.gray700 }}>
                  Sin responder
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: `3px solid ${colors.primary}`
                }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: colors.gray700 }}>
                  Pregunta actual
                </span>
              </div>
            </div>

            {/* Grid de preguntas por materia */}
            {SUBJECTS.map(subject => {
              const subjectQuestions = questions
                .map((q, idx) => ({ ...q, index: idx }))
                .filter(q => q.subject === subject)
              
              if (subjectQuestions.length === 0) return null

              return (
                <div key={subject} style={{ marginBottom: '32px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: colors.gray900,
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: `2px solid ${colors.gray200}`
                  }}>
                    {subject} ({subjectQuestions.filter(q => answers[q.index]).length}/{subjectQuestions.length})
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                    gap: '12px'
                  }}>
                    {subjectQuestions.map((q) => {
                      const isAnswered = answers[q.index] !== undefined
                      const isCurrent = q.index === currentQuestion

                      return (
                        <button
                          key={q.index}
                          onClick={() => {
                            setCurrentQuestion(q.index)
                            setShowOverview(false)
                          }}
                          style={{
                            padding: '16px 12px',
                            background: isAnswered 
                              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                              : colors.gray200,
                            color: isAnswered ? 'white' : colors.gray700,
                            border: isCurrent ? `3px solid ${colors.primary}` : 'none',
                            borderRadius: '12px',
                            fontSize: '18px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isAnswered ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          {q.index + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Botón finalizar */}
            <div style={{
              marginTop: '40px',
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(107, 141, 214, 0.08) 0%, rgba(52, 183, 200, 0.08) 100%)',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '16px',
                color: colors.gray700,
                margin: '0 0 16px 0',
                fontWeight: '600'
              }}>
                {answeredCount === questions.length 
                  ? '¡Has respondido todas las preguntas!' 
                  : `Te faltan ${questions.length - answeredCount} preguntas por responder`}
              </p>
              <button
                onClick={() => {
                  if (window.confirm(`¿Estás seguro de finalizar? Has respondido ${answeredCount} de ${questions.length} preguntas.`)) {
                    handleFinish()
                  }
                }}
                style={{
                  padding: '16px 32px',
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
                ✓ Finalizar Examen
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
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
