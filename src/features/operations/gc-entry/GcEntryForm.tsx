import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import type { GcEntry, Consignee, Consignor } from '../../../types';
import { getTodayDate } from '../../../utils/dateHelpers';
import { Input } from '../../../components/shared/Input';
import { Button } from '../../../components/shared/Button';
import { AsyncAutocomplete } from '../../../components/shared/AsyncAutocomplete';
import { Printer, Save, X, Plus, Trash2 } from 'lucide-react';
import { GcPrintManager, type GcPrintJob } from './GcPrintManager';
import { useToast } from '../../../contexts/ToastContext';
import { gcEntrySchema } from '../../../schemas';
import { RadioGroup } from '../../../components/shared/RadioGroup';

type ProofType = 'gst' | 'pan' | 'aadhar';

// Content Item Type for table repeater
type ContentItem = {
    id: string;
    qty: number | string;
    packing: string;
    contents: string;
    prefix: string;
    fromNo: number | string;
    packingOption: any;
    contentOption: any;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const isValueValid = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return !!value;
};

const getValidationProp = (value: any) => ({
    hideRequiredIndicator: isValueValid(value)
});

// Helper function to map Consignor data for the GSTIN dropdown
const mapConsignorToGstOption = (consignor: any) => ({
    value: consignor.id,
    label: consignor.gst || consignor.name,
    gst: consignor.gst || '',
    from: consignor.from || 'Sivakasi',
    consignorName: consignor.name
});

