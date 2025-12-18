import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { colors, gradients } from '../styles/theme'

interface QuestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingQuestion?: any
}

const SUBJECTS = [
  'Habilidad verbal',
  'Habilidad matemática',
  'Español',
  'Historia',
  'Geografía',
  'Formación cívica y ética',
  'Matemáticas',
  'Física',
  'Química',
  'Biología'
]

export default function QuestionModal({ isOpen, onClose, onSave, editingQuestion }: QuestionModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    subtopic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    purpose: 'both' as 'diagnostic' | 'exam' | 'both',
    question_text: '',
    question_equation: '',
    question_image: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation_text: '',
    explanation_equation: '',
    status: 'draft' as 'draft' | 'review' | 'approved'
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        subject: editingQuestion.subject || '',
        topic: editingQuestion.topic || '',
        subtopic: editingQuestion.subtopic || '',
        difficulty: editingQuestion.difficulty || 'medium',
        purpose: editingQuestion.purpose || 'both',
        question_text: editingQuestion.question_text || '',
        question_equation: editingQuestion.question_equation || '',
        question_image: editingQuestion.question_image || '',
        option_a: editingQuestion.option_a || '',
        option_b: editingQuestion.option_b || '',
        option_c: editingQuestion.option_c || '',
        option_d: editingQuestion.option_d || '',
        correct_option: editingQuestion.correct_option || 'A',
        explanation_text: editingQuestion.explanation_text || '',
        explanation_equation: editingQuestion.explanation_equation || '',
        status: editingQuestion.status || 'draft'
      })
      setImageFile(null)
    } else {
      setFormData({
        subject: '',
        topic: '',
        subtopic: '',
        difficulty: 'medium',
        purpose: 'both',
        question_text: '',
        question_equation: '',
        question_image: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        explanation_text: '',
        explanation_equation: '',
        status: 'draft'
      })
      setImageFile(null)
    }
    setError('')
    setShowPreview(false)
  }, [editingQuestion, isOpen])

  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) return formData.question_image || null

    setUploading(true)
    try {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(filePath, imageFile)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError('Error al subir imagen: ' + err.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleAIHelp = async () => {
    // TODO: Integrar con API de IA
    alert('Función de IA en desarrollo. Próximamente te ayudaré a mejorar la pregunta y explicación.')
  }

  const handleSave = async () => {
    // Validaciones
    if (!formData.subject) {
      setError('Selecciona una materia')
      return
    }
    if (!formData.topic) {
      setError('Ingresa un tema')
      return
    }
    if (!formData.question_text) {
      setError('Ingresa el texto de la pregunta')
      return
    }
    if (!formData.option_a || !formData.option_b || !formData.option_c || !formData.option_d) {
      setError('Completa todas las opciones')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Subir imagen si hay una nueva
      let imageUrl = formData.question_image
      if (imageFile) {
        const uploadedUrl = await handleImageUpload()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const dataToSave = {
        ...formData,
        question_image: imageUrl || null,
        question_equation: formData.question_equation || null,
        subtopic: formData.subtopic || null,
        explanation_text: formData.explanation_text || null,
        explanation_equation: formData.explanation_equation || null,
      }

      if (editingQuestion) {
        // Actualizar
        const { error } = await supabase
          .from('question_bank')
          .update(dataToSave)
          .eq('id', editingQuestion.id)

        if (error) throw error
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('question_bank')
          .insert([dataToSave])

        if (error) throw error
      }

      onSave()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        maxWidth: '1100px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'grid',
        gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr',
        gap: showPreview ? '20px' : '0'
      }}>
        {/* Panel Izquierdo - Formulario */}
        <div>
          {/* Header */}
          <div style={{
            padding: '28px 32px',
            borderBottom: `2px solid ${colors.gray100}`,
            position: 'sticky',
            top: 0,
            background: 'white',
            zIndex: 1,
            borderRadius: '20px 20px 0 0'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: 0,
              background: gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {editingQuestion ? '✏️ Editar Reactivo' : '➕ Nuevo Reactivo'}
            </h2>
            <p style={{
              color: colors.gray600,
              margin: '8px 0 0 0',
              fontSize: '15px'
            }}>
              {editingQuestion ? 'Modifica los campos necesarios' : 'Completa la información del reactivo'}
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: '32px' }}>
            {error && (
              <div style={{
                background: '#FEE2E2',
                border: '2px solid #FCA5A5',
                color: '#991B1B',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
                fontWeight: '600'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Row 1: Materia, Dificultad, Propósito */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: colors.gray700,
                  fontSize: '14px'
                }}>
                  Materia *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Selecciona...</option>
                  {SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: colors.gray700,
                  fontSize: '14px'
                }}>
                  Dificultad *
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Medio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: colors.gray700,
                  fontSize: '14px'
                }}>
                  Propósito *
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <option value="diagnostic">Diagnóstico</option>
                  <option value="exam">Examen</option>
                  <option value="both">Ambos</option>
                </select>
              </div>
            </div>

            {/* Row 2: Tema y Subtema */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: colors.gray700,
                  fontSize: '14px'
                }}>
                  Tema *
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="Ej: Series numéricas"
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

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: colors.gray700,
                  fontSize: '14px'
                }}>
                  Subtema (opcional)
                </label>
                <input
                  type="text"
                  value={formData.subtopic}
                  onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                  placeholder="Ej: Progresión aritmética"
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
            </div>

            {/* Pregunta */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{
                  fontWeight: '600',
                  color: colors.gray700,
                  fontSize: '14px'
                }}>
                  Texto de la Pregunta *
                </label>
                <button
                  type="button"
                  onClick={handleAIHelp}
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #8B6FC9 0%, #E85D9A 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✨ Ayuda IA
                </button>
              </div>
              <textarea
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                placeholder="Escribe la pregunta completa..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: `2px solid ${colors.gray200}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Imagen */}
<div style={{ marginBottom: '24px' }}>
  <label style={{
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: colors.gray700,
    fontSize: '14px'
  }}>
    Imagen (opcional)
  </label>
  
  {/* Tabs para elegir método */}
  <div style={{
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    background: colors.gray50,
    padding: '6px',
    borderRadius: '10px'
  }}>
    <button
      type="button"
      onClick={() => {
        setFormData({ ...formData, question_image: '' })
      }}
      style={{
        flex: 1,
        padding: '10px 16px',
        background: !formData.question_image && !imageFile ? 'white' : 'transparent',
        color: !formData.question_image && !imageFile ? colors.primary : colors.gray600,
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: !formData.question_image && !imageFile ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      📤 Subir Archivo
    </button>
    <button
      type="button"
      onClick={() => {
        setImageFile(null)
        setFormData({ ...formData, question_image: 'https://' })
      }}
      style={{
        flex: 1,
        padding: '10px 16px',
        background: formData.question_image && !imageFile ? 'white' : 'transparent',
        color: formData.question_image && !imageFile ? colors.primary : colors.gray600,
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: formData.question_image && !imageFile ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      🔗 URL Externa
    </button>
  </div>

  {/* Input de archivo o URL según selección */}
  {formData.question_image && !imageFile ? (
    // Modo URL
    <input
      type="url"
      value={formData.question_image}
      onChange={(e) => setFormData({ ...formData, question_image: e.target.value })}
      placeholder="https://ejemplo.com/imagen.jpg"
      style={{
        width: '100%',
        padding: '14px',
        border: `2px solid ${colors.gray200}`,
        borderRadius: '12px',
        fontSize: '15px',
        boxSizing: 'border-box'
      }}
    />
  ) : (
    // Modo Archivo
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        setImageFile(e.target.files?.[0] || null)
        setFormData({ ...formData, question_image: '' })
      }}
      style={{
        width: '100%',
        padding: '14px',
        border: `2px solid ${colors.gray200}`,
        borderRadius: '12px',
        fontSize: '15px',
        boxSizing: 'border-box',
        cursor: 'pointer'
      }}
    />
  )}

  {/* Preview */}
  {(imageFile || (formData.question_image && formData.question_image !== 'https://')) && (
    <div style={{ marginTop: '12px' }}>
      <img
        src={imageFile ? URL.createObjectURL(imageFile) : formData.question_image}
        alt="Preview"
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement
          target.src = 'https://via.placeholder.com/400x300?text=Error+cargando+imagen'
        }}
        style={{
          maxWidth: '100%',
          maxHeight: '200px',
          borderRadius: '8px',
          border: `1px solid ${colors.gray200}`,
          display: 'block'
        }}
      />
      {formData.question_image && !imageFile && (
        <p style={{
          fontSize: '12px',
          color: colors.gray500,
          margin: '8px 0 0 0',
          fontStyle: 'italic'
        }}>
          🔗 {formData.question_image}
        </p>
      )}
    </div>
  )}
