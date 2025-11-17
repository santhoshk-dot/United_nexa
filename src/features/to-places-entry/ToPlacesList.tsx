import { useState, useMemo } from 'react'; // Added useMemo
import type { ToPlace } from '../../types';
import { FilePenLine, Trash2, Search } from 'lucide-react';
import { ToPlacesForm } from './ToPlacesForm';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog'; 
import { useData } from '../../hooks/useData'; 

// --- NEW IMPORTS (Required for Consignee/FromPlace style pagination) ---
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';
// --- END NEW IMPORTS ---

export const ToPlacesList = () => {
    // Use global state and functions from context
    const { toPlaces, addToPlace, updateToPlace, deleteToPlace } = useData();

    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingToPlace, setEditingToPlace] = useState<ToPlace | undefined>(undefined);

    // State for Delete Confirmation
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // --- Filtering (Memoized) ---
    // Search logic: search across To Place Name and Short Name
    const filteredToPlaces = useMemo(() => {
        return toPlaces.filter(
            tp => 
              tp.placeName.toLowerCase().includes(search.toLowerCase()) ||
              tp.shortName.toLowerCase().includes(search.toLowerCase())
        );
    }, [toPlaces, search]); // Depend on toPlaces and search

    // --- Pagination Integration ---
    const {
        paginatedData: currentToPlaces, // Rename paginatedData to currentToPlaces for component clarity
        currentPage,
        setCurrentPage,
        totalPages,
        itemsPerPage,
        setItemsPerPage,
        totalItems,
    } = usePagination({ data: filteredToPlaces, initialItemsPerPage: 10 });
    
    // Calculate indices for display message
    const indexOfLastItem = currentPage * itemsPerPage;
    // --- End Pagination Integration ---


    // --- Handlers ---
    const handleEdit = (toPlace: ToPlace) => {
        setEditingToPlace(toPlace);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingId) {
            deleteToPlace(deletingId); // Use context function
        }
        setIsConfirmOpen(false);
        setDeletingId(null);
    };
    
    const handleCreateNew = () => {
        setEditingToPlace(undefined);
        setIsFormOpen(true);
    };
    
    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingToPlace(undefined);
    };
    
    const handleFormSave = (savedToPlace: ToPlace) => {
        if (editingToPlace) {
            updateToPlace(savedToPlace); // Use context function for update
        } else {
            addToPlace(savedToPlace); // Use context function for add
        }
        handleFormClose();
    };
    // --- End Handlers ---

    return (
        <div className="space-y-6">
            {/* 1. Header: Title and Create Button */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <h1 className="text-3xl font-bold text-foreground">To Places Entry</h1>
                <button 
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 font-medium"
                >
                    + Create New To Places Entry
                </button>
            </div>

            {/* 2. Search Section */}
            <div className="space-y-4 p-4 bg-background rounded-lg shadow border border-muted">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by Place Name or Short Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                </div>
            </div>

            {/* 3. Responsive Data Display */}
            <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
                {/* --- DESKTOP TABLE --- */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-muted">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">S.No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">To Place Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Short Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted">
                            {/* Map over paginated data */}
                            {currentToPlaces.map((toPlace, index) => (
                                <tr key={toPlace.id} className="hover:bg-muted/30">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{toPlace.placeName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{toPlace.shortName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                        <button onClick={() => handleEdit(toPlace)} className="text-blue-600 hover:text-blue-800" title="Edit">
                                            <FilePenLine size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(toPlace.id)} className="text-destructive hover:text-destructive/80" title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- MOBILE CARD LIST --- (Simplified Card View) */}
                <div className="block md:hidden divide-y divide-muted">
                    {/* Map over paginated data */}
                    {currentToPlaces.map((toPlace, index) => (
                        <div key={toPlace.id} className="p-4 hover:bg-muted/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-sm text-muted-foreground">
                                        #{(currentPage - 1) * itemsPerPage + index + 1}
                                    </div>
                                    <div className="text-lg font-semibold text-foreground">{toPlace.placeName}</div>
                                    <div className="text-sm text-muted-foreground">Short Name: {toPlace.shortName}</div>
                                </div>
                                <div className="flex flex-col space-y-3 pt-1">
                                    <button onClick={() => handleEdit(toPlace)} className="text-blue-600" title="Edit">
                                        <FilePenLine size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(toPlace.id)} className="text-destructive" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* --- PAGINATION FOOTER --- */}
                {totalItems > 0 && (
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

            {/* No results message */}
            {totalItems === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No To Places entries found.
                </div>
            )}

            {/* The Modal Form */}
            {isFormOpen && (
                <ToPlacesForm 
                    initialData={editingToPlace}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                />
            )}

            {/* --- The Confirmation Dialog --- */}
            <ConfirmationDialog
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete To Places Entry"
                description="Are you sure you want to delete this To Places Entry? This action cannot be undone."
            />
        </div>
    );
};