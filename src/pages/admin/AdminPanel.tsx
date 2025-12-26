import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface Question {
  id: number
  subject: string
  subtopic: string
  question_text: string
}

const subjects = {
  Matemáticas: ['Álgebra', 'Geometría', 'Trigonometría', 'Otro'],
  Física: ['Mecánica', 'Óptica', 'Electromagnetismo', 'Otro'],
  Química: ['Inorgánica', 'Orgánica', 'Física', 'Otro'],
  Biología: ['Botánica', 'Zoología', 'Genética', 'Otro'],
  Otro: ['Otro']
}

export default function AdminPanel() {
  /* =====================
     ALTA RÁPIDA DE ALUMNO
  ===================== */
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [creatingStudent, setCreatingStudent] = useState(false)
  const [studentMessage, setStudentMessage] = useState('')

  const handleCreateStudent = async () => {
    if (!studentName) {
      setStudentMessage('⚠️ El nombre es obligatorio')
      return
    }

    setCreatingStudent(true)
    setStudentMessage('')

    try {
      const email =
        studentEmail || `alumno_${Date.now()}@interno.local`

      const { error } = await supabase.auth.admin.createUser({
        email,
        password: 'Inicio123!',
        email_confirm: true,
        user_metadata: {
          full_name: studentName
        }
      })

      if (error) throw error

      setStudentMessage(
        `✅ Alumno creado. Email: ${email} / Contraseña: Inicio123!`
      )
      setStudentName('')
      setStudentEmail('')
    } catch (err: any) {
      setStudentMessage(err.message || 'Error al crear alumno')
    } finally {
      setCreatingStudent(false)
    }
  }

  /* =====================
     GESTIÓN DE PREGUNTAS
  ===================== */
  const [subject, setSubject] = useState('Matemáticas')
  const [subtopic, setSubtopic] = useState('Álgebra')
  const [questionText, setQuestionText] = useState('')
  const [explanationText, setExplanationText] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('question_bank')
      .select('*')
      .order('id', { ascending: true })

    setQuestions(data || [])
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  const handleSaveQuestion = async () => {
    if (!questionText) return

    setLoading(true)
    await supabase.from('question_bank').insert([
      {
        subject,
        topic: subject,
        subtopic,
        difficulty: 'medium',
        purpose: 'diagnostic',
        question_text: questionText,
        explanation_text: explanationText,
        status: 'approved'
      }
    ])

    setQuestionText('')
    setExplanationText('')
    fetchQuestions()
    setLoading(false)
  }

  /* =====================
     UI
  ===================== */
  return (
    <div style={{ minHeight: '100vh', background: gradients.hero, padding: '40px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>
        Panel de Administración
      </h1>

      {/* =====================
         ALTA RÁPIDA DE ALUMNO
      ===================== */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>🧑‍🎓 Alta rápida de alumno</h2>

        <input
          placeholder="Nombre completo"
          value={studentName}
          onChange={e => setStudentName(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Correo (opcional)"
          value={studentEmail}
          onChange={e => setStudentEmail(e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={handleCreateStudent}
          disabled={creatingStudent}
          style={primaryButton}
        >
          {creatingStudent ? 'Creando...' : 'Crear alumno'}
        </button>

        {studentMessage && (
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            {studentMessage}
          </p>
        )}
      </section>

      {/* =====================
         CREAR PREGUNTA
      ===================== */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>📚 Crear pregunta</h2>

        <select
          value={subject}
          onChange={e => {
            setSubject(e.target.value)
            setSubtopic(subjects[e.target.value][0])
          }}
          style={inputStyle}
        >
          {Object.keys(subjects).map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select
          value={subtopic}
          onChange={e => setSubtopic(e.target.value)}
          style={inputStyle}
        >
          {subjects[subject].map(st => (
            <option key={st}>{st}</option>
          ))}
        </select>

        <textarea
          placeholder="Pregunta"
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          style={{ ...inputStyle, height: '100px' }}
        />

        <textarea
          placeholder="Explicación"
          value={explanationText}
          onChange={e => setExplanationText(e.target.value)}
          style={{ ...inputStyle, height: '100px' }}
        />

        <button
          onClick={handleSaveQuestion}
          style={primaryButton}
        >
          {loading ? 'Guardando...' : 'Guardar pregunta'}
        </button>
      </section>

      {/* =====================
         LISTA DE PREGUNTAS
      ===================== */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>🗂 Preguntas existentes</h2>

        <ul>
          {questions.map(q => (
            <li key={q.id}>
              [{q.subject} - {q.subtopic}] {q.question_text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/* =====================
   ESTILOS REUTILIZABLES
===================== */
const cardStyle = {
  background: 'white',
  padding: '24px',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  marginBottom: '32px',
  maxWidth: '900px'
}

const sectionTitle = {
  fontSize: '20px',
  fontWeight: '700',
  marginBottom: '16px'
}

const inputStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '10px',
  border: `2px solid ${colors.gray200}`,
  fontSize: '15px',
  marginBottom: '14px'
}

const primaryButton = {
  padding: '14px 24px',
  borderRadius: '12px',
  border: 'none',
  background: gradients.primary,
  color: 'white',
  fontWeight: '700',
  cursor: 'pointer'
}
