import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Trash2, X } from "lucide-react";

import type { TripSheetEntry, TripSheetGCItem } from "../../../types";
import { Button } from "../../../components/shared/Button";
import { Input } from "../../../components/shared/Input";
import { AsyncAutocomplete } from "../../../components/shared/AsyncAutocomplete"; 
import { useData } from "../../../hooks/useData";
import { getTodayDate } from "../../../utils/dateHelpers";
import api from "../../../utils/api";
import { useToast } from "../../../contexts/ToastContext";
import { tripSheetSchema } from "../../../schemas";


const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Helper function to check for non-empty or non-zero value
const isValueValid = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return !!value; 
};

const getValidationProp = (value: any) => ({
    hideRequiredIndicator: isValueValid(value)
});

export const TripSheetForm = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>(); 

  const {
    addTripSheet,
    updateTripSheet,
    fetchTripSheetById, 
    fetchGcDetailsForTripSheet, // 🟢 Get this from hook
    searchFromPlaces,
    searchToPlaces,
    searchDrivers,
    searchVehicles
  } = useData();

  const isEditMode = !!id;
  
  // --- STATE INITIALIZATION ---
  const [mfNo, setMfNo] = useState<string>("");
  const [tsDate, setTsDate] = useState<string>(getTodayDate());
  const [carriers, setCarriers] = useState<string>("");
  const [fromPlace, setFromPlace] = useState<string>("Sivakasi");
  const [toPlace, setToPlace] = useState<string>("");
  const [items, setItems] = useState<TripSheetGCItem[]>([]);
  const [unloadPlace, setUnloadPlace] = useState<string>("");
  const [driverName, setDriverName] = useState<string>("");
  const [dlNo, setDlNo] = useState<string>("");
  const [driverMobile, setDriverMobile] = useState<string>("");
  const [lorryNo, setLorryNo] = useState<string>("");
  const [lorryName, setLorryName] = useState<string>("");
  const [ownerName, setOwnerName] = useState<string>("");
  const [ownerMobile, setOwnerMobile] = useState<string>("");

  // Validation Errors State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Ref for debouncing
  const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Option States for AsyncDropdowns
  const [fromPlaceOption, setFromPlaceOption] = useState<any>({ label: 'Sivakasi', value: 'Sivakasi' });
  const [toPlaceOption, setToPlaceOption] = useState<any>(null);
  const [gcOption, setGcOption] = useState<any>(null);
  const [driverDlOption, setDriverDlOption] = useState<any>(null);
  const [driverNameOption, setDriverNameOption] = useState<any>(null);
  const [driverMobileOption, setDriverMobileOption] = useState<any>(null);
  const [lorryNoOption, setLorryNoOption] = useState<any>(null);
  const [lorryNameOption, setLorryNameOption] = useState<any>(null);

  const [loading, setLoading] = useState(isEditMode);

  // Field Validation Helper
  const validateField = (name: string, value: any) => {
    try {
      const fieldSchema = (tripSheetSchema.shape as any)[name];
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

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, name: string, value: string) => {
    setter(value);
    if (formErrors[name]) {
        setFormErrors(prev => { const n = {...prev}; delete n[name]; return n; });
    }
    if (validationTimeouts.current[name]) {
        clearTimeout(validationTimeouts.current[name]);
    }
    validationTimeouts.current[name] = setTimeout(() => {
        validateField(name, value);
    }, 500);
  };

  // --- LOAD DATA (Edit Mode) ---
  useEffect(() => {
    if (isEditMode && id) {
      const loadData = async () => {
        const sheet = await fetchTripSheetById(id);
        
        if (sheet) {
            setMfNo(sheet.mfNo);
            setTsDate(sheet.tsDate);
            setCarriers(sheet.carriers ?? "");
            setFromPlace(sheet.fromPlace);
            setToPlace(sheet.toPlace);
            
            setFromPlaceOption({ label: sheet.fromPlace, value: sheet.fromPlace });
            setToPlaceOption({ label: sheet.toPlace, value: sheet.toPlace });

            const mappedItems = (sheet.items ?? []).map(item => ({
                ...item,
                rate: item.rate ?? (item as any).freight ?? 0,
            }));
            setItems(mappedItems);

            setUnloadPlace(sheet.unloadPlace ?? "");
            setDriverName(sheet.driverName ?? "");
            setDlNo(sheet.dlNo ?? "");
            setDriverMobile(sheet.driverMobile ?? "");
            setLorryNo(sheet.lorryNo ?? "");
            setLorryName(sheet.lorryName ?? "");
            setOwnerName(sheet.ownerName ?? "");
            setOwnerMobile(sheet.ownerMobile ?? "");
            
            if(sheet.driverName) setDriverNameOption({ label: sheet.driverName, value: sheet.driverName });
            if(sheet.dlNo) setDriverDlOption({ label: sheet.dlNo, value: sheet.dlNo });
            if(sheet.driverMobile) setDriverMobileOption({ label: sheet.driverMobile, value: sheet.driverMobile });
            if(sheet.lorryNo) setLorryNoOption({ label: sheet.lorryNo, value: sheet.lorryNo });
            if(sheet.lorryName) setLorryNameOption({ label: sheet.lorryName, value: sheet.lorryName });

            setLoading(false);
        } else {
            toast.error("Trip Sheet not found.");
            navigate("/trip-sheet");
        }
      };
      loadData();
    } else {
        setLoading(false);
    }
  }, [isEditMode, id, fetchTripSheetById, navigate]);

  // --- ASYNC LOADERS ---
  
  // 🟢 REAL BACKEND SEARCH FOR GC
 // 🟢 REAL BACKEND SEARCH FOR GC
  const loadGcOptions = async (search: string, _prev: any, { page }: any) => {
      try {
        const { data } = await api.get('/operations/gc', { 
            params: { 
                search, 
                page, 
                limit: 20,
                // Only show GCs that are not yet assigned to a trip sheet
                availableForTripSheet: 'true' 
            },
            skipLoader: true // 🟢 This ensures the global loader doesn't appear
        } as any); // Type cast 'as any' is often needed if TypeScript complains about the custom property
        
        return {
            options: data.data.map((gc: any) => ({
                value: gc.gcNo,
                // Combine GC No with other info for better context in dropdown
                label: `${gc.gcNo} - ${gc.consignorName || 'Unknown'}`
            })),
            hasMore: data.page < data.pages,
            additional: { page: page + 1 }
        };
      } catch (e) {
        console.error("Failed to load GC options", e);
        return { options: [], hasMore: false };
      }
  };

  const loadFromPlaceOptions = async (search: string, _prev: any, { page }: any) => {
      const res = await searchFromPlaces(search, page);
      return {
          options: res.data.map((p: any) => ({ value: p.placeName, label: p.placeName })),
          hasMore: res.hasMore,
          additional: { page: page + 1 }
      };
  };

  const loadToPlaceOptions = async (search: string, _prev: any, { page }: any) => {
      const res = await searchToPlaces(search, page);
      return {
          options: res.data.map((p: any) => ({ value: p.placeName, label: p.placeName })),
          hasMore: res.hasMore,
          additional: { page: page + 1 }
      };
  };

  const loadDriverOptions = async (search: string, _prev: any, { page }: any) => {
      const res = await searchDrivers(search, page);
      return {
          options: res.data.map((d: any) => ({ 
              value: d.id, 
              label: d.driverName, 
              ...d 
          })),
          hasMore: res.hasMore,
          additional: { page: page + 1 }
      };
  };

  const loadVehicleOptions = async (search: string, _prev: any, { page }: any) => {
      const res = await searchVehicles(search, page);
      return {
          options: res.data.map((v: any) => ({ 
              value: v.id, 
              label: v.vehicleNo,
              ...v
          })),
          hasMore: res.hasMore,
          additional: { page: page + 1 }
      };
  };

  // --- FORM LOGIC FOR GC ITEMS ---
  const [gcNo, setGcNo] = useState<string>("");
  const [rate, setRate] = useState<number>(0);
  
  // State for multi-item logic
  const [gcItems, setGcItems] = useState<{ packing: string; content: string; quantity: number }[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<string>(""); 
  const [gcConsignor, setGcConsignor] = useState("");
  const [gcConsignee, setGcConsignee] = useState("");

  // Filter items to exclude ones already added to the table for this GC
  const availableGcItems = useMemo(() => {
      if (!gcItems.length) return [];
      return gcItems.filter(gcItem => {
          // Check if this specific item combination is already in the 'items' table
          const isAdded = items.some(addedItem => 
              addedItem.gcNo === gcNo && 
              addedItem.packingDts === gcItem.packing && 
              addedItem.contentDts === gcItem.content
          );
          return !isAdded;
      });
  }, [gcItems, items, gcNo]);

  // Derived Qty from selection
  const qty = useMemo(() => {
      if (selectedItemIndex === "" || !availableGcItems[Number(selectedItemIndex)]) return 0;
      return availableGcItems[Number(selectedItemIndex)].quantity;
  }, [selectedItemIndex, availableGcItems]);

  const handleGcSelect = async (option: any) => {
    setGcOption(option);
    if (option) {
        const selectedGcNo = option.value;
        setGcNo(selectedGcNo);
        setRate(0); // Reset rate on new GC selection
        setSelectedItemIndex(""); // Reset item selection

        // 🟢 REAL FETCH
        try {
            const data = await fetchGcDetailsForTripSheet(selectedGcNo);
            if (data) {
                // Map backend structure to local form state
                // Backend usually sends: { contentItems: [{ packing, contents, quantity }], consignor: { name }, consignee: { name } }
                const mappedItems = (data.contentItems || []).map((item: any) => ({
                    packing: item.packing || "",
                    content: item.contents || "", // Note: Backend usually uses 'contents' (plural)
                    quantity: Number(item.qty) || Number(item.quantity) || 0
                }));

                setGcItems(mappedItems);
                setGcConsignor(data.consignor?.name || "");
                setGcConsignee(data.consignee?.name || "");
                
            } else {
                 setGcItems([]);
                 setGcConsignor("");
                 setGcConsignee("");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch GC details.");
            setGcItems([]);
        }
    } else {
        resetGC();
    }
  };

  const resetGC = () => {
    setGcNo("");
    setGcOption(null);
    setRate(0);
    setGcItems([]);
    setSelectedItemIndex("");
    setGcConsignor("");
    setGcConsignee("");
  };

  // Helper to reset only item selection fields, keeping the GC selected
  const resetItemSelectionOnly = () => {
      setSelectedItemIndex("");
      setRate(0);
  };

  const handleAddGC = async () => {
    if (!gcNo) {
      toast.error("Please select a GC No before adding.");
      return;
    }
    
    // Validation: Ensure an item is selected from dropdown
    if (selectedItemIndex === "") {
        toast.error("Please select a Packing/Content item.");
        return;
    }

    if (!rate || rate <= 0) { 
        toast.error("Please enter a valid RATE."); 
        return; 
    }

    // Get the item from the AVAILABLE list
    const selectedItem = availableGcItems[Number(selectedItemIndex)];

    if (!selectedItem) {
        toast.error("Invalid item selection.");
        return;
    }

    const row: TripSheetGCItem = {
      gcNo,
      qty: selectedItem.quantity, 
      rate, 
      packingDts: selectedItem.packing, 
      contentDts: selectedItem.content, 
      consignor: gcConsignor,
      consignee: gcConsignee,
      amount: selectedItem.quantity * rate,
    };

    setItems((p) => [...p, row]);
    setFormErrors(prev => ({ ...prev, items: '' })); 
    
    // Don't reset GC completely; just clear the item choice so user sees updated list
    resetItemSelectionOnly(); 
  };

  const handleDeleteGC = (i: number) => {
    setItems((p) => p.filter((_, idx) => idx !== i));
  };

  const totalAmount = useMemo(
    () => items.reduce((s, it) => s + toNum(it.amount), 0),
    [items]
  );

  useEffect(() => {
    if (!isEditMode) setUnloadPlace(toPlace);
  }, [toPlace, isEditMode]);

  // 🟢 UPDATED: Handle driver selection - now handles clearing (when option is null) like To Place
  const handleDriverSelect = (option: any) => {
      if (option) {
          // When a driver is selected, populate all driver fields
          const newName = option.driverName?.toUpperCase() || '';
          setDriverName(newName);
          setDlNo(option.dlNo || '');
          setDriverMobile(option.mobile || '');
          setDriverNameOption({ value: option.id, label: newName });
          setDriverDlOption({ value: option.id, label: option.dlNo });
          setDriverMobileOption({ value: option.id, label: option.mobile });
          
          // Clear errors for all driver fields
          setFormErrors(prev => {
              const next = { ...prev };
              delete next['driverName'];
              delete next['dlNo'];
              delete next['driverMobile'];
              return next;
          });
      } else {
          // When cleared (option is null), reset all driver fields to empty
          setDriverName('');
          setDlNo('');
          setDriverMobile('');
          setDriverNameOption(null);
          setDriverDlOption(null);
          setDriverMobileOption(null);
          
          // Trigger validation for required fields (this will show errors)
          validateField('driverName', '');
          validateField('dlNo', '');
          validateField('driverMobile', '');
      }
  };

  // 🟢 UPDATED: Handle vehicle selection - now handles clearing (when option is null) like To Place
  const handleVehicleSelect = (option: any) => {
      if (option) {
          // When a vehicle is selected, populate all vehicle fields
          const newLorryNo = option.vehicleNo || '';
          const newLorryName = option.vehicleName?.toUpperCase() || '';
          const newOwnerName = option.ownerName?.toUpperCase() || '';
          
          setLorryNo(newLorryNo);
          setLorryName(newLorryName);
          setOwnerName(newOwnerName);
          setOwnerMobile(option.ownerMobile ?? '');
          
          setLorryNoOption({ value: option.id, label: newLorryNo });
          setLorryNameOption({ value: option.id, label: newLorryName });
          
          // Clear errors for all vehicle fields
          setFormErrors(prev => {
              const next = { ...prev };
              delete next['lorryNo'];
              delete next['lorryName'];
              delete next['ownerName'];
              delete next['ownerMobile'];
              return next;
          });
      } else {
          // When cleared (option is null), reset all vehicle fields to empty
          setLorryNo('');
          setLorryName('');
          setOwnerName('');
          setOwnerMobile('');
          setLorryNoOption(null);
          setLorryNameOption(null);
          
          // Trigger validation for required fields (this will show errors)
          validateField('lorryNo', '');
          validateField('lorryName', '');
          validateField('ownerName', '');
          validateField('ownerMobile', '');
      }
  };

  const onOwnerNameChange = (v: string) => { 
      const upperV = v.toUpperCase();
      handleInputChange(setOwnerName, 'ownerName', upperV);
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormErrors({});

    let finalMfNo = mfNo;
    if (!isEditMode) finalMfNo = ""; 

    const payload: TripSheetEntry = {
      id: id || "", 
      mfNo: finalMfNo,
      tsDate,
      carriers,
      fromPlace,
      toPlace,
      items, 
      unloadPlace,
      totalAmount,
      driverName,
      dlNo,
      driverMobile,
      ownerName,
      ownerMobile,
      lorryNo,
      lorryName,
    };

    const validationResult = tripSheetSchema.safeParse(payload);

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

    let result;
    if (isEditMode) result = await updateTripSheet(payload);
    else result = await addTripSheet(payload);

    if (result) {
        navigate("/tripsheet");
    }
  };

  if (loading && isEditMode) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-5.5rem)]">
            <div className="animate-pulse text-primary font-semibold">Loading Trip Sheet Data...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] overflow-hidden"> 
      {/* Scrollable Form Area - min-h-0 is critical for flex overflow */}
      <div className="flex-1 overflow-y-auto p-1 min-h-0">
        <form onSubmit={handleSave} className="bg-background rounded-xl shadow-sm border border-muted p-6 space-y-6 text-sm">
          
          <div>
           <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Trip Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4">
              <div className="col-span-1 lg:col-span-2">
                <Input type="date" label="Trip Date" value={tsDate} onChange={(e) => handleInputChange(setTsDate, 'tsDate', e.target.value)} required {...getValidationProp(tsDate)} />
                {formErrors.tsDate && <p className="text-xs text-red-500 mt-1">{formErrors.tsDate}</p>}
              </div>
              <div className="col-span-1 lg:col-span-2">
                <AsyncAutocomplete label="From Place" placeholder="Select From Place" loadOptions={loadFromPlaceOptions} value={fromPlaceOption} onChange={(v: any) => { setFromPlaceOption(v); const val = v?.value || ''; setFromPlace(val); setFormErrors(p => { const n = {...p}; delete n['fromPlace']; return n; }); validateField('fromPlace', val); }} required defaultOptions={false} menuPortalTarget={document.body} {...getValidationProp(fromPlace)} />
                {formErrors.fromPlace && <p className="text-xs text-red-500 mt-1">{formErrors.fromPlace}</p>}
              </div>
              <div className="col-span-1 lg:col-span-2">
                <AsyncAutocomplete label="To Place" placeholder="Select To Place" loadOptions={loadToPlaceOptions} value={toPlaceOption} onChange={(v: any) => { setToPlaceOption(v); const val = v?.value || ''; setToPlace(val); if(!isEditMode) { setUnloadPlace(val); setFormErrors(p => { const n = {...p}; delete n['unloadPlace']; return n; }); } setFormErrors(p => { const n = {...p}; delete n['toPlace']; return n; }); validateField('toPlace', val); }} required defaultOptions={false} menuPortalTarget={document.body} {...getValidationProp(toPlace)} />
                {formErrors.toPlace && <p className="text-xs text-red-500 mt-1">{formErrors.toPlace}</p>}
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                <Input label="Carriers" value={carriers} onChange={(e) => handleInputChange(setCarriers, 'carriers', e.target.value)} required {...getValidationProp(carriers)} />
                {formErrors.carriers && <p className="text-xs text-red-500 mt-1">{formErrors.carriers}</p>}
              </div>
            </div>
          </div>

          <section>
            <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">
              GC Details
            </h3>

            <div className="border border-muted rounded-md p-4 space-y-4 bg-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                
                {/* 1. GC SELECT */}
                <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                  <AsyncAutocomplete
                    label="Select GC No"
                    placeholder="Search GC..."
                    loadOptions={loadGcOptions}
                    value={gcOption}
                    onChange={(v: any) => handleGcSelect(v)}
                    required
                    defaultOptions={false}
                    menuPortalTarget={document.body}
                    {...getValidationProp(gcNo)}
                  />
                </div>

                {/* 2. ITEM SELECTION DROPDOWN */}
                <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Select Item Detail <span className="text-destructive">*</span>
                    </label>
                    <select
                        value={selectedItemIndex}
                        onChange={(e) => setSelectedItemIndex(e.target.value)}
                        // Disabled if no GC or no available items left
                        disabled={!gcNo || availableGcItems.length === 0}
                        className="w-full px-3 py-2 text-sm border border-muted-foreground/30 rounded-md bg-background focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="" disabled>
                            {availableGcItems.length === 0 && gcNo ? "-- All items added --" : "-- Select Packing/Content --"}
                        </option>
                        {availableGcItems.map((item, idx) => (
                            <option key={idx} value={idx}>
                                {item.packing} ({item.content}) - Qty: {item.quantity}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. QTY (Read Only) & RATE (Editable) */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        QTY & RATE
                    </label>
                    <div className="flex">
                        {/* Read-Only QTY Display */}
                        <div className="flex-shrink-0 bg-muted text-muted-foreground border border-r-0 border-muted-foreground/30 rounded-l-md px-3 py-2 w-20 text-center font-bold">
                            {qty > 0 ? qty : '0'}
                        </div>
                        {/* Editable Rate Input */}
                        <input
                            type="number"
                            placeholder="Rate"
                            value={rate > 0 ? rate : ''}
                            onChange={(e) => setRate(Number(e.target.value))}
                            className="flex-1 w-full px-3 py-2 text-sm bg-background text-foreground border border-muted-foreground/30 rounded-r-md focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>

                {/* 4. ADD BUTTON */}
                <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                  <Button type="button" variant="primary" className="w-full" onClick={handleAddGC}>
                    Add GC
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-muted text-sm">
                  <thead>
                    <tr className="bg-muted/20">
                      <th className="border border-muted p-2">GCNO</th>
                    
                      <th className="border border-muted p-2">PACKING</th>
                      <th className="border border-muted p-2">CONTENT</th>
                      <th className="border border-muted p-2">CONSIGNOR</th>
                      <th className="border border-muted p-2">CONSIGNEE</th>
                        <th className="border border-muted p-2">QTY</th>
                      <th className="border border-muted p-2">RATE</th>
                      <th className="border border-muted p-2">AMOUNT</th>
                      <th className="border border-muted p-2">DEL</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i}>
                        <td className="border border-muted p-2">{it.gcNo}</td>
                        
                        <td className="border border-muted p-2">{it.packingDts}</td>
                        <td className="border border-muted p-2">{it.contentDts}</td>
                        <td className="border border-muted p-2">{it.consignor}</td>
                        <td className="border border-muted p-2">{it.consignee}</td>
                        <td className="border border-muted p-2">{it.qty}</td>
                        <td className="border border-muted p-2">{it.rate}</td>
                        <td className="border border-muted p-2">₹{it.amount.toLocaleString("en-IN")}</td>
                        <td className="border border-muted p-2 text-center">
                          <button type="button" className="text-red-600" onClick={() => handleDeleteGC(i)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center p-3 text-muted-foreground">
                          No GC rows added.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {formErrors.items && <p className="text-xs text-red-500 mt-1">{formErrors.items}</p>}
            </div>
          </section>

            <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">
              Driver Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-4">
              {/* 🟢 UPDATED: DL No - with menuPortalTarget to prevent scroll issues */}
              <div className="col-span-1 lg:col-span-2">
                <AsyncAutocomplete 
                  label="DL No" 
                  placeholder="Select DL No" 
                  loadOptions={async (s, p, a) => { 
                    const res = await loadDriverOptions(s, p, a); 
                    res.options = res.options.map((o: any) => ({ ...o, label: o.dlNo })); 
                    return res; 
                  }} 
                  value={driverDlOption} 
                  onChange={(v: any) => { 
                    setDriverDlOption(v); 
                    handleDriverSelect(v); 
                  }} 
                  required 
                  defaultOptions={false}
                  menuPortalTarget={document.body}
                  maxMenuHeight={180}
                  {...getValidationProp(dlNo)} 
                />
                {formErrors.dlNo && <p className="text-xs text-red-500 mt-1">{formErrors.dlNo}</p>}
              </div>
              
              {/* 🟢 UPDATED: Driver Mobile - with menuPortalTarget to prevent scroll issues */}
              <div className="col-span-1 lg:col-span-2">
                <AsyncAutocomplete 
                  label="Driver Mobile" 
                  placeholder="Select Mobile" 
                  loadOptions={async (s, p, a) => { 
                    const res = await loadDriverOptions(s, p, a); 
                    res.options = res.options.map((o: any) => ({ ...o, label: o.mobile })); 
                    return res; 
                  }} 
                  value={driverMobileOption} 
                  onChange={(v: any) => { 
                    setDriverMobileOption(v); 
                    handleDriverSelect(v); 
                  }} 
                  required 
                  defaultOptions={false}
                  menuPortalTarget={document.body}
                  maxMenuHeight={180}
                  {...getValidationProp(driverMobile)} 
                />
                {formErrors.driverMobile && <p className="text-xs text-red-500 mt-1">{formErrors.driverMobile}</p>}
              </div>
              
              {/* 🟢 UPDATED: Driver Name - with menuPortalTarget to prevent scroll issues */}
              <div className="col-span-1 lg:col-span-2">
                <AsyncAutocomplete 
                  label="Driver Name" 
                  placeholder="Select Driver Name" 
                  loadOptions={loadDriverOptions} 
                  value={driverNameOption} 
                  onChange={(v: any) => { 
                    setDriverNameOption(v); 
                    handleDriverSelect(v); 
                  }} 
                  required 
                  defaultOptions={false}
                  menuPortalTarget={document.body}
                  maxMenuHeight={180}
                  {...getValidationProp(driverName)} 
                />
                {formErrors.driverName && <p className="text-xs text-red-500 mt-1">{formErrors.driverName}</p>}
              </div>
              
              {/* 🟢 UPDATED: Lorry No - with menuPortalTarget to prevent scroll issues */}
              <div className="col-span-1 lg:col-span-2">
                <AsyncAutocomplete 
                  label="Lorry No" 
                  placeholder="Select Lorry No" 
                  loadOptions={loadVehicleOptions} 
                  value={lorryNoOption} 
                  onChange={(v: any) => { 
                    setLorryNoOption(v); 
                    handleVehicleSelect(v); 
                  }} 
                  required 
                  defaultOptions={false}
                  menuPortalTarget={document.body}
                  maxMenuHeight={180}
                  {...getValidationProp(lorryNo)} 
                />
                {formErrors.lorryNo && <p className="text-xs text-red-500 mt-1">{formErrors.lorryNo}</p>}
              </div>
              
              {/* 🟢 UPDATED: Lorry Name - with menuPortalTarget to prevent scroll issues */}
              <div className="col-span-1 lg:col-span-2">
                <AsyncAutocomplete 
                  label="Lorry Name" 
                  placeholder="Select Lorry Name" 
                  loadOptions={async (s, p, a) => { 
                    const res = await loadVehicleOptions(s, p, a); 
                    res.options = res.options.map((o: any) => ({ ...o, label: o.vehicleName })); 
                    return res; 
                  }} 
                  value={lorryNameOption} 
                  onChange={(v: any) => { 
                    setLorryNameOption(v); 
                    handleVehicleSelect(v); 
                  }} 
                  required 
                  defaultOptions={false}
                  menuPortalTarget={document.body}
                  maxMenuHeight={180}
                  {...getValidationProp(lorryName)} 
                />
                {formErrors.lorryName && <p className="text-xs text-red-500 mt-1">{formErrors.lorryName}</p>}
              </div>
              
              <div className="col-span-1 lg:col-span-2">
                <Input label="Owner Name" value={ownerName} onChange={(e) => onOwnerNameChange(e.target.value)} readOnly={!!lorryNo} required {...getValidationProp(ownerName)} />
                {formErrors.ownerName && <p className="text-xs text-red-500 mt-1">{formErrors.ownerName}</p>}
              </div>
              <div className="col-span-1 lg:col-span-2">
                <Input label="Owner Mobile" value={ownerMobile} onChange={(e) => handleInputChange(setOwnerMobile, 'ownerMobile', e.target.value)} required {...getValidationProp(ownerMobile)} />
                {formErrors.ownerMobile && <p className="text-xs text-red-500 mt-1">{formErrors.ownerMobile}</p>}
              </div>
              <div className="col-span-1 lg:col-span-4">
                <Input label="Unload Place" placeholder="Select Unload Place" value={unloadPlace} onChange={(e) => handleInputChange(setUnloadPlace, 'unloadPlace', e.target.value)} required {...getValidationProp(unloadPlace)} />
                {formErrors.unloadPlace && <p className="text-xs text-red-500 mt-1">{formErrors.unloadPlace}</p>}
              </div>
              <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                <Input label="Total Rs." value={String(totalAmount)} readOnly />
              </div>
            </div>
        </form>
      </div>

      {/* Fixed Action Buttons - Always visible at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-muted bg-background flex flex-col sm:flex-row justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Button type="button" variant="secondary" onClick={() => navigate("/trip-sheet")}>
          <X size={16} />
          Cancel
        </Button>

        <Button type="submit" variant="primary" onClick={handleSave}>
          <Save size={16} />
          Save Trip Sheet
        </Button>
      </div>
    </div>
  );
};