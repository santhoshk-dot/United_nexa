import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../../types";
import { X, Printer } from 'lucide-react';

interface TripSheetPrintManagerProps {
  sheets: TripSheetEntry[];
  onClose: () => void;
}

export const TripSheetPrintManager = ({
  sheets,
  onClose,
}: TripSheetPrintManagerProps) => {
  const printTriggered = useRef(false);

  const dataToPrint = sheets;

  // --- AUTO PRINT TRIGGER ---
  useEffect(() => {
    if (dataToPrint.length === 0) return;
    if (printTriggered.current) return;

    const timer = setTimeout(() => {
      printTriggered.current = true;
      window.print();
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [dataToPrint]);

  const handleManualPrint = () => {
    window.print();
  };

  if (dataToPrint.length === 0) return null;

  const printContent = (
    <div className="ts-print-wrapper">
      <style>{`
        /* =========================================
           1. PRINT STYLES
           ========================================= */
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          /* Hide main app UI */
          body > *:not(.ts-print-wrapper) {
            display: none !important;
          }
          #root {
            display: none !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 210mm;
            height: 297mm;
          }

          .ts-print-wrapper {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
          }

          .ts-print-wrapper * {
            color: black !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          /* Hide Toolbar */
          .print-actions { display: none !important; }

          /* Page content styling - Full A4 */
          .ts-page-content {
            width: 210mm;
            height: 297mm;
            padding: 6mm 10mm;
            box-sizing: border-box;
            overflow: hidden;
          }

          /* Page break for continuation pages */
          .ts-page-break {
            break-before: page;
            page-break-before: always;
          }

          /* Page break between different trip sheets */
          .ts-sheet-wrapper + .ts-sheet-wrapper .ts-page-content:first-child {
            break-before: page;
            page-break-before: always;
          }
        }

        /* =========================================
           2. SCREEN STYLES (Preview)
           ========================================= */
        @media screen {
          .ts-print-wrapper {
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

          .ts-page-content {
            background: white;
            color: black;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
            width: 210mm;
            height: 297mm;
            padding: 6mm 10mm;
            box-sizing: border-box;
          }
        }

        /* =========================================
           3. MOBILE RESPONSIVENESS
           ========================================= */
        @media screen and (max-width: 800px) {
          .ts-print-wrapper {
            padding-top: 70px;
            background-color: #1f2937;
          }

          .ts-page-content {
            transform: scale(0.46);
            transform-origin: top center;
            margin-bottom: -120mm;
            margin-top: 10px;
          }
        }

        @media screen and (min-width: 450px) and (max-width: 800px) {
          .ts-page-content {
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
        }

        .action-group {
          display: flex;
          gap: 10px;
        }

        .btn-base {
          display: flex; align-items: center; gap: 8px;
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
        .print-btn:hover { opacity: 0.9; }

        .close-btn {
          background-color: hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
        }
        .close-btn:hover { opacity: 0.9; }

        @media screen and (max-width: 480px) {
          .preview-title { font-size: 14px; }
          .btn-base { padding: 6px 12px; font-size: 13px; }
        }

        /* =========================================
           5. TRIP SHEET COMPONENT STYLES
           ========================================= */
        .ts-page-heading {
          text-align: center;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 5px;
        }

        .ts-box {
          border: 2px solid #000;
          box-sizing: border-box;
          width: 100%;
          height: calc(100% - 28px);
          display: flex;
          flex-direction: column;
        }

        .ts-box-header {
          flex-shrink: 0;
        }

        .ts-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #000;
        }

        .ts-company-block { 
          width: 64%; 
          border-right: 1px solid #000; 
          font-weight: 600;
          padding: 6px 8px;
        }

        .ts-company-title { 
          font-weight: 900; 
          font-size: 20px; 
        }

        .ts-company-sub { 
          font-size: 11px; 
          margin-top: 2px; 
        }

        .ts-meta-block {
          width: 36%;
          text-align: left;
          font-size: 13px;
          line-height: 1.4;
          padding: 6px 8px;
        }

        .ts-fromto {
          display: flex;
          justify-content: space-between;
          padding: 5px 8px;
          font-weight: 200;
          font-size: 13px;
          border-bottom: 1px solid #000;
        }

        .ts-table-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .ts-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          height: 100%;
        }

        .ts-table thead th {
          border-bottom: 1px solid #000;
          border-right: 1px solid #000;
          padding: 5px;
          font-weight: 700;
          text-align: left;
        }
        .ts-table thead th:last-child {
          border-right: none;
        }

        .ts-table tbody {
          height: 100%;
        }

        .ts-table tbody tr {
          height: auto;
        }

        .ts-table tbody td {
          padding: 4px 5px;
          border-right: 1px solid #000;
          vertical-align: top;
          line-height: 1.3;
        }
        .ts-table tbody td:last-child {
          border-right: none;
        }

        .ts-table tbody tr.ts-filler-row {
          height: 100%;
        }

        .ts-table tbody tr.ts-filler-row td {
          border-bottom: none;
        }

        .ts-total-row td {
          border-top: 1px solid #000;
          border-bottom: none;
          padding: 6px 5px;
          font-weight: 800;
        }

        .ts-box-footer {
          flex-shrink: 0;
          border-top: 1px solid #000;
          padding: 5px 8px;
          margin-top: auto;
        }

        .ts-footer {
          font-size: 11px;
          line-height: 1.4;
        }

        .ts-dash {
          display: inline-block;
          border-bottom: 1px dashed #000;
          padding: 0 5px;
          min-width: 100px;
        }

        .ts-footer-grid {
          margin-top: 6px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
          font-size: 11px;
        }

        .ts-col-line {
          border-bottom: 1px dashed #000;
          padding-bottom: 2px; 
          display: inline-block;
          min-width: 110px;
        }

        .ts-legal {
          margin-top: 6px;
          font-size: 10px;
          text-align: left;
          line-height: 1.3;
        }

        .ts-sigs {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 12px;
          font-size: 11px;
          padding: 0 20px;
        }

        .ts-sig-box {
          text-align: center;
          width: 45%;
        }

        .ts-sig-line {
          display: block;
          width: 70%;
          height: 1px;
          margin: 0 auto 5px;
          border-top: 1px solid #000;
        }

        .ts-sig-name {
          font-weight: bold;
          margin-bottom: 5px;
          min-height: 16px;
        }

        .ts-continuation-header {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          padding: 8px;
          border-bottom: 1px solid #000;
          margin-bottom: 10px;
        }
      `}</style>

      {/* HEADER TOOLBAR */}
      <div className="print-actions">
        <span className="preview-title">
          Preview ({dataToPrint.length} Sheets)
        </span>
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        {dataToPrint.map((sheet) => (
          <div className="ts-sheet-wrapper" key={sheet.id}>
            <TripSheetPrintCopy sheet={sheet} />
          </div>
        ))}
      </div>
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
