import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import QuestionBank from './pages/admin/QuestionBank'
import StudentDashboard from './pages/student/StudentDashboard'
import Exam from './pages/student/Exam'
import Results from './pages/student/Results'
import AdminPanel from './pages/admin/AdminPanel';
import Register from './pages/Register'
import Purchase from './pages/Purchase'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import StudentManagement from './pages/admin/StudentManagement'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/admin/questions" element={<QuestionBank />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/exam/:type" element={<Exam />} />
        <Route path="/results" element={<Results />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
        <Route path="/register" element={<Register />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/students" element={<StudentManagement />} />


      </Routes>
    </BrowserRouter>
  )
}

export default App