import { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import MobileAuth from './pages/MobileAuth';
import MobileHome from './pages/MobileHome';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  useEffect(() => {
    console.log('Mobile App mounted');
    console.log('Current location:', location.pathname);
  }, [location]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (token && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [token, location.pathname, navigate]);

  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <img 
              src="https://i.postimg.cc/cJxqztmS/logo-png-01.png" 
              alt="Logo" 
              className="w-16 h-16 animate-pulse-soft"
            />
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<MobileAuth />} />
          <Route path="/dashboard/*" element={<MobileHome />} />
        </Routes>
      </div>
    </Suspense>
  );
}

export default App;
