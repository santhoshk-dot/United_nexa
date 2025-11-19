import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

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
    getTripSheet,
    consignors,
    consignees,
    gcEntries,
    fromPlaces,
    toPlaces,
  } = useData();

  const editing = id ? getTripSheet(id) : undefined;

  const [mfNo, setMfNo] = useState<string | undefined>(
    editing ? editing.mfNo : undefined
  );

const [tsDate, setTsDate] = useState(editing ? editing.tsDate : getTodayDate());
  const [carriers, setCarriers] = useState(editing?.carriers ?? "");
  const [fromPlace, setFromPlace] = useState( editing ? editing.fromPlace : "Sivakasi");
  const [toPlace, setToPlace] = useState(editing?.toPlace ?? "");

  const [items, setItems] = useState<TripSheetGCItem[]>(editing?.items ?? []);

  const [gcNo, setGcNo] = useState("");

  const [qty, setQty] = useState(0);
  const [rate, setRate] = useState(0);
  const [packingDts, setPackingDts] = useState("");
  const [contentDts, setContentDts] = useState("");
  const [itemConsignor, setItemConsignor] = useState("");
  const [itemConsignee, setItemConsignee] = useState("");

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
    setRate(g.rate); // rate per qty
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
    if (!gcNo) return alert("Please select a GC No");

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
    setItems((p) => p.filter((_, x) => x !== i));
  };

  const totalAmount = useMemo(
    () => items.reduce((s, it) => s + toNum(it.amount), 0),
    [items]
  );

  const [unloadPlace, setUnloadPlace] = useState(
    editing?.unloadPlace ?? ""
  );

  useEffect(() => {
    if (!editing) {
      setUnloadPlace(toPlace);
    }
  }, [toPlace]);

  const [driverName, setDriverName] = useState(editing?.driverName ?? "");
  const [dlNo, setDlNo] = useState(editing?.dlNo ?? "");
  const [driverMobile, setDriverMobile] = useState(
    editing?.driverMobile ?? ""
  );
  const [ownerName, setOwnerName] = useState(editing?.ownerName ?? "");
  const [ownerMobile, setOwnerMobile] = useState(
    editing?.ownerMobile ?? ""
  );
  const [lorryNo, setLorryNo] = useState(editing?.lorryNo ?? "");
  const [lorryName, setLorryName] = useState(editing?.lorryName ?? "");

  // GC Options
  // --- GET ALL USED GC NUMBERS IN ALL TRIPSHEETS ---
  const usedGCs = useMemo(() => {
    const arr: string[] = [];
    const all = JSON.parse(localStorage.getItem("tripSheets") || "[]");

    all.forEach((ts: TripSheetEntry) => {
      ts.items?.forEach((it) => arr.push(it.gcNo));
    });

    return arr;
  }, []);

  // --- GC OPTIONS (FILTERED) ---
  // Show only:
  // 1. Not already in this form (items)
  // 2. Not used in any other tripsheet
  // 3. But allow items belonging to this editing form
  const gcOptions = gcEntries
    .filter((g) => {
      const isInForm = items.some((i) => i.gcNo === g.id);
      const isUsedElsewhere = usedGCs.includes(g.id);

      // In EDIT MODE — allow own GCs
      if (editing && isInForm) return true;

      return !isInForm && !isUsedElsewhere;
    })
    .map((g) => ({
      value: g.id,
      label: g.id,
    }
  ));


  // Place Options
  const fromPlaceOptions = fromPlaces.map((p) => ({
    value: p.placeName,
    label: p.placeName,
  }));

  const toPlaceOptions = toPlaces.map((p) => ({
    value: p.placeName,
    label: p.placeName,
  }));

  const generateNextMfNo = () => {
    const stored = JSON.parse(localStorage.getItem("tripSheets") || "[]");
    if (!stored.length) return "1";
    const max = Math.max(...stored.map((t: any) => Number(t.mfNo || 0)));
    return String(max + 1);
  };

 const handleSave = (e?: React.FormEvent) => {
  e?.preventDefault();

  if (!tsDate) return alert("Please enter TripSheet date");

  if (!toPlace || toPlace.trim() === "") {
    return alert("Please select To Place.");
  }

  if (!unloadPlace || unloadPlace.trim() === "") {
    return alert("Please select Unload Place.");
  }

  // NEW VALIDATION — ensure at least 1 GC is added
  if (items.length === 0) {
    return alert("Please add at least one GC entry before saving the TripSheet.");
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

  navigate("/trip-sheet");
};


  return (
    <div className="space-y-4 p-4">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button
            type="button"
            variant="secondary"
            className="px-3"
            onClick={() => navigate("/trip-sheet")}
          >
            <ArrowLeft size={18} />
          </Button>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {editing ? `Edit Trip Sheet #${mfNo}` : "Add New Trip Sheet"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-background rounded-lg shadow border border-muted p-4 md:p-8 space-y-8">

          {/* TRIP DETAILS */}
          <div>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">
              Trip Details
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <AutocompleteInput
                label="From Place"
                placeholder="Select From Place"
                options={fromPlaceOptions}
                value={fromPlace}
                onSelect={(v) => setFromPlace(v)}
              />

              <AutocompleteInput
                label="To Place"
                placeholder="Select To Place"
                options={toPlaceOptions}
                value={toPlace}
                onSelect={(v) => setToPlace(v)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                type="date"
                label="Trip Date"
                value={tsDate}
                onChange={(e) => setTsDate(e.target.value)}
              />
            </div>
          </div>

          {/* GC DETAILS PANEL */}
          <div>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">
              GC Details
            </h2>

            <div className="p-3 border rounded-md space-y-3 mb-3">

              <div className="grid grid-cols-8 gap-3 items-end">
                <div className="col-span-3">
                  <AutocompleteInput
                    label="Select GC No"
                    placeholder="Search GC..."
                    options={gcOptions}
                    value={gcNo}
                    onSelect={handleGcChange}
                  />
                </div>

                {/* NEW — QTY RATE */}
                <Input
                  label="QTY RATE"
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value) || 0)}
                  className="col-span-2"
                />

                <Button
                  type="button"
                  variant="primary"
                  className="col-span-2"
                  onClick={handleAddGC}
                >
                  Add GC
                </Button>
              </div>

              {/* TABLE */}
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
                        <td className="border p-2">
                          ₹{it.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="border p-2 text-center">
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={() => handleDeleteGC(i)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center p-3 text-muted-foreground"
                        >
                          No GC rows added.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* UNLOAD + TOTAL */}
            <div className="grid grid-cols-3 gap-3">
              <AutocompleteInput
                label="Unload Place"
                placeholder="Select Unload Place"
                options={toPlaceOptions}
                value={unloadPlace}
                onSelect={(v) => setUnloadPlace(v)}
              />

              <Input
                label="Total Rs."
                value={String(totalAmount)}
                readOnly
              />
            </div>
          </div>

          {/* DRIVER / OWNER */}
          <div>
            <h2 className="text-xl font-semibold text-foreground border-b border-muted pb-3 mb-6">
              Driver Details
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <Input
                label="Driver Name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
              />
              <Input
                label="DL No"
                value={dlNo}
                onChange={(e) => setDlNo(e.target.value)}
              />
              <Input
                label="Driver Mobile"
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <Input
                label="Lorry No"
                value={lorryNo}
                onChange={(e) => setLorryNo(e.target.value)}
              />
              <Input
                label="Lorry Name"
                value={lorryName}
                onChange={(e) => setLorryName(e.target.value)}
              />
              <Input
                label="Carriers"
                value={carriers}
                onChange={(e) => setCarriers(e.target.value)}
                className="col-span-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Owner Name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
              <Input
                label="Owner Mobile"
                value={ownerMobile}
                onChange={(e) => setOwnerMobile(e.target.value)}
              />
            </div>
          </div>

          {/* SAVE FOOTER */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 p-4 bg-background/90 backdrop-blur-sm sticky bottom-0 border-t border-muted rounded-b-lg">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/trip-sheet")}
            >
              Cancel
            </Button>

            <Button type="submit" variant="primary">
              <Save size={16} className="mr-2" />
              Save Trip Sheet
            </Button>
          </div>

        </div>
      </form>
    </div>
  );
};
