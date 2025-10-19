import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, TrendingUp, Award } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-teal-700" data-testid="home-logo">MockME</Link>
          <div className="flex gap-4">
            <Link to="/about"><Button variant="ghost" data-testid="nav-about">About</Button></Link>
            <Link to="/login"><Button variant="outline" data-testid="nav-login">Login</Button></Link>
            <Link to="/signup"><Button data-testid="nav-signup" className="bg-teal-600 hover:bg-teal-700">Sign Up</Button></Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-800" data-testid="hero-title">
            Master Your <span className="text-teal-600">GATE</span> & <span className="text-teal-600">CAT</span> Exams
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto" data-testid="hero-subtitle">
            Practice with realistic mock tests and previous year papers. Get AI-powered explanations and track your progress.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/gate"><Button size="lg" className="bg-teal-600 hover:bg-teal-700" data-testid="explore-gate-btn">Explore GATE Tests</Button></Link>
            <Link to="/cat"><Button size="lg" variant="outline" data-testid="explore-cat-btn">Explore CAT Tests</Button></Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow" data-testid="feature-realistic">
            <GraduationCap className="w-12 h-12 text-teal-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Realistic Mock Tests</h3>
            <p className="text-gray-600">Experience actual exam conditions with timed tests and strict monitoring.</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow" data-testid="feature-previous">
            <BookOpen className="w-12 h-12 text-teal-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Previous Papers</h3>
            <p className="text-gray-600">Practice with authentic previous year papers from GATE and CAT exams.</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow" data-testid="feature-ai">
            <TrendingUp className="w-12 h-12 text-teal-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Explanations</h3>
            <p className="text-gray-600">Get detailed explanations for every question powered by AI.</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow" data-testid="feature-analytics">
            <Award className="w-12 h-12 text-teal-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
            <p className="text-gray-600">Track your progress with detailed analytics and improvement graphs.</p>
          </div>
        </div>
      </section>

      <section className="bg-white/60 backdrop-blur-sm py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Affordable Pricing</h2>
          <div className="flex gap-8 justify-center flex-wrap mt-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg" data-testid="pricing-single">
              <h3 className="text-2xl font-bold mb-2">Single Test</h3>
              <p className="text-4xl font-bold text-teal-600 mb-4">₹30</p>
              <p className="text-gray-600">One mock test of your choice</p>
            </div>
            <div className="bg-teal-600 text-white p-8 rounded-2xl shadow-lg" data-testid="pricing-bundle">
              <div className="text-sm font-semibold mb-2">BEST VALUE</div>
              <h3 className="text-2xl font-bold mb-2">Bundle of 5</h3>
              <p className="text-4xl font-bold mb-4">₹100</p>
              <p>Save ₹50 on 5 mock tests</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 MockME. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
