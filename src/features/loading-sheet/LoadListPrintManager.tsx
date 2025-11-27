import React, { useEffect, useMemo, useRef } from 'react'; // <-- ADDED useRef
import ReactDOM from 'react-dom';
import type { GcEntry, Consignor, Consignee } from '../../types';
import { useAuth } from '../../hooks/useAuth';

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

    // 🛑 NEW: Ref for the print wrapper element
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


    // --- FIXED PRINT LOGIC with JS FORCE HIDE/SHOW ---
    useEffect(() => {
        const rootElement = document.getElementById("root");
        const printWrapper = printRef.current; // Get the wrapper element

        if (!rootElement || !printWrapper) {
            console.error("Print elements (root or wrapper) not found.");
            return;
        }

        // --- 1. JS FORCE FIX START (CRITICAL FOR MOBILE/BLANK DESKTOP) ---
        // Store original styles to ensure the app is restored correctly
        const originalRootDisplay = rootElement.style.display;
        const originalWrapperDisplay = printWrapper.style.display;

        // Define the cleanup function
        const cleanupStyles = () => {
            // Restore original styles
            rootElement.style.display = originalRootDisplay;
            printWrapper.style.display = originalWrapperDisplay;
            onClose(); // Close the manager
            window.removeEventListener("afterprint", afterPrint);
        };
        
        // Define afterprint listener to clean up styles after print dialog is closed
        const afterPrint = () => {
            // Use a timeout to ensure cleanup runs *after* the print dialog closes
            setTimeout(cleanupStyles, 500); 
        };

        window.addEventListener("afterprint", afterPrint);

        // Force visibility change *before* print call
        rootElement.style.display = "none";
        printWrapper.style.display = "block";

        // Trigger print after a short delay
        const printTimeout = setTimeout(() => {
            window.print();
        }, 350); // Increased delay for safety

        // --- JS FORCE FIX END ---

        // Return cleanup function to run on component unmount
        return () => {
            window.removeEventListener("afterprint", afterPrint);
            clearTimeout(printTimeout);
            // Ensure cleanup runs if the component unmounts unexpectedly
            cleanupStyles(); 
        };
    }, [onClose]);

    if (jobs.length === 0) return null;

    const printContent = (
        // 🛑 NEW: Add ref and set initial style to 'none', let JS control visibility
        <div className="load-list-print-wrapper" ref={printRef} style={{ display: 'none' }}>
            <style>{`
                @media print {
                    /* 🛑 HIDE EVERYTHING AGGRESSIVELY: Target #root and body children */
                    #root,
                    body > *:not(.load-list-print-wrapper) {
                        display: none !important;
                        visibility: hidden !important;
                        width: 0 !important;
                        height: 0 !important;
                        position: fixed !important;
                        top: -9999px !important;
                    }

                    /* 🛑 SHOW WRAPPER: Force white background */
                    .load-list-print-wrapper {
                        display: block !important;
                        visibility: visible !important;
                        position: static !important; /* Must be static for print flow */
                        width: 100% !important;
                        background-color: #fff !important; 
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
                        margin: 0; /* Important for removing browser header/footer margins */
                    }

                    /* Ensures the footer prints at the very bottom, and not fixed */
                    .print-footer-total {
                        position: static !important;
                        margin-top: 1rem;
                    }
                    
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

                {/* --- UPDATED FOOTER STRUCTURE FOR LEFT/RIGHT SPLIT --- */}
                {/* 🛑 NOTE: I have removed the 'fixed' styles in the print media query above. 
                    This outer div still needs a high enough margin/padding to not overlap the content. */}
                <div className="print-footer-total"> 
                    <div className="max-w-4xl font-bold text-lg mx-auto">
                        <div className="border-t-2 border-black w-full my-2"></div>

                        {/* Flex container to split Total (Left) and User Info (Right) */}
                        <div className="py-1 flex justify-between items-start print-split-footer">
                            {/* LEFT SIDE: Total Quantity */}
                            <div>
                                Total : {grandTotalQuantity},
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