export const GcEntryForm = () => {
    const toast = useToast();
    const { gcNo } = useParams<{ gcNo: string }>();
    const navigate = useNavigate();
    const {
        addGcEntry,
        updateGcEntry,
        fetchGcById,
        searchConsignors,
        searchConsignees,
        searchToPlaces,
        searchPackings,
        searchContents,
        fetchGcPrintData
    } = useData();

    const isEditMode = !!gcNo;
    const [loading, setLoading] = useState(isEditMode);

    // 泙 NEW: Validation State & Refs
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});


    // Form State
    const [form, setForm] = useState<Omit<GcEntry, 'id'>>({
        gcNo: '',
        gcDate: getTodayDate(),
        from: 'Sivakasi',
        destination: '',
        consignorId: '',
        consigneeId: '',
        consigneeProofType: 'gst',
        consigneeProofValue: '',
        billDate: getTodayDate(),
        deliveryAt: '',
        freightUptoAt: '',
        godown: '',
        billNo: '',
        billValue: '' as unknown as number,
        tollFee: 0,
        freight: 0,
        godownCharge: 0,
        statisticCharge: 0,
        advanceNone: 0,
        balanceToPay: 0,
        netQty: 0,
        totalQty: 0,
        paymentType: 'To Pay',
    });

    const [printingJobs, setPrintingJobs] = useState<GcPrintJob[] | null>(null);

    // UI State for Autocompletes & Display Fields
    const [consignorOption, setConsignorOption] = useState<any>(null);
    const [consignorGst, setConsignorGst] = useState('');

    const [consigneeOption, setConsigneeOption] = useState<any>(null);
    const [destinationOption, setDestinationOption] = useState<any>(null);
    const [deliveryOption, setDeliveryOption] = useState<any>(null);
    const [freightOption, setFreightOption] = useState<any>(null);

    // Content Items State (List of added items)
    const [contentItems, setContentItems] = useState<ContentItem[]>([]);

    // Current Content Form State (for the static Add form)
    const [currentQty, setCurrentQty] = useState<string>('');
    const [currentPacking, setCurrentPacking] = useState<string>('');
    const [currentContents, setCurrentContents] = useState<string>('');
    const [currentPrefix, setCurrentPrefix] = useState<string>('');
    const [currentFromNo, setCurrentFromNo] = useState<string>('1');
    const [currentPackingOption, setCurrentPackingOption] = useState<any>(null);
    const [currentContentOption, setCurrentContentOption] = useState<any>(null);

    const [consignorGstOption, setConsignorGstOption] = useState<any>(null);
    const [consigneeDestDisplay, setConsigneeDestDisplay] = useState('');

    // 泙 NEW: Field Validation Helper
    const validateField = (name: string, value: any) => {
        try {
            const fieldSchema = (gcEntrySchema.shape as any)[name];
            if (fieldSchema) {
                const result = fieldSchema.safeParse(value);
                if (!result.success) {
                    setFormErrors(prev => ({ ...prev, [name]: result.error.issues[0].message }));
                } else {
                    setFormErrors(prev => {
                        const next = { ...prev };
                        delete next[name];
                        return next;
                    });
                }
            }
        } catch (e) { }
    };

    // --- Load Data Effect (Enriched for Edit) ---
    useEffect(() => {
        if (isEditMode && gcNo) {
            const loadData = async () => {
                const gc = await fetchGcById(gcNo);

                if (gc) {
                    const tripAmount = (gc as any).tripSheetAmount;
                    const displayBalance = (tripAmount !== undefined && tripAmount !== null)
                        ? tripAmount.toString()
                        : gc.balanceToPay;

                    const backendStatistic = gc.statisticCharge ?? (gc as any).statisticalCharge ?? 0;

                    setForm({
                        ...gc,
                        billValue: (gc.billValue || '' as unknown as number),
                        tollFee: (gc.tollFee || 0),
                        freight: (gc.freight || 0),
                        godownCharge: (gc.godownCharge || 0),
                        statisticCharge: backendStatistic,
                        advanceNone: (gc.advanceNone || 0),
                        balanceToPay: displayBalance,
                        paymentType: gc.paymentType || 'To Pay'
                    });

                    if (gc.consignorId && (gc as any).consignorName) {
                        const gst = (gc as any).consignorGSTIN || '';
                        const consignorName = (gc as any).consignorName;
                        // FIX: Use consignorFrom from backend (which is the actual consignor location)
                        // instead of gc.from (which is the GC origin, usually Sivakasi)
                        const consignorFrom = (gc as any).consignorFrom || '';

                        setConsignorOption({
                            value: gc.consignorId,
                            label: consignorName,
                            gst: gst,
                            from: consignorFrom
                        });

                        setConsignorGst(gst);

                        if (gst) {
                            setConsignorGstOption({
                                value: gc.consignorId,
                                label: gst,
                                gst: gst,
                                consignorName: consignorName,
                                from: consignorFrom
                            });
                        } else {
                            setConsignorGstOption(null);
                        }
                    }

                    if (gc.consigneeId && (gc as any).consigneeName) {
                        setConsigneeOption({
                            value: gc.consigneeId,
                            label: (gc as any).consigneeName,
                            gst: (gc as any).consigneeGst,
                            pan: (gc as any).consigneePan,
                            aadhar: (gc as any).consigneeAadhar,
                            destination: gc.destination
                        });
                        setConsigneeDestDisplay(gc.destination || '');
                    }

                    if (gc.destination) setDestinationOption({ value: gc.destination, label: gc.destination });
                    if (gc.deliveryAt) setDeliveryOption({ value: gc.deliveryAt, label: gc.deliveryAt });
                    if (gc.freightUptoAt) setFreightOption({ value: gc.freightUptoAt, label: gc.freightUptoAt });

                    // Load content items from existing GC data
                    if ((gc as any).contentItems && (gc as any).contentItems.length > 0) {
                        setContentItems((gc as any).contentItems.map((item: any) => ({
                            ...item,
                            id: item.id || generateId(),
                            packingOption: item.packing ? { value: item.packing, label: item.packing } : null,
                            contentOption: item.contents ? { value: item.contents, label: item.contents } : null,
                        })));
                    } else if ((gc as any).quantity || (gc as any).packing || (gc as any).contents) {
                        // Backward compatibility: convert old single-row data to new format
                        setContentItems([{
                            id: generateId(),
                            qty: (gc as any).quantity || '',
                            packing: (gc as any).packing || '',
                            contents: (gc as any).contents || '',
                            prefix: (gc as any).prefix || '',
                            fromNo: (gc as any).fromNo || 1,
                            packingOption: (gc as any).packing ? { value: (gc as any).packing, label: (gc as any).packing } : null,
                            contentOption: (gc as any).contents ? { value: (gc as any).contents, label: (gc as any).contents } : null,
                        }]);
                    }

                    setLoading(false);
                } else {
                    toast.error('GC Entry not found.');
                    navigate('/gc-entry');
                }
            };
            loadData();
        } else {
            setLoading(false);
        }
    }, [isEditMode, gcNo, fetchGcById, navigate]);

    // --- Async Loaders ---

    const loadConsignorOptions = async (search: string, _prevOptions: any, { page }: any) => {
        const result = await searchConsignors(search, page);
        return {
            options: result.data.map((c: any) => ({ value: c.id, label: c.name, gst: c.gst, from: c.from })),
            hasMore: result.hasMore,
            additional: { page: page + 1 },
        };
    };

    const loadConsignorGstOptions = async (search: string, _prevOptions: any, { page }: any) => {
        const result = await searchConsignors(search, page);
        const gstOptions = result.data
            .filter((c: any) => c.gst)
            .map(mapConsignorToGstOption);

        return {
            options: gstOptions,
            hasMore: result.hasMore,
            additional: { page: page + 1 },
        };
    };

    const loadConsigneeOptions = async (search: string, _prevOptions: any, { page }: any) => {
        const result = await searchConsignees(search, page);
        return {
            options: result.data.map((c: any) => ({ value: c.id, label: c.name, destination: c.destination, gst: c.gst, pan: c.pan, aadhar: c.aadhar })),
            hasMore: result.hasMore,
            additional: { page: page + 1 },
        };
    };

    const loadPlaceOptions = async (search: string, _prevOptions: any, { page }: any) => {
        const result = await searchToPlaces(search, page);
        return {
            options: result.data.map((p: any) => ({ value: p.placeName, label: p.placeName })),
            hasMore: result.hasMore,
            additional: { page: page + 1 },
        };
    };

    const loadPackingOptions = async (search: string, _prevOptions: any, { page }: any) => {
        const result = await searchPackings(search, page);
        return {
            options: result.data.map((p: any) => ({ value: p.packingName, label: p.packingName })),
            hasMore: result.hasMore,
            additional: { page: page + 1 },
        };
    };

    const loadContentOptions = async (search: string, _prevOptions: any, { page }: any) => {
        const result = await searchContents(search, page);
        return {
            options: result.data.map((c: any) => ({ value: c.contentName, label: c.contentName })),
            hasMore: result.hasMore,
            additional: { page: page + 1 },
        };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setForm(prev => {
            // 1. Update the field being typed in
            // Note: For number fields edited directly, this might temporarily assign a string 
            // to a number type depending on your TS configuration, which is common in React forms.
            const newData = { ...prev, [name]: value };

            // 2. Auto-update netQty if quantity changes
            if (name === 'quantity') {
                // Fix: Parse the string 'value' to a number before assigning to netQty
                const parsedQty = parseFloat(value);
                newData.netQty = isNaN(parsedQty) ? 0 : parsedQty;
            }

            return newData;
        });

        // 3. Clear Immediate Errors
        if (formErrors[name]) {
            setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }

        // Clear netQty error if we are auto-updating it
        if (name === 'quantity' && formErrors['netQty']) {
            setFormErrors(prev => { const n = { ...prev }; delete n['netQty']; return n; });
        }

        // 4. Validation Debounce
        if (validationTimeouts.current[name]) {
            clearTimeout(validationTimeouts.current[name]);
        }

        validationTimeouts.current[name] = setTimeout(() => {
            validateField(name, value);
            if (name === 'quantity') {
                // Validate the numeric value we just assigned
                validateField('netQty', value === '' ? 0 : Number(value));
            }
        }, 500);
    };

    const handleFormValueChange = (name: keyof typeof form, value: string | number) => {
        // 1. Update State
        setForm(prev => ({ ...prev, [name]: value as string }));

        // 2. Clear Errors
        if (formErrors[name]) {
            setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }

        // 3. Debounce Validation
        if (validationTimeouts.current[name]) clearTimeout(validationTimeouts.current[name]);

        validationTimeouts.current[name] = setTimeout(() => {
            validateField(name, value);
        }, 500);
    };

    const handleDestinationSelect = (option: any) => {
        setDestinationOption(option);
        const val = option?.value || '';

        setForm(prev => ({ ...prev, destination: val, deliveryAt: val, freightUptoAt: val }));
        setDeliveryOption(option);
        setFreightOption(option);

        // Clear errors immediately
        setFormErrors(prev => {
            const next = { ...prev };
            delete next['destination'];
            delete next['deliveryAt'];
            delete next['freightUptoAt'];
            return next;
        });

        // Validate selection immediately (no delay needed for dropdowns)
        validateField('destination', val);
        validateField('deliveryAt', val);
        validateField('freightUptoAt', val);
    };

    const handleConsignorSelect = (option: any) => {
        setConsignorOption(option);
        const val = option?.value || '';

        if (option) {
            const gst = option.gst || '';
            // FIX: Removed 'from' update so form.from stays as 'Sivakasi' (or current value)
            setForm(prev => ({ ...prev, consignorId: val }));
            setConsignorGst(gst);

            setConsignorGstOption(gst ? {
                value: val,
                label: gst,
                gst: gst,
                consignorName: option.label,
                from: option.from
            } : null);
        } else {
            // FIX: Removed 'from' update
            setForm(prev => ({ ...prev, consignorId: '' }));
            setConsignorGst('');
            setConsignorGstOption(null);
        }

        setFormErrors(prev => { const n = { ...prev }; delete n['consignorId']; return n; });
        validateField('consignorId', val);
    };

    const handleConsignorGstSelect = (option: any) => {
        const val = option?.value || '';

        if (option) {
            const gst = option.gst || '';
            const consignorName = option.consignorName || option.label;

            setConsignorGstOption(option);

            setConsignorOption({
                value: val,
                label: consignorName,
                gst: gst,
                from: option.from
            });

            setConsignorGst(gst);
            // FIX: Removed 'from' update so form.from stays as 'Sivakasi' (or current value)
            setForm(prev => ({
                ...prev,
                consignorId: val,
            }));
        } else {
            setConsignorOption(null);
            setConsignorGst('');
            setConsignorGstOption(null);
            // FIX: Removed 'from' update
            setForm(prev => ({ ...prev, consignorId: '' }));
        }

        setFormErrors(prev => { const n = { ...prev }; delete n['consignorId']; return n; });
        validateField('consignorId', val);
    };

    const handleConsigneeSelect = (option: any) => {
        setConsigneeOption(option);
        const val = option?.value || '';

        if (option) {
            const dest = option.destination || '';
            setConsigneeDestDisplay(dest);

            let proofType: ProofType = 'gst';
            let proofValue = option.gst || '';

            if (!proofValue) { proofType = 'pan'; proofValue = option.pan || ''; }
            if (!proofValue) { proofType = 'aadhar'; proofValue = option.aadhar || ''; }

            setForm(prev => ({
                ...prev,
                consigneeId: val,
                destination: dest,
                deliveryAt: dest,
                freightUptoAt: dest,
                consigneeProofType: proofType,
                consigneeProofValue: proofValue
            }));

            if (dest) {
                const destOpt = { label: dest, value: dest };
                setDestinationOption(destOpt);
                setDeliveryOption(destOpt);
                setFreightOption(destOpt);
            }

        } else {
            setConsigneeDestDisplay('');
            setForm(prev => ({ ...prev, consigneeId: '', consigneeProofType: 'gst', consigneeProofValue: '' }));
        }

        setFormErrors(prev => { const n = { ...prev }; delete n['consigneeId']; return n; });
        validateField('consigneeId', val);
    };

    const handleProofTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProofType = e.target.value as ProofType;

        // 1. Get the correct value based on the selected type from the stored consignee option
        let newProofValue = '';
        if (consigneeOption) {
            if (newProofType === 'gst') {
                newProofValue = consigneeOption.gst || '';
            } else if (newProofType === 'pan') {
                newProofValue = consigneeOption.pan || '';
            } else if (newProofType === 'aadhar') {
                newProofValue = consigneeOption.aadhar || '';
            }
        }

        // 2. Update the form with the new type AND the new value
        setForm(prev => ({
            ...prev,
            consigneeProofType: newProofType,
            consigneeProofValue: newProofValue
        }));

        // 3. Trigger validation for the value field immediately so errors clear/appear
        validateField('consigneeProofValue', newProofValue);
    };

    // --- Content Items Handlers (Static Form Pattern) ---
    const resetCurrentContent = () => {
        setCurrentQty('');
        setCurrentPacking('');
        setCurrentContents('');
        setCurrentPrefix('');
        setCurrentFromNo('1');
        setCurrentPackingOption(null);
        setCurrentContentOption(null);
    };

    const handleAddContent = () => {
        if (!currentQty || !currentPacking || !currentContents) {
            toast.error("Please fill Qty, Packing and Contents before adding.");
            return;
        }

        const newItem: ContentItem = {
            id: generateId(),
            qty: currentQty,
            packing: currentPacking,
            contents: currentContents,
            prefix: currentPrefix,
            fromNo: currentFromNo,
            packingOption: currentPackingOption,
            contentOption: currentContentOption,
        };

        setContentItems(prev => [...prev, newItem]);
        resetCurrentContent();
    };

    const handleDeleteContent = (id: string) => {
        setContentItems(prev => prev.filter(item => item.id !== id));
    };

    // Calculate To No for each content item
    const getToNo = (item: ContentItem) => {
        const fromNoNum = parseFloat(String(item.fromNo)) || 0;
        const qtyNum = parseFloat(String(item.qty)) || 0;
        return (fromNoNum > 0 && qtyNum > 0) ? (fromNoNum + qtyNum) - 1 : 0;
    };

    // Auto-calculate netQty when contentItems change
    useEffect(() => {
        const totalQty = contentItems.reduce((sum, item) => {
            const qty = parseFloat(String(item.qty)) || 0;
            return sum + qty;
        }, 0);
        setForm(prev => ({ ...prev, netQty: totalQty, quantity: totalQty.toString() }));
    }, [contentItems]);

    // --- SAVE & PRINT LOGIC ---
    const handleSave = async (andPrint = false) => {
        setFormErrors({});

        // 1. Validate Form Data against Schema
        const validationResult = gcEntrySchema.safeParse(form);

        if (!validationResult.success) {
            const newErrors: Record<string, string> = {};
            validationResult.error.issues.forEach((err: any) => {
                if (err.path[0]) {
                    newErrors[err.path[0].toString()] = err.message;
                }
            });
            setFormErrors(newErrors);
            toast.error("Please fill all required fields correctly.");
            return;
        }

        // const validatedData = validationResult.data;
        const finalGcNo = isEditMode ? form.gcNo : "";

        // Prepare content items for saving (strip UI-only fields)
        const cleanContentItems = contentItems.map(item => ({
            id: item.id,
            qty: item.qty,
            packing: item.packing,
            contents: item.contents,
            prefix: item.prefix,
            fromNo: item.fromNo,
        }));

        // For backward compatibility, also set packing/contents from first item
        const firstItem = contentItems[0];

        const gcData: any = {
            ...form,
            id: isEditMode ? (form as any).id : undefined,
            gcNo: finalGcNo,
            contentItems: cleanContentItems,
            packing: firstItem?.packing || '',
            contents: firstItem?.contents || '',
            prefix: firstItem?.prefix || '',
            fromNo: firstItem?.fromNo || 1,
        };

        if ((form as any).tripSheetAmount) {
            gcData.tripSheetAmount = (form as any).tripSheetAmount;
        }

        let savedData;
        if (isEditMode) {
            savedData = await updateGcEntry(gcData);
        } else {
            savedData = await addGcEntry(gcData);
        }

        if (savedData) {
            if (andPrint && savedData.gcNo) {
                const printDataArr = await fetchGcPrintData([savedData.gcNo]);

                if (printDataArr && printDataArr.length > 0) {
                    const printItem = printDataArr[0];
                    const job: GcPrintJob = {
                        gc: printItem as GcEntry,
                        consignor: printItem.consignor as Consignor,
                        consignee: printItem.consignee as Consignee
                    };
                    setPrintingJobs([job]);
                } else {
                    toast.error("Saved, but failed to load print data.");
                    navigate('/gc-entry');
                }
            } else {
                navigate('/gc-entry');
            }
        }
    };

    if (loading && isEditMode) return <div className="flex items-center justify-center h-full">Loading...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-5.5rem)]">
            <div className="flex-1 overflow-y-auto p-1">
                <form className="bg-background rounded-xl shadow-sm border border-muted p-6 space-y-6 text-sm">

                    <div>
                        <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">GC Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <Input label="GC Date" type="date" name="gcDate" value={form.gcDate} onChange={handleChange} required {...getValidationProp(form.gcDate)} />
                                {formErrors.gcDate && <p className="text-xs text-red-500 mt-1">{formErrors.gcDate}</p>}
                            </div>
                            <div className="col-span-1">
                                <Input label="From (GC)" name="from" value={form.from} onChange={handleChange} required {...getValidationProp(form.from)} disabled />
                            </div>
                            <div className="col-span-1">
                                <AsyncAutocomplete
                                    label="Destination"
                                    loadOptions={loadPlaceOptions}
                                    value={destinationOption}
                                    onChange={handleDestinationSelect}
                                    placeholder="Search..."
                                    required
                                    defaultOptions={false}
                                    {...getValidationProp(form.destination)}
                                />
                                {formErrors.destination && <p className="text-xs text-red-500 mt-1">{formErrors.destination}</p>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Parties</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
                            <div className="col-span-1 sm:col-span-2 lg:col-span-5">
                                <AsyncAutocomplete
                                    label="Consignor Name"
                                    loadOptions={loadConsignorOptions}
                                    value={consignorOption}
                                    onChange={handleConsignorSelect}
                                    placeholder="Search..."
                                    required
                                    defaultOptions={false}
                                    {...getValidationProp(form.consignorId)}
                                />
                                {formErrors.consignorId && <p className="text-xs text-red-500 mt-1">{formErrors.consignorId}</p>}
                            </div>
                            <div className="col-span-1 lg:col-span-4">
                                <AsyncAutocomplete
                                    label="Consignor GSTIN"
                                    loadOptions={loadConsignorGstOptions}
                                    value={consignorGstOption}
                                    onChange={handleConsignorGstSelect}
                                    placeholder="Search GSTIN..."
                                    required
                                    defaultOptions={false}
                                    {...getValidationProp(consignorGst)}
                                />
                            </div>
                            {/* FIX: Use consignorOption.from instead of form.from to show Consignor's location */}
                            <div className="col-span-1 lg:col-span-3"><Input label="Consignor From" value={consignorOption?.from || ''} disabled required {...getValidationProp(consignorOption?.from || '')} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
                            <div className="col-span-1 sm:col-span-2 lg:col-span-5">
                                <AsyncAutocomplete
                                    label="Consignee Name"
                                    loadOptions={loadConsigneeOptions}
                                    value={consigneeOption}
                                    onChange={handleConsigneeSelect}
                                    placeholder="Search..."
                                    required
                                    defaultOptions={false}
                                    {...getValidationProp(form.consigneeId)}
                                />
                                {formErrors.consigneeId && <p className="text-xs text-red-500 mt-1">{formErrors.consigneeId}</p>}
                            </div>
                            <div className="col-span-1 lg:col-span-3"><Input label="Consignee Dest" value={consigneeDestDisplay} disabled required {...getValidationProp(consigneeDestDisplay)} /></div>
                            <div className="col-span-1 lg:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Proof Type <span className="text-destructive ml-1">*</span>
                                </label>
                                <select
                                    name="consigneeProofType"
                                    value={form.consigneeProofType}
                                    onChange={handleProofTypeChange}
                                    required
                                    className="w-full h-11 px-4 bg-background text-foreground border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:border-primary/50"
                                >
                                    <option value="gst">GST</option>
                                    <option value="pan">PAN</option>
                                    <option value="aadhar">Aadhar</option>
                                </select>
                            </div>
                            <div className="col-span-1 lg:col-span-2"><Input label="Proof Value" name="consigneeProofValue" value={form.consigneeProofValue} onChange={handleChange} disabled required {...getValidationProp(form.consigneeProofValue)} /></div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Routing</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <AsyncAutocomplete
                                    label="Delivery At"
                                    loadOptions={loadPlaceOptions}
                                    value={deliveryOption}
                                    onChange={(v: any) => { setDeliveryOption(v); handleFormValueChange('deliveryAt', v?.value || ''); }}
                                    placeholder=""
                                    required
                                    defaultOptions={false}
                                    {...getValidationProp(form.deliveryAt)}
                                />
                                {formErrors.deliveryAt && <p className="text-xs text-red-500 mt-1">{formErrors.deliveryAt}</p>}
                            </div>
                            <div className="col-span-1">
                                <AsyncAutocomplete
                                    label="Freight Upto"
                                    loadOptions={loadPlaceOptions}
                                    value={freightOption}
                                    onChange={(v: any) => { setFreightOption(v); handleFormValueChange('freightUptoAt', v?.value || ''); }}
                                    placeholder=""
                                    required
                                    defaultOptions={false}
                                    {...getValidationProp(form.freightUptoAt)}
                                />
                                {formErrors.freightUptoAt && <p className="text-xs text-red-500 mt-1">{formErrors.freightUptoAt}</p>}
                            </div>
                            <div className="col-span-1"><Input label="Godown" name="godown" value={form.godown} onChange={handleChange} /></div>
                        </div>
                    </div>

                    <section className="bg-card text-foreground rounded-md p-4 border border-border">
                        <h3 className="text-lg font-bold text-primary border-b border-border pb-2 mb-4 flex justify-between items-center">
                            <span>Contents</span>
                            <span className="text-muted-foreground font-normal text-sm">Net Qty: <span className="text-primary font-bold">{form.netQty}</span></span>
                        </h3>
                        <div className="mb-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
                                <div className="col-span-1">
                                    <Input
                                        label="Qty"
                                        type="number"
                                        value={currentQty}
                                        onChange={(e) => setCurrentQty(e.target.value)}
                                        placeholder="Qty"
                                        min="1"
                                        required
                                        className="bg-background text-foreground border-border"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Input
                                        label="From No"
                                        type="number"
                                        value={currentFromNo}
                                        onChange={(e) => setCurrentFromNo(e.target.value)}
                                        placeholder="From"
                                        min="1"
                                        className="bg-background text-foreground border-border"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-2 lg:col-span-2">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Packing <span className='text-red-500'>*</span></label>
                                    <AsyncAutocomplete
                                        loadOptions={loadPackingOptions}
                                        value={currentPackingOption}
                                        onChange={(v: any) => {
                                            setCurrentPackingOption(v);
                                            setCurrentPacking(v?.value || '');
                                        }}
                                        placeholder="Search packing..."
                                        defaultOptions={false}
                                        className="text-foreground" // Ensure text is visible in dark mode
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-2 lg:col-span-2">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Contents <span className='text-red-500'>*</span></label>
                                    <AsyncAutocomplete
                                        loadOptions={loadContentOptions}
                                        value={currentContentOption}
                                        onChange={(v: any) => {
                                            setCurrentContentOption(v);
                                            setCurrentContents(v?.value || '');
                                        }}
                                        placeholder="Search contents..."
                                        defaultOptions={false}
                                        className="text-foreground"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <Input
                                        label="Prefix"
                                        value={currentPrefix}
                                        onChange={(e) => setCurrentPrefix(e.target.value)}
                                        placeholder="Prefix"
                                        className="bg-background text-foreground border-border"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1 lg:col-span-1">
                                    <label className="block text-sm font-medium text-transparent mb-1 hidden sm:block">&nbsp;</label>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        className="w-full text-white bg-primary hover:bg-primary/90"
                                        onClick={handleAddContent}
                                    >
                                        <Plus size={16} className="mr-1" /> Add
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Added Items Table */}
                        <div className="overflow-x-auto border border-border rounded-md">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/20">
                                        <th className="border border-muted p-2 min-w-[50px]">QTY</th>
                                        <th className="border border-muted p-2 min-w-[80px]">FROM NO</th>
                                        <th className="border border-muted p-2 min-w-[80px]">TO NO</th>
                                        <th className="border border-muted p-2 min-w-[120px]">PACKING</th>
                                        <th className="border border-muted p-2 min-w-[150px]">CONTENTS</th>
                                        <th className="border border-muted p-2 min-w-[80px]">PREFIX</th>
                                        <th className="border border-muted p-2 min-w-[40px]">DEL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contentItems.map((item) => (
                                        <tr key={item.id} className="even:bg-muted/20">
                                            <td className="border border-muted p-2 text-center">{item.qty}</td>
                                            <td className="border border-muted p-2 text-center">{item.fromNo}</td>
                                            <td className="border border-muted p-2 text-center">{getToNo(item) > 0 ? getToNo(item) : '-'}</td>
                                            <td className="border border-muted p-2">{item.packing}</td>
                                            <td className="border border-muted p-2">{item.contents}</td>
                                            <td className="border border-muted p-2 text-center">{item.prefix}</td>
                                            <td className="border border-muted p-2 text-center">
                                                <button type="button" className="text-destructive hover:text-red-700" onClick={() => handleDeleteContent(item.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {contentItems.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center p-3 text-muted-foreground bg-background">
                                                No content items added. Use the form above to add items.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Error Messages */}
                        {formErrors.quantity && <p className="text-xs text-destructive mt-2">{formErrors.quantity}</p>}
                        {formErrors.packing && <p className="text-xs text-destructive mt-1">{formErrors.packing}</p>}
                        {formErrors.contents && <p className="text-xs text-destructive mt-1">{formErrors.contents}</p>}
                    </section>

                    <div>
                        <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Billing & Payment</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                            <div className="col-span-1">
                                <Input label="Bill No" name="billNo" value={form.billNo} onChange={handleChange} required {...getValidationProp(form.billNo)} />
                                {formErrors.billNo && <p className="text-xs text-red-500 mt-1">{formErrors.billNo}</p>}
                            </div>
                            <div className="col-span-1">
                                <Input label="Bill Value" name="billValue" placeholder='0' value={form.billValue} onChange={handleChange} required {...getValidationProp(form.billValue)} />
                                {formErrors.billValue && <p className="text-xs text-red-500 mt-1">{formErrors.billValue}</p>}
                            </div>
                            <div className="col-span-1"><Input label="Toll" name="tollFee" value={form.tollFee} onChange={handleChange} /></div>
                            <div className="col-span-1"><Input label="Freight" name="freight" value={form.freight} onChange={handleChange} /></div>
                            <div className="col-span-1"><Input label="Godown" name="godownCharge" value={form.godownCharge} onChange={handleChange} /></div>
                            <div className="col-span-1"><Input label="Statistic" name="statisticCharge" value={form.statisticCharge} onChange={handleChange} /></div>
                            <div className="col-span-1"><Input label="Advance" name="advanceNone" value={form.advanceNone} onChange={handleChange} /></div>
                            <div className="col-span-1"><Input label="Balance" name="balanceToPay" value={form.balanceToPay} onChange={handleChange} /></div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <RadioGroup
                            label="Payment Type"
                            options={[
                                { value: 'To Pay', label: 'To Pay' },
                                { value: 'Paid', label: 'Paid' }
                            ]}
                            value={form.paymentType}
                            onChange={(value) => handleFormValueChange('paymentType', value)}
                        />
                    </div>
                </form>
            </div>

            <div className="p-4 border-t border-muted bg-background flex flex-col sm:flex-row justify-end gap-3 mt-auto shadow-md z-10">
                <Button type="button" variant="secondary" onClick={() => navigate('/gc-entry')}><X size={16} />Cancel</Button>
                <Button type="button" variant="secondary" onClick={() => handleSave(true)}><Printer size={16} />Save & Print</Button>
                <Button type="button" variant="primary" onClick={() => handleSave(false)}><Save size={16} />{isEditMode ? 'Update' : 'Save'}</Button>
            </div>

            {printingJobs && (
                <GcPrintManager
                    jobs={printingJobs}
                    onClose={() => {
                        setPrintingJobs(null);
                        navigate('/gc-entry');
                    }}
                />
            )}
        </div>
    );
};