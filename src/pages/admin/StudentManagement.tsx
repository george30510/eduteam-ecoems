import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface Student {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  school: string | null
  grade: string | null
  exams_purchased: number
  exams_remaining: number
  free_diagnostic_used: boolean
  created_at: string
}

interface ExamHistory {
  id: string
  exams_granted: number
  staff_id: string
  payment_method: string
  amount_paid: number
  notes: string
  created_at: string
}

export default function StudentManagement() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  // Modal exámenes (sumar/restar)
  const [showExamModal, setShowExamModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [examQuantity, setExamQuantity] = useState(6)

  // Modal crear estudiante
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingStudent, setCreatingStudent] = useState(false)
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    email: '',
    school: '',
    grade: '',
    phone: ''
  })

  // Modal credenciales
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [newStudentCredentials, setNewStudentCredentials] = useState<{
    email: string
    password: string
    name: string
  } | null>(null)

  // Modal historial
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [examHistory, setExamHistory] = useState<ExamHistory[]>([])

  useEffect(() => {
    loadStudents()
    checkUserRole()
  }, [])

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!error && data?.role === 'admin') {
      setIsAdmin(true)
    }
  }

  const handleCreateStudent = async () => {
    if (!newStudent.full_name || !newStudent.email) {
      alert('Nombre y email son obligatorios')
      return
    }

    try {
      setCreatingStudent(true)

      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        'https://sthbucwmyzuzrtknxthn.supabase.co/functions/v1/create-student',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            full_name: newStudent.full_name,
            email: newStudent.email.toLowerCase(),
            school: newStudent.school || null,
            grade: newStudent.grade || null,
            phone: newStudent.phone || null
          })
        }
      )

      const data = await response.json()

      if (!data || !data.success) {
        throw new Error(data?.error || 'Error al crear estudiante')
      }

      // Guardar credenciales y mostrar modal
      setNewStudentCredentials({
        email: data.student.email,
        password: data.student.temp_password,
        name: data.student.full_name
      })
      setShowCredentialsModal(true)
      setShowCreateModal(false)
      setNewStudent({ full_name: '', email: '', school: '', grade: '', phone: '' })
      await loadStudents()

    } catch (error: any) {
      console.error('Error completo:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setCreatingStudent(false)
    }
  }

  const handleUpdateExams = async () => {
    if (!selectedStudent) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const newExamsRemaining = Math.max(0, selectedStudent.exams_remaining + examQuantity)
      const newExamsPurchased = selectedStudent.exams_purchased + (examQuantity > 0 ? examQuantity : 0)

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          exams_remaining: newExamsRemaining,
          exams_purchased: newExamsPurchased
        })
        .eq('id', selectedStudent.id)

      if (updateError) throw updateError

      await supabase
        .from('manual_purchases')
        .insert({
          student_id: selectedStudent.id,
          staff_id: user.id,
          exams_granted: examQuantity,
          payment_method: examQuantity > 0 ? 'efectivo' : 'ajuste',
          amount_paid: examQuantity > 0 ? (examQuantity === 6 ? 150 : examQuantity * 25) : 0,
          notes: examQuantity > 0 ? 'Habilitados manualmente por admin/staff' : 'Ajuste administrativo'
        })

      alert(`✅ Exámenes actualizados: ${examQuantity > 0 ? '+' : ''}${examQuantity}`)
      loadStudents()
      setShowExamModal(false)
      setSelectedStudent(null)
      setExamQuantity(6)
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Copiado al portapapeles')
    }).catch(() => {
      alert('❌ No se pudo copiar. Copia manualmente.')
    })
  }

  const handleResetDiagnostic = async (student: Student) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres habilitar el diagnóstico gratuito para ${student.full_name || student.email}?\n\n` +
      `Esto permitirá al estudiante tomar un nuevo examen diagnóstico sin costo.`
    )

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ free_diagnostic_used: false })
        .eq('id', student.id)

      if (error) throw error

      alert(`✅ Diagnóstico gratuito habilitado para ${student.full_name || student.email}`)
      
      await loadStudents()
      
      if (showHistoryModal && selectedStudent?.id === student.id) {
        const updatedStudent = { ...selectedStudent, free_diagnostic_used: false }
        setSelectedStudent(updatedStudent)
      }
    } catch (error: any) {
      console.error('Error resetting diagnostic:', error)
      alert(`❌ Error al resetear el diagnóstico: ${error.message}`)
    }
  }

  const handleViewHistory = async (student: Student) => {
    try {
      setSelectedStudent(student)
      const { data, error } = await supabase
        .from('manual_purchases')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExamHistory(data || [])
      setShowHistoryModal(true)
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const filteredStudents = students.filter(s =>
    (s.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.school?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid rgba(107, 141, 214, 0.2)',
            borderTop: `4px solid ${colors.primary}`,
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: colors.gray600 }}>Cargando estudiantes...</p>
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
          marginBottom: '32px',
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
              👥 Gestión de Estudiantes
            </h1>
            <p style={{ fontSize: '16px', color: colors.gray600, margin: 0 }}>
              {students.length} estudiantes registrados
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '14px 24px',
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
                ➕ Crear Estudiante
              </button>
            )}

            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '14px 24px',
                background: 'white',
                color: colors.gray700,
                border: `2px solid ${colors.gray200}`,
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
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
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email o escuela..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '16px',
              border: `2px solid ${colors.gray200}`,
              borderRadius: '12px',
              fontSize: '15px',
              boxSizing: 'border-box',
              transition: 'all 0.2s'
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

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray100}`
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
              {students.length}
            </div>
            <div style={{ fontSize: '14px', color: colors.gray600 }}>
              Total Estudiantes
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray100}`
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10B981' }}>
              {students.filter(s => s.exams_remaining > 0).length}
            </div>
            <div style={{ fontSize: '14px', color: colors.gray600 }}>
              Con Exámenes Activos
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${colors.gray100}`
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#F59E0B' }}>
              {students.filter(s => !s.free_diagnostic_used).length}
            </div>
            <div style={{ fontSize: '14px', color: colors.gray600 }}>
              Diagnósticos Disponibles
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          border: `1px solid ${colors.gray100}`
        }}>
          {filteredStudents.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: colors.gray500
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <p style={{ fontSize: '16px', margin: 0 }}>
                No se encontraron estudiantes
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: colors.gray700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Estudiante
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: colors.gray700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Contacto
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: colors.gray700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Exámenes
                    </th>
                    <th style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      color: colors.gray700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Diagnóstico
                    </th>
                    {isAdmin && (
                      <th style={{
                        padding: '16px',
                        textAlign: 'center',
                        fontWeight: '700',
                        fontSize: '13px',
                        color: colors.gray700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      style={{
                        borderBottom: `1px solid ${colors.gray100}`,
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = colors.gray50
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          fontWeight: '600',
                          color: colors.gray900,
                          marginBottom: '4px'
                        }}>
                          {student.full_name || student.email}
                        </div>
                        {student.school && (
                          <div style={{
                            fontSize: '13px',
                            color: colors.gray500
                          }}>
                            📚 {student.school}
                          </div>
                        )}
                        {student.grade && (
                          <div style={{
                            fontSize: '12px',
                            color: colors.gray400
                          }}>
                            Grado: {student.grade}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div style={{
                          fontSize: '14px',
                          color: colors.gray700,
                          marginBottom: '4px'
                        }}>
                          📧 {student.email}
                        </div>
                        {student.phone && (
                          <div style={{
                            fontSize: '13px',
                            color: colors.gray500
                          }}>
                            📱 {student.phone}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: student.exams_remaining > 0 ? '#10B981' : colors.gray400
                        }}>
                          {student.exams_remaining}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: colors.gray500
                        }}>
                          de {student.exams_purchased}
                        </div>
                      </td>

                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: student.free_diagnostic_used ? colors.gray100 : '#DCFCE7',
                          color: student.free_diagnostic_used ? colors.gray600 : '#166534'
                        }}>
                          {student.free_diagnostic_used ? '✓ Usado' : '⭐ Disponible'}
                        </span>
                      </td>

                      {isAdmin && (
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                setSelectedStudent(student)
                                setShowExamModal(true)
                              }}
                              style={{
                                padding: '8px 16px',
                                background: gradients.primary,
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(232, 93, 154, 0.3)',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(232, 93, 154, 0.4)'
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(232, 93, 154, 0.3)'
                              }}
                            >
                              💳 Exámenes
                            </button>
                            <button
                              onClick={() => navigate(`/admin/student-exams/${student.id}`)}
                              style={{
                                padding: '8px 16px',
                                background: 'white',
                                color: colors.gray700,
                                border: `2px solid ${colors.gray200}`,
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
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
                              📜 Historial
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Crear Estudiante */}
        {isAdmin && showCreateModal && (
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
            onClick={() => setShowCreateModal(false)}
          >
            <div
              style={{
                background: 'white',
                padding: '32px',
                borderRadius: '20px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '24px',
                color: colors.gray900
              }}>
                ➕ Crear Nuevo Estudiante
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: colors.gray700
                }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez López"
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: colors.gray700
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="Ej: estudiante@email.com"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: colors.gray700
                }}>
                  Escuela
                </label>
                <input
                  type="text"
                  placeholder="Ej: Preparatoria 5"
                  value={newStudent.school}
                  onChange={(e) => setNewStudent({ ...newStudent, school: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: colors.gray700,
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Grado
                </label>
                <select
                  value={newStudent.grade}
                  onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    background: 'white',
                    color: colors.gray900
                  }}
                >
                  <option value="">Selecciona un grado</option>
                  <option value="3° Secundaria">3° Secundaria</option>
                  <option value="Egresado Secundaria">Egresado de Secundaria</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: colors.gray700
                }}>
                  Teléfono
                </label>
                <input
                  type="text"
                  placeholder="Ej: 5512345678"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCreateStudent}
                  disabled={creatingStudent}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: creatingStudent ? colors.gray300 : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: creatingStudent ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {creatingStudent ? '⏳ Creando...' : '✓ Crear Estudiante'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '14px 24px',
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

        {/* Modal Exámenes (Sumar/Restar) */}
        {isAdmin && showExamModal && selectedStudent && (
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
            onClick={() => {
              setShowExamModal(false)
              setSelectedStudent(null)
              setExamQuantity(6)
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '32px',
                borderRadius: '20px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '8px',
                color: colors.gray900
              }}>
                💳 Modificar Exámenes
              </h3>
              
              <p style={{
                color: colors.gray600,
                marginBottom: '24px',
                fontSize: '15px'
              }}>
                <strong>{selectedStudent.full_name || selectedStudent.email}</strong>
                <br />
                <span style={{ fontSize: '13px' }}>
                  Exámenes actuales: {selectedStudent.exams_remaining}
                </span>
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: colors.gray700
                }}>
                  Cantidad a sumar/restar:
                </label>
                <input
                  type="number"
                  value={examQuantity}
                  onChange={(e) => setExamQuantity(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{
                  fontSize: '13px',
                  color: colors.gray500,
                  margin: '8px 0 0 0'
                }}>
                  💡 Usa números negativos para restar (-6, -3, etc)
                  <br />
                  Precio estimado: ${examQuantity > 0 ? (examQuantity === 6 ? '150' : examQuantity * 25) : '0'} MXN
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleUpdateExams}
                  style={{
                    flex: 1,
                    padding: '14px',
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
                  onClick={() => {
                    setShowExamModal(false)
                    setSelectedStudent(null)
                    setExamQuantity(6)
                  }}
                  style={{
                    padding: '14px 24px',
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

        {/* Modal Historial */}
        {isAdmin && showHistoryModal && selectedStudent && (
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
            onClick={() => {
              setShowHistoryModal(false)
              setSelectedStudent(null)
              setExamHistory([])
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '32px',
                borderRadius: '20px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '8px',
                color: colors.gray900
              }}>
                📜 Historial de Movimientos
              </h3>
              
              <p style={{
                color: colors.gray600,
                marginBottom: '16px',
                fontSize: '15px'
              }}>
                <strong>{selectedStudent.full_name || selectedStudent.email}</strong>
              </p>

              {/* BOTÓN RESETEAR DIAGNÓSTICO */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => handleResetDiagnostic(selectedStudent)}
                  disabled={!selectedStudent.free_diagnostic_used}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: selectedStudent.free_diagnostic_used 
                      ? gradients.success
                      : colors.gray300,
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: selectedStudent.free_diagnostic_used ? 'pointer' : 'not-allowed',
                    opacity: selectedStudent.free_diagnostic_used ? 1 : 0.6,
                    boxShadow: selectedStudent.free_diagnostic_used 
                      ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
                      : 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (selectedStudent.free_diagnostic_used) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedStudent.free_diagnostic_used) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }
                  }}
                >
                  {selectedStudent.free_diagnostic_used 
                    ? '🔄 Resetear Diagnóstico Gratuito' 
                    : '✅ Diagnóstico ya disponible'}
                </button>
                <p style={{
                  fontSize: '12px',
                  color: colors.gray500,
                  margin: '8px 0 0 0',
                  textAlign: 'center'
                }}>
                  {selectedStudent.free_diagnostic_used 
                    ? 'El estudiante podrá tomar un nuevo diagnóstico gratuito' 
                    : 'El estudiante aún no ha usado su diagnóstico gratuito'}
                </p>
              </div>

              {examHistory.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: colors.gray500
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                  <p style={{ fontSize: '16px', margin: 0 }}>
                    Sin movimientos registrados
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                        <th style={{
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '13px',
                          color: colors.gray700
                        }}>
                          Cantidad
                        </th>
                        <th style={{
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '13px',
                          color: colors.gray700
                        }}>
                          Método
                        </th>
                        <th style={{
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '13px',
                          color: colors.gray700
                        }}>
                          Monto
                        </th>
                        <th style={{
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '13px',
                          color: colors.gray700
                        }}>
                          Notas
                        </th>
                        <th style={{
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '13px',
                          color: colors.gray700
                        }}>
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {examHistory.map((h) => (
                        <tr key={h.id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              background: h.exams_granted > 0 ? '#DCFCE7' : '#FEE2E2',
                              color: h.exams_granted > 0 ? '#166534' : '#991B1B'
                            }}>
                              {h.exams_granted > 0 ? '+' : ''}{h.exams_granted}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: colors.gray700 }}>
                            {h.payment_method}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: colors.gray700 }}>
                            ${h.amount_paid}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: colors.gray600 }}>
                            {h.notes}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: colors.gray600 }}>
                            {new Date(h.created_at).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                onClick={() => {
                  setShowHistoryModal(false)
                  setSelectedStudent(null)
                  setExamHistory([])
                }}
                style={{
                  marginTop: '24px',
                  padding: '12px 24px',
                  background: colors.gray100,
                  color: colors.gray700,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal Credenciales del Estudiante Creado */}
        {showCredentialsModal && newStudentCredentials && (
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
            onClick={() => {
              setShowCredentialsModal(false)
              setNewStudentCredentials(null)
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '40px',
                borderRadius: '20px',
                maxWidth: '600px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: colors.gray900,
                  marginBottom: '8px'
                }}>
                  ¡Estudiante Creado!
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: colors.gray600
                }}>
                  {newStudentCredentials.name}
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(107, 141, 214, 0.05) 0%, rgba(52, 183, 200, 0.05) 100%)',
                padding: '24px',
                borderRadius: '16px',
                border: `2px solid ${colors.primary}`,
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: colors.gray600,
                  margin: '0 0 16px 0',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  📧 Email
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <input
                    type="text"
                    value={newStudentCredentials.email}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: `2px solid ${colors.gray200}`,
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      background: 'white',
                      color: colors.gray900
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(newStudentCredentials.email)}
                    style={{
                      padding: '12px 20px',
                      background: gradients.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📋 Copiar
                  </button>
                </div>

                <p style={{
                  fontSize: '14px',
                  color: colors.gray600,
                  margin: '0 0 16px 0',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  🔑 Contraseña Temporal
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={newStudentCredentials.password}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: `2px solid ${colors.gray200}`,
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      background: 'white',
                      color: colors.gray900,
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(newStudentCredentials.password)}
                    style={{
                      padding: '12px 20px',
                      background: gradients.success,
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📋 Copiar
                  </button>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.1))',
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${colors.warning}`,
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: colors.gray700,
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  ⚠️ <strong>Importante:</strong> Comparte esta contraseña con el estudiante. 
                  El estudiante debe registrarse en la plataforma usando el email y esta contraseña temporal.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    copyToClipboard(
                      `Email: ${newStudentCredentials.email}\nContraseña: ${newStudentCredentials.password}`
                    )
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: gradients.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copiar Todo
                </button>
                <button
                  onClick={() => {
                    setShowCredentialsModal(false)
                    setNewStudentCredentials(null)
                  }}
                  style={{
                    padding: '14px 24px',
                    background: colors.gray100,
                    color: colors.gray700,
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
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
    </div>
  )
}