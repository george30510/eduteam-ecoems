import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface ExamHistory {
  id: string
  exam_type: string
  completed_at: string
  score: number
  total_questions: number
  percentage: number
}

export default function StudentDashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<any>(null)
  const [profileMissing, setProfileMissing] = useState(false)
  const [exams, setExams] = useState<ExamHistory[]>([])
  const [loading, setLoading] = useState(true)

  /* =============================
     AUTH + PROFILE
  ============================== */
  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      navigate('/')
      return
    }

    const user = session.user

    const { data: profileData, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // PERFIL NO EXISTE AÚN
    if (error || !profileData) {
      setProfile(null)
      setProfileMissing(true)
      setLoading(false)
      return
    }

    // 👉 REDIRECCIÓN ADMIN
    if (profileData.role === 'admin') {
      navigate('/admin')
      setLoading(false)
      return
    }

    // ALUMNO NORMAL
    setProfile(profileData)
    setProfileMissing(false)
    await loadExams(user.id)
    setLoading(false)
  }

  /* =============================
     LOAD EXAMS
  ============================== */
  const loadExams = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('generated_exams')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      setExams(data || [])
    } catch (error) {
      console.error('Error loading exams:', error)
    }
  }

  /* =============================
     LOGOUT
  ============================== */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  /* =============================
     LOADING
  ============================== */
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
            Cargando tu dashboard...
          </p>
        </div>
      </div>
    )
  }

  // PROTECCIÓN EXTRA (por si acaso)
  if (profile?.role === 'admin') {
    return null
  }

  /* =============================
     UI
  ============================== */
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FCFF 100%)' }}>

      {/* HEADER */}
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
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="/logo-eduteam.png" alt="Eduteam" style={{ height: '42px' }} />
            <div style={{ width: '2px', height: '40px', background: colors.gray200 }} />
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                background: gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                Simulador ECOEMS
              </h1>
              <p style={{ color: colors.gray500, fontSize: '14px', margin: 0 }}>
                Tu preparación para el examen
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: colors.gray50,
              border: `1px solid ${colors.gray200}`
            }}>
              👋 {profile?.full_name ?? 'Bienvenido'}
            </div>
            <button onClick={handleLogout} style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: `2px solid ${colors.gray200}`,
              background: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              🚪 Salir
            </button>
          </div>
        </div>
      </header>

      {/* PERFIL NO LISTO */}
      {profileMissing && (
        <div style={{
          margin: '24px auto',
          maxWidth: '1400px',
          padding: '20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.15))',
          border: '2px solid #F59E0B',
          display: 'flex',
          gap: '16px'
        }}>
          <div style={{ fontSize: '32px' }}>⚙️</div>
          <div>
            <h3 style={{ margin: 0, fontWeight: '700' }}>
              Estamos preparando tu perfil
            </h3>
            <p style={{ margin: 0 }}>
              Puedes comenzar tu diagnóstico mientras terminamos la configuración.
            </p>
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>

        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '32px', margin: 0 }}>
            ¡Bienvenido, {profile?.full_name?.split(' ')[0] ?? 'Alumno'}! 👋
          </h2>
          <p style={{ color: colors.gray600 }}>
            Tienes <strong>{profile?.exams_remaining ?? 0}</strong> exámenes disponibles
          </p>
        </div>

        {profile && !profile.free_diagnostic_used && (
          <button
            onClick={() => navigate('/exam/diagnostic')}
            style={{
              padding: '18px 32px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white',
              border: 'none',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            🚀 Iniciar diagnóstico gratuito
          </button>
        )}

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
