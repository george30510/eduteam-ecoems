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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) throw new Error('Usuario sin perfil')

      if (profile.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Error al hacer login')
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
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Circles decoration */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        left: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        right: '-150px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        filter: 'blur(60px)'
      }} />

      <div style={{ 
        backgroundColor: 'white',
        padding: '48px 40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="/logo-eduteam.png" 
            alt="Eduteam" 
            style={{ 
              height: '50px',
              marginBottom: '16px'
            }} 
          />
 <h1 style={{ 
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '16px 0 8px 0',
  color: colors.gray900
}}>
  Simulador ECOEMS
</h1>
<p style={{
  fontSize: '15px',
  color: colors.gray600,
  margin: 0,
  lineHeight: '1.6'
}}>
  Inicia sesión para comenzar tu preparación
</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.gray700,
              fontSize: '14px'
            }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.email@ejemplo.com"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(107, 141, 214, 0.1)`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.gray200
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.gray700,
              fontSize: '14px'
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: `2px solid ${colors.gray200}`,
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(107, 141, 214, 0.1)`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.gray200
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '14px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '500'
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
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(232, 93, 154, 0.3)',
              transform: loading ? 'none' : 'translateY(0)'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(232, 93, 154, 0.4)'
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(232, 93, 154, 0.3)'
              }
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Iniciando sesión...
              </span>
            ) : (
              '🚀 Iniciar Sesión'
            )}
          </button>
          <p style={{
  textAlign: 'center',
  fontSize: '15px',
  color: colors.gray600,
  margin: '20px 0 0 0'
}}>
  ¿No tienes cuenta?{' '}
  <button
    type="button"
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
  margin: '16px 0 0 0'
}}>
  <button
    type="button"
    onClick={() => navigate('/forgot-password')}
    style={{
      background: 'none',
      border: 'none',
      color: colors.primary,
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontSize: '14px'
    }}
  >
    ¿Olvidaste tu contraseña?
  </button>
</p>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: `1px solid ${colors.gray200}`,
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '13px',
            color: colors.gray500,
            margin: '0 0 8px 0'
          }}>
            Usuario de prueba:
          </p>
          <p style={{
            fontSize: '14px',
            color: colors.gray700,
            margin: 0,
            fontWeight: '600'
          }}>
            admin@eduteam.com
          </p>
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