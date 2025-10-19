import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, API } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      login(response.data.token, response.data.user);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-6" data-testid="login-title">Login to MockME</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              data-testid="login-email-input"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              data-testid="login-password-input"
            />
          </div>
          
          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading} data-testid="login-submit-btn">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account? <Link to="/signup" className="text-teal-600 hover:underline" data-testid="signup-link">Sign up</Link>
          </p>
          <Link to="/" className="text-sm text-gray-600 hover:underline block" data-testid="back-home-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
