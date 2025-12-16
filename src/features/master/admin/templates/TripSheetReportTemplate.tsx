import React, { useCallback, useEffect, useState } from "react";
import type { TripReportLabels } from "../../../../types";

type Change = {
    field: keyof TripReportLabels;
    oldValue: string;
};

// 🟢 UPDATE: Props now accept data and save callback
export type TripReportTemplateProps = {
    initialData: TripReportLabels;
    onSave: (data: TripReportLabels) => void;
    onEdit: (hasChanges: boolean, saveHandler: () => void, resetHandler: () => void, undoHandler: () => void) => void;
};

// 🟢 REMOVED: useTripReportContext (Logic moved to DataContext and passed via props)

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
        className={`border border-dashed border-gray-400 p-0.5 w-full appearance-none focus:border-solid focus:bg-white bg-transparent ${className}`}
        style={{ minWidth: '30px' }}
    />
);

export const TripReportTemplate: React.FC<TripReportTemplateProps> = (props) => {
    // 🟢 Use props.initialData instead of local context
    const { initialData, onSave, onEdit } = props;

    const [localLabels, setLocalLabels] = useState<TripReportLabels>(initialData);
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
            setLocalLabels((prevLabels: TripReportLabels) => ({
                ...prevLabels,
                [lastChange.field]: lastChange.oldValue
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

    const handleTextChange = (field: keyof TripReportLabels) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const newValue = e.target.value;
        const currentValue = localLabels[field];
        setLocalLabels((prevLabels: TripReportLabels) => ({
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
            className="report-page bg-white text-black mx-auto border border-gray-300 shadow-2xl"
            style={{
                maxWidth: "210mm",
                minHeight: "230mm",
                padding: "5mm",
                boxSizing: "border-box",
                fontFamily: 'Arial, Helvetica, sans-serif'
            }}
        >
            <div className="w-full mb-0 text-black">
                <div className="text-center font-bold text-sm md:text-lg mb-1 uppercase">
                    <EditableText
                        value={localLabels.title}
                        className="font-bold text-center w-auto"
                        placeholder="TRIP SHEET REPORT"
                        onChange={handleTextChange("title")}
                    />
                </div>

                <div className="border border-black flex flex-row">
                    <div className="w-[70%] border-r border-black p-1 md:p-2">
                        <div className="flex justify-between gap-1 items-baseline text-[9px] md:text-xs font-bold mb-1 lining-nums leading-none">
                            <span className="flex gap-1 w-1/2">
                                <EditableText value={localLabels.fixedGstinLabel} className="text-left w-auto" placeholder="GSTIN:" onChange={handleTextChange("fixedGstinLabel")} />
                                <EditableText value={localLabels.fixedGstinValue} className="w-auto" onChange={handleTextChange("fixedGstinValue")} />
                            </span>
                            <span className="flex gap-1 w-1/2 justify-end">
                                <EditableText value={localLabels.mobileLabel} className="text-left w-auto" placeholder="Mobile:" onChange={handleTextChange("mobileLabel")} />
                                <EditableText value={localLabels.mobileNumberValue} className="w-auto" onChange={handleTextChange("mobileNumberValue")} />
                            </span>
                        </div>

                        <h1 className="text-sm md:text-2xl font-bold uppercase text-center tracking-tight mt-1">
                            <EditableText
                                value={localLabels.companyName}
                                className="font-bold text-left tracking-tight"
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
                    <div className="w-[30%]"></div>
                </div>

                <div className="border-x border-b border-black p-1 text-[10px] md:text-sm font-normal text-center">
                    <EditableText
                        value={localLabels.mainHeader}
                        className="font-bold w-full text-center"
                        placeholder="Report Header"
                        onChange={handleTextChange("mainHeader")}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] table-fixed border-collapse border-x border-b border-black text-[9px] md:text-[11px] leading-tight mt-0">
                    <thead>
                        <tr className="h-6 md:h-8">
                            <th className="border border-black w-[10%] p-0.5 text-center font-bold">
                                <EditableText value={localLabels.tsLabel} className="font-bold text-center" onChange={handleTextChange("tsLabel")} />
                            </th>
                            <th className="border border-black w-[13%] p-0.5 text-center font-bold">
                                <EditableText value={localLabels.dateLabel} className="font-bold text-center" onChange={handleTextChange("dateLabel")} />
                            </th>
                            <th className="border border-black w-[25%] p-0.5 text-center font-bold">
                                <EditableText value={localLabels.fromPlaceLabel} className="font-bold text-center" onChange={handleTextChange("fromPlaceLabel")} />
                            </th>
                            <th className="border border-black w-[25%] p-0.5 text-center font-bold">
                                <EditableText value={localLabels.toPlaceLabel} className="font-bold text-center" onChange={handleTextChange("toPlaceLabel")} />
                            </th>
                            <th className="border border-black w-[15%] p-0.5 text-center font-bold">
                                <EditableText value={localLabels.amountLabel} className="font-bold text-center" onChange={handleTextChange("amountLabel")} />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="h-6 md:h-8">
                            <td className="border border-black p-0.5"></td>
                            <td className="border border-black p-0.5"></td>
                            <td className="border border-black p-0.5"></td>
                            <td className="border border-black p-0.5"></td>
                            <td className="border border-black p-0.5"></td>
                        </tr>
                        <tr className="h-6 md:h-8 font-bold bg-gray-50">
                            <td className="border border-black p-0.5 px-2 text-right" colSpan={4}>
                                <EditableText value={localLabels.totalLabel} className="font-bold text-right w-auto" placeholder="Total :" onChange={handleTextChange("totalLabel")} />
                            </td>
                            <td className="border border-black p-0.5" colSpan={1}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const TripSheetReportTemplate: React.FC<TripReportTemplateProps> = (props) => {
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
                    @page { size: A4; margin: 0; }
                }
            `}</style>
            <TripReportTemplate {...props} />
        </div>
    );
}

export default TripSheetReportTemplate;