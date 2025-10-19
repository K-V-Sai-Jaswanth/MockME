import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-teal-600" data-testid="404-code">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mt-4" data-testid="404-title">Page Not Found</h2>
        <p className="text-gray-600 mt-2 mb-8" data-testid="404-message">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button className="bg-teal-600 hover:bg-teal-700" data-testid="404-home-btn">
            <Home className="w-4 h-4 mr-2" />Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
