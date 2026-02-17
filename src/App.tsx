import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import QuestionBank from './pages/admin/QuestionBank'
import StudentDashboard from './pages/student/StudentDashboard'
import Exam from './pages/student/Exam'
import Results from './pages/student/Results'
import AdminPanel from './pages/admin/AdminPanel'
import Register from './pages/Register'
import Purchase from './pages/Purchase'
import ForgotPassword from './pages/ForgotPassword'
// import ResetPassword from './pages/reset-password'
import StudentManagement from './pages/admin/StudentManagement'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import StudentDetail from './pages/teacher/StudentDetail'
import AdminStudentExams from './pages/admin/AdminStudentExams'
import ExamManagement from './pages/admin/ExamManagement'
import CreateUser from './pages/admin/CreateUser';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* <Route path="/reset-password" element={<ResetPassword />} /> */}
        <Route path="/purchase" element={<Purchase />} />
        
        {/* Student Routes */}
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/exam/:type" element={<Exam />} />
        <Route path="/results/:examId" element={<Results />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
        <Route path="/admin/questions" element={<QuestionBank />} />
        <Route path="/admin/students" element={<StudentManagement />} />
        <Route path="/admin/student-exams/:studentId" element={<AdminStudentExams />} />
        <Route path="/admin/exam-result/:examId" element={<Results />} />
        <Route path="/admin/exams" element={<ExamManagement />} />
        <Route path="/admin/users/create" element={<CreateUser />} />
        
        {/* Teacher Routes */}
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/student/:studentId" element={<StudentDetail />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App