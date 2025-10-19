import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();
  const { API } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast.error('Invalid verification link');
      setVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        await axios.post(`${API}/auth/verify-email`, { token });
        toast.success('Email verified successfully!');
        setTimeout(() => navigate('/login'), 2000);
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Verification failed');
        setVerifying(false);
      }
    };

    verify();
  }, [searchParams, navigate, API]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-4" data-testid="verify-title">
          {verifying ? 'Verifying Email...' : 'Verification Failed'}
        </h1>
        {!verifying && (
          <Button onClick={() => navigate('/login')} className="bg-teal-600 hover:bg-teal-700" data-testid="goto-login-btn">
            Go to Login
          </Button>
        )}
      </div>
    </div>
  );
}
