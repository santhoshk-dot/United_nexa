import { useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { TripSheetEntry, TripReportLabels } from '../../../types';
import { X, Printer } from 'lucide-react';
import { useDataContext } from '../../../contexts/DataContext';

// --------------------------------------------------
// REPORT HEADER
// --------------------------------------------------
const ReportHeader = ({ labels }: { labels: TripReportLabels }) => (
  <div
    className="w-full font-serif mb-0 text-black"
    style={{ fontFamily: '"Times New Roman", Times, serif' }}
  >
    <div className="text-center font-bold text-lg mb-1 uppercase">
      {labels.title}
    </div>

    <div className="border border-black flex">
      <div className="w-[70%] border-r border-black p-2">
        <div className="flex justify-between items-baseline text-xs font-bold mb-1 leading-none">
          <span>{labels.fixedGstinLabel} {labels.fixedGstinValue}</span>
          <span>{labels.mobileLabel} {labels.mobileNumberValue}</span>
        </div>

        <h1 className="text-2xl font-bold uppercase text-left tracking-tight mt-1">
          {labels.companyName}
        </h1>

        <p className="text-xs font-bold mt-1 text-left">
          {labels.companyAddress}
        </p>
      </div>

      <div className="w-[30%]"></div>
    </div>

    <div className="border-x border-b border-black p-1 pl-2 text-sm font-normal">
      {labels.mainHeader}
    </div>
  </div>
);

// --------------------------------------------------
// SINGLE PAGE COMPONENT
// --------------------------------------------------
interface PageProps {
  entries: TripSheetEntry[];
  pageNumber: number;
  totalPages: number;
  isLastPage: boolean;
  grandTotal: number;
  labels: TripReportLabels;
}

const ReportPage = ({
  entries,
  pageNumber,
  totalPages,
  isLastPage,
  grandTotal,
  labels,
}: PageProps) => (
  <div
    className="report-page bg-white text-black"
    style={{
      width: "210mm",
      height: "297mm",
      maxHeight: "297mm",
      padding: "8mm 10mm",
      boxSizing: "border-box",
      fontFamily: '"Times New Roman", Times, serif',
      position: "relative",
      overflow: "hidden"
    }}
  >
    {/* HEADER */}
    <ReportHeader labels={labels} />

    {/* TABLE CONTAINER - Fixed height to prevent overflow */}
    <div 
      className="table-container" 
      style={{ 
        maxHeight: 'calc(297mm - 65mm)',
        overflow: 'hidden' 
      }}
    >
      <table className="w-full table-fixed border-collapse border-x border-b border-black text-xs leading-normal mt-0">
        <thead>
          <tr className="h-8">
            <th className="border border-black w-[12%] p-1 text-left font-bold">{labels.tsLabel}</th>
            <th className="border border-black w-[12%] p-1 text-left font-bold">{labels.dateLabel}</th>
            <th className="border border-black w-[20%] p-1 text-left font-bold">{labels.fromPlaceLabel}</th>
            <th className="border border-black w-[20%] p-1 text-left font-bold">{labels.toPlaceLabel}</th>
            <th className="border border-black w-[15%] p-1 text-right font-bold">{labels.amountLabel}</th>
          </tr>
        </thead>

        <tbody>
          {entries.map((ts) => (
            <tr key={ts.mfNo} className="h-7">
              <td className="border border-black p-1 px-2">{ts.mfNo}</td>
              <td className="border border-black p-1 px-2">{ts.tsDate}</td>
              <td className="border border-black p-1 px-2">{ts.fromPlace}</td>
              <td className="border border-black p-1 px-2">{ts.toPlace}</td>
              <td className="border border-black p-1 px-2 text-right">
                ₹{(ts.totalAmount ?? 0).toLocaleString("en-IN")}
              </td>
            </tr>
          ))}

          {isLastPage && (
            <tr className="h-8 font-bold bg-gray-50">
              <td className="border border-black p-1 px-2 text-right" colSpan={4}>
                {labels.totalLabel}
              </td>
              <td className="border border-black p-1 px-2 text-right">
                ₹{grandTotal.toLocaleString("en-IN")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Compact Footer */}
    <div 
      className="text-center text-[9px] font-sans"
      style={{
        position: 'absolute',
        bottom: '5mm',
        left: 0,
        right: 0
      }}
    >
      Page {pageNumber} of {totalPages}
    </div>
  </div>
);

// --------------------------------------------------
// MAIN PRINT PORTAL COMPONENT
// --------------------------------------------------
export const TripSheetReportPrint = ({
  sheets,
  onClose,
}: {
  sheets: TripSheetEntry[];
  onClose: () => void;
}) => {
  const { printSettings } = useDataContext();
  const labels = printSettings.tripReport;

  const printTriggered = useRef(false);

  // 1. Sort sheets numerically by mfNo (descending: latest first)
  const sortedSheets = useMemo(() => {
    return [...sheets].sort((a, b) => {
      const numA = typeof a.mfNo === 'string' ? parseInt(a.mfNo, 10) : (a.mfNo ?? 0);
      const numB = typeof b.mfNo === 'string' ? parseInt(b.mfNo, 10) : (b.mfNo ?? 0);
      return numB - numA; // Descending order (latest first: 3, 2, 1...)
    });
  }, [sheets]);

  // 2. Calculate Grand Total
  const grandTotal = useMemo(
    () => sortedSheets.reduce((s, ts) => s + (ts.totalAmount ?? 0), 0),
    [sortedSheets]
  );

  // 3. Split into Pages - Optimized for A4 printing
  const ENTRIES_PER_PAGE = 26; // Rows per page with larger text
  const ENTRIES_LAST_PAGE = 24; // Last page (account for total row)
  
  const pages = useMemo(() => {
    const arr: TripSheetEntry[][] = [];
    let remaining = [...sortedSheets];
    
    while (remaining.length > 0) {
      const isLikelyLastPage = remaining.length <= ENTRIES_PER_PAGE;
      const entriesForThisPage = isLikelyLastPage ? ENTRIES_LAST_PAGE : ENTRIES_PER_PAGE;
      const pageEntries = remaining.slice(0, entriesForThisPage);
      arr.push(pageEntries);
      remaining = remaining.slice(entriesForThisPage);
    }
    
    // Handle empty data case
    if (arr.length === 0) {
      arr.push([]);
    }
    
    return arr;
  }, [sortedSheets]);

  // 4. Auto Print Trigger
  useEffect(() => {
    if (sortedSheets.length === 0) return;
    if (printTriggered.current) return;

    const timer = setTimeout(() => {
      printTriggered.current = true;
      window.print();
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [sortedSheets]);

  const handleManualPrint = () => {
    window.print();
  };

  const printContent = (
    <div className="trip-report-print-wrapper">
      <style>{`
        /* =========================================
           1. PRINT STYLES - A4 OPTIMIZED
           ========================================= */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0; 
          }

          body > *:not(.trip-report-print-wrapper) {
            display: none !important;
          }
          #root {
            display: none !important;
          }

          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .trip-report-print-wrapper {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            z-index: 9999;
          }

          .trip-report-print-wrapper * {
            color: black !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          .print-actions { display: none !important; }

          .report-page {
            break-after: page;
            page-break-after: always;
            page-break-inside: avoid;
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            overflow: hidden;
            position: relative;
            background: white !important;
          }
          
          .report-page:last-child { 
            break-after: auto; 
            page-break-after: auto; 
          }
          
          .table-container {
            overflow: hidden !important;
          }
          
          table { 
            page-break-inside: avoid; 
          }
          
          tr { 
            page-break-inside: avoid; 
          }
          
          thead {
            display: table-header-group;
          }
          
          tbody {
            display: table-row-group;
          }
        }

        /* =========================================
           2. SCREEN STYLES
           ========================================= */
        @media screen {
          .trip-report-print-wrapper {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw;
            height: 100dvh;
            background-color: hsl(var(--muted)); 
            z-index: 2147483647;
            overflow-y: auto;
            overflow-x: hidden;
            padding-top: 80px;
            padding-bottom: 40px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            -webkit-overflow-scrolling: touch;
          }

          .report-page {
            background: white;
            color: black;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
            max-height: 297mm;
            position: relative;
            flex-shrink: 0;
            overflow: hidden;
          }
          
          .table-container {
            overflow: hidden;
          }
        }

        /* =========================================
           3. MOBILE RESPONSIVENESS
           ========================================= */
        @media screen and (max-width: 800px) {
          .trip-report-print-wrapper {
            padding-top: 70px;
            padding-left: 0;
            padding-right: 0;
            background-color: #1f2937;
          }

          .report-page {
            transform: scale(0.46);
            transform-origin: top center;
            margin-bottom: -135mm; 
            margin-top: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          }
        }

        @media screen and (min-width: 450px) and (max-width: 800px) {
           .report-page {
             transform: scale(0.65);
             margin-bottom: -90mm;
           }
        }

        /* =========================================
           4. TOOLBAR STYLES
           ========================================= */
        .print-actions {
          position: fixed;
          top: 0; left: 0;
          width: 100%;
          height: 64px;
          background-color: hsl(var(--card));
          color: hsl(var(--foreground));
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          z-index: 2147483648;
        }

        .preview-title {
          font-weight: 700;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .page-info {
          font-size: 14px;
          color: hsl(var(--muted-foreground));
          margin-left: 12px;
        }

        .action-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .btn-base {
          display: flex; 
          align-items: center; 
          gap: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .print-btn {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .print-btn:active { transform: scale(0.96); }
        .print-btn:hover { opacity: 0.9; }

        .close-btn {
          background-color: hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
        }
        .close-btn:active { transform: scale(0.96); }
        .close-btn:hover { opacity: 0.9; }

        @media screen and (max-width: 480px) {
          .preview-title { font-size: 14px; max-width: 120px; }
          .page-info { display: none; }
          .btn-base { padding: 6px 12px; font-size: 13px; }
          .action-group { gap: 8px; }
        }
      `}</style>

      {/* HEADER TOOLBAR */}
      <div className="print-actions">
        <div>
          <span className="preview-title">Trip Report Preview</span>
          <span className="page-info">
            {pages.length} {pages.length === 1 ? 'page' : 'pages'} • {sortedSheets.length} entries
          </span>
        </div>
        <div className="action-group">
          <button onClick={handleManualPrint} className="btn-base print-btn">
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button onClick={onClose} className="btn-base close-btn">
            <X size={18} />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT PAGES */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {pages.map((p, i) => (
          <ReportPage
            key={i}
            entries={p}
            pageNumber={i + 1}
            totalPages={pages.length}
            isLastPage={i === pages.length - 1}
            grandTotal={grandTotal}
            labels={labels}
          />
        ))}
      </div>
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};

