import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Users, DollarSign, FileText, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const { API, getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/admin/analytics`, {
        headers: getAuthHeaders()
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold" data-testid="dashboard-title">Dashboard</h1>
        
        {analytics && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card data-testid="users-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="w-4 h-4 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.activeUsers}</div>
                </CardContent>
              </Card>

              <Card data-testid="revenue-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="w-4 h-4 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{analytics.totalRevenue}</div>
                </CardContent>
              </Card>

              <Card data-testid="tests-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                  <FileText className="w-4 h-4 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalTests}</div>
                </CardContent>
              </Card>

              <Card data-testid="attempts-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalAttempts}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Tests by Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topTests?.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.topTests.map(([testId, count], idx) => (
                      <div key={testId} className="flex justify-between items-center p-2 bg-gray-50 rounded" data-testid={`top-test-${idx}`}>
                        <span className="font-medium">Test {testId.slice(0, 8)}...</span>
                        <span className="text-gray-600">{count} attempts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No data available</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
