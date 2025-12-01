import { useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { TripSheetEntry } from "../../types"; // Ensure this type is correct
import { TripSheetPrintCopy } from "./TripSheetPrintCopy"; // Ensure this component is correct
import { useData } from "../../hooks/useData"; // Ensure useData returns getTripSheet
import { X, Printer } from 'lucide-react'; // Import icons

export interface TripSheetPrintJob {
  mfNos: string[];
  onClose: () => void;
}

export const TripSheetPrintManager = ({
  mfNos,
  onClose,
}: TripSheetPrintJob) => {
  const { getTripSheet } = useData();
  // We no longer need printRef for display logic, but keeping it isn't harmful.
  const printTriggered = useRef(false);

  // Filter out any missing trip sheets
  const sheets: TripSheetEntry[] = useMemo(() => {
    // We assume getTripSheet returns TripSheetEntry | undefined
    return mfNos
      .map((id) => getTripSheet(id))
      .filter(Boolean) as TripSheetEntry[];
  }, [mfNos, getTripSheet]);


  const printPages = useMemo(() => {
    return sheets.map((sheet) => (
      // The print-page class is crucial for CSS page breaking/preview scaling
      <div className="print-page" key={sheet.mfNo}>
        <TripSheetPrintCopy sheet={sheet} />
      </div>
    ));
  }, [sheets]);

  // Handle manual print click
  const handleManualPrint = useCallback(() => {
    window.print();
  }, []);

  // --- AUTO PRINT & CLEANUP LOGIC ---
  useEffect(() => {
    if (sheets.length === 0) return;
    if (printTriggered.current) return;
    
    const handleAfterPrint = () => {
      // Remove the listener before calling onClose
      window.removeEventListener("afterprint", handleAfterPrint);
      onClose();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    // Auto-trigger print after a short delay to ensure the DOM is mounted and styles are loaded
    // Using a simple delay (e.g., 500ms) for all devices is often sufficient with modern CSS
    const timer = setTimeout(() => {
      printTriggered.current = true;
      window.print();
    }, 500); 

    // Cleanup on unmount (safety net)
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };

  }, [sheets.length, onClose]); // Dependency array includes sheets.length and onClose

  if (sheets.length === 0) return null;

  const printContent = (
    // The ts-print-wrapper MUST be rendered as the portal root
    <div className="ts-print-wrapper">
      <style>{`
        /* =========================================
           1. PRINT STYLES (The Output Paper)
           ========================================= */
        @media print {
          /* Remove browser default margins to prevent spillover */
          @page {
            size: A4;
            margin: 0;
          }
          
          /* Hide the main App and everything else */
          body > *:not(.ts-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
          }
          #root { display: none !important; }

          /* Wrapper takes over the whole document */
          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important; left: 0 !important; width: 100% !important;
            margin: 0 !important; padding: 0 !important;
            background: white !important;
            z-index: 999999 !important;
          }

          /* Force text color to black for printing */
          .ts-print-wrapper * {
            color: black !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          /* Hide Toolbar in Print */
          .print-actions { display: none !important; }

          /* STRICT PAGE BREAKING & SIZING */
          .print-page {
            break-after: page;
            page-break-after: always;
            width: 210mm;
            /* Force exact A4 height minus a tiny buffer to prevent 2nd page spillover */
            height: 296mm; 
            overflow: hidden; /* Clip any tiny overflow */
            position: relative;
          }
        }

        /* =========================================
           2. SCREEN STYLES (The Preview Overlay)
           ========================================= */
        @media screen {
          /* The wrapper is ALWAYS fixed and visible on screen */
          .ts-print-wrapper {
            display: flex; /* Show the preview manually on screen */
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw;
            height: 100dvh;
            
            /* Theme-aware background color */
            background-color: hsl(var(--muted, 210 40% 96.1%)); 
            
            z-index: 2147483647; 
            overflow-y: auto;
            overflow-x: hidden;
            
            /* Layout for centering pages */
            padding-top: 80px; 
            padding-bottom: 40px;
            box-sizing: border-box;
            flex-direction: column;
            align-items: center;
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
          }
          
          .print-page {
            /* Scale A4 (approx 794px) down to fit ~375px screens */
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
        /* Toolbar is ONLY visible on SCREEN */
        @media screen {
          .print-actions {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            height: 64px;
            
            /* Theme variables for colors */
            background-color: hsl(var(--card, 0 0% 100%));
            color: hsl(var(--foreground, 222.2 47.4% 11.2%));
            border-bottom: 1px solid hsl(var(--border, 214.3 31.8% 91.4%));
            
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
            background-color: hsl(var(--primary, 221.2 83.2% 53.3%));
            color: hsl(var(--primary-foreground, 210 20% 98%));
          }
          .print-btn:active { transform: scale(0.96); }
          .print-btn:hover { opacity: 0.9; }

          /* Themed Destructive Button */
          .close-btn {
            background-color: hsl(var(--destructive, 0 84.2% 60.2%));
            color: hsl(var(--destructive-foreground, 210 20% 98%));
          }
          .close-btn:active { transform: scale(0.96); }
          .close-btn:hover { opacity: 0.9; }

          /* Small screen adjustments for toolbar */
          @media (max-width: 480px) {
            .preview-title { font-size: 14px; max-width: 120px; }
            .btn-base { padding: 6px 12px; font-size: 13px; }
            .action-group { gap: 8px; }
          }
        }
      `}</style>

      {/* HEADER TOOLBAR (Visible only on screen via CSS) */}
      <div className="print-actions">
        <span className="preview-title">
          Preview ({sheets.length} Trip Sheets)
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
        {printPages}
      </div>
    </div>
  );

  return createPortal(printContent, document.body);
};
