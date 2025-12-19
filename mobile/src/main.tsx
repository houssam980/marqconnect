import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth-context';

// Capacitor imports
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Initialize Capacitor plugins
const initCapacitor = async () => {
  try {
    // Set status bar style
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
    
    // Hide splash screen after app is ready
    await SplashScreen.hide();
  } catch (error) {
    // Running in browser, not Capacitor
    console.log('Running in browser mode');
  }
};

// Handle back button on Android
CapApp.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    CapApp.exitApp();
  } else {
    window.history.back();
  }
});

initCapacitor();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
