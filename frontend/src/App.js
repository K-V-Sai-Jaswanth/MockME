import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import StudentRoutes from '@/routes/StudentRoutes';
import AdminRoutes from '@/routes/AdminRoutes';
import '@/App.css';

function App() {
  const isAdmin = window.location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/*" element={<StudentRoutes />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
