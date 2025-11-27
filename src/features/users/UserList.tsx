import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FilePenLine, Trash2, UserPlus, Shield, User as UserIcon, Search, Mail, Phone, Download } from 'lucide-react';
import { UserForm } from './UserForm';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import type { AppUser } from '../../types';
import { Button } from '../../components/shared/Button';
import { CsvImporter } from '../../components/shared/CsvImporter';

export const UserList = () => {
  const { users, addUser, updateUser, deleteUser, user: currentUser } = useAuth();
  
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | undefined>(undefined);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (user: AppUser) => { setEditingUser(user); setIsFormOpen(true); };
  
  const handleDelete = (user: AppUser) => {
    if (currentUser?.id === user.id) { alert("You cannot delete yourself."); return; }
    setDeletingId(user.id);
    setDeleteMessage(`Are you sure you want to delete user "${user.name}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => { if (deletingId) deleteUser(deletingId); setIsConfirmOpen(false); setDeletingId(null); };
  const handleCreateNew = () => { setEditingUser(undefined); setIsFormOpen(true); };
  
  const handleFormSave = (user: AppUser) => {
    if (users.some(u => u.id === user.id)) updateUser(user);
    else addUser(user);
    setIsFormOpen(false);
    setEditingUser(undefined);
  };

  // --- CSV IMPORT HANDLER ---
  const handleImport = (data: AppUser[]) => {
    data.forEach(user => addUser(user));
  };

  // --- CSV EXPORT HANDLER (Updated with Password) ---
  const handleExport = () => {
    if (filteredUsers.length === 0) {
      alert("No data to export");
      return;
    }
    // Added 'Password' to headers
    const headers = ['Name', 'Email', 'Password', 'Mobile', 'Role'];
    
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(u => [
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.email.replace(/"/g, '""')}"`,
        `"${u.password.replace(/"/g, '""')}"`, // Added Password field here
        `"${u.mobile.replace(/"/g, '""')}"`,
        `"${u.role}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- RESPONSIVE BUTTON STYLE HELPER ---
  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        {/* LEFT: Search */}
        <div className="w-full md:w-1/2 relative">
          <input
            type="text"
            placeholder="Search by Name, Email, or Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>

        {/* RIGHT: Actions */}
        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          <Button 
            variant="outline" 
            onClick={handleExport} 
            size="sm" 
            title="Export CSV"
            className={responsiveBtnClass}
          >
            <Download size={14} className="mr-1 sm:mr-2" /> Export
          </Button>
          
          <CsvImporter<AppUser>
            onImport={handleImport}
            existingData={users}
            label="Import" // Shortened label for mobile fit
            className={responsiveBtnClass} // Responsive Class
            // Duplicate Check: Prevent same Email
            checkDuplicate={(newItem, existing) => 
              newItem.email.trim().toLowerCase() === existing.email.trim().toLowerCase()
            }
            mapRow={(row) => {
              // VALIDATION: Require Name, Email, Password
              if (!row.name || !row.email || !row.password) return null;
              
              // Normalize Role (Default to 'user' if invalid or missing)
              let role: 'admin' | 'user' = 'user';
              if (row.role && row.role.toLowerCase().includes('admin')) {
                role = 'admin';
              }

              return {
                id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: row.name,
                email: row.email,
                password: row.password, 
                mobile: row.mobile || '',
                role: role,
              };
            }}
          />
          
          <Button 
            variant="primary" 
            onClick={handleCreateNew}
            className={responsiveBtnClass}
            size="sm" 
          >
            <UserPlus size={14} className="mr-1 sm:mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        
        {/* A) Desktop Table View (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mobile</th>
               
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted bg-background">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
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

                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button onClick={() => handleEdit(u)} className="text-blue-600 hover:text-blue-800"><FilePenLine size={18} /></button>
                      {currentUser?.id !== u.id && (
                        <button onClick={() => handleDelete(u)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No users found.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* B) Mobile Card View (Visible on Mobile) */}
        <div className="block md:hidden divide-y divide-muted">
           {filteredUsers.length > 0 ? (
             filteredUsers.map((u) => (
               <div key={u.id} className="p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex justify-between items-start">
                     {/* Left: User Info */}
                     <div className="flex gap-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mt-1">
                          {u.role === 'admin' ? <Shield size={20} /> : <UserIcon size={20} />}
                        </div>
                        <div>
                           <div className="font-bold text-foreground text-lg">{u.name}</div>
                           <div className="mt-1">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                {u.role.toUpperCase()}
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* Right: Actions */}
                     <div className="flex flex-col gap-2">
                        <button onClick={() => handleEdit(u)} className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100"><FilePenLine size={18}/></button>
                        {currentUser?.id !== u.id && (
                          <button onClick={() => handleDelete(u)} className="p-2 text-destructive bg-red-50 rounded-full hover:bg-red-100"><Trash2 size={18}/></button>
                        )}
                     </div>
                  </div>

                  {/* Details Section */}
                  <div className="mt-2 space-y-1 pl-[3.25rem]">
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail size={14} />
                        <span className="truncate">{u.email}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone size={14} />
                        <span>{u.mobile}</span>
                     </div>
                  </div>
               </div>
             ))
           ) : (
              <div className="p-8 text-center text-muted-foreground">
                 No users found.
              </div>
           )}
        </div>
        
      </div>

      {isFormOpen && <UserForm initialData={editingUser} onClose={() => setIsFormOpen(false)} onSave={handleFormSave} />}
      
      <ConfirmationDialog 
        open={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete User" 
        description={deleteMessage} 
      />
    </div>
  );
};