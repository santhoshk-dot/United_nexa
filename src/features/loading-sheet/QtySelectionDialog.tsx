import { useState, useEffect, useMemo } from 'react';
import { Button } from '../../components/shared/Button';
import { Upload, X, Check, CheckCircle2 } from 'lucide-react';
import { processImageForSelection } from '../../utils/imageProcessor';

// Define the shape of a content item based on your backend
type ContentItem = {
    packing: string;
    contents: string;
    qty: string | number;
    fromNo: string | number;
};

type QtySelectionDialogProps = {
    open: boolean;
    onClose: () => void;
    onSelect: (selectedQuantities: number[]) => void;
    gcId: string;
    startNo: number;
    maxQty: number;
    currentSelected: number[];
    contentItems?: ContentItem[];
};

export const QtySelectionDialog = ({
    open,
    onClose,
    onSelect,
    gcId,
    startNo: legacyStartNo,
    maxQty: legacyMaxQty,
    currentSelected = [],
    contentItems = []
}: QtySelectionDialogProps) => {
    // --- STATE MANAGEMENT ---
    const [selectedSet, setSelectedSet] = useState(new Set<number>(currentSelected));
    const [activeItemIndex, setActiveItemIndex] = useState(0);
    const [fromQty, setFromQty] = useState('');
    const [toQty, setToQty] = useState('');
    const [rangeError, setRangeError] = useState<string | null>(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);

    // --- DRAG STATE ---
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartQty, setDragStartQty] = useState<number | null>(null);
    const [dragAction, setDragAction] = useState<'SELECT' | 'DESELECT' | null>(null);
    const [preDragSet, setPreDragSet] = useState(new Set<number>());

    const hasMultipleItems = contentItems && contentItems.length > 0;

    // --- DERIVED VALUES ---
    const currentStartNo = useMemo(() => {
        if (hasMultipleItems) {
            const item = contentItems[activeItemIndex];
            return parseInt(item.fromNo?.toString() || '1') || 1;
        }
        return legacyStartNo;
    }, [hasMultipleItems, contentItems, activeItemIndex, legacyStartNo]);

    const currentMaxQty = useMemo(() => {
        if (hasMultipleItems) {
            const item = contentItems[activeItemIndex];
            return parseInt(item.qty?.toString() || '0') || 0;
        }
        return legacyMaxQty;
    }, [hasMultipleItems, contentItems, activeItemIndex, legacyMaxQty]);

    const currentRange = useMemo(() => {
        return Array.from({ length: currentMaxQty }, (_, i) => currentStartNo + i);
    }, [currentMaxQty, currentStartNo]);

    // Sync state on open
    useEffect(() => {
        if (open) {
            setSelectedSet(new Set<number>(currentSelected));
            setImageError(null);
            setRangeError(null);
            setFromQty('');
            setToQty('');
            setActiveItemIndex(0);
        }
    }, [open, currentSelected]);

    if (!open) return null;

    const finalSelections = Array.from(selectedSet).sort((a, b) => a - b);
    const isCurrentViewAllSelected = currentRange.length > 0 && currentRange.every(qty => selectedSet.has(qty));

    // --- LOGIC HANDLERS ---
    const getDraggedRange = (start: number, end: number): number[] => {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        return currentRange.filter(qty => qty >= min && qty <= max);
    };

    const applyAction = (qtySet: Set<number>, action: 'SELECT' | 'DESELECT', targetQuantities: number[]): Set<number> => {
        const newSet = new Set(qtySet);
        targetQuantities.forEach(q => action === 'SELECT' ? newSet.add(q) : newSet.delete(q));
        return newSet;
    }

    const handleToggleSelection = (qty: number) => {
        setSelectedSet(prev => {
            const newSet = new Set(prev);
            if (newSet.has(qty)) newSet.delete(qty);
            else newSet.add(qty);
            return newSet;
        });
    };

    const handleMouseDown = (e: React.MouseEvent, qty: number) => {
        e.preventDefault();
        const additive = e.ctrlKey || e.metaKey;
        const isCurrentlySelected = selectedSet.has(qty);

        if (!additive && e.buttons === 1) handleToggleSelection(qty);

        const action = (additive && isCurrentlySelected) || (!additive && isCurrentlySelected) ? 'DESELECT' : 'SELECT';

        setIsDragging(true);
        setDragStartQty(qty);
        setDragAction(action);
        setPreDragSet(new Set(selectedSet));
    };

    const handleMouseMove = (qty: number) => {
        if (!isDragging || dragStartQty === null || dragAction === null) return;
        const draggedRange = getDraggedRange(dragStartQty, qty);
        setSelectedSet(() => applyAction(preDragSet, dragAction, draggedRange));
    };

    const handleMouseUpOrLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            setDragStartQty(null);
            setDragAction(null);
            setPreDragSet(new Set<number>());
        }
    };

    const handleSelectAllCurrent = () => {
        setSelectedSet(prev => {
            const newSet = new Set(prev);
            currentRange.forEach(q => newSet.add(q));
            return newSet;
        });
    };

    const handleDeselectAllCurrent = () => {
        setSelectedSet(prev => {
            const newSet = new Set(prev);
            currentRange.forEach(q => newSet.delete(q));
            return newSet;
        });
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsProcessingImage(true);
        setImageError(null);
        try {
            const scannedQuantities = await processImageForSelection(file, currentMaxQty);
            setSelectedSet(prevSet => {
                const newSet = new Set(prevSet);
                scannedQuantities.forEach(qty => {
                    if (currentRange.includes(qty)) newSet.add(qty);
                });
                return newSet;
            });
        } catch (error) {
            setImageError('Failed to process image.');
        } finally {
            setIsProcessingImage(false);
            event.target.value = '';
        }
    };

    const handleSelectRange = () => {
        setRangeError(null);
        const from = parseInt(fromQty, 10);
        const to = parseInt(toQty, 10);
        if (isNaN(from) || isNaN(to)) return setRangeError('Invalid numbers.');

        const start = Math.min(from, to);
        const end = Math.max(from, to);
        const viewEndNo = currentStartNo + currentMaxQty - 1;

        if (start < currentStartNo || end > viewEndNo) {
            return setRangeError(`Must be between ${currentStartNo} - ${viewEndNo}`);
        }

        setSelectedSet(prevSet => {
            const newSet = new Set(prevSet);
            for (let i = start; i <= end; i++) newSet.add(i);
            return newSet;
        });
        setFromQty('');
        setToQty('');
    };

    const handleSave = () => {
        onSelect(finalSelections);
        onClose();
    };

    const isSelected = (qty: number) => selectedSet.has(qty);

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 transition-opacity duration-300"
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
        >
            {/* 🟢 MODAL CONTAINER
                Mobile: w-full h-[100dvh] (Full Screen)
                Desktop: sm:max-w-4xl sm:h-[600px] (FIXED HEIGHT) 
                
                I replaced sm:h-auto with sm:h-[600px] to strictly enforce height
                so it doesn't wobble when changing tabs.
            */}
            <div className="bg-white dark:bg-gray-900 w-full h-[100dvh] sm:h-[600px] sm:max-h-[90vh] sm:max-w-4xl sm:rounded-xl shadow-2xl flex flex-col border-t sm:border border-gray-200 dark:border-gray-800 overflow-hidden relative transition-all">
                
                {/* --- HEADER --- */}
                <div className="flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900 z-20">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            GC #{gcId}
                            <span className="sm:hidden text-xs font-normal text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                {finalSelections.length} Selected
                            </span>
                        </h2>
                        <p className="hidden sm:block text-sm text-muted-foreground mt-0.5">
                            Manage quantities for this container
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                             <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Total</span>
                             <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-sm font-bold border border-primary/20">
                                {finalSelections.length}
                            </span>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* --- TABS --- */}
                {hasMultipleItems && (
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 shrink-0 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex overflow-x-auto hide-scrollbar scroll-smooth px-2 sm:px-6">
                            {contentItems.map((item, idx) => {
                                const isActive = idx === activeItemIndex;
                                const itemStart = parseInt(item.fromNo?.toString() || '1') || 1;
                                const itemQty = parseInt(item.qty?.toString() || '0') || 0;
                                const itemRange = Array.from({ length: itemQty }, (_, i) => itemStart + i);
                                const selectedCount = itemRange.filter(q => selectedSet.has(q)).length;
                                const isFullySelected = selectedCount === itemQty && itemQty > 0;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveItemIndex(idx)}
                                        className={`
                                            flex-shrink-0 relative flex flex-col items-start px-3 py-2 sm:px-4 sm:py-3 text-sm transition-all min-w-[120px] sm:min-w-[140px]
                                            ${isActive ? 'bg-white dark:bg-gray-900 text-primary' : 'text-gray-500 hover:bg-gray-100/50'}
                                        `}
                                    >
                                        <div className="flex items-center gap-2 w-full justify-between mb-1">
                                            <span className={`font-semibold text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none ${isActive ? 'text-gray-900 dark:text-white' : ''}`}>
                                                {item.packing || 'Pack'}
                                            </span>
                                            {isFullySelected && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />}
                                        </div>
                                        <div className="flex justify-between w-full text-[10px] sm:text-xs">
                                            <span className="opacity-70 truncate max-w-[60px]">{item.contents}</span>
                                            <span className={`${isActive ? 'text-primary font-medium' : 'opacity-60'}`}>
                                                {selectedCount}/{itemQty}
                                            </span>
                                        </div>
                                        {isActive && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- MAIN CONTENT WRAPPER --- */}
                {/* flex-1: Ensures this fills the rest of the 600px height.
                    min-h-0: Critical for scrolling to work inside a flex child.
                */}
                <div className="flex-1 flex flex-col p-3 sm:p-6 min-h-0 bg-gray-50/30 dark:bg-black/20">
                    
                    {/* TOOLBAR */}
                    <div className='flex flex-col lg:flex-row justify-between gap-3 sm:gap-4 mb-4 shrink-0'>
                        {/* Range Inputs */}
                        <div className="flex flex-col gap-1 w-full lg:w-auto order-2 lg:order-1">
                            <label className="hidden sm:block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Quick Range</label>
                            <div className="flex items-center gap-2 w-full">
                                <div className="flex flex-1 shadow-sm rounded-md">
                                    <input
                                        type="number"
                                        value={fromQty}
                                        onChange={(e) => setFromQty(e.target.value)}
                                        className="w-full min-w-0 text-sm border-y border-l border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md px-3 py-2.5 sm:py-2 focus:ring-2 focus:ring-primary focus:z-10 focus:outline-none dark:bg-gray-800"
                                        placeholder={`${currentStartNo}`}
                                    />
                                    <div className="bg-gray-100 dark:bg-gray-700 border-y border-gray-300 dark:border-gray-600 px-2 sm:px-3 flex items-center justify-center text-gray-500 text-xs sm:text-sm">
                                        to
                                    </div>
                                    <input
                                        type="number"
                                        value={toQty}
                                        onChange={(e) => setToQty(e.target.value)}
                                        className="w-full min-w-0 text-sm border border-gray-300 dark:border-gray-600 rounded-r-md px-3 py-2.5 sm:py-2 focus:ring-2 focus:ring-primary focus:z-10 focus:outline-none dark:bg-gray-800"
                                        placeholder={`${currentStartNo + currentMaxQty - 1}`}
                                    />
                                </div>
                                <Button onClick={handleSelectRange} size="sm" variant="outline" className="h-[42px] sm:h-[38px] px-4">
                                    Apply
                                </Button>
                            </div>
                            {rangeError && <span className="text-xs text-red-500 font-medium">{rangeError}</span>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-end gap-2 w-full lg:w-auto order-1 lg:order-2">
                             <div className="flex gap-2 w-full lg:w-auto">
                                <Button
                                    onClick={isCurrentViewAllSelected ? handleDeselectAllCurrent : handleSelectAllCurrent}
                                    variant="secondary"
                                    disabled={isProcessingImage}
                                    size="sm"
                                    className="flex-1 lg:flex-none h-[42px] sm:h-[38px] text-xs sm:text-sm"
                                >
                                    {isCurrentViewAllSelected ? 'Uncheck All' : 'Check All'}
                                </Button>

                                <label htmlFor="image-upload" className={`
                                    flex-1 lg:flex-none inline-flex items-center justify-center rounded-md text-xs sm:text-sm font-medium transition-colors h-[42px] sm:h-[38px] px-4 shadow-sm border border-gray-200
                                    ${isProcessingImage 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 cursor-pointer'}
                                `}>
                                    <Upload className={`mr-2 h-4 w-4 ${isProcessingImage ? 'animate-bounce' : ''}`} />
                                    {isProcessingImage ? 'Scanning' : 'Scan'}
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={isProcessingImage}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {imageError && (
                        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-md mb-4 border border-red-100 shrink-0">
                            {imageError}
                        </div>
                    )}

                    {/* GRID CONTAINER */}
                    {/* flex-1: Takes up all remaining vertical space.
                        min-h-0: Allows internal scrolling.
                        This combination guarantees the box size doesn't wobble.
                    */}
                    <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden flex flex-col shadow-inner relative min-h-0">
                        <div className="p-2 border-b border-gray-100 dark:border-gray-700 text-[10px] sm:text-xs text-gray-400 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center sticky top-0 z-10 shrink-0">
                            <span>Range: {currentStartNo} - {currentStartNo + currentMaxQty - 1}</span>
                            <span className="hidden sm:inline">Click or Drag to select</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 sm:p-4 custom-scrollbar touch-pan-y">
                            {currentRange.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <p>No items.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 min-[400px]:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2 pb-2">
                                    {currentRange.map(qty => {
                                        const active = isSelected(qty);
                                        return (
                                            <button
                                                key={qty}
                                                onMouseDown={(e) => handleMouseDown(e, qty)}
                                                onMouseEnter={() => handleMouseMove(qty)}
                                                onMouseUp={handleMouseUpOrLeave}
                                                disabled={isProcessingImage}
                                                // Added tabular-nums to prevent slight font-width jitter
                                                className={`
                                                    h-10 sm:h-9 flex items-center justify-center rounded text-sm font-medium transition-all select-none duration-75 touch-manipulation tabular-nums
                                                    ${active
                                                        ? 'bg-primary text-primary-foreground font-bold shadow-md transform scale-[1.02]'
                                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 active:bg-gray-100'
                                                    }
                                                `}
                                            >
                                                {qty}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col sm:flex-row justify-end gap-3 shrink-0 safe-area-bottom">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        disabled={isProcessingImage} 
                        className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm order-2 sm:order-1"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isProcessingImage} 
                        className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm shadow-lg shadow-primary/20 order-1 sm:order-2 flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Save ({finalSelections.length})
                    </Button>
                </div>
            </div>
        </div>
    );
};