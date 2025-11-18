import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FilePenLine, Trash2, UserPlus, Shield, User as UserIcon } from 'lucide-react';
import { UserForm } from './UserForm';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import type { AppUser } from '../../types';

export const UserList = () => {
  const { users, addUser, updateUser, deleteUser, user: currentUser } = useAuth();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | undefined>(undefined);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (currentUser?.id === id) {
      alert("You cannot delete yourself.");
      return;
    }
    setDeletingId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) deleteUser(deletingId);
    setIsConfirmOpen(false);
    setDeletingId(null);
  };

  const handleCreateNew = () => {
    setEditingUser(undefined);
    setIsFormOpen(true);
  };

  const handleFormSave = (user: AppUser) => {
    if (users.some(u => u.id === user.id)) {
      updateUser(user);
    } else {
      addUser(user);
    }
    setIsFormOpen(false);
    setEditingUser(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system access and roles</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="mt-4 md:mt-0 px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 font-medium flex items-center"
        >
          <UserPlus size={18} className="mr-2" />
          Add New User
        </button>
      </div>

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted bg-background">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        {u.role === 'admin' ? <Shield size={20} /> : <UserIcon size={20} />}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">{u.name}</div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{u.mobile}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                    {/* MASKED PASSWORD */}
                    ••••••••
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button onClick={() => handleEdit(u)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <FilePenLine size={18} />
                    </button>
                    {currentUser?.id !== u.id && (
                      <button onClick={() => handleDelete(u.id)} className="text-destructive hover:text-destructive/80" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <UserForm 
          initialData={editingUser} 
          onClose={() => setIsFormOpen(false)} 
          onSave={handleFormSave} 
        />
      )}

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
      />
    </div>
  );
};