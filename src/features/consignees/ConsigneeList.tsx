import { useState, useMemo, useEffect } from 'react';
import type { Consignee } from '../../types';
import { FilePenLine, Trash2, Search, Filter,  Download, FilterX, ChevronUp } from 'lucide-react';
import { ConsigneeForm } from './ConsigneeForm';
import { DateFilterButtons, getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import { CsvImporter } from '../../components/shared/CsvImporter';
import { useToast } from '../../contexts/ToastContext';

// 🟢 NEW: Regex Patterns
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const ConsigneeList = () => {
  const { consignees, addConsignee, updateConsignee, deleteConsignee, fetchConsignees, importConsignees } = useData();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsignee, setEditingConsignee] = useState<Consignee | undefined>(undefined);

  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    fetchConsignees();
  }, [fetchConsignees]);

  const clearAllFilters = () => {
    setSearch('');
    setFilterType('all');
    setCustomStart('');
    setCustomEnd('');
  };

  const filteredConsignees = useMemo(() => {
    return consignees.filter(
      c => 
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase()) ||
        c.destination.toLowerCase().includes(search.toLowerCase())) &&
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
  }, [consignees, search, filterType, customStart, customEnd]);

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  } = usePagination({ data: filteredConsignees, initialItemsPerPage: 10 });

  const handleEdit = (consignee: Consignee) => { setEditingConsignee(consignee); setIsFormOpen(true); };
  
  const handleDelete = (consignee: Consignee) => {
    setDeletingId(consignee.id);
    setDeleteMessage(`Are you sure you want to delete consignee "${consignee.name}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => { if (deletingId) deleteConsignee(deletingId); setIsConfirmOpen(false); setDeletingId(null); };
  const handleCreateNew = () => { setEditingConsignee(undefined); setIsFormOpen(true); };
  const handleFormClose = () => { setIsFormOpen(false); setEditingConsignee(undefined); };
  
  const handleFormSave = (savedConsignee: Consignee) => {
    const exists = consignees.some(c => c.id === savedConsignee.id);
    if (exists) updateConsignee(savedConsignee);
    else addConsignee(savedConsignee);
    handleFormClose();
  };

  const handleImport = async (data: Consignee[]) => {
    await importConsignees(data);
  };

  const handleExport = () => {
    if (filteredConsignees.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['Name', 'Mobile', 'Destination', 'Address', 'GST', 'PAN', 'Aadhar', 'Filing Date'];
    const csvContent = [
      headers.join(','),
      ...filteredConsignees.map(c => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.phone.replace(/"/g, '""')}"`,
        `"${c.destination.replace(/"/g, '""')}"`,
        `"${c.address.replace(/"/g, '""')}"`,
        `"${c.gst || ''}"`,
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
      link.setAttribute('download', `consignees_export_${getTodayDate()}.csv`);
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
              placeholder="Search by Name, Mobile, or Destination..."
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
          >
            <Filter size={18} className={hasActiveFilters ? "mr-2" : ""} />
            {hasActiveFilters && "Active"}
          </Button>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          <Button variant="outline" onClick={handleExport} size="sm" title="Export CSV" className={responsiveBtnClass}>
            <Download size={14} className="mr-1 sm:mr-2" /> Export
          </Button>
          
          <CsvImporter<Consignee>
            onImport={handleImport}
            existingData={consignees}
            label="Import" 
            className={responsiveBtnClass} 
            checkDuplicate={(newItem, existing) => 
              newItem.name.trim().toLowerCase() === existing.name.trim().toLowerCase() && 
              newItem.destination.trim().toLowerCase() === existing.destination.trim().toLowerCase()
            }
            mapRow={(row) => {
              // 🟢 FIX: Map 'row.mobile' (from CSV) to this variable
              // The CSV header "Mobile" is normalized to "mobile" by the importer.
              const mobileInput = row.mobile || row.phone || row.mobilenumber || '';
              const nameInput = row.name || '';
              const destinationInput = row.destination || '';
              const addressInput = row.address || '';

              // 🟢 PATTERN VALIDATION
              const gst = row.gst || undefined;
              const pan = row.pan || undefined;
              const aadhar = row.aadhar || undefined;

              // Basic presence check
              if (!nameInput || !mobileInput || !destinationInput || !addressInput) return null;
              
              // Validate Mobile
              const mobileStr = String(mobileInput).trim();
              if (!MOBILE_REGEX.test(mobileStr)) return null;

              // Validate Proofs (If present)
              let hasValidProof = false;
              if (gst && GST_REGEX.test(gst)) hasValidProof = true;
              if (pan && PAN_REGEX.test(pan)) hasValidProof = true;
              // Aadhar might be read as number, convert to string
              if (aadhar && AADHAR_REGEX.test(String(aadhar))) hasValidProof = true;

              if (!hasValidProof) return null; // Reject if no valid proof provided

              return {
                id: `ce-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: nameInput,
                phone: mobileStr,
                destination: destinationInput,
                address: addressInput,
                filingDate: row.filingdate || getTodayDate(),
                gst: gst && GST_REGEX.test(gst) ? gst : undefined,
                pan: pan && PAN_REGEX.test(pan) ? pan : undefined,
                aadhar: aadhar && AADHAR_REGEX.test(String(aadhar)) ? String(aadhar) : undefined,
              };
            }}
          />
          
          <Button variant="primary" onClick={handleCreateNew} size="sm" className={responsiveBtnClass}>
            + Add Consignee
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
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Mobile Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedData.length > 0 ? (
                paginatedData.map((consignee, index) => (
                  <tr key={consignee.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{consignee.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignee.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignee.destination}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button onClick={() => handleEdit(consignee)} className="text-blue-600 hover:text-blue-800"><FilePenLine size={18} /></button>
                      <button onClick={() => handleDelete(consignee)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                     No consignees found.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.length > 0 ? (
            paginatedData.map((consignee, index) => (
              <div key={consignee.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-muted-foreground">#{(currentPage - 1) * itemsPerPage + index + 1}</div>
                    <div className="text-lg font-semibold text-foreground">{consignee.name}</div>
                    <div className="text-sm text-muted-foreground">{consignee.phone}</div>
                    <div className="text-sm text-muted-foreground">To: {consignee.destination}</div>
                  </div>
                  <div className="flex flex-col space-y-3 pt-1">
                    <button onClick={() => handleEdit(consignee)} className="text-blue-600"><FilePenLine size={18} /></button>
                    <button onClick={() => handleDelete(consignee)} className="text-destructive"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="p-8 text-center text-muted-foreground">
               No consignees found.
             </div>
          )}
        </div>

        {filteredConsignees.length > 0 && (
           <div className="border-t border-muted p-4">
             <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
           </div>
        )}
      </div>

      {isFormOpen && <ConsigneeForm initialData={editingConsignee} onClose={handleFormClose} onSave={handleFormSave} />}
      
      <ConfirmationDialog 
        open={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Consignee" 
        description={deleteMessage} 
      />
    </div>
  );
};