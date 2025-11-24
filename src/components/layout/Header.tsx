import { useState, useEffect } from 'react';
import { Menu, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Header = ({ setIsSidebarOpen }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- DYNAMIC TITLE LOGIC ---
  const getPageTitle = (pathname: string) => {
    if (pathname === '/') return '';
    
    // Operations
    if (pathname.startsWith('/gc-entry/new')) return 'New GC Entry';
    
    // UPDATE 1: Extract GC Number from URL
    if (pathname.startsWith('/gc-entry/edit')) {
      const segments = pathname.split('/');
      const id = segments[segments.length - 1]; // Get the last part (the ID)
      return `Edit GC Entry #${id}`;
    }
    if (pathname.startsWith('/gc-entry')) return 'GC Entry Listing';
    
    if (pathname.startsWith('/loading-sheet')) return 'Loading Sheet Entry';
    
    if (pathname.startsWith('/tripsheet/new')) return 'New Trip Sheet';
    
    // UPDATE 2: Extract Trip Sheet Number from URL
    if (pathname.startsWith('/tripsheet/edit')) {
      const segments = pathname.split('/');
      const id = segments[segments.length - 1]; // Get the last part (the ID)
      return `Edit Trip Sheet #${id}`;
    }
    if (pathname.startsWith('/trip-sheet')) return 'Trip Sheet Listing';
    
    if (pathname.startsWith('/pending-stock')) return 'Pending Stock History';

    // Masters
    if (pathname === '/master') return 'Master Dashboard';
    if (pathname.startsWith('/master/consignors')) return 'Consignors Management';
    if (pathname.startsWith('/master/consignees')) return 'Consignees Management';
    if (pathname.startsWith('/master/from-places')) return 'From Places Management';
    if (pathname.startsWith('/master/to-places')) return 'To Places Management';
    if (pathname.startsWith('/master/packings')) return 'Packing Units Management';
    if (pathname.startsWith('/master/contents')) return 'Contents Management';
    
    // ADDED TITLES FOR NEW MODULES
    if (pathname.startsWith('/master/vehicles')) return 'Vehicle Management';
    if (pathname.startsWith('/master/drivers')) return 'Driver Management';
    
    // Admin
    if (pathname.startsWith('/users')) return 'User Management';

    return 'United Transport'; // Fallback
  };

  const pageTitle = getPageTitle(location.pathname);

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
    navigate('/logout');
  };

  return (
    <header className="flex-shrink-0 h-16 bg-background shadow-md z-10 transition-colors duration-300">
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        
        {/* Left Side: Hamburger & Dynamic Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu size={22} />
          </button>

          {/* DYNAMIC TITLE DISPLAY */}
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Right Side: Theme & Logout */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="flex items-center p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center text-muted-foreground hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
            <span className="ml-2 text-sm font-medium hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};