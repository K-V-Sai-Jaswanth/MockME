import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageTests from '@/pages/admin/ManageTests';
import Coupons from '@/pages/admin/Coupons';
import Analytics from '@/pages/admin/Analytics';
import Settings from '@/pages/admin/Settings';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return user && user.role === 'admin' ? children : <Navigate to="/admin/login" />;
};

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/tests" element={<AdminRoute><ManageTests /></AdminRoute>} />
      <Route path="/coupons" element={<AdminRoute><Coupons /></AdminRoute>} />
      <Route path="/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
      <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
      <Route path="/" element={<Navigate to="/admin/dashboard" />} />
    </Routes>
  );
}
