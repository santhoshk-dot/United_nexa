import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  FilePenLine,
  Trash2,
  UserPlus,
  Shield,
  User as UserIcon,
  Search,
  Download,
  Hash,
  Phone,
  Mail,
} from 'lucide-react';
import { UserForm } from './UserForm';
import { ConfirmationDialog } from '../../../../components/shared/ConfirmationDialog';
import type { AppUser } from '../../../../types';
import { Button } from '../../../../components/shared/Button';
import { CsvImporter } from '../../../../components/shared/CsvImporter';
import { useToast } from '../../../../contexts/ToastContext';
import { usePagination } from '../../../../utils/usePagination';
import { Pagination } from '../../../../components/shared/Pagination';
import { AppSelect } from '../../../../components/shared/AppSelect';


const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const UserList = () => {
  const { users, addUser, updateUser, deleteUser, user: currentUser, refreshUsers, importUsers } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | undefined>(undefined);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    if (refreshUsers) {
      refreshUsers();
    }
  }, [refreshUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.mobile && u.mobile.toLowerCase().includes(search.toLowerCase()));
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  } = usePagination({
    data: filteredUsers,
    initialItemsPerPage: 10,
  });

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (user: AppUser) => {
    if (currentUser?.id === user.id) {
      toast.error("You cannot delete yourself.");
      return;
    }
    setDeletingId(user.id);
    setDeleteMessage(`Are you sure you want to delete user "${user.name}"?`);
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
    if (users.some(u => u.id === user.id)) updateUser(user);
    else addUser(user);
    setIsFormOpen(false);
    setEditingUser(undefined);
  };

  const handleImport = async (data: AppUser[]) => {
    await importUsers(data);
  };

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['Name', 'Email', 'Password', 'Mobile', 'Role'];

    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(u => [
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.email.replace(/"/g, '""')}"`,
        `"${u.password ? u.password.replace(/"/g, '""') : ''}"`,
        `"${u.mobile ? u.mobile.replace(/"/g, '""') : ''}"`,
        `"${u.role}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'users_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const csvMapRow = (row: any) => {
    const mobileValue = row.mobile || row.mobileno || row.phone || row.contact || row.contactno || '';
    const nameValue = row.name ? String(row.name).trim() : '';
    const emailValue = row.email ? String(row.email).trim() : '';
    const passwordValue = row.password ? String(row.password).trim() : '';

    if (!nameValue || !emailValue || !passwordValue || !mobileValue) return null;
    if (!MOBILE_REGEX.test(String(mobileValue))) return null;
    if (!EMAIL_REGEX.test(emailValue)) return null;

    let role: 'admin' | 'user' = 'user';
    if (row.role && row.role.toLowerCase().includes('admin')) {
      role = 'admin';
    }

    return {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: nameValue,
      email: emailValue,
      password: passwordValue,
      mobile: String(mobileValue),
      role: role,
    };
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        {/* Desktop - Single Row (lg and above) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Name, Email, or Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
            />
          </div>

          <div className="w-48">
            <AppSelect
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
              ]}
              value={roleFilter}
              onChange={(val: string) => setRoleFilter(val)}
            />
          </div>

          <Button variant="outline" onClick={handleExport} className="h-10">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <CsvImporter<AppUser>
            onImport={handleImport}
            existingData={users}
            label="Import Users"
            checkDuplicate={(newItem, existing) =>
              newItem.email.trim().toLowerCase() === existing.email.trim().toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Added Template
            template={{
              filename: 'users_import_template.csv',
              columns: ['Name', 'Email', 'Password', 'Mobile', 'Role'],
              sampleRow: ['Demo User', 'demo@example.com', 'pass123', '9876543210', 'user']
            }}
          />
          <Button variant="primary" onClick={handleCreateNew} className="h-10">
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {/* Tablet & Mobile - Two Rows (below lg) */}
        <div className="flex lg:hidden flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
              />
            </div>

          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1 h-9 text-xs sm:text-sm">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Export
            </Button>
            <CsvImporter<AppUser>
              onImport={handleImport}
              existingData={users}
              label="Import Users"
              checkDuplicate={(newItem, existing) =>
                newItem.email.trim().toLowerCase() === existing.email.trim().toLowerCase()
              }
              mapRow={csvMapRow}
              // 泙 NEW: Added Template
              template={{
                filename: 'users_import_template.csv',
                columns: ['Name', 'Email', 'Password', 'Mobile', 'Role'],
                sampleRow: ['Demo User', 'demo@example.com', 'pass123', '9876543210', 'user']
              }}
            />
            <Button variant="primary" onClick={handleCreateNew} className="flex-1 h-9 text-xs sm:text-sm">
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Add
              {/* <span className="hidden xs:inline">Add</span>
              <span className="hidden sm:inline ml-1">User</span> */}
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Desktop Table - show on lg and above */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left w-16">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Hash className="w-3.5 h-3.5" />
                    S.No
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <UserIcon className="w-3.5 h-3.5" />
                    User
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    Role
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5" />
                    Mobile
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((u, index) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          {u.role === 'admin' ? <Shield size={18} /> : <UserIcon size={18} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-foreground font-medium">{u.name}</div>
                          <div className="text-xs text-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${u.role === 'admin'
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{u.mobile || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </button>
                        {currentUser?.id !== u.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserIcon className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No users found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tablet View - show on md to lg screens */}
        <div className="hidden md:block lg:hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-3 text-left w-12">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User / Email
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role / Mobile
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((u, index) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex-shrink-0 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary ${u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                          {u.role === 'admin' ? <Shield size={16} /> : <UserIcon size={16} />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-foreground block truncate">{u.name}</span>
                          <span className="text-xs font-medium text-foreground block truncate">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded border ${u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                          {u.role.toUpperCase()}
                        </span>
                        <span className="text-xs font-medium text-foreground block mt-1">{u.mobile || '-'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </button>
                        {currentUser?.id !== u.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserIcon className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No users found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (Redesigned) - show on small screens only */}
        <div className="block md:hidden divide-y divide-border">
          {paginatedData.length > 0 ? (
            paginatedData.map((u, _index) => (
              <div key={u.id} className="p-4 bg-card">
                {/* Header: Avatar, Name and Role */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-primary/10 text-primary'
                      }`}>
                      {u.role === 'admin' ? <Shield size={18} /> : <UserIcon size={18} />}
                    </div>
                    <div>
                      <h3 className="text-md font-medium text-foreground text-base">{u.name}</h3>
                      <div className="flex font-medium items-center gap-1.5 text-xs text-foreground mt-0.5">
                        <span className="truncate max-w-[150px] text-sm">{u.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge - Top Right */}
                  <span className={`flex-shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${u.role === 'admin'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                    {u.role}
                  </span>
                </div>

                {/* Content: Contact Details */}
                <div className="pl-[3.25rem] mb-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-sm">{u.mobile || 'No mobile'}</span>
                  </div>
                </div>

                {/* Footer: Large Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => handleEdit(u)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                  >
                    <FilePenLine className="w-4 h-4" />
                    Edit
                  </button>
                  {currentUser?.id !== u.id && (
                    <button
                      onClick={() => handleDelete(u)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <UserIcon className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No users found</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="border-t border-border p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalItems}
            />
          </div>
        )}
      </div>

      {/* Modals */}
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
        description={deleteMessage}
      />
    </div>
  );
};
