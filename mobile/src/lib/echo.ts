import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { pusherConfig } from '@/config/pusher.config';

// Make Pusher available globally for Laravel Echo
(window as any).Pusher = Pusher;

// Configure Laravel Echo with Pusher Cloud
let echo: Echo<any> | null = null;
let connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed' = 'disconnected';

// Suppress Pusher connection errors during initial connection
const originalConsoleError = console.error;
const suppressPusherErrors = () => {
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress temporary Pusher connection errors during initial connection
    if (
      message.includes('WebSocket is closed before the connection is established') ||
      message.includes('WebSocket connection to') && message.includes('failed') ||
      message.includes('pusher-js') && message.includes('failed')
    ) {
      return; // Suppress these temporary errors
    }
    originalConsoleError.apply(console, args);
  };
};

const restoreConsoleError = () => {
  console.error = originalConsoleError;
};

// Function to initialize or reinitialize Echo with current token
export function initializeEcho() {
  const token = localStorage.getItem('token');
  
  // Check if Pusher is configured
  if (!pusherConfig.key) {
    console.log('ℹ️ Pusher not configured - real-time features disabled');
    console.log('ℹ️ To enable: Configure Pusher in VPS backend and set VITE_PUSHER_APP_KEY');
    return null;
  }
  
  // If echo already exists and has a valid connection, reuse it
  if (echo && connectionState === 'connected') {
    console.log('♻️ Reusing existing Pusher connection');
    return echo;
  }
  
  // Disconnect existing connection if any
  if (echo) {
    try {
      console.log('🔌 Disconnecting old Pusher connection...');
      echo.disconnect();
      connectionState = 'disconnected';
      echo = null;
      // Wait a bit for the connection to fully close
      setTimeout(() => {
        console.log('✅ Old connection closed');
      }, 500);
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Check if Pusher is configured
  if (!pusherConfig.key) {
    console.warn('⚠️ Pusher not configured. Please set up your Pusher Cloud credentials in .env file.');
    connectionState = 'failed';
    return null;
  }
  
  if (token) {
    try {
      // Suppress Pusher errors temporarily during connection attempt
      suppressPusherErrors();
      
      connectionState = 'connecting';
      
      // Use full URL for authEndpoint - ALWAYS
      // In Electron, relative URLs become file:// protocol which fails
      const authEndpoint = pusherConfig.authEndpoint.startsWith('http') 
        ? pusherConfig.authEndpoint 
        : 'http://104.248.226.62/api/broadcasting/auth';
      
      console.log('🔍 Pusher Auth Endpoint:', authEndpoint);
      
      echo = new Echo({
        broadcaster: 'pusher',
        key: pusherConfig.key,
        cluster: pusherConfig.cluster,
        forceTLS: pusherConfig.forceTLS,
        enabledTransports: pusherConfig.enabledTransports,
        authEndpoint: authEndpoint,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      });
      
      // Set up connection state listeners
      if (echo.connector?.pusher) {
        const pusher = echo.connector.pusher;
        
        pusher.connection.bind('connected', () => {
          connectionState = 'connected';
          restoreConsoleError();
          console.log('✅ Connected to Pusher Cloud - Real-time updates enabled');
        });
        
        pusher.connection.bind('disconnected', () => {
          connectionState = 'disconnected';
        });
        
        pusher.connection.bind('error', (error: any) => {
          connectionState = 'failed';
          restoreConsoleError();
          console.error('❌ Pusher Cloud connection error:', error);
          if (error?.error?.data?.code === 1006) {
            console.warn('⚠️ Connection closed - this is normal during reconnection');
          } else {
            console.warn('⚠️ Falling back to polling mode');
          }
        });
        
        pusher.connection.bind('authorization_error', (error: any) => {
          connectionState = 'failed';
          restoreConsoleError();
          console.error('❌ Pusher Authorization Error:', error);
          console.error('❌ This means /broadcasting/auth endpoint is not working!');
          console.error('❌ Fix: Add Broadcast::routes() to Laravel routes/api.php');
        });
        
        pusher.connection.bind('unavailable', () => {
          connectionState = 'failed';
          restoreConsoleError();
          console.warn('⚠️ Pusher Cloud unavailable - Falling back to polling mode');
        });
      }
      
      // Restore console after a short delay to allow initial connection attempt
      setTimeout(() => {
        restoreConsoleError();
        if (connectionState === 'connecting') {
          // If still connecting after delay, server might not be available
          // This is fine - polling will be used as fallback
        }
      }, 2000);
      
      return echo;
    } catch (error) {
      restoreConsoleError();
      connectionState = 'failed';
      // Don't log error - polling will be used silently
      return null;
    }
  }
  
  return null;
}

// Get connection state
export function getEchoConnectionState() {
  return connectionState;
}

// Check if Pusher is available
export function isPusherAvailable() {
  return connectionState === 'connected';
}

// DON'T initialize on module load - let components initialize when needed
// This prevents creating multiple WebSocket connections
// echo will be initialized by calling initializeEcho() when needed

export default echo;

