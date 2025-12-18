import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'
import QuestionModal from '../../components/QuestionModal'

interface Question {
  id: string
  subject: string
  topic: string
  subtopic: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  purpose: 'diagnostic' | 'exam' | 'both'
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation_text: string | null
  status: 'draft' | 'review' | 'approved'
  created_at: string
  times_used: number
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

export default function QuestionBank() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('question_bank')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter(q => {
    const matchSubject = filterSubject === 'all' || q.subject === filterSubject
    const matchDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty
    const matchStatus = filterStatus === 'all' || q.status === filterStatus
    const matchSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       q.topic.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchSubject && matchDifficulty && matchStatus && matchSearch
  })

  const stats = {
    total: questions.length,
    approved: questions.filter(q => q.status === 'approved').length,
    diagnostic: questions.filter(q => q.purpose === 'diagnostic' || q.purpose === 'both').length,
    exam: questions.filter(q => q.purpose === 'exam' || q.purpose === 'both').length
  }

  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      easy: { background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', text: 'Fácil' },
      medium: { background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', text: 'Medio' },
      hard: { background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', text: 'Difícil' }
    }
    return styles[difficulty as keyof typeof styles] || styles.medium
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: { bg: '#F3F4F6', color: '#6B7280', text: '📝 Borrador' },
      review: { bg: '#FEF3C7', color: '#92400E', text: '👀 Revisión' },
      approved: { bg: '#D1FAE5', color: '#065F46', text: '✅ Aprobado' }
    }
    return styles[status as keyof typeof styles] || styles.draft
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
            Cargando banco de reactivos...
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
          maxWidth: '1600px',
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
                Banco de Reactivos
              </h1>
              <p style={{ color: colors.gray500, margin: '2px 0 0 0', fontSize: '14px' }}>
                Gestión de preguntas ECOEMS
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin')}
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
            ← Volver al Dashboard
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
            <p style={{ fontSize: '14px', color: colors.gray600, margin: 0, fontWeight: '600' }}>
              Total Reactivos
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0 0', color: colors.primary }}>
              {stats.total}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray100}`
          }}>
            <p style={{ fontSize: '14px', color: colors.gray600, margin: 0, fontWeight: '600' }}>
              Aprobados
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#10B981' }}>
              {stats.approved}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray100}`
          }}>
            <p style={{ fontSize: '14px', color: colors.gray600, margin: 0, fontWeight: '600' }}>
              Para Diagnóstico
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0 0', color: colors.accent }}>
              {stats.diagnostic}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray100}`
          }}>
            <p style={{ fontSize: '14px', color: colors.gray600, margin: 0, fontWeight: '600' }}>
              Para Exámenes
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0 0', color: colors.purple }}>
              {stats.exam}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: `1px solid ${colors.gray100}`
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{
                padding: '12px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todas las materias</option>
              {SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              style={{
                padding: '12px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todas las dificultades</option>
              <option value="easy">Fácil</option>
              <option value="medium">Medio</option>
              <option value="hard">Difícil</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '12px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="review">En revisión</option>
              <option value="approved">Aprobado</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="🔍 Buscar por texto de pregunta o tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px',
              border: `2px solid ${colors.gray200}`,
              borderRadius: '10px',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Questions List */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: `1px solid ${colors.gray100}`,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px 28px',
            borderBottom: `2px solid ${colors.gray100}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
              📚 Reactivos ({filteredQuestions.length})
            </h2>
            <button
  onClick={() => {
    setEditingQuestion(null)
    setModalOpen(true)
  }}
  style={{
    padding: '12px 24px',
    background: gradients.primary,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(232, 93, 154, 0.3)'
  }}
>
  ➕ Nuevo Reactivo
</button>
          </div>

          {filteredQuestions.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
              <p style={{ color: colors.gray600, fontSize: '18px' }}>
                {searchTerm || filterSubject !== 'all' || filterDifficulty !== 'all' || filterStatus !== 'all'
                  ? 'No se encontraron reactivos con esos filtros'
                  : 'Aún no hay reactivos en el banco'}
              </p>
            </div>
          ) : (
            <div>
              {filteredQuestions.map((question) => {
                const diffBadge = getDifficultyBadge(question.difficulty)
                const statusBadge = getStatusBadge(question.status)

                return (
                  <div
                    key={question.id}
                    style={{
                      padding: '24px 28px',
                      borderBottom: `1px solid ${colors.gray100}`,
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(107, 141, 214, 0.02)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: diffBadge.background,
                            color: 'white'
                          }}>
                            {diffBadge.text}
                          </span>

                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: statusBadge.bg,
                            color: statusBadge.color
                          }}>
                            {statusBadge.text}
                          </span>

                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: colors.gray100,
                            color: colors.gray700
                          }}>
                            {question.subject}
                          </span>

                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: colors.gray50,
                            color: colors.gray600
                          }}>
                            {question.topic}
                          </span>
                        </div>

                        <p style={{
                          fontSize: '16px',
                          color: colors.gray900,
                          margin: '0 0 12px 0',
                          lineHeight: '1.6',
                          fontWeight: '500'
                        }}>
                          {question.question_text}
                        </p>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '8px',
                          marginTop: '12px'
                        }}>
                          {['A', 'B', 'C', 'D'].map(opt => {
                            const isCorrect = question.correct_option === opt
                            return (
                              <div
                                key={opt}
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  background: isCorrect ? '#D1FAE5' : colors.gray50,
                                  border: `2px solid ${isCorrect ? '#10B981' : colors.gray200}`,
                                  fontSize: '14px',
                                  fontWeight: isCorrect ? '700' : '500',
                                  color: isCorrect ? '#065F46' : colors.gray700
                                }}
                              >
                                {opt}) {question[`option_${opt.toLowerCase()}` as keyof Question]}
                              </div>
                            )
                          })}
                        </div>

                        {question.explanation_text && (
                          <p style={{
                            fontSize: '14px',
                            color: colors.gray600,
                            margin: '12px 0 0 0',
                            padding: '12px',
                            background: colors.gray50,
                            borderRadius: '8px',
                            borderLeft: `4px solid ${colors.accent}`
                          }}>
                            💡 <strong>Explicación:</strong> {question.explanation_text}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
  onClick={() => {
    setEditingQuestion(question)
    setModalOpen(true)
  }}
  style={{
    padding: '10px 16px',
    background: 'white',
    border: `2px solid ${colors.gray200}`,
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.gray700
  }}
>
  ✏️ Editar
</button>
                      </div>
                    </div>
                  </div>
                )
              })}
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
      {/* Modal */}
<QuestionModal
  isOpen={modalOpen}
  onClose={() => {
    setModalOpen(false)
    setEditingQuestion(null)
  }}
  onSave={() => {
    loadQuestions()
  }}
  editingQuestion={editingQuestion}
/>
    </div>
  )
}