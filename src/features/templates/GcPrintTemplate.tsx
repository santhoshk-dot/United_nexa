import React, { useCallback, useEffect, useState } from "react";
import type { GcEntryLabels } from "../../types";

// --- TYPE DEFINITIONS ---
type Change = {
    field: keyof GcEntryLabels;
    oldValue: string;
};

export type GcPrintTemplateProps = Partial<{
    onEdit: (hasChanges: boolean, saveHandler: () => void, resetHandler: () => void, undoHandler: () => void) => void;
}>;

// --- MOCK CONTEXT HOOK (Fix for missing export) ---
// This serves as a fallback since useGcContext is not exported from DataContext
const useGcContext = () => {
    // Default initial labels based on GcEntryLabels type
    const defaultLabels: GcEntryLabels = {
        fixedGstinLabel: "GSTIN",
        fixedGstinValue: "33ABLPV5082H3Z8",
        mobileLabel: "Mobile",
        mobileNumberValue: "9787718433",
        gcNoLabel: "G.C. No.",
        dateLabel: "Date",
        companyName: "UNITED TRANSPORT COMPANY",
        tagLine: "TRANSPORT CONTRACTORS & GOODS, FORWARDERS",
        companyAddress: "164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123",
        fromLabel: "FROM",
        toLabel: "TO",
        ownerRiskText: "AT OWNER'S RISK",
        consignorLabel: "Consignor :",
        consigneeLabel: "Consignee :",
        tableHeaderPackages: "No. of Packages",
        tableHeaderDescription: "DESCRIPTION (said to Contain - Contents not known)",
        tableHeaderWeight: "WEIGHT (APPROX)",
        tableHeaderRate: "RATE",
        tableHeaderFreight: "FREIGHT",
        labelFreight: "Freight",
        labelGodownCharge: "Godown Charge",
        labelStatisticalCharge: "Statistical Charge",
        labelTollFee: "Toll Fee",
        labelTotal: "Total",
        labelAdvancePaid: "Advance Paid",
        labelBalanceToPay: "Balance To Pay",
        invoiceNoLabel: "INVOICE No.",
        invoiceDateLabel: "Dated",
        marksLabel: "Identification Marks",
        labelValueGoods: "Value of the goods",
        deliveryAtLabel: "Delivery at",
        toPayRsLabel: "To pay Rs.",
        scanLabel: "Scan for Terms",
        freightFixedUptoLabel: "Freight fixed upto",
        footerSignatureLine: "For UNITED TRANSPORT COMPANY",
        footerNote: "Consignment booked subject to the terms & conditions printed overleaf.",
        footerUnloadingNote: "Unloading charges payable by party"
    };

    const [staticLabels, setStaticLabels] = useState<GcEntryLabels>(defaultLabels);

    const updateStaticLabels = (newLabels: GcEntryLabels) => {
        setStaticLabels(newLabels);
        console.log("Labels updated (Local Mock):", newLabels);
    };

    return { staticLabels, updateStaticLabels };
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
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border border-dashed border-gray-400 p-0.5 w-full appearance-none focus:border-solid focus:bg-white ${className}`}
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
const GcCoreTemplate: React.FC<GcPrintTemplateProps> = ({ onEdit }) => {

    const { staticLabels: originalLabels, updateStaticLabels } = useGcContext();
   
    // Local state for editing and history stack for undo
    const [localLabels, setLocalLabels] = useState<GcEntryLabels>(originalLabels);
    const [historyStack, setHistoryStack] = useState<Change[]>([]);
    const hasChanges = historyStack.length > 0;

    type StaticChangeElement = HTMLInputElement | HTMLTextAreaElement;

    // --- Action Handlers ---

    const saveHandler = useCallback(() => {
        updateStaticLabels(localLabels);
        setHistoryStack([]);
    }, [localLabels, updateStaticLabels]);

    const resetHandler = useCallback(() => {
        setLocalLabels(originalLabels);
        setHistoryStack([]);
    }, [originalLabels]);

    const undoHandler = useCallback(() => {
        setHistoryStack(prevStack => {
            if (prevStack.length === 0) return prevStack;

            const lastChange = prevStack[prevStack.length - 1];
           
            // Revert the specific field to its old value
            // 🟢 FIX: Explicitly type prevLabels to GcEntryLabels
            setLocalLabels((prevLabels: GcEntryLabels) => ({
                ...prevLabels,
                [lastChange.field]: lastChange.oldValue || ''
            }));

            // Remove the change from the stack
            return prevStack.slice(0, -1);
        });
    }, []);

    // --- Effects ---

    // 1. Sync local state when originalLabels change from context (e.g., initial load, external save)
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
    const handleLabelChange = (field: keyof GcEntryLabels) => (
        e: React.ChangeEvent<StaticChangeElement>
    ) => {
        const newValue = e.target.value;
        const currentValue = localLabels[field];

        // 1. Update local state immediately
        // 🟢 FIX: Explicitly type prevLabels to GcEntryLabels
        setLocalLabels((prevLabels: GcEntryLabels) => ({
            ...prevLabels,
            [field]: newValue
        }));

        // 2. Record change for history/undo only if the value actually changes
        if (newValue !== currentValue) {
            setHistoryStack(prevStack => {
                return [
                    ...prevStack,
                    { field: field, oldValue: currentValue || '' }
                ];
            });
        }
    };

    // --- Render Markup (using localLabels) ---
    return (
        <div
            className="print-page font-sans text-black bg-white shadow-2xl mx-auto"
            style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "5mm",
                boxSizing: "border-box",
            }}
        >
            {/* --- 1. HEADER ROW (GSTIN & Mobile) --- */}
            <div className="flex mb-2 font-bold text-sm">
               
                <div className="flex gap-4">
                    <div className="flex justify-between gap-4 w-full">
                        <EditableText
                            value={localLabels.fixedGstinLabel}
                            onChange={handleLabelChange("fixedGstinLabel")}
                            className="w-1/2 text-right font-bold"
                            placeholder="GSTIN Label"
                        />
                        <EditableText
                            value={localLabels.fixedGstinValue}
                            onChange={handleLabelChange("fixedGstinValue")}
                            className="w-1/2 ml-1"
                            placeholder="GSTIN Value"
                        />
                    </div>
                    <div className="flex justify-between gap-4 w-full">
                        <EditableText
                            value={localLabels.mobileLabel}
                            onChange={handleLabelChange("mobileLabel")}
                            className="w-1/2 text-right font-bold"
                            placeholder="Mobile Label"
                        />
                        <EditableText
                            value={localLabels.mobileNumberValue}
                            onChange={handleLabelChange("mobileNumberValue")}
                            className="w-1/2"
                            placeholder="Mobile No."
                        />
                    </div>
                </div>
            </div>

            {/* --- 2. MAIN HEADER (GC No., Date, Company Info) --- */}
            <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-sm leading-relaxed w-1/4">
                    <div className="flex gap-2 border border-black p-1 mb-1"> {/* Added border */}
                        <span className="w-20">
                            <EditableText
                                value={localLabels.gcNoLabel}
                                onChange={handleLabelChange("gcNoLabel")}
                                className="w-full text-left font-bold"
                                placeholder="GC No. Label"
                            />
                        </span>
                        <span>
                        </span>
                    </div>
                    <div className="flex gap-2 border border-black p-1"> {/* Added border */}
                        <span className="w-20">
                            <EditableText
                                value={localLabels.dateLabel}
                                onChange={handleLabelChange("dateLabel")}
                                className="w-full text-left font-bold"
                                placeholder="Date Label"
                            />
                        </span>
                        <span>
                        </span>
                    </div>
                </div>

                <div className="text-right flex-1 ml-4 border border-black p-2"> {/* Added border and padding */}
                    <h1 className="text-3xl font-bold uppercase tracking-tight">
                        <EditableText
                            value={localLabels.companyName}
                            onChange={handleLabelChange("companyName")}
                            className="text-3xl font-bold text-right uppercase mb-2"
                            placeholder="Company Name"
                        />
                    </h1>
                    <div className="font-bold text-sm uppercase">
                        <EditableText
                            value={localLabels.tagLine}
                            onChange={handleLabelChange("tagLine")}
                            className="text-sm font-bold text-right uppercase  mb-2"
                            placeholder="Tag Line"
                        />
                    </div>
                    <div className="font-bold text-xs mt-0.5">
                        <EditableText
                            value={localLabels.companyAddress}
                            onChange={handleLabelChange("companyAddress")}
                            className="text-xs font-bold text-right  mb-2"
                            placeholder="Company Address"
                        />
                    </div>
                </div>
            </div>

            {/* --- 3. ROUTE BOX --- */}
            <div className="border border-black flex font-bold text-lg uppercase mb-2">
                <div className="flex-none px-2 py-1 border-r border-black w-1/3 flex items-center">
                    <EditableText
                        value={localLabels.fromLabel}
                        onChange={handleLabelChange("fromLabel")}
                        className="w-16  font-bold text-lg text-left"
                        placeholder="FROM"
                    />
                </div>
                <div className="flex-1 text-center px-2 py-1 border-r border-black">
                    <EditableText
                        value={localLabels.ownerRiskText}
                        onChange={handleLabelChange("ownerRiskText")}
                        className="w-full text-center  font-bold"
                        placeholder="AT OWNER'S RISK"
                    />
                </div>
                <div className="flex-none px-2 py-1 w-1/3 text-right flex items-center justify-start">
                    <EditableText
                        value={localLabels.toLabel}
                        onChange={handleLabelChange("toLabel")}
                        className="w-1/4  font-bold text-lg text-center"
                        placeholder="TO"
                    />
                </div>
            </div>

            {/* --- 4. CONSIGNOR / CONSIGNEE --- */}
            <div className="flex mb-2">
                <div className="w-1/2 pr-2 border border-black p-1 h-32 flex flex-col justify-between">
                    <div className="text-xs mb-1 pl-1">
                            <EditableText
                                value={localLabels.consignorLabel}
                                onChange={handleLabelChange("consignorLabel")}
                                className="w-20 text-left  font-normal"
                                placeholder="Consignor Label"
                            />
                        </div>
                    <div className="pl-1 text-sm font-bold flex items-center">
                        <EditableText
                            value={localLabels.fixedGstinLabel}
                            onChange={handleLabelChange("fixedGstinLabel")}
                            className="w-16 text-left  font-bold"
                            placeholder="GSTIN Label"
                        />
                    </div>
                </div>

                <div className="w-1/2 pl-2 border border-black p-1 h-32">
                    <div className="text-xs mb-1 pl-1">
                            <EditableText
                                value={localLabels.consigneeLabel}
                                onChange={handleLabelChange("consigneeLabel")}
                                className="w-20 text-left  font-normal"
                                placeholder="Consignee Label"
                            />
                        </div>
                    <div className="pl-4 font-bold text-sm uppercase">
                    </div>
                    <div className="pl-4 font-bold text-sm uppercase mb-1 mt-1">
                    </div>
                    <div className="pl-1 text-sm font-bold flex items-center">
                    </div>
                </div>
            </div>

            {/* --- 5. MAIN TABLE (with enhanced borders) --- */}
            <div className="border border-black mb-0">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="text-center text-xs font-normal border-b border-black">
                            <th className="border-r border-black w-[10%] py-1 font-normal leading-tight">
                                <EditableTextArea
                                    value={localLabels.tableHeaderPackages}
                                    onChange={handleLabelChange("tableHeaderPackages")}
                                    rows={2}
                                    className="text-center "
                                />
                            </th>
                            <th className="border-r border-black w-[45%] py-1 font-normal leading-tight">
                                <EditableTextArea
                                    value={localLabels.tableHeaderDescription}
                                    onChange={handleLabelChange("tableHeaderDescription")}
                                    rows={2}
                                    className="text-center "
                                />
                            </th>
                            <th className="border-r border-black w-[10%] py-1 font-normal leading-tight">
                                <EditableTextArea
                                    value={localLabels.tableHeaderWeight}
                                    onChange={handleLabelChange("tableHeaderWeight")}
                                    rows={2}
                                    className="text-center "
                                />
                            </th>
                            <th className="border-r border-black w-[10%] py-1 font-normal leading-tight">
                                <EditableText
                                    value={localLabels.tableHeaderRate}
                                    onChange={handleLabelChange("tableHeaderRate")}
                                    className="text-center "
                                    placeholder="RATE"
                                />
                            </th>
                            <th className="w-[25%] py-1 font-normal">
                                <EditableText
                                    value={localLabels.tableHeaderFreight}
                                    onChange={handleLabelChange("tableHeaderFreight")}
                                    className="text-center "
                                    placeholder="FREIGHT"
                                />
                            </th>
                        </tr>
                    </thead>

                    <tbody className="text-sm font-bold">
                        <tr className="align-top h-32">
                            <td className="border-r border-black text-center pt-2">
                            </td>
                            <td className="border-r border-black pl-2 pt-2 uppercase">
                            </td>
                            <td className="border-r border-black text-center pt-2">
                            </td>
                            <td className="border-r border-black text-center pt-2">
                            </td>

                            {/* FREIGHT PANEL (Spans 2 rows) */}
                            <td rowSpan={2} className="relative align-top p-0">
                                <div className="flex flex-col h-full">
                                    {/* Charges Section */}
                                    <div className="flex-1 px-2 pt-2 text-right text-xs leading-loose">
                                        <div className="flex justify-between items-center">
                                            <span className="font-normal w-3/4 text-left">
                                                <EditableText
                                                    value={localLabels.labelFreight}
                                                    onChange={handleLabelChange("labelFreight")}
                                                    className="text-left font-normal "
                                                    placeholder="Freight Label"
                                                />
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-normal w-3/4 text-left">
                                                <EditableText
                                                    value={localLabels.labelGodownCharge}
                                                    onChange={handleLabelChange("labelGodownCharge")}
                                                    className="text-left font-normal "
                                                    placeholder="Godown Charge Label"
                                                />
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-normal w-3/4 text-left">
                                                <EditableText
                                                    value={localLabels.labelStatisticalCharge}
                                                    onChange={handleLabelChange("labelStatisticalCharge")}
                                                    className="text-left font-normal "
                                                    placeholder="Statistical Charge Label"
                                                />
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-normal w-3/4 text-left">
                                                <EditableText
                                                    value={localLabels.labelTollFee}
                                                    onChange={handleLabelChange("labelTollFee")}
                                                    className="text-left font-normal "
                                                    placeholder="Toll Fee Label"
                                                />
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-black mt-1 pt-1 font-bold items-center">
                                            <span className="font-normal w-3/4 text-left">
                                                <EditableText
                                                    value={localLabels.labelTotal}
                                                    onChange={handleLabelChange("labelTotal")}
                                                    className="text-left font-normal "
                                                    placeholder="Total Label"
                                                />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Balance Section */}
                                    <div className="mt-auto text-right text-xs px-2 pb-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-normal">
                                                <EditableText
                                                    value={localLabels.labelAdvancePaid}
                                                    onChange={handleLabelChange("labelAdvancePaid")}
                                                    className="text-left font-normal "
                                                    placeholder="Advance Paid Label"
                                                />
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-normal">
                                                <EditableText
                                                    value={localLabels.labelBalanceToPay}
                                                    onChange={handleLabelChange("labelBalanceToPay")}
                                                    className="text-left font-normal "
                                                    placeholder="Balance To Pay Label"
                                                />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        {/* Row 2: Invoice & Value Info */}
                        <tr className="border-t border-black h-16">
                            <td colSpan={2} className="border-r border-black align-top p-1">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="flex items-center">
                                        <EditableText
                                            value={localLabels.invoiceNoLabel}
                                            onChange={handleLabelChange("invoiceNoLabel")}
                                            className="w-20 text-left  font-bold"
                                            placeholder="Invoice No. Label"
                                        />
                                    </span>
                                    <span className="flex items-center">
                                        <EditableText
                                            value={localLabels.invoiceDateLabel}
                                            onChange={handleLabelChange("invoiceDateLabel")}
                                            className="w-16 text-right  font-bold"
                                            placeholder="Dated Label"
                                        />
                                    </span>
                                </div>
                                <div className="text-xs font-bold flex items-center">
                                    <EditableText
                                        value={localLabels.marksLabel}
                                        onChange={handleLabelChange("marksLabel")}
                                        className="w-48 text-left  font-bold"
                                        placeholder="Marks Label"
                                    />
                                </div>
                            </td>

                            <td colSpan={2} className="border-r border-black align-top p-1">
                                <div className="text-xs font-normal mb-1">
                                    <EditableText
                                        value={localLabels.labelValueGoods}
                                        onChange={handleLabelChange("labelValueGoods")}
                                        className="text-xs font-normal "
                                        placeholder="Value of the goods"
                                    />
                                </div>
                                <div className="text-sm font-bold flex items-center">
                                    Rs.
                                </div>
                            </td>
                        </tr>

                        {/* Row 3: To Pay Words */}
                        <tr className="border-t border-black">
                            <td colSpan={2} className="border-r border-black p-1 h-10 align-top">
                                <span className="font-normal text-xs mr-2">
                                    <EditableText
                                        value={localLabels.deliveryAtLabel}
                                        onChange={handleLabelChange("deliveryAtLabel")}
                                        className="w-20  font-normal"
                                        placeholder="Delivery At Label"
                                    />
                                </span>
                            </td>

                            <td colSpan={3} className="p-1 align-top">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xs font-normal whitespace-nowrap">
                                        <EditableText
                                            value={localLabels.toPayRsLabel}
                                            onChange={handleLabelChange("toPayRsLabel")}
                                            className="w-16  font-normal text-xs text-left"
                                            placeholder="To pay Rs. Label"
                                        />
                                    </span>
                                </div>
                            </td>
                        </tr>

                    </tbody>
                </table>
            </div>

            {/* --- 6. FOOTER AREA --- */}
            <div className="border-x border-b  border-black p-3 flex justify-between items-end min-h-[6rem] relative">

                <div className="flex items-end gap-3 w-1/3">
                    <div className="flex flex-col items-center flex-shrink-0">
                        <input
                            placeholder="QR Code"
                            className="w-20 h-20 border border-black text-center" disabled // Added border
                        />
                        <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wide">
                        <EditableText
                                value={localLabels.scanLabel}
                                onChange={handleLabelChange("scanLabel")}
                                className="w-32  font-normal text-[10px] text-left"
                                placeholder="Scan Label"
                            />
                        </span>
                    </div>

                    <div className="text-xs font-bold mb-3 leading-tight w-full">
                        <span className="font-normal block text-[10px] text-gray-600 mb-0.5">
                                <EditableText
                                    value={localLabels.freightFixedUptoLabel}
                                    onChange={handleLabelChange("freightFixedUptoLabel")}
                                    className="w-32  font-normal text-[10px] text-left"
                                    placeholder="Freight Fixed Upto Label"
                                />
                            </span>
                    </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 bottom-4 text-center text-xs leading-tight w-1/4 p-1"> {/* Added border */}
                    <EditableTextArea
                        value={localLabels.footerUnloadingNote}
                        onChange={handleLabelChange("footerUnloadingNote")}
                        rows={2}
                        className="text-center text-xs  font-normal h-10"
                        placeholder="Unloading Note"
                    />
                </div>

                <div className="text-xs mb-1 flex flex-col items-center mr-2 w-1/3 text-right">
                    <span className="italic font-bold text-[10px] flex items-center gap-1">
                            <EditableText
                            value={localLabels.footerSignatureLine}
                            onChange={handleLabelChange("footerSignatureLine")}
                            className="italic font-bold w-60 text-center "
                            placeholder="Company Name"
                        />
                    </span>
                </div>
            </div>

            <div className="text-center text-[10px] mt-1">
                <EditableText
                    value={localLabels.footerNote}
                    onChange={handleLabelChange("footerNote")}
                    className="text-center text-[10px] "
                    placeholder="Footer Note"
                />
            </div>

        </div>
    );
};

// --- Outer Wrapper Component (Exports and passes onEdit) ---
export const GcPrintTemplate: React.FC<GcPrintTemplateProps> = (props) => {
    return (
        <div className="gc-print-screen-wrapper bg-gray-100 min-h-screen">
             <style>{`
                .print-page {
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    margin: 20px auto;
                    border: 1px solid #ccc;
                }
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