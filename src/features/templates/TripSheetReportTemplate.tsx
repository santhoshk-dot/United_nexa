import React, { useCallback, useEffect, useState } from "react";
import type { TripReportLabels } from "../../types";

// --- TYPE DEFINITIONS ---
// History stack type
type Change = {
    field: keyof TripReportLabels;
    oldValue: string;
};

// Props for the TripReportTemplate
type TripReportTemplateProps = Partial<{
    onEdit: (hasChanges: boolean, saveHandler: () => void, resetHandler: () => void, undoHandler: () => void) => void;
}>;

// --- MOCK CONTEXT HOOK (Fix for missing context properties) ---
const useTripReportContext = () => {
    // Default initial labels based on TripReportLabels type and fallback values used in JSX
    const defaultLabels: TripReportLabels = {
        title: 'TRIP SHEET REPORT',
        companyName: 'UNITED TRANSPORT COMPANY',
        companyAddress: '164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123',
        fixedGstinLabel: 'GSTIN:',
        fixedGstinValue: '33ABLPV5082H3Z8',
        mobileLabel: 'Mobile :',
        mobileNumberValue: '9787718433',
        mainHeader: 'Overall TripSheet Report',
        tsLabel: 'TS No',
        dateLabel: 'Date',
        fromPlaceLabel: 'From',
        toPlaceLabel: 'To',
        amountLabel: 'Amount',
        totalLabel: 'Total :'
    };

    const [tripLabels, setTripLabels] = useState<TripReportLabels>(defaultLabels);

    const updateTripLabels = (newLabels: TripReportLabels) => {
        setTripLabels(newLabels);
        console.log("Trip Report Labels updated (Local Mock):", newLabels);
    };

    return { tripLabels, updateTripLabels };
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
        className={`border border-dashed border-gray-400 p-0.5 w-full appearance-none focus:border-solid focus:bg-white ${className}`}
        style={{ minWidth: '30px' }}
    />
);

