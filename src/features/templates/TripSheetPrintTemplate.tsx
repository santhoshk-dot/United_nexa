import React, { useCallback, useEffect, useState } from "react";
import type { TripPrintLabels } from "../../types";

// --- TYPE DEFINITIONS ---
type Change = {
    field: keyof TripPrintLabels;
    oldValue: string;
};

export type TripSheetTemplateProps = Partial<{
    onEdit: (hasChanges: boolean, saveHandler: () => void, resetHandler: () => void, undoHandler: () => void) => void;
}>;

// --- MOCK CONTEXT HOOK (Fix for missing context properties) ---
const useTripPrintContext = () => {
    // Default initial labels based on TripPrintLabels type
    const defaultLabels: TripPrintLabels = {
        title: "TRIP SHEET",
        fixedGstinLabel: "GSTIN:",
        fixedGstinValue: "33ABLPV5082H3Z8",
        mobileLabel: "Mobile:",
        mobileNumberValue: "9787718433",
        companyName: "UNITED TRANSPORT COMPANY",
        companyAddress: "164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123",
        
        mfNoLabel: "M.F. No.:",
        carriersLabel: "Carriers:",
        
        fromLabel: "From:",
        toLabel: "To:",
        dateLabel: "Date:",
        
        cnNoHeader: "C.N.No.",
        packagesHeader: "No. of Packages",
        contentsHeader: "Contents",
        consignorHeader: "Consignor",
        consigneeHeader: "Consignee",
        toPayHeader: "To Pay",
        
        footerNote0: "Goods have been loaded in good condition. All Checkpost papers have been handed over to the truck driver.",
        footerNote1: "Goods to be unloaded at",
        footerNote2: "Please pay lorry hire Rs.",
        footerNote3: "on receiving the goods in sound condition.",
        totalPackagesLabel: "TOTAL PACKAGES:",
        lorryHireLabel: "Lorry Hire",
        
        driverNameLabel: "Driver Name",
        dlNoLabel: "D.L.No.",
        driverMobileLabel: "Driver number",
        ownerNameLabel: "Owner Name",
        ownerMobileLabel: "Owner number",
        lorryNoLabel: "Lorry No.",
        lorryNameLabel: "Lorry Name",
        
        legalNote: "I have received the goods noted above in good and condition along with the documents. I am responsible for the safe delivery at the destination. All risks and expenses EN ROUTE will be of the driver. Transit risks are covered by driver/owner. Received all the related documents & goods intact. We will not be responsible for the unloading on holidays.",
        signatureDriverLabel: "Signature of the Owner/Driver/Broker",
        signatureClerkLabel: "Signature of the Booking Clerk"
    };

    const [tripPrintLabels, setTripPrintLabels] = useState<TripPrintLabels>(defaultLabels);

    const updateTripPrintLabels = (newLabels: TripPrintLabels) => {
        setTripPrintLabels(newLabels);
        console.log("Trip Print Labels updated (Local Mock):", newLabels);
    };

    return { tripPrintLabels, updateTripPrintLabels };
};

// --- EditableText Component (Unchanged) ---
const EditableText: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    placeholder?: string;
}> = ({ value, onChange, className = "", placeholder = "" }) => (
    <input
        type="text"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className={`border border-dashed border-gray-600 p-0.5 w-full appearance-none focus:border-solid focus:bg-white ${className}`}
        style={{ minWidth: '30px' }}
    />
);

// --- EditableTextArea Component (Unchanged) ---
const EditableTextArea: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    className?: string;
    placeholder?: string;
    rows?: number;
}> = ({ value, onChange, className = "", placeholder = "", rows = 3 }) => (
    <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`border border-dashed border-gray-400 p-0.5 w-full focus:border-solid focus:bg-white ${className}`}
        style={{ minHeight: `${rows * 1.5}rem`}}
    />
);

