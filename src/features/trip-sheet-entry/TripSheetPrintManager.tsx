import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

export const TripSheetPrintManager = ({
  mfNos,
  onClose,
}: TripSheetPrintManagerProps) => {
  const { getTripSheet } = useData();
  const printRef = useRef<HTMLDivElement>(null); // Ref for the print wrapper

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

    if (!rootElement || !printWrapper) {
      console.error("Print elements (root or wrapper) not found.");
      return;
    }

    // --- JS FORCE FIX START ---
    // 1. Store original styles
    const originalRootDisplay = rootElement.style.display;
    const originalWrapperDisplay = printWrapper.style.display;

    // 2. Define the cleanup function
    const cleanupStyles = () => {
      rootElement.style.display = originalRootDisplay;
      printWrapper.style.display = originalWrapperDisplay;
      onClose();
      window.removeEventListener("afterprint", afterPrint);
    };
    
    // 3. Define afterprint listener
    const afterPrint = () => {
      // Use a timeout to ensure styles are restored *after* the print dialog closes
      setTimeout(cleanupStyles, 500); 
    };

    window.addEventListener("afterprint", afterPrint);

    // 4. Force visibility change before print call
    // This overrides any conflicting CSS for the print context
    rootElement.style.display = "none";
    printWrapper.style.display = "block";

    // 5. Trigger print after a delay
    setTimeout(() => {
      window.print();
    }, 350);

    // --- JS FORCE FIX END ---

    // 6. Return cleanup function to run on component unmount (before print)
    return () => {
      window.removeEventListener("afterprint", afterPrint);
      // Ensure styles are reverted if component unmounts before print
      cleanupStyles(); 
    };
  }, [onClose]);

  const printContent = (
    // Set display to none initially, let JS control its visibility
    <div className="ts-print-wrapper" ref={printRef} style={{ display: 'none' }}>
      <style>
        {`
          /* ------------------------------------------------ */
          /* UNIVERSAL PRINT RESET AND CONTAINER HIDING LOGIC */
          /* ------------------------------------------------ */
          /* CSS is now mainly a fallback, but still necessary for non-JS print */
          @media print {
            
            /* HIDE EVERYTHING EXCEPT THE PRINT WRAPPER */
            #root, 
            body > *:not(.ts-print-wrapper) {
              display: none !important;
              visibility: hidden !important;
              /* Aggressive resets */
              width: 0 !important;
              height: 0 !important;
              position: fixed !important; 
              top: -9999px !important;
            }

            /* ENSURE THE PRINT WRAPPER IS VISIBLE AND DOMINANT */
            .ts-print-wrapper {
              display: block !important;
              visibility: visible !important;
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* MOBILE SPECIFIC BODY RESET (Fallback) */
            body {
              display: block !important;
              visibility: visible !important;
              overflow: visible !important;
            }
          }
        `}
      </style>
      
      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
