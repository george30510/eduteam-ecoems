import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'
import QuestionModal from '../../components/QuestionModal'
import { ImportQuestionsModal } from '../../components/ImportQuestionsModal'

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
  status: 'pending' | 'approved' | 'rejected'
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
  times_used: number
  creator_name?: string
  approver_name?: string
}

interface UserProfile {
  id: string
  role: 'admin' | 'teacher' | 'staff' | 'student'
  full_name: string
  teacher_subject?: string
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  
  // Modal de aprobación/rechazo
  const [approvalModal, setApprovalModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Modal de importación
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    checkUserRole()
    loadQuestions()
  }, [])

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/')
        return
      }

      const { data: profile } = await supabase
  .from('user_profiles')
  .select('id, role, full_name')
  .eq('id', user.id)
  .single()

      if (!profile || !['admin', 'teacher', 'staff'].includes(profile.role)) {
        navigate('/dashboard')
        return
      }

      setCurrentUser(profile as UserProfile)
    } catch (error) {
      console.error('Error checking role:', error)
      navigate('/')
    }
  }

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
  .from('question_bank')
  .select('*')
  .eq('active', true)
  .order('created_at', { ascending: false })

      if (error) throw error

      const questionsWithNames = (data || []).map(q => ({
  ...q,
  creator_name: 'Usuario',
  approver_name: null
}))

      setQuestions(questionsWithNames)
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const canApprove = (question: Question): boolean => {
    if (!currentUser) return false
    
    // Admin puede aprobar cualquier pregunta
    if (currentUser.role === 'admin') return true
    
    // Profesor solo puede aprobar preguntas de su materia
    if (currentUser.role === 'teacher' && currentUser.teacher_subject) {
      return question.subject === currentUser.teacher_subject
    }
    
    // Staff no puede aprobar
    return false
  }

  const handleApprove = async (questionId: string) => {
    if (!currentUser) return

    try {
      const { error } = await supabase
        .from('question_bank')
        .update({
          status: 'approved',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null
        })
        .eq('id', questionId)

      if (error) throw error

      alert('✅ Pregunta aprobada exitosamente')
      loadQuestions()
      setApprovalModal(false)
      setSelectedQuestion(null)
    } catch (error: any) {
      console.error('Error approving:', error)
      alert(`❌ Error: ${error.message}`)
    }
  }

  const handleReject = async () => {
    if (!currentUser || !selectedQuestion || !rejectionReason.trim()) {
      alert('Por favor ingresa una razón para el rechazo')
      return
    }

    try {
      const { error } = await supabase
        .from('question_bank')
        .update({
          status: 'rejected',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', selectedQuestion.id)

      if (error) throw error

      alert('❌ Pregunta rechazada')
      loadQuestions()
      setApprovalModal(false)
      setSelectedQuestion(null)
      setRejectionReason('')
    } catch (error: any) {
      console.error('Error rejecting:', error)
      alert(`❌ Error: ${error.message}`)
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
    pending: questions.filter(q => q.status === 'pending').length,
    rejected: questions.filter(q => q.status === 'rejected').length
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
      pending: { bg: '#FEF3C7', color: '#92400E', text: '⏳ Pendiente' },
      approved: { bg: '#D1FAE5', color: '#065F46', text: '✅ Aprobada' },
      rejected: { bg: '#FEE2E2', color: '#991B1B', text: '❌ Rechazada' }
    }
    return styles[status as keyof typeof styles] || styles.pending
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
                Gestión de preguntas ECOEMS • {currentUser?.role === 'admin' ? 'Administrador' : currentUser?.role === 'teacher' ? 'Profesor' : 'Staff'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowImportModal(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8B6FC9 0%, #E85D9A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139, 111, 201, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              📥 Importar Excel
            </button>

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
        </div>
      </header>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
              Aprobadas
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
              Pendientes
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#F59E0B' }}>
              {stats.pending}
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
              Rechazadas
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#EF4444' }}>
              {stats.rejected}
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
              <option value="pending">⏳ Pendientes</option>
              <option value="approved">✅ Aprobadas</option>
              <option value="rejected">❌ Rechazadas</option>
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
                const canApproveThis = canApprove(question)

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
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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

                          <span style={{
                            fontSize: '12px',
                            color: colors.gray500,
                            fontStyle: 'italic'
                          }}>
                            Por: {question.creator_name}
                          </span>

                          {question.approved_by && (
                            <span style={{
                              fontSize: '12px',
                              color: colors.gray500,
                              fontStyle: 'italic'
                            }}>
                              • Aprobada por: {question.approver_name}
                            </span>
                          )}
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

                        {question.rejection_reason && (
                          <p style={{
                            fontSize: '14px',
                            color: '#991B1B',
                            margin: '12px 0 0 0',
                            padding: '12px',
                            background: '#FEE2E2',
                            borderRadius: '8px',
                            borderLeft: `4px solid #EF4444`
                          }}>
                            ❌ <strong>Razón del rechazo:</strong> {question.rejection_reason}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
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

                        {question.status === 'pending' && canApproveThis && (
                          <button
                            onClick={() => {
                              setSelectedQuestion(question)
                              setApprovalModal(true)
                            }}
                            style={{
                              padding: '10px 16px',
                              background: gradients.success,
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: 'white',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            ✓ Revisar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pregunta */}
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
        currentUser={currentUser}
      />

      {/* Modal de Aprobación/Rechazo */}
      {approvalModal && selectedQuestion && (
        <div style={{
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
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '16px',
              color: colors.gray900
            }}>
              Revisar Pregunta
            </h3>

            <p style={{
              fontSize: '16px',
              color: colors.gray700,
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              {selectedQuestion.question_text}
            </p>

            <div style={{
              background: colors.gray50,
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '14px',
                color: colors.gray700
              }}>
                Razón del rechazo (opcional si apruebas)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej: La respuesta correcta no está bien fundamentada..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${colors.gray200}`,
                  borderRadius: '10px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleApprove(selectedQuestion.id)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: gradients.success,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                ✓ Aprobar
              </button>

              <button
                onClick={handleReject}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: gradients.error,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                ✗ Rechazar
              </button>

              <button
                onClick={() => {
                  setApprovalModal(false)
                  setSelectedQuestion(null)
                  setRejectionReason('')
                }}
                style={{
                  padding: '14px 20px',
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

      {/* Modal de Importación */}
      <ImportQuestionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          setShowImportModal(false)
          loadQuestions()
        }}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}