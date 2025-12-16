import React, { useCallback, useEffect, useState } from "react";
import type { StockLabels } from "../../../../types";

type Change = {
    field: keyof StockLabels;
    oldValue: string;
};

// 🟢 UPDATE: Props now accept data and save callback
export type StockReportTemplateProps = {
    initialData: StockLabels;
    onSave: (data: StockLabels) => void;
    onEdit: (hasChanges: boolean, saveHandler: () => void, resetHandler: () => void, undoHandler: () => void) => void;
};

// 🟢 REMOVED: useStockContext (Logic moved to DataContext and passed via props)

const EditableText: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    placeholder?: string;
}> = ({ value, onChange, placeholder = "", className = "" }) => (
    <input
        type="text"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className={`border border-dashed border-gray-400 p-0.5 w-full appearance-none block focus:border-solid focus:bg-white bg-transparent ${className}`}
        style={{ minWidth: '20px' }}
    />
);

const StockReportCoreTemplate: React.FC<StockReportTemplateProps> = ({ initialData, onSave, onEdit }) => {

    // 🟢 Use props.initialData instead of local context
    const [localLabels, setLocalLabels] = useState<StockLabels>(initialData);
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
            setLocalLabels((prevLabels: StockLabels) => ({
                ...prevLabels,
                [lastChange.field]: lastChange.oldValue || ''
            }));
            return prevStack.slice(0, -1);
        });
    }, []);

    // 🟢 Sync local state when incoming data changes
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

    const handleTextChange = (field: keyof StockLabels) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const newValue = e.target.value;
        const currentValue = localLabels[field];
        setLocalLabels((prevLabels: StockLabels) => ({
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
            className="report-page bg-white text-black shadow-2xl mx-auto border border-gray-300"
            style={{
                maxWidth: "210mm",
                minHeight: "230mm",
                padding: "5mm",
                boxSizing: "border-box",
                fontFamily: 'Arial, Helvetica, sans-serif'
            }}
        >
            {/* Header */}
            <div className="w-full mb-0 text-black">
                <div className="text-center font-bold text-sm md:text-lg mb-1 uppercase">
                    <EditableText
                        value={localLabels.title}
                        className="text-sm md:text-lg font-bold text-center w-auto"
                        placeholder="STOCK REPORT"
                        onChange={handleTextChange("title")}
                    />
                </div>

                <div className="border border-black flex flex-row">
                    <div className="w-[70%] border-r border-black p-1 md:p-2">
                        <div className="flex flex-wrap justify-between gap-1 items-baseline text-[9px] md:text-xs font-bold mb-1 lining-nums leading-none">
                            <span className="flex gap-1">
                                <EditableText value={localLabels.fixedGstinLabel} className="font-bold w-auto text-left" placeholder="GSTIN:" onChange={handleTextChange("fixedGstinLabel")} />
                                <EditableText value={localLabels.fixedGstinValue} className="font-bold w-auto" onChange={handleTextChange("fixedGstinValue")} />
                            </span>
                            <span className="flex gap-1">
                                <EditableText value={localLabels.mobileLabel} className="font-bold w-auto text-left" placeholder="Mobile:" onChange={handleTextChange("mobileLabel")} />
                                <EditableText value={localLabels.mobileNumberValue} className="font-bold w-auto" onChange={handleTextChange("mobileNumberValue")} />
                            </span>
                        </div>

                        <h1 className="text-sm md:text-2xl font-bold uppercase text-center tracking-tight mt-1">
                            <EditableText
                                value={localLabels.companyName}
                                className="text-sm md:text-2xl font-bold text-left tracking-tight"
                                placeholder="UNITED TRANSPORT COMPANY"
                                onChange={handleTextChange("companyName")}
                            />
                        </h1>
                        <p className="text-[9px] md:text-xs font-bold mt-1 text-left">
                            <EditableText
                                value={localLabels.companyAddress}
                                className="font-bold text-left"
                                placeholder="Address..."
                                onChange={handleTextChange("companyAddress")}
                            />
                        </p>
                    </div>
                    <div className="w-[30%] p-2"></div>
                </div>

                <div className="border-x border-b border-black p-1 text-[10px] md:text-sm font-normal text-center">
                    <EditableText
                        value={localLabels.mainHeader}
                        className="font-bold w-full text-center"
                        placeholder="Stock Report"
                        onChange={handleTextChange("mainHeader")}
                    />
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[320px] table-fixed border-collapse border-x border-b border-black text-[9px] md:text-[11px] leading-tight mt-0">
                    <thead>
                        <tr className="h-6 md:h-8">
                            <th className="border border-black w-[12%] p-0.5 text-left font-bold"><EditableText value={localLabels.gcLabel} className="font-bold text-left" onChange={handleTextChange("gcLabel")} /></th>
                            <th className="border border-black w-[10%] p-0.5 text-left font-bold"><EditableText value={localLabels.stockCountLabel} className="font-bold text-left" onChange={handleTextChange("stockCountLabel")} /></th>
                            <th className="border border-black w-[15%] p-0.5 text-center font-bold"><EditableText value={localLabels.contentLabel} className="font-bold text-center" onChange={handleTextChange("contentLabel")} /></th>
                            <th className="border border-black w-[25%] p-0.5 text-center font-bold"><EditableText value={localLabels.consignorLabel} className="font-bold text-center" onChange={handleTextChange("consignorLabel")} /></th>
                            <th className="border border-black w-[25%] p-0.5 text-center font-bold"><EditableText value={localLabels.consigneeLabel} className="font-bold text-center" onChange={handleTextChange("consigneeLabel")} /></th>
                            <th className="border border-black w-[13%] p-0.5 text-center font-bold"><EditableText value={localLabels.dateLabel} className="font-bold text-center" onChange={handleTextChange("dateLabel")} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="h-6 md:h-8">
                            <td className="border border-black p-0.5"></td>
                            <td className="border border-black p-0.5"></td>
                            <td className="border border-black p-0.5"></td>
                            <td className="border border-black p-0.5"></td>
                            <td className="border border-black p-0.5"></td>
                            <td className="border border-black p-0.5"></td>
                        </tr>
                        <tr className="h-6 md:h-8 font-bold bg-gray-50">
                            <td className="border border-black p-0.5 text-right">
                                <EditableText value={localLabels.totalLabel} className="font-bold text-right w-auto" placeholder="Total :" onChange={handleTextChange("totalLabel")} />
                            </td>
                            <td className="border border-black p-0.5 text-left"></td>
                            <td className="border border-black p-0.5" colSpan={4}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const StockReportTemplate: React.FC<StockReportTemplateProps> = (props) => {
    return (
        <div className="stock-report-screen-wrapper dark:bg-black">
            <style>{`
                .stock-report-screen-wrapper {
                    min-height: 100vh;
                }
                .report-page {
                    // box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    margin: 10px auto;
                    border: 1px solid #ccc;
                }
                @media print {
                    .stock-report-screen-wrapper {
                        display: block !important;
                        background: white;
                    }
                    .report-page {
                        // box-shadow: none;
                        border: none;
                        margin: 0;
                        padding: 0;
                        width: 210mm !important;
                        max-width: 210mm !important; 
                        min-height: 297mm;
                    }
                    .report-page input[type="text"] {
                        border: none !important;
                        padding: 0 !important;
                        // box-shadow: none !important;   
                    }
                    @page { size: A4; margin: 0; }
                }
            `}</style>
            <StockReportCoreTemplate {...props} />
        </div>
    );
}

export default StockReportTemplate;