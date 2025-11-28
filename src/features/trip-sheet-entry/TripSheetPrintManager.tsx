import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

// Utility function to check if the screen is likely mobile size (based on common breakpoints)
const isMobileScreen = () => window.innerWidth < 768;


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
    const isMobile = isMobileScreen(); // Determine device type

    if (!rootElement || !printWrapper) {
      console.error("Print elements (root or wrapper) not found.");
      return;
    }

    // --- JS FORCE FIX START (Conditional Logic Added) ---
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
    
    // 3. Define afterprint listener (for reliable mobile cleanup)
    const afterPrint = () => {
      setTimeout(cleanupStyles, 500); 
    };

    // 4. Register 'afterprint' listener only for mobile/small screens
    if (isMobile) {
        window.addEventListener("afterprint", afterPrint);
    }

    // 5. Force visibility change before print call (Required for both desktop/mobile to initiate print)
    rootElement.style.display = "none";
    printWrapper.style.display = "block";

    // 6. Trigger print after a delay
    const printTimeout = setTimeout(() => {
      window.print();

        // 🔥 DESKTOP VISUAL FIX (Desktop only: Re-show the main UI immediately)
        if (!isMobile) {
            rootElement.style.display = originalRootDisplay;
            // The final cleanup (onClose) will happen when the component unmounts.
        }
    }, 350);

    // --- JS FORCE FIX END ---

    // 7. Return cleanup function to run on component unmount
    return () => {
      window.removeEventListener("afterprint", afterPrint);
      clearTimeout(printTimeout);
      // Ensure styles are reverted if component unmounts (necessary for desktop fix)
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
                background-color: white !important; /* Ensure white background */
                color: black !important; /* Ensure black text */
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
