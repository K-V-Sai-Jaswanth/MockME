import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-teal-700">MockME</Link>
          <Link to="/"><Button variant="ghost" data-testid="back-home-btn"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Button></Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-8" data-testid="about-title">About MockME</h1>
        
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p data-testid="about-intro">
            MockME is a comprehensive mock test platform designed specifically for GATE and CAT exam aspirants. 
            We provide realistic test experiences that mirror actual exam conditions.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8">Our Mission</h2>
          <p data-testid="about-mission">
            To democratize quality exam preparation by providing affordable, AI-powered mock tests that help students 
            identify their strengths and weaknesses, ultimately improving their chances of success.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8">Key Features</h2>
          <ul className="list-disc list-inside space-y-2" data-testid="about-features">
            <li>Authentic mock tests following official exam patterns</li>
            <li>Previous year papers for comprehensive practice</li>
            <li>AI-powered explanations for every question</li>
            <li>Real-time performance analytics and percentile tracking</li>
            <li>Fullscreen mode with tab-switching detection for exam integrity</li>
            <li>Affordable pricing starting at just ₹30 per test</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8">Security & Privacy</h2>
          <p data-testid="about-security">
            We take your data security seriously. All user information is encrypted and stored securely. 
            We follow strict data retention policies and never share your personal information with third parties.
          </p>
        </div>
      </section>
    </div>
  );
}
