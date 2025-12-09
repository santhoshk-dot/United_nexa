import { useState, useMemo, useEffect } from 'react';
import type { Consignor, Consignee } from '../../types';
import { FilePenLine, Trash2, Search, Filter, Download, ChevronUp, FilterX } from 'lucide-react';
import { ConsignorForm } from './ConsignorForm';
import { DateFilterButtons, getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import { CsvImporter } from '../../components/shared/CsvImporter';
import { useToast } from '../../contexts/ToastContext';

// 🟢 REGEX VALIDATORS FOR IMPORT
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const ConsignorList = () => {
  const { consignors, addConsignor, updateConsignor, deleteConsignor, addConsignee, fetchConsignors, importConsignors } = useData();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsignor, setEditingConsignor] = useState<Consignor | undefined>(undefined);
  
  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState(""); 

  useEffect(() => {
    fetchConsignors();
  }, [fetchConsignors]);

  const clearAllFilters = () => {
    setSearch('');
    setFilterType('all');
    setCustomStart('');
    setCustomEnd('');
  };

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
  
  const handleDelete = (consignor: Consignor) => {
    setDeletingId(consignor.id);
    setDeleteMessage(`Are you sure you want to delete consignor "${consignor.name}"?`);
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
  
  const handleFormSave = (savedConsignor: Consignor, firstConsignee?: Consignee) => {
    const exists = consignors.some(c => c.id === savedConsignor.id);
    if (exists) updateConsignor(savedConsignor);
    else addConsignor(savedConsignor);

    if (firstConsignee) addConsignee(firstConsignee);
    handleFormClose();
  };

  const handleImport = async (data: Consignor[]) => {
    await importConsignors(data);
  };

  const handleExport = () => {
    if (filteredConsignors.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['Name', 'GST', 'Address', 'Mobile', 'From', 'PAN', 'Aadhar', 'Filing Date'];
    const csvContent = [
      headers.join(','),
      ...filteredConsignors.map(c => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.gst.replace(/"/g, '""')}"`,
        `"${c.address.replace(/"/g, '""')}"`,
        `"${(c.mobile || '').replace(/"/g, '""')}"`,
        `"${c.from.replace(/"/g, '""')}"`,
        `"${c.pan || ''}"`,
        `"${c.aadhar || ''}"`,
        `"${c.filingDate}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `consignors_export_${getTodayDate()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const hasActiveFilters = filterType !== 'all' || search !== '';
  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Name or GST..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          </div>
          <Button 
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-3 shrink-0"
            title="Toggle Filters"
          >
            <Filter size={18} className={hasActiveFilters ? "mr-2" : ""} />
            {hasActiveFilters && "Active"}
          </Button>
        </div>

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
          
          <CsvImporter<Consignor>
            onImport={handleImport}
            existingData={consignors}
            label="Import" 
            className={responsiveBtnClass} 
            checkDuplicate={(newItem, existing) => 
              newItem.gst.trim().toLowerCase() === existing.gst.trim().toLowerCase()
            }
            mapRow={(row) => {
              if (!row.name || !row.gst || !row.address) return null;
              
              // 🟢 Strict Regex Validation for CSV Rows
              if (!GST_REGEX.test(row.gst)) return null;
              if (row.mobile && !MOBILE_REGEX.test(row.mobile)) return null;
              if (row.pan && !PAN_REGEX.test(row.pan)) return null;
              if (row.aadhar && !AADHAR_REGEX.test(row.aadhar)) return null;

              return {
                id: `cn-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: row.name,
                gst: row.gst,
                address: row.address,
                from: row.from || 'Sivakasi',
                filingDate: row.filingdate || getTodayDate(),
                mobile: row.mobile || '',
                pan: row.pan || undefined,
                aadhar: row.aadhar || undefined,
              };
            }}
          />
          
          <Button 
            variant="primary" 
            onClick={handleCreateNew}
            size="sm" 
            className={responsiveBtnClass}
          >
            + Add Consignor
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Advanced Filters</h3>
            <div className="flex gap-2">
              <button onClick={clearAllFilters} className="text-xs flex items-center text-primary hover:text-primary/80 font-medium">
                <FilterX size={14} className="mr-1" /> Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground ml-2"><ChevronUp size={20} /></button>
            </div>
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
      )}

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">GST Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedData.length > 0 ? (
                paginatedData.map((consignor, index) => (
                  <tr key={consignor.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{consignor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignor.gst}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button onClick={() => handleEdit(consignor)} className="text-blue-600 hover:text-blue-800"><FilePenLine size={18} /></button>
                      <button onClick={() => handleDelete(consignor)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No consignors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.length > 0 ? (
            paginatedData.map((consignor, index) => (
              <div key={consignor.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-muted-foreground">#{(currentPage - 1) * itemsPerPage + index + 1}</div>
                    <div className="text-lg font-semibold text-foreground">{consignor.name}</div>
                    <div className="text-sm text-muted-foreground">{consignor.gst}</div>
                  </div>
                  <div className="flex space-x-3 pt-1">
                    <button onClick={() => handleEdit(consignor)} className="text-blue-600"><FilePenLine size={18} /></button>
                    <button onClick={() => handleDelete(consignor)} className="text-destructive"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="p-8 text-center text-muted-foreground">
                No consignors found.
             </div>
          )}
        </div>

        {filteredConsignors.length > 0 && (
           <div className="border-t border-muted p-4">
             <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
           </div>
        )}
      </div>

      {isFormOpen && <ConsignorForm initialData={editingConsignor} onClose={handleFormClose} onSave={handleFormSave} />}
      
      <ConfirmationDialog 
        open={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Consignor" 
        description={deleteMessage} 
      />
    </div>
  );
};