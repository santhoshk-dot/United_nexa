import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePenLine, Trash2, Search, Printer, FileText } from "lucide-react";
import {
  DateFilterButtons,
  getTodayDate,
  getYesterdayDate,
  isDateInLast7Days,
} from "../../components/shared/DateFilterButtons";
import { ConfirmationDialog } from "../../components/shared/ConfirmationDialog";
import { Button } from "../../components/shared/Button";
import { AutocompleteInput } from "../../components/shared/AutocompleteInput";
import { MultiSelect } from "../../components/shared/MultiSelect";
import { useData } from "../../hooks/useData";
import type { TripSheetEntry } from "../../types"; 

import { usePagination } from "../../utils/usePagination";
import { Pagination } from "../../components/shared/Pagination";

import { TripSheetPrintManager } from "./TripSheetPrintManager";

export const TripSheetList = () => {
  const navigate = useNavigate();
  const { tripSheets, deleteTripSheet, consignees, consignors } = useData();

  const [printIds, setPrintIds] = useState<string[] | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [tsFilter, setTsFilter] = useState("");
  const [toPlaceFilter, setToPlaceFilter] = useState("");

  const [consigneeFilter, setConsigneeFilter] = useState<string[]>([]);
  const [consignorFilter, setConsignorFilter] = useState("");

  const consigneeOptions = consignees.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const consignorOptions = consignors.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (mfNo: string) => {
    setSelected((prev) =>
      prev.includes(mfNo) ? prev.filter((x) => x !== mfNo) : [...prev, mfNo]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((t) => t.mfNo));
    }
  };

  const filtered = useMemo(() => {
    return tripSheets.filter((ts: TripSheetEntry) => {
      const searchMatch =
        ts.mfNo.toLowerCase().includes(search.toLowerCase()) ||
        ts.fromPlace.toLowerCase().includes(search.toLowerCase());

      const date = ts.tsDate;
      const dateMatch = (() => {
        switch (filterType) {
          case "today":
            return date === getTodayDate();
          case "yesterday":
            return date === getYesterdayDate();
          case "week":
            return isDateInLast7Days(date);
          case "custom":
            return (
              (!customStart || date >= customStart) &&
              (!customEnd || date <= customEnd)
            );
          default:
            return true;
        }
      })();

      const tsMatch = !tsFilter || ts.mfNo.includes(tsFilter);

      const toMatch =
        !toPlaceFilter ||
        ts.toPlace.toLowerCase().includes(toPlaceFilter.toLowerCase());

      const consigneeMatch =
        consigneeFilter.length === 0 ||
        (ts.consigneeid &&
          consigneeFilter.includes(String(ts.consigneeid)));

      const consignorMatch =
        consignorFilter.length === 0 ||
        (ts.consignorid &&
          consignorFilter.includes(String(ts.consignorid)));

      return (
        searchMatch &&
        dateMatch &&
        tsMatch &&
        toMatch &&
        consigneeMatch &&
        consignorMatch
      );
    });
  }, [
    tripSheets,
    search,
    filterType,
    customStart,
    customEnd,
    tsFilter,
    toPlaceFilter,
    consigneeFilter,
    consignorFilter,
  ]);

  // --- Pagination ---
  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  } = usePagination({ data: filtered, initialItemsPerPage: 10 });

  const [delId, setDelId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onDelete = (mfNo: string) => {
    setDelId(mfNo);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (delId) deleteTripSheet(delId);
    setConfirmOpen(false);
    setDelId(null);
  };

  const handlePrintSelected = () => {
    if (selected.length === 0) return;
    setPrintIds(selected);
  };

  const handlePrintSingle = (id: string) => {
    setPrintIds([id]);
  };

  const handleShowReport = () => {
    if (filtered.length === 0) {
      alert("No data available to show in report.");
      return;
    }

    const ids = filtered.map((t) => t.mfNo).join(",");
    window.open(`/tripsheet/report?ts=${ids}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Trip Sheet Listing</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleShowReport}>
            <FileText size={16} className="mr-2" />
            Show Report
          </Button>
          <Button
            variant="secondary"
            onClick={handlePrintSelected}
            disabled={selected.length === 0}
          >
            <Printer size={16} className="mr-2" />
            Print Selected ({selected.length})
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate("/tripsheet/new")}
          >
            + Add New Trip Sheet
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-4 bg-background rounded-lg shadow border border-muted">
        <div className="relative">
          {/* FIX: Added correct classes for dark mode visibility */}
          <input
            type="text"
            placeholder="Search by TS No or From Place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <AutocompleteInput
            label="TS No"
            options={tripSheets.map((t) => ({ value: t.mfNo, label: t.mfNo }))}
            value={tsFilter}
            onSelect={setTsFilter}
            placeholder="Filter TS No..."
          />
          <AutocompleteInput
            label="To Place"
            options={[...new Set(tripSheets.map((t) => t.toPlace))].map((p) => ({
              value: p,
              label: p,
            }))}
            value={toPlaceFilter}
            onSelect={setToPlaceFilter}
            placeholder="Filter place..."
          />
          <AutocompleteInput
            label="Filter by Consignor"
            value={consignorFilter}
            options={consignorOptions}
            onSelect={setConsignorFilter}
            placeholder="Type to search consignor..."
          />
          <div>
            <label className="text-sm text-muted-foreground mb-0.5">Filter by Consignee</label>
            <MultiSelect
              options={consigneeOptions}
              selected={consigneeFilter}
              onChange={setConsigneeFilter}
              placeholder="Select consignees..."
              searchPlaceholder={""}
              emptyPlaceholder={""}            
            />
          </div>
        </div>

        <DateFilterButtons
          filterType={filterType}
          setFilterType={setFilterType}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />
      </div>

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">TS No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-muted">
              {paginatedData.map((ts) => (
                <tr key={ts.mfNo}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(ts.mfNo)}
                      onChange={() => toggleSelect(ts.mfNo)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">{ts.mfNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{ts.tsDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{ts.fromPlace}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{ts.toPlace}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">₹{ts.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 space-x-3">
                    <button onClick={() => navigate(`/tripsheet/edit/${ts.mfNo}`)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <FilePenLine size={18} />
                    </button>
                    <button onClick={() => handlePrintSingle(ts.mfNo)} className="text-green-600 hover:text-green-800" title="Print">
                      <Printer size={18} />
                    </button>
                    <button onClick={() => onDelete(ts.mfNo)} className="text-destructive hover:text-destructive/80" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((ts) => (
            <div key={ts.mfNo} className="p-4 space-y-2">
              <div className="flex justify-between">
                <input
                  type="checkbox"
                  checked={selected.includes(ts.mfNo)}
                  onChange={() => toggleSelect(ts.mfNo)}
                />
                <button onClick={() => handlePrintSingle(ts.mfNo)} className="text-green-600">
                  <Printer size={20} />
                </button>
              </div>
              <div className="text-lg font-semibold text-primary">TS #{ts.mfNo}</div>
              <div className="text-sm text-muted-foreground">{ts.fromPlace} → {ts.toPlace}</div>
              <div className="text-sm text-muted-foreground">
                Total: ₹{ts.totalAmount.toLocaleString("en-IN")}
              </div>
              <div className="flex gap-4 mt-2">
                <button onClick={() => navigate(`/tripsheet/edit/${ts.mfNo}`)} className="text-blue-600">
                  <FilePenLine size={20} />
                </button>
                <button onClick={() => onDelete(ts.mfNo)} className="text-destructive">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* --- PAGINATION MOVED INSIDE THE CONTAINER --- */}
        {totalPages > 0 && (
          <div className="border-t border-muted p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalItems}
            />
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No Trip Sheets match the selected filters.
        </div>
      )}

      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Trip Sheet"
        description={`Are you sure you want to delete TS No: ${delId}? This cannot be undone.`}
      />

      {printIds && (
        <TripSheetPrintManager mfNos={printIds} onClose={() => setPrintIds(null)} />
      )}
    </div>
  );
};