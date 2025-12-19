import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors, gradients } from '../styles/theme'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error al actualizar contraseña')
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
            ¡Contraseña Actualizada!
          </h2>
          <p style={{
            fontSize: '16px',
            color: colors.gray600,
            margin: 0
          }}>
            Redirigiendo al login...
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
            Nueva Contraseña
          </h1>
          <p style={{
            fontSize: '16px',
            color: colors.gray600,
            margin: 0
          }}>
            Ingresa tu nueva contraseña
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
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: colors.gray700,
              fontSize: '14px'
            }}>
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Confirmar Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              boxShadow: loading ? 'none' : '0 4px 12px rgba(232, 93, 154, 0.3)'
            }}
          >
            {loading ? 'Actualizando...' : '🔒 Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}