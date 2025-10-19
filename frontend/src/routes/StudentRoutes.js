import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Home from '@/pages/student/Home';
import About from '@/pages/student/About';
import Login from '@/pages/student/Login';
import Signup from '@/pages/student/Signup';
import VerifyEmail from '@/pages/student/VerifyEmail';
import GateTests from '@/pages/student/GateTests';
import CatTests from '@/pages/student/CatTests';
import Exam from '@/pages/student/Exam';
import Results from '@/pages/student/Results';
import Profile from '@/pages/student/Profile';
import Payment from '@/pages/student/Payment';
import NotFound from '@/pages/student/NotFound';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return user && user.role !== 'admin' ? children : <Navigate to="/login" />;
};

export default function StudentRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/gate" element={<GateTests />} />
      <Route path="/cat" element={<CatTests />} />
      <Route path="/exam/:testId" element={<PrivateRoute><Exam /></PrivateRoute>} />
      <Route path="/results/:attemptId" element={<PrivateRoute><Results /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/payment/:testId" element={<PrivateRoute><Payment /></PrivateRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
