import React, { useCallback, useEffect, useState } from "react";
import type { TripPrintLabels } from "../../../../types";

type Change = {
    field: keyof TripPrintLabels;
    oldValue: string;
};

export type TripSheetTemplateProps = {
    initialData: TripPrintLabels;
    onSave: (data: TripPrintLabels) => void;
    onEdit: (hasChanges: boolean, saveHandler: () => void, resetHandler: () => void, undoHandler: () => void) => void;
};

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
        className={`border border-dashed border-gray-600 p-0.5 w-full appearance-none focus:border-solid focus:bg-white bg-transparent ${className}`}
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
        style={{ minHeight: `${rows * 1.2}rem` }}
    />
);

const TripSheetCoreTemplate: React.FC<TripSheetTemplateProps> = ({ initialData, onSave, onEdit }) => {

    const [localLabels, setLocalLabels] = useState<TripPrintLabels>(initialData);
    const [historyStack, setHistoryStack] = useState<Change[]>([]);
    const hasChanges = historyStack.length > 0;

    type StaticChangeElement = HTMLInputElement | HTMLTextAreaElement;

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
            setLocalLabels((prevLabels: TripPrintLabels) => ({
                ...prevLabels,
                [lastChange.field]: lastChange.oldValue || ''
            }));
            return prevStack.slice(0, -1);
        });
    }, []);

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

    const handleTextChange = (field: keyof TripPrintLabels) => (
        e: React.ChangeEvent<StaticChangeElement>
    ) => {
        const newValue = e.target.value;
        const currentValue = localLabels[field];
        setLocalLabels((prevLabels: TripPrintLabels) => ({
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

    const label = localLabels;

    return (
        <div
            className="report-page bg-white text-black shadow-2xl mx-auto border border-gray-300 w-full lg:max-w-[210mm]"
            style={{
                minHeight: "297mm",
                boxSizing: "border-box",
                fontFamily: 'Arial, Helvetica, sans-serif',
                padding: "3mm"
            }}
        >
            <div className=" p-2 w-full">

                <div className="text-center font-bold text-lg mb-1 uppercase">
                    <EditableText
                        value={label.title}
                        className="text-lg font-bold text-center w-auto"
                        placeholder="TRIP SHEET"
                        onChange={handleTextChange("title")}
                    />
                </div>

                <div className="flex flex-row border-2 border-black">
                    <div className="w-[70%] border-r border-black p-1">
                        <div className="flex flex-row justify-between gap-1 items-baseline text-[9px] md:text-xs font-bold mb-1 leading-none">
                            <span className="flex gap-1 w-1/2">
                                <EditableText value={label.fixedGstinLabel} className="text-left font-bold w-12" placeholder="GSTIN:" onChange={handleTextChange("fixedGstinLabel")} />
                                <EditableText value={label.fixedGstinValue} className="font-bold w-full" placeholder="Value" onChange={handleTextChange("fixedGstinValue")} />
                            </span>
                            <span className="flex gap-1 w-1/2 justify-end">
                                <EditableText value={label.mobileLabel} className="text-left font-bold w-12" placeholder="Mobile:" onChange={handleTextChange("mobileLabel")} />
                                <EditableText value={label.mobileNumberValue} className="font-bold w-16" placeholder="Number" onChange={handleTextChange("mobileNumberValue")} />
                            </span>
                        </div>

                        <h1 className="text-sm md:text-xl font-extrabold uppercase text-left tracking-tight mt-1">
                            <EditableText value={label.companyName} className="text-sm md:text-xl font-extrabold text-left" placeholder="COMPANY NAME" onChange={handleTextChange("companyName")} />
                        </h1>
                        <p className="text-[9px] md:text-xs font-normal mt-1 text-left">
                            <EditableText value={label.companyAddress} className="text-[9px] md:text-xs font-normal text-left" placeholder="Address..." onChange={handleTextChange("companyAddress")} />
                        </p>
                    </div>

                    <div className="w-[30%] text-left text-[9px] md:text-xs p-1 space-y-1">
                        <div className="flex flex-col">
                            <strong><EditableText value={label.mfNoLabel} className="font-bold w-full" placeholder="M.F. No.:" onChange={handleTextChange("mfNoLabel")} /></strong>
                        </div>
                        <div className="flex flex-col">
                            <strong><EditableText value={label.carriersLabel} className="font-bold w-full" placeholder="Carriers:" onChange={handleTextChange("carriersLabel")} /></strong>
                        </div>
                    </div>
                </div>

                <div className="flex flex-row justify-between mt-2 p-1 border-t border-b border-black text-[10px] md:text-sm font-normal gap-1">
                    <div className="flex gap-1 w-1/3">
                        <EditableText value={label.fromLabel} className="font-bold w-full text-center" placeholder="From:" onChange={handleTextChange("fromLabel")} />
                    </div>
                    <div className="flex gap-1 w-1/3 border-l border-r border-black/20">
                        <EditableText value={label.toLabel} className="font-bold w-full text-center" placeholder="To:" onChange={handleTextChange("toLabel")} />
                    </div>
                    <div className="flex gap-1 w-1/3">
                        <EditableText value={label.dateLabel} className="font-bold w-full text-center" placeholder="Date:" onChange={handleTextChange("dateLabel")} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full table-fixed border-collapse border-black text-[9px] md:text-[11px] mt-1 border-2 my-4 min-w-[300px]">
                        <thead>
                            <tr>
                                <th className="border border-black w-[10%] p-0.5 text-center font-bold"><EditableText value={label.cnNoHeader} className="font-bold text-center" onChange={handleTextChange("cnNoHeader")} /></th>
                                <th className="border border-black w-[15%] p-0.5 text-center font-bold"><EditableText value={label.packagesHeader} className="font-bold text-center" onChange={handleTextChange("packagesHeader")} /></th>
                                <th className="border border-black w-[12%] p-0.5 text-center font-bold"><EditableText value={label.contentsHeader} className="font-bold text-center" onChange={handleTextChange("contentsHeader")} /></th>
                                <th className="border border-black w-[20%] p-0.5 text-center font-bold"><EditableText value={label.consignorHeader} className="font-bold text-center" onChange={handleTextChange("consignorHeader")} /></th>
                                <th className="border border-black w-[20%] p-0.5 text-center font-bold"><EditableText value={label.consigneeHeader} className="font-bold text-center" onChange={handleTextChange("consigneeHeader")} /></th>
                                <th className="border border-black w-[10%] p-0.5 text-center font-bold"><EditableText value={label.toPayHeader} className="font-bold text-center" onChange={handleTextChange("toPayHeader")} /></th>
                            </tr>
                        </thead>
                        <tbody>
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
                            <tr className="h-8 font-bold">
                                <td className="border border-black p-1 px-2 text-left" colSpan={5}>
                                    <EditableText value={label.totalPackagesLabel} className="font-bold text-left w-auto" placeholder="TOTAL:" onChange={handleTextChange("totalPackagesLabel")} />
                                </td>
                                <td colSpan={1}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="text-[10px] md:text-xs mt-2 space-y-1">
                    <EditableText value={label.footerNote0} className="w-full" placeholder="Note 0..." onChange={handleTextChange("footerNote0")} />
                    <EditableText value={label.footerNote1} className="w-auto" placeholder="Note 1..." onChange={handleTextChange("footerNote1")} />
                    <EditableText value={label.footerNote2} className="w-auto" placeholder="Note 2..." onChange={handleTextChange("footerNote2")} />
                    <EditableText value={label.footerNote3} className="w-auto" placeholder="Note 3..." onChange={handleTextChange("footerNote3")} />
                </div>

                <div className="border-t border-black mt-2 pt-2 grid grid-cols-3 gap-2 text-[9px] md:text-xs">
                    <div className="border-r border-gray-300 pr-1">
                        <div className="mb-1"><strong><EditableText value={label.driverNameLabel} className="font-bold w-full" placeholder="Driver Name" onChange={handleTextChange("driverNameLabel")} /></strong></div>
                        <div className="mb-1"><strong><EditableText value={label.dlNoLabel} className="font-bold w-full" placeholder="D.L.No." onChange={handleTextChange("dlNoLabel")} /></strong></div>
                        <div><strong><EditableText value={label.driverMobileLabel} className="font-bold w-full" placeholder="Driver mobile" onChange={handleTextChange("driverMobileLabel")} /></strong></div>
                    </div>
                    <div className="border-r border-gray-300 pr-1">
                        <div className="mb-1"><strong><EditableText value={label.ownerNameLabel} className="font-bold w-full" placeholder="Owner Name" onChange={handleTextChange("ownerNameLabel")} /></strong></div>
                        <div><strong><EditableText value={label.ownerMobileLabel} className="font-bold w-full" placeholder="Owner mobile" onChange={handleTextChange("ownerMobileLabel")} /></strong></div>
                    </div>
                    <div>
                        <div className="mb-1"><strong><EditableText value={label.lorryNoLabel} className="font-bold w-full" placeholder="Lorry No." onChange={handleTextChange("lorryNoLabel")} /></strong></div>
                        <div><strong><EditableText value={label.lorryNameLabel} className="font-bold w-full" placeholder="Lorry Name" onChange={handleTextChange("lorryNameLabel")} /></strong></div>
                    </div>
                </div>

                <div className="border-t border-black mt-2 pt-2">
                    <p className="text-[8px] md:text-[10px] leading-snug">
                        <EditableTextArea value={label.legalNote} className="w-full wordbreak" placeholder="Legal Note..." onChange={handleTextChange("legalNote")} />
                    </p>
                    <div className="flex flex-row justify-around mt-6 text-[9px] md:text-xs gap-4">
                        <div className="w-1/2 text-center">
                            <div className="border-t border-black mb-1 w-2/3 mx-auto"></div>
                            <EditableText value={label.signatureDriverLabel} className="w-full text-center" placeholder="Sign Driver" onChange={handleTextChange("signatureDriverLabel")} />
                        </div>
                        <div className="w-1/2 text-center">
                            <div className="border-t border-black mb-1 w-2/3 mx-auto"></div>
                            <EditableText value={label.signatureClerkLabel} className="w-full text-center" placeholder="Sign Clerk" onChange={handleTextChange("signatureClerkLabel")} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export const TripSheetPrintTemplate: React.FC<TripSheetTemplateProps> = (props) => {
    return (
        <div className="trip-sheet-screen-wrapper min-h-screen dark:bg-black">
            <style>{`
                .report-page {
                    // box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    margin: 10px auto;
                    border: 1px solid #ccc;
                }
                @media print {
                    .trip-sheet-screen-wrapper {
                        display: block !important;
                        background: white;
                    }
                    .report-page {
                        // box-shadow: none;
                        border: none;
                        margin: 0;
                        width: 210mm !important;
                        max-width: 210mm !important;
                        padding: 10mm !important; 
                        min-height: 297mm !important;
                    }
                    @page { size: A4; margin: 0; }
                }
            `}</style>
            <TripSheetCoreTemplate {...props} />
        </div>
    );
}

export default TripSheetPrintTemplate;