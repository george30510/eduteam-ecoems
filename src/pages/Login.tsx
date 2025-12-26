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
  setLoading(true)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    if (!data.user) throw new Error('No se pudo iniciar sesión')

    // ✅ LOGIN EXITOSO → SIEMPRE DASHBOARD
    const userId = data.user.id

const { data: profile, error: profileError } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('id', userId)
  .single()

if (profileError) {
  throw new Error('No se pudo cargar el perfil del usuario')
}

if (profile.role === 'admin') {
  navigate('/admin')
} else {
  navigate('/dashboard')
}


  } catch (err: any) {
    if (err.message.includes('Invalid login credentials')) {
      setError('Email o contraseña incorrectos')
    } else if (err.message.includes('Email not confirmed')) {
      setError('Por favor verifica tu correo antes de iniciar sesión')
    } else {
      setError(err.message || 'Error al iniciar sesión')
    }
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


