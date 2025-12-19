import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getApiUrl } from '@/config/api.config';

export default function MobileAuth() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  // Clear old tokens on mount
  useEffect(() => {
    const oldToken = localStorage.getItem('token');
    if (oldToken) {
      console.log('Clearing old authentication token');
      localStorage.removeItem('token');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const loginUrl = getApiUrl('/login');
      console.log('🌐 Login URL:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ');
          throw new Error(errorMessages);
        }
        if (response.status === 401) {
          throw new Error('Invalid email or password');
        }
        throw new Error(data.message || 'Invalid credentials');
      }

      if (data.access_token && data.user) {
        login(data.access_token, data.user);
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err: any) {
      console.error('❌ Login error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pt-safe">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="w-20 h-20 mb-6">
            <img 
              src="https://i.postimg.cc/cJxqztmS/logo-png-01.png" 
              alt="MarqenConnect" 
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(225,247,0,0.4)]"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">MarqenConnect</h1>
          <p className="text-muted-foreground mt-2 text-center">
            Team collaboration made simple
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Email Field */}
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mobile-input pl-12 w-full"
                autoCapitalize="none"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mobile-input pl-12 pr-12 w-full"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground touch-target flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/30 rounded-xl p-4"
            >
              <p className="text-destructive text-sm text-center">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="mobile-btn w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.form>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground">
            Contact your admin for account access
          </p>
        </motion.div>
      </div>

      {/* Version */}
      <div className="pb-safe px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground/50">v1.0.0</p>
      </div>
    </div>
  );
}
