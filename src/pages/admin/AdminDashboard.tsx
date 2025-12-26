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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
            {/* ✅ NUEVO: Botón Gestionar Estudiantes */}
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
                  {filteredStudents.map((student, index) => (
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