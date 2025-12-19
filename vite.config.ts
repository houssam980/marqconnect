import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./", // Use relative paths for Electron
  optimizeDeps: {
    entries: ["src/main.tsx"],
  },
  plugins: [
    react(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: true,
    proxy: {
      // Proxy all /api/* requests to Laravel backend on VPS
      '/api': {
        target: 'http://104.248.226.62',
        changeOrigin: true,
        secure: false,
        ws: false,
        rewrite: (path) => path, // Keep the /api prefix
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔍 [Vite Proxy] ✅ INTERCEPTED:', req.method, req.url);
            console.log('🔍 [Vite Proxy] Target URL:', `http://104.248.226.62${req.url}`);
            // Forward all headers including Authorization
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            proxyReq.setHeader('Accept', 'application/json');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🔍 [Vite Proxy] ✅ Response:', proxyRes.statusCode, req.url);
            if (proxyRes.statusCode === 404) {
              console.error('❌ [Vite Proxy] 404 - Backend route not found!');
              console.error('❌ [Vite Proxy] Requested:', `http://104.248.226.62${req.url}`);
              console.error('❌ [Vite Proxy] Method:', req.method);
              console.error('❌ [Vite Proxy] Headers:', JSON.stringify(req.headers, null, 2));
            } else if (proxyRes.statusCode === 200) {
              console.log('✅ [Vite Proxy] Success!');
            }
          });
          proxy.on('error', (err, _req, _res) => {
            console.error('❌ [Vite Proxy] Error:', err.message);
          });
        },
      },
      // Proxy /broadcasting/* requests for Pusher authentication
      '/broadcasting': {
        target: 'http://104.248.226.62',
        changeOrigin: true,
        secure: false,
        ws: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔍 [Broadcasting Proxy] ✅ INTERCEPTED:', req.method, req.url);
            // Forward all headers including Authorization
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            proxyReq.setHeader('Accept', 'application/json');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('🔍 [Broadcasting Proxy] ✅ Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  }
});