// --- Trip Report Template Component (Logic Implemented) ---
export const TripReportTemplate: React.FC<TripReportTemplateProps> = (props) => {
    // 🟢 FIX: Use local hook instead of missing DataContext properties
    const { tripLabels: originalLabels, updateTripLabels } = useTripReportContext();
    const { onEdit } = props;

    // 1. Local State for editing and history
    const [localLabels, setLocalLabels] = useState<TripReportLabels>(originalLabels);
    const [historyStack, setHistoryStack] = useState<Change[]>([]);
    const hasChanges = historyStack.length > 0;

    // --- Action Handlers ---

    // 2. Save Handler: Commits local changes to the context and clears history
    const saveHandler = useCallback(() => {
        updateTripLabels(localLabels);
        setHistoryStack([]);
    }, [localLabels, updateTripLabels]);

    // 2. Reset Handler: Reverts local changes to the original context state and clears history
    const resetHandler = useCallback(() => {
        setLocalLabels(originalLabels);
        setHistoryStack([]);
    }, [originalLabels]);

    // 2. Undo Handler: Pops last change from stack and applies the oldValue
    const undoHandler = useCallback(() => {
        setHistoryStack(prevStack => {
            if (prevStack.length === 0) return prevStack;

            const lastChange = prevStack[prevStack.length - 1];
           
            // 🟢 FIX: Explicitly type prevLabels
            setLocalLabels((prevLabels: TripReportLabels) => ({
                ...prevLabels,
                [lastChange.field]: lastChange.oldValue
            }));

            return prevStack.slice(0, -1);
        });
    }, []);

    // --- Effects ---

    // Sync local state when originalLabels change (e.g., loaded from API)
    useEffect(() => {
        // Only sync if the labels from the context are different from the current local labels
        if (JSON.stringify(localLabels) !== JSON.stringify(originalLabels)) {
            setLocalLabels(originalLabels);
            setHistoryStack([]);
        }
    }, [originalLabels]);

    // 3. Report current status and handlers to the parent component
    useEffect(() => {
        if (onEdit) {
            onEdit(hasChanges, saveHandler, resetHandler, undoHandler);
        }
    }, [hasChanges, onEdit, saveHandler, resetHandler, undoHandler]);
   
    // 4. Handle change and record history
    const handleTextChange = (field: keyof TripReportLabels) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const newValue = e.target.value;
        const currentValue = localLabels[field];

        // 🟢 FIX: Explicitly type prevLabels
        setLocalLabels((prevLabels: TripReportLabels) => ({
            ...prevLabels,
            [field]: newValue
        }));

        // Only add to history if the value actually changed
        if (newValue !== currentValue) {
            setHistoryStack(prevStack => {
                return [
                    ...prevStack,
                    // Record the value *before* the current change
                    { field: field, oldValue: currentValue || '' }
                ];
            });
        }
    };

    // --- Rendering ---
   
    return (
        <div
            className="report-page bg-white text-black shadow-2xl mx-auto border border-gray-300"
            style={{
                width: "210mm",
                minHeight: "230mm",
                padding: "10mm 10mm",
                boxSizing: "border-box",
                fontFamily: '"Times New Roman", Times, serif'
            }}
        >
    {/* header */}
    <div className="w-full font-serif mb-0 text-black" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            {/* Top Title */}
            <div className="text-center font-bold text-lg mb-1 uppercase">
                 <EditableText
                    value={localLabels.title || 'STOCK REPORT'}
                    className="text-lg font-bold text-center w-auto"
                    placeholder="STOCK REPORT"
                    onChange={handleTextChange("title")}
                />
            </div>
   
            {/* Main Header Box */}
            <div className="border border-black flex">
                <div className="w-[70%] border-r border-black p-2">
                    <div className="flex justify-between gap-4 items-baseline text-xs font-bold mb-1 lining-nums leading-none">
                        <span className="flex gap-1">
                            <EditableText
                                value={localLabels.fixedGstinLabel }
                                className="text-xs font-bold w-auto text-right"
                                placeholder="GSTIN:..."
                                onChange={handleTextChange("fixedGstinLabel")}
                            />
                            <EditableText
                                value={localLabels.fixedGstinValue }
                                className="text-xs font-bold w-auto"
                                onChange={handleTextChange("fixedGstinValue")}
                            />
                        </span>
                        <span className="flex gap-1">
                            <EditableText
                                value={localLabels.mobileLabel }
                                className="text-xs font-bold w-auto text-right"
                                placeholder="Mobile :..."
                                onChange={handleTextChange("mobileLabel")}
                            />
                            <EditableText
                                value={localLabels.mobileNumberValue }
                                className="text-xs font-bold w-auto"
                                onChange={handleTextChange("mobileNumberValue")}
                            />
                        </span>
                    </div>
   
                    <h1 className="text-2xl font-bold uppercase text-left tracking-tight mt-1">
                        <EditableText
                            value={localLabels.companyName || 'UNITED TRANSPORT COMPANY'}
                            className="text-2xl font-bold text-left tracking-tight"
                            placeholder="UNITED TRANSPORT COMPANY"
                                onChange={handleTextChange("companyName")}
                        />
                    </h1>
                    <p className="text-xs font-bold mt-1 text-left">
                        <EditableText
                            value={localLabels.companyAddress || '164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123'}
                            className="text-xs font-bold text-left"
                            placeholder="Address..."
                                onChange={handleTextChange("companyAddress")}
                        />
                    </p>
                </div>
            </div>
   
            <div className="border-x border-b border-black p-1 pl-2 text-sm font-normal">
                <EditableText
                    value={localLabels.mainHeader || 'Overall Stock Report'}
                    className="text-xs font-bold w-auto"
                    placeholder="Stock Report"
                                onChange={handleTextChange("mainHeader")}
                />
            </div>
        </div>

            <table className="w-full table-fixed border-collapse border-x border-b border-black text-[11px] leading-tight mt-0">
                <thead>
                    <tr className="h-8">
                        <th className="border border-black w-[10%] p-1 text-center font-bold text-xs">
                            <EditableText value={localLabels.tsLabel} className="font-bold text-xs text-center"  onChange={handleTextChange("tsLabel")}/>
                        </th>
                        <th className="border border-black w-[13%] p-1 text-center font-bold text-xs">
                            <EditableText value={localLabels.dateLabel } className="font-bold text-xs text-center" onChange={handleTextChange("dateLabel")} />
                        </th>
                        <th className="border border-black w-[12%] p-1 text-center font-bold text-xs">
                            <EditableText value={localLabels.fromPlaceLabel} className="font-bold text-xs text-center" onChange={handleTextChange("fromPlaceLabel")} />
                        </th>
                        <th className="border border-black w-[15%] p-1 text-center font-bold text-xs">
                            <EditableText value={localLabels.toPlaceLabel} className="font-bold text-xs text-center" onChange={handleTextChange("toPlaceLabel")} />
                        </th>
                        <th className="border border-black w-[12%] p-1 text-center font-bold text-xs">
                            <EditableText value={localLabels.amountLabel} className="font-bold text-xs text-center" onChange={handleTextChange("amountLabel")} />
                        </th>
                    </tr>
                </thead>
                <tbody>
                   
                    <tr className="h-8 font-bold bg-gray-50">
                        <td className="border border-black p-1 px-2 text-right" colSpan={4}>
                            <EditableText value={localLabels.totalLabel || 'Total :'} className="font-bold text-xs text-right w-auto" placeholder="Total :" onChange={handleTextChange("totalLabel")}/>
                        </td>
                        <td className="border border-black p-1" colSpan={1}></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

// --- Outer Wrapper Component (for styling/print logic) ---
export const TripSheetReportTemplate: React.FC<TripReportTemplateProps> = (props) => {
    return (
        <div className="stock-report-screen-wrapper bg-gray-100">
             <style>{`
                .stock-report-screen-wrapper {
                    min-height: 100vh;
                }
                .report-page {
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    margin: 20px auto;
                    border: 1px solid #ccc;
                }
                @media print {
                    .stock-report-screen-wrapper {
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
            <TripReportTemplate {...props}/>
        </div>
    );
}