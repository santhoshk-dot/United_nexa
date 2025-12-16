import { useState } from 'react';
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
  Car,
  UserCircle,
  History,
  LogOut,
  ScrollText,
  Printer,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // State for collapsible sections
  const [isMastersExpanded, setIsMastersExpanded] = useState(true);
  const [isReportsExpanded, setIsReportsExpanded] = useState(true);
  const [isAdminExpanded, setIsAdminExpanded] = useState(true);

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

  // 🟢 Moved User Management here (Admin Only)
  if (user?.role === 'admin') {
    masterLinks.push({
      name: 'User Management',
      href: '/users',
      icon: ShieldCheck
    });
  }

  // Admin Specific Groups
  const monitoringLinks = user?.role === 'admin' ? [
    { name: 'Audit Logs', href: '/audit-logs', icon: History },
    { name: 'Terms Logs', href: '/terms-logs', icon: ScrollText },
  ] : [];

  const configLinks = user?.role === 'admin' ? [
    { name: 'Print Templates', href: '/settings', icon: Printer },
    // User Management removed from here
  ] : [];

  // Helper to check if a route is active
  const isRouteActive = (href: string, pathname: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Helper to check if any link in a group is active
  const checkGroupActive = (links: { href: string }[]) => links.some(link => isRouteActive(link.href, location.pathname));

  const isOperationsActive = checkGroupActive(operationLinks);
  const isMastersActive = checkGroupActive(masterLinks);
  const isMonitoringActive = checkGroupActive(monitoringLinks);
  const isConfigActive = checkGroupActive(configLinks);

  // Reusable NavItem Component
  const NavItem = ({ item }: { item: { name: string; href: string; icon: any } }) => {
    const active = isRouteActive(item.href, location.pathname);

    return (
      <NavLink
        to={item.href}
        end={item.href === '/'}
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        onClick={() => setIsSidebarOpen(false)}
        title={item.name}
      >
        <div className={`w-7 h-7 shrink-0 rounded flex items-center justify-center transition-colors ${active
          ? 'bg-primary-foreground/20'
          : 'bg-muted group-hover:bg-secondary'
          }`}>
          <item.icon className="w-4 h-4" />
        </div>
        <span className="truncate">{item.name}</span>
      </NavLink>
    );
  };

  // Section Header Component
  const SectionHeader = ({ title, isOpen, onToggle, active }: { title: string, isOpen: boolean, onToggle: () => void, active?: boolean }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 pt-4 pb-2 group"
    >
      <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${active ? 'text-primary' : 'text-muted-foreground/60'}`}>
        {title}
      </span>
      <ChevronRight
        className={`w-3 h-3 text-muted-foreground/40 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
      />
    </button>
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Content */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
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

          {/* Scrollable Navigation */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar">

            {/* 1. OPERATIONS (Always Open) */}
            <div className="mb-2">
              <div className="px-3 pt-3 pb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isOperationsActive ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  Operations
                </span>
              </div>
              <div className="space-y-0.5">
                {operationLinks.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </div>

            {/* 2. MASTER DATA */}
            <SectionHeader
              title="Master Data"
              isOpen={isMastersExpanded}
              onToggle={() => setIsMastersExpanded(!isMastersExpanded)}
              active={isMastersActive}
            />
            <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${isMastersExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {masterLinks.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>

            {/* 3. ADMIN SECTIONS (Only if Admin) */}
            {user?.role === 'admin' && (
              <>
                {/* LOGS & MONITORING */}
                <SectionHeader
                  title="Monitoring & Logs"
                  isOpen={isReportsExpanded}
                  onToggle={() => setIsReportsExpanded(!isReportsExpanded)}
                  active={isMonitoringActive}
                />
                <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${isReportsExpanded ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {monitoringLinks.map((item) => (
                    <NavItem key={item.name} item={item} />
                  ))}
                </div>

                {/* SETTINGS & CONFIG */}
                <SectionHeader
                  title="Configuration"
                  isOpen={isAdminExpanded}
                  onToggle={() => setIsAdminExpanded(!isAdminExpanded)}
                  active={isConfigActive}
                />
                <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${isAdminExpanded ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {configLinks.map((item) => (
                    <NavItem key={item.name} item={item} />
                  ))}
                </div>
              </>
            )}

            {/* Bottom Padding for scroll */}
            <div className="h-6" />
          </nav>

          {/* Footer - User Profile */}
          <div className="p-3 border-t border-border mt-auto shrink-0 bg-card">
            <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2.5">
                {/* Avatar */}
                <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm ${user?.role === 'admin'
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
                    <span className={`w-1.5 h-1.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'
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