</div>
            {/* Ecuación LaTeX */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: colors.gray600,
                fontSize: '14px'
              }}>
                Ecuación LaTeX (opcional)
              </label>
              <input
                type="text"
                value={formData.question_equation}
                onChange={(e) => setFormData({ ...formData, question_equation: e.target.value })}
                placeholder="Ej: x^2 + 2x + 1 = 0"
                style={{
                  width: '100%',
                  padding: '14px',
                  border: `2px solid ${colors.gray200}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Opciones */}
            <div style={{
              background: colors.gray50,
              padding: '24px',
              borderRadius: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                fontWeight: '700',
                color: colors.gray900,
                marginBottom: '16px',
                fontSize: '16px'
              }}>
                Opciones de Respuesta *
              </p>

              {['A', 'B', 'C', 'D'].map(opt => (
                <div key={opt} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="correct"
                      checked={formData.correct_option === opt}
                      onChange={() => setFormData({ ...formData, correct_option: opt as any })}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={formData[`option_${opt.toLowerCase()}` as keyof typeof formData] as string}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        [`option_${opt.toLowerCase()}`]: e.target.value 
                      })}
                      placeholder={`Opción ${opt}`}
                      style={{
                        flex: 1,
                        padding: '14px',
                        border: `2px solid ${formData.correct_option === opt ? '#10B981' : colors.gray200}`,
                        borderRadius: '12px',
                        fontSize: '15px',
                        background: formData.correct_option === opt ? '#D1FAE5' : 'white',
                        fontWeight: formData.correct_option === opt ? '600' : '400'
                      }}
                    />
                  </div>
                </div>
              ))}

              <p style={{
                fontSize: '13px',
                color: colors.gray600,
                margin: '12px 0 0 0',
                fontStyle: 'italic'
              }}>
                ℹ️ Selecciona el radio button de la opción correcta
              </p>
            </div>

            {/* Explicación */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: colors.gray700,
                fontSize: '14px'
              }}>
                Explicación (opcional)
              </label>
              <textarea
                value={formData.explanation_text}
                onChange={(e) => setFormData({ ...formData, explanation_text: e.target.value })}
                placeholder="Explica por qué es correcta esa respuesta..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: `2px solid ${colors.gray200}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Status (solo si está editando) */}
            {editingQuestion && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: colors.gray700,
                  fontSize: '14px'
                }}>
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <option value="draft">📝 Borrador</option>
                  <option value="review">👀 En Revisión</option>
                  <option value="approved">✅ Aprobado</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '24px 32px',
            borderTop: `2px solid ${colors.gray100}`,
            display: 'flex',
            gap: '12px',
            justifyContent: 'space-between',
            position: 'sticky',
            bottom: 0,
            background: 'white',
            borderRadius: '0 0 20px 20px'
          }}>
            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{
                padding: '14px 28px',
                border: `2px solid ${colors.primary}`,
                borderRadius: '12px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                color: colors.primary
              }}
            >
              {showPreview ? '📝 Ocultar Vista Previa' : '👁️ Ver Vista Previa'}
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                disabled={saving || uploading}
                style={{
                  padding: '14px 28px',
                  border: `2px solid ${colors.gray200}`,
                  borderRadius: '12px',
                  background: 'white',
                  cursor: (saving || uploading) ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: colors.gray700
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                style={{
                  padding: '14px 28px',
                  border: 'none',
                  borderRadius: '12px',
                  background: (saving || uploading) ? colors.gray400 : gradients.primary,
                  cursor: (saving || uploading) ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'white',
                  boxShadow: (saving || uploading) ? 'none' : '0 4px 12px rgba(232, 93, 154, 0.3)'
                }}
              >
                {uploading ? 'Subiendo imagen...' : saving ? 'Guardando...' : (editingQuestion ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Vista Previa */}
        {showPreview && (
          <div style={{
            padding: '32px',
            background: colors.gray50,
            borderRadius: '0 20px 20px 0',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: '0 0 24px 0',
              color: colors.gray900
            }}>
              👁️ Vista Previa
            </h3>

            <div style={{
              background: 'white',
              padding: '28px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: '8px',
                background: gradients.badge,
                color: 'white',
                fontSize: '13px',
                fontWeight: '700',
                marginBottom: '16px'
              }}>
                {formData.subject || 'Sin materia'}
              </div>

              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.gray900,
                margin: '0 0 20px 0',
                lineHeight: '1.6'
              }}>
                {formData.question_text || 'Texto de la pregunta aparecerá aquí...'}
              </h4>

              {(imageFile || formData.question_image) && (
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : formData.question_image}
                  alt="Imagen pregunta"
                  style={{
                    maxWidth: '100%',
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}
                />
              )}

              {formData.question_equation && (
                <div style={{
                  padding: '16px',
                  background: colors.gray50,
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: colors.gray700
                }}>
                  {formData.question_equation}
                </div>
              )}

              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                {['A', 'B', 'C', 'D'].map(opt => {
                  const isCorrect = formData.correct_option === opt
                  const optionText = formData[`option_${opt.toLowerCase()}` as keyof typeof formData] as string
                  
                  return (
                    <div
                      key={opt}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: isCorrect ? '#D1FAE5' : colors.gray50,
                        border: `2px solid ${isCorrect ? '#10B981' : colors.gray200}`,
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isCorrect ? '#10B981' : colors.gray300,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        flexShrink: 0
                      }}>
                        {opt}
                      </div>
                      <span style={{
                        fontSize: '15px',
                        color: colors.gray900,
                        fontWeight: isCorrect ? '600' : '400'
                      }}>
                        {optionText || `Opción ${opt}`}
                      </span>
                    </div>
                  )
                })}
              </div>

              {formData.explanation_text && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'rgba(52, 183, 200, 0.08)',
                  borderLeft: `4px solid ${colors.accent}`,
                  borderRadius: '8px'
                }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.gray700,
                    margin: '0 0 8px 0'
                  }}>
                    💡 Explicación:
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: colors.gray600,
                    margin: 0,
                    lineHeight: '1.6'
                  }}>
                    {formData.explanation_text}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}