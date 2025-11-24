// src/features/trip-sheet-entry/TripSheetForm.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Trash2, X } from "lucide-react";

import type { TripSheetEntry, TripSheetGCItem } from "../../types";
import { Button } from "../../components/shared/Button";
import { Input } from "../../components/shared/Input";
import { AutocompleteInput } from "../../components/shared/AutocompleteInput";
import { useData } from "../../hooks/useData";
import { getTodayDate } from "../../utils/dateHelpers";

const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);


export const TripSheetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const {
    addTripSheet,
    updateTripSheet,
    tripSheets,
    consignors,
    consignees,
    gcEntries,
    fromPlaces,
    toPlaces,
    driverEntries,
    vehicleEntries,
  } = useData();

  // If editing, resolve by id or mfNo
  const editing = tripSheets.find((t) => t.id === id || t.mfNo === id);

  const [mfNo, setMfNo] = useState<string | undefined>(editing?.mfNo);
  const [tsDate, setTsDate] = useState<string>(editing?.tsDate ?? getTodayDate());

  const [carriers, setCarriers] = useState<string>(editing?.carriers ?? "");
  const [fromPlace, setFromPlace] = useState<string>(editing?.fromPlace ?? "Sivakasi");
  const [toPlace, setToPlace] = useState<string>(editing?.toPlace ?? "");

  const [items, setItems] = useState<TripSheetGCItem[]>(editing?.items ?? []);

  const [gcNo, setGcNo] = useState<string>("");

  // When a GC is selected we auto-fill qty & rate etc
  const [qty, setQty] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [packingDts, setPackingDts] = useState<string>("");
  const [contentDts, setContentDts] = useState<string>("");
  const [itemConsignor, setItemConsignor] = useState<string>("");
  const [itemConsignee, setItemConsignee] = useState<string>("");

  const loadGc = (selectedGcNo: string) => {
    const gc = gcEntries.find((g) => g.id === selectedGcNo);
    if (!gc) return null;

    return {
      qty: parseFloat(gc.quantity) || 0,
      rate: parseFloat(gc.freight) || 0,
      packingDts: gc.packing,
      contentDts: gc.contents,
      consignor: consignors.find((c) => c.id === gc.consignorId)?.name ?? "",
      consignee: consignees.find((c) => c.id === gc.consigneeId)?.name ?? "",
    };
  };

  const handleGcChange = (value: string) => {
    setGcNo(value);
    const g = loadGc(value);
    if (!g) return;
    setQty(g.qty);
    setRate(g.rate);
    setPackingDts(g.packingDts);
    setContentDts(g.contentDts);
    setItemConsignor(g.consignor);
    setItemConsignee(g.consignee);
  };

  const resetGC = () => {
    setGcNo("");
    setQty(0);
    setRate(0);
    setPackingDts("");
    setContentDts("");
    setItemConsignor("");
    setItemConsignee("");
  };

  const handleAddGC = () => {
    if (!gcNo) {
      alert("Please select a GC No before adding.");
      return;
    }

    const row: TripSheetGCItem = {
      gcNo,
      qty,
      rate,
      packingDts,
      contentDts,
      consignor: itemConsignor,
      consignee: itemConsignee,
      amount: qty * rate,
    };

    setItems((p) => [...p, row]);
    resetGC();
  };

  const handleDeleteGC = (i: number) => {
    setItems((p) => p.filter((_, idx) => idx !== i));
  };

  const totalAmount = useMemo(
    () => items.reduce((s, it) => s + toNum(it.amount), 0),
    [items]
  );

  const [unloadPlace, setUnloadPlace] = useState<string>(editing?.unloadPlace ?? "");
  useEffect(() => {
    if (!editing) setUnloadPlace(toPlace);
  }, [toPlace, editing]);

  // -------------------------
  // DRIVER / VEHICLE / OWNER
  // -------------------------
  const [driverName, setDriverName] = useState<string>(editing?.driverName ?? "");
  const [dlNo, setDlNo] = useState<string>(editing?.dlNo ?? "");
  const [driverMobile, setDriverMobile] = useState<string>(editing?.driverMobile ?? "");
  const driverNameReadonly = dlNo !== "" || driverMobile !== "";


  // Drivers data for dropdowns
  const driverDlOptions = driverEntries.map((d) => ({ value: d.dlNo, label: d.dlNo }));
  const driverNameOptions = driverEntries.map((d) => ({ value: d.driverName.toUpperCase(), label: d.driverName.toUpperCase() }));
  const driverMobileOptions = driverEntries.map((d) => ({ value: d.mobile, label: d.mobile }));

  // When a DL is picked, fill other fields (convert names to UPPER)
  const fillDriverFromDl = (dl: string) => {
    const d = driverEntries.find((x) => x.dlNo === dl);
    if (!d) return;
    setDriverName(d.driverName.toUpperCase());
    setDriverMobile(d.mobile);
    setDlNo(d.dlNo);
  };

  const fillDriverFromMobile = (mobile: string) => {
    const d = driverEntries.find((x) => x.mobile === mobile);
    if (!d) return;
    setDriverName(d.driverName.toUpperCase());
    setDriverMobile(d.mobile);
    setDlNo(d.dlNo);
  };

  // VEHICLE
  const [lorryNo, setLorryNo] = useState<string>(editing?.lorryNo ?? "");
  const [lorryName, setLorryName] = useState<string>(editing?.lorryName ?? "");

  const vehicleNoOptions = vehicleEntries.map((v) => ({ value: v.vehicleNo, label: v.vehicleNo }));
  const vehicleNameOptions = vehicleEntries.map((v) => ({ value: v.vehicleName.toUpperCase(), label: v.vehicleName.toUpperCase() }));

  const fillVehicleFromNo = (no: string) => {
  const v = vehicleEntries.find((x) => x.vehicleNo === no);
  if (!v) return;

  setLorryNo(v.vehicleNo);
  setLorryName(v.vehicleName.toUpperCase());

  // Auto-fill owner fields
  setOwnerName(v.ownerName ? v.ownerName.toUpperCase() : "");
  setOwnerMobile(v.ownerMobile ?? "");
};


  // OWNER
  const [ownerName, setOwnerName] = useState<string>(editing?.ownerName ?? "");
  const [ownerMobile, setOwnerMobile] = useState<string>(editing?.ownerMobile ?? "");

  // Enforce uppercase for certain fields on change
  const onOwnerNameChange = (v: string) => setOwnerName(v.toUpperCase());
  // (mobile and dl are numeric/strings - do not uppercase)

  // -------------------------
  // GC Options - exclude used GCs in other trip sheets
  // -------------------------
  const usedGCs = useMemo(() => {
    // collect GC Nos used by *other* trip sheets
    const arr: string[] = [];
    const all = JSON.parse(localStorage.getItem("tripSheets") || "[]") as TripSheetEntry[];
    all.forEach((ts) =>
      ts.items?.forEach((it) => {
        // If editing current tripsheet, don't treat its own items as "used elsewhere"
        if (!editing || ts.mfNo !== editing.mfNo) arr.push(it.gcNo);
      })
    );
    return arr;
  }, [editing]);

  const gcOptions = gcEntries
    .filter((g) => {
      const isInForm = items.some((i) => i.gcNo === g.id);
      const isUsedElsewhere = usedGCs.includes(g.id);
      // allow GC if it's already in this form when editing
      if (editing && isInForm) return true;
      return !isInForm && !isUsedElsewhere;
    })
    .map((g) => ({ value: g.id, label: g.id }));

  const fromPlaceOptions = fromPlaces.map((p) => ({ value: p.placeName, label: p.placeName }));
  const toPlaceOptions = toPlaces.map((p) => ({ value: p.placeName, label: p.placeName }));

  const generateNextMfNo = () => {
    if (!tripSheets.length) return "1";
    const max = Math.max(...tripSheets.map((t) => Number(t.mfNo || 0)));
    return String(max + 1);
  };

  // -------------------------
  // SAVE with validations
  // -------------------------
  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!tsDate) {
      alert("Please enter TripSheet date.");
      return;
    }
    if (!toPlace) {
      alert("Please select To Place.");
      return;
    }
    if (!unloadPlace) {
      alert("Please select Unload Place.");
      return;
    }
    if (!items || items.length === 0) {
      alert("Add at least 1 GC entry before saving the Trip Sheet.");
      return;
    }
    
    let finalMfNo = mfNo;
    if (!editing) {
      finalMfNo = generateNextMfNo();
      setMfNo(finalMfNo);
    }

    const payload: TripSheetEntry = {
      id: finalMfNo!,
      mfNo: finalMfNo!,
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

    if (editing) updateTripSheet(payload);
    else addTripSheet(payload);

    // Return to listing (keeps consistent route used elsewhere)
    navigate("/trip-sheet");
  };

  // -------------------------
  // UI - match GC form styles
  // -------------------------
  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)]"> 
      <div className="flex-1 overflow-y-auto p-1">
        <form onSubmit={handleSave} className="bg-background rounded-xl shadow-sm border border-muted p-6 space-y-6 text-sm">
          
          {/* TRIP DETAILS (keep title exactly as requested) */}
          <div>
           <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">Trip Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4">
              <div className="col-span-1 lg:col-span-2">
                <Input
                  type="date"
                  label="Trip Date"
                  value={tsDate}
                  onChange={(e) => setTsDate(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-1 lg:col-span-2">
                <AutocompleteInput
                  label="From Place"
                  placeholder="Select From Place"
                  options={fromPlaceOptions}
                  value={fromPlace}
                  onSelect={(v) => setFromPlace(v)}
                  required
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                <AutocompleteInput
                  label="To Place"
                  placeholder="Select To Place"
                  options={toPlaceOptions}
                  value={toPlace}
                  onSelect={(v) => setToPlace(v)}
                  required
                />
              </div>

              <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                <Input
                  label="Carriers"
                  value={carriers}
                  onChange={(e) => setCarriers(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* GC DETAILS (keep title exactly as requested) */}
          <section>
            <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">
              GC Details
            </h3>

            <div className="border rounded-md p-4 space-y-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 items-end">
                <div className="col-span-1 sm:col-span-1 lg:col-span-4">
                  <AutocompleteInput
                    label="Select GC No"
                    placeholder="Search GC..."
                    options={gcOptions}
                    value={gcNo}
                    onSelect={handleGcChange}
                    required
                  />
                </div>

                <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                  <Input
                    label="QTY RATE"
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                  <Button type="button" variant="primary" className="w-full" onClick={handleAddGC}>
                    Add GC
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-muted/20">
                      <th className="border p-2">GCNO</th>
                      <th className="border p-2">QTY</th>
                      <th className="border p-2">RATE</th>
                      <th className="border p-2">PACKING</th>
                      <th className="border p-2">CONTENT</th>
                      <th className="border p-2">CONSIGNOR</th>
                      <th className="border p-2">CONSIGNEE</th>
                      <th className="border p-2">AMOUNT</th>
                      <th className="border p-2">DEL</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i}>
                        <td className="border p-2">{it.gcNo}</td>
                        <td className="border p-2">{it.qty}</td>
                        <td className="border p-2">{it.rate}</td>
                        <td className="border p-2">{it.packingDts}</td>
                        <td className="border p-2">{it.contentDts}</td>
                        <td className="border p-2">{it.consignor}</td>
                        <td className="border p-2">{it.consignee}</td>
                        <td className="border p-2">₹{it.amount.toLocaleString("en-IN")}</td>
                        <td className="border p-2 text-center">
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
            </div>
          </section>

          {/* DRIVER DETAILS (keep title exactly as requested) */}
            <h3 className="text-base font-bold text-primary border-b border-border pb-2 mb-4">
              Driver Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-4">
              <div className="col-span-1 lg:col-span-2">
                <AutocompleteInput
                  label="DL No"
                  placeholder="Select DL No"
                  options={driverDlOptions}
                  value={dlNo}
                  onSelect={(v) => {
                    setDlNo(v);
                    fillDriverFromDl(v);
                  }}
                  required
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                <AutocompleteInput
                  label="Driver Mobile"
                  placeholder="Select Driver Mobile"
                  options={driverMobileOptions}
                  value={driverMobile}
                  onSelect={(v) => {
                    setDriverMobile(v);
                    fillDriverFromMobile(v);
                  }}
                  required
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                <AutocompleteInput
                  label="Driver Name"
                  placeholder="Select Driver Name"
                  options={driverNameOptions}
                  value={driverName}
                  onSelect={(v) => {
                  if (!driverNameReadonly) setDriverName(v);
                  }}
                  readOnly={driverNameReadonly}
                  disabled={driverNameReadonly}
                  required
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                <AutocompleteInput
                  label="Lorry No"
                  placeholder="Select Lorry No"
                  options={vehicleNoOptions}
                  value={lorryNo}
                  onSelect={(v) => {
                    setLorryNo(v);
                    fillVehicleFromNo(v);
                  }}
                  required
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                <AutocompleteInput
                  label="Lorry Name"
                  placeholder="Select Lorry Name"
                  options={vehicleNameOptions}
                  value={lorryName}
                  onSelect={setLorryName}
                  readOnly={!!lorryNo}
                  disabled={!!lorryNo}
                  required
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                <Input
                  label="Owner Name"
                  value={ownerName}
                  onChange={(e) => onOwnerNameChange(e.target.value)}
                  readOnly={!!lorryNo}   // <-- Only OWNER NAME is locked
                  required
                />
              </div>

              <div className="col-span-1 lg:col-span-2">
                <Input
                  label="Owner Mobile"
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value)}  // Still editable
                  required
                />
                
              </div>

              <div className="col-span-1 lg:col-span-4">
                <Input
                  label="Unload Place"
                  placeholder="Select Unload Place"
                  value={unloadPlace}
                  onChange={(e) => setUnloadPlace(e.target.value)}
                  required
                />
              </div>

              <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                <Input label="Total Rs." value={String(totalAmount)} readOnly />
              </div>
            </div>
        </form>
      </div>



          {/* Sticky Footer (replicates GC footer style, only Cancel + Save Trip Sheet) */}
          <div className="p-4 border-t border-muted bg-background flex flex-col sm:flex-row justify-end gap-3 mt-auto shadow-md z-10">
            <Button type="button" variant="secondary" onClick={() => navigate("/trip-sheet")}>
             <X size={16} className="mr-2" />
             Cancel
            </Button>

            <Button type="submit" variant="primary" onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Save Trip Sheet
            </Button>
          </div>
    </div>
  );
};
