import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import type { GcEntry, Consignee } from '../../types';
import { getTodayDate } from '../../utils/dateHelpers';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { AutocompleteInput } from '../../components/shared/AutocompleteInput';
import { RadioGroup } from '../../components/shared/RadioGroup';
import { ArrowLeft, Printer, Save } from 'lucide-react';

// --- Import the new print manager and its job type ---
import { GcPrintManager, type GcPrintJob } from './GcPrintManager';

// Type for the proof dropdown
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
    getGcEntry,
    getUniqueDests,
    getPackingTypes,
    getContentsTypes,
  } = useData();
  
  const isEditMode = !!gcNo;
  const [loading, setLoading] = useState(isEditMode);
  
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
    paidType: 'To Pay',
  });
  
  // --- NEW STATE for printing ---
  const [printingJobs, setPrintingJobs] = useState<GcPrintJob[] | null>(null);

  const [consignorGst, setConsignorGst] = useState('');
  const [selectedConsignee, setSelectedConsignee] = useState<Consignee | null>(null);
  const [consigneeDestDisplay, setConsigneeDestDisplay] = useState('');

  useEffect(() => {
    if (isEditMode && gcNo) {
      const gc = getGcEntry(gcNo);
      if (gc) {
        setForm(gc);
        
        const consignor = consignors.find(c => c.id === gc.consignorId);
        if (consignor) setConsignorGst(consignor.gst);
        
        const consignee = consignees.find(c => c.id === gc.consigneeId);
        if (consignee) {
          setSelectedConsignee(consignee);
          setConsigneeDestDisplay(consignee.destination);
        }
      } else {
        alert('GC Entry not found.');
        navigate('/gc-entry');
      }
      setLoading(false);
    }
    // We add 'getGcEntry' etc. to the dependency array for completeness
    // Note: 'loading' is set to false, so this effect shouldn't re-run.
  }, [isEditMode, gcNo, getGcEntry, consignors, consignees, navigate]);

  const consignorOptions = useMemo(() => 
    consignors.map(c => ({ value: c.id, label: c.name })), [consignors]);

  const consigneeOptions = useMemo(() => 
    consignees.map(c => ({ value: c.id, label: c.name })), [consignees]);

  const destinationOptions = useMemo(getUniqueDests, [getUniqueDests]);
  const packingOptions = useMemo(getPackingTypes, [getPackingTypes]);
  const contentsOptions = useMemo(getContentsTypes, [getContentsTypes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormValueChange = (name: keyof typeof form, value: string | number) => {
    setForm(prev => ({ ...prev, [name]: value as string }));
  };

  const handleDestinationSelect = (dest: string) => {
    setForm(prev => ({
      ...prev,
      destination: dest,
      deliveryAt: dest,
      freightUptoAt: dest,
    }));
  };

  const handleConsignorSelect = (id: string) => {
    const consignor = consignors.find(c => c.id === id);
    if (consignor) {
      setForm(prev => ({ ...prev, consignorId: id, from: consignor.from }));
      setConsignorGst(consignor.gst);
    } else {
      setForm(prev => ({ ...prev, consignorId: '', from: 'Sivakasi' }));
      setConsignorGst('');
    }
  };
  
  const handleConsigneeSelect = (id: string) => {
    const consignee = consignees.find(c => c.id === id);
    setSelectedConsignee(consignee || null);
    
    if (consignee) {
      const dest = consignee.destination;
      setConsigneeDestDisplay(dest);
      
      let proofType: ProofType = 'gst';
      let proofValue = consignee.gst || '';
      if (!proofValue) {
        proofType = 'pan';
        proofValue = consignee.pan || '';
      }
      if (!proofValue) {
        proofType = 'aadhar';
        proofValue = consignee.aadhar || '';
      }
      
      setForm(prev => ({ 
        ...prev, 
        consigneeId: id,
        destination: dest,
        deliveryAt: dest,
        freightUptoAt: dest,
        consigneeProofType: proofType,
        consigneeProofValue: proofValue,
      }));
    } else {
      setConsigneeDestDisplay('');
      setForm(prev => ({
        ...prev,
        consigneeId: '',
        consigneeProofType: 'gst',
        consigneeProofValue: '',
      }));
    }
  };

  const handleProofTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProofType = e.target.value as ProofType;
    let newProofValue = '';
    
    if (selectedConsignee) {
      // @ts-ignore
      newProofValue = selectedConsignee[newProofType] || '';
    }
    
    setForm(prev => ({
      ...prev,
      consigneeProofType: newProofType,
      consigneeProofValue: newProofValue,
    }));
  };

  const fromNoNum = parseFloat(form.fromNo) || 0;
  const quantityNum = parseFloat(form.quantity) || 0;
  const toNo = (fromNoNum > 0 && quantityNum > 0) ? (fromNoNum + quantityNum) - 1 : 0;
  
  const finalGcNo = isEditMode ? gcNo! : getNextGcNo();

  // --- UPDATED SAVE HANDLER ---
  const handleSave = (andPrint = false) => {
    if (!form.consignorId || !form.consigneeId) {
      alert('Please select a Consignor and Consignee.');
      return;
    }
    
    const gcData: GcEntry = { ...form, id: finalGcNo };
    
    // Save the data
    if (isEditMode) updateGcEntry(gcData);
    else addGcEntry(gcData);
    
    if (andPrint) {
      // Get data for printing
      const consignor = consignors.find(c => c.id === gcData.consignorId);
      const consignee = consignees.find(c => c.id === gcData.consigneeId);

      if (consignor && consignee) {
        // Set state to trigger print manager
        // We do NOT navigate here
        setPrintingJobs([{ gc: gcData, consignor, consignee }]);
      } else {
        alert("Error: Cannot find consignor/consignee data. Navigating without printing.");
        navigate('/gc-entry'); // Fallback
      }
    } else {
      // If not printing, navigate immediately
      navigate('/gc-entry');
    }
  };

  if (loading && isEditMode) { // Only show loading in edit mode
    return <div className="flex items-center justify-center h-full">Loading GC Data...</div>;
  }

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

        {/* HEADER — Back Arrow LEFT, Title RIGHT */}
      <div className="w-full flex items-center justify-between px-1 mb-6">
        <button
          type="button"
          onClick={() => navigate('/gc-entry')}
          className="p-2 rounded-md hover:bg-muted transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground whitespace-nowrap">
          {isEditMode ? `Edit GC No: ${gcNo}` : 'Add New GC Entry'}
        </h1>
      </div>

        {/* FORM BODY */}
        <div className="bg-background rounded-lg shadow border border-muted p-4 md:p-8">
          <div className="space-y-8">

            {/* GC DETAILS */}
            <div>
              <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">GC Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Input label="GC No" id="gcNo" name="gcNo" value={finalGcNo} disabled />
                <Input label="GC Date" id="gcDate" name="gcDate" type="date" value={form.gcDate} onChange={handleChange} required />
                <Input label="From (GC)" id="from-gc" name="from" value={form.from} onChange={handleChange} required disabled />
                <AutocompleteInput
                  label="Destination (GC)"
                  options={destinationOptions}
                  value={form.destination}
                  onSelect={handleDestinationSelect}
                  placeholder="Type to search destination..."
                  required
                />
              </div>
            </div>

            {/* PARTIES */}
            <div>
              <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">Parties</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                  <AutocompleteInput
                    label="Consignor Name"
                    options={consignorOptions}
                    value={form.consignorId}
                    onSelect={handleConsignorSelect}
                    placeholder="Type to search consignor..."
                    required
                  />
                </div>

                <Input label="Consignor GSTIN" id="consignorGst" name="consignorGst" value={consignorGst} disabled />
                <Input label="Consignor From" id="consignorFrom" name="consignorFrom" value={form.from} disabled />

                <div className="md:col-span-2">
                  <AutocompleteInput
                    label="Consignee Name"
                    options={consigneeOptions}
                    value={form.consigneeId}
                    onSelect={handleConsigneeSelect}
                    placeholder="Type to search consignee..."
                    required
                  />
                </div>

                <Input 
                  label="Consignee Destination" 
                  id="consigneeDest" 
                  name="consigneeDest" 
                  value={consigneeDestDisplay} 
                  disabled 
                />

                <div className="flex items-end gap-2">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Proof Type <span className="text-destructive">*</span></label>
                    <select 
                      name="consigneeProofType"
                      value={form.consigneeProofType}
                      onChange={handleProofTypeChange}
                      className="w-full mt-1 px-3 py-2 border border-muted-foreground/30 rounded-md shadow-sm bg-background"
                      required
                    >
                      <option value="gst">GST</option>
                      <option value="pan">PAN</option>
                      <option value="aadhar">Aadhar</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <Input 
                    label="Consignee Proof Value" 
                    id="consigneeProofValue" 
                    name="consigneeProofValue" 
                    value={form.consigneeProofValue} 
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ROUTING */}
            <div>
              <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">Routing & Dates</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Input label="Bill Date" id="billDate" name="billDate" type="date" value={form.billDate} onChange={handleChange} required />
                <AutocompleteInput
                  label="Delivery At"
                  options={destinationOptions}
                  value={form.deliveryAt}
                  onSelect={(value) => handleFormValueChange('deliveryAt', value as string)}
                  placeholder="Type to search destination..."
                  required
                />
                <AutocompleteInput
                  label="Freight Upto At"
                  options={destinationOptions}
                  value={form.freightUptoAt}
                  onSelect={(value) => handleFormValueChange('freightUptoAt', value as string)}
                  placeholder="Type to search destination..."
                  required
                />
                <Input 
                  label="Godown" 
                  id="godown" 
                  name="godown" 
                  value={form.godown} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            {/* CONTENTS */}
            <div>
              <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">Contents</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Input label="Quantity" id="quantity" name="quantity" type="text" value={form.quantity} onChange={handleChange} required />
                
                <AutocompleteInput
                  label="Packing"
                  options={packingOptions}
                  value={form.packing}
                  onSelect={(value) => handleFormValueChange('packing', value)}
                  placeholder="Type to search packing..."
                  required
                />
                
                <div className="md:col-span-2">
                  <AutocompleteInput
                    label="Contents"
                    options={contentsOptions}
                    value={form.contents}
                    onSelect={(value) => handleFormValueChange('contents', value)}
                    placeholder="Type to search contents..."
                    required
                  />
                </div>

                <Input label="Prefix" id="prefix" name="prefix" value={form.prefix} onChange={handleChange} />
                <Input label="From No" id="fromNo" name="fromNo" type="text" value={form.fromNo} onChange={handleChange} required />
                <Input label="To No" id="toNo" name="toNo" value={toNo > 0 ? toNo : ''} disabled />
                <Input label="Net Qty" id="netQty" name="netQty" type="text" value={form.netQty} onChange={handleChange} required />
              </div>
            </div>

            {/* BILLING */}
            <div>
              <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">Billing & Payment</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Input label="Bill No" id="billNo" name="billNo" value={form.billNo} onChange={handleChange} />
                <Input label="Bill Value" id="billValue" name="billValue" type="text" value={form.billValue} onChange={handleChange} />
                <Input label="Toll Fee" id="tollFee" name="tollFee" type="text" value={form.tollFee} onChange={handleChange} />
                <Input label="Freight" id="freight" name="freight" type="text" value={form.freight} onChange={handleChange} />
                <Input label="Godown Charge" id="godownCharge" name="godownCharge" type="text" value={form.godownCharge} onChange={handleChange} />
                <Input label="Statistic Charge" id="statisticCharge" name="statisticCharge" type="text" value={form.statisticCharge} onChange={handleChange} />
                <Input label="Advance None" id="advanceNone" name="advanceNone" type="text" value={form.advanceNone} onChange={handleChange} />
                <Input label="Balance ToPay" id="balanceToPay" name="balanceToPay" type="text" value={form.balanceToPay} onChange={handleChange} />

                <div className="md:col-span-4">
                  <RadioGroup
                    label="Paid Type"
                    options={[ { value: 'To Pay', label: 'To Pay' }, { value: 'Paid', label: 'Paid' } ]}
                    value={form.paidType}
                    onChange={(value) => handleFormValueChange('paidType', value)}
                    required
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 p-4 bg-background/90 backdrop-blur-sm sticky bottom-0 border-t border-muted rounded-b-lg">
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full sm:w-auto"
            onClick={() => navigate('/gc-entry')}
          >
            Cancel
          </Button>

          <Button 
            type="button" 
            variant="secondary" 
            className="w-full sm:w-auto"
            onClick={() => handleSave(true)}
          >
            <Printer size={16} className="mr-2" />
            Save & Print GC
          </Button>

          <Button 
            type="button" 
            variant="primary" 
            className="w-full sm:w-auto"
            onClick={() => handleSave(false)}
          >
            <Save size={16} className="mr-2" />
            {isEditMode ? 'Save Changes' : 'Save GC'}
          </Button>
        </div>
      </form>

      {/* --- NEW: Render the print manager conditionally --- */}
      {printingJobs && (
        <GcPrintManager
          jobs={printingJobs}
          onClose={() => {
            setPrintingJobs(null);
            // Navigate *after* print dialog is closed
            navigate('/gc-entry');
          }}
        />
      )}
    </>
  );
};