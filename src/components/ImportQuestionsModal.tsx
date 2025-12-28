import React, { useState, useCallback, useEffect } from 'react';
import { X, Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { parseExcelFile, generateExcelTemplate, ValidationResult } from '../utils/excelParser';
import { supabase } from '../lib/supabase';
import { colors, gradients } from '../styles/theme';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportQuestionsModal: React.FC<ImportQuestionsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      alert('❌ Por favor sube un archivo .xlsx o .xls');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const results = await parseExcelFile(selectedFile);
      setValidationResults(results);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('❌ Error al leer el archivo. Verifica que tenga el formato correcto.');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setValidationResults([]);
    setIsProcessing(false);
    setIsImporting(false);
  };

  const handleImport = async () => {
    if (!user) {
      alert('❌ No hay usuario autenticado');
      return;
    }

    const validQuestions = validationResults.filter(r => r.isValid);
    
    if (validQuestions.length === 0) {
      alert('❌ No hay preguntas válidas para importar');
      return;
    }

    setIsImporting(true);

    try {
      const questionsToInsert = validQuestions.map(result => ({
        subject: result.data.subject,
        topic: result.data.topic,
        subtopic: result.data.subtopic || null,
        difficulty: result.data.difficulty,
        purpose: result.data.purpose,
        question_text: result.data.question_text,
        question_equation: result.data.question_equation || null,
        question_image: result.data.question_image || null,
        option_a: result.data.option_a,
        option_b: result.data.option_b,
        option_c: result.data.option_c,
        option_d: result.data.option_d,
        correct_option: result.data.correct_option,
        explanation_text: result.data.explanation_text || null,
        explanation_equation: result.data.explanation_equation || null,
        created_by: user.id,
        status: 'pending',
        active: true,
        times_used: 0
      }));

      console.log('Intentando insertar:', questionsToInsert);

      const { data, error } = await supabase
        .from('question_bank')
        .insert(questionsToInsert)
        .select();

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }

      console.log('Preguntas insertadas exitosamente:', data);
      alert(`✅ ${validQuestions.length} preguntas importadas correctamente`);
      onImportComplete();
      resetModal();
      onClose();
    } catch (error: any) {
      console.error('Error importing questions:', error);
      alert(`❌ Error al guardar preguntas: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = validationResults.filter(r => r.isValid).length;
  const errorCount = validationResults.filter(r => !r.isValid).length;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '90vw',
        maxWidth: '1200px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: colors.gray900,
            margin: 0
          }}>
            📥 Importar Preguntas desde Excel
          </h2>
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = colors.gray100}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={24} color={colors.gray600} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          flex: 1,
          overflowY: 'auto'
        }}>
          {/* Download Template Button */}
          <button
            onClick={generateExcelTemplate}
            style={{
              padding: '12px 24px',
              background: gradients.primary,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(107, 141, 214, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Download size={20} />
            📋 Descargar Template
          </button>

          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? colors.primary : colors.gray300}`,
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              background: dragActive ? colors.gray50 : 'white',
              transition: 'all 0.2s',
              marginBottom: '24px'
            }}
          >
            <Upload size={48} color={colors.gray400} style={{ margin: '0 auto 16px' }} />
            <p style={{
              fontSize: '16px',
              color: colors.gray700,
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Arrastra tu archivo Excel aquí o
            </p>
            <label style={{
              padding: '10px 20px',
              background: colors.gray100,
              color: colors.gray700,
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-block',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.gray200}
              onMouseLeave={(e) => e.currentTarget.style.background = colors.gray100}
            >
              Seleccionar archivo
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </label>
            {file && (
              <p style={{
                marginTop: '16px',
                fontSize: '14px',
                color: colors.gray600
              }}>
                📄 {file.name}
              </p>
            )}
          </div>

          {/* Processing */}
          {isProcessing && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: colors.gray600
            }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
              <p>Procesando archivo...</p>
            </div>
          )}

          {/* Results Summary */}
          {validationResults.length > 0 && !isProcessing && (
            <>
              <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  flex: 1,
                  padding: '16px',
                  background: colors.gray50,
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: colors.gray900,
                    margin: '0 0 4px 0'
                  }}>
                    {validationResults.length}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: colors.gray600,
                    margin: 0
                  }}>
                    Total
                  </p>
                </div>
                <div style={{
                  flex: 1,
                  padding: '16px',
                  background: '#D1FAE5',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#065F46',
                    margin: '0 0 4px 0'
                  }}>
                    {validCount}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#065F46',
                    margin: 0
                  }}>
                    ✅ Válidas
                  </p>
                </div>
                <div style={{
                  flex: 1,
                  padding: '16px',
                  background: '#FEE2E2',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#991B1B',
                    margin: '0 0 4px 0'
                  }}>
                    {errorCount}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#991B1B',
                    margin: 0
                  }}>
                    ❌ Con errores
                  </p>
                </div>
              </div>

              {/* Preview Table */}
              <div style={{
                border: `1px solid ${colors.gray200}`,
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{
                      background: colors.gray50,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      <tr>
                        <th style={tableHeaderStyle}>#</th>
                        <th style={tableHeaderStyle}>Materia</th>
                        <th style={tableHeaderStyle}>Tema</th>
                        <th style={tableHeaderStyle}>Dificultad</th>
                        <th style={tableHeaderStyle}>Pregunta</th>
                        <th style={tableHeaderStyle}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults.map((result, index) => (
                        <tr key={index} style={{
                          background: result.isValid ? 'white' : '#FEE2E2',
                          borderBottom: `1px solid ${colors.gray200}`
                        }}>
                          <td style={tableCellStyle}>{result.row}</td>
                          <td style={tableCellStyle}>{result.data.subject}</td>
                          <td style={tableCellStyle}>{result.data.topic}</td>
                          <td style={tableCellStyle}>{result.data.difficulty}</td>
                          <td style={tableCellStyle}>
                            {result.data.question_text.substring(0, 50)}
                            {result.data.question_text.length > 50 ? '...' : ''}
                          </td>
                          <td style={tableCellStyle}>
                            {result.isValid ? (
                              <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#065F46'
                              }}>
                                <CheckCircle size={16} />
                                Válida
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '12px',
                                color: '#991B1B'
                              }}>
                                <XCircle size={16} style={{ marginRight: '4px' }} />
                                {result.errors.join(', ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {validationResults.length > 0 && (
          <div style={{
            padding: '24px',
            borderTop: `1px solid ${colors.gray200}`,
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => {
                resetModal();
                onClose();
              }}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: colors.gray700,
                border: `1px solid ${colors.gray300}`,
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ❌ Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={validCount === 0 || isImporting}
              style={{
                padding: '12px 24px',
                background: validCount > 0 ? gradients.success : colors.gray300,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: validCount > 0 ? 'pointer' : 'not-allowed',
                opacity: isImporting ? 0.7 : 1,
                boxShadow: validCount > 0 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {isImporting ? '⏳ Importando...' : `✅ Importar ${validCount} preguntas válidas`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: '600',
  color: colors.gray700,
  borderBottom: `1px solid ${colors.gray200}`
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '14px',
  color: colors.gray700
};