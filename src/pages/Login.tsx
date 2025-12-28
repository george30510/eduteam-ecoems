import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { gradients, colors } from '../styles/theme'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  if (!email || !password) {
    setError('Por favor ingresa email y contraseña')
    return
  }

  setLoading(true)

  try {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (signInError) {
      console.error('Error de login:', signInError)

      // Mensajes de error específicos
      if (signInError.message.includes('Email not confirmed')) {
        setError(
          '📧 Debes confirmar tu email antes de iniciar sesión. ' +
          'Revisa tu correo (incluyendo spam) y haz clic en el link de confirmación.'
        )
        return
      }

      if (signInError.message.includes('Invalid login credentials')) {
        setError('❌ Email o contraseña incorrectos. Verifica tus datos.')
        return
      }

      if (signInError.message.includes('Email not found')) {
        setError(
          '❌ No existe una cuenta con este email. ' +
          'Si un administrador te creó la cuenta, primero debes registrarte en "Crear cuenta".'
        )
        return
      }

      if (signInError.message.includes('User not found')) {
        setError(
          '❌ Usuario no encontrado. ' +
          'Si recibiste credenciales de un administrador, primero debes registrarte.'
        )
        return
      }

      // Error genérico
      setError(`Error al iniciar sesión: ${signInError.message}`)
      return
    }

    if (!data.user) {
      setError('Error inesperado. Intenta nuevamente.')
      return
    }

    // Verificar rol del usuario
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Error al obtener perfil:', profileError)
      setError('Error al cargar tu perfil. Contacta a soporte.')
      return
    }

    // Redirigir según el rol
    if (profile?.role === 'admin') {
      navigate('/admin')
    } else if (profile?.role === 'teacher') {
      navigate('/teacher')
    } else {
      navigate('/dashboard')
    }

  } catch (err: any) {
    console.error('Error inesperado:', err)
    setError('Error de conexión. Verifica tu internet e intenta nuevamente.')
  } finally {
    setLoading(false)
  }
}


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: gradients.hero,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '48px 40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxWidth: '440px',
        width: '100%'
      }}>
        {/* LOGO Y TEXTO */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo-eduteam.png"
            alt="Eduteam"
            style={{ height: '50px', marginBottom: '16px' }}
          />
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: colors.gray900,
            marginBottom: '8px'
          }}>
            Simulador ECOEMS
          </h1>
          <p style={{
            fontSize: '15px',
            color: colors.gray600,
            lineHeight: '1.6'
          }}>
            Inicia sesión para comenzar tu preparación
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `2px solid ${colors.gray200}`,
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `2px solid ${colors.gray200}`,
                fontSize: '16px'
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '14px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

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
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Iniciando sesión…' : '🚀 Iniciar sesión'}
          </button>
        </form>

        {/* LINKS */}
        <p style={{
          textAlign: 'center',
          fontSize: '15px',
          color: colors.gray600,
          marginTop: '20px'
        }}>
          ¿No tienes cuenta?{' '}
          <button
            onClick={() => navigate('/register')}
            style={{
              background: 'none',
              border: 'none',
              color: colors.primary,
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Regístrate gratis
          </button>
        </p>

        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: colors.gray600,
          marginTop: '12px'
        }}>
          <button
            onClick={() => navigate('/forgot-password')}
            style={{
              background: 'none',
              border: 'none',
              color: colors.primary,
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </p>
      </div>
    </div>
  )
}


