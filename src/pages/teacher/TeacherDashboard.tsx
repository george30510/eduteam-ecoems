import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface StudentStats {
  id: string
  full_name: string
  email: string
  total_exams: number
  avg_score: number
  last_exam_date: string | null
  best_score: number
  worst_score: number
}

interface GroupStats {
  total_students: number
  total_exams: number
  avg_score: number
  approval_rate: number
  total_questions: number
}

interface SubjectDifficulty {
  subject: string
  total_questions: number
  avg_percentage: number
}

export default function TeacherDashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<any>(null)
  const [students, setStudents] = useState<StudentStats[]>([])
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null)
  const [subjectDifficulty, setSubjectDifficulty] = useState<SubjectDifficulty[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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

    if (error || !profileData) {
      navigate('/')
      return
    }

    // Verificar que sea profesor
    if (profileData.role !== 'profesor') {
      navigate('/dashboard')
      return
    }

    setProfile(profileData)
    await loadStudentStats()
    await loadGroupStats()
    await loadSubjectDifficulty()
    setLoading(false)
  }

  /* =============================
     LOAD STUDENT STATS
  ============================== */
  const loadStudentStats = async () => {
    try {
      // Obtener todos los estudiantes con sus exámenes
      const { data: examsData } = await supabase
        .from('generated_exams')
        .select(`
          id,
          user_id,
          percentage,
          completed_at,
          user_profiles!inner (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('status', 'completed')
        .eq('user_profiles.role', 'student')
        .order('completed_at', { ascending: false })

      if (!examsData || examsData.length === 0) {
        setStudents([])
        return
      }

      // Agrupar por estudiante
      const studentMap: { [key: string]: StudentStats } = {}

      examsData.forEach((exam: any) => {
        const studentId = exam.user_id
        const studentProfile = exam.user_profiles

        if (!studentMap[studentId]) {
          studentMap[studentId] = {
            id: studentId,
            full_name: studentProfile.full_name || studentProfile.email,
            email: studentProfile.email,
            total_exams: 0,
            avg_score: 0,
            last_exam_date: null,
            best_score: 0,
            worst_score: 100
          }
        }

        const student = studentMap[studentId]
        student.total_exams++
        student.avg_score += exam.percentage

        // Actualizar mejor y peor puntuación
        if (exam.percentage > student.best_score) {
          student.best_score = exam.percentage
        }
        if (exam.percentage < student.worst_score) {
          student.worst_score = exam.percentage
        }

        // Actualizar última fecha
        if (!student.last_exam_date || exam.completed_at > student.last_exam_date) {
          student.last_exam_date = exam.completed_at
        }
      })

      // Calcular promedios y convertir a array
      const studentsList = Object.values(studentMap).map((student) => ({
        ...student,
        avg_score: Math.round(student.avg_score / student.total_exams)
      }))

      // Ordenar por promedio descendente
      studentsList.sort((a, b) => b.avg_score - a.avg_score)

      setStudents(studentsList)
    } catch (error) {
      console.error('Error loading student stats:', error)
    }
  }

  /* =============================
     LOAD GROUP STATS
  ============================== */
  const loadGroupStats = async () => {
    try {
      const { data: examsData } = await supabase
        .from('generated_exams')
        .select('percentage, total_questions, user_id')
        .eq('status', 'completed')

      if (!examsData || examsData.length === 0) {
        setGroupStats({
          total_students: 0,
          total_exams: 0,
          avg_score: 0,
          approval_rate: 0,
          total_questions: 0
        })
        return
      }

      const totalExams = examsData.length
      const totalScore = examsData.reduce((sum, exam) => sum + exam.percentage, 0)
      const avgScore = Math.round(totalScore / totalExams)
      const approvedExams = examsData.filter(exam => exam.percentage >= 70).length
      const approvalRate = Math.round((approvedExams / totalExams) * 100)
      const totalQuestions = examsData.reduce((sum, exam) => sum + exam.total_questions, 0)
      const uniqueStudents = new Set(examsData.map(exam => exam.user_id)).size

      setGroupStats({
        total_students: uniqueStudents,
        total_exams: totalExams,
        avg_score: avgScore,
        approval_rate: approvalRate,
        total_questions: totalQuestions
      })
    } catch (error) {
      console.error('Error loading group stats:', error)
    }
  }

  /* =============================
     LOAD SUBJECT DIFFICULTY
  ============================== */
  const loadSubjectDifficulty = async () => {
    try {
      const { data: answersData } = await supabase
        .from('student_answers')
        .select('subject, is_correct')

      if (!answersData || answersData.length === 0) {
        setSubjectDifficulty([])
        return
      }

      // Agrupar por materia
      const subjectMap: { [key: string]: { total: number; correct: number } } = {}

      answersData.forEach((answer) => {
        const subject = answer.subject
        if (!subjectMap[subject]) {
          subjectMap[subject] = { total: 0, correct: 0 }
        }
        subjectMap[subject].total++
        if (answer.is_correct) {
          subjectMap[subject].correct++
        }
      })

      // Convertir a array y calcular porcentajes
      const subjectsList: SubjectDifficulty[] = Object.entries(subjectMap).map(
        ([subject, stats]) => ({
          subject,
          total_questions: stats.total,
          avg_percentage: Math.round((stats.correct / stats.total) * 100)
        })
      )

      // Ordenar por porcentaje ascendente (más difíciles primero)
      subjectsList.sort((a, b) => a.avg_percentage - b.avg_percentage)

      setSubjectDifficulty(subjectsList)
    } catch (error) {
      console.error('Error loading subject difficulty:', error)
    }
  }

  /* =============================
     FORMAT DATE
  ============================== */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
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
     FILTER STUDENTS
  ============================== */
  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            Cargando panel del profesor...
          </p>
        </div>
      </div>
    )
  }

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
                Panel del Profesor
              </h1>
              <p style={{ color: colors.gray500, fontSize: '14px', margin: 0 }}>
                ECOEMS - Simulador COMIPEMS
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
              👨‍🏫 {profile?.full_name ?? 'Profesor'}
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

        {/* ESTADÍSTICAS DEL GRUPO */}
        {groupStats && (
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
              📊 Estadísticas del Grupo
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              {/* Total Estudiantes */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: colors.gray50,
                border: `2px solid ${colors.gray200}`
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: colors.primary,
                  marginBottom: '4px'
                }}>
                  {groupStats.total_students}
                </div>
                <div style={{ fontSize: '14px', color: colors.gray600 }}>
                  Estudiantes activos
                </div>
              </div>

              {/* Total Exámenes */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: colors.gray50,
                border: `2px solid ${colors.gray200}`
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: colors.secondary,
                  marginBottom: '4px'
                }}>
                  {groupStats.total_exams}
                </div>
                <div style={{ fontSize: '14px', color: colors.gray600 }}>
                  Exámenes completados
                </div>
              </div>

              {/* Promedio General */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: colors.gray50,
                border: `2px solid ${colors.gray200}`
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: groupStats.avg_score >= 70 ? colors.success : colors.error,
                  marginBottom: '4px'
                }}>
                  {groupStats.avg_score}%
                </div>
                <div style={{ fontSize: '14px', color: colors.gray600 }}>
                  Promedio general
                </div>
              </div>

              {/* Tasa de Aprobación */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: colors.gray50,
                border: `2px solid ${colors.gray200}`
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: groupStats.approval_rate >= 70 ? colors.success : colors.warning,
                  marginBottom: '4px'
                }}>
                  {groupStats.approval_rate}%
                </div>
                <div style={{ fontSize: '14px', color: colors.gray600 }}>
                  Tasa de aprobación
                </div>
              </div>

              {/* Total Preguntas */}
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: colors.gray50,
                border: `2px solid ${colors.gray200}`
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>❓</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: colors.accent,
                  marginBottom: '4px'
                }}>
                  {groupStats.total_questions}
                </div>
                <div style={{ fontSize: '14px', color: colors.gray600 }}>
                  Preguntas resueltas
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MATERIAS MÁS DIFÍCILES */}
        {subjectDifficulty.length > 0 && (
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
              🎯 Análisis por Materia
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {subjectDifficulty.map((subject) => (
                <div
                  key={subject.subject}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: colors.gray50,
                    border: `2px solid ${subject.avg_percentage >= 70 ? colors.success : colors.error}`
                  }}
                >
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    margin: '0 0 12px 0',
                    color: colors.gray900
                  }}>
                    {subject.subject}
                  </h3>
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
                  {subject.avg_percentage < 70 && (
                    <div style={{
                      marginTop: '8px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: gradients.error,
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}>
                      ⚠️ Requiere refuerzo
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTA DE ESTUDIANTES */}
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
              👨‍🎓 Estudiantes
            </h2>

            {/* Buscador */}
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: `2px solid ${colors.gray200}`,
                fontSize: '15px',
                width: '300px',
                maxWidth: '100%'
              }}
            />
          </div>

          {/* Tabla de Estudiantes */}
          {filteredStudents.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: '0 12px'
              }}>
                <thead>
                  <tr>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: colors.gray600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Estudiante
                    </th>
                    <th style={{
                      textAlign: 'center',
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: colors.gray600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Exámenes
                    </th>
                    <th style={{
                      textAlign: 'center',
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: colors.gray600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Promedio
                    </th>
                    <th style={{
                      textAlign: 'center',
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: colors.gray600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Mejor
                    </th>
                    <th style={{
                      textAlign: 'center',
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: colors.gray600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Último examen
                    </th>
                    <th style={{
                      textAlign: 'center',
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: colors.gray600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      style={{
                        background: colors.gray50,
                        borderRadius: '12px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <td style={{
                        padding: '16px',
                        borderTopLeftRadius: '12px',
                        borderBottomLeftRadius: '12px'
                      }}>
                        <div style={{ fontWeight: '600', color: colors.gray900, marginBottom: '4px' }}>
                          {student.full_name}
                        </div>
                        <div style={{ fontSize: '13px', color: colors.gray500 }}>
                          {student.email}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>
                        {student.total_exams}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: student.avg_score >= 70 ? colors.success : colors.error
                        }}>
                          {student.avg_score}%
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: colors.success
                        }}>
                          {student.best_score}%
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: colors.gray600 }}>
                        {formatDate(student.last_exam_date)}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'center',
                        borderTopRightRadius: '12px',
                        borderBottomRightRadius: '12px'
                      }}>
                        <button
                          onClick={() => navigate(`/teacher/student/${student.id}`)}
                          style={{
                            padding: '8px 16px',
                            background: gradients.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: colors.gray500
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <p style={{ fontSize: '16px' }}>
                {searchTerm
                  ? 'No se encontraron estudiantes con ese criterio'
                  : 'Aún no hay estudiantes con exámenes completados'}
              </p>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        table tbody tr:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  )
}