import React, { useCallback, useEffect, useState } from "react";
import type { LoadingSheetLabels } from "../../types";

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

const DefaultDynamicContent: React.FC = () => (
    <div className="text-center text-gray-400 italic py-20">
        <p className="font-bold"> Loading Sheet Data </p>
    </div>
);

type LoadingSheetTemplateProps = Partial<{
    DynamicContent: React.FC<any>;
    onEdit: (hasChanges: boolean, saveHandler: () => void, resetHandler: () => void, undoHandler: () => void) => void;
}>;

type Change = {
    field: keyof LoadingSheetLabels;
    oldValue: string;
};

// --- MOCK CONTEXT HOOK (Fix for missing context properties) ---
const useLoadingSheetContext = () => {
    // Default initial labels based on LoadingSheetLabels type
    const defaultLabels: LoadingSheetLabels = {
        companyName: "UNITED TRANSPORT COMPANY",
        mainHeader: "Loading Sheet",
        totalLabel: "Total :",
        companySignatureLine: "For UNITED TRANSPORT COMPANY"
    };

    const [loadingLabels, setLoadingLabels] = useState<LoadingSheetLabels>(defaultLabels);

    const updateLoadingLabels = (newLabels: LoadingSheetLabels) => {
        setLoadingLabels(newLabels);
        console.log("Loading Sheet Labels updated (Local Mock):", newLabels);
    };

    return { loadingLabels, updateLoadingLabels };
};

export const LoadingSheetTemplate: React.FC<LoadingSheetTemplateProps> = (props) => {
    // 🟢 FIX: Use local hook instead of missing DataContext properties
    const { loadingLabels: originalLabels, updateLoadingLabels } = useLoadingSheetContext();
   
    const [localLabels, setLocalLabels] = useState<LoadingSheetLabels>(originalLabels);
    const [historyStack, setHistoryStack] = useState<Change[]>([]);
    const hasChanges = historyStack.length > 0;

    const { DynamicContent = DefaultDynamicContent, onEdit } = props;

    const saveHandler = useCallback(() => {
        updateLoadingLabels(localLabels);
        setHistoryStack([]);
    }, [localLabels, updateLoadingLabels]);

    const resetHandler = useCallback(() => {
        setLocalLabels(originalLabels);
        setHistoryStack([]);
    }, [originalLabels]);

    const undoHandler = useCallback(() => {
        setHistoryStack(prevStack => {
            if (prevStack.length === 0) return prevStack;

            // 1. Get the last recorded change (The one we are undoing)
            const lastChange = prevStack[prevStack.length - 1];
           
            // 2. Apply the old value back to the local labels
            // 🟢 FIX: Explicitly type prevLabels
            setLocalLabels((prevLabels: LoadingSheetLabels) => ({
                ...prevLabels,
                [lastChange.field]: lastChange.oldValue
            }));

            // 3. Remove the last item from the stack
            return prevStack.slice(0, -1);
        });
    }, []);

    useEffect(() => {
        if (JSON.stringify(localLabels) !== JSON.stringify(originalLabels)) {
             setLocalLabels(originalLabels);
             setHistoryStack([]);
        }
    }, [originalLabels]);

    useEffect(() => {
        if (onEdit) {
            onEdit(hasChanges, saveHandler, resetHandler, undoHandler);
        }
    }, [hasChanges, onEdit, saveHandler, resetHandler, undoHandler]);
   
    const handleTextChange = (field: keyof LoadingSheetLabels) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const newValue = e.target.value;
        const currentValue = localLabels[field];

        // 🟢 FIX: Explicitly type prevLabels
        setLocalLabels((prevLabels: LoadingSheetLabels) => ({
            ...prevLabels,
            [field]: newValue
        }));

        if (newValue !== currentValue) {
            setHistoryStack(prevStack => {
                return [
                    ...prevStack,
                    { field: field, oldValue: currentValue }
                ];
            });
        }
    };

    return (
        <div
            className="load-list-print-wrapper bg-white shadow-2xl mx-auto border border-gray-300"
            style={{
                width: "210mm",
                minHeight: "100mm",
                boxSizing: "border-box",
            }}
        >
            <style>{`
                /* Print styles ensure proper page break and size for actual printing */
                @media print {
                    .load-list-print-wrapper {
                        width: 100% !important;
                        min-height: auto !important;
                        margin: 0 !important;
                        padding: 0;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    @page { size: A4; margin: 5mm; } /* Apply standard print margins */
                    .print-footer-total { position: static !important; margin-top: 1rem; }
                    .print-split-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        width: 100%;
                    }
                }
            `}</style>

            <div className="p-8 print:p-5 print:text-[11pt] font-sans relative">

                <div className="text-center mb-6">
                    <h2 className="text-xl font-extrabold mb-1">
                        <EditableText
                            value={localLabels.companyName}
                            onChange={handleTextChange("companyName")}
                            className="text-xl font-extrabold text-center"
                            placeholder="Company Name"
                        />
                    </h2>
                    <h3 className="text-lg font-extrabold flex justify-center items-center gap-2">
                        <EditableText
                            value={localLabels.mainHeader}
                            onChange={handleTextChange("mainHeader")}
                            className="text-lg font-extrabold text-center w-auto"
                            placeholder="Header Title"
                        />
                    </h3>
                </div>

                <div className="dynamic-load-list-area p-2 my-4 min-h-[100px]">
                    <DynamicContent />
                </div>

                <div className="mt-8 pt-4 print:mt-4 print:pt-2">
                    <div className="w-full mx-auto">
                        <div className="border-t-2 border-black w-full my-2"></div>

                        <div className="py-1 flex justify-between items-start print-split-footer">

                            <div className="flex items-baseline font-bold text-lg">
                                <EditableText
                                    value={localLabels.totalLabel}
                                    onChange={handleTextChange("totalLabel")}
                                    className="font-bold text-lg w-auto text-left flex-shrink-0"
                                    placeholder="Total Label"
                                />
                            </div>

                            <div className="text-xs mb-1 text-center w-1/3">
                                <p className="italic font-bold mr-1">
                                    <EditableText
                                        value={localLabels.companySignatureLine}
                                        onChange={handleTextChange("companySignatureLine")}
                                        className="italic font-bold text-xs text-center"
                                        placeholder="Signature Line"
                                    />
                                </p>
                            </div>
                        </div>

                        <div className="border-t-2 border-black w-full my-2"></div>
                    </div>
                </div>

            </div>
        </div>
    );
};