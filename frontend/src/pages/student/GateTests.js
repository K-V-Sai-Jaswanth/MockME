import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lock, Clock, FileText } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function GateTests() {
  const [tests, setTests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { user, API, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await axios.get(`${API}/tests?examType=GATE`);
      setTests(response.data);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesFilter = filter === 'all' || test.type === filter;
    const matchesSearch = test.title.toLowerCase().includes(search.toLowerCase()) || 
                          test.subject.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleTestClick = (testId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const test = tests.find(t => t.id === testId);
    if (user.purchasedTests?.includes(testId)) {
      navigate(`/exam/${testId}`);
    } else {
      navigate(`/payment/${testId}`);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-teal-700">MockME</Link>
          <div className="flex gap-4">
            {user ? (
              <Link to="/profile"><Button variant="outline" data-testid="nav-profile">Profile</Button></Link>
            ) : (
              <Link to="/login"><Button data-testid="nav-login">Login</Button></Link>
            )}
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="gate-title">GATE Mock Tests</h1>
          <p className="text-gray-600">Practice with realistic GATE mock tests and previous year papers</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Input
            placeholder="Search tests by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:flex-1"
            data-testid="gate-search-input"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="md:w-48" data-testid="gate-filter-select">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tests</SelectItem>
              <SelectItem value="mock">Mock Tests</SelectItem>
              <SelectItem value="previousPaper">Previous Papers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const isPurchased = user?.purchasedTests?.includes(test.id);
            return (
              <div key={test.id} className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow" data-testid={`test-card-${test.id}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{test.title}</h3>
                  {isPurchased ? (
                    <Badge className="bg-green-500" data-testid={`badge-purchased-${test.id}`}>Purchased</Badge>
                  ) : (
                    <Badge variant="outline" data-testid={`badge-locked-${test.id}`}><Lock className="w-3 h-3 mr-1" />Locked</Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Subject: {test.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {test.duration} minutes</span>
                  </div>
                  <div>
                    <Badge variant="secondary">{test.type === 'mock' ? 'Mock Test' : 'Previous Paper'}</Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-teal-600">₹{test.price}</span>
                  <Button
                    onClick={() => handleTestClick(test.id)}
                    className="bg-teal-600 hover:bg-teal-700"
                    data-testid={`start-test-btn-${test.id}`}
                  >
                    {isPurchased ? 'Start Test' : 'Buy Now'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600" data-testid="no-tests-message">No tests found matching your criteria.</p>
          </div>
        )}
      </section>
    </div>
  );
}
