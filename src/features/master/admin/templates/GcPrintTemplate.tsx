import React, { useCallback, useEffect, useState } from "react";
import type { GcEntryLabels } from "../../../../types";

type Change = {
    field: keyof GcEntryLabels;
    oldValue: string;
};

// 🟢 UPDATE: Props now accept data and save callback
export type GcPrintTemplateProps = {
    initialData: GcEntryLabels;
    onSave: (data: GcEntryLabels) => void;
    onEdit: (hasChanges: boolean, saveHandler: () => void, resetHandler: () => void, undoHandler: () => void) => void;
};

// 🟢 REMOVED: useGcContext (Logic moved to DataContext and passed via props)

const EditableText: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    placeholder?: string;
}> = ({ value, onChange, className = "", placeholder = "" }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border border-dashed border-gray-400 p-0.5 w-full appearance-none focus:border-solid focus:bg-white bg-transparent ${className}`}
        style={{ minWidth: '30px' }}
    />
);

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
        className={`border border-dashed border-gray-400 p-0.5 w-full focus:border-solid focus:bg-white bg-transparent ${className}`}
        style={{ minHeight: `${rows * 1.2}rem`}}
    />
);

const GcCoreTemplate: React.FC<GcPrintTemplateProps> = ({ initialData, onSave, onEdit }) => {

    // 🟢 Use props.initialData instead of local context
    const [localLabels, setLocalLabels] = useState<GcEntryLabels>(initialData);
    const [historyStack, setHistoryStack] = useState<Change[]>([]);
    const hasChanges = historyStack.length > 0;

    type StaticChangeElement = HTMLInputElement | HTMLTextAreaElement;

    // 🟢 Update handler to call prop function
    const saveHandler = useCallback(() => {
        onSave(localLabels);
        setHistoryStack([]);
    }, [localLabels, onSave]);

    const resetHandler = useCallback(() => {
        setLocalLabels(initialData);
        setHistoryStack([]);
    }, [initialData]);

    const undoHandler = useCallback(() => {
        setHistoryStack(prevStack => {
            if (prevStack.length === 0) return prevStack;
            const lastChange = prevStack[prevStack.length - 1];
            setLocalLabels((prevLabels: GcEntryLabels) => ({
                ...prevLabels,
                [lastChange.field]: lastChange.oldValue || ''
            }));
            return prevStack.slice(0, -1);
        });
    }, []);

    // 🟢 Sync local state when incoming data changes (e.g. initial fetch)
    useEffect(() => {
        if (JSON.stringify(localLabels) !== JSON.stringify(initialData) && historyStack.length === 0) {
            setLocalLabels(initialData);
        }
    }, [initialData]);

    useEffect(() => {
        if (onEdit) {
            onEdit(hasChanges, saveHandler, resetHandler, undoHandler);
        }
    }, [hasChanges, onEdit, saveHandler, resetHandler, undoHandler]);
   
    const handleLabelChange = (field: keyof GcEntryLabels) => (
        e: React.ChangeEvent<StaticChangeElement>
    ) => {
        const newValue = e.target.value;
        const currentValue = localLabels[field];
        setLocalLabels((prevLabels: GcEntryLabels) => ({
            ...prevLabels,
            [field]: newValue
        }));
        if (newValue !== currentValue) {
            setHistoryStack(prevStack => {
                return [
                    ...prevStack,
                    { field: field, oldValue: currentValue || '' }
                ];
            });
        }
    };

    return (
        <div
            className="print-page font-sans text-black bg-white shadow-2xl mx-auto"
            style={{
                maxWidth: "210mm",
                padding: "3mm", 
                boxSizing: "border-box",
                width: "100%",
            }}
        >
            {/* --- 1. HEADER ROW (GSTIN & Mobile) --- */}
            <div className="flex flex-row mb-1 font-bold text-[10px] md:text-sm">
                <div className="flex flex-row gap-2 w-full justify-between items-center">
                    
                    {/* LEFT: GSTIN (Modified to prevent cutoff) */}
                    <div className="flex gap-1 items-center">
                        <EditableText
                            value={localLabels.fixedGstinLabel}
                            onChange={handleLabelChange("fixedGstinLabel")}
                            className="w-12 text-left font-bold"
                            placeholder="GSTIN"
                        />
                        <EditableText
                            value={localLabels.fixedGstinValue}
                            onChange={handleLabelChange("fixedGstinValue")}
                            className="w-24 font-bold" // Fixed width to ensure visibility
                            placeholder="GSTIN Value"
                        />
                    </div>

                    {/* RIGHT: Mobile */}
                    <div className="flex gap-1 items-center justify-end">
                        <EditableText
                            value={localLabels.mobileLabel}
                            onChange={handleLabelChange("mobileLabel")}
                            className="w-12 text-left font-bold"
                            placeholder="Mobile"
                        />
                        <EditableText
                            value={localLabels.mobileNumberValue}
                            onChange={handleLabelChange("mobileNumberValue")}
                            className="w-24 font-bold"
                            placeholder="Number"
                        />
                    </div>
                </div>
            </div>

            {/* --- 2. MAIN HEADER (GC No., Date, Company Info) --- */}
            <div className="flex flex-row justify-between items-start mb-1 text-[10px] md:text-sm">
                <div className="font-bold leading-tight w-1/3">
                    <div className="flex gap-1 border border-black p-1 mb-1 items-center">
                        <span className="flex-none w-12 md:w-20">
                            <EditableText
                                value={localLabels.gcNoLabel}
                                onChange={handleLabelChange("gcNoLabel")}
                                className="w-full text-left font-bold"
                                placeholder="G.C. No."
                            />
                        </span>
                        <span className="flex-1"></span>
                    </div>
                    <div className="flex gap-1 border border-black p-1 items-center">
                        <span className="flex-none w-12 md:w-20">
                            <EditableText
                                value={localLabels.dateLabel}
                                onChange={handleLabelChange("dateLabel")}
                                className="w-full text-left font-bold"
                                placeholder="Date"
                            />
                        </span>
                        <span className="flex-1"></span>
                    </div>
                </div>

                <div className="text-right flex-1 ml-2 border border-black p-2 w-2/3">
                    <h1 className="font-bold uppercase tracking-tight">
                        <EditableText
                            value={localLabels.companyName}
                            onChange={handleLabelChange("companyName")}
                            className="text-base md:text-3xl font-bold text-right uppercase mb-1 md:mb-2"
                            placeholder="Company Name"
                        />
                    </h1>
                    <div className="font-bold uppercase">
                        <EditableText
                            value={localLabels.tagLine}
                            onChange={handleLabelChange("tagLine")}
                            className="text-[8px] md:text-sm font-bold text-right uppercase mb-1"
                            placeholder="Tag Line"
                        />
                    </div>
                    <div className="font-bold mt-0.5">
                        <EditableText
                            value={localLabels.companyAddress}
                            onChange={handleLabelChange("companyAddress")}
                            className="text-[8px] md:text-xs font-bold text-right"
                            placeholder="Company Address"
                        />
                    </div>
                </div>
            </div>

            {/* --- 3. ROUTE BOX --- */}
            <div className="border border-black flex flex-row font-bold text-[10px] md:text-lg uppercase mb-2">
                <div className="flex-none px-1 md:px-2 py-1 border-r border-black w-1/3 flex items-center">
                    <EditableText
                        value={localLabels.fromLabel}
                        onChange={handleLabelChange("fromLabel")}
                        className="w-full font-bold text-left"
                        placeholder="FROM"
                    />
                </div>
                <div className="flex-1 text-center px-1 md:px-2 py-1 border-r border-black w-1/3 flex items-center justify-center">
                    <EditableText
                        value={localLabels.ownerRiskText}
                        onChange={handleLabelChange("ownerRiskText")}
                        className="w-full text-center font-bold"
                        placeholder="AT OWNER'S RISK"
                    />
                </div>
                <div className="flex-none px-1 md:px-2 py-1 w-1/3 text-right flex items-center justify-end">
                    <EditableText
                        value={localLabels.toLabel}
                        onChange={handleLabelChange("toLabel")}
                        className="w-full font-bold text-left"
                        placeholder="TO"
                    />
                </div>
            </div>

            {/* --- 4. CONSIGNOR / CONSIGNEE --- */}
            <div className="flex flex-row mb-2 gap-0 text-[10px] md:text-sm">
                <div className="w-1/2 border border-r-0 border-black p-1 min-h-[4rem] flex flex-col justify-between">
                    <div className="mb-1">
                        <EditableText
                            value={localLabels.consignorLabel}
                            onChange={handleLabelChange("consignorLabel")}
                            className="w-24 text-left font-normal"
                            placeholder="Consignor :"
                        />
                    </div>
                    <div className="font-bold flex items-center">
                        <EditableText
                            value={localLabels.fixedGstinLabel}
                            onChange={handleLabelChange("fixedGstinLabel")}
                            className="w-12 text-left font-bold"
                            placeholder="GSTIN"
                        />
                    </div>
                </div>

                <div className="w-1/2 border border-black p-1 min-h-[4rem] flex flex-col justify-between">
                    <div className="mb-1">
                        <EditableText
                            value={localLabels.consigneeLabel}
                            onChange={handleLabelChange("consigneeLabel")}
                            className="w-24 text-left font-normal"
                            placeholder="Consignee :"
                        />
                    </div>
                    <div className="font-bold flex items-center">
                        {/* Placeholder for Consignee Proof Label if needed */}
                    </div>
                </div>
            </div>

            {/* --- 5. MAIN TABLE --- */}
            <div className="border border-black mb-0 overflow-hidden">
                <table className="w-full border-collapse text-[9px] md:text-sm">
                    <thead>
                        <tr className="text-center font-normal border-b border-black">
                            <th className="border-r border-black w-[10%] py-1 leading-tight px-0.5">
                                <EditableTextArea
                                    value={localLabels.tableHeaderPackages}
                                    onChange={handleLabelChange("tableHeaderPackages")}
                                    rows={2}
                                    className="text-center font-normal h-full"
                                />
                            </th>
                            <th className="border-r border-black w-[45%] py-1 leading-tight px-0.5">
                                <EditableTextArea
                                    value={localLabels.tableHeaderDescription}
                                    onChange={handleLabelChange("tableHeaderDescription")}
                                    rows={2}
                                    className="text-center font-normal h-full"
                                />
                            </th>
                            <th className="border-r border-black w-[10%] py-1 leading-tight px-0.5">
                                <EditableTextArea
                                    value={localLabels.tableHeaderWeight}
                                    onChange={handleLabelChange("tableHeaderWeight")}
                                    rows={2}
                                    className="text-center font-normal h-full"
                                />
                            </th>
                            <th className="border-r border-black w-[10%] py-1 leading-tight px-0.5">
                                <EditableText
                                    value={localLabels.tableHeaderRate}
                                    onChange={handleLabelChange("tableHeaderRate")}
                                    className="text-center font-normal"
                                    placeholder="RATE"
                                />
                            </th>
                            <th className="w-[25%] py-1 font-normal px-0.5">
                                <EditableText
                                    value={localLabels.tableHeaderFreight}
                                    onChange={handleLabelChange("tableHeaderFreight")}
                                    className="text-center font-normal"
                                    placeholder="FREIGHT"
                                />
                            </th>
                        </tr>
                    </thead>

                    <tbody className="font-bold">
                        <tr className="align-top h-32 md:h-48">
                            <td className="border-r border-black text-center pt-2"></td>
                            <td className="border-r border-black pl-1 pt-2 uppercase"></td>
                            <td className="border-r border-black text-center pt-2"></td>
                            <td className="border-r border-black text-center pt-2"></td>

                            {/* FREIGHT PANEL */}
                            <td rowSpan={2} className="relative align-top p-0">
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 px-1 pt-2 text-right leading-loose">
                                        <div className="flex justify-between items-center">
                                            <span className="font-normal w-3/4 text-left">
                                                <EditableText value={localLabels.labelFreight} onChange={handleLabelChange("labelFreight")} className="text-left font-normal" />
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-normal w-3/4 text-left">
                                                <EditableText value={localLabels.labelGodownCharge} onChange={handleLabelChange("labelGodownCharge")} className="text-left font-normal" />
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-normal w-3/4 text-left">
                                                <EditableText value={localLabels.labelStatisticalCharge} onChange={handleLabelChange("labelStatisticalCharge")} className="text-left font-normal" />
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-normal w-3/4 text-left">
                                                <EditableText value={localLabels.labelTollFee} onChange={handleLabelChange("labelTollFee")} className="text-left font-normal" />
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-black mt-1 pt-1 font-bold items-center">
                                            <span className="font-normal w-3/4 text-left">
                                                <EditableText value={localLabels.labelTotal} onChange={handleLabelChange("labelTotal")} className="text-left font-normal" />
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto text-right px-1 pb-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-normal w-2/3 text-left">
                                                <EditableText value={localLabels.labelAdvancePaid} onChange={handleLabelChange("labelAdvancePaid")} className="text-left font-normal" />
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-normal w-2/3 text-left">
                                                <EditableText value={localLabels.labelBalanceToPay} onChange={handleLabelChange("labelBalanceToPay")} className="text-left font-normal" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        {/* Row 2: Invoice & Value */}
                        <tr className="border-t border-black h-12 md:h-16">
                            <td colSpan={2} className="border-r border-black align-top p-1">
                                <div className="flex justify-between mb-1">
                                    <span className="flex items-center w-1/2">
                                        <EditableText value={localLabels.invoiceNoLabel} onChange={handleLabelChange("invoiceNoLabel")} className="w-full text-left font-bold" />
                                    </span>
                                    <span className="flex items-center w-1/2">
                                        <EditableText value={localLabels.invoiceDateLabel} onChange={handleLabelChange("invoiceDateLabel")} className="w-full text-left font-bold" />
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <EditableText value={localLabels.marksLabel} onChange={handleLabelChange("marksLabel")} className="w-full text-left font-bold" />
                                </div>
                            </td>

                            <td colSpan={2} className="border-r border-black align-top p-1">
                                <div className="font-normal mb-1">
                                    <EditableText value={localLabels.labelValueGoods} onChange={handleLabelChange("labelValueGoods")} className="font-normal" />
                                </div>
                                {/* <div className="font-bold flex items-center">Rs.</div> */}
                            </td>
                        </tr>

                        {/* Row 3: To Pay Words */}
                        <tr className="border-t border-black">
                            <td colSpan={2} className="border-r border-black p-1 h-8 align-top">
                                <span className="font-normal mr-1 inline-block">
                                    <EditableText value={localLabels.deliveryAtLabel} onChange={handleLabelChange("deliveryAtLabel")} className="w-20 font-normal" />
                                </span>
                            </td>

                            <td colSpan={3} className="p-1 align-top">
                                <div className="flex items-baseline gap-1">
                                    <span className="font-normal whitespace-nowrap">
                                        <EditableText value={localLabels.toPayRsLabel} onChange={handleLabelChange("toPayRsLabel")} className="w-16 font-normal text-left" />
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* --- 6. FOOTER AREA (FIXED ALIGNMENT) --- */}
            {/* Added proper height constraints and vertical alignment spacing */}
            <div className="border-x border-b border-black p-1 flex flex-row h-[6rem] relative text-[9px] md:text-xs">
                
                {/* LEFT COLUMN: QR & Freight */}
                <div className="w-1/3 flex justify-between items-start h-full pl-1 pb-1">
                     {/* QR Placeholder - Fixed Size */}
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border border-black flex items-center justify-center text-[7px] mb-1">QR</div>
                        <EditableText
                                value={localLabels.scanLabel}
                                onChange={handleLabelChange("scanLabel")}
                                className="w-20 font-normal text-[7px] text-center"
                                placeholder="Scan Label"
                        />
                    </div>
                    {/* Freight Fixed Label */}
                    <div className="w-full mt-1">
                         <EditableText 
                            value={localLabels.freightFixedUptoLabel} 
                            onChange={handleLabelChange("freightFixedUptoLabel")} 
                            className="w-full font-normal text-center text-[8px]" 
                            placeholder="Freight fixed upto..."
                        />
                    </div>
                </div>

                {/* CENTER COLUMN: Unloading Note */}
                <div className="w-1/3 flex flex-col justify-end items-center h-full pb-2 px-1">
                    <EditableTextArea
                        value={localLabels.footerUnloadingNote}
                        onChange={handleLabelChange("footerUnloadingNote")}
                        rows={2}
                        className="text-center font-normal w-full text-[8px] leading-tight"
                        placeholder="Unloading Note"
                    />
                </div>

                {/* RIGHT COLUMN: Signature */}
                <div className="w-1/3 flex flex-col justify-end items-end h-full pr-1 pb-1">
                    <div className="w-full text-right">
                        <div className="h-8"></div> {/* Spacer for signature area */}
                        <EditableText 
                            value={localLabels.footerSignatureLine} 
                            onChange={handleLabelChange("footerSignatureLine")} 
                            className="italic font-bold w-full text-right text-[8px]" 
                            placeholder="Authorized Signatory" 
                        />
                    </div>
                </div>
            </div>

            <div className="text-center text-[8px] mt-1">
                <EditableText
                    value={localLabels.footerNote}
                    onChange={handleLabelChange("footerNote")}
                    className="text-center w-full"
                    placeholder="Footer Note"
                />
            </div>

        </div>
    );
};

// --- Outer Wrapper Component (Exports and passes onEdit) ---
export const GcPrintTemplate: React.FC<GcPrintTemplateProps> = (props) => {
    return (
        <div className="gc-print-screen-wrapper bg-gray-100 min-h-screen dark:bg-black">
             <style>{`
                .print-page {
                    // MODIFIED: Removed fixed width for screen viewing
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    margin: 10px auto;
                    border: 1px solid #ccc;
                    // Ensure editable text fields don't cause overflow
                    word-break: break-word; 
                }
                
                // PRINT STYLES (Only apply when printing)
                @media print {
                    .gc-print-screen-wrapper {
                        display: block !important;
                        background: white;
                    }
                    .print-page {
                        box-shadow: none;
                        border: none;
                        margin: 0;
                        padding: 0;
                        width: 210mm !important; // Enforce A4 width for print
                        min-height: 297mm !important; // Enforce A4 height for print
                        max-width: none !important;
                    }
                    @page { size: A4; margin: 0; }
                }
            `}</style>
            {/* Pass all props (including onEdit) to the core component */}
            <GcCoreTemplate {...props} />
        </div>
    );
}

export default GcPrintTemplate;