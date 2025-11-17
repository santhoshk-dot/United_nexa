import { useState, useMemo } from 'react';
import type { Consignor, Consignee } from '../../types';
import { FilePenLine, Trash2, Search } from 'lucide-react';
import { ConsignorForm } from './ConsignorForm';
import { DateFilterButtons, getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';

export const ConsignorList = () => {
  const { consignors, addConsignor, updateConsignor, deleteConsignor, addConsignee } = useData();
  
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsignor, setEditingConsignor] = useState<Consignor | undefined>(undefined);
  
  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredConsignors = useMemo(() => {
    return consignors.filter(
      c => 
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.gst.toLowerCase().includes(search.toLowerCase())) &&
        (() => {
          const date = c.filingDate;
          switch (filterType) {
            case 'today': return date === getTodayDate();
            case 'yesterday': return date === getYesterdayDate();
            case 'week': return isDateInLast7Days(date);
            case 'custom': return (!customStart || date >= customStart) && (!customEnd || date <= customEnd);
            default: return true;
          }
        })()
    );
  }, [consignors, search, filterType, customStart, customEnd]);

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  } = usePagination({ data: filteredConsignors, initialItemsPerPage: 10 });

  const handleEdit = (consignor: Consignor) => {
    setEditingConsignor(consignor);
    setIsFormOpen(true);
  };
  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    if (deletingId) deleteConsignor(deletingId);
    setIsConfirmOpen(false);
    setDeletingId(null);
  };
  const handleCreateNew = () => {
    setEditingConsignor(undefined);
    setIsFormOpen(true);
  };
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingConsignor(undefined);
  };
  
  // --- SAVE LOGIC: Checks if ID exists to determine Update vs Add ---
  const handleFormSave = (savedConsignor: Consignor, firstConsignee?: Consignee) => {
    const exists = consignors.some(c => c.id === savedConsignor.id);

    if (exists) {
      updateConsignor(savedConsignor);
    } else {
      addConsignor(savedConsignor);
    }

    if (firstConsignee) addConsignee(firstConsignee);
    handleFormClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-foreground">Consignors List</h1>
        <button 
          onClick={handleCreateNew}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 font-medium"
        >
          + Create New Consignor
        </button>
      </div>

      <div className="space-y-4 p-4 bg-background rounded-lg shadow border border-muted">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Consignor Name or GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>
        
        <DateFilterButtons
          filterType={filterType}
          setFilterType={setFilterType}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />
      </div>

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">GST Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedData.map((consignor, index) => (
                <tr key={consignor.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{consignor.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignor.gst}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button onClick={() => handleEdit(consignor)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <FilePenLine size={18} />
                    </button>
                    <button onClick={() => handleDelete(consignor.id)} className="text-destructive hover:text-destructive/80" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((consignor, index) => (
            <div key={consignor.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-muted-foreground">
                    #{(currentPage - 1) * itemsPerPage + index + 1}
                  </div>
                  <div className="text-lg font-semibold text-foreground">{consignor.name}</div>
                  <div className="text-sm text-muted-foreground">{consignor.gst}</div>
                </div>
                <div className="flex space-x-3 pt-1">
                  <button onClick={() => handleEdit(consignor)} className="text-blue-600" title="Edit">
                    <FilePenLine size={18} />
                  </button>
                  <button onClick={() => handleDelete(consignor.id)} className="text-destructive" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

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

      {filteredConsignors.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No consignors found for the selected filters.
        </div>
      )}

      {isFormOpen && (
        <ConsignorForm 
          initialData={editingConsignor}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Consignor"
        description="Are you sure you want to delete this consignor? This action cannot be undone."
      />
    </div>
  );
};