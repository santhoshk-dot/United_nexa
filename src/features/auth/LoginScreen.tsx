import { useState } from 'react';
import { Eye, EyeOff, Truck, Mail, Lock, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const LoginScreen = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [year, setYear] = useState('2024-2025'); // Default year
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, loading, error } = useAuth();

  const isButtonDisabled = !email || !password || loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isButtonDisabled) return;

    try {
      await login(email, password, year);
      // Navigation is handled inside AuthContext on success
    } catch (err) {
      // Error is set in AuthContext
      console.error(err);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-background">
      {/* Background Aurora Effect */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl opacity-50 animate-pulse delay-1000" />
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-card/60 backdrop-blur-lg border border-border/30 rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3 mb-4 bg-primary/10 border border-primary/30 rounded-full">
            <Truck size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            United Transport
          </h1>
          <p className="text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Financial Year Field (NEW) */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-muted-foreground mb-2">
              Financial Year
            </label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                id="year"
                name="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-transparent border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="2023-2024">2023 - 2024</option>
                <option value="2024-2025">2024 - 2025</option>
                <option value="2025-2026">2025 - 2026</option>
              </select>
            </div>
          </div>
          
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-transparent border border-border/50 rounded-md placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-transparent border border-border/50 rounded-md placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive text-center p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              {error}
            </div>
          )}

          {/* Login Button */}
          <div>
            <button
              type="submit"
              disabled={isButtonDisabled}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium transition-all duration-300
                ${isButtonDisabled 
                  ? 'bg-muted text-muted-foreground/50 cursor-not-allowed' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-primary/30 hover:shadow-primary/50'
                }
              `}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};