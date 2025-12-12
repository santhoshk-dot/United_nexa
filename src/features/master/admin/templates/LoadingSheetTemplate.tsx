import React, { useCallback, useEffect, useState } from "react";
import type { LoadingSheetLabels } from "../../../../types";

const EditableText: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    placeholder?: string;
    centered?: boolean;
}> = ({ value, onChange, placeholder = "", className = "", centered = false }) => (
    <input
        type="text"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className={`border border-dashed border-gray-400 p-0.5 w-full appearance-none focus:border-solid focus:bg-white bg-transparent ${centered ? 'text-center' : ''} ${className}`}
        style={{ minWidth: '30px' }}
    />
);

const DefaultDynamicContent: React.FC = () => (
    <div className="text-center text-gray-400 italic py-20">
        <p className="font-bold"> Loading Sheet Data </p>
    </div>
);

// 🟢 UPDATE: Props now accept data and save callback
type LoadingSheetTemplateProps = {
    initialData: LoadingSheetLabels;
    onSave: (data: LoadingSheetLabels) => void;
    onEdit: (hasChanges: boolean, saveHandler: () => void, resetHandler: () => void, undoHandler: () => void) => void;
    DynamicContent?: React.FC<any>;
};

type Change = {
    field: keyof LoadingSheetLabels;
    oldValue: string;
};

// 🟢 REMOVED: useLoadingSheetContext (Logic moved to DataContext and passed via props)

export const LoadingSheetTemplate: React.FC<LoadingSheetTemplateProps> = (props) => {
    // 🟢 Use props.initialData instead of local context
    const { initialData, onSave, DynamicContent = DefaultDynamicContent, onEdit } = props;
   
    const [localLabels, setLocalLabels] = useState<LoadingSheetLabels>(initialData);
    const [historyStack, setHistoryStack] = useState<Change[]>([]);
    const hasChanges = historyStack.length > 0;

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
            setLocalLabels((prevLabels: LoadingSheetLabels) => ({
                ...prevLabels,
                [lastChange.field]: lastChange.oldValue
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
   
    const handleTextChange = (field: keyof LoadingSheetLabels) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const newValue = e.target.value;
        const currentValue = localLabels[field];
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
            className="load-list-print-wrapper bg-white shadow-2xl mx-auto border border-gray-300 w-full lg:max-w-[210mm]"
            style={{
                minHeight: "230mm",
                boxSizing: "border-box",
            }}
        >
            <style>{`
                @media print {
                    .load-list-print-wrapper {
                        width: 100% !important;
                        max-width: 100% !important;
                        min-height: auto !important;
                        margin: 0 !important;
                        padding: 0;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    @page { size: A4; margin: 5mm; } 
                    .print-split-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        width: 100%;
                    }
                }
            `}</style>

            <div className="p-2 md:p-8 print:p-5 print:text-[11pt] font-sans relative dark:text-black">

                {/* Header Section - Centered */}
                <div className="text-center mb-4">
                    <h2 className="text-base md:text-xl font-extrabold mb-1">
                        <EditableText
                            value={localLabels.companyName}
                            className="text-base md:text-xl font-extrabold"
                            onChange={handleTextChange("companyName")}
                            placeholder="Company Name"
                            centered
                        />
                    </h2>
                    <h3 className="text-sm md:text-lg font-extrabold">
                        <EditableText
                            value={localLabels.mainHeader}
                            className="text-sm md:text-lg font-extrabold"
                            onChange={handleTextChange("mainHeader")}
                            placeholder="Header Title"
                            centered
                        />
                    </h3>
                </div>

                <div className="dynamic-load-list-area p-1 my-2 min-h-[100px] overflow-x-auto text-[10px] md:text-sm">
                    <DynamicContent />
                </div>

                <div className="mt-80 pt-2 print:mt-4 print:pt-2">
                    <div className="w-full mx-auto">
                        <div className="border-t-2 border-black w-full my-2"></div>

                        <div className="py-1 flex flex-row justify-between items-end">
                            <div className="flex items-baseline font-bold text-sm md:text-lg w-1/2">
                                <EditableText
                                    value={localLabels.totalLabel}
                                    onChange={handleTextChange("totalLabel")}
                                    className="font-bold"
                                    placeholder="Total Label"
                                />
                            </div>

                            <div className="text-[10px] md:text-xs mb-1 w-1/2">
                                <EditableText
                                    value={localLabels.companySignatureLine}
                                    onChange={handleTextChange("companySignatureLine")}
                                    className="italic font-bold"
                                    placeholder="Signature Line"
                                    centered
                                />
                            </div>
                        </div>

                        <div className="border-t-2 border-black w-full my-2"></div>
                    </div>
                </div>

            </div>
        </div>
    );
};