import { useEffect, useMemo, useRef } from 'react'; // <-- Added useRef back
import ReactDOM from 'react-dom';
import type { GcEntry, Consignor, Consignee } from "../../types";
import { GcPrintCopy } from "./GcPrintCopy"; 

export interface GcPrintJob {
  gc: GcEntry;
  consignor?: Consignor;
  consignee?: Consignee;
}

interface GcPrintManagerProps {
  jobs: GcPrintJob[];
  onClose: () => void;
}

export const GcPrintManager = ({ jobs, onClose }: GcPrintManagerProps) => {
  // 🛑 NEW: Ref for the print wrapper element
  const printRef = useRef<HTMLDivElement>(null); 

  const printPages = useMemo(() => {
    return jobs.flatMap(({ gc, consignor, consignee }) => {
      if (!consignor || !consignee) {
        return [];
      }
      // Ensure each copy has the page-break-after style applied externally if GcPrintCopy doesn't handle it
      return [
        <GcPrintCopy
          key={`${gc.id}-consignor`}
          gc={gc}
          consignor={consignor}
          consignee={consignee}
          copyType="CONSIGNOR COPY"
        />,
        <GcPrintCopy
          key={`${gc.id}-consignee`}
          gc={gc}
          consignor={consignor}
          consignee={consignee}
          copyType="CONSIGNEE COPY"
        />,
        <GcPrintCopy
          key={`${gc.id}-lorry`}
          gc={gc}
          consignor={consignor}
          consignee={consignee}
          copyType="LORRY COPY"
        />,
      ];
    });
  }, [jobs]);


  // --- FIXED PRINT LOGIC with JS FORCE HIDE/SHOW ---
  useEffect(() => {
    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current; // Get the wrapper element

    if (!rootElement || !printWrapper) {
        console.error("Print elements (root or wrapper) not found.");
        return;
    }

    // --- 1. JS FORCE FIX START (CRITICAL FOR MOBILE/BLANK DESKTOP) ---
    // Store original styles to ensure the app is restored correctly
    const originalRootDisplay = rootElement.style.display;
    const originalWrapperDisplay = printWrapper.style.display;

    // Define the cleanup function
    const cleanupStyles = () => {
        // Restore original styles
        rootElement.style.display = originalRootDisplay;
        printWrapper.style.display = originalWrapperDisplay;
        onClose(); // Close the manager
        window.removeEventListener("afterprint", afterPrint);
    };
    
    // Define afterprint listener to clean up styles after print dialog is closed
    const afterPrint = () => {
        // Use a timeout to ensure cleanup runs *after* the print dialog closes
        setTimeout(cleanupStyles, 500); 
    };

    window.addEventListener("afterprint", afterPrint);

    // Force visibility change *before* print call
    rootElement.style.display = "none";
    printWrapper.style.display = "block";

    // Trigger print after a short delay
    const printTimeout = setTimeout(() => {
        window.print();
    }, 350); // Increased delay for safety

    // --- JS FORCE FIX END ---

    // Return cleanup function to run on component unmount
    return () => {
        window.removeEventListener("afterprint", afterPrint);
        clearTimeout(printTimeout);
        // Ensure cleanup runs if the component unmounts unexpectedly
        cleanupStyles(); 
    };
  }, [onClose]);

  const printContent = (
    // 🛑 NEW: Add ref and set initial style to 'none', let JS control visibility
    <div className="gc-print-wrapper" ref={printRef} style={{ display: 'none' }}>
      <style>{`
        @media print {
          /* 🛑 HIDE EVERYTHING AGGRESSIVELY: Target #root and body children */
          #root, 
          body > *:not(.gc-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            position: fixed !important; 
            top: -9999px !important;
          }

          /* 🛑 SHOW REPORT WRAPPER: Use block, static position, and forced white background */
          .gc-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            background-color: #fff !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* This class comes from GcPrintCopy.tsx */
          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          
          /* Global page and background settings */
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        @media screen {
          /* On screen, hide the print wrapper */
          .gc-print-wrapper {
            display: none;
          }
        }
      `}</style>
      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
