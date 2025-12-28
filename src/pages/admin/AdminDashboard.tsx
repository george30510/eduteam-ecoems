import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface Student {
  id: string
  full_name: string
  email: string
  school: string | null
  grade: string | null
  created_at: string
  exams_remaining: number
  free_diagnostic_used: boolean
}

interface GlobalStats {
  total_exams: number
  avg_score: number
  approval_rate: number
  total_questions: number
}

interface SubjectStats {
  subject: string
  total_questions: number
  avg_percentage: number
}

interface DifficultQuestion {
  question_id: string
  question_text: string
  subject: string
  total_attempts: number
  correct_attempts: number
  success_rate: number
}

type TabType = 'overview' | 'results'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Estados para pestaña Resultados
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([])
  const [difficultQuestions, setDifficultQuestions] = useState<DifficultQuestion[]>([])
  const [loadingResults, setLoadingResults] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()

      if (authError || !user) {
        navigate('/')
        return
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || profile?.role !== 'admin') {
        console.warn('Acceso denegado: no es admin')
        navigate('/dashboard')
        return
      }

      loadStudents()
    }

    checkAdmin()
  }, [])

  useEffect(() => {
    if (activeTab === 'results') {
      loadResultsData()
    }
  }, [activeTab])

  const loadStudents = async () => {
    try {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      setStudents(profiles || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  /* =============================
     LOAD RESULTS DATA
  ============================== */
  const loadResultsData = async () => {
    setLoadingResults(true)
    try {
      await Promise.all([
        loadGlobalStats(),
        loadSubjectStats(),
        loadDifficultQuestions()
      ])
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoadingResults(false)
    }
  }

  const loadGlobalStats = async () => {
    try {
      const { data: exams } = await supabase
        .from('generated_exams')
        .select('percentage, total_questions')
        .eq('status', 'completed')

      if (!exams || exams.length === 0) {
        setGlobalStats({
          total_exams: 0,
          avg_score: 0,
          approval_rate: 0,
          total_questions: 0
        })
        return
      }

      const totalExams = exams.length
      const totalScore = exams.reduce((sum, e) => sum + e.percentage, 0)
      const avgScore = Math.round(totalScore / totalExams)
      const approvedExams = exams.filter(e => e.percentage >= 70).length
      const approvalRate = Math.round((approvedExams / totalExams) * 100)
      const totalQuestions = exams.reduce((sum, e) => sum + e.total_questions, 0)

      setGlobalStats({
        total_exams: totalExams,
        avg_score: avgScore,
        approval_rate: approvalRate,
        total_questions: totalQuestions
      })
    } catch (error) {
      console.error('Error loading global stats:', error)
    }
  }

  const loadSubjectStats = async () => {
    try {
      const { data: answers } = await supabase
        .from('student_answers')
        .select('subject, is_correct')

      if (!answers || answers.length === 0) {
        setSubjectStats([])
        return
      }

      const subjectMap: { [key: string]: { total: number; correct: number } } = {}

      answers.forEach((answer) => {
        const subject = answer.subject
        if (!subjectMap[subject]) {
          subjectMap[subject] = { total: 0, correct: 0 }
        }
        subjectMap[subject].total++
        if (answer.is_correct) {
          subjectMap[subject].correct++
        }
      })

      const stats: SubjectStats[] = Object.entries(subjectMap).map(
        ([subject, data]) => ({
          subject,
          total_questions: data.total,
          avg_percentage: Math.round((data.correct / data.total) * 100)
        })
      )

      stats.sort((a, b) => a.avg_percentage - b.avg_percentage)

      setSubjectStats(stats)
    } catch (error) {
      console.error('Error loading subject stats:', error)
    }
  }

  const loadDifficultQuestions = async () => {
    try {
      const { data: answers } = await supabase
        .from('student_answers')
        .select('question_id, is_correct, subject')
        .not('question_id', 'is', null)
        .not('question_id', 'like', 'mock%')

      if (!answers || answers.length === 0) {
        setDifficultQuestions([])
        return
      }

      const questionMap: {
        [key: string]: {
          subject: string
          total: number
          correct: number
        }
      } = {}

      answers.forEach((answer) => {
        const qid = answer.question_id
        if (!questionMap[qid]) {
          questionMap[qid] = {
            subject: answer.subject,
            total: 0,
            correct: 0
          }
        }
        questionMap[qid].total++
        if (answer.is_correct) {
          questionMap[qid].correct++
        }
      })

      const questionIds = Object.keys(questionMap).filter(
        (qid) => questionMap[qid].total >= 3
      )

      if (questionIds.length === 0) {
        setDifficultQuestions([])
        return
      }

      const { data: questions } = await supabase
        .from('question_bank')
        .select('id, question_text')
        .in('id', questionIds)

      const questionsMap: { [key: string]: string } = {}
      questions?.forEach((q) => {
        questionsMap[q.id] = q.question_text
      })

      const difficult: DifficultQuestion[] = questionIds
        .map((qid) => ({
          question_id: qid,
          question_text: questionsMap[qid] || 'Pregunta no encontrada',
          subject: questionMap[qid].subject,
          total_attempts: questionMap[qid].total,
          correct_attempts: questionMap[qid].correct,
          success_rate: Math.round(
            (questionMap[qid].correct / questionMap[qid].total) * 100
          )
        }))
        .sort((a, b) => a.success_rate - b.success_rate)
        .slice(0, 10)

      setDifficultQuestions(difficult)
    } catch (error) {
      console.error('Error loading difficult questions:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.school?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getExamBadgeStyle = (remaining: number) => {
    if (remaining > 4) {
      return {
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: 'white'
      }
    } else if (remaining > 2) {
      return {
        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        color: 'white'
      }
    } else {
      return {
        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        color: 'white'
      }
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
          <p style={{ color: colors.gray600, fontSize: '18px', fontWeight: '500' }}>
            Cargando panel de administración...
          </p>
        </div>
      </div>
    )
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
                Panel de Administración
              </h1>
              <p style={{ color: colors.gray500, margin: '2px 0 0 0', fontSize: '14px' }}>
                ECOEMS - Gestión de Estudiantes
              </p>
            </div>
          </div>

          {/* Botones del Header */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/admin/students')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
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
              👥 Gestionar Estudiantes
            </button>

            <button
              onClick={() => navigate('/admin/questions')}
              style={{
                padding: '12px 24px',
                background: gradients.primary,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
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
              📚 Banco de Reactivos
            </button>

            <button
              onClick={handleLogout}
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
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = colors.primary
                e.currentTarget.style.color = colors.primary
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = colors.gray200
                e.currentTarget.style.color = colors.gray700
              }}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* TABS */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          background: 'white',
          padding: '8px',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: `1px solid ${colors.gray100}`
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              flex: 1,
              padding: '14px 24px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeTab === 'overview' ? gradients.primary : 'transparent',
              color: activeTab === 'overview' ? 'white' : colors.gray600,
              transition: 'all 0.2s',
              boxShadow: activeTab === 'overview' ? '0 4px 12px rgba(232, 93, 154, 0.3)' : 'none'
            }}
          >
            👥 Vista General
          </button>
          <button
            onClick={() => setActiveTab('results')}
            style={{
              flex: 1,
              padding: '14px 24px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeTab === 'results' ? gradients.primary : 'transparent',
              color: activeTab === 'results' ? 'white' : colors.gray600,
              transition: 'all 0.2s',
              boxShadow: activeTab === 'results' ? '0 4px 12px rgba(232, 93, 154, 0.3)' : 'none'
            }}
          >
            📊 Resultados
          </button>
        </div>

        {/* TAB: VISTA GENERAL */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {/* Total Estudiantes */}
              <div style={{
                background: 'white',
                padding: '28px',
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                border: `1px solid ${colors.gray100}`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '100px',
                  height: '100px',
                  background: gradients.primary,
                  borderRadius: '50%',
                  opacity: 0.1
                }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}>
                  <div>
                    <p style={{ 
                      color: colors.gray600, 
                      fontSize: '14px', 
                      margin: 0, 
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Total Estudiantes
                    </p>
                    <p style={{ 
                      fontSize: '42px', 
                      fontWeight: 'bold', 
                      margin: '12px 0 0 0', 
                      background: gradients.primary,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {students.length}
                    </p>
                  </div>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '18px',
                    background: gradients.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 8px 16px rgba(232, 93, 154, 0.3)'
                  }}>
                    👥
                  </div>
                </div>
              </div>

              {/* Diagnósticos Completados */}
              <div style={{
                background: 'white',
                padding: '28px',
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                border: `1px solid ${colors.gray100}`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  borderRadius: '50%',
                  opacity: 0.1
                }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}>
                  <div>
                    <p style={{ 
                      color: colors.gray600, 
                      fontSize: '14px', 
                      margin: 0, 
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Diagnósticos
                    </p>
                    <p style={{ 
                      fontSize: '42px', 
                      fontWeight: 'bold', 
                      margin: '12px 0 0 0',
                      color: '#10B981'
                    }}>
                      {students.filter(s => s.free_diagnostic_used).length}
                    </p>
                  </div>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)'
                  }}>
                    ✅
                  </div>
                </div>
              </div>

              {/* Nuevos Esta Semana */}
              <div style={{
                background: 'white',
                padding: '28px',
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                border: `1px solid ${colors.gray100}`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '100px',
                  height: '100px',
                  background: gradients.secondary,
                  borderRadius: '50%',
                  opacity: 0.1
                }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}>
                  <div>
                    <p style={{ 
                      color: colors.gray600, 
                      fontSize: '14px', 
                      margin: 0, 
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Nuevos (7 días)
                    </p>
                    <p style={{ 
                      fontSize: '42px', 
                      fontWeight: 'bold', 
                      margin: '12px 0 0 0',
                      background: gradients.secondary,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {students.filter(s => {
                        const created = new Date(s.created_at)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return created > weekAgo
                      }).length}
                    </p>
                  </div>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '16px',
                    background: gradients.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 8px 16px rgba(139, 111, 201, 0.3)'
                  }}>
                    🆕
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '20px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: `1px solid ${colors.gray100}`
            }}>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '20px'
                }}>
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o escuela..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 52px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '14px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary
                    e.currentTarget.style.boxShadow = `0 0 0 4px rgba(107, 141, 214, 0.1)`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.gray200
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              border: `1px solid ${colors.gray100}`
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
                  📋 Lista de Estudiantes
                  <span style={{
                    marginLeft: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: gradients.badge,
                    color: 'white'
                  }}>
                    {filteredStudents.length}
                  </span>
                </h2>
              </div>

              {filteredStudents.length === 0 ? (
                <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '72px', marginBottom: '20px' }}>🔍</div>
                  <p style={{ 
                    color: colors.gray600, 
                    fontSize: '20px', 
                    marginBottom: '8px', 
                    fontWeight: '600' 
                  }}>
                    {searchTerm ? 'No se encontraron estudiantes' : 'Aún no hay estudiantes registrados'}
                  </p>
                  <p style={{ color: colors.gray400, fontSize: '15px' }}>
                    {searchTerm 
                      ? 'Intenta con otro término de búsqueda' 
                      : 'Los estudiantes aparecerán aquí cuando se registren'}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ 
                        background: 'linear-gradient(135deg, rgba(107, 141, 214, 0.08) 0%, rgba(52, 183, 200, 0.08) 100%)'
                      }}>
                        <th style={{
                          padding: '18px 24px',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: '700',
                          color: colors.gray700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}>
                          Estudiante
                        </th>
                        <th style={{
                          padding: '18px 24px',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: '700',
                          color: colors.gray700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}>
                          Contacto
                        </th>
                        <th style={{
                          padding: '18px 24px',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: '700',
                          color: colors.gray700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}>
                          Escuela
                        </th>
                        <th style={{
                          padding: '18px 24px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: '700',
                          color: colors.gray700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}>
                          Exámenes
                        </th>
                        <th style={{
                          padding: '18px 24px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: '700',
                          color: colors.gray700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}>
                          Registro
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr 
                          key={student.id} 
                          style={{ 
                            borderTop: `1px solid ${colors.gray100}`,
                            transition: 'all 0.2s',
                            backgroundColor: 'white'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(107, 141, 214, 0.03)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'white'
                          }}
                        >
                          <td style={{ padding: '22px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                background: gradients.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '17px',
                                flexShrink: 0,
                                boxShadow: '0 4px 8px rgba(107, 141, 214, 0.25)'
                              }}>
                                {student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <div>
                                <p style={{ 
                                  fontWeight: '700', 
                                  margin: 0, 
                                  fontSize: '16px', 
                                  color: colors.gray900 
                                }}>
                                  {student.full_name}
                                </p>
                                <p style={{ 
                                  fontSize: '14px', 
                                  color: colors.gray500, 
                                  margin: '3px 0 0 0',
                                  fontWeight: '500'
                                }}>
                                  {student.grade || 'Sin grado'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '22px 24px' }}>
                            <p style={{
                              color: colors.gray700,
                              fontSize: '15px',
                              margin: 0,
                              fontWeight: '500'
                            }}>
                              {student.email}
                            </p>
                          </td>
                          <td style={{ padding: '22px 24px' }}>
                            <p style={{
                              color: colors.gray600,
                              fontSize: '15px',
                              margin: 0,
                              fontWeight: '500'
                            }}>
                              {student.school || 'N/A'}
                            </p>
                          </td>
                          <td style={{ padding: '22px 24px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontSize: '14px',
                              fontWeight: '700',
                              ...getExamBadgeStyle(student.exams_remaining),
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}>
                              {student.exams_remaining}/7
                            </span>
                          </td>
                          <td style={{ padding: '22px 24px', textAlign: 'center' }}>
                            <p style={{
                              color: colors.gray600,
                              fontSize: '14px',
                              margin: 0,
                              fontWeight: '600'
                            }}>
                              {formatDate(student.created_at)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB: RESULTADOS */}
        {activeTab === 'results' && (
          <>
            {loadingResults ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
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
                    Cargando estadísticas...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* KPIs GENERALES */}
                {globalStats && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '24px',
                    marginBottom: '40px'
                  }}>
                    {/* Total Exámenes */}
                    <div style={{
                      background: 'white',
                      padding: '28px',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      border: `1px solid ${colors.gray100}`
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
                      <p style={{
                        fontSize: '14px',
                        color: colors.gray600,
                        margin: '0 0 8px 0',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        Total Exámenes
                      </p>
                      <p style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: colors.primary,
                        margin: 0
                      }}>
                        {globalStats.total_exams}
                      </p>
                    </div>

                    {/* Promedio General */}
                    <div style={{
                      background: 'white',
                      padding: '28px',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      border: `1px solid ${colors.gray100}`
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📈</div>
                      <p style={{
                        fontSize: '14px',
                        color: colors.gray600,
                        margin: '0 0 8px 0',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        Promedio General
                      </p>
                      <p style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: globalStats.avg_score >= 70 ? colors.success : colors.error,
                        margin: 0
                      }}>
                        {globalStats.avg_score}%
                      </p>
                    </div>

                    {/* Tasa de Aprobación */}
                    <div style={{
                      background: 'white',
                      padding: '28px',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      border: `1px solid ${colors.gray100}`
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
                      <p style={{
                        fontSize: '14px',
                        color: colors.gray600,
                        margin: '0 0 8px 0',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        Tasa de Aprobación
                      </p>
                      <p style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: globalStats.approval_rate >= 70 ? colors.success : colors.warning,
                        margin: 0
                      }}>
                        {globalStats.approval_rate}%
                      </p>
                    </div>

                    {/* Total Preguntas */}
                    <div style={{
                      background: 'white',
                      padding: '28px',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      border: `1px solid ${colors.gray100}`
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>❓</div>
                      <p style={{
                        fontSize: '14px',
                        color: colors.gray600,
                        margin: '0 0 8px 0',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        Preguntas Resueltas
                      </p>
                      <p style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: colors.accent,
                        margin: 0
                      }}>
                        {globalStats.total_questions}
                      </p>
                    </div>
                  </div>
                )}

                {/* ANÁLISIS POR MATERIA */}
                {subjectStats.length > 0 && (
                  <div style={{
                    background: 'white',
                    padding: '32px',
                    borderRadius: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    marginBottom: '32px',
                    border: `1px solid ${colors.gray100}`
                  }}>
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      marginBottom: '24px',
                      color: colors.gray900
                    }}>
                      📚 Análisis por Materia
                    </h2>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '16px'
                    }}>
                      {subjectStats.map((subject) => (
                        <div
                          key={subject.subject}
                          style={{
                            padding: '20px',
                            borderRadius: '12px',
                            background: colors.gray50,
                            border: `2px solid ${subject.avg_percentage >= 70 ? colors.success : colors.error}`
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: '700',
                              margin: 0,
                              color: colors.gray900
                            }}>
                              {subject.subject}
                            </h3>
                            {subject.avg_percentage < 70 && (
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                background: gradients.warning,
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}>
                                ⚠️ Refuerzo
                              </span>
                            )}
                          </div>

                          <div style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: subject.avg_percentage >= 70 ? colors.success : colors.error,
                            marginBottom: '8px'
                          }}>
                            {subject.avg_percentage}%
                          </div>

                          <p style={{
                            fontSize: '14px',
                            color: colors.gray600,
                            margin: 0
                          }}>
                            {subject.total_questions} preguntas resueltas
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PREGUNTAS MÁS DIFÍCILES */}
                {difficultQuestions.length > 0 && (
                  <div style={{
                    background: 'white',
                    padding: '32px',
                    borderRadius: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    border: `1px solid ${colors.gray100}`
                  }}>
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      marginBottom: '24px',
                      color: colors.gray900
                    }}>
                      🎯 Top 10 Preguntas Más Difíciles
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {difficultQuestions.map((q, index) => (
                        <div
                          key={q.question_id}
                          style={{
                            padding: '20px',
                            borderRadius: '12px',
                            background: colors.gray50,
                            border: `2px solid ${q.success_rate < 50 ? colors.error : colors.warning}`
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start',
                            gap: '16px',
                            marginBottom: '12px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '8px'
                              }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  background: gradients.primary,
                                  color: 'white',
                                  fontWeight: '700',
                                  fontSize: '14px'
                                }}>
                                  #{index + 1}
                                </span>
                                <span style={{
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  background: gradients.badge,
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {q.subject}
                                </span>
                              </div>
                              <p style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: colors.gray900,
                                margin: '0 0 8px 0',
                                lineHeight: '1.5'
                              }}>
                                {q.question_text}
                              </p>
                              <p style={{
                                fontSize: '13px',
                                color: colors.gray500,
                                margin: 0
                              }}>
                                {q.correct_attempts}/{q.total_attempts} correctas
                              </p>
                            </div>
                            <div style={{
                              textAlign: 'right',
                              minWidth: '80px'
                            }}>
                              <div style={{
                                fontSize: '28px',
                                fontWeight: 'bold',
                                color: q.success_rate < 50 ? colors.error : colors.warning
                              }}>
                                {q.success_rate}%
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: colors.gray500,
                                marginTop: '4px'
                              }}>
                                {q.total_attempts} intentos
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SIN DATOS */}
                {globalStats?.total_exams === 0 && (
                  <div style={{
                    background: 'white',
                    padding: '60px 40px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
                    <h3 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: colors.gray700,
                      marginBottom: '8px'
                    }}>
                      Aún no hay resultados
                    </h3>
                    <p style={{ color: colors.gray500, fontSize: '16px' }}>
                      Los resultados aparecerán cuando los estudiantes completen exámenes
                    </p>
                  </div>
                )}
              </>
            )}
          </>
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