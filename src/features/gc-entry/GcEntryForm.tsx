import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import type { GcEntry, Consignee } from '../../types';
import { getTodayDate } from '../../utils/dateHelpers';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { AutocompleteInput } from '../../components/shared/AutocompleteInput';
import { Printer, Save, X } from 'lucide-react';
import { GcPrintManager, type GcPrintJob } from './GcPrintManager';

type ProofType = 'gst' | 'pan' | 'aadhar';

export const GcEntryForm = () => {
  const { gcNo } = useParams<{ gcNo: string }>(); 
  const navigate = useNavigate();
  const { 
    consignors, 
    consignees, 
    getNextGcNo, 
    addGcEntry, 
    updateGcEntry, 
    fetchGcById, 
    getUniqueDests,
    getPackingTypes,
    getContentsTypes,
  } = useData();
  
  const isEditMode = !!gcNo;
  const [loading, setLoading] = useState(isEditMode);
  
  // Initial State
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
  const [consignorGst, setConsignorGst] = useState('');
  const [consigneeDestDisplay, setConsigneeDestDisplay] = useState('');
  const [selectedConsignee, setSelectedConsignee] = useState<Consignee | null>(null);

  // --- Load Data Effect ---
  useEffect(() => {
    if (isEditMode && gcNo) {
      const loadData = async () => {
        // Fetch GC data (backend now includes tripSheetAmount via lookup if linked)
        const gc = await fetchGcById(gcNo);
        
        if (gc) {
          // --- LOGIC: If tripSheetAmount exists (populated by backend), use it for display
          // Otherwise fall back to the stored balanceToPay
          // 'tripSheetAmount' is a virtual field from aggregation
          const tripAmount = (gc as any).tripSheetAmount;
          
          const displayBalance = (tripAmount !== undefined && tripAmount !== null)
            ? tripAmount.toString() 
            : gc.balanceToPay;

          setForm({
            ...gc,
            balanceToPay: displayBalance,
            paymentType: gc.paymentType || 'To Pay' 
          });

          // Pre-fill related UI fields
          const consignor = consignors.find(c => c.id === gc.consignorId);
          if (consignor) setConsignorGst(consignor.gst);
          
          const consignee = consignees.find(c => c.id === gc.consigneeId);
          if (consignee) {
            setSelectedConsignee(consignee);
            setConsigneeDestDisplay(consignee.destination);
          }
          setLoading(false);
        } else {
          alert('GC Entry not found.');
          navigate('/gc-entry');
        }
      };
      loadData();
    } else {
      setLoading(false);
    }
  }, [isEditMode, gcNo, fetchGcById, consignors, consignees, navigate]);

  const consignorOptions = useMemo(() => consignors.map(c => ({ value: c.id, label: c.name })), [consignors]);
  const consigneeOptions = useMemo(() => consignees.map(c => ({ value: c.id, label: c.name })), [consignees]);
  const destinationOptions = useMemo(getUniqueDests, [getUniqueDests]);
  const packingOptions = useMemo(getPackingTypes, [getPackingTypes]);
  const contentsOptions = useMemo(getContentsTypes, [getContentsTypes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'quantity') newData.netQty = value;
      // Auto-calculation is removed per requirement, balance is manual or trip-sheet based
      return newData;
    });
  };

  const handleFormValueChange = (name: keyof typeof form, value: string | number) => { setForm(prev => ({ ...prev, [name]: value as string })); };
  const handleDestinationSelect = (dest: string) => { setForm(prev => ({ ...prev, destination: dest, deliveryAt: dest, freightUptoAt: dest })); };
  
  const handleConsignorSelect = (id: string) => {
    const consignor = consignors.find(c => c.id === id);
    if (consignor) { setForm(prev => ({ ...prev, consignorId: id, from: consignor.from })); setConsignorGst(consignor.gst); } 
    else { setForm(prev => ({ ...prev, consignorId: '', from: 'Sivakasi' })); setConsignorGst(''); }
  };
  
  const handleConsigneeSelect = (id: string) => {
    const consignee = consignees.find(c => c.id === id);
    setSelectedConsignee(consignee || null);
    if (consignee) {
      const dest = consignee.destination;
      setConsigneeDestDisplay(dest);
      let proofType: ProofType = 'gst'; let proofValue = consignee.gst || '';
      if (!proofValue) { proofType = 'pan'; proofValue = consignee.pan || ''; }
      if (!proofValue) { proofType = 'aadhar'; proofValue = consignee.aadhar || ''; }
      setForm(prev => ({ ...prev, consigneeId: id, destination: dest, deliveryAt: dest, freightUptoAt: dest, consigneeProofType: proofType, consigneeProofValue: proofValue }));
    } else { setConsigneeDestDisplay(''); setForm(prev => ({ ...prev, consigneeId: '', consigneeProofType: 'gst', consigneeProofValue: '' })); }
  };
  
  const handleProofTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProofType = e.target.value as ProofType; let newProofValue = '';
    if (selectedConsignee) newProofValue = selectedConsignee[newProofType] || '';
    setForm(prev => ({ ...prev, consigneeProofType: newProofType, consigneeProofValue: newProofValue }));
  };

  const fromNoNum = parseFloat(form.fromNo) || 0;
  const quantityNum = parseFloat(form.quantity) || 0;
  const toNo = (fromNoNum > 0 && quantityNum > 0) ? (fromNoNum + quantityNum) - 1 : 0;

  const handleSave = async (andPrint = false) => {
    if (!form.consignorId || !form.consigneeId) { alert('Please select a Consignor and Consignee.'); return; }
    const finalGcNo = isEditMode ? form.gcNo! : await getNextGcNo();
    const gcData: GcEntry = { ...form, id: isEditMode ? (form as any).id : undefined, gcNo: finalGcNo } as GcEntry;

    // Preserve the tripSheetAmount if it was injected during load, so print uses it
    if ((form as any).tripSheetAmount) {
        (gcData as any).tripSheetAmount = (form as any).tripSheetAmount;
    }

    if (isEditMode) await updateGcEntry(gcData); else await addGcEntry(gcData);

    if (andPrint) {
      const consignor = consignors.find(c => c.id === gcData.consignorId);
      const consignee = consignees.find(c => c.id === gcData.consigneeId);
      if (consignor && consignee) setPrintingJobs([{ gc: gcData, consignor, consignee }]);
      else { alert("Error: Cannot find consignor/consignee data."); navigate('/gc-entry'); }
    } else {
      navigate('/gc-entry');
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
                <Input label="GC Date" type="date" name="gcDate" value={form.gcDate} onChange={handleChange} required />
              </div>
              <div className="col-span-1">
                <Input label="From (GC)" name="from" value={form.from} onChange={handleChange} required disabled />
              </div>
              <div className="col-span-1">
                <AutocompleteInput label="Destination" options={destinationOptions} value={form.destination} onSelect={handleDestinationSelect} placeholder="" required />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Parties</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 mb-4">
              <div className="col-span-1 sm:col-span-2 lg:col-span-5"><AutocompleteInput label="Consignor Name" options={consignorOptions} value={form.consignorId} onSelect={handleConsignorSelect} placeholder="" required /></div>
              <div className="col-span-1 lg:col-span-4"><Input label="Consignor GSTIN" value={consignorGst} disabled required/></div>
              <div className="col-span-1 lg:col-span-3"><Input label="Consignor From" value={form.from} disabled required/></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
              <div className="col-span-1 sm:col-span-2 lg:col-span-5"><AutocompleteInput label="Consignee Name" options={consigneeOptions} value={form.consigneeId} onSelect={handleConsigneeSelect} placeholder="" required /></div>
              <div className="col-span-1 lg:col-span-3"><Input label="Consignee Dest" value={consigneeDestDisplay} disabled required/></div>
              <div className="col-span-1 lg:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Proof Type *</label>
                <select name="consigneeProofType" value={form.consigneeProofType} onChange={handleProofTypeChange} className="w-full px-2 py-2 border border-muted-foreground/30 rounded-md bg-background text-xs focus:outline-none focus:ring-primary focus:border-primary"><option value="gst">GST</option><option value="pan">PAN</option><option value="aadhar">Aadhar</option></select>
              </div>
              <div className="col-span-1 lg:col-span-2"><Input label="Proof Value" name="consigneeProofValue" value={form.consigneeProofValue} onChange={handleChange} required /></div>
            </div>
          </div>

          <div>
             <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Routing</h3>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="col-span-1"><AutocompleteInput label="Delivery At" options={destinationOptions} value={form.deliveryAt} onSelect={(v) => handleFormValueChange('deliveryAt', v)} placeholder="" required /></div>
              <div className="col-span-1"><AutocompleteInput label="Freight Upto" options={destinationOptions} value={form.freightUptoAt} onSelect={(v) => handleFormValueChange('freightUptoAt', v)} placeholder="" required /></div>
              <div className="col-span-1"><Input label="Godown" name="godown" value={form.godown} onChange={handleChange} required/></div>
            </div>
          </div>

          <div>
             <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Contents</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="col-span-1"><Input label="Qty" name="quantity" value={form.quantity} onChange={handleChange} required /></div>
              <div className="col-span-1"><Input label="From No" name="fromNo" value={form.fromNo} onChange={handleChange} required /></div>
              <div className="col-span-1"><Input label="To No" value={toNo > 0 ? toNo : ''} disabled /></div>
              <div className="col-span-1"><Input label="Net Qty" name="netQty" value={form.netQty} onChange={handleChange} required /></div>
              <div className="col-span-1"><AutocompleteInput label="Packing" options={packingOptions} value={form.packing} onSelect={(v) => handleFormValueChange('packing', v)} placeholder="" required /></div>
              <div className="col-span-1"><AutocompleteInput label="Contents" options={contentsOptions} value={form.contents} onSelect={(v) => handleFormValueChange('contents', v)} placeholder="" required /></div>
              <div className="col-span-1"><Input label="Prefix" name="prefix" value={form.prefix} onChange={handleChange} /></div>
            </div>
          </div>

          <div>
             <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Billing & Payment</h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="col-span-1"><Input label="Bill No" name="billNo" value={form.billNo} onChange={handleChange} /></div>
              <div className="col-span-1"><Input label="Bill Value" name="billValue" value={form.billValue} onChange={handleChange} /></div>
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
      {printingJobs && <GcPrintManager jobs={printingJobs} onClose={() => { setPrintingJobs(null); navigate('/gc-entry'); }} />}
    </div>
  );
};