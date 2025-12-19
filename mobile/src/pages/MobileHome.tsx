import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MobileHeader from '@/components/mobile/MobileHeader';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import MobileTaskBoard from './MobileTaskBoard';
import MobileGeneralSpace from './MobileGeneralSpace';
import MobileProjectSpace from './MobileProjectSpace';
import MobileEvents from './MobileEvents';
import MobileSettings from './MobileSettings';
import MobileEquipe from './MobileEquipe';
import { useAuth } from '@/lib/auth-context';
import { activityTracker } from '@/services/activityTracker';

export default function MobileHome() {
  const [activePage, setActivePage] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Initialize activity tracking
  useEffect(() => {
    activityTracker.start();
    return () => {
      activityTracker.stop();
    };
  }, []);

  // Sync activePage with route
  useEffect(() => {
    const path = location.pathname.replace('/dashboard', '').replace('/', '') || 'home';
    setActivePage(path);
  }, [location]);

  const handleNavigate = (page: string) => {
    setActivePage(page);
    if (page === 'home') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${page}`);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const renderContent = () => {
    switch (activePage) {
      case 'home':
        return <MobileTaskBoard />;
      case 'general':
        return <MobileGeneralSpace />;
      case 'project':
        return <MobileProjectSpace />;
      case 'events':
        return <MobileEvents />;
      case 'equipe':
        return user?.role === 'admin' ? <MobileEquipe /> : <MobileTaskBoard />;
      case 'settings':
        return <MobileSettings />;
      default:
        return <MobileTaskBoard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <MobileHeader onNavigate={handleNavigate} activePage={activePage} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activePage={activePage} onNavigate={handleNavigate} />
    </div>
  );
}
