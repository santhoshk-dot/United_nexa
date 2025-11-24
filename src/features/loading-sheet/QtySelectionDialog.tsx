

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../../components/shared/Button';
import { Upload } from 'lucide-react'; 
import { processImageForSelection } from '../../utils/imageProcessor';

type QtySelectionDialogProps = {
    open: boolean;
    onClose: () => void;
    onSelect: (selectedQuantities: number[]) => void; 
    gcId: string;
    maxQty: number;
    currentSelected: number[];
};

// --- PLACEHOLDER FOR IMAGE PROCESSING LOGIC ---
// (Kept for context, assuming it's imported and functional)
// ----------------------------------------------


export const QtySelectionDialog = ({
    open,
    onClose,
    onSelect,
    gcId,
    maxQty,
    currentSelected = [],
}: QtySelectionDialogProps) => {
    // Stores the final set of selected quantities
    const [selectedSet, setSelectedSet] = useState(new Set<number>(currentSelected));
    
    // --- NEW STATE FOR RANGE SELECTION ---
    const [fromQty, setFromQty] = useState('');
    const [toQty, setToQty] = useState('');
    const [rangeError, setRangeError] = useState<string | null>(null);
    // -----------------------------------

    // --- NEW STATE FOR IMAGE UPLOAD/PROCESSING ---
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    // -------------------------------------------

    // State to track the drag operation
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartQty, setDragStartQty] = useState<number | null>(null);
    const [dragAction, setDragAction] = useState<'SELECT' | 'DESELECT' | null>(null);
    
    // Stores the selection state *before* the drag started
    const [preDragSet, setPreDragSet] = useState(new Set<number>()); 

    // Effect to sync local state on dialog open
    useEffect(() => {
        if (open) {
            setSelectedSet(new Set<number>(currentSelected));
            setImageError(null); // Reset error on open
            setRangeError(null); // Reset range error on open
            setFromQty('');      // Clear range inputs
            setToQty('');
        }
    }, [open, currentSelected]);
        
    if (!open) return null;

    const range = useMemo(() => Array.from({ length: maxQty }, (_, i) => i + 1), [maxQty]);

    // Convert Set back to a sorted Array for saving (used for display and logic checks)
    const finalSelections = useMemo(() => Array.from(selectedSet).sort((a, b) => a - b), [selectedSet]);
    
    // Check if all items are currently selected
    const allSelected = finalSelections.length === maxQty;

    // Helper to get the quantities in the drag range
    const getDraggedRange = (start: number, end: number): number[] => {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        return range.filter(qty => qty >= min && qty <= max);
    };

    // Helper to apply a SELECT/DESELECT action to a set
    const applyAction = (qtySet: Set<number>, action: 'SELECT' | 'DESELECT', targetQuantities: number[]): Set<number> => {
        const newSet = new Set(qtySet);
        if (action === 'SELECT') {
            targetQuantities.forEach(q => newSet.add(q));
        } else {
            targetQuantities.forEach(q => newSet.delete(q));
        }
        return newSet;
    }

    // Toggles a single item's selection state
    const handleToggleSelection = (qty: number) => {
        setSelectedSet(prev => {
            const newSet = new Set(prev);
            if (newSet.has(qty)) {
                newSet.delete(qty);
            } else {
                newSet.add(qty);
            }
            return newSet;
        });
    };

    // 1. Mouse Down: Starts the drag operation or executes a single click toggle
    const handleMouseDown = (e: React.MouseEvent, qty: number) => {
        e.preventDefault(); 
        
        const additive = e.ctrlKey || e.metaKey; 
        const isCurrentlySelected = selectedSet.has(qty);

        // Quick click/toggle logic
        if (!additive && e.buttons === 1) {
            handleToggleSelection(qty);
        }
        
        // Setup Drag State
        let action: 'SELECT' | 'DESELECT';
        let baseSet: Set<number>;

        if (additive) {
            action = isCurrentlySelected ? 'DESELECT' : 'SELECT';
            baseSet = new Set(selectedSet);
        } else {
            action = isCurrentlySelected ? 'DESELECT' : 'SELECT'; 
            baseSet = new Set<number>();
            baseSet = applyAction(baseSet, action, [qty]); 
        }

        // Store State for Dragging
        setIsDragging(true);
        setDragStartQty(qty);
        setDragAction(action);
        setPreDragSet(new Set(selectedSet)); 
    };

    // 2. Mouse Move: Handles selection while dragging
    const handleMouseMove = (qty: number) => {
        if (!isDragging || dragStartQty === null || dragAction === null) return;
        
        const draggedRange = getDraggedRange(dragStartQty, qty);

        setSelectedSet(prev => {
            let newSet = new Set(preDragSet); 
            newSet = applyAction(newSet, dragAction, draggedRange);
            return newSet;
        });
    };
    
    // 3. Mouse Up/Leave: Ends the drag operation
    const handleMouseUpOrLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            setDragStartQty(null);
            setDragAction(null);
            setPreDragSet(new Set<number>()); // Clear temporary state
        }
    };

    // --- HANDLER FOR SELECT ALL ---
    const handleSelectAll = () => {
        // Create a new Set containing all quantities in the range
        setSelectedSet(new Set<number>(range));
    };
    
    // --- NEW HANDLER FOR DESELECT ALL ---
    const handleDeselectAll = () => {
        // Clear the selected set
        setSelectedSet(new Set<number>());
    };
    // ------------------------------------

    // --- HANDLER FOR IMAGE UPLOAD WITH MERGE LOGIC ---
    const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessingImage(true);
        setImageError(null);

        try {
            const scannedQuantities = await processImageForSelection(file, maxQty);
            
            // MERGE LOGIC: Add newly scanned quantities to the existing selected set
            setSelectedSet(prevSet => {
                const newSet = new Set(prevSet);
                scannedQuantities.forEach(qty => newSet.add(qty));
                return newSet;
            });

        } catch (error) {
            console.error('Image processing failed:', error);
            setImageError('Failed to process image. Ensure the numbers are clear.');
        } finally {
            setIsProcessingImage(false);
            // Reset the file input value so the same file can be selected again
            event.target.value = ''; 
        }
    }, [maxQty]);
    // --------------------------------------------------

    // --- HANDLER FOR RANGE SELECTION ---
    const handleSelectRange = () => {
        setRangeError(null);

        const from = parseInt(fromQty, 10);
        const to = parseInt(toQty, 10);

        if (isNaN(from) || isNaN(to)) {
            setRangeError('Both "From" and "To" must be valid numbers.');
            return;
        }

        const start = Math.min(from, to);
        const end = Math.max(from, to);

        if (start < 1 || end > maxQty) {
            setRangeError(`Range must be between 1 and ${maxQty}.`);
            return;
        }

        const quantitiesToAdd: number[] = [];
        for (let i = start; i <= end; i++) {
            quantitiesToAdd.push(i);
        }

        setSelectedSet(prevSet => {
            const newSet = new Set(prevSet);
            quantitiesToAdd.forEach(qty => newSet.add(qty));
            return newSet;
        });

        // Clear inputs after successful selection
        setFromQty('');
        setToQty('');
    };
    // -----------------------------------


    const handleSave = () => {
        onSelect(finalSelections);
        handleMouseUpOrLeave();
    };
        
    const handleClose = () => {
        onClose();
        handleMouseUpOrLeave();
    }

    // Check if the current quantity is part of the final selection set
    const isSelected = (qty: number) => selectedSet.has(qty);

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onMouseUp={handleMouseUpOrLeave} 
            onMouseLeave={handleMouseUpOrLeave}
        >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-4xl">
                <h2 className="text-xl font-bold mb-4 text-foreground">GC No. {gcId}</h2>
                
                <div className='flex justify-between items-center mb-4'>
                    <p className="text-sm text-muted-foreground">
                        Available quantity: <span className="font-bold">{maxQty}. </span>Currently loaded: <span className="font-bold">{finalSelections.length}</span>
                    </p>
                    
                    <div className='flex gap-2'>
                        {/* --- CONDITIONAL SELECT/DESELECT ALL BUTTON --- */}
                        <Button 
                            onClick={allSelected ? handleDeselectAll : handleSelectAll} // TOGGLE HANDLER
                            variant="secondary" 
                            disabled={isProcessingImage}
                            className="shrink-0"
                        >
                            {allSelected ? 'Deselect All' : 'Select All'} {/* TOGGLE TEXT */}
                        </Button>
                        {/* ----------------------------- */}

                        {/* --- IMAGE UPLOAD BUTTON --- */}
                        <label htmlFor="image-upload" className={`
                            inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 
                            ${isProcessingImage ? 'bg-gray-400 cursor-not-allowed' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer'}
                        `}>
                            <Upload className="mr-2 h-4 w-4" />
                            {isProcessingImage ? 'Scanning...' : 'Upload Image'}
                            <input 
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isProcessingImage}
                            />
                        </label>
                        {/* --------------------------- */}
                    </div>
                </div>
                
                {/* --- RANGE SELECTION INPUTS --- */}
                <div className="mb-4 p-4 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-950/50">
                    <p className="text-sm font-semibold mb-2 text-blue-600 dark:text-blue-300">Select Quantity Range</p>
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <label htmlFor="from-qty" className="block text-xs font-medium text-gray-700 dark:text-gray-300">From</label>
                            <input 
                                id="from-qty"
                                type="number"
                                min="1"
                                max={maxQty}
                                value={fromQty}
                                onChange={(e) => setFromQty(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="e.g., 20"
                                disabled={isProcessingImage}
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="to-qty" className="block text-xs font-medium text-gray-700 dark:text-gray-300">To</label>
                            <input
                                id="to-qty"
                                type="number"
                                min="1"
                                max={maxQty}
                                value={toQty}
                                onChange={(e) => setToQty(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="e.g., 25"
                                disabled={isProcessingImage}
                            />
                        </div>
                        <Button 
                            onClick={handleSelectRange} 
                            disabled={isProcessingImage || !fromQty || !toQty}
                            className="mt-5 self-start shrink-0"
                        >
                            Select Range
                        </Button>
                    </div>
                    {rangeError && (
                        <p className="text-xs text-red-500 mt-2">
                            <span className="font-bold">Error: </span>{rangeError}
                        </p>
                    )}
                </div>
                {/* ---------------------------------- */}


                {imageError && (
                    <p className="text-sm text-red-500 mb-4 bg-red-100 p-2 rounded-md border border-red-300">
                        <span className="font-bold">Error: </span> {imageError}
                    </p>
                )}

                <blockquote className="text-sm text-muted-foreground border-l-4 border-primary pl-3 py-1 mb-4 bg-muted/30 rounded-r-md">
                    <span className="font-bold">Tip:</span> Click or drag to select or deselect items. For faster selection, use <span className="font-bold">{allSelected ? 'Deselect All' : 'Select All'}</span>, <span className="font-bold">Upload Image</span> or <span className="font-bold">Select Range</span>.
                </blockquote>
                
                {/* Removed max-h-64 to allow dynamic height */}
                <div 
                    className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-12 gap-3 p-2 border rounded-md border-muted max-h-[40vh] overflow-y-auto"
                >
                    {range.map(qty => (
                        <button
                            key={qty}
                            onMouseDown={(e) => handleMouseDown(e, qty)}
                            onMouseEnter={() => handleMouseMove(qty)}
                            onMouseUp={handleMouseUpOrLeave}
                            disabled={isProcessingImage}
                            
                            className={`
                                w-full h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors border select-none
                                ${isSelected(qty)
                                ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-800'
                                : 'bg-muted/50 text-muted-foreground border-muted hover:bg-muted-foreground/20'
                                }
                                ${isProcessingImage ? 'opacity-60 cursor-not-allowed' : ''}
                            `}
                        >
                            {qty}
                        </button>
                    ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={handleClose} disabled={isProcessingImage}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isProcessingImage}>
                        Save Selection ({finalSelections.length})
                    </Button>
                </div>
            </div>
        </div>
    );
};