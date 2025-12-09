import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Truck,Store,
  Users, 
  X, 
  FileText, 
  Archive, 
  LayoutDashboard, 
  MapPin, 
  Package, 
  ClipboardList, 
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Database,
  Car, 
  UserCircle, 
  Settings 
} from 'lucide-react'; 
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth(); 
  
  const [isDataMgmtOpen, setIsDataMgmtOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/master') || location.pathname === '/users' || location.pathname === '/settings') {
      setIsDataMgmtOpen(true);
    }
  }, [location.pathname]);

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  // --- MENU DEFINITIONS ---
  
  // 1. Top Level Links (Daily Operations)
  const operationLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'GC Entry', href: '/gc-entry', icon: FileText },
    { name: 'Loading Sheet', href: '/loading-sheet', icon: ClipboardList },
    { name: 'Trip Sheet', href: '/trip-sheet', icon: Truck },
    { name: 'Pending Stock', href: '/pending-stock', icon: Archive },
  ];

  // 2. Sub-Menu Links (Data Management)
  // 🟢 CHANGE: Removed 'Print Settings' from here. It is now added conditionally below.
  const dataManagementLinks = [
    { name: 'Consignors', href: '/master/consignors', icon: Store },
    { name: 'Consignees', href: '/master/consignees', icon: Users },
    { name: 'Vehicles', href: '/master/vehicles', icon: Car },
    { name: 'Drivers', href: '/master/drivers', icon: UserCircle },
    { name: 'From Places', href: '/master/from-places', icon: MapPin },
    { name: 'To Places', href: '/master/to-places', icon: MapPin },
    { name: 'Packings', href: '/master/packings', icon: Package },
    { name: 'Contents', href: '/master/contents', icon: FileText },
  ];

  // 3. Admin Only Links
  if (user?.role === 'admin') {
    // 🟢 Added Print Settings for Admin only
    // unshift adds it to the start of the list (to keep your previous order)
    dataManagementLinks.unshift({ 
      name: 'Print Settings', 
      href: '/settings', 
      icon: Settings 
    });

    // User Management for Admin only
    dataManagementLinks.push({ 
      name: 'User Management', 
      href: '/users', 
      icon: ShieldCheck 
    });
  }

  const isDataMgmtActive = location.pathname.startsWith('/master') || location.pathname === '/users' || location.pathname === '/settings';

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

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            
            {/* --- DAILY OPERATIONS --- */}
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-2 mt-2">
              Operations
            </div>
            
            {operationLinks.map((item) => (
              <NavLink 
                key={item.name} 
                to={item.href} 
                end={item.href === '/'} 
                className={getLinkClass}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="mr-3" size={18} />
                {item.name}
              </NavLink>
            ))}

            {/* --- DATA MANAGEMENT --- */}
            <div className="pt-4">
              <button
                onClick={() => setIsDataMgmtOpen(!isDataMgmtOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium ${
                  isDataMgmtActive 
                    ? 'bg-muted/80 text-foreground' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center">
                  <Database className="mr-3" size={18} />
                  Settings
                </div>
                {isDataMgmtOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isDataMgmtOpen ? 'max-h-[600px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                {dataManagementLinks.map((item) => (
                  <NavLink 
                    key={item.name} 
                    to={item.href}
                    end={item.href === '/master'} 
                    className={({ isActive }) => 
                      `flex items-center pl-11 pr-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                        isActive
                          ? 'text-primary font-medium bg-primary/5'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 opacity-70" size={16} />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>

          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-muted text-center bg-muted/20">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${user?.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'}`}>
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