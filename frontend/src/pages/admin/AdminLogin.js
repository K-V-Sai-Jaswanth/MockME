import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function AdminLogin() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, API } = useAuth();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/auth/admin-login`, { email, password });
      toast.success('2FA code sent to your email!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/verify-2fa`, { email, code });
      login(response.data.token, response.data.user);
      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-center mb-6 text-white" data-testid="admin-login-title">
          Admin Login
        </h1>
        
        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mockme.com"
                required
                data-testid="admin-email-input"
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                data-testid="admin-password-input"
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
              />
            </div>
            
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading} data-testid="send-code-btn">
              {loading ? 'Sending...' : 'Send 2FA Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div>
              <Label htmlFor="code" className="text-white">Enter 6-digit code</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                maxLength={6}
                data-testid="2fa-code-input"
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 text-center text-2xl tracking-widest"
              />
            </div>
            
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading} data-testid="verify-2fa-btn">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </Button>
            
            <Button type="button" variant="ghost" className="w-full text-white" onClick={() => setStep(1)} data-testid="back-btn">
              Back
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
