import { useState } from 'react';
import type { ContentEntry } from '../../types';
import { FilePenLine, Trash2, Search } from 'lucide-react';
import { ContentForm } from './ContentForm';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';

// Pagination imports
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';

export const ContentList = () => {
  const { contentEntries, addContentEntry, updateContentEntry, deleteContentEntry } = useData();

  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ContentEntry | undefined>(undefined);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtering logic
  const filteredEntries = contentEntries.filter(
    (entry: ContentEntry) =>
      entry.contentName.toLowerCase().includes(search.toLowerCase()) ||
      entry.shortName.toLowerCase().includes(search.toLowerCase()) ||
      entry.id.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems
  } = usePagination({
    data: filteredEntries,
    initialItemsPerPage: 10,
  });

  // Edit
  const handleEdit = (entry: ContentEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  // Delete
  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) deleteContentEntry(deletingId);
    setDeletingId(null);
    setIsConfirmOpen(false);
  };

  // Create new
  const handleCreateNew = () => {
    setEditingEntry(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEntry(undefined);
  };

  const handleFormSave = (savedEntry: ContentEntry) => {
    if (editingEntry) updateContentEntry(savedEntry);
    else addContentEntry(savedEntry);

    handleFormClose();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-foreground">Content List</h1>

        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 font-medium"
        >
          + Create New Content
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-background rounded-lg shadow border border-muted">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by ID, Content Name, Short Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                {/* CHANGED: ID -> S.No */}
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Content Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Short Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-muted">
              {paginatedData.map((entry: ContentEntry, index) => (
                <tr key={entry.id}>
                  {/* CHANGED: Display Serial Number instead of ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.contentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.shortName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FilePenLine size={18} />
                    </button>

                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((entry: ContentEntry, index) => (
            <div key={entry.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  {/* CHANGED: Display S.No in mobile view */}
                  <div className="text-sm text-muted-foreground">
                    #{(currentPage - 1) * itemsPerPage + index + 1}
                  </div>
                  <div className="text-lg font-semibold">{entry.contentName}</div>
                  <div className="text-sm text-muted-foreground">Short: {entry.shortName}</div>
                </div>

                <div className="flex flex-col space-y-3 pt-1">
                  <button onClick={() => handleEdit(entry)} className="text-blue-600">
                    <FilePenLine size={18} />
                  </button>
                  <button onClick={() => handleDelete(entry.id)} className="text-destructive">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Inside */}
        {totalPages > 0 && (
          <div className="border-t border-muted p-4">
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

      {/* No results */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No content entries found.
        </div>
      )}

      {/* Form */}
      {isFormOpen && (
        <ContentForm
          initialData={editingEntry}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Content Entry"
        description="Are you sure you want to delete this content entry? This action cannot be undone."
      />
    </div>
  );
};