import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../../../components/shared/Button';
import { Upload, X, Check, CheckCircle2, Package, Hash, Scan, CheckSquare, Square } from 'lucide-react';
import { processImageForSelection } from '../../../utils/imageProcessor';

type ContentItem = {
    id: string;
    packing: string;
    contents: string;
    qty: string | number;
    fromNo: string | number;
};

type LoadedItem = {
    itemId: string;
    packages: number[];
};

type QtySelectionDialogProps = {
    open: boolean;
    onClose: () => void;
    onSelect: (selectedQuantities: LoadedItem[]) => void;
    gcId: string;
    startNo: number;
    maxQty: number;
    currentSelected: LoadedItem[];
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
    const [selectionMap, setSelectionMap] = useState<Record<number, Set<number>>>({});
    
    const [activeItemIndex, setActiveItemIndex] = useState(0);
    const [fromQty, setFromQty] = useState('');
    const [toQty, setToQty] = useState('');
    const [rangeError, setRangeError] = useState<string | null>(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStartQty, setDragStartQty] = useState<number | null>(null);
    const [dragAction, setDragAction] = useState<'SELECT' | 'DESELECT' | null>(null);
    const [preDragSet, setPreDragSet] = useState(new Set<number>());

    const hasMultipleItems = contentItems && contentItems.length > 0;

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

    const getCurrentSet = useCallback(() => {
        return selectionMap[activeItemIndex] || new Set<number>();
    }, [selectionMap, activeItemIndex]);

    const updateCurrentSet = (newSet: Set<number>) => {
        setSelectionMap(prev => ({
            ...prev,
            [activeItemIndex]: newSet
        }));
    };

    useEffect(() => {
        if (open) {
            const newMap: Record<number, Set<number>> = {};
            
            if (hasMultipleItems) {
                contentItems.forEach((item, idx) => {
                    const savedData = currentSelected.find(s => s.itemId === item.id);
                    
                    if (savedData && Array.isArray(savedData.packages)) {
                        newMap[idx] = new Set(savedData.packages);
                    } else {
                        newMap[idx] = new Set();
                    }
                });
            } else {
                newMap[0] = new Set(); 
            }

            setSelectionMap(newMap);
            setImageError(null);
            setRangeError(null);
            setFromQty('');
            setToQty('');
            setActiveItemIndex(0);
        }
    }, [open, currentSelected, hasMultipleItems, contentItems]);

    if (!open) return null;

    const totalSelectedCount = Object.values(selectionMap).reduce((acc, set) => acc + set.size, 0);
    const currentSet = getCurrentSet();
    const isCurrentViewAllSelected = currentRange.length > 0 && currentRange.every(qty => currentSet.has(qty));

    const getDraggedRange = (start: number, end: number): number[] => {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        return currentRange.filter(qty => qty >= min && qty <= max);
    };

    const applyAction = (qtySet: Set<number>, action: 'SELECT' | 'DESELECT', targetQuantities: number[]): Set<number> => {
        const newSet = new Set(qtySet);
        targetQuantities.forEach(q => action === 'SELECT' ? newSet.add(q) : newSet.delete(q));
        return newSet;
    };

    const handleToggleSelection = (qty: number) => {
        const newSet = new Set(getCurrentSet());
        if (newSet.has(qty)) newSet.delete(qty);
        else newSet.add(qty);
        updateCurrentSet(newSet);
    };

    const handleMouseDown = (e: React.MouseEvent, qty: number) => {
        e.preventDefault();
        const additive = e.ctrlKey || e.metaKey;
        const currentSet = getCurrentSet();
        const isCurrentlySelected = currentSet.has(qty);

        if (!additive && e.buttons === 1) handleToggleSelection(qty);
        const action = (additive && isCurrentlySelected) || (!additive && isCurrentlySelected) ? 'DESELECT' : 'SELECT';

        setIsDragging(true);
        setDragStartQty(qty);
        setDragAction(action);
        setPreDragSet(new Set(currentSet));
    };

    const handleMouseMove = (qty: number) => {
        if (!isDragging || dragStartQty === null || dragAction === null) return;
        const draggedRange = getDraggedRange(dragStartQty, qty);
        const result = applyAction(preDragSet, dragAction, draggedRange);
        updateCurrentSet(result);
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
        const newSet = new Set(getCurrentSet());
        currentRange.forEach(q => newSet.add(q));
        updateCurrentSet(newSet);
    };

    const handleDeselectAllCurrent = () => {
        const newSet = new Set(getCurrentSet());
        currentRange.forEach(q => newSet.delete(q));
        updateCurrentSet(newSet);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsProcessingImage(true);
        setImageError(null);
        try {
            const scannedQuantities = await processImageForSelection(file, currentMaxQty);
            const newSet = new Set(getCurrentSet());
            scannedQuantities.forEach(qty => {
                if (currentRange.includes(qty)) newSet.add(qty);
            });
            updateCurrentSet(newSet);
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

        const newSet = new Set(getCurrentSet());
        for (let i = start; i <= end; i++) newSet.add(i);
        updateCurrentSet(newSet);
        
        setFromQty('');
        setToQty('');
    };

    const handleSave = () => {
        const result: LoadedItem[] = [];
        
        contentItems.forEach((item, idx) => {
            const set = selectionMap[idx];
            if (set && set.size > 0) {
                result.push({
                    itemId: item.id,
                    packages: Array.from(set).sort((a, b) => a - b)
                });
            }
        });

        onSelect(result);
        onClose();
    };

    const isSelected = (qty: number) => getCurrentSet().has(qty);

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
        >
            <div className="bg-card w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-border overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4 border-b border-border shrink-0 bg-card sticky top-0 z-20">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                                GC #{gcId}
                                <span className="sm:hidden text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {totalSelectedCount} Selected
                                </span>
                            </h2>
                            <p className="hidden sm:block text-xs text-muted-foreground">
                                Select quantities for loading
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Total</span>
                            <span className="text-sm font-bold text-primary">{totalSelectedCount}</span>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {hasMultipleItems && (
                    <div className="bg-muted/30 shrink-0 border-b border-border">
                        <div className="flex overflow-x-auto scrollbar-hide px-2 sm:px-4">
                            {contentItems.map((item, idx) => {
                                const isActive = idx === activeItemIndex;
                                const itemQty = parseInt(item.qty?.toString() || '0') || 0;
                                const tabSet = selectionMap[idx] || new Set();
                                const selectedCount = tabSet.size;
                                const isFullySelected = selectedCount === itemQty && itemQty > 0;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveItemIndex(idx)}
                                        className={`
                                            flex-shrink-0 relative flex flex-col items-start px-3 py-2.5 sm:px-4 sm:py-3 text-sm transition-all min-w-[110px] sm:min-w-[140px]
                                            ${isActive 
                                                ? 'bg-card text-foreground' 
                                                : 'text-muted-foreground hover:bg-muted/50'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-1.5 sm:gap-2 w-full justify-between mb-0.5 sm:mb-1">
                                            <span className={`font-semibold text-xs sm:text-sm truncate max-w-[70px] sm:max-w-none ${isActive ? 'text-foreground' : ''}`}>
                                                {item.packing || 'Pack'}
                                            </span>
                                            {isFullySelected && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />}
                                        </div>
                                        <div className="flex justify-between w-full text-[10px] sm:text-xs">
                                            <span className="opacity-60 truncate max-w-[50px] sm:max-w-[60px]">{item.contents}</span>
                                            <span className={`${isActive ? 'text-primary font-medium' : 'opacity-60'}`}>
                                                {selectedCount}/{itemQty}
                                            </span>
                                        </div>
                                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col p-3 sm:p-4 min-h-0 bg-background/50 overflow-hidden">
                    
                    {/* Toolbar */}
                    <div className="flex flex-col lg:flex-row justify-between gap-3 mb-3 sm:mb-4 shrink-0">
                        {/* Range Input */}
                        <div className="flex flex-col gap-1 w-full lg:w-auto order-2 lg:order-1">
                            <label className="hidden sm:block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                                Quick Range
                            </label>
                            <div className="flex items-center gap-2 w-full">
                                <div className="flex flex-1 rounded-lg overflow-hidden border border-border bg-card shadow-sm">
                                    <input
                                        type="number"
                                        value={fromQty}
                                        onChange={(e) => setFromQty(e.target.value)}
                                        className="w-full min-w-0 text-sm bg-transparent px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50"
                                        placeholder={`${currentStartNo}`}
                                    />
                                    <div className="bg-muted/50 border-x border-border px-2 sm:px-3 flex items-center justify-center text-muted-foreground text-xs sm:text-sm shrink-0">
                                        to
                                    </div>
                                    <input
                                        type="number"
                                        value={toQty}
                                        onChange={(e) => setToQty(e.target.value)}
                                        className="w-full min-w-0 text-sm bg-transparent px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50"
                                        placeholder={`${currentStartNo + currentMaxQty - 1}`}
                                    />
                                </div>
                                <Button 
                                    onClick={handleSelectRange} 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-[42px] sm:h-[38px] px-3 sm:px-4 shrink-0"
                                >
                                    Apply
                                </Button>
                            </div>
                            {rangeError && <span className="text-[10px] sm:text-xs text-destructive font-medium">{rangeError}</span>}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-end gap-2 w-full lg:w-auto order-1 lg:order-2">
                            <div className="flex gap-2 w-full lg:w-auto">
                                <Button
                                    onClick={isCurrentViewAllSelected ? handleDeselectAllCurrent : handleSelectAllCurrent}
                                    variant="outline"
                                    disabled={isProcessingImage}
                                    size="sm"
                                    className="flex-1 lg:flex-none h-[42px] sm:h-[38px] text-xs sm:text-sm"
                                >
                                    {isCurrentViewAllSelected ? (
                                        <>
                                            <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                                            <span className="hidden xs:inline">Uncheck</span> Deselect All
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                                            <span className="hidden xs:inline">Check</span> Select All
                                        </>
                                    )}
                                </Button>
                                <label 
                                    htmlFor="image-upload" 
                                    className={`
                                        flex-1 lg:flex-none inline-flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors h-[42px] sm:h-[38px] px-3 sm:px-4 border border-border
                                        ${isProcessingImage 
                                            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                                            : 'bg-card text-foreground hover:bg-muted cursor-pointer'
                                        }
                                    `}
                                >
                                    {isProcessingImage ? (
                                        <>
                                            <Scan className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 animate-pulse" />
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                                            Scan
                                        </>
                                    )}
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

                    {/* Image Error */}
                    {imageError && (
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm mb-3 shrink-0">
                            <X className="w-4 h-4 shrink-0" />
                            {imageError}
                        </div>
                    )}

                    {/* Grid Container */}
                    <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden flex flex-col min-h-0 shadow-sm">
                        {/* Grid Header */}
                        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Range: <span className="font-medium text-foreground">{currentStartNo} - {currentStartNo + currentMaxQty - 1}</span></span>
                            </div>
                            <span className="hidden sm:block text-[10px] sm:text-xs text-muted-foreground">Click or drag to select and unselect</span>
                        </div>
                        
                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                            {currentRange.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 py-8">
                                    <Package className="w-10 h-10 opacity-30" />
                                    <p className="text-sm">No items available</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2">
                                    {currentRange.map(qty => {
                                        const active = isSelected(qty);
                                        return (
                                            <button
                                                key={qty}
                                                onMouseDown={(e) => handleMouseDown(e, qty)}
                                                onMouseEnter={() => handleMouseMove(qty)}
                                                onMouseUp={handleMouseUpOrLeave}
                                                disabled={isProcessingImage}
                                                className={`
                                                    aspect-square sm:h-10 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all select-none duration-100 touch-manipulation tabular-nums
                                                    ${active
                                                        ? 'bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/30'
                                                        : 'bg-muted/50 hover:bg-muted border border-border text-foreground'
                                                    }
                                                    ${isProcessingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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

                {/* Footer */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-card flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 shrink-0">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        disabled={isProcessingImage} 
                        className="w-full sm:w-auto h-11 sm:h-10"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isProcessingImage} 
                        className="w-full sm:w-auto h-11 sm:h-10"
                    >
                        <Check className="w-4 h-4 mr-1.5" />
                        Save Selection ({totalSelectedCount})
                    </Button>
                </div>
            </div>
        </div>
    );
};