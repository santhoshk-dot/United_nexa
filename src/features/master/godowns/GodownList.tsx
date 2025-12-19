import { useState, useMemo, useEffect } from 'react';
import type { Godown } from '../../../types';
import {
    FilePenLine,
    Trash2,
    Search,
    Plus,
    Warehouse,
    Hash,
    Package,
    Download
} from 'lucide-react';
import { GodownForm } from './GodownForm';
import { ConfirmationDialog } from '../../../components/shared/ConfirmationDialog';
import { useData } from '../../../hooks/useData';
import { Button } from '../../../components/shared/Button';
import { usePagination } from '../../../utils/usePagination';
import { Pagination } from '../../../components/shared/Pagination';
import { CsvImporter } from '../../../components/shared/CsvImporter';
import { useToast } from '../../../contexts/ToastContext';

export const GodownList = () => {
    const { godowns, addGodown, updateGodown, deleteGodown, fetchGodowns, importGodowns } = useData();
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGodown, setEditingGodown] = useState<Godown | undefined>(undefined);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteMessage, setDeleteMessage] = useState("");

    useEffect(() => {
        fetchGodowns();
    }, [fetchGodowns]);

    const filteredGodowns = useMemo(() => {
        return godowns.filter(
            g => g.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [godowns, search]);

    const {
        paginatedData,
        currentPage,
        setCurrentPage,
        totalPages,
        itemsPerPage,
        setItemsPerPage,
        totalItems,
    } = usePagination({ data: filteredGodowns, initialItemsPerPage: 10 });

    const handleEdit = (godown: Godown) => {
        setEditingGodown(godown);
        setIsFormOpen(true);
    };

    const handleDelete = (godown: Godown) => {
        setDeletingId(godown.id);
        setDeleteMessage(`Are you sure you want to delete godown "${godown.name}"?`);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingId) deleteGodown(deletingId);
        setIsConfirmOpen(false);
        setDeletingId(null);
    };

    const handleCreateNew = () => {
        setEditingGodown(undefined);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingGodown(undefined);
    };

    const handleFormSave = (savedGodown: Godown) => {
        const exists = godowns.some(g => g.id === savedGodown.id);
        if (exists) updateGodown(savedGodown);
        else addGodown(savedGodown);
        handleFormClose();
    };

    const handleImport = async (data: Godown[]) => {
        await importGodowns(data);
    };

    const handleExport = () => {
        if (filteredGodowns.length === 0) {
            toast.error("No data to export");
            return;
        }
        const headers = ['Name', 'Total Capacity', 'Available Capacity'];
        const csvContent = [
            headers.join(','),
            ...filteredGodowns.map(g => [
                `"${g.name.replace(/"/g, '""')}"`,
                `"${g.totalCapacity || 0}"`,
                `"${g.availableCapacity || 0}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `godowns_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const csvMapRow = (row: any) => {
        if (!row.name) return null;
        return {
            id: `gd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: row.name,
            totalCapacity: Number(row.totalcapacity || row.total_capacity || 0),
            availableCapacity: Number(row.availablecapacity || row.available_capacity || 0),
        };
    };

    return (
        <div className="space-y-4">
            {/* Control Bar */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                {/* Desktop & Tablet - Single Row (lg and above) */}
                <div className="hidden lg:flex items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
                        />
                    </div>

                    {/* Action Buttons */}
                    <Button variant="outline" onClick={handleExport} className="h-10">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                    <CsvImporter<Godown>
                        onImport={handleImport}
                        existingData={godowns}
                        label="Import Godowns"
                        checkDuplicate={(newItem, existing) =>
                            newItem.name.trim().toLowerCase() === existing.name.trim().toLowerCase()
                        }
                        mapRow={csvMapRow}
                        template={{
                            filename: 'godown_import_template.csv',
                            columns: ['Name', 'Total Capacity', 'Available Capacity'],
                            sampleRow: ['Main Warehouse', '500', '450']
                        }}
                    />
                    <Button variant="primary" onClick={handleCreateNew} className="h-10">
                        <Plus className="w-4 h-4" />
                        Add Godown
                    </Button>
                </div>

                {/* Tablet & Mobile - Two Rows (below lg) */}
                <div className="flex lg:hidden flex-col gap-3">
                    {/* Row 1: Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
                        />
                    </div>

                    {/* Row 2: Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleExport} className="flex-1 h-9 text-xs sm:text-sm">
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Export
                        </Button>
                        <CsvImporter<Godown>
                            onImport={handleImport}
                            existingData={godowns}
                            label="Import Godowns"
                            checkDuplicate={(newItem, existing) =>
                                newItem.name.trim().toLowerCase() === existing.name.trim().toLowerCase()
                            }
                            mapRow={csvMapRow}
                            template={{
                                filename: 'godown_import_template.csv',
                                columns: ['Name', 'Total Capacity', 'Available Capacity'],
                                sampleRow: ['Main Warehouse', '500', '450']
                            }}
                        />
                        <Button variant="primary" onClick={handleCreateNew} className="flex-1 h-9 text-xs sm:text-sm">
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Add
                        </Button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
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
                                        <Warehouse className="w-3.5 h-3.5" />
                                        Godown Name
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <Package className="w-3.5 h-3.5" />
                                        Total Capacity
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <Package className="w-3.5 h-3.5" />
                                        Available Capacity
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((godown, index) => (
                                    <tr key={godown.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-primary">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-foreground font-medium">{godown.name}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-foreground font-medium">{godown.totalCapacity || 0}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-foreground font-medium">{godown.availableCapacity || 0}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(godown)}
                                                    className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                                                    title="Edit"
                                                >
                                                    <FilePenLine className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(godown)}
                                                    className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Warehouse className="w-10 h-10 text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">No godowns found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredGodowns.length > 0 && (
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
                <GodownForm
                    initialData={editingGodown}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                />
            )}

            <ConfirmationDialog
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Godown"
                description={deleteMessage}
            />
        </div>
    );
};
