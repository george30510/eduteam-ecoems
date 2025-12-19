import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors, gradients } from '../styles/theme'

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    school: '',
    grade: '',
    password: '',
    confirmPassword: ''
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validaciones
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Por favor completa los campos obligatorios')
      return
    }
    
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Ingresa un email válido')
      return
    }

    setLoading(true)

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario')

      // 2. Crear perfil de usuario
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          school: formData.school || null,
          grade: formData.grade || null,
          role: 'student',
          exams_purchased: 0,
          exams_remaining: 0,
          free_diagnostic_used: false
        }])

      if (profileError) throw profileError

      setSuccess(true)
      
      // Esperar 2 segundos y redirigir
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)

    } catch (err: any) {
      console.error('Error:', err)
      if (err.message.includes('already registered')) {
        setError('Este email ya está registrado. Intenta iniciar sesión.')
      } else {
        setError(err.message || 'Error al crear cuenta')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
          }}>
            ✓
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '0 0 16px 0',
            color: colors.gray900
          }}>
            ¡Cuenta Creada!
          </h2>
          <p style={{
            fontSize: '16px',
            color: colors.gray600,
            margin: 0
          }}>
            Redirigiendo a tu dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        background: 'white',
        padding: '48px',
        borderRadius: '24px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img 
            src="/logo-eduteam.png" 
            alt="Eduteam" 
            style={{ height: '50px', marginBottom: '24px' }} 
          />
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            background: gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 12px 0'
          }}>
            Crear Cuenta
          </h1>
          <p style={{
            fontSize: '16px',
            color: colors.gray600,
            margin: 0
          }}>
            Comienza tu preparación para el ECOEMS
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '2px solid #FCA5A5',
            color: '#991B1B',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '15px',
            fontWeight: '600'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Beneficio del diagnóstico gratis */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)',
          border: '2px solid #10B981',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '28px' }}>🎁</span>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: colors.gray900,
              margin: 0
            }}>
              ¡Examen Diagnóstico GRATIS!
            </h3>
          </div>
          <p style={{
            fontSize: '15px',
            color: colors.gray700,
            margin: 0
          }}>
            Al registrarte recibes un examen diagnóstico de 30 preguntas completamente gratis para evaluar tu nivel.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.gray700,
              fontSize: '14px'
            }}>
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ej: María González"
              style={{
                width: '100%',
                padding: '14px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '12px',
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.gray700,
              fontSize: '14px'
            }}>
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@email.com"
              style={{
                width: '100%',
                padding: '14px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '12px',
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: colors.gray600,
                fontSize: '14px'
              }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="5512345678"
                style={{
                  width: '100%',
                  padding: '14px',
                  border: `2px solid ${colors.gray200}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: colors.gray600,
                fontSize: '14px'
              }}>
                Grado
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: `2px solid ${colors.gray200}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Selecciona...</option>
                <option value="3ro Secundaria">3ro Secundaria</option>
                <option value="Preparatoria">Preparatoria</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.gray600,
              fontSize: '14px'
            }}>
              Escuela
            </label>
            <input
              type="text"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              placeholder="Nombre de tu escuela"
              style={{
                width: '100%',
                padding: '14px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '12px',
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.gray700,
              fontSize: '14px'
            }}>
              Contraseña *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              style={{
                width: '100%',
                padding: '14px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '12px',
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.gray700,
              fontSize: '14px'
            }}>
              Confirmar Contraseña *
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Repite tu contraseña"
              style={{
                width: '100%',
                padding: '14px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '12px',
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? colors.gray400 : gradients.primary,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(232, 93, 154, 0.3)',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Creando cuenta...' : '🚀 Crear Cuenta'}
          </button>

          <p style={{
            textAlign: 'center',
            fontSize: '15px',
            color: colors.gray600,
            margin: 0
          }}>
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: colors.primary,
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Inicia sesión
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}