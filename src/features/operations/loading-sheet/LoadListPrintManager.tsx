import React, { useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { GcEntry, Consignor, Consignee } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { X, Printer } from 'lucide-react';
import { useDataContext } from '../../../contexts/DataContext'; 

export type LoadListJob = {
    gc: GcEntry;
    consignor: Consignor;
    consignee: Consignee;
};

type LoadListPrintManagerProps = {
    jobs: LoadListJob[];
    onClose: () => void;
};

const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).replace(/\//g, '-');
};

export const LoadListPrintManager: React.FC<LoadListPrintManagerProps> = ({ jobs, onClose }) => {
    const { user } = useAuth(); 
    const { printSettings } = useDataContext(); 
    const label = printSettings.loadingSheet; 

    const userName = user?.name
    const printTriggered = useRef(false);

    const { printData, grandTotalQuantity } = useMemo(() => {
        // 🟢 STEP 1: Flatten all jobs into individual printable items
        // If a GC has 2 content items, it becomes 2 entries here.
        const allItems = jobs.flatMap(job => {
            const baseInfo = {
                godown: job.gc.godown || 'N/A',
                consignorId: job.consignor.id,
                consigneeId: job.consignee.id,
                consignorName: job.consignor.name,
                consigneeName: job.consignee.name,
                gcNo: job.gc.gcNo,
            };

            // Check if backend provided multi-content array
            const hasContentItems = job.gc.contentItems && Array.isArray(job.gc.contentItems) && job.gc.contentItems.length > 0;

            if (hasContentItems) {
                return job.gc.contentItems!.map((item: any) => ({
                    ...baseInfo,
                    packing: item.packing || '',
                    contents: item.contents || '',
                    qty: parseInt(item.qty?.toString() || '0') || 0,
                    fromNo: parseInt(item.fromNo?.toString() || '1') || 1
                }));
            } else {
                // Fallback for legacy single-item GCs
                return [{
                    ...baseInfo,
                    packing: job.gc.packing || 'CASE',
                    contents: job.gc.contents || 'FW',
                    qty: parseInt(job.gc.quantity?.toString() || job.gc.totalQty?.toString() || '0') || 0,
                    fromNo: parseInt(job.gc.fromNo?.toString() || '1') || 1
                }];
            }
        });

        // 🟢 STEP 2: Group by Godown + Consignor + Consignee + Packing + Content
        const groupedLoads = allItems.reduce((acc, item) => {
            // Unique key for grouping
            const key = `${item.godown}::${item.consignorId}::${item.consigneeId}::${item.packing}::${item.contents}`;
            
            if (!acc[key]) {
                acc[key] = {
                    godown: item.godown,
                    consignorName: item.consignorName,
                    consigneeName: item.consigneeName,
                    packingDetails: item.packing,
                    contentDetails: item.contents,
                    totalQuantity: 0,
                    gcNos: new Set<string>(), // Track GC numbers involved
                    allNumbers: [] as number[], // Collect specific package numbers
                };
            }

            acc[key].totalQuantity += item.qty;
            acc[key].gcNos.add(item.gcNo);

            // Generate specific numbers for this batch (e.g. 1 to 20)
            for (let i = 0; i < item.qty; i++) {
                acc[key].allNumbers.push(item.fromNo + i);
            }

            return acc;
        }, {} as Record<string, {
            godown: string;
            consignorName: string;
            consigneeName: string;
            packingDetails: string;
            contentDetails: string;
            totalQuantity: number;
            gcNos: Set<string>;
            allNumbers: number[];
        }>);

        // 🟢 STEP 3: Format for display
        const calculatedPrintData = Object.values(groupedLoads).map(group => {
            // Sort GC IDs for display (e.g., GC 22, 23)
            // Use numeric sort if possible, string fallback
            const sortedGcIds = Array.from(group.gcNos).sort((a, b) => {
                const numA = parseInt(a);
                const numB = parseInt(b);
                return !isNaN(numA) && !isNaN(numB) ? numA - numB : a.localeCompare(b);
            });

            // Sort the actual package numbers to be printed (1, 2, 3...)
            group.allNumbers.sort((a, b) => a - b);

            return {
                ...group,
                primaryGcId: sortedGcIds[0] || 'N/A', // Display first GC No
                numbersToDisplay: group.allNumbers
            };
        });

        const calculatedGrandTotalQuantity = calculatedPrintData.reduce((sum, data) => sum + data.totalQuantity, 0);
        
        return { printData: calculatedPrintData, grandTotalQuantity: calculatedGrandTotalQuantity };
    }, [jobs]);


    // --- AUTO PRINT TRIGGER ---
    useEffect(() => {
        if (jobs.length === 0) return;
        if (printTriggered.current) return;

        // Small delay ensures content renders into the portal before printing
        const timer = setTimeout(() => {
            printTriggered.current = true;
            window.print();
        }, 1000);

        return () => {
            clearTimeout(timer);
        };
    }, [jobs]);

    const handleManualPrint = () => {
        window.print();
    };

    if (jobs.length === 0) return null;

    const printContent = (
        <div className="load-list-print-wrapper">
            <style>{`
                /* =========================================
                   1. PRINT STYLES (The Output Paper)
                   ========================================= */
                @media print {
                    /* Remove browser default margins */
                    @page {
                        size: A4;
                        margin: 0; 
                    }

                    /* Hide the main App and everything else */
                    body > *:not(.load-list-print-wrapper) {
                        display: none !important;
                    }
                    #root {
                        display: none !important;
                    }

                    /* Reset HTML/Body */
                    html, body {
                        height: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: white !important;
                    }

                    /* Wrapper takes over */
                    .load-list-print-wrapper {
                        display: block !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        background: white;
                        z-index: 9999;
                    }

                    /* Force black text */
                    .load-list-print-wrapper * {
                        color: black !important;
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }

                    /* Hide Toolbar */
                    .print-actions { display: none !important; }

                    /* Paper Style Reset for Print */
                    .print-paper {
                        width: 100% !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 10mm !important; /* Maintain internal padding */
                        min-height: 296mm !important; /* Force A4 height */
                        transform: none !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }

                    /* Footer Alignment */
                    .print-split-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        width: 100%;
                    }
                }
                
                /* =========================================
                   2. SCREEN STYLES (The Preview Overlay)
                   ========================================= */
                @media screen {
                    .load-list-print-wrapper {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        width: 100vw;
                        height: 100dvh; /* Mobile-friendly viewport height */
                        
                        /* Theme-aware background color */
                        background-color: hsl(var(--muted)); 
                        
                        z-index: 2147483647; /* Max Z-Index */
                        overflow-y: auto;
                        overflow-x: hidden;
                        
                        /* Layout for centering pages */
                        padding-top: 80px; /* Space for fixed header */
                        padding-bottom: 40px;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        
                        -webkit-overflow-scrolling: touch;
                    }
                    
                    /* Desktop Page Preview Style */
                    .print-paper {
                        background: white;
                        color: black; /* Preview text always black */
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                        margin-bottom: 24px;
                        transform-origin: top center;
                        transition: transform 0.2s ease;
                        width: 210mm; /* Fixed A4 width */
                        min-height: 297mm;
                        padding: 10mm;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                    }

                    /* Show standard flex for footer on screen too */
                    .print-split-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        width: 100%;
                    }
                }

                /* =========================================
                   3. MOBILE RESPONSIVENESS (Scaling)
                   ========================================= */
                @media screen and (max-width: 800px) {
                    .load-list-print-wrapper {
                        padding-top: 70px;
                        padding-left: 0;
                        padding-right: 0;
                        background-color: #1f2937; /* Darker background on mobile */
                    }

                    .print-paper {
                        /* Scale A4 (794px) down to fit ~375px screens */
                        transform: scale(0.46); 
                        /* Pull up the whitespace caused by scaling */
                        margin-bottom: -140mm; 
                        margin-top: 10px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    }
                }

                @media screen and (min-width: 450px) and (max-width: 800px) {
                   /* Tablets */
                   .print-paper {
                     transform: scale(0.65);
                     margin-bottom: -90mm;
                   }
                }

                /* =========================================
                   4. TOOLBAR STYLES (Themed)
                   ========================================= */
                .print-actions {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%;
                    height: 64px;
                    
                    /* Theme variables for colors */
                    background-color: hsl(var(--card));
                    color: hsl(var(--foreground));
                    border-bottom: 1px solid hsl(var(--border));
                    
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    z-index: 2147483648;
                }

                .preview-title {
                    font-weight: 700;
                    font-size: 16px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .action-group {
                    display: flex;
                    gap: 10px;
                }

                .btn-base {
                    display: flex; align-items: center; gap: 8px;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 14px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                /* Themed Primary Button */
                .print-btn {
                    background-color: hsl(var(--primary));
                    color: hsl(var(--primary-foreground));
                }
                .print-btn:active { transform: scale(0.96); }
                .print-btn:hover { opacity: 0.9; }

                /* Themed Destructive Button */
                .close-btn {
                    background-color: hsl(var(--destructive));
                    color: hsl(var(--destructive-foreground));
                }
                .close-btn:active { transform: scale(0.96); }
                .close-btn:hover { opacity: 0.9; }

                /* Small screen adjustments for toolbar */
                @media screen and (max-width: 480px) {
                    .preview-title { font-size: 14px; max-width: 120px; }
                    .btn-base { padding: 6px 12px; font-size: 13px; }
                    .action-group { gap: 8px; }
                }
            `}</style>
            
            {/* HEADER TOOLBAR */}
            <div className="print-actions">
                <span className="preview-title">
                    Load List Preview
                </span>
                <div className="action-group">
                    <button onClick={handleManualPrint} className="btn-base print-btn">
                        <Printer size={18} />
                        <span>Print</span>
                    </button>
                    <button onClick={onClose} className="btn-base close-btn">
                        <X size={18} />
                        <span>Close</span>
                    </button>
                </div>
            </div>

            {/* DOCUMENT CONTAINER */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                {/* THE PAPER */}
                <div className="print-paper font-sans text-[11pt]">
                    
                    {/* CONTENT SECTION (Grows to fill space) */}
                    <div className="flex-1">
                        <div className="text-center mb-6">
                            {/* 泙 Dynamic Company Name */}
                            <h2 className="text-xl font-extrabold mb-1 uppercase">{label.companyName}</h2>
                            {/* 泙 Dynamic Main Header with Date */}
                            <h3 className="text-lg font-extrabold uppercase">{label.mainHeader} {getCurrentDate()}</h3>
                        </div>

                        {printData.map((data, index) => (
                            <div key={index} className="mb-6 leading-snug">
                                <p className="font-bold text-base whitespace-nowrap">
                                    {data.godown} &nbsp;&nbsp;
                                    {data.consignorName}
                                    &nbsp;({data.primaryGcId})
                                    &nbsp;[{data.totalQuantity} {data.packingDetails} {data.contentDetails}]
                                    &nbsp;-&nbsp; {data.consigneeName}
                                </p>

                                {/* 🟢 Updated Number Rendering */}
                                {data.numbersToDisplay && data.numbersToDisplay.length > 0 && (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 pl-5 text-left">
                                        {data.numbersToDisplay.map((num) => (
                                                <span key={num} className="font-normal">{num}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* FOOTER (Pushed to bottom via flex-1 above) */}
                    <div className="mt-auto pt-4">
                        <div className="border-t-2 border-black w-full my-2"></div>
                        <div className="py-1 print-split-footer">
                            <div className="font-bold text-lg">
                                {/* 泙 Dynamic Total Label */}
                                {label.totalLabel} {grandTotalQuantity}
                            </div>
                            <div className="text-xs text-center">
                                <p className="italic font-bold mr-1 mb-1">{userName}</p>
                                {/* 泙 Dynamic Signature Line */}
                                <p className="italic font-bold mr-1">{label.companySignatureLine}</p>
                            </div>
                        </div>
                        <div className="border-t-2 border-black w-full my-2"></div>
                    </div>

                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(printContent, document.body);
};