import { useState, useEffect } from 'react';
import { Menu, LogOut, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Header = ({ setIsSidebarOpen }: HeaderProps) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  // --- DYNAMIC TITLE LOGIC ---
  const getPageInfo = (pathname: string): { title: string; breadcrumb?: string } => {
    if (pathname === '/') return { title: 'Dashboard' };
    
    // Operations
    if (pathname.startsWith('/gc-entry/new')) return { title: 'New GC Entry', breadcrumb: 'GC Entry' };
    if (pathname.startsWith('/gc-entry/edit')) {
      const segments = pathname.split('/');
      const id = segments[segments.length - 1];
      return { title: `Edit GC #${id}`, breadcrumb: 'GC Entry' };
    }
    if (pathname.startsWith('/gc-entry')) return { title: 'GC Entry' };
    if (pathname.startsWith('/loading-sheet')) return { title: 'Loading Sheet' };
    if (pathname.startsWith('/tripsheet/new')) return { title: 'New Trip Sheet', breadcrumb: 'Trip Sheet' };
    if (pathname.startsWith('/tripsheet/edit')) {
      const segments = pathname.split('/');
      const id = segments[segments.length - 1];
      return { title: `Edit TS #${id}`, breadcrumb: 'Trip Sheet' };
    }
    if (pathname.startsWith('/tripsheet')) return { title: 'Trip Sheet' };
    if (pathname.startsWith('/pending-stock')) return { title: 'Pending Stock' };

    // Settings
    if (pathname === '/settings') return { title: 'Print Template Editor', breadcrumb: 'Settings' };
    if (pathname === '/audit-logs') return { title: 'Audit Logs', breadcrumb: 'Settings' };
    if (pathname === '/terms-logs') return { title: 'Terms Log Monitoring', breadcrumb: 'Settings' };
    // Masters
    if (pathname === '/master') return { title: 'Master Dashboard' };
    if (pathname.startsWith('/master/consignors')) return { title: 'Consignors', breadcrumb: 'Master' };
    if (pathname.startsWith('/master/consignees')) return { title: 'Consignees', breadcrumb: 'Master' };
    if (pathname.startsWith('/master/from-places')) return { title: 'From Places', breadcrumb: 'Master' };
    if (pathname.startsWith('/master/to-places')) return { title: 'To Places', breadcrumb: 'Master' };
    if (pathname.startsWith('/master/packings')) return { title: 'Packing Units', breadcrumb: 'Master' };
    if (pathname.startsWith('/master/contents')) return { title: 'Contents', breadcrumb: 'Master' };
    if (pathname.startsWith('/master/vehicles')) return { title: 'Vehicles', breadcrumb: 'Master' };
    if (pathname.startsWith('/master/drivers')) return { title: 'Drivers', breadcrumb: 'Master' };
    
    // Admin
    if (pathname.startsWith('/users')) return { title: 'User Management', breadcrumb: 'Admin' };

    return { title: 'United Transport' };
  };

  const pageInfo = getPageInfo(location.pathname);

  // --- THEME LOGIC ---
  const [theme, setTheme] = useState<string>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    logout(); 
  };

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="flex-shrink-0 h-16 bg-card border-b border-border z-10 transition-colors duration-300">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        
        {/* Left Side: Hamburger & Title */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="w-5 h-5" />
          </button>

          {/* Title & Breadcrumb */}
          <div className="flex flex-col">
            {/* Breadcrumb - Desktop only */}
            {/* {pageInfo.breadcrumb && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <span>{pageInfo.breadcrumb}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground">{pageInfo.title}</span>
              </div>
            )} */}
            
            {/* Main Title */}
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              {pageInfo.breadcrumb ? (
                <span className="sm:hidden">{pageInfo.title}</span>
              ) : (
                pageInfo.title
              )}
              {pageInfo.breadcrumb && (
                <span className="hidden sm:inline">{pageInfo.title}</span>
              )}
            </h1>
            
            {/* Greeting for Dashboard */}
            {location.pathname === '/' && user?.name && (
              <p className="text-sm text-muted-foreground hidden sm:block">
                {getGreeting()}, <span className="font-medium text-foreground">{user.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <div className="relative w-5 h-5">
              <Sun className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${
                theme === 'dark' 
                  ? 'rotate-0 scale-100 opacity-100' 
                  : 'rotate-90 scale-0 opacity-0'
              }`} />
              <Moon className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${
                theme === 'dark' 
                  ? '-rotate-90 scale-0 opacity-0' 
                  : 'rotate-0 scale-100 opacity-100'
              }`} />
            </div>
          </button>

          {/* Divider - Desktop only */}
          <div className="hidden sm:block w-px h-6 bg-border mx-1" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};