import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import type { GcEntry, Consignee, Consignor } from '../../types';
import { getTodayDate } from '../../utils/dateHelpers';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { AsyncAutocomplete } from '../../components/shared/AsyncAutocomplete'; 
import { Printer, Save, X } from 'lucide-react';
import { GcPrintManager, type GcPrintJob } from './GcPrintManager';
import { useToast } from '../../contexts/ToastContext';
import { gcEntrySchema } from '../../schemas';

type ProofType = 'gst' | 'pan' | 'aadhar';

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
        billValue: "0",
        tollFee: "0",
        freight: "0",
        godownCharge: "0",
        statisticCharge: "0",
        advanceNone: "0",
        balanceToPay: "0",
        quantity: "",
        packing: '',
        contents: '',
        prefix: '',
        fromNo: "1",
        netQty: "",
        paymentType: 'To Pay', 
    });
    
    const [printingJobs, setPrintingJobs] = useState<GcPrintJob[] | null>(null);
    
    // UI State for Autocompletes & Display Fields
    const [consignorOption, setConsignorOption] = useState<any>(null);
    const [consignorGst, setConsignorGst] = useState('');

    const [consigneeOption, setConsigneeOption] = useState<any>(null);
    const [destinationOption, setDestinationOption] = useState<any>(null);
    const [packingOption, setPackingOption] = useState<any>(null);
    const [contentOption, setContentOption] = useState<any>(null);
    const [deliveryOption, setDeliveryOption] = useState<any>(null);
    const [freightOption, setFreightOption] = useState<any>(null);
    
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
        } catch (e) {}
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
                        billValue: (gc.billValue || 0).toString(),
                        tollFee: (gc.tollFee || 0).toString(),
                        freight: (gc.freight || 0).toString(),
                        godownCharge: (gc.godownCharge || 0).toString(),
                        statisticCharge: backendStatistic.toString(),
                        advanceNone: (gc.advanceNone || 0).toString(),
                        balanceToPay: displayBalance.toString(),
                        paymentType: gc.paymentType || 'To Pay' 
                    });

                    if (gc.consignorId && (gc as any).consignorName) {
                        const gst = (gc as any).consignorGSTIN || '';
                        const consignorName = (gc as any).consignorName;
                        
                        setConsignorOption({ 
                            value: gc.consignorId, 
                            label: consignorName, 
                            gst: gst,
                            from: gc.from 
                        });
                        
                        setConsignorGst(gst);
                        
                        if (gst) {
                            setConsignorGstOption({ 
                                value: gc.consignorId, 
                                label: gst, 
                                gst: gst,
                                consignorName: consignorName,
                                from: gc.from
                            }); 
                        } else {
                            setConsignorGstOption(null);
                        }
                    }

                    if (gc.consigneeId && (gc as any).consigneeName) {
                        setConsigneeOption({ value: gc.consigneeId, label: (gc as any).consigneeName });
                        setConsigneeDestDisplay(gc.destination || '');
                    }

                    if (gc.destination) setDestinationOption({ value: gc.destination, label: gc.destination });
                    if (gc.packing) setPackingOption({ value: gc.packing, label: gc.packing });
                    if (gc.contents) setContentOption({ value: gc.contents, label: gc.contents });
                    if (gc.deliveryAt) setDeliveryOption({ value: gc.deliveryAt, label: gc.deliveryAt });
                    if (gc.freightUptoAt) setFreightOption({ value: gc.freightUptoAt, label: gc.freightUptoAt });

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

    // --- Handlers with Debounced Validation ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // 1. Update State
        setForm(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'quantity') newData.netQty = value;
            return newData;
        });

        // 2. Clear Immediate Errors
        if (formErrors[name]) {
            setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }

        // 3. Clear Timeout
        if (validationTimeouts.current[name]) {
            clearTimeout(validationTimeouts.current[name]);
        }

        // 4. Delayed Validation
        validationTimeouts.current[name] = setTimeout(() => {
            validateField(name, value);
            // Also validate dependent fields
            if (name === 'quantity') validateField('netQty', value);
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
            setForm(prev => ({ ...prev, consignorId: val, from: option.from || 'Sivakasi' })); 
            setConsignorGst(gst); 

            setConsignorGstOption(gst ? { 
                value: val, 
                label: gst, 
                gst: gst,
                consignorName: option.label,
                from: option.from
            } : null);
        } else { 
            setForm(prev => ({ ...prev, consignorId: '', from: 'Sivakasi' })); 
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
            setForm(prev => ({ 
                ...prev, 
                consignorId: val, 
                from: option.from || 'Sivakasi' 
            }));
        } else {
            setConsignorOption(null);
            setConsignorGst('');
            setConsignorGstOption(null);
            setForm(prev => ({ ...prev, consignorId: '', from: 'Sivakasi' }));
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

            if(dest) {
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
        setForm(prev => ({ ...prev, consigneeProofType: newProofType, consigneeProofValue: '' }));
    };

    const fromNoNum = parseFloat(form.fromNo) || 0;
    const quantityNum = parseFloat(form.quantity) || 0;
    const toNo = (fromNoNum > 0 && quantityNum > 0) ? (fromNoNum + quantityNum) - 1 : 0;

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

        const validatedData = validationResult.data;
        const finalGcNo = isEditMode ? form.gcNo : ""; 
        
        const gcData: any = { 
            ...validatedData, 
            id: isEditMode ? (form as any).id : undefined, 
            gcNo: finalGcNo 
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
                                    { ...getValidationProp(form.consignorId)} 
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
                                    { ...getValidationProp(consignorGst)} 
                                />
                            </div>
                            <div className="col-span-1 lg:col-span-3"><Input label="Consignor From" value={form.from} disabled required { ...getValidationProp(form.from)} /></div>
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
                            <div className="col-span-1 lg:col-span-3"><Input label="Consignee Dest" value={consigneeDestDisplay} disabled required { ...getValidationProp(consigneeDestDisplay)} /></div>
                            <div className="col-span-1 lg:col-span-2">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Proof Type *</label>
                                <select name="consigneeProofType" value={form.consigneeProofType} onChange={handleProofTypeChange} className="w-full px-2 py-2 border border-muted-foreground/30 rounded-md bg-background text-xs focus:outline-none focus:ring-primary focus:border-primary"><option value="gst">GST</option><option value="pan">PAN</option><option value="aadhar">Aadhar</option></select>
                            </div>
                            <div className="col-span-1 lg:col-span-2"><Input label="Proof Value" name="consigneeProofValue" value={form.consigneeProofValue} onChange={handleChange} required { ...getValidationProp(form.consigneeProofValue)} /></div>
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
                                    { ...getValidationProp(form.deliveryAt)} 
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
                                    { ...getValidationProp(form.freightUptoAt)} 
                                />
                                {formErrors.freightUptoAt && <p className="text-xs text-red-500 mt-1">{formErrors.freightUptoAt}</p>}
                            </div>
                            <div className="col-span-1"><Input label="Godown" name="godown" value={form.godown} onChange={handleChange} /></div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Contents</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            <div className="col-span-1">
                                <Input label="Qty" name="quantity" value={form.quantity} onChange={handleChange} required {...getValidationProp(form.quantity)} />
                                {formErrors.quantity && <p className="text-xs text-red-500 mt-1">{formErrors.quantity}</p>}
                            </div>
                            <div className="col-span-1">
                                <Input label="From No" name="fromNo" value={form.fromNo} onChange={handleChange} required { ...getValidationProp(form.fromNo)} />
                                {formErrors.fromNo && <p className="text-xs text-red-500 mt-1">{formErrors.fromNo}</p>}
                            </div>
                            <div className="col-span-1"><Input label="To No" value={toNo > 0 ? toNo : ''} disabled /></div>
                            <div className="col-span-1">
                                <Input label="Net Qty" name="netQty" value={form.netQty} onChange={handleChange} required { ...getValidationProp(form.netQty)} />
                                {formErrors.netQty && <p className="text-xs text-red-500 mt-1">{formErrors.netQty}</p>}
                            </div>
                            <div className="col-span-1">
                                <AsyncAutocomplete 
                                    label="Packing" 
                                    loadOptions={loadPackingOptions} 
                                    value={packingOption} 
                                    onChange={(v: any) => { setPackingOption(v); handleFormValueChange('packing', v?.value || ''); }} 
                                    placeholder="" 
                                    required 
                                    defaultOptions={false}
                                    { ...getValidationProp(form.packing)} 
                                />
                                {formErrors.packing && <p className="text-xs text-red-500 mt-1">{formErrors.packing}</p>}
                            </div>
                            <div className="col-span-1">
                                <AsyncAutocomplete 
                                    label="Contents" 
                                    loadOptions={loadContentOptions} 
                                    value={contentOption} 
                                    onChange={(v: any) => { setContentOption(v); handleFormValueChange('contents', v?.value || ''); }} 
                                    placeholder="" 
                                    required 
                                    defaultOptions={false}
                                    { ...getValidationProp(form.contents)} 
                                />
                                {formErrors.contents && <p className="text-xs text-red-500 mt-1">{formErrors.contents}</p>}
                            </div>
                            <div className="col-span-1"><Input label="Prefix" name="prefix" value={form.prefix} onChange={handleChange} /></div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Billing & Payment</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                            <div className="col-span-1">
                                <Input label="Bill No" name="billNo" value={form.billNo} onChange={handleChange} required { ...getValidationProp(form.billNo)} />
                                {formErrors.billNo && <p className="text-xs text-red-500 mt-1">{formErrors.billNo}</p>}
                            </div>
                            <div className="col-span-1">
                                <Input label="Bill Value" name="billValue" value={form.billValue} onChange={handleChange} required { ...getValidationProp(form.billValue)} />
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
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="paymentType" 
                                    value="To Pay" 
                                    checked={form.paymentType === 'To Pay'} 
                                    onChange={() => handleFormValueChange('paymentType', 'To Pay')} 
                                    className="w-4 h-4 text-primary" 
                                />
                                <span className="text-sm font-medium">To Pay</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="paymentType" 
                                    value="Paid" 
                                    checked={form.paymentType === 'Paid'} 
                                    onChange={() => handleFormValueChange('paymentType', 'Paid')} 
                                    className="w-4 h-4 text-primary" 
                                />
                                <span className="text-sm font-medium">Paid</span>
                            </label>
                        </div>
                    </div>
                </form>
            </div>

            <div className="p-4 border-t border-muted bg-background flex flex-col sm:flex-row justify-end gap-3 mt-auto shadow-md z-10">
                <Button type="button" variant="secondary" onClick={() => navigate('/gc-entry')}><X size={16} className="mr-2" />Cancel</Button>
                <Button type="button" variant="secondary" onClick={() => handleSave(true)}><Printer size={16} className="mr-2" />Save & Print</Button>
                <Button type="button" variant="primary" onClick={() => handleSave(false)}><Save size={16} className="mr-2" />{isEditMode ? 'Update' : 'Save'}</Button>
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
