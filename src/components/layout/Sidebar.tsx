import { NavLink } from 'react-router-dom';
// --- IMPORT NEW ICON ---
import { Truck, Users, X, FileText, Archive } from 'lucide-react'; 
// --- END IMPORT ---

const navLinks = [
  { name: 'Consignors', href: '/consignors', icon: Truck },
  { name: 'Consignees', href: '/consignees', icon: Users },
  { name: 'GC Entry', href: '/gc-entry', icon: FileText },
  // --- ADD NEW LINK ---
  { name: 'Pending Stock', href: '/pending-stock', icon: Archive },
  // --- END NEW LINK ---
];

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  
  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <>
      {/* Mobile Sidebar (Overlay) */}
      <div 
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar Content */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-background shadow-lg transform transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-muted">
             <div className="flex items-center">
            <Truck size={28} className="text-primary" />
            <span className="ml-3 text-xl font-bold">United Transport</span>
          </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {navLinks.map((item) => (
              <NavLink 
                key={item.name} 
                to={item.href} 
                className={getLinkClass}
                onClick={() => setIsSidebarOpen(false)} // Close on mobile nav click
              >
                <item.icon className="mr-3" size={18} />
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          {/* Sidebar Footer (Optional) */}
          <div className="p-4 border-t border-muted">
            <div className="text-sm text-muted-foreground">© 2025 United Transport</div>
          </div>
        </div>
      </aside>
    </>
  );
};