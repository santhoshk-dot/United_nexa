import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { GcEntry, Consignor, Consignee } from '../../types';

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


    // --- UPDATED PRINT LOGIC ---
    useEffect(() => {
        const handleAfterPrint = () => {
            onClose(); // Unmount this component
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        
        window.addEventListener('afterprint', handleAfterPrint);

        setTimeout(() => {
            window.print(); // Trigger print dialog
        }, 100);

        return () => {
            // This cleanup runs when the component unmounts
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [onClose]);

    if (jobs.length === 0) return null;

    const printContent = (
        <div className="load-list-print-wrapper">
            <style>{`
                @media print {
                    /* Hide the main app root */
                    #root {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    
                    /* Show our print wrapper */
                    .load-list-print-wrapper {
                        display: block !important;
                        visibility: visible !important;
                        position: absolute !important;
                        top: 0;
                        left: 0;
                        width: 100%;
                        /* The content padding is now handled by the inner div */
                    }
                    
                    @page {
                        size: A4;
                        margin: 0; /* Important for removing browser header/footer margins */
                    }

                    /* Ensures the total line prints at the very bottom of the last page, not fixed */
                    .print-footer-total {
                        position: static !important;
                        margin-top: 1rem; /* Add some space above the footer in print */
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

                {/* Changed from fixed to standard flow for print, using the special class */}
                <div className="fixed bottom-20 left-0 right-0 z-10 p-4">
                    <div className="max-w-4xl mx-auto text-center font-bold text-lg">
                        <div className="border-t-2 border-black w-full my-2"></div>

                        <div className="py-1">
                            Total : {grandTotalQuantity},
                        </div>

                        <div className="border-t-2 border-black w-full my-2"></div>
                    </div>
                </div>

            </div>
        </div>
    );

    return ReactDOM.createPortal(printContent, document.body);
};