import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Truck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const LoginScreen = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState<'email' | 'password' | null>(null);
  
  const { login, loading, error } = useAuth();

  const getCurrentFinancialYear = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    try {
      await login(email, password, getCurrentFinancialYear());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-background overflow-hidden">
      
      {/* --- LEFT PANEL: PREMIUM BRANDING --- */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between p-12 overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />

        <div className="relative z-10 animate-in slide-in-from-left-8 duration-700">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 border border-white/10 backdrop-blur-sm">
              <Truck className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              United Transport
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-xl space-y-8 animate-in slide-in-from-bottom-10 duration-1000 delay-200">
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
             Manage your logistics with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              precision.
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-md">
            Seamlessly manage GC entries, trip sheets, and real-time inventory with our next-generation logistics platform.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-sm font-medium text-slate-500 animate-in fade-in duration-1000 delay-500">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors cursor-default">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Enterprise Security</span>
          </div>
          <span className="opacity-60">&copy; {new Date().getFullYear()} United Transport</span>
        </div>
      </div>

      {/* --- RIGHT PANEL: INTERACTIVE FORM --- */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        
        <div className="absolute inset-0 lg:hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-slate-100 dark:from-blue-950/30 dark:via-slate-950 dark:to-black" />
        </div>

        <div className="relative w-full max-w-[440px] animate-in zoom-in-95 duration-500 delay-100">
          
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-8 md:p-10 overflow-hidden">
            
            <div className="text-center mb-10 space-y-2">
              <div className="inline-flex lg:hidden h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/20 mb-6">
                <Truck size={32} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome Back
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Please enter your credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="group space-y-2">
                <label 
                  htmlFor="email" 
                  className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors ${isFocused === 'email' ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Email Address
                </label>
                <div 
                  className={`relative flex items-center rounded-xl border-2 transition-colors duration-300 overflow-hidden ${
                    isFocused === 'email' 
                      ? 'border-blue-600 bg-slate-50 dark:bg-slate-900' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300' 
                  }`}
                >
                  <div className={`pl-4 z-10 transition-colors duration-300 ${isFocused === 'email' ? 'text-blue-600' : 'text-slate-400'}`}>
                    <Mail size={20} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused('email')}
                    onBlur={() => setIsFocused(null)}
                    className="w-full bg-transparent px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 relative z-0"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label 
                    htmlFor="password"
                    className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors ${isFocused === 'password' ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Password
                  </label>
                </div>
                <div 
                  className={`relative flex items-center rounded-xl border-2 transition-colors duration-300 overflow-hidden ${
                    isFocused === 'password' 
                      ? 'border-blue-600 bg-slate-50 dark:bg-slate-900' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300' 
                  }`}
                >
                  <div className={`pl-4 z-10 transition-colors duration-300 ${isFocused === 'password' ? 'text-blue-600' : 'text-slate-400'}`}>
                    <Lock size={20} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused('password')}
                    onBlur={() => setIsFocused(null)}
                    className="w-full bg-transparent px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 relative z-0"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pr-4 z-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-2 duration-300">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="group relative w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none active:scale-[0.98]"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};