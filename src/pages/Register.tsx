import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { gradients, colors } from '../styles/theme'

export default function Register() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    setSuccess('')

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

    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone || null,
            school: formData.school || null,
            grade: formData.grade || null
          }
        }
      })

      if (authError) throw authError

      setSuccess(
        'Registro exitoso 🎉 Revisa tu correo para confirmar tu cuenta y luego inicia sesión.'
      )

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        school: '',
        grade: '',
        password: '',
        confirmPassword: ''
      })

      setTimeout(() => {
        navigate('/')
      }, 2000)

    } catch (err: any) {
      console.error(err)

      if (err.message?.includes('already registered')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.')
      } else if (err.message?.includes('rate limit')) {
        setError('Demasiados intentos. Intenta más tarde.')
      } else {
        setError('No se pudo crear la cuenta. Intenta nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: gradients.hero,
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '48px 40px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          maxWidth: '440px',
          width: '100%'
        }}
      >
        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo-eduteam.png"
            alt="Eduteam"
            style={{ height: '50px', marginBottom: '16px' }}
          />
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: colors.gray900,
              marginBottom: '8px'
            }}
          >
            Crear cuenta
          </h1>
          <p style={{ fontSize: '15px', color: colors.gray600 }}>
            Comienza tu preparación para el ECOEMS
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '14px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '14px'
            }}
          >
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '2px solid #10B981',
              color: '#065F46',
              padding: '14px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '15px',
              fontWeight: 600
            }}
          >
            {success}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Nombre completo"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            style={inputStyle}
          />

          <input
            type="tel"
            placeholder="Teléfono (opcional)"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Escuela (opcional)"
            value={formData.school}
            onChange={(e) =>
              setFormData({ ...formData, school: e.target.value })
            }
            style={inputStyle}
          />

          <select
  value={formData.grade}
  onChange={(e) =>
    setFormData({ ...formData, grade: e.target.value })
  }
  style={inputStyle}
>
  <option value="">Selecciona tu grado</option>
  <option value="3° Secundaria">3° Secundaria</option>
  <option value="Egresado Secundaria">Egresado de Secundaria</option>
  <option value="Otro">Otro</option>
</select>

          <input
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            required
            style={{ ...inputStyle, marginBottom: '20px' }}
          />

          <button
            type="submit"
            disabled={loading || !!success}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? colors.gray400 : gradients.primary,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creando cuenta…' : '🚀 Crear cuenta'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: '15px',
            color: colors.gray600,
            marginTop: '20px'
          }}
        >
          ¿Ya tienes cuenta?{' '}
          <button
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
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '12px',
  border: `2px solid ${colors.gray200}`,
  fontSize: '16px',
  marginBottom: '16px'
}
