import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Header = ({ setIsSidebarOpen }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Navigate to the logout route defined in AppRouter
    navigate('/logout');
  };

  return (
    <header className="flex-shrink-0 h-16 bg-background shadow-md z-10">
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        {/* Mobile-only Hamburger Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu size={22} />
        </button>

        {/* Desktop-only Title (or breadcrumbs) */}
        <div className="hidden md:block">
          {/* <h1 className="text-xl font-semibold text-foreground">
            Admin Dashboard
          </h1> */}
        </div>

        {/* Right-side items (e.g., User Menu) */}
        <div className="flex items-center space-x-4">
          {/* User profile icon (placeholder) */}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center text-muted-foreground hover:text-destructive"
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