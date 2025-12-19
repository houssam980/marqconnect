// Centralized API configuration
// This will work in both development, production, and Electron

// Check if we're in development mode (Vite dev server with proxy)
const isDev = import.meta.env.DEV;

// In dev mode, use relative URL to go through Vite proxy (avoids CORS)
// In production/Capacitor, use the full VPS URL
const API_BASE_URL = isDev ? '/api' : 'http://104.248.226.62/api';

/**
 * Get the full API URL for a given endpoint
 * @param endpoint - The API endpoint (e.g., '/users', '/projects')
 * @returns Full URL for the API call
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Use relative path in dev (proxied), full URL in production
  const fullUrl = `${API_BASE_URL}/${cleanEndpoint}`;
  console.log('🌐 API URL:', fullUrl, isDev ? '(via proxy)' : '(direct)');
  return fullUrl;
};

/**
 * Make an authenticated API request
 * @param endpoint - The API endpoint
 * @param options - Fetch options
 * @returns Promise with the response
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(getApiUrl(endpoint), {
    ...options,
    headers,
  });
};

export default {
  getApiUrl,
  apiRequest,
};
