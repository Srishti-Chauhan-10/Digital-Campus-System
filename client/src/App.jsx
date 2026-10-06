import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ToastProvider, Spinner } from './components/ui.jsx';
import Login from './pages/Login.jsx';

import StudentHome from './pages/student/StudentHome.jsx';
import DoubtPortal from './pages/student/DoubtPortal.jsx';
import Complaints from './pages/student/Complaints.jsx';
import Helpline from './pages/student/Helpline.jsx';
import Results from './pages/student/Results.jsx';
import SyllabusBrowse from './pages/student/SyllabusBrowse.jsx';
import SyllabusSubject from './pages/student/SyllabusSubject.jsx';

import TeacherHome from './pages/teacher/TeacherHome.jsx';
import TeacherPassword from './pages/teacher/TeacherPassword.jsx';
import TeacherBackup from './pages/teacher/TeacherBackup.jsx';
import TeacherDoubts from './pages/teacher/TeacherDoubts.jsx';
import TeacherComplaints from './pages/teacher/TeacherComplaints.jsx';
import TeacherSyllabus from './pages/teacher/TeacherSyllabus.jsx';
import TeacherMarks from './pages/teacher/TeacherMarks.jsx';
import TeacherStudents from './pages/teacher/TeacherStudents.jsx';
import DataGuide from './pages/teacher/DataGuide.jsx';

function Guard({ role, children }) {
  const { loading, role: r } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center"><Spinner label="સિસ્ટમ તૈયાર થાય છે…" /></div>;
  if (!r) return <Navigate to="/login" replace />;
  if (r !== role) return <Navigate to={r === 'teacher' ? '/t' : '/s'} replace />;
  return children;
}
function Home() {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'teacher' ? '/t' : '/s'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />

          {/* ── વિદ્યાર્થી ── */}
          <Route path="/s" element={<Guard role="student"><StudentHome /></Guard>} />
          <Route path="/s/doubt" element={<Guard role="student"><DoubtPortal /></Guard>} />
          <Route path="/s/complaint" element={<Guard role="student"><Complaints mode="general" /></Guard>} />
          <Route path="/s/bullying" element={<Guard role="student"><Complaints mode="bullying" /></Guard>} />
          <Route path="/s/helpline" element={<Guard role="student"><Helpline /></Guard>} />
          <Route path="/s/results" element={<Guard role="student"><Results /></Guard>} />
          <Route path="/s/syllabus" element={<Guard role="student"><SyllabusBrowse /></Guard>} />
          <Route path="/s/syllabus/:id" element={<Guard role="student"><SyllabusSubject /></Guard>} />

          {/* ── શિક્ષક ── */}
          <Route path="/t" element={<Guard role="teacher"><TeacherHome /></Guard>} />
          <Route path="/t/doubts" element={<Guard role="teacher"><TeacherDoubts /></Guard>} />
          <Route path="/t/complaints" element={<Guard role="teacher"><TeacherComplaints /></Guard>} />
          <Route path="/t/syllabus" element={<Guard role="teacher"><TeacherSyllabus /></Guard>} />
          <Route path="/t/marks" element={<Guard role="teacher"><TeacherMarks /></Guard>} />
          <Route path="/t/students" element={<Guard role="teacher"><TeacherStudents /></Guard>} />
          <Route path="/t/guide" element={<Guard role="teacher"><DataGuide /></Guard>} />
          <Route path="/t/password" element={<Guard role="teacher"><TeacherPassword /></Guard>} />
          <Route path="/t/backup" element={<Guard role="teacher"><TeacherBackup /></Guard>} />

          <Route path="*" element={<Home />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
