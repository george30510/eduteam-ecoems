import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface CreateUserFormData {
  fullName: string;
  email: string;
  password: string;
  examsPurchased: number;
  selectedExams: number[]; // [1, 2, 3, 4, 5, 6]
}

export default function CreateUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUserFormData>({
    fullName: '',
    email: '',
    password: '',
    examsPurchased: 0,
    selectedExams: [],
  });

  const handleExamToggle = (examNumber: number) => {
    setFormData(prev => ({
      ...prev,
      selectedExams: prev.selectedExams.includes(examNumber)
        ? prev.selectedExams.filter(n => n !== examNumber)
        : [...prev.selectedExams, examNumber],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones básicas
      if (!formData.fullName || !formData.email || !formData.password) {
        throw new Error('Todos los campos son obligatorios');
      }

      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      if (formData.examsPurchased < formData.selectedExams.length) {
        throw new Error('El número de exámenes comprados debe ser mayor o igual a los exámenes asignados');
      }

      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          full_name: formData.fullName,
        },
      });

      if (authError) throw new Error(`Error al crear usuario: ${authError.message}`);
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // 2. Crear perfil en user_profiles con el mismo UUID
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          role: 'student',
          exams_purchased: formData.examsPurchased,
          exams_remaining: formData.examsPurchased,
          free_diagnostic_used: false,
          status: 'active',
          is_admin_created: true,
        });

      if (profileError) {
        // Si falla, intentar eliminar el usuario de Auth
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Error al crear perfil: ${profileError.message}`);
      }

      // 3. Asignar exámenes seleccionados
      if (formData.selectedExams.length > 0) {
        const assignments = formData.selectedExams.map(examNum => ({
          user_id: authData.user.id,
          exam_type: 'simulacro',
          exam_number: examNum,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
          completed: false,
        }));

        const { error: assignmentError } = await supabase
          .from('exam_assignments')
          .insert(assignments);

        if (assignmentError) {
          console.error('Error al asignar exámenes:', assignmentError);
          // No lanzamos error aquí, el usuario se creó exitosamente
        }
      }

      alert(`✅ Usuario creado exitosamente!\n\nEmail: ${formData.email}\nContraseña: ${formData.password}\n\nGuarda estas credenciales.`);
      navigate('/admin/students');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Usuario</h1>
        <p className="text-gray-600 mt-2">
          Crea un nuevo estudiante y asigna sus exámenes disponibles
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">❌ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Información Personal */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Juan Pérez García"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="estudiante@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Guarda esta contraseña para dársela al estudiante
              </p>
            </div>
          </div>
        </div>

        {/* Exámenes */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Asignación de Exámenes</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exámenes Comprados
            </label>
            <input
              type="number"
              min="0"
              max="6"
              value={formData.examsPurchased}
              onChange={e => setFormData({ ...formData, examsPurchased: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este número determina cuántos exámenes puede tomar el estudiante
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exámenes Disponibles (selecciona cuáles puede tomar)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <label
                  key={num}
                  className={`
                    flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${formData.selectedExams.includes(num)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedExams.includes(num)}
                    onChange={() => handleExamToggle(num)}
                    className="mr-2"
                  />
                  <span className="font-medium">Examen {num}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ✅ Seleccionados: {formData.selectedExams.length} exámenes
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '⏳ Creando usuario...' : '✅ Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
}