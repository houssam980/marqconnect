import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, Key, ArrowRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getApiUrl } from "@/config/api.config";

export default function AuthForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  // Clear old tokens on component mount to ensure fresh login to VPS
  React.useEffect(() => {
    const oldToken = localStorage.getItem("token");
    if (oldToken) {
      console.log("Clearing old authentication token for VPS connection");
      localStorage.removeItem("token");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        console.log("🔐 Attempting login to VPS backend:", email);
        
        const loginUrl = getApiUrl('/login');
        console.log("🌐 Login URL:", loginUrl);
        
        const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        console.log("🔐 Login response status:", response.status);
        const data = await response.json();
        console.log("🔐 Login response data:", data);

        if (!response.ok) {
            // Handle Laravel validation errors specifically
            if (response.status === 422 && data.errors) {
                const errorMessages = Object.values(data.errors).flat().join(", ");
                throw new Error(errorMessages);
            }
            if (response.status === 401) {
                throw new Error("Invalid email or password. Please check your credentials.");
            }
            throw new Error(data.message || "Invalid credentials");
        }

        // Use AuthContext to log the user in
        console.log("✅ Login success! Token received:", data.access_token ? "Yes" : "No");
        
        if (data.access_token && data.user) {
            login(data.access_token, data.user);
            navigate("/dashboard");
        } else {
            throw new Error("Invalid response from server");
        }

    } catch (err: any) {
        console.error("❌ Login error:", err.message);
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto p-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
          className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
        >
          {/* Ambient Background Effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(225,247,0,0.08)_0%,transparent_50%)]"
            />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>

          {/* Logo */}
          <div className="relative z-10 flex flex-col items-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              animate={{ y: [0, -5, 0] }}
              transition={{
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                default: { duration: 0.3 },
              }}
              className="w-16 h-16 mb-4 relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src="https://i.postimg.cc/cJxqztmS/logo-png-01.png"
                alt="Nexus Logo"
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(225,247,0,0.3)]"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-white tracking-tight text-center">
                Welcome Back
              </h2>
              <p className="text-muted-foreground text-sm mt-1 text-center">
                Enter your credentials to access the workspace
              </p>
            </motion.div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="relative z-10">
            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
              onSubmit={handleSubmit}
            >
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="pl-10 bg-secondary/30 border-white/10 focus-visible:ring-primary/50 transition-all duration-300"
                        required
                      />
                    </div>
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-secondary/30 border-white/10 focus-visible:ring-primary/50 transition-all duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>

              <motion.div variants={itemVariants}>
                <Button disabled={isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(225,247,0,0.2)] hover:shadow-[0_0_30px_rgba(225,247,0,0.4)] transition-all duration-300 group mt-6">
                  {isLoading ? "Signing In..." : "Sign In"}
                  {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </motion.div>
            </motion.form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
