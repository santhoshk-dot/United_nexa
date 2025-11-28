import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

// Helper to detect mobile devices
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
    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current;

    // Safety check
    if (!rootElement || !printWrapper) {
      console.error("Print elements not found");
      return;
    }

    const isMobile = isMobileScreen();

    // ---------------------------------------------------------
    // 📱 MOBILE LOGIC: Aggressive JS Force-Hide (Reliability)
    // ---------------------------------------------------------
    if (isMobile) {
      // 1. Save original styles
      const originalRootDisplay = rootElement.style.display;
      const originalWrapperDisplay = printWrapper.style.display;

      // 2. Define Cleanup
      const cleanupMobile = () => {
        rootElement.style.display = originalRootDisplay;
        printWrapper.style.display = originalWrapperDisplay;
        window.removeEventListener("afterprint", cleanupMobile);
        onClose();
      };

      window.addEventListener("afterprint", cleanupMobile);

      // 3. Force Hide UI / Show Wrapper using JS
      rootElement.style.display = "none";
      printWrapper.style.display = "block";

      // 4. Trigger Print
      setTimeout(() => {
        window.print();
        // Fallback cleanup if afterprint fails on some mobile browsers
        setTimeout(cleanupMobile, 1000); 
      }, 500);
    } 
    
    // ---------------------------------------------------------
    // 🖥️ DESKTOP LOGIC: Passive CSS (Aesthetics)
    // ---------------------------------------------------------
    else {
      // 1. Just handle the close event
      const cleanupDesktop = () => {
        window.removeEventListener("afterprint", cleanupDesktop);
        onClose();
      };

      window.addEventListener("afterprint", cleanupDesktop);

      // 2. Trigger Print (The CSS below will handle hiding/showing)
      setTimeout(() => {
        window.print();
      }, 350);
    }

    // Cleanup on unmount (safety net)
    return () => {
        // We can't easily reference the specific cleanup function here without 
        // extracting them, but since onClose unmounts this component, 
        // the logic generally holds. 
    };

  }, [onClose]);

  const printContent = (
    // Note: 'display: none' is helpful for the JS Logic initial state, 
    // but for Desktop CSS logic, the @media print overrides it.
    <div className="ts-print-wrapper" ref={printRef} style={{ display: 'none' }}>
      <style>{`
        
        @media print {
          /* --------------------------------------------------- */
          /* DESKTOP CSS LOGIC (Standard CSS Hiding)             */
          /* This runs when we DON'T hide #root via JS           */
          /* --------------------------------------------------- */

          /* Hide everything in body that isn't our wrapper */
          body > *:not(.ts-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
          }

          /* Force show our wrapper */
          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: absolute !important; /* Changed to absolute for better flow */
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 999999 !important;
          }

          /* --------------------------------------------------- */
          /* SHARED STYLES                                       */
          /* --------------------------------------------------- */
          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
          
          /* Ensure white background */
          html, body {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
