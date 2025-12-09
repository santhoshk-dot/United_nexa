import { useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { StockLabels } from '../../types';
import { X, Printer } from 'lucide-react';
import { useDataContext } from '../../contexts/DataContext';

// --- Date Formatter ---
const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
};

// --- Report Header ---
const ReportHeader = ({ label }: { label: StockLabels }) => (
  <div className="w-full font-serif mb-0 text-black" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
    {/* Top Title */}
    <div className="text-center font-bold text-lg mb-1 uppercase">
      {label.title}
    </div>

    {/* Main Header Box */}
    <div className="border border-black flex">
      
      {/* Left Section (Company Info) */}
      <div className="w-[70%] border-r border-black p-2">
        <div className="flex justify-between items-baseline text-xs font-bold mb-1 lining-nums leading-none">
          <span>{label.fixedGstinLabel} {label.fixedGstinValue}</span>
          <span>{label.mobileLabel} {label.mobileNumberValue}</span>
        </div>

        <h1 className="text-2xl font-bold uppercase text-left tracking-tight mt-1">
          {label.companyName}
        </h1>
        <p className="text-xs font-bold mt-1 text-left">
          {label.companyAddress}
        </p>
      </div>

      {/* Right Section (Empty Box) */}
      <div className="w-[30%]">
        {/* Intentionally empty to match uploaded format */}
      </div>
    </div>

    {/* Sub Header Row */}
    <div className="border-x border-b border-black p-1 pl-2 text-sm font-normal">
      {label.mainHeader}
    </div>
  </div>
);

// --- Helper Type for Flattened Rows ---
interface StockReportRow {
  uniqueId: string;
  gcNo: string;
  date: string;
  consignorName: string;
  consigneeName: string;
  packing: string;
  content: string;
  quantity: number;
}

// --- Report Page Component ---
interface ReportPageProps {
  rows: StockReportRow[];
  pageNumber: number;
  totalPages: number;
  isLastPage: boolean;
  grandTotal: number;
  labels: StockLabels;
}

const ReportPage = ({ 
  rows, 
  pageNumber, 
  totalPages, 
  isLastPage, 
  grandTotal,
  labels 
}: ReportPageProps) => {
  return (
    <div 
      className="report-page bg-white text-black relative"
      style={{ 
        width: "210mm", 
        height: "297mm", 
        padding: "10mm 10mm",
        boxSizing: "border-box",
        fontFamily: '"Times New Roman", Times, serif' 
      }}
    >
      <ReportHeader label={labels} />

      {/* Table */}
      <table className="w-full table-fixed border-collapse border-x border-b border-black text-[11px] leading-tight mt-0">
        <thead>
          <tr className="h-8">
            <th className="border border-black w-[8%] p-1 text-left font-bold text-xs">{labels.gcLabel}</th>
            <th className="border border-black w-[8%] p-1 text-left font-bold text-xs">{labels.stockCountLabel}</th>
            <th className="border border-black w-[15%] p-1 text-center font-bold text-xs">{labels.contentLabel}</th>
            <th className="border border-black w-[30%] p-1 text-center font-bold text-xs">{labels.consignorLabel}</th>
            <th className="border border-black w-[30%] p-1 text-center font-bold text-xs">{labels.consigneeLabel}</th>
            <th className="border border-black w-[12%] p-1 text-center font-bold text-xs">{labels.dateLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            // Check Previous (for hiding text and top border)
            const isSameAsPrevious = idx > 0 && rows[idx - 1].gcNo === row.gcNo;
            
            // Check Next (for hiding bottom border)
            // We check if we are NOT the last item, and if the next item is the same GC
            const isSameAsNext = idx < rows.length - 1 && rows[idx + 1].gcNo === row.gcNo;

            // Common Merge Style Logic
            // If same as previous: Remove Top Border
            // If same as next: Remove Bottom Border
            // Always: Keep Side Borders (border-l, border-r)
            const getMergedCellClass = (align: 'left' | 'center' | 'right' = 'left', isBold = false) => {
                const base = `p-1 px-2 text-${align} border-l border-r border-black`; // Always sides
                const top = isSameAsPrevious ? 'border-t-0' : 'border-t border-black';
                const bottom = isSameAsNext ? 'border-b-0' : 'border-b border-black'; // Important for visual merge
                const font = isBold ? 'font-bold' : '';
                return `${base} ${top} ${bottom} ${font}`;
            };

            return (
              <tr key={row.uniqueId} className="h-6">
                {/* 1. GC NO (Merged) */}
                <td className={getMergedCellClass('left', true)}>
                  {isSameAsPrevious ? "" : row.gcNo}
                </td>

                {/* 2. QTY (Always Individual Borders) */}
                <td className="border border-black p-1 px-2 text-left">{row.quantity}</td>

                {/* 3. CONTENT (Always Individual Borders) */}
                <td className="border border-black p-1 px-2 text-left">
                  {`${row.packing} - ${row.content}`}
                </td>

                {/* 4. CONSIGNOR (Merged) */}
                <td className={`${getMergedCellClass('left')} uppercase whitespace-nowrap overflow-hidden text-ellipsis`}>
                  {isSameAsPrevious ? "" : row.consignorName}
                </td>

                {/* 5. CONSIGNEE (Merged) */}
                <td className={`${getMergedCellClass('left')} uppercase whitespace-nowrap overflow-hidden text-ellipsis`}>
                  {isSameAsPrevious ? "" : row.consigneeName}
                </td>

                {/* 6. DATE (Merged) */}
                <td className={getMergedCellClass('center')}>
                  {isSameAsPrevious ? "" : formatDate(row.date)}
                </td>
              </tr>
            );
          })}

          {/* TOTAL ROW - Only show on the last page */}
          {isLastPage && (
            <tr className="h-8 font-bold bg-gray-50">
              <td className="border border-black p-1 px-2 text-right">{labels.totalLabel}</td>
              <td className="border border-black p-1 px-2 text-left">{grandTotal}</td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Static Footer */}
      <div className="absolute bottom-0 left-0 w-full pb-8 text-center">
        <div className="text-[10px] font-sans text-black">
          Page {pageNumber} of {totalPages}
        </div>
      </div>
    </div>
  );
};

