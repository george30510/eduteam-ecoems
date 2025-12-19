import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { colors, gradients } from '../styles/theme'

export default function Purchase() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Cargar usuario actual
  useState(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    loadUser()
  })

  const handleStripeCheckout = async () => {
    setLoading(true)
    
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Debes iniciar sesión para comprar')
        navigate('/')
        return
      }

      // Obtener email del perfil
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single()

      // Guardar intento de compra
      const { data: purchase } = await supabase
        .from('purchase_attempts')
        .insert({
          user_id: user.id,
          email: profile?.email || user.email,
          package: '6_exams',
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      // Redirigir a Stripe con metadata
      const stripeUrl = `https://buy.stripe.com/00w9AT3yfbPQ2fXfwNe3e0f?prefilled_email=${encodeURIComponent(profile?.email || user.email || '')}&client_reference_id=${user.id}`
      
      window.location.href = stripeUrl
      
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar compra. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleTransferPayment = () => {
    // Abrir modal o página con información de transferencia
    alert('Próximamente: Información de transferencia bancaria')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <img 
            src="/logo-eduteam.png" 
            alt="Eduteam" 
            style={{ height: '50px', marginBottom: '24px' }} 
          />
          <h1 style={{
            fontSize: '40px',
            fontWeight: 'bold',
            background: gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 16px 0'
          }}>
            Paquetes de Exámenes
          </h1>
          <p style={{
            fontSize: '18px',
            color: colors.gray600,
            margin: 0
          }}>
            Prepárate para el ECOEMS con nuestros simuladores
          </p>
        </div>

        {/* Paquete Principal */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '32px',
          marginBottom: '48px'
        }}>
          {/* Paquete de 6 Exámenes */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            border: `3px solid ${colors.primary}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Badge "Más Popular" */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '-35px',
              background: gradients.primary,
              color: 'white',
              padding: '8px 50px',
              transform: 'rotate(45deg)',
              fontSize: '13px',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(232, 93, 154, 0.4)'
            }}>
              MÁS POPULAR
            </div>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                📚
              </div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                color: colors.gray900
              }}>
                Paquete Estándar
              </h2>
              <p style={{
                fontSize: '16px',
                color: colors.gray600,
                margin: 0
              }}>
                6 Exámenes Completos
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              marginBottom: '32px',
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(107, 141, 214, 0.08) 0%, rgba(52, 183, 200, 0.08) 100%)',
              borderRadius: '16px'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                background: gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px'
              }}>
                $150 MXN
              </div>
              <div style={{
                fontSize: '14px',
                color: colors.gray600,
                fontWeight: '600'
              }}>
                $25 MXN por examen
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: colors.gray900,
                marginBottom: '16px'
              }}>
                ✨ Incluye:
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {[
                  '6 exámenes completos de 128 preguntas',
                  'Simulación real del ECOEMS',
                  'Cronómetro de 3 horas por examen',
                  'Resultados detallados por materia',
                  'Recomendaciones personalizadas',
                  'Acceso inmediato después del pago'
                ].map((item, i) => (
                  <li key={i} style={{
                    fontSize: '15px',
                    color: colors.gray700,
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'start'
                  }}>
                    <span style={{ color: '#10B981', fontSize: '18px' }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleStripeCheckout}
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                background: loading ? colors.gray400 : gradients.primary,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '17px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(232, 93, 154, 0.3)',
                marginBottom: '12px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {loading ? 'Procesando...' : '💳 Pagar con Tarjeta'}
            </button>

            <p style={{
              fontSize: '13px',
              color: colors.gray500,
              textAlign: 'center',
              margin: 0
            }}>
              🔒 Pago seguro con Stripe
            </p>
          </div>

          {/* Opción de Transferencia */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: `1px solid ${colors.gray200}`
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                🏦
              </div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                color: colors.gray900
              }}>
                Transferencia Bancaria
              </h2>
              <p style={{
                fontSize: '16px',
                color: colors.gray600,
                margin: 0
              }}>
                6 Exámenes Completos
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              marginBottom: '32px',
              padding: '24px',
              background: colors.gray50,
              borderRadius: '16px'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: colors.gray900,
                marginBottom: '8px'
              }}>
                $150 MXN
              </div>
              <div style={{
                fontSize: '14px',
                color: colors.gray600,
                fontWeight: '600'
              }}>
                Mismo precio
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)',
              border: '2px solid #F59E0B',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: colors.gray900,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠️ Proceso Manual
              </h3>
              <p style={{
                fontSize: '14px',
                color: colors.gray700,
                margin: 0,
                lineHeight: '1.6'
              }}>
                La activación puede tardar <strong>hasta 24 horas</strong> después de enviar el comprobante por WhatsApp.
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: colors.gray900,
                marginBottom: '16px'
              }}>
                📋 Pasos:
              </h3>
              <ol style={{
                paddingLeft: '20px',
                margin: 0
              }}>
                <li style={{
                  fontSize: '15px',
                  color: colors.gray700,
                  marginBottom: '12px',
                  lineHeight: '1.6'
                }}>
                  Llena el formulario con tus datos
                </li>
                <li style={{
                  fontSize: '15px',
                  color: colors.gray700,
                  marginBottom: '12px',
                  lineHeight: '1.6'
                }}>
                  Te mostraremos la cuenta CLABE
                </li>
                <li style={{
                  fontSize: '15px',
                  color: colors.gray700,
                  marginBottom: '12px',
                  lineHeight: '1.6'
                }}>
                  Realiza la transferencia
                </li>
                <li style={{
                  fontSize: '15px',
                  color: colors.gray700,
                  lineHeight: '1.6'
                }}>
                  Envía comprobante por WhatsApp
                </li>
              </ol>
            </div>

            <button
              onClick={handleTransferPayment}
              style={{
                width: '100%',
                padding: '18px',
                background: 'white',
                color: colors.gray700,
                border: `2px solid ${colors.gray300}`,
                borderRadius: '12px',
                fontSize: '17px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = colors.gray400
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = colors.gray300
              }}
            >
              📝 Ver Datos de Transferencia
            </button>
          </div>
        </div>

        {/* Beneficios */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            textAlign: 'center',
            margin: '0 0 32px 0',
            color: colors.gray900
          }}>
            ¿Por qué elegir nuestros simuladores?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            {[
              { icon: '🎯', title: 'Simulación Real', desc: 'Estructura exacta del ECOEMS oficial' },
              { icon: '⏱️', title: 'Cronómetro Real', desc: '3 horas como en el examen real' },
              { icon: '📊', title: 'Análisis Detallado', desc: 'Resultados por materia y recomendaciones' },
              { icon: '🔄', title: 'Sin Límite de Tiempo', desc: 'Usa tus exámenes cuando quieras' }
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '24px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                  {item.icon}
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: '0 0 8px 0',
                  color: colors.gray900
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: colors.gray600,
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => user ? navigate('/dashboard') : navigate('/')}
            style={{
              padding: '14px 28px',
              background: 'white',
              color: colors.gray700,
              border: `2px solid ${colors.gray200}`,
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Volver
          </button>
        </div>
      </div>
    </div>
  )
}