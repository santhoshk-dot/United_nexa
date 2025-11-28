import { useEffect, useMemo, useRef } from 'react'; 
import ReactDOM from 'react-dom';
import type { GcEntry, Consignor, Consignee } from "../../types";
import { GcPrintCopy } from "./GcPrintCopy"; 

// Helper to detect mobile devices (screens smaller than 768px)
const isMobileScreen = () => window.innerWidth < 768;

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
  // 🛑 Ref for the print wrapper element
  const printRef = useRef<HTMLDivElement>(null); 

  const printPages = useMemo(() => {
    return jobs.flatMap(({ gc, consignor, consignee }) => {
      if (!consignor || !consignee) {
        return [];
      }
      // Each GC generates 3 copies: Consignor, Consignee, and Lorry.
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


  // --- PRINT LOGIC with SPLIT MOBILE/DESKTOP FIX ---
  useEffect(() => {
    if (jobs.length === 0) return;

    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current; 
    const isMobile = isMobileScreen(); // Determine device type

    if (!rootElement || !printWrapper) {
        console.error("Print elements (root or wrapper) not found.");
        return;
    }

    let printTimeout: number;

    // --- 1. DEFINE UNIVERSAL CLEANUP ---
    // Store original styles *before* they might be changed by JS
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
    
    // ---------------------------------------------------------
    // 2. MOBILE LOGIC: JS FORCE FIX (Hides UI)
    // ---------------------------------------------------------
    if (isMobile) {
      // Force visibility change *before* print call (THE MOBILE FIX)
      // Manually hide the app and show the print content
      rootElement.style.display = "none";
      printWrapper.style.display = "block";

      // Trigger print after a delay for DOM rendering
      printTimeout = setTimeout(() => {
        window.print();
      }, 500);
    } 
    
    // ---------------------------------------------------------
    // 3. DESKTOP LOGIC: CSS ONLY (Keeps UI visible)
    // ---------------------------------------------------------
    else {
      // Trigger print. Rely on CSS @media print to hide #root.
      printTimeout = setTimeout(() => {
        window.print();
      }, 350);
    }

    // Return cleanup function to run on component unmount
    return () => {
        window.removeEventListener("afterprint", afterPrint);
        clearTimeout(printTimeout);
        // Ensure styles are restored if component unmounts unexpectedly
        rootElement.style.display = originalRootDisplay;
        printWrapper.style.display = originalWrapperDisplay;
    };
  }, [jobs, onClose]);


  const printContent = (
    // 🛑 Use ref and set initial style to 'none'
    <div className="gc-print-wrapper" ref={printRef} style={{ display: 'none' }}>
      <style>{`
        @media print {
          /* 🛑 HIDE EVERYTHING AGGRESSIVELY: This handles the desktop hide via CSS */
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
            color: #000 !important; /* Ensure black text for printing */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* This class comes from GcPrintCopy.tsx, ensures page breaks between copies */
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
