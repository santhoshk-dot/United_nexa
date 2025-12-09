import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";
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

  // 🟢 REPLACED MOCK DATA WITH REAL BACKEND DATA
  const dataToPrint = sheets;

  // --- AUTO PRINT TRIGGER ---
  useEffect(() => {
    if (dataToPrint.length === 0) return;
    if (printTriggered.current) return;

    // Small delay ensures content renders into the portal before printing
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

  // Don't render anything if no data
  if (dataToPrint.length === 0) return null;

  const printContent = (
    <div className="ts-print-wrapper">
      <style>{`
        /* =========================================
           1. PRINT STYLES (The Output Paper)
           ========================================= */
        @media print {
          /* Remove browser default margins */
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

          /* Reset HTML/Body */
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }

          /* Wrapper takes over */
          .ts-print-wrapper {
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

          /* Force black text */
          .ts-print-wrapper * {
            color: black !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          /* Hide Toolbar */
          .print-actions { display: none !important; }

          /* Page Breaks */
          .print-page {
            break-after: page;
            page-break-after: always;
            width: 210mm;
            min-height: 297mm; /* Ensure full height usage */
            overflow: hidden; 
            position: relative;
          }
        }

        /* =========================================
           2. SCREEN STYLES (The Preview Overlay)
           ========================================= */
        @media screen {
          .ts-print-wrapper {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw;
            height: 100dvh; /* Mobile-friendly viewport height */
            
            /* Theme-aware background color */
            background-color: hsl(var(--muted)); 
            
            z-index: 2147483647; /* Max Z-Index */
            overflow-y: auto;
            overflow-x: hidden;
            
            /* Layout for centering pages */
            padding-top: 80px; /* Space for fixed header */
            padding-bottom: 40px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            
            -webkit-overflow-scrolling: touch;
          }

          /* Desktop Page Preview Style */
          .print-page {
            background: white;
            color: black; /* Preview text always black */
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
            transform-origin: top center;
            transition: transform 0.2s ease;
            width: 210mm; /* Fixed A4 width */
            min-height: 297mm;
          }
        }

        /* =========================================
           3. MOBILE RESPONSIVENESS (Scaling)
           ========================================= */
        @media screen and (max-width: 800px) {
          .ts-print-wrapper {
            padding-top: 70px;
            padding-left: 0;
            padding-right: 0;
            background-color: #1f2937; /* Darker background on mobile for contrast */
          }

          .print-page {
            /* Scale A4 (794px) down to fit ~375px screens */
            transform: scale(0.46); 
            /* Pull up the whitespace caused by scaling */
            margin-bottom: -135mm; 
            margin-top: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          }
        }

        @media screen and (min-width: 450px) and (max-width: 800px) {
           /* Tablets */
           .print-page {
             transform: scale(0.65);
             margin-bottom: -90mm;
           }
        }

        /* =========================================
           4. TOOLBAR STYLES (Themed)
           ========================================= */
        .print-actions {
          position: fixed;
          top: 0; left: 0;
          width: 100%;
          height: 64px;
          
          /* Theme variables for colors */
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
        
        /* Themed Primary Button */
        .print-btn {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .print-btn:active { transform: scale(0.96); }
        .print-btn:hover { opacity: 0.9; }

        /* Themed Destructive Button */
        .close-btn {
          background-color: hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
        }
        .close-btn:active { transform: scale(0.96); }
        .close-btn:hover { opacity: 0.9; }

        /* Small screen adjustments for toolbar */
        @media screen and (max-width: 480px) {
          .preview-title { font-size: 14px; max-width: 120px; }
          .btn-base { padding: 6px 12px; font-size: 13px; }
          .action-group { gap: 8px; }
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {dataToPrint.map((sheet) => (
          <div className="print-page" key={sheet.id}>
            <TripSheetPrintCopy sheet={sheet} />
          </div>
        ))}
      </div>
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};