// --- Core Template Component with Action Logic ---
const TripSheetCoreTemplate: React.FC<TripSheetTemplateProps> = ({ onEdit }) => {
    // 🟢 FIX: Use local hook instead of missing DataContext properties
    const { tripPrintLabels: originalLabels, updateTripPrintLabels } = useTripPrintContext();
   
    const [localLabels, setLocalLabels] = useState<TripPrintLabels>(originalLabels);
    const [historyStack, setHistoryStack] = useState<Change[]>([]);
    const hasChanges = historyStack.length > 0;

    type StaticChangeElement = HTMLInputElement | HTMLTextAreaElement;

    // --- Action Handlers ---

    const saveHandler = useCallback(() => {
        updateTripPrintLabels(localLabels);
        setHistoryStack([]);
    }, [localLabels, updateTripPrintLabels]);

    const resetHandler = useCallback(() => {
        setLocalLabels(originalLabels);
        setHistoryStack([]);
    }, [originalLabels]);

    const undoHandler = useCallback(() => {
        setHistoryStack(prevStack => {
            if (prevStack.length === 0) return prevStack;

            const lastChange = prevStack[prevStack.length - 1];
           
            // 🟢 FIX: Explicitly type prevLabels
            setLocalLabels((prevLabels: TripPrintLabels) => ({
                ...prevLabels,
                [lastChange.field]: lastChange.oldValue || ''
            }));

            return prevStack.slice(0, -1);
        });
    }, []);

    // --- Effects ---

    // 1. Sync local state when originalLabels change from context
    useEffect(() => {
        if (JSON.stringify(localLabels) !== JSON.stringify(originalLabels)) {
            setLocalLabels(originalLabels);
            setHistoryStack([]);
        }
    }, [originalLabels]);

    // 2. Report current status and handlers to the parent component
    useEffect(() => {
        if (onEdit) {
            onEdit(hasChanges, saveHandler, resetHandler, undoHandler);
        }
    }, [hasChanges, onEdit, saveHandler, resetHandler, undoHandler]);
   
    // --- Change Handler with History Recording ---
    const handleTextChange = (field: keyof TripPrintLabels) => (
        e: React.ChangeEvent<StaticChangeElement>
    ) => {
        const newValue = e.target.value;
        const currentValue = localLabels[field];

        // 1. Update local state immediately
        // 🟢 FIX: Explicitly type prevLabels
        setLocalLabels((prevLabels: TripPrintLabels) => ({
            ...prevLabels,
            [field]: newValue
        }));

        // 2. Record change for history/undo
        if (newValue !== currentValue) {
            setHistoryStack(prevStack => {
                return [
                    ...prevStack,
                    { field: field, oldValue: currentValue || '' }
                ];
            });
        }
    };

    const label = localLabels as unknown as TripPrintLabels;

    // --- Template Markup (Using localLabels) ---
    return (
        <div
            className="report-page bg-white text-black shadow-2xl mx-auto border border-gray-300"
            style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "10mm",
                boxSizing: "border-box",
                fontFamily: 'Arial, Helvetica, sans-serif'
            }}
        >
            <div className="border-2 border-black p-2 w-full box-border">
               
                <div className="text-center font-bold text-lg mb-1 uppercase">
                    <EditableText
                        value={label.title}
                        className="text-lg font-bold text-center w-auto"
                        placeholder="TRIP SHEET"
                        onChange={handleTextChange("title")}
                    />
                </div>
               
                {/* Header Block (Company & Meta) */}
                <div className="flex border-2 border-black">
                    <div className="w-[70%] border-r border-black p-2">
                        <div className="flex flex-col justify-between gap-4 items-baseline text-xs font-bold mb-1 leading-none">
                            <span className="flex gap-1">
                                <EditableText value={label.fixedGstinLabel} className="text-xs font-bold w-auto text-right" placeholder="GSTIN:" onChange={handleTextChange("fixedGstinLabel")} />
                                <EditableText value={label.fixedGstinValue} className="text-xs font-bold w-auto" placeholder="33ABLPV5082H3Z8" onChange={handleTextChange("fixedGstinValue")} />
                            </span>
                            <span className="flex gap-1">
                                <EditableText value={label.mobileLabel} className="text-xs font-bold w-auto text-right" placeholder="Mobile:" onChange={handleTextChange("mobileLabel")} />
                                <EditableText value={label.mobileNumberValue} className="text-xs font-bold w-auto" placeholder="9787718433" onChange={handleTextChange("mobileNumberValue")} />
                            </span>
                        </div>
                       
                        <h1 className="text-xl font-extrabold uppercase text-left tracking-tight mt-1">
                            <EditableText value={label.companyName } className="text-xl font-extrabold text-left tracking-tight" placeholder="COMPANY NAME" onChange={handleTextChange("companyName")} />
                        </h1>
                        <p className="text-xs font-normal mt-1 text-left">
                            <EditableText value={label.companyAddress } className="text-xs font-normal text-left" placeholder="Address..." onChange={handleTextChange("companyAddress")} />
                        </p>
                    </div>

                    <div className="w-[30%] text-left text-xs p-2 space-y-1">
                        <div>
                            <strong><EditableText value={label.mfNoLabel } className="text-xs font-bold w-1/3" placeholder="M.F. No.:" onChange={handleTextChange("mfNoLabel")} /></strong>
                        </div>
                        <div>
                            <strong><EditableText value={label.carriersLabel } className="text-xs font-bold w-1/3" placeholder="Carriers:" onChange={handleTextChange("carriersLabel")} /></strong>
                        </div>
                    </div>
                </div>

                {/* From / To / Date Block */}
                <div className="flex justify-between mt-2 p-1 border-t border-b border-black text-sm font-normal">
                    <div className="flex gap-1">
                        <EditableText value={label.fromLabel } className="text-sm font-bold w-auto text-center" placeholder="From:" onChange={handleTextChange("fromLabel")} />
                    </div>
                    <div className="flex gap-1">
                        <EditableText value={label.toLabel } className="text-sm font-bold w-auto text-center" placeholder="To:" onChange={handleTextChange("toLabel")} />
                    </div>
                    <div className="flex gap-1">
                        <EditableText value={label.dateLabel } className="text-sm font-bold w-auto text-center" placeholder="Date:" onChange={handleTextChange("dateLabel")} />
                    </div>
                </div>

                {/* Main Table */}
                <table className="w-full table-fixed border-collapse border-black text-[11px] mt-1 border-2 my-4">
                    <thead>
                        <tr>
                            <th className="border border-black w-[10%] p-1 text-center font-bold text-xs"><EditableText value={label.cnNoHeader } className="font-bold text-xs text-center" onChange={handleTextChange("cnNoHeader")} /></th>
                            <th className="border border-black w-[15%] p-1 text-center font-bold text-xs"><EditableText value={label.packagesHeader  } className="font-bold text-xs text-center" onChange={handleTextChange("packagesHeader")} /></th>
                            <th className="border border-black w-[12%] p-1 text-center font-bold text-xs"><EditableText value={label.contentsHeader } className="font-bold text-xs text-center" onChange={handleTextChange("contentsHeader")} /></th>
                            <th className="border border-black w-[20%] p-1 text-center font-bold text-xs"><EditableText value={label.consignorHeader } className="font-bold text-xs text-center" onChange={handleTextChange("consignorHeader")} /></th>
                            <th className="border border-black w-[20%] p-1 text-center font-bold text-xs"><EditableText value={label.consigneeHeader } className="font-bold text-xs text-center" onChange={handleTextChange("consigneeHeader")} /></th>
                            <th className="border border-black w-[10%] p-1 text-center font-bold text-xs"><EditableText value={label.toPayHeader } className="font-bold text-xs text-center" onChange={handleTextChange("toPayHeader")} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Placeholder rows matching the 15 visible rows and height of 22px */}
                        {Array.from({ length: 3 }).map((_, i) => (
                            <tr key={`f-${i}`} className="h-[22px]">
                                <td className="border border-black p-1">&nbsp;</td>
                                <td className="border border-black p-1">&nbsp;</td>
                                <td className="border border-black p-1">&nbsp;</td>
                                <td className="border border-black p-1">&nbsp;</td>
                                <td className="border border-black p-1">&nbsp;</td>
                                <td className="border border-black p-1">&nbsp;</td>
                            </tr>
                        ))}
                       
                        {/* TOTAL ROW */}
                        <tr className="h-8 font-bold">
                            <td className="border border-black p-1 px-2 text-left" colSpan={5}>
                                <EditableText value={label.totalPackagesLabel } className="font-bold text-xs text-left w-auto" placeholder="TOTAL PACKAGES:" onChange={handleTextChange("totalPackagesLabel")} />
                            </td>
                            <td colSpan={1}></td>
                        </tr>
                    </tbody>
                </table>

                {/* Footer Section */}
                <div className="text-xs mt-2 space-y-2">
                        <EditableText value={label.footerNote0 } className="text-xs w-full" placeholder="Note 0..." onChange={handleTextChange("footerNote0")} />                        
                        <EditableText value={label.footerNote1 } className="text-xs w-auto" placeholder="Note 1..." onChange={handleTextChange("footerNote1")} />

                        <EditableText value={label.footerNote2 } className="text-xs w-auto" placeholder="Note 2..." onChange={handleTextChange("footerNote2")} />
                       
                        <EditableText value={label.footerNote3 } className="text-xs w-auto" placeholder="Note 3..." onChange={handleTextChange("footerNote3")} />
                </div>
               
                {/* Driver / Owner / Lorry Grid */}
                <div className="border-t border-black mt-2 pt-2 grid grid-cols-3 gap-4 text-xs">
                    {/* Driver Column */}
                    <div>
                        <div className="mb-1">
                            <strong><EditableText value={label.driverNameLabel } className="text-xs font-bold w-1/3" placeholder="Driver Name" onChange={handleTextChange("driverNameLabel")} /></strong>
                        </div>
                        <div className="mb-1">
                            <strong><EditableText value={label.dlNoLabel } className="text-xs font-bold w-1/3" placeholder="D.L.No." onChange={handleTextChange("dlNoLabel")} /></strong>
                        </div>
                        <div>
                            <strong><EditableText value={label.driverMobileLabel } className="text-xs font-bold w-1/3" placeholder="Driver number" onChange={handleTextChange("driverMobileLabel")} /></strong>
                        </div>
                    </div>
                   
                    {/* Owner Column */}
                    <div>
                        <div className="mb-1">
                            <strong><EditableText value={label.ownerNameLabel } className="text-xs font-bold w-1/3" placeholder="Owner Name" onChange={handleTextChange("ownerNameLabel")} /></strong>
                        </div>
                        <div>
                            <strong><EditableText value={label.ownerMobileLabel } className="text-xs font-bold w-1/3" placeholder="Owner number" onChange={handleTextChange("ownerMobileLabel")} /></strong>
                        </div>
                    </div>

                    {/* Lorry Column */}
                    <div>
                        <div className="mb-1">
                            <strong><EditableText value={label.lorryNoLabel } className="text-xs font-bold w-1/3" placeholder="Lorry No." onChange={handleTextChange("lorryNoLabel")} /></strong>
                        </div>
                        <div>
                            <strong><EditableText value={label.lorryNameLabel } className="text-xs font-bold w-1/3" placeholder="Lorry Name" onChange={handleTextChange("lorryNameLabel")} /></strong>
                        </div>
                    </div>
                </div>

                {/* Legal / Signatures */}
                <div className="border-t border-black mt-2 pt-2">
                    <p className="text-[10px] leading-snug">
                        <EditableTextArea
                                value={label.legalNote }
                                className="text-[12px] w-full wordbreak" placeholder="Legal/Terms Note..." onChange={handleTextChange("legalNote")}
                            />
                    </p>
                    <div className="flex justify-around mt-6 text-xs">
                        <div className="w-1/3 text-center">
                            <EditableText value={label.signatureDriverLabel} className="text-xs w-full text-center" placeholder="Signature Label 1" onChange={handleTextChange("signatureDriverLabel")} />
                        </div>
                        <div className="w-1/3 text-center">
                            <EditableText value={label.signatureClerkLabel} className="text-xs w-full text-center" placeholder="Signature Label 2" onChange={handleTextChange("signatureClerkLabel")} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- Outer Wrapper Component (Exports and passes onEdit) ---
export const TripSheetPrintTemplate: React.FC<TripSheetTemplateProps> = (props) => {
    // Add print styles to the wrapper
    return (
        <div className="trip-sheet-screen-wrapper bg-gray-100 min-h-screen">
            <style>{`
                .report-page {
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    margin: 20px auto;
                    border: 1px solid #ccc;
                }
                @media print {
                    .trip-sheet-screen-wrapper {
                        display: block !important;
                        background: white;
                    }
                    .report-page {
                        box-shadow: none;
                        border: none;
                        margin: 0;
                        padding: 0;
                    }
                    @page { size: A4; margin: 0; }
                }
            `}</style>
            {/* Pass all props (including onEdit) to the core component */}
            <TripSheetCoreTemplate {...props} />
        </div>
    );
}

export default TripSheetPrintTemplate;