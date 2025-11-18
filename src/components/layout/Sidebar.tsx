import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Users, 
  X, 
  FileText, 
  Archive, 
  LayoutDashboard, 
  MapPin, 
  Package, 
  ClipboardList, 
  Settings,
  ShieldCheck 
} from 'lucide-react'; 
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  
  const [mode, setMode] = useState<'operations' | 'master'>('operations');

  useEffect(() => {
    if (location.pathname.startsWith('/master') || location.pathname === '/users') {
      setMode('master');
    } else {
      setMode('operations');
    }
  }, [location.pathname]);

  const handleModeSwitch = (newMode: 'operations' | 'master') => {
    setMode(newMode);
    if (newMode === 'operations') {
      navigate('/');
    } else {
      navigate('/master');
    }
    setIsSidebarOpen(false);
  };
  
  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  // --- MENU DEFINITIONS ---
  const operationsLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'GC Entry', href: '/gc-entry', icon: FileText },
    { name: 'Loading Sheet', href: '/loading-sheet', icon: ClipboardList },
    { name: 'Trip Sheet', href: '/trip-sheet', icon: Truck },
    { name: 'Pending Stock', href: '/pending-stock', icon: Archive },
  ];

  const masterLinks = [
    { name: 'Master Dashboard', href: '/master', icon: Settings },
    { name: 'Consignors', href: '/master/consignors', icon: Truck },
    { name: 'Consignees', href: '/master/consignees', icon: Users },
    { name: 'From Places', href: '/master/from-places', icon: MapPin },
    { name: 'To Places', href: '/master/to-places', icon: MapPin },
    { name: 'Packings', href: '/master/packings', icon: Package },
    { name: 'Contents', href: '/master/contents', icon: FileText },
  ];

  // --- CONDITIONAL LINK: User Management ---
  if (user?.role === 'admin') {
    masterLinks.push({ name: 'User Management', href: '/users', icon: ShieldCheck });
  }

  const currentLinks = mode === 'operations' ? operationsLinks : masterLinks;

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Content */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-background shadow-lg transform transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-muted">
            <div className="flex items-center">
              <Truck size={28} className="text-primary" />
              <span className="ml-3 text-xl font-bold">United Transport</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          {/* --- TAB SWITCHER --- */}
          <div className="p-4 pb-2">
            <div className="flex rounded-md bg-muted/50 p-1">
              <button
                onClick={() => handleModeSwitch('operations')}
                className={`flex-1 py-1.5 text-sm font-medium rounded transition-all ${
                  mode === 'operations' 
                    ? 'bg-primary text-white shadow' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Operations
              </button>
              <button
                onClick={() => handleModeSwitch('master')}
                className={`flex-1 py-1.5 text-sm font-medium rounded transition-all ${
                  mode === 'master' 
                    ? 'bg-primary text-white shadow' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Master
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pl-2">
              {mode === 'operations' ? 'Daily Tasks' : 'Data Management'}
            </div>
            
            {currentLinks.map((item) => (
              <NavLink 
                key={item.name} 
                to={item.href} 
                // Use 'end' to match specific paths (like /master) without matching subpaths
                end={item.href === '/master' || item.href === '/'} 
                className={getLinkClass}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="mr-3" size={18} />
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          {/* Sidebar Footer with User Info */}
          <div className="p-4 border-t border-muted text-center">
            <div className="flex items-center gap-3">
              {/* FIX: Added safe check for user.name before calling charAt */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${user?.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden text-left">
                <div className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-muted-foreground capitalize">{user?.role || 'Role'}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};