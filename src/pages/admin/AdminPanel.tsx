import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { colors, gradients } from '../../styles/theme'

interface Question {
  id: number
  subject: string
  topic: string
  subtopic: string
  difficulty: string
  purpose: string
  question_text: string
  explanation_text: string
  image_url?: string
}

const subjects = {
  'Matemáticas': ['Álgebra', 'Geometría', 'Trigonometría', 'Otro'],
  'Física': ['Mecánica', 'Óptica', 'Electromagnetismo', 'Otro'],
  'Química': ['Inorgánica', 'Orgánica', 'Física', 'Otro'],
  'Biología': ['Botánica', 'Zoología', 'Genética', 'Otro'],
  'Otro': ['Otro'],
}

export default function AdminPanel() {
  const [subject, setSubject] = useState('Matemáticas')
  const [subtopic, setSubtopic] = useState('Álgebra')
  const [questionText, setQuestionText] = useState('')
  const [explanationText, setExplanationText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar preguntas existentes
  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('question_bank')
      .select('*')
      .order('id', { ascending: true })
    if (error) console.log(error)
    else setQuestions(data as Question[])
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  // Subir imagen a Supabase Storage (o Cloudflare)
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null
    const fileName = `${Date.now()}_${imageFile.name}`
    const { error } = await supabase.storage
      .from('question-images')
      .upload(fileName, imageFile)
    if (error) {
      console.log(error)
      return null
    }
    const { data } = supabase.storage.from('question-images').getPublicUrl(fileName)
    return data?.publicUrl ?? null
  }

  // Guardar pregunta
  const handleSave = async () => {
    setLoading(true)
    let imageUrl = null
    if (imageFile) {
      imageUrl = await uploadImage()
    }
    const { error } = await supabase.from('question_bank').insert([
      {
        subject,
        topic: subject,
        subtopic,
        difficulty: 'medium',
        purpose: 'diagnostic',
        question_text: questionText,
        explanation_text: explanationText,
        image_url: imageUrl,
        status: 'approved'
      }
    ])
    if (error) console.log(error)
    else {
      setQuestionText('')
      setExplanationText('')
      setImageFile(null)
      fetchQuestions()
    }
    setLoading(false)
  }

  // Asistencia IA simple (simulación)
  const handleAIHelp = async () => {
    const prompt = `Ayúdame a mejorar esta pregunta: "${questionText}" con explicación: "${explanationText}"`
    // Aquí puedes integrar OpenAI o cualquier API
    const suggestion = `[IA] Sugerencia: Reescribe la pregunta para que sea más clara y agrega un ejemplo.`
    alert(suggestion)
  }

  return (
    <div style={{ padding: '40px', background: gradients.primary, minHeight: '100vh' }}>
      <h1 style={{ color: colors.gray900, fontSize: '28px', marginBottom: '20px' }}>Panel de Administración</h1>

      <div style={{ marginBottom: '20px' }}>
        <label>Materia:</label>
        <select value={subject} onChange={e => { setSubject(e.target.value); setSubtopic(subjects[e.target.value][0]) }}>
          {Object.keys(subjects).map(subj => <option key={subj} value={subj}>{subj}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Subtema:</label>
        <select value={subtopic} onChange={e => setSubtopic(e.target.value)}>
          {subjects[subject].map(st => <option key={st} value={st}>{st}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Pregunta:</label>
        <textarea
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Explicación:</label>
        <textarea
          value={explanationText}
          onChange={e => setExplanationText(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Imagen (opcional):</label>
        <input type="file" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleAIHelp}
          style={{
            padding: '12px 24px',
            background: colors.gray900,
            color: 'white',
            borderRadius: '8px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >Asistencia IA</button>

        <button
          onClick={handleSave}
          style={{
            padding: '12px 24px',
            background: gradients.primary,
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Guardando...' : 'Guardar Pregunta'}
        </button>
      </div>

      <h2 style={{ color: colors.gray900, marginBottom: '10px' }}>Vista previa para alumno:</h2>
      <div style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <p><strong>Pregunta:</strong> {questionText || '[Aquí se verá la pregunta]'}</p>
        <p><strong>Explicación:</strong> {explanationText || '[Aquí se verá la explicación]'}</p>
        {imageFile && <p><em>Imagen seleccionada: {imageFile.name}</em></p>}
      </div>

      <h2 style={{ color: colors.gray900, marginBottom: '10px' }}>Preguntas existentes:</h2>
      <ul>
        {questions.map(q => (
          <li key={q.id}>
            [{q.subject} - {q.subtopic}] {q.question_text}
          </li>
        ))}
      </ul>
    </div>
  )
}
