import React, { useEffect, useMemo, useRef } from 'react'; 
import ReactDOM from 'react-dom';
import type { GcEntry, Consignor, Consignee } from '../../types';
import { useAuth } from '../../hooks/useAuth';

// Helper to detect mobile devices (screens smaller than 768px)
const isMobileScreen = () => window.innerWidth < 768;

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
    const userName = user?.name

    const printRef = useRef<HTMLDivElement>(null); 

    const { printData, grandTotalQuantity } = useMemo(() => {
        const groupedLoads = jobs.reduce((acc, job) => {
            const key = `${job.gc.godown || 'N/A'}::${job.consignor.id}::${job.consignee.id}`;
            
            if (!acc[key]) {
                acc[key] = {
                    godown: job.gc.godown || 'N/A',
                    consignorName: job.consignor.name,
                    consigneeName: job.consignee.name,
                    totalQuantity: 0,
                    firstGcFromNo: Number(job.gc.fromNo || 0),
                    packingDetails: job.gc.packing || 'CASE',
                    contentDetails: job.gc.contents || 'FW',
                    gcList: [],
                };
            }

            acc[key].gcList.push(job.gc);
            acc[key].totalQuantity += Number(job.gc.quantity || 0);
            return acc;
        }, {} as Record<string, {
            godown: string;
            consignorName: string;
            consigneeName: string;
            totalQuantity: number;
            firstGcFromNo: number;
            packingDetails: string | undefined;
            contentDetails: string | undefined;
            gcList: GcEntry[];
        }>);

        const calculatedPrintData = Object.values(groupedLoads).map(group => {
            const sortedGcIds = group.gcList
                .map(g => Number(g.id))
                .sort((a, b) => a - b);

            const fromNo = group.firstGcFromNo;
            const toNo = fromNo > 0 ? fromNo + group.totalQuantity - 1 : null;

            return {
                ...group,
                sortedGcIds,
                primaryGcId: sortedGcIds.length > 0 ? sortedGcIds[0] : 'N/A',
                fromNo,
                toNo,
            };
        });

        const calculatedGrandTotalQuantity = calculatedPrintData.reduce((sum, data) => sum + data.totalQuantity, 0);
        
        return { printData: calculatedPrintData, grandTotalQuantity: calculatedGrandTotalQuantity };
    }, [jobs]);


    // --- PRINT LOGIC with SPLIT MOBILE/DESKTOP FIX ---
    useEffect(() => {
        if (jobs.length === 0) return;

        const rootElement = document.getElementById("root");
        const printWrapper = printRef.current; 
        const isMobile = isMobileScreen(); // Determine device type

        if (!rootElement || !printWrapper) {
            console.error("Print elements (root or wrapper) not found.");
            return;
        }

        let printTimeout: number;

        // --- 1. DEFINE UNIVERSAL CLEANUP ---
        // Store original styles *before* they might be changed by JS
        const originalRootDisplay = rootElement.style.display;
        const originalWrapperDisplay = printWrapper.style.display;

        const cleanupStyles = () => {
            // Restore original styles
            rootElement.style.display = originalRootDisplay;
            printWrapper.style.display = originalWrapperDisplay;
            onClose(); 
            window.removeEventListener("afterprint", afterPrint);
        };
        
        const afterPrint = () => {
            // Use a timeout to ensure cleanup runs *after* the print dialog is truly closed
            setTimeout(cleanupStyles, 500); 
        };

        window.addEventListener("afterprint", afterPrint);
        
        // ---------------------------------------------------------
        // 2. MOBILE LOGIC: JS FORCE FIX (Hides UI)
        // ---------------------------------------------------------
        if (isMobile) {
            // Force visibility change *before* print call (THE MOBILE FIX)
            rootElement.style.display = "none";
            printWrapper.style.display = "block";

            // Trigger print after a delay for DOM rendering
            printTimeout = setTimeout(() => {
                window.print();
            }, 500);
        } 
        
        // ---------------------------------------------------------
        // 3. DESKTOP LOGIC: CSS ONLY (Keeps UI visible)
        // ---------------------------------------------------------
        else {
            // Trigger print. Rely on CSS @media print to hide #root.
            printTimeout = setTimeout(() => {
                window.print();
            }, 350);
        }

        // Return cleanup function to run on component unmount
        return () => {
            window.removeEventListener("afterprint", afterPrint);
            clearTimeout(printTimeout);
            // Ensure styles are restored if component unmounts unexpectedly
            rootElement.style.display = originalRootDisplay;
            printWrapper.style.display = originalWrapperDisplay;
        };
    }, [jobs, onClose]); // Added jobs to dependency array for correctness

    if (jobs.length === 0) return null;

    const printContent = (
        <div className="load-list-print-wrapper" ref={printRef} style={{ display: 'none' }}>
            <style>{`
                @media print {
                    /* 🛑 HIDE EVERYTHING AGGRESSIVELY: This handles the desktop hide via CSS */
                    #root,
                    body > *:not(.load-list-print-wrapper) {
                        background-color: #fff !important;
                        display: none !important;
                        visibility: hidden !important;
                        width: 0 !important;
                        height: 0 !important;
                        position: fixed !important;
                        top: -9999px !important;
                    }

                    /* 🛑 SHOW WRAPPER: Force white background AND BLACK TEXT */
                    .load-list-print-wrapper {
                        display: block !important;
                        visibility: visible !important;
                        position: static !important;
                        width: 100% !important;
                        background-color: #fff !important;
                        color: #000 !important; /* <--- CRITICAL FIX FOR DARK MODE BLANK PDF */
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Ensure global page background is white */
                    html, body {
                        background-color: #fff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    @page {
                        size: A4;
                        margin: 0; 
                    }

                    /* Ensures the footer prints at the very bottom, and not fixed */
                    .print-footer-container {
                        position: static !important; 
                        margin-top: 1rem;
                        padding-left: 1rem;
                        padding-right: 1rem;
                    }
                    
                    /* Ensures total footer displays correctly across print pages */
                    .print-split-footer {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: flex-end !important;
                        width: 100% !important;
                    }
                }
                
                @media screen {
                    /* On screen, hide the print wrapper */
                    .load-list-print-wrapper {
                        display: none;
                    }
                    /* Re-apply screen styles for the footer container */
                    .print-footer-container {
                         position: fixed; 
                         bottom: 0; 
                         left: 0; 
                         right: 0; 
                         z-10; 
                         padding: 1rem;
                    }
                }
            `}</style>
            
            <div className="p-5 print:p-0 print:text-[11pt] font-sans">

                <div className="text-center m-5">
                    <h2 className="text-xl font-extrabold mb-1">UNITED TRANSPORT CO. SIVAKASI</h2>
                    <h3 className="text-lg font-extrabold">LOAD TO AS ON {getCurrentDate()}</h3>
                </div>

                {printData.map((data, index) => (
                    <div key={index} className="m-6 leading-snug">
                        <p className="font-bold text-base whitespace-nowrap">
                            {data.godown} &nbsp;&nbsp;
                            {data.consignorName}
                            &nbsp;({data.primaryGcId})
                            &nbsp;[{data.totalQuantity} {data.packingDetails} {data.contentDetails}]
                            &nbsp;-&nbsp; {data.consigneeName}
                        </p>

                        {data.fromNo !== null && data.toNo !== null && data.fromNo > 0 && data.toNo > 0 && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 pl-5 text-left">
                                {
                                    Array.from(
                                        { length: data.toNo - data.fromNo + 1 },
                                        (_, i) => data.fromNo + i
                                    ).map((num) => (
                                        <span key={num} className="font-normal">{num}</span>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                ))}

                {/* --- FOOTER CONTAINER --- */}
                {/* Removed direct fixed classes and applied a generic class for screen/print control */}
                <div className="fixed bottom-0 left-0 right-0 z-10 p-4"> 
                    <div className="max-w-4xl font-bold text-lg mx-auto">
                        <div className="border-t-2 border-black w-full my-2"></div>

                        {/* Flex container to split Total (Left) and User Info (Right) */}
                        <div className="py-1 flex justify-between items-start print-split-footer">
                            {/* LEFT SIDE: Total Quantity */}
                            <div>
                                Total : {grandTotalQuantity}
                            </div>

                            {/* RIGHT SIDE: User Name and Static Line */}
                            <div className="text-xs mb-1 text-center">
                                <p className="italic font-bold mr-1 mb-1">{userName}</p>
                                <p className="italic font-bold mr-1">For UNITED TRANSPORT COMPANY</p>
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
