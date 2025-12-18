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
  gcNoNumeric: number;
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
      className="report-page bg-white text-black"
      style={{ 
        width: "210mm", 
        height: "297mm",
        maxHeight: "297mm", 
        padding: "8mm 8mm 12mm 8mm",
        boxSizing: "border-box",
        fontFamily: '"Times New Roman", Times, serif',
        overflow: "hidden",
        position: "relative"
      }}
    >
      <ReportHeader label={labels} />

      {/* Table Container */}
      <div style={{ overflow: 'hidden' }}>
        <table className="w-full table-fixed border-collapse border-x border-b border-black text-xs leading-normal mt-0">
          <thead>
            <tr style={{ height: '28px' }}>
              <th className="border border-black w-[8%] p-1 text-left font-bold">{labels.gcLabel}</th>
              <th className="border border-black w-[6%] p-1 text-left font-bold">{labels.stockCountLabel}</th>
              <th className="border border-black w-[18%] p-1 text-center font-bold">{labels.contentLabel}</th>
              <th className="border border-black w-[26%] p-1 text-center font-bold">{labels.consignorLabel}</th>
              <th className="border border-black w-[26%] p-1 text-center font-bold">{labels.consigneeLabel}</th>
              <th className="border border-black w-[12%] p-1 text-center font-bold">{labels.dateLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isSameAsPrevious = idx > 0 && rows[idx - 1].gcNo === row.gcNo;
              const isSameAsNext = idx < rows.length - 1 && rows[idx + 1].gcNo === row.gcNo;

              const getMergedCellClass = (align: 'left' | 'center' | 'right' = 'left', isBold = false) => {
                const base = `p-1 px-2 text-${align} border-l border-r border-black`;
                const top = isSameAsPrevious ? 'border-t-0' : 'border-t border-black';
                const bottom = isSameAsNext ? 'border-b-0' : 'border-b border-black';
                const font = isBold ? 'font-bold' : '';
                return `${base} ${top} ${bottom} ${font}`;
              };

              return (
                <tr key={row.uniqueId} style={{ height: '24px' }}>
                  <td className={getMergedCellClass('left', true)}>
                    {isSameAsPrevious ? "" : row.gcNo}
                  </td>
                  <td className="border border-black p-1 px-2 text-left">{row.quantity}</td>
                  <td className="border border-black p-1 px-2 text-left">
                    {`${row.packing} - ${row.content}`}
                  </td>
                  <td className={`${getMergedCellClass('left')} uppercase whitespace-nowrap overflow-hidden text-ellipsis`}>
                    {isSameAsPrevious ? "" : row.consignorName}
                  </td>
                  <td className={`${getMergedCellClass('left')} uppercase whitespace-nowrap overflow-hidden text-ellipsis`}>
                    {isSameAsPrevious ? "" : row.consigneeName}
                  </td>
                  <td className={getMergedCellClass('center')}>
                    {isSameAsPrevious ? "" : formatDate(row.date)}
                  </td>
                </tr>
              );
            })}

            {/* TOTAL ROW - Only show on the last page */}
            {isLastPage && (
              <tr style={{ height: '28px' }} className="font-bold bg-gray-50">
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
      </div>

      {/* Footer */}
      <div 
        className="text-center text-[9px] font-sans text-black"
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

  // 1. Sort data numerically by gcNo (descending: latest first)
  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      const numA = typeof a.gcNo === 'string' ? parseInt(a.gcNo, 10) : (a.gcNo ?? 0);
      const numB = typeof b.gcNo === 'string' ? parseInt(b.gcNo, 10) : (b.gcNo ?? 0);
      return numB - numA;
    });
  }, [data]);
  
  // 2. Flatten Data
  const flattenedRows = useMemo(() => {
    const rows: StockReportRow[] = [];
    
    if (!sortedData || sortedData.length === 0) return [];

    sortedData.forEach((entry) => {
      const consignorName = entry.consignor?.name || '';
      const consigneeName = entry.consignee?.name || '';
      const date = entry.gcDate || '';
      const gcNo = entry.gcNo || '';
      const gcNoNumeric = typeof gcNo === 'string' ? parseInt(gcNo, 10) : (gcNo ?? 0);

      const hasContentItems = entry.contentItems && Array.isArray(entry.contentItems) && entry.contentItems.length > 0;

      if (hasContentItems) {
        entry.contentItems.forEach((item: any, itemIdx: number) => {
           rows.push({
             uniqueId: `${entry.id || gcNo}-${itemIdx}`,
             gcNo: gcNo,
             gcNoNumeric: gcNoNumeric,
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
           gcNoNumeric: gcNoNumeric,
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
  }, [sortedData]);

  // 3. Calculate Grand Total
  const grandTotal = useMemo(() => {
    return flattenedRows.reduce((sum, row) => sum + row.quantity, 0);
  }, [flattenedRows]);

  // 4. Group rows by GC number to keep them together
  const gcGroups = useMemo(() => {
    const groups: StockReportRow[][] = [];
    let currentGroup: StockReportRow[] = [];
    let currentGcNo = '';

    flattenedRows.forEach((row) => {
      if (row.gcNo !== currentGcNo) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [row];
        currentGcNo = row.gcNo;
      } else {
        currentGroup.push(row);
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }, [flattenedRows]);

  // 5. Smart Pagination - Reduced rows for larger text
  const pages = useMemo(() => {
    const MAX_ROWS_PER_PAGE = 25; // Reduced for larger text size
    const MAX_ROWS_LAST_PAGE = 23; // Leave room for total row
    
    const allPages: StockReportRow[][] = [];
    let currentPage: StockReportRow[] = [];
    
    gcGroups.forEach((group, groupIndex) => {
      const isLastGroup = groupIndex === gcGroups.length - 1;
      const remainingGroups = gcGroups.slice(groupIndex + 1);
      const remainingRowsCount = remainingGroups.reduce((sum, g) => sum + g.length, 0);
      
      const couldBeLastPage = remainingRowsCount + group.length <= MAX_ROWS_LAST_PAGE;
      const effectiveMax = couldBeLastPage ? MAX_ROWS_LAST_PAGE : MAX_ROWS_PER_PAGE;
      
      if (currentPage.length + group.length > effectiveMax) {
        if (group.length > MAX_ROWS_PER_PAGE) {
          if (currentPage.length > 0) {
            allPages.push(currentPage);
            currentPage = [];
          }
          
          let remainingGroup = [...group];
          while (remainingGroup.length > 0) {
            const rowsToTake = Math.min(remainingGroup.length, MAX_ROWS_PER_PAGE);
            const chunk = remainingGroup.slice(0, rowsToTake);
            remainingGroup = remainingGroup.slice(rowsToTake);
            
            if (remainingGroup.length === 0 && !isLastGroup) {
              currentPage = chunk;
            } else if (remainingGroup.length === 0 && isLastGroup) {
              allPages.push(chunk);
            } else {
              allPages.push(chunk);
            }
          }
        } else {
          if (currentPage.length > 0) {
            allPages.push(currentPage);
          }
          currentPage = [...group];
        }
      } else {
        currentPage.push(...group);
      }
    });
    
    if (currentPage.length > 0) {
      allPages.push(currentPage);
    }
    
    if (allPages.length === 0) {
      allPages.push([]);
    }
    
    return allPages;
  }, [gcGroups]);

  // 6. Auto Print Trigger
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
        /* =========================================
           1. PRINT STYLES - A4 OPTIMIZED
           ========================================= */
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; 
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body > *:not(.stock-report-print-wrapper) { 
            display: none !important; 
          }
          
          #root { 
            display: none !important; 
          }
          
          html, body { 
            height: auto !important;
            width: 210mm !important;
            margin: 0 !important; 
            padding: 0 !important; 
            overflow: visible !important; 
            background: white !important;
          }
          
          .stock-report-print-wrapper { 
            display: block !important; 
            position: static !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .stock-report-print-wrapper * { 
            color: black !important; 
          }
          
          .print-actions { 
            display: none !important; 
          }
          
          .report-page { 
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            min-height: 297mm !important;
            page-break-after: always;
            page-break-inside: avoid;
            break-after: page;
            break-inside: avoid;
            overflow: hidden !important;
            position: relative !important;
            background: white !important;
            margin: 0 !important;
            padding: 8mm 8mm 12mm 8mm !important;
            box-sizing: border-box !important;
          }
          
          .report-page:last-child { 
            page-break-after: auto;
            break-after: auto;
          }
          
          table { 
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          tr { 
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
          .stock-report-print-wrapper { 
            position: fixed; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
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
            min-height: 297mm; 
            height: 297mm; 
            max-height: 297mm; 
            position: relative; 
            flex-shrink: 0; 
            overflow: hidden; 
          }
        }

        /* =========================================
           3. MOBILE RESPONSIVENESS
           ========================================= */
        @media screen and (max-width: 800px) {
          .stock-report-print-wrapper { 
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
          top: 0; 
          left: 0; 
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
        
        .btn-base:hover { 
          opacity: 0.9; 
        }
        
        .btn-base:active {
          transform: scale(0.96);
        }
        
        .print-btn { 
          background-color: hsl(var(--primary)); 
          color: hsl(var(--primary-foreground)); 
        }
        
        .close-btn { 
          background-color: hsl(var(--destructive)); 
          color: hsl(var(--destructive-foreground)); 
        }

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
          <span className="preview-title">Stock Report Preview</span>
          <span className="page-info">
            {pages.length} {pages.length === 1 ? 'page' : 'pages'} • {flattenedRows.length} items
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