// --- Main Print Component ---
interface StockReportPrintProps {
  data: any[]; 
  onClose: () => void;
}

export const StockReportPrint = ({ data, onClose }: StockReportPrintProps) => {
  const { printSettings } = useDataContext(); 
  const labels = printSettings.stockReport; 
  
  const printTriggered = useRef(false);
  
  // 1. Flatten Data
  const flattenedRows = useMemo(() => {
    const rows: StockReportRow[] = [];
    
    if (!data || !Array.isArray(data)) return [];

    data.forEach((entry) => {
      const consignorName = entry.consignor?.name || '';
      const consigneeName = entry.consignee?.name || '';
      const date = entry.gcDate || '';
      const gcNo = entry.gcNo || '';

      const hasContentItems = entry.contentItems && Array.isArray(entry.contentItems) && entry.contentItems.length > 0;

      if (hasContentItems) {
        entry.contentItems.forEach((item: any, itemIdx: number) => {
           rows.push({
             uniqueId: `${entry.id || gcNo}-${itemIdx}`,
             gcNo: gcNo,
             date: date,
             consignorName: consignorName,
             consigneeName: consigneeName,
             packing: item.packing || '',
             content: item.contents || '', 
             quantity: Number(item.qty || item.quantity || 0)
           });
        });
      } else {
        const rootQty = Number(entry.quantity || entry.totalQty || 0);
        rows.push({
           uniqueId: `${entry.id || gcNo}-root`,
           gcNo: gcNo,
           date: date,
           consignorName: consignorName,
           consigneeName: consigneeName,
           packing: entry.packing || '',
           content: entry.contents || '',
           quantity: rootQty
        });
      }
    });
    
    return rows;
  }, [data]);

  // 2. Calculate Grand Total
  const grandTotal = useMemo(() => {
    return flattenedRows.reduce((sum, row) => sum + row.quantity, 0);
  }, [flattenedRows]);

  // 3. Pagination Logic
  const ENTRIES_PER_PAGE = 35;
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < flattenedRows.length; i += ENTRIES_PER_PAGE) {
      chunks.push(flattenedRows.slice(i, i + ENTRIES_PER_PAGE));
    }
    return chunks;
  }, [flattenedRows]);

  // 4. Auto Print Trigger
  useEffect(() => {
    if (flattenedRows.length === 0) return;
    if (printTriggered.current) return;

    const timer = setTimeout(() => {
        printTriggered.current = true;
        window.print();
    }, 1000); 

    return () => {
        clearTimeout(timer);
    };
  }, [flattenedRows]);

  const handleManualPrint = () => {
    window.print();
  };

  const printContent = (
    <div className="stock-report-print-wrapper">
      <style>{`
        /* PRINT STYLES */
        @media print {
          @page { size: A4; margin: 0; }
          body > *:not(.stock-report-print-wrapper) { display: none !important; }
          #root { display: none !important; }
          html, body { height: 100%; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: white !important; }
          .stock-report-print-wrapper { display: block !important; position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; background: white; z-index: 9999; }
          .stock-report-print-wrapper * { color: black !important; print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
          .print-actions { display: none !important; }
          .report-page { break-after: page; page-break-after: always; width: 210mm; height: 297mm; overflow: hidden; position: relative; }
        }
        /* SCREEN STYLES */
        @media screen {
          .stock-report-print-wrapper { position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100dvh; background-color: hsl(var(--muted)); z-index: 2147483647; overflow-y: auto; overflow-x: hidden; padding-top: 80px; padding-bottom: 40px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; }
          .report-page { background: white; color: black; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); margin-bottom: 24px; width: 210mm; height: 297mm; position: relative; }
        }
        /* MOBILE SCALING */
        @media screen and (max-width: 800px) {
          .stock-report-print-wrapper { padding-top: 70px; background-color: #1f2937; }
          .report-page { transform: scale(0.46); margin-bottom: -135mm; margin-top: 10px; }
        }
        /* TOOLBAR */
        .print-actions { position: fixed; top: 0; left: 0; width: 100%; height: 64px; background-color: hsl(var(--card)); color: hsl(var(--foreground)); border-bottom: 1px solid hsl(var(--border)); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; z-index: 2147483648; }
        .preview-title { font-weight: 700; font-size: 16px; }
        .action-group { display: flex; gap: 10px; }
        .btn-base { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; }
        .print-btn { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
        .close-btn { background-color: hsl(var(--destructive)); color: hsl(var(--destructive-foreground)); }
      `}</style>

      <div className="print-actions">
        <span className="preview-title">Stock Report Preview</span>
        <div className="action-group">
          <button onClick={handleManualPrint} className="btn-base print-btn"><Printer size={18} /><span>Print</span></button>
          <button onClick={onClose} className="btn-base close-btn"><X size={18} /><span>Close</span></button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {pages.map((pageRows, index) => (
          <ReportPage
            key={index}
            rows={pageRows}
            pageNumber={index + 1}
            totalPages={pages.length}
            isLastPage={index === pages.length - 1}
            grandTotal={grandTotal}
            labels={labels}
          />
        ))}
      </div>
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};