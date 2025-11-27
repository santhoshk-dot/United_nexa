import { useState } from 'react';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { X, Eye, EyeOff } from 'lucide-react'; // CHANGE: Imported Eye icons
import type { AppUser } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface UserFormProps {
  initialData?: AppUser;
  onClose: () => void;
  onSave: (user: AppUser) => void;
}

export const UserForm = ({ initialData, onClose, onSave }: UserFormProps) => {
  const { users } = useAuth(); 
  const [emailError, setEmailError] = useState<string>(""); 
  // CHANGE: State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '', 
    mobile: initialData?.mobile || '',
    role: initialData?.role || 'user',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'email') {
      const normalizedEmail = value.trim().toLowerCase();
      
      const exists = users.some(u => 
        u.email.toLowerCase() === normalizedEmail && 
        u.id !== initialData?.id
      );

      if (exists) {
        setEmailError("This email is already assigned to another user.");
      } else {
        setEmailError("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError) return;
    
    const userToSave: AppUser = {
      id: initialData?.id || `user-${Date.now()}`,
      ...formData,
    } as AppUser;

    onSave(userToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg bg-background rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input 
            label="Full Name" 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
          
          <div>
            <Input 
              label="Email Address" 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className={emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
            />
            {emailError && (
              <p className="text-sm text-red-600 mt-1 animate-in fade-in slide-in-from-top-1">
                {emailError}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* CHANGE: Custom Password Input with Eye Icon */}
             <div>
               <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                 {initialData ? "Password (Leave blank to keep)" : "Password"}
                 {!initialData && <span className="text-destructive">*</span>}
               </label>
               <div className="mt-1 relative">
                 <input
                   id="password"
                   name="password"
                   type={showPassword ? "text" : "password"} // Toggle type
                   value={formData.password}
                   onChange={handleChange}
                   required={!initialData}
                   // Matches existing Input component styles + pr-10 for icon space
                   className="w-full px-3 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary pr-10"
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                   tabIndex={-1} // Skip tab focus for icon
                 >
                   {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                 </button>
               </div>
             </div>

             <Input 
               label="Mobile Number" 
               id="mobile" 
               name="mobile" 
               value={formData.mobile} 
               onChange={handleChange} 
               required 
             />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
            <select 
              id="role" 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-muted-foreground/30 rounded-md bg-background focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="user">User (Operations)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-muted mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={!!emailError} 
              className={emailError ? "opacity-50 cursor-not-allowed" : ""}
            >
              {initialData ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};