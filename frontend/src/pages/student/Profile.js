import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LogOut, Trophy, Clock, Target, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [analytics, setAnalytics] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const { user, logout, API, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
    fetchPurchases();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/user`, {
        headers: getAuthHeaders()
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await axios.get(`${API}/purchases/history`, {
        headers: getAuthHeaders()
      });
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const chartData = analytics?.accuracyTrend?.map((acc, idx) => ({
    attempt: `Test ${idx + 1}`,
    accuracy: (acc * 100).toFixed(1)
  })) || [];

  return (
    <div className="min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-teal-700">MockME</Link>
          <div className="flex gap-4">
            <Link to="/gate"><Button variant="outline" data-testid="nav-gate">GATE Tests</Button></Link>
            <Link to="/cat"><Button variant="outline" data-testid="nav-cat">CAT Tests</Button></Link>
            <Button variant="destructive" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="profile-title">My Profile</h1>
          <p className="text-gray-600" data-testid="user-email">{user?.email}</p>
        </div>

        {analytics && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md" data-testid="stat-tests">
                <div className="flex items-center gap-4">
                  <Clock className="w-10 h-10 text-teal-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tests Attempted</p>
                    <p className="text-3xl font-bold">{analytics.testsAttempted}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md" data-testid="stat-avg-score">
                <div className="flex items-center gap-4">
                  <Target className="w-10 h-10 text-teal-600" />
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-3xl font-bold">{analytics.averageScore}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md" data-testid="stat-best-score">
                <div className="flex items-center gap-4">
                  <Trophy className="w-10 h-10 text-teal-600" />
                  <div>
                    <p className="text-sm text-gray-600">Best Score</p>
                    <p className="text-3xl font-bold">{analytics.bestScore}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md" data-testid="stat-purchases">
                <div className="flex items-center gap-4">
                  <TrendingUp className="w-10 h-10 text-teal-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tests Purchased</p>
                    <p className="text-3xl font-bold">{purchases.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md mb-8" data-testid="accuracy-chart">
                <h2 className="text-2xl font-semibold mb-4">Performance Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="attempt" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="accuracy" stroke="#0d9488" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {analytics && analytics.testsAttempted === 0 && (
          <div className="text-center py-12" data-testid="no-attempts">
            <p className="text-gray-600 mb-4">You haven't attempted any tests yet.</p>
            <Link to="/gate">
              <Button className="bg-teal-600 hover:bg-teal-700">Browse Tests</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
