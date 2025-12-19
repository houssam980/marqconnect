// Centralized API configuration
// This will work in both development, production, and Electron

// Default to VPS backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://104.248.226.62/api';

/**
 * Get the full API URL for a given endpoint
 * @param endpoint - The API endpoint (e.g., '/users', '/projects')
 * @returns Full URL for the API call
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // ALWAYS use full VPS URL - no relative paths
  const fullUrl = `http://104.248.226.62/api/${cleanEndpoint}`;
  console.log('🌐 API URL:', fullUrl);
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
  
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
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
