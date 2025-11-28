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
    if (mfNos.length === 0) return;

    const rootElement = document.getElementById("root");
    const printWrapper = printRef.current;

    if (!rootElement || !printWrapper) {
      console.error("Print elements not found");
      return;
    }

    const isMobile = isMobileScreen();
    let printTimeout: number | undefined;
    
    // Variables for DOM Detachment
    let rootDetached = false; 
    let rootParent: HTMLElement | null = null; 

    // Define the cleanup function
    const cleanupHandler = () => {
        // Use a slight delay to ensure cleanup runs *after* the print dialog closes
        setTimeout(() => {
            window.removeEventListener("afterprint", cleanupHandler);
            
            // CRITICAL: Re-attach the root element if it was detached (MOBILE FIX)
            if (rootDetached && rootParent) {
                try {
                    // Re-attach the root element to its parent
                    rootParent.appendChild(rootElement);
                } catch (e) {
                    // This error is safe to ignore if the element is already re-attached
                    console.warn("Root element might have been already re-attached.", e);
                }
                // Ensure the print wrapper is hidden after re-attachment
                printWrapper.style.removeProperty('display');
            }
            
            // Call onClose whether mobile or desktop
            onClose(); 
        }, 500); // 500ms delay for print dialog close confirmation
    };

    window.addEventListener("afterprint", cleanupHandler);


    if (isMobile) {
      // ---------------------------------------------------------
      // 📱 MOBILE LOGIC: DOM DETACHMENT (The Extreme Fix)
      // ---------------------------------------------------------
      
      rootParent = rootElement.parentElement;
      if (rootParent) {
        // 1. Detach the root element from the DOM
        rootParent.removeChild(rootElement);
        rootDetached = true;
        
        // 2. Force show the print wrapper (as #root is gone, only this remains in the body)
        // We set display: block here so the browser can measure it for the print job
        printWrapper.style.setProperty('display', 'block', 'important');
      }

      // 3. Trigger Print (max delay for mobile rendering)
      printTimeout = setTimeout(() => {
        window.print();
      }, 1000); // Increased delay for safety
    } 
    
    // ---------------------------------------------------------
    // 🖥️ DESKTOP LOGIC: CSS ONLY
    // ---------------------------------------------------------
    else {
      // Trigger Print (standard delay) 
      printTimeout = setTimeout(() => {
        window.print();
      }, 350);
    }

    // Cleanup on unmount (safety net)
    return () => {
        window.removeEventListener("afterprint", cleanupHandler);
        if (printTimeout) clearTimeout(printTimeout);
        
        // If component unmounts prematurely while root is detached, re-attach it immediately.
        if (rootDetached && rootParent) {
             try {
                 rootParent.appendChild(rootElement);
             } catch (e) {
                 // Ignore if already attached
             }
        }
    };

  }, [onClose, mfNos.length]); 

  const printContent = (
    // The print wrapper does not need an inline style, as it's hidden by CSS @media screen
    <div className="ts-print-wrapper" ref={printRef}> 
      <style>{`
        @media print {
          /* --------------------------------------------------- */
          /* AGGRESSIVE HIDING: Hides all *other* content */
          /* --------------------------------------------------- */

          /* HIDE EVERYTHING (except our print wrapper) */
          body > *:not(.ts-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            position: fixed !important; 
            top: -9999px !important;
            background-color: white !important;
          }

          /* FORCE SHOW & OVERLAY our wrapper (The print content) */
          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            
            /* Use fixed/absolute positioning to dominate the viewport */
            position: absolute !important; 
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 999999 !important;
            
            color: black !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* The print pages themselves ensure flow and breaks */
          .print-page {
            position: static !important; 
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          /* --------------------------------------------------- */
          /* PAGE & BACKGROUND STYLES                           */
          /* --------------------------------------------------- */

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
