import { useState, useRef } from 'react';
import type { Consignor, Consignee } from '../../../types';
import { Input } from '../../../components/shared/Input';
import { Button } from '../../../components/shared/Button';
import { X, Info } from 'lucide-react';
import { useData } from '../../../hooks/useData';
import { AsyncAutocomplete } from '../../../components/shared/AsyncAutocomplete';
import { AppSelect } from '../../../components/shared/AppSelect';
import { useToast } from '../../../contexts/ToastContext';
import { consignorSchema, consigneeSchema } from '../../../schemas';

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

interface ConsignorFormProps {
  initialData?: Consignor;
  onClose: () => void;
  onSave: (consignor: Consignor, firstConsignee?: any) => void;
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

export const ConsignorForm = ({ initialData, onClose, onSave }: ConsignorFormProps) => {
  const { consignors, searchToPlaces } = useData();
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const toast = useToast();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [consignor, setConsignor] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    from: initialData?.from || 'Sivakasi',
    filingDate: initialData?.filingDate || getTodayDate(),
    gst: initialData?.gst || '',
    pan: initialData?.pan || '',
    aadhar: initialData?.aadhar || '',
    mobile: initialData?.mobile || '',
    address: initialData?.address || '',
  });

  const [addFirstConsignee, setAddFirstConsignee] = useState(false);
  const [consignee, setConsignee] = useState({
    name: '',
    proofType: 'gst',
    proofValue: '',
    address: '',
    phone: '',
    destination: '',
  });

  const [destinationOption, setDestinationOption] = useState<any>(null);

  const isUpdateMode = !!consignor.id;

  // 泙 NEW: Ref for debouncing
  const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});


  // 泙 NEW: Field Validation Helper
  const validateField = (name: string, value: string, schema: any, errorPrefix: string = "") => {
    try {
      const fieldSchema = (schema.shape as any)[name];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        const errorKey = `${errorPrefix}${name}`;

        if (!result.success) {
          setFormErrors(prev => ({ ...prev, [errorKey]: result.error.issues[0].message }));
        } else {
          setFormErrors(prev => {
            const next = { ...prev };
            delete next[errorKey];
            return next;
          });
        }
      }
    } catch (e) { }
  };

  const handleConsignorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // 1. Update State
    setConsignor(prev => ({ ...prev, [name]: value }));
    if (duplicateMessage) setDuplicateMessage(null);

    // 2. Clear immediate error
    if (formErrors[name]) {
      setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }

    // 3. Debounce Validation
    if (validationTimeouts.current[name]) clearTimeout(validationTimeouts.current[name]);

    validationTimeouts.current[name] = setTimeout(() => {
      validateField(name, value, consignorSchema);
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
    if (formErrors['consignee.destination']) {
      setFormErrors(prev => { const n = { ...prev }; delete n['consignee.destination']; return n; });
    }

    // Validate immediately (or debounce, but selection is usually valid)
    if (addFirstConsignee) validateField('destination', val, consigneeSchema, "consignee.");
  };

  const handleProofBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (initialData?.id) return;

    const { value } = e.target;
    if (!value.trim()) return;

    const existing = consignors.find(c =>
      (c.gst && c.gst.toLowerCase() === value.toLowerCase()) ||
      (c.pan && c.pan.toLowerCase() === value.toLowerCase()) ||
      (c.aadhar && c.aadhar.toLowerCase() === value.toLowerCase())
    );

    if (existing) {
      setConsignor({
        id: existing.id,
        name: existing.name,
        from: existing.from,
        filingDate: getTodayDate(),
        gst: existing.gst,
        pan: existing.pan || '',
        aadhar: existing.aadhar || '',
        mobile: existing.mobile || '',
        address: existing.address || '',
      });
      setDuplicateMessage(`Consignor "${existing.name}" found! Switched to Update mode.`);
    }
  };

  const handleConsigneeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // 1. Update State
    setConsignee(prev => ({ ...prev, [name]: value }));

    // 2. Clear immediate error
    const errorKey = `consignee.${name}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => { const n = { ...prev }; delete n[errorKey]; return n; });
    }

    // 3. Debounce Validation
    const timeoutKey = `consignee_${name}`; // distinct key
    if (validationTimeouts.current[timeoutKey]) clearTimeout(validationTimeouts.current[timeoutKey]);

    validationTimeouts.current[timeoutKey] = setTimeout(() => {
      // Validate Consignee Fields if checkbox is checked
      if (addFirstConsignee) {
        // Special case for proofValue as schema uses gst/pan/aadhar keys
        if (name === 'proofValue') {
          if (!value) setFormErrors(prev => ({ ...prev, 'consignee.proofValue': 'Proof Value is required' }));
          else setFormErrors(prev => { const n = { ...prev }; delete n['consignee.proofValue']; return n; });
        } else if (name !== 'proofType') {
          validateField(name, value, consigneeSchema, "consignee.");
        }
      }
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const consignorValidation = consignorSchema.safeParse(consignor);

    const newErrors: Record<string, string> = {};

    if (!consignorValidation.success) {
      consignorValidation.error.issues.forEach((err: any) => {
        if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
      });
    }

    if (addFirstConsignee) {
      const consigneeCheckData = {
        name: consignee.name,
        phone: consignee.phone,
        destination: consignee.destination,
        address: consignee.address
      };

      const consigneeValidation = consigneeSchema.safeParse(consigneeCheckData);
      if (!consigneeValidation.success) {
        consigneeValidation.error.issues.forEach((err: any) => {
          if (err.path[0]) newErrors[`consignee.${err.path[0].toString()}`] = err.message;
        });
      }

      if (!consignee.proofValue) {
        newErrors['consignee.proofValue'] = "Proof Value is required for the new consignee";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error("Please correct the errors in the form.");
      return;
    }

    const savedConsignor: Consignor = {
      ...initialData,
      ...consignor,
      id: consignor.id || `consignor-${Math.random()}`,
    };

    let savedConsignee: Consignee | undefined = undefined;
    if (addFirstConsignee) {
      savedConsignee = {
        id: `consignee-${Math.random()}`,
        consignorId: savedConsignor.id,
        name: consignee.name,
        phone: consignee.phone,
        destination: consignee.destination,
        address: consignee.address,
        filingDate: getTodayDate(),
        gst: consignee.proofType === 'gst' ? consignee.proofValue : undefined,
        pan: consignee.proofType === 'pan' ? consignee.proofValue : undefined,
        aadhar: consignee.proofType === 'aadhar' ? consignee.proofValue : undefined,
      };
    }

    onSave(savedConsignor, savedConsignee);
  };

  return (
    <div className="fixed -top-6 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {isUpdateMode ? 'Update Consignor' : 'Create New Consignor'}
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
                value={consignor.gst}
                onChange={handleConsignorChange}
                onBlur={handleProofBlur}
                required
                {...getValidationProp(consignor.gst)}
                placeholder="Enter GST..."
              />
              {formErrors.gst && <p className="text-xs text-red-500 mt-1">{formErrors.gst}</p>}
            </div>
            <div>
              <Input
                label="PAN Number"
                id="pan"
                name="pan"
                value={consignor.pan}
                onChange={handleConsignorChange}
                onBlur={handleProofBlur}
                placeholder="Enter PAN..."
              />
              {/* 🟢 ADDED: Error message display for PAN */}
              {formErrors.pan && <p className="text-xs text-red-500 mt-1">{formErrors.pan}</p>}
            </div>
            <div>
              <Input
                label="Aadhar Number"
                id="aadhar"
                name="aadhar"
                value={consignor.aadhar}
                onChange={handleConsignorChange}
                onBlur={handleProofBlur}
                placeholder="Enter Aadhar..."
              />
              {/* 🟢 ADDED: Error message display for Aadhar */}
              {formErrors.aadhar && <p className="text-xs text-red-500 mt-1">{formErrors.aadhar}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input label="Consignor Name" id="name" name="name" value={consignor.name} onChange={handleConsignorChange} required {...getValidationProp(consignor.name)} />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <Input label="From (Place)" id="from" name="from" value={consignor.from} onChange={handleConsignorChange} required {...getValidationProp(consignor.from)} />
              {formErrors.from && <p className="text-xs text-red-500 mt-1">{formErrors.from}</p>}
            </div>

            <div>
              <Input label="Mobile Number" id="mobile" name="mobile" value={consignor.mobile} onChange={handleConsignorChange} />
              {formErrors.mobile && <p className="text-xs text-red-500 mt-1">{formErrors.mobile}</p>}
            </div>

            <div>
              <Input label="Filing Date" id="filingDate" name="filingDate" type="date" value={consignor.filingDate} onChange={handleConsignorChange} required {...getValidationProp(consignor.filingDate)} />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-muted-foreground">
                Address {/* Removed * indicator */}
              </label>
              <textarea
                id="address"
                name="address"
                value={consignor.address}
                onChange={handleConsignorChange}
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-transparent text-foreground border border-muted-foreground/30 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              /* Removed required attribute */
              />
              {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
            </div>
          </div>

          {!isUpdateMode && (
            <div className="space-y-4 pt-4 border-t border-muted">
              <div className="flex items-center">
                <input
                  id="addFirstConsignee"
                  name="addFirstConsignee"
                  type="checkbox"
                  checked={addFirstConsignee}
                  onChange={(e) => setAddFirstConsignee(e.target.checked)}
                  className="h-4 w-4 text-primary border-muted-foreground/30 rounded focus:ring-primary"
                />
                <label htmlFor="addFirstConsignee" className="ml-2 block text-sm font-medium text-foreground">
                  Add first consignee for this consignor
                </label>
              </div>

              {addFirstConsignee && (
                <div className="p-4 border border-dashed border-muted-foreground/30 rounded-md space-y-4">
                  <h3 className="font-medium text-foreground">First Consignee Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <AppSelect
                        label="Proof Type"
                        options={[
                          { value: 'gst', label: 'GST' },
                          { value: 'pan', label: 'PAN' },
                          { value: 'aadhar', label: 'Aadhar' },
                        ]}
                        value={consignee.proofType}
                        onChange={(val: string) => handleConsigneeChange({ target: { name: 'proofType', value: val } } as any)}
                        required={addFirstConsignee}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input label="Proof Number" id="c-proofValue" name="proofValue" value={consignee.proofValue} onChange={handleConsigneeChange} required={addFirstConsignee} {...getValidationProp(consignee.proofValue)} />
                      {formErrors['consignee.proofValue'] && <p className="text-xs text-red-500 mt-1">{formErrors['consignee.proofValue']}</p>}
                    </div>
                  </div>

                  <div>
                    <Input label="Consignee Name" id="c-name" name="name" value={consignee.name} onChange={handleConsigneeChange} required={addFirstConsignee} {...getValidationProp(consignee.name)} />
                    {formErrors['consignee.name'] && <p className="text-xs text-red-500 mt-1">{formErrors['consignee.name']}</p>}
                  </div>

                  <div>
                    <Input label="Phone Number" id="c-phone" name="phone" value={consignee.phone} onChange={handleConsigneeChange} required={addFirstConsignee} {...getValidationProp(consignee.phone)} />
                    {formErrors['consignee.phone'] && <p className="text-xs text-red-500 mt-1">{formErrors['consignee.phone']}</p>}
                  </div>

                  <div>
                    <AsyncAutocomplete
                      label="Destination"
                      placeholder="Search Destination..."
                      loadOptions={loadDestinationOptions}
                      value={destinationOption}
                      onChange={handleDestinationChange}
                      required
                      defaultOptions
                      {...getValidationProp(consignee.destination)}
                    />
                    {formErrors['consignee.destination'] && <p className="text-xs text-red-500 mt-1">{formErrors['consignee.destination']}</p>}
                  </div>

                  <div>
                    <label htmlFor="c-address" className="block text-sm font-medium text-muted-foreground">
                      Address {addFirstConsignee && <span className="text-destructive">*</span>}
                    </label>
                    <textarea
                      id="c-address"
                      name="address"
                      value={consignee.address}
                      onChange={handleConsigneeChange}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 bg-transparent text-foreground border border-muted-foreground/30 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      required={addFirstConsignee}
                    />
                    {formErrors['consignee.address'] && <p className="text-xs text-red-500 mt-1">{formErrors['consignee.address']}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
            <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-auto">
              {isUpdateMode ? 'Update Consignor' : 'Save Consignor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};