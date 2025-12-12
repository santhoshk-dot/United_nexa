import { useState, useRef } from 'react';
import { Eye, EyeOff, ChevronRight, Box, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../schemas';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState<'email' | 'password' | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const { login, loading } = useAuth();

  const getCurrentFinancialYear = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const validateField = (name: string, value: string) => {
    try {
      const fieldSchema = (loginSchema.shape as any)[name];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          setFormErrors(prev => ({ ...prev, [name]: result.error.issues[0].message }));
        } else {
          setFormErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
        }
      }
    } catch (e) {}
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
    if (validationTimeouts.current.email) clearTimeout(validationTimeouts.current.email);
    validationTimeouts.current.email = setTimeout(() => {
      validateField('email', val);
    }, 1000);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
    if (validationTimeouts.current.password) clearTimeout(validationTimeouts.current.password);
    validationTimeouts.current.password = setTimeout(() => {
      validateField('password', val);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: any) => {
        if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
      });
      setFormErrors(newErrors);
      return;
    }
    if (loading) return;
    try {
      await login(email, password, getCurrentFinancialYear());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        
        * { font-family: 'Outfit', sans-serif; }
        
        /* ===== DESKTOP LEFT PANEL - LIGHT MODE (Dark Panel) ===== */
        .desktop-brand-panel {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          position: relative;
          overflow: hidden;
        }
        
        /* Grid pattern - Light Mode */
        .grid-pattern {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(hsl(var(--primary) / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.06) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        
        /* Gradient glow - Light Mode */
        .glow-effect {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%);
          top: 50%;
          right: -200px;
          transform: translateY(-50%);
          pointer-events: none;
        }
        
        /* Corner decorations - Light Mode */
        .corner-deco {
          position: absolute;
          width: 100px;
          height: 100px;
          border: 2px solid hsl(var(--primary) / 0.2);
        }
        
        .corner-deco-tl {
          top: 40px;
          left: 40px;
          border-right: none;
          border-bottom: none;
        }
        
        .corner-deco-br {
          bottom: 40px;
          right: 40px;
          border-left: none;
          border-top: none;
        }
        
        /* Left panel text colors - Light Mode (light text on dark) */
        .panel-text-primary {
          color: #f8fafc;
        }
        
        .panel-text-secondary {
          color: #94a3b8;
        }
        
        .panel-text-muted {
          color: #64748b;
        }
        
        /* Logo mark - Light Mode */
        .logo-mark {
          width: 52px;
          height: 52px;
          background: hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          box-shadow: 0 8px 24px hsl(var(--primary) / 0.3);
        }
        
        .logo-mark .logo-icon {
          color: #ffffff;
        }
        
        /* Status badge - Light Mode */
        .status-badge {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          padding: 10px 18px;
        }
        
        /* Stat divider - Light Mode */
        .stat-item:not(:last-child) {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Panel footer border - Light Mode */
        .panel-footer-border {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* ===== DESKTOP LEFT PANEL - DARK MODE (DEEP MIDNIGHT) ===== */
        .dark .desktop-brand-panel {
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
        }
        
        /* Grid pattern - Dark Mode */
        .dark .grid-pattern {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }
        
        /* Gradient glow - Dark Mode */
        .dark .glow-effect {
          background: radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%);
        }
        
        /* Corner decorations - Dark Mode */
        .dark .corner-deco {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        /* Left panel text colors - Dark Mode */
        .dark .panel-text-primary {
          color: #f8fafc;
        }
        
        .dark .panel-text-secondary {
          color: #cbd5e1;
        }
        
        .dark .panel-text-muted {
          color: #64748b;
        }
        
        /* Logo mark - Dark Mode */
        .dark .logo-mark {
          background: hsl(var(--primary));
          box-shadow: 0 8px 24px hsl(var(--primary) / 0.4);
        }
        
        .dark .logo-mark .logo-icon {
          color: #ffffff;
        }
        
        /* Status badge - Dark Mode */
        .dark .status-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        /* Stat divider - Dark Mode */
        .dark .stat-item:not(:last-child) {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Panel footer border - Dark Mode */
        .dark .panel-footer-border {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Stat value - Dark Mode */
        .dark .stat-value {
          color: #f8fafc;
        }
        
        /* ===== COMMON STYLES ===== */
        
        /* Highlight text */
        .highlight-text {
          color: hsl(var(--primary));
        }
        
        /* Stat item */
        .stat-item {
          text-align: center;
          padding: 0 20px;
        }
        
        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #f8fafc;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #64748b;
          margin-top: 8px;
        }
        
        .dark .stat-label {
          color: #94a3b8;
        }
        
        /* ===== RIGHT PANEL / FORM ===== */
        .form-container {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
        }
        
        /* ===== INPUT STYLING WITH ANIMATED UNDERLINE ===== */
        .input-wrapper {
          position: relative;
        }
        
        .input-minimal {
          background: transparent;
          border: none;
          border-bottom: 2px solid hsl(var(--border));
          border-radius: 0;
          padding: 16px 0;
          font-size: 17px;
          font-weight: 400;
          color: hsl(var(--foreground));
          width: 100%;
          transition: border-color 0.3s ease;
        }
        
        .input-minimal::placeholder {
          color: hsl(var(--muted-foreground) / 0.6);
        }
        
        /* Remove all focus styles from input itself */
        .input-minimal:focus {
          outline: none !important;
          box-shadow: none !important;
          border-bottom-color: hsl(var(--border));
        }
        
        .input-minimal:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
        
        .input-minimal.has-error {
          border-bottom-color: hsl(var(--destructive));
        }
        
        .input-minimal:-webkit-autofill,
        .input-minimal:-webkit-autofill:hover,
        .input-minimal:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 30px hsl(var(--background)) inset !important;
          -webkit-text-fill-color: hsl(var(--foreground)) !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        
        /* Animated underline */
        .input-underline {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          width: 100%;
          background: hsl(var(--primary));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }
        
        /* Animate underline on focus */
        .input-wrapper:focus-within .input-underline {
          transform: scaleX(1);
        }
        
        /* Error state underline */
        .input-underline.has-error {
          background: hsl(var(--destructive));
        }
        
        .input-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground));
          margin-bottom: 8px;
          display: block;
          transition: color 0.3s ease;
        }
        
        .input-label.active {
          color: hsl(var(--primary));
        }
        
        /* Button */
        .btn-main {
          background: hsl(var(--foreground));
          color: hsl(var(--background));
          border: none;
          padding: 18px 32px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.05em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .btn-main:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px hsl(var(--foreground) / 0.2);
        }
        
        .btn-main:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .btn-main::after {
          content: '';
          position: absolute;
          inset: 0;
          background: hsl(var(--primary));
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .btn-main:hover:not(:disabled)::after {
          transform: translateY(0);
        }
        
        .btn-main span {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        
        /* Entrance animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .anim-fadeUp {
          opacity: 0;
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .anim-fadeIn {
          opacity: 0;
          animation: fadeIn 1s ease forwards;
        }
        
        .anim-slideIn {
          opacity: 0;
          animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }
        .delay-6 { animation-delay: 0.6s; }
        .delay-7 { animation-delay: 0.7s; }
        
        /* Status dot */
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: blink 2s ease-in-out infinite;
        }
        
        /* Hover line effect */
        .hover-line {
          position: relative;
        }
        
        .hover-line::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 1px;
          background: hsl(var(--primary));
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s ease;
        }
        
        .hover-line:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        
        /* Mobile logo mark */
        .logo-mark-dark {
          width: 48px;
          height: 48px;
          background: hsl(var(--foreground));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Password toggle button */
        .password-toggle {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          padding: 8px;
          color: hsl(var(--muted-foreground));
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s ease;
          z-index: 2;
        }
        
        .password-toggle:hover {
          color: hsl(var(--foreground));
        }
        
        .password-toggle:focus {
          outline: none;
        }
      `}</style>

      {/* Main Layout */}
      <div className="relative z-10 min-h-screen flex">
        
        {/* ===== LEFT PANEL - BRAND (Desktop Only) ===== */}
        <div className="hidden lg:flex desktop-brand-panel lg:w-[55%] xl:w-[58%] 2xl:w-[60%] flex-col justify-between p-10 xl:p-14 2xl:p-16 relative">
          
          {/* Background Elements */}
          <div className="grid-pattern" />
          <div className="glow-effect" />
          
          {/* Corner Decorations */}
          <div className="corner-deco corner-deco-tl" />
          <div className="corner-deco corner-deco-br" />
          
          {/* Top Section - Logo & Badge */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4 anim-slideIn">
              <div className="logo-mark">
                <Box className="w-6 h-6 logo-icon" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-xl font-semibold tracking-tight panel-text-primary">
                  United Transport
                </div>
                <div className="text-[11px] font-medium tracking-[0.2em] uppercase panel-text-muted">
                  Enterprise Logistics
                </div>
              </div>
            </div>
            
            <div className="status-badge flex items-center gap-2 anim-fadeIn delay-3">
              <div className="status-dot" />
              <span className="text-[11px] font-medium panel-text-secondary">
                All systems operational
              </span>
            </div>
          </div>
          
          {/* Middle Section - Hero Content */}
          <div className="relative z-10 space-y-10 max-w-2xl">
            
            {/* Tagline */}
            <div className="space-y-6">
              <div className="anim-fadeUp delay-1">
                <span className="text-[11px] font-semibold tracking-[0.25em] uppercase highlight-text">
                  Fleet Management Platform
                </span>
              </div>
              
              <h1 className="anim-fadeUp delay-2">
                <span className="text-[clamp(2.8rem,4.5vw,4.5rem)] font-bold leading-[1.05] tracking-tight panel-text-primary block">
                  Streamline your
                </span>
                <span className="text-[clamp(2.8rem,4.5vw,4.5rem)] font-bold leading-[1.05] tracking-tight highlight-text block">
                  logistics operations
                </span>
                <span className="text-[clamp(2.8rem,4.5vw,4.5rem)] font-bold leading-[1.05] tracking-tight panel-text-primary block">
                  at scale.
                </span>
              </h1>
              
              <p className="text-lg panel-text-secondary leading-relaxed max-w-lg anim-fadeUp delay-3">
                Real-time visibility across your entire supply chain. Track, manage, 
                and optimize every delivery with enterprise-grade precision.
              </p>
            </div>
            
            {/* Stats Row */}
            <div className="flex anim-fadeUp delay-4">
              <div className="stat-item">
                <div className="stat-value">2.4M+</div>
                <div className="stat-label">Deliveries</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">150+</div>
                <div className="stat-label">Cities</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Support</div>
              </div>
            </div>
          </div>
          
          {/* Bottom Section - Footer */}
          <div className="relative z-10">
            <div className="flex items-center justify-between pt-4 panel-footer-border anim-fadeIn delay-5">
              <div className="flex items-center gap-6">
                <span className="text-[11px] font-medium panel-text-muted">ISO 27001</span>
                <span className="text-[11px] font-medium panel-text-muted">SOC 2</span>
                <span className="text-[11px] font-medium panel-text-muted">GDPR</span>
              </div>
              <span className="text-[11px] panel-text-muted">
                © {new Date().getFullYear()} United Transport
              </span>
            </div>
          </div>
          
        </div>
        
        {/* ===== RIGHT PANEL - LOGIN FORM ===== */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-16 bg-background">
          
          <div className="w-full max-w-[400px]">
            
            {/* ===== MOBILE HEADER ===== */}
            <div className="lg:hidden mb-12 anim-fadeUp">
              <div className="flex items-center gap-3 mb-8">
                <div className="logo-mark-dark">
                  <Box className="w-5 h-5 text-background" strokeWidth={1.5} />
                </div>
                <span className="text-base font-semibold text-foreground">United Transport</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground leading-tight">
                Streamline your<br />
                <span className="text-primary">logistics.</span>
              </h1>
            </div>
            
            {/* Form Card */}
            <div className="form-container p-8 sm:p-10 anim-fadeUp delay-1 lg:delay-2">
              
              {/* Form Header */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-primary" />
                  <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                    Account Login
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                  Welcome back
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your credentials to access your dashboard
                </p>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
                
                {/* Email */}
                <div className="anim-fadeUp delay-2 lg:delay-3">
                  <label 
                    htmlFor="email" 
                    className={`input-label ${isFocused === 'email' ? 'active' : ''}`}
                  >
                    Email
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleEmailChange}
                      onFocus={() => setIsFocused('email')}
                      onBlur={() => setIsFocused(null)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      placeholder="you@company.com"
                      required
                      className={`input-minimal ${formErrors.email ? 'has-error' : ''}`}
                    />
                    <div className={`input-underline ${formErrors.email ? 'has-error' : ''}`} />
                  </div>
                  {formErrors.email && (
                    <p className="text-[12px] text-destructive mt-2 flex items-center gap-2">
                      <span className="w-1 h-1 bg-destructive rounded-full" />
                      {formErrors.email}
                    </p>
                  )}
                </div>
                
                {/* Password */}
                <div className="anim-fadeUp delay-3 lg:delay-4">
                  <label 
                    htmlFor="password" 
                    className={`input-label ${isFocused === 'password' ? 'active' : ''}`}
                  >
                    Password
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={handlePasswordChange}
                      onFocus={() => setIsFocused('password')}
                      onBlur={() => setIsFocused(null)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      placeholder="Enter password"
                      required
                      className={`input-minimal ${formErrors.password ? 'has-error' : ''}`}
                      style={{ paddingRight: '48px' }}
                    />
                    <div className={`input-underline ${formErrors.password ? 'has-error' : ''}`} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="password-toggle"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-[12px] text-destructive mt-2 flex items-center gap-2">
                      <span className="w-1 h-1 bg-destructive rounded-full" />
                      {formErrors.password}
                    </p>
                  )}
                </div>
                
                {/* Submit */}
                <div className="pt-4 anim-fadeUp delay-4 lg:delay-5">
                  <button
                    type="submit"
                    disabled={loading || !email || !password || Object.keys(formErrors).length > 0}
                    className="btn-main w-full"
                  >
                    <span>
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ChevronRight size={18} />
                        </>
                      )}
                    </span>
                  </button>
                </div>
                
              </form>
            </div>
            
            {/* Bottom Links - MOBILE ONLY */}
            <div className="lg:hidden mt-8 flex items-center justify-between text-[12px] text-muted-foreground anim-fadeIn delay-5">
              <div className="flex items-center gap-4">
                <span className="hover-line cursor-pointer">Privacy</span>
                <span className="hover-line cursor-pointer">Terms</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Need help?</span>
                <a href="#" className="text-primary font-medium flex items-center gap-1 hover-line">
                  Contact
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
};
