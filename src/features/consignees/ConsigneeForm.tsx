import { useState, useRef } from 'react';
import type { Consignee } from '../../types';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { X, Info } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { AsyncAutocomplete } from '../../components/shared/AsyncAutocomplete'; 
import { useToast } from '../../contexts/ToastContext';
import { consigneeSchema } from '../../schemas';

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

interface ConsigneeFormProps {
  initialData?: Consignee;
  onClose: () => void;
  onSave: (consignee: Consignee) => void;
}

const isValueValid = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return !!value; 
};

const getValidationProp = (value: any) => ({
    hideRequiredIndicator: isValueValid(value)
});

export const ConsigneeForm = ({ initialData, onClose, onSave }: ConsigneeFormProps) => {
  const { consignees, searchToPlaces } = useData();  
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const toast = useToast();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [consignee, setConsignee] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    destination: initialData?.destination || '',
    filingDate: initialData?.filingDate || getTodayDate(),
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    gst: initialData?.gst || '',
    pan: initialData?.pan || '',
    aadhar: initialData?.aadhar || '',
  });

  const [destinationOption, setDestinationOption] = useState<any>(
    initialData?.destination 
      ? { label: initialData.destination, value: initialData.destination } 
      : null
  );

  const isUpdateMode = !!consignee.id;

  // 泙 NEW: Ref to store active timeouts for each field
  const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});


  // 泙 NEW: Field Validation Helper
  const validateField = (name: string, value: string) => {
    try {
      const fieldSchema = (consigneeSchema.shape as any)[name];
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
    } catch (e) {
      // Ignore schema lookup errors
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 1. Update State
    setConsignee(prev => ({ ...prev, [name]: value }));
    if (duplicateMessage) setDuplicateMessage(null);
    
    // 2. Clear Immediate Errors
    if (formErrors[name]) {
        setFormErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    }

    // 3. Clear Existing Timeout
    if (validationTimeouts.current[name]) {
        clearTimeout(validationTimeouts.current[name]);
    }

    // 4. Set Delayed Validation
    validationTimeouts.current[name] = setTimeout(() => {
        validateField(name, value);
    }, 1000);
  };

  const loadDestinationOptions = async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchToPlaces(search, page);
    return {
      options: result.data.map((p: any) => ({ value: p.placeName, label: p.placeName })),
      hasMore: result.hasMore,
      additional: { page: page + 1 },
    };
  };

  const handleDestinationChange = (option: any) => {
      setDestinationOption(option);
      const val = option?.value || '';
      setConsignee(prev => ({ ...prev, destination: val }));
      
      if (duplicateMessage) setDuplicateMessage(null);
      if (formErrors.destination) {
          setFormErrors(prev => ({ ...prev, destination: '' }));
      }

      // Validate destination immediately (selection event) or debounce if preferred
      // Using debounce here for consistency if user types in search box (though this is a selection event)
      if (validationTimeouts.current['destination']) clearTimeout(validationTimeouts.current['destination']);
      validationTimeouts.current['destination'] = setTimeout(() => {
          validateField('destination', val);
      }, 500);
  };

  const handleProofBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (initialData?.id) return; 

    const { value } = e.target;
    if (!value.trim()) return;

    const existing = consignees.find(c => 
      (c.gst && c.gst.toLowerCase() === value.toLowerCase()) ||
      (c.pan && c.pan.toLowerCase() === value.toLowerCase()) ||
      (c.aadhar && c.aadhar.toLowerCase() === value.toLowerCase())
    );

    if (existing) {
      setConsignee({
        id: existing.id, 
        name: existing.name,
        destination: existing.destination,
        filingDate: getTodayDate(),
        address: existing.address,
        phone: existing.phone,
        gst: existing.gst || '',
        pan: existing.pan || '',
        aadhar: existing.aadhar || '',
      });
      
      setDestinationOption({ label: existing.destination, value: existing.destination });
      setDuplicateMessage(`Consignee "${existing.name}" found! Switched to Update mode.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // 🟢 1. Manual Validation: At least one proof is required
    const hasGst = consignee.gst && consignee.gst.trim().length > 0;
    const hasPan = consignee.pan && consignee.pan.trim().length > 0;
    const hasAadhar = consignee.aadhar && consignee.aadhar.trim().length > 0;

    if (!hasGst && !hasPan && !hasAadhar) {
      toast.error('Please provide at least one proof (GST, PAN, or Aadhar).');
      return;
    }

    // 2. Validate against Schema (Zod)
    const validationResult = consigneeSchema.safeParse(consignee);

    if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        // Map Zod errors to specific fields
        validationResult.error.issues.forEach((err: any) => {
            if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setFormErrors(newErrors);
        toast.error("Please correct the errors in the form.");
        return;
    }
    
    const savedConsignee: Consignee = {
      ...initialData,
      id: consignee.id || `consignee-${Math.random()}`,
      consignorId: initialData?.consignorId,
      name: consignee.name,
      destination: consignee.destination,
      filingDate: consignee.filingDate,
      address: consignee.address,
      phone: consignee.phone,
      gst: consignee.gst || undefined,
      pan: consignee.pan || undefined,
      aadhar: consignee.aadhar || undefined,
    };
    
    onSave(savedConsignee);
  };

  return (
    <div className="fixed -top-6 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {isUpdateMode ? 'Update Consignee' : 'Create New Consignee'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {duplicateMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md animate-in fade-in slide-in-from-top-2">
              <Info size={18} className="flex-shrink-0" />
              <span>{duplicateMessage}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input 
                label="GST Number" 
                id="gst" 
                name="gst" 
                value={consignee.gst} 
                onChange={handleChange} 
                onBlur={handleProofBlur}
                placeholder="Search GST..."
              />
              {/* 🟢 ADDED: Error message for GST */}
              {formErrors.gst && <p className="text-xs text-red-500 mt-1">{formErrors.gst}</p>}
            </div>

            <div>
              <Input 
                label="PAN Number" 
                id="pan" 
                name="pan" 
                value={consignee.pan} 
                onChange={handleChange} 
                onBlur={handleProofBlur}
                placeholder="Search PAN..."
              />
              {/* 🟢 ADDED: Error message for PAN */}
              {formErrors.pan && <p className="text-xs text-red-500 mt-1">{formErrors.pan}</p>}
            </div>

            <div>
              <Input 
                label="Aadhar Number" 
                id="aadhar" 
                name="aadhar" 
                value={consignee.aadhar} 
                onChange={handleChange} 
                onBlur={handleProofBlur}
                placeholder="Search Aadhar..."
              />
              {/* 🟢 ADDED: Error message for Aadhar */}
              {formErrors.aadhar && <p className="text-xs text-red-500 mt-1">{formErrors.aadhar}</p>}
            </div>
          </div>

          {/* Helper Text for Proof Requirement */}
          <div className="text-xs text-muted-foreground -mt-3 italic">
            * At least one of the above proofs is required.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input label="Consignee Name" id="name" name="name" value={consignee.name} onChange={handleChange} required { ...getValidationProp(consignee.name)} />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            
            <div>
              <AsyncAutocomplete 
                  label="Destination" 
                  placeholder="Select or type Destination"
                  loadOptions={loadDestinationOptions}
                  value={destinationOption} 
                  onChange={handleDestinationChange} 
                  required 
                  defaultOptions
                  { ...getValidationProp(consignee.destination)} 
              />
              {formErrors.destination && <p className="text-xs text-red-500 mt-1">{formErrors.destination}</p>}
            </div>
            
            <div>
              <Input label="Phone Number" id="phone" name="phone" value={consignee.phone} onChange={handleChange} required { ...getValidationProp(consignee.phone)} />
              {/* 🟢 ADDED: Error message for Phone */}
              {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
            </div>

            <Input label="Filing Date" id="filingDate" name="filingDate" type="date" value={consignee.filingDate} onChange={handleChange} required { ...getValidationProp(consignee.filingDate)} />

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-muted-foreground">
                Address <span className="text-destructive">*</span>
              </label>
             <textarea 
                id="address" 
                name="address" 
                value={consignee.address} 
                onChange={handleChange} 
                rows={3} 
                className="w-full mt-1 px-3 py-2 bg-transparent text-foreground border border-muted-foreground/30 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                required 
              />
              {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
             </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
            <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-auto">
              {isUpdateMode ? 'Update Consignee' : 'Save Consignee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};