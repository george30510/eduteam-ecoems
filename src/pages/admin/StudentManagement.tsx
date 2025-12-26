import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface Student {
  id: string
  full_name: string | null  // ✅ Permitir null
  email: string
  phone: string | null
  school: string | null
  grade: string | null
  exams_purchased: number
  exams_remaining: number
  free_diagnostic_used: boolean
  created_at: string
}

export default function StudentManagement() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showEnableModal, setShowEnableModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [examQuantity, setExamQuantity] = useState(6)

  useEffect(() => {
    loadStudents()
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
  

  const handleEnableExams = async () => {
    if (!selectedStudent) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      console.log('Habilitando exámenes...')
      console.log('Student:', selectedStudent.id)
      console.log('Quantity:', examQuantity)

      // Actualizar exámenes del estudiante
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          exams_remaining: selectedStudent.exams_remaining + examQuantity,
          exams_purchased: selectedStudent.exams_purchased + examQuantity
        })
        .eq('id', selectedStudent.id)

      if (updateError) throw updateError

      // Registrar compra manual
      const { error: purchaseError } = await supabase
        .from('manual_purchases')
        .insert({
          student_id: selectedStudent.id,
          staff_id: user.id,
          exams_granted: examQuantity,
          payment_method: 'efectivo',
          amount_paid: examQuantity === 6 ? 150 : (examQuantity * 25),
          notes: `Habilitados manualmente por admin/staff`
        })

      if (purchaseError) {
        console.warn('Error registrando compra:', purchaseError)
        // No lanzar error, lo importante es que se habilitaron los exámenes
      }

      alert(`✅ ${examQuantity} exámenes habilitados exitosamente`)
      loadStudents()
      setShowEnableModal(false)
      setSelectedStudent(null)
      setExamQuantity(6)
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const filteredStudents = students.filter(s =>
  (s.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
  s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              cursor: 'pointer'
            }}
          >
            ← Volver al Dashboard
          </button>
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
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Stats rápidos */}
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
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
                          {student.full_name || 'Sin nombre'}
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

                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedStudent(student)
                            setShowEnableModal(true)
                          }}
                          style={{
                            padding: '10px 20px',
                            background: gradients.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
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
                          💳 Habilitar Exámenes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Habilitar Exámenes */}
        {showEnableModal && selectedStudent && (
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
            onClick={() => setShowEnableModal(false)}
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
                💳 Habilitar Exámenes
              </h3>
              
              <p style={{
                color: colors.gray600,
                marginBottom: '24px',
                fontSize: '15px'
              }}>
                <strong>{selectedStudent.full_name || selectedStudent.email}</strong>
                <br />
                <span style={{ fontSize: '13px' }}>
                  Actualmente tiene {selectedStudent.exams_remaining} exámenes disponibles
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
                  Cantidad de exámenes:
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={examQuantity}
                  onChange={(e) => setExamQuantity(parseInt(e.target.value) || 1)}
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
                  Precio estimado: ${examQuantity === 6 ? '150' : examQuantity * 25} MXN
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={handleEnableExams}
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
                  ✓ Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowEnableModal(false)
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