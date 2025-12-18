import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import QuestionBank from './pages/admin/QuestionBank'
import StudentDashboard from './pages/student/StudentDashboard'
import Exam from './pages/student/Exam'
import Results from './pages/student/Results'
import AdminPanel from './pages/admin/AdminPanel';
<h1 style={{ color: 'red' }}>DEPLOY TEST - EDUTEAM</h1>


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


      </Routes>
    </BrowserRouter>
  )
}

export default App