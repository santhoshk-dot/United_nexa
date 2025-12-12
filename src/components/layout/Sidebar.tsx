import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Truck,
  Store,
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
  Car, 
  UserCircle, 
  Settings,
  History,
  LogOut
} from 'lucide-react'; 
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { user, logout } = useAuth(); 
  
  const [isMasterOpen, setIsMasterOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/master') || location.pathname === '/users' || location.pathname === '/settings' || location.pathname === '/audit-logs') {
      setIsMasterOpen(true);
    }
  }, [location.pathname]);

  // --- MENU DEFINITIONS ---
  
  const operationLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'GC Entry', href: '/gc-entry', icon: FileText },
    { name: 'Loading Sheet', href: '/loading-sheet', icon: ClipboardList },
    { name: 'Trip Sheet', href: '/tripsheet', icon: Truck },
    { name: 'Pending Stock', href: '/pending-stock', icon: Archive },
  ];

  const masterLinks = [
    { name: 'Consignors', href: '/master/consignors', icon: Store },
    { name: 'Consignees', href: '/master/consignees', icon: Users },
    { name: 'Vehicles', href: '/master/vehicles', icon: Car },
    { name: 'Drivers', href: '/master/drivers', icon: UserCircle },
    { name: 'From Places', href: '/master/from-places', icon: MapPin },
    { name: 'To Places', href: '/master/to-places', icon: MapPin },
    { name: 'Packings', href: '/master/packings', icon: Package },
    { name: 'Contents', href: '/master/contents', icon: FileText },
  ];

  if (user?.role === 'admin') {
    masterLinks.unshift({ 
      name: 'Print Template Editor', 
      href: '/settings', 
      icon: Settings 
    });

    masterLinks.push({ 
      name: 'Audit Logs', 
      href: '/audit-logs', 
      icon: History 
    });

    masterLinks.push({ 
      name: 'User Management', 
      href: '/users', 
      icon: ShieldCheck 
    });
  }

  const isMasterActive = location.pathname.startsWith('/master') || location.pathname === '/users' || location.pathname === '/settings' || location.pathname === '/audit-logs';

  // Helper to check if a route is active (including nested routes like /trip-sheet/new)
  const isRouteActive = (href: string, pathname: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Reusable NavItem component
  const NavItem = ({ item }: { item: typeof operationLinks[0] }) => {
    const active = isRouteActive(item.href, location.pathname);
    
    return (
      <NavLink 
        to={item.href}
        end={item.href === '/'}
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        onClick={() => setIsSidebarOpen(false)}
        title={item.name}
      >
        <div className={`w-7 h-7 shrink-0 rounded flex items-center justify-center transition-colors ${
          active 
            ? 'bg-primary-foreground/20' 
            : 'bg-muted group-hover:bg-secondary'
        }`}>
          <item.icon className="w-4 h-4" />
        </div>
        <span className="truncate">{item.name}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Content */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div className="leading-none">
                <span className="text-sm font-bold text-foreground">United</span>
                <span className="text-sm font-bold text-primary ml-1">Transport</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            
            {/* --- OPERATIONS SECTION --- */}
            <div className="px-3 mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
                Operations
              </span>
            </div>
            
            {operationLinks.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}

            {/* --- MASTER SECTION (Collapsible) --- */}
            <button
              onClick={() => setIsMasterOpen(!isMasterOpen)}
              className="w-full flex items-center justify-between px-3 pt-5 pb-2 group"
            >
              <span className={`text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                isMasterActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground/70 group-hover:text-muted-foreground'
              }`}>
                Master
              </span>
              <ChevronDown 
                className={`w-3.5 h-3.5 transition-all duration-200 ${
                  isMasterActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground/50 group-hover:text-muted-foreground'
                } ${isMasterOpen ? 'rotate-0' : '-rotate-90'}`} 
              />
            </button>

            {/* Master Sub-menu items */}
            <div className={`overflow-hidden transition-all duration-300 ease-out ${
              isMasterOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="space-y-1">
                {masterLinks.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </div>

          </nav>
          
          {/* Footer - User Profile */}
          <div className="p-3 border-t border-border">
            <div className="p-2.5 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2.5">
                {/* Avatar */}
                <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                  user?.role === 'admin' 
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                    : 'bg-gradient-to-br from-primary to-primary/80'
                }`}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">
                    {user?.name || 'User'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      user?.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {user?.role || 'Role'}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-1.5 shrink-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};