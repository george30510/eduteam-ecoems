import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors, gradients } from '../styles/theme'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error al enviar email de recuperación')
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
            ¡Email Enviado!
          </h2>
          <p style={{
            fontSize: '16px',
            color: colors.gray600,
            margin: '0 0 24px 0',
            lineHeight: '1.6'
          }}>
            Revisa tu correo <strong>{email}</strong> y sigue las instrucciones para restablecer tu contraseña.
          </p>
          <p style={{
            fontSize: '14px',
            color: colors.gray500,
            margin: '0 0 32px 0',
            fontStyle: 'italic'
          }}>
            Si no ves el email, revisa tu carpeta de spam
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '14px 28px',
              background: gradients.primary,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(232, 93, 154, 0.3)'
            }}
          >
            Volver al Login
          </button>
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
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '48px',
        borderRadius: '24px',
        maxWidth: '500px',
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
            margin: '0 0 12px 0',
            color: colors.gray900
          }}>
            Recuperar Contraseña
          </h1>
          <p style={{
            fontSize: '16px',
            color: colors.gray600,
            margin: 0
          }}>
            Ingresa tu email y te enviaremos instrucciones
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

        {/* Form */}
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.gray700,
              fontSize: '14px'
            }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? 'Enviando...' : '📧 Enviar Email de Recuperación'}
          </button>

          <p style={{
            textAlign: 'center',
            fontSize: '15px',
            color: colors.gray600,
            margin: 0
          }}>
            ¿Recordaste tu contraseña?{' '}
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