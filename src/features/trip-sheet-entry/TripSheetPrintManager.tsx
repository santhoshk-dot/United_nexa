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

// Helper to detect mobile devices (screens smaller than 768px)
const isMobileScreen = () => window.innerWidth < 800; // Using 800px for consistency with CSS

export const TripSheetPrintManager = ({
  mfNos,
  onClose,
}: TripSheetPrintJob) => {
  const { getTripSheet } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  // Filter out any missing trip sheets
  const sheets: TripSheetEntry[] = useMemo(() => {
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
    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current;

    if (!rootElement || !printWrapper) {
      console.error("Print elements not found");
      return;
    }

    const isMobile = isMobileScreen();
    let printTimeout: number | undefined;
    let originalRootDisplay: string | undefined;
    let originalWrapperDisplay: string | undefined;

    // The cleanup function for mobile (needs to restore styles)
    const cleanupMobile = () => {
        // Use setTimeout to ensure cleanup runs *after* the print dialog closes
        setTimeout(() => {
            // Restore styles
            rootElement.style.display = originalRootDisplay || '';
            printWrapper.style.display = originalWrapperDisplay || '';

            window.removeEventListener("afterprint", cleanupMobile);
            onClose();
        }, 500);
    };
    
    // The cleanup function for desktop (only needs to call onClose)
    const cleanupDesktop = () => {
        window.removeEventListener("afterprint", cleanupDesktop);
        onClose();
    };


    if (isMobile) {
      // 1. Save original styles
      originalRootDisplay = rootElement.style.display;
      originalWrapperDisplay = printWrapper.style.display;

      // 2. Listen for when print dialog closes
      window.addEventListener("afterprint", cleanupMobile);

      // 3. FORCE DOM MANIPULATION (Hides App, Shows Wrapper)
      rootElement.style.setProperty('display', 'none', 'important');
      printWrapper.style.setProperty('display', 'block', 'important'); // Overrides initial 'display: none' in CSS

      // 4. Trigger Print
      printTimeout = setTimeout(() => {
        window.print();
      }, 750); // Increased delay for mobile responsiveness
    }

    else { // DESKTOP LOGIC (CSS only)
      // 1. Listen for when print dialog closes
      window.addEventListener("afterprint", cleanupDesktop);

      // 2. Trigger Print (The print-actions toolbar is visible now)
      printTimeout = setTimeout(() => {
        window.print();
      }, 350);
    }

    // Cleanup on unmount (safety net)
    return () => {
        if (isMobile) {
            window.removeEventListener("afterprint", cleanupMobile);
            // If component unmounts before cleanupMobile runs, ensure styles are reverted
            if (rootElement.style.getPropertyValue('display') === 'none') {
                rootElement.style.display = originalRootDisplay || '';
                printWrapper.style.display = originalWrapperDisplay || '';
            }
        } else {
            window.removeEventListener("afterprint", cleanupDesktop);
        }

        if (printTimeout) clearTimeout(printTimeout);
    };

  }, [onClose]); // Dependency array includes onClose

  const printContent = (
    <div className="ts-print-wrapper" ref={printRef}>
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
          }
          /* #root is handled by JS on mobile, but this ensures desktop hiding */
          #root { display: none !important; }

          /* Reset HTML/Body for full page usage */
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }

          /* Position our wrapper to take over the document */
          .ts-print-wrapper {
            display: block !important;
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
          /* Hide the wrapper by default (JS will show it on desktop, JS/Mobile CSS overrides for mobile) */
          .ts-print-wrapper {
            display: none; /* Initial state, overridden by JS/toolbar display */
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw;
            height: 100dvh;
            
            /* Theme-aware background color */
            background-color: hsl(var(--muted)); 
            
            z-index: 2147483647; 
            overflow-y: auto;
            overflow-x: hidden;
            
            /* Layout for centering pages */
            padding-top: 80px; 
            padding-bottom: 40px;
            box-sizing: border-box;
            display: flex;
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
          /* This overrides the default display: none on screen to show the preview */
          .ts-print-wrapper {
             display: flex; /* Show the preview manually on mobile/tablet screens */
             padding-top: 70px;
             padding-left: 0;
             padding-right: 0;
             /* You can choose a different background if you like */
             /* background-color: #1f2937; */ 
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
      {/* The style below ensures centering of the A4 pages in the preview */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {printPages}
      </div>
    </div>
  );

  return createPortal(printContent, document.body);
};
