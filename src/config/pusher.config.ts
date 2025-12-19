// Pusher Cloud Configuration
// Get these values from your Pusher Cloud dashboard: https://dashboard.pusher.com/

export const pusherConfig = {
  // Your Pusher App Key (public key - safe to expose in frontend)
  key: import.meta.env.VITE_PUSHER_APP_KEY || '',
  
  // Pusher cluster (e.g., 'us2', 'eu', 'ap1', etc.)
  cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
  
  // Force TLS for secure connections (always true for Pusher Cloud)
  forceTLS: true,
  
  // Enable encrypted transport
  enabledTransports: ['ws', 'wss'] as ('ws' | 'wss')[],
  
  // Authentication endpoint - use full URL for Electron
  authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT || 'http://104.248.226.62/api/broadcasting/auth',
  
  // Backend API base URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://104.248.226.62/api',
};

// Validate configuration
if (!pusherConfig.key) {
  console.warn('⚠️ Pusher App Key not found. Please set VITE_PUSHER_APP_KEY in your .env file');
}
