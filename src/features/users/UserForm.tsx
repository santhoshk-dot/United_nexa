import { useState } from 'react';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { X } from 'lucide-react';
import type { AppUser } from '../../types';

interface UserFormProps {
  initialData?: AppUser;
  onClose: () => void;
  onSave: (user: AppUser) => void;
}

export const UserForm = ({ initialData, onClose, onSave }: UserFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: initialData?.password || '',
    mobile: initialData?.mobile || '',
    role: initialData?.role || 'user',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
          <Input 
            label="Email Address" 
            id="email" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Input 
               label="Password" 
               id="password" 
               name="password" 
               type="text" 
               value={formData.password} 
               onChange={handleChange} 
               required 
             />
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
            <Button type="submit" variant="primary">{initialData ? 'Update User' : 'Create User'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};