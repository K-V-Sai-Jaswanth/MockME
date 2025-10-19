import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { API } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/auth/signup`, { name, email, password });
      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-6" data-testid="signup-title">Sign Up for MockME</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              data-testid="signup-name-input"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              data-testid="signup-email-input"
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
              minLength={6}
              data-testid="signup-password-input"
            />
          </div>
          
          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading} data-testid="signup-submit-btn">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Already have an account? <Link to="/login" className="text-teal-600 hover:underline" data-testid="login-link">Login</Link>
          </p>
          <Link to="/" className="text-sm text-gray-600 hover:underline block" data-testid="back-home-link">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
