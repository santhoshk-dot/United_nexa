import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

// Helper to detect mobile devices (screens smaller than 768px)
const isMobileScreen = () => window.innerWidth < 768;


export const TripSheetPrintManager = ({
  mfNos,
  onClose,
}: TripSheetPrintManagerProps) => {
  const { getTripSheet } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  const printPages = useMemo(() => {
    const sheets: TripSheetEntry[] = mfNos
      .map((id) => getTripSheet(id))
      .filter(Boolean) as TripSheetEntry[];

    return sheets.map((sheet) => (
      <div className="print-page" key={sheet.mfNo}>
        <TripSheetPrintCopy sheet={sheet} />
      </div>
    ));
  }, [mfNos, getTripSheet]);

  useEffect(() => {
    // If no jobs, don't attempt to print
    if (mfNos.length === 0) return;

    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current;
    const isMobile = isMobileScreen();
    let printTimeout: number | undefined;

    if (!rootElement || !printWrapper) {
      console.error("Print elements not found");
      return;
    }

    // --- Universal function to restore styles ---
    const restoreStyles = (originalRootDisplay: string, originalWrapperDisplay: string) => {
      // Restore original styles by removing the forced 'important' values
      rootElement.style.removeProperty('display');
      printWrapper.style.removeProperty('display');
      
      // Fallback: Directly assign if properties were originally set
      if (originalRootDisplay) rootElement.style.display = originalRootDisplay;
      if (originalWrapperDisplay) printWrapper.style.display = originalWrapperDisplay;

      onClose();
    };
    
    // --- 🖥️ DESKTOP LOGIC: Cleanup for CSS-only approach ---
    const cleanupDesktop = () => {
      setTimeout(() => {
        window.removeEventListener("afterprint", cleanupDesktop);
        onClose(); // Only close, CSS handles the rest
      }, 500);
    };


    // --- 📱 MOBILE LOGIC: Cleanup for JS Force Fix approach ---
    const cleanupMobile = (originalRootDisplay: string, originalWrapperDisplay: string) => () => {
      setTimeout(() => {
        window.removeEventListener("afterprint", cleanupMobile(originalRootDisplay, originalWrapperDisplay));
        restoreStyles(originalRootDisplay, originalWrapperDisplay);
      }, 500);
    };

    // ---------------------------------------------------------
    // 📱 MOBILE EXECUTION
    // ---------------------------------------------------------
    if (isMobile) {
      const originalRootDisplay = rootElement.style.display;
      const originalWrapperDisplay = printWrapper.style.display;

      // 1. Listen for when print dialog closes (using the function that captures original styles)
      const boundCleanupMobile = cleanupMobile(originalRootDisplay, originalWrapperDisplay);
      window.addEventListener("afterprint", boundCleanupMobile);

      // 2. FORCE DOM MANIPULATION (The Mobile Fix)
      // Use setProperty to guarantee override
      rootElement.style.setProperty('display', 'none', 'important'); 
      printWrapper.style.setProperty('display', 'block', 'important');

      // 3. Trigger Print (increased delay for mobile rendering)
      printTimeout = setTimeout(() => {
        window.print();
      }, 750); 
    } 
    
    // ---------------------------------------------------------
    // 🖥️ DESKTOP EXECUTION
    // ---------------------------------------------------------
    else {
      // 1. Listen for cleanup
      window.addEventListener("afterprint", cleanupDesktop);

      // 2. Trigger Print 
      printTimeout = setTimeout(() => {
        window.print();
      }, 350);
    }

    // Cleanup on unmount (safety net)
    return () => {
        if (printTimeout) clearTimeout(printTimeout);
        
        // Remove the correct listener based on which branch was executed
        if (isMobile) {
            // Need to remove the listener that was actually registered
            window.removeEventListener("afterprint", cleanupMobile(rootElement.style.display, printWrapper.style.display));
            // Ensure styles are reverted if the component unmounts unexpectedly
            rootElement.style.removeProperty('display');
            printWrapper.style.removeProperty('display');
        } else {
            window.removeEventListener("afterprint", cleanupDesktop);
        }
    };

  }, [mfNos.length, onClose]); // Depend on relevant props/state

  const printContent = (
    // Initial display is intentionally not 'none' here. 
    // It's hidden by CSS @media screen, or shown by JS on mobile.
    <div className="ts-print-wrapper" ref={printRef}> 
      <style>{`
        @media print {
          /* --------------------------------------------------- */
          /* DESKTOP CSS LOGIC & MOBILE FALLBACK                     */
          /* Hides the #root and other body children (default UI) */
          /* --------------------------------------------------- */

          #root, 
          body > *:not(.ts-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            position: fixed !important; 
            top: -9999px !important;
            background-color: white !important;
          }

          /* Force show our wrapper (the print content) */
          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            /* Use position: static for print flow, or absolute if page margins are an issue */
            position: absolute !important; 
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            z-index: 999999 !important;
            color: black !important; /* Ensure black text for PDF generation */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* --------------------------------------------------- */
          /* SHARED STYLES                                       */
          /* --------------------------------------------------- */
          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
          
          html, body {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        /* --------------------------------------------------- */
        /* SCREEN STYLES (Hides the print content when not printing) */
        /* --------------------------------------------------- */
        @media screen {
            .ts-print-wrapper {
                display: none;
            }
        }
      `}</style>

      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
