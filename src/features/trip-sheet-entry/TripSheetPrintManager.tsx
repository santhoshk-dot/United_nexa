import { useEffect, useMemo } from "react";
import type { TripSheetEntry } from "../../types";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import ReactDOMServer from "react-dom/server";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

// Helper to detect mobile devices (screens smaller than 768px)
const isMobileScreen = () => window.innerWidth < 768;

// --- CSS STYLES FOR INJECTION ---
// We embed all styles needed for printing here, including print media queries.
const printStyles = `
  /* Global page and background settings */
  @page {
    size: A4;
    margin: 12mm; 
  }
  html, body {
    margin: 0;
    padding: 0;
    background-color: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color: black;
  }
  
  /* Force page breaks between copies */
  .print-page {
    page-break-after: always !important;
    page-break-inside: avoid !important;
    box-sizing: border-box; /* Crucial for layout */
    width: 100%;
    min-height: 297mm; /* Ensure A4 size */
  }

  /* Hide everything aggressively if it's not the print content, though this is less critical in a new window */
  @media print {
    .ts-print-wrapper {
      display: block !important;
      visibility: visible !important;
      position: static !important;
      width: 100% !important;
      background: white !important;
      color: black !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;
// ---------------------------------


export const TripSheetPrintManager = ({
  mfNos,
  onClose,
}: TripSheetPrintManagerProps) => {
  const { getTripSheet } = useData();

  // 1. Memoize the React components (still necessary for structure)
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

  // 2. Render React components to static HTML string
  const printPagesHtml = useMemo(() => {
    // We wrap the content in a simple div to mimic the original wrapper
    return ReactDOMServer.renderToString(
        <div className="ts-print-wrapper">
            {printPages}
        </div>
    );
  }, [printPages]);

  // 3. EFFECT: Handle Print Logic (New Window for Mobile)
  useEffect(() => {
    if (mfNos.length === 0) {
        onClose();
        return;
    }

    const isMobile = isMobileScreen();

    // Use New Window approach for mobile and desktop for consistency and reliability
    const popup = window.open("", "_blank");

    if (!popup) {
        console.error("Popup window blocked or failed to open.");
        onClose();
        return;
    }

    const { document: printDocument } = popup;

    // Build the full HTML content for the new window
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Trip Sheet Print</title>
            <style>${printStyles}</style>
        </head>
        <body>
            ${printPagesHtml}
        </body>
        </html>
    `;

    // Write content to the new window
    printDocument.write(htmlContent);
    printDocument.close();

    // Delay the print call slightly to ensure the browser has finished loading the content
    // Mobile devices need a generous delay here.
    const printDelay = isMobile ? 1500 : 500; 

    const printTimeout = setTimeout(() => {
        popup.print();
        
        // Use another delay to close the window after the print dialog is dismissed
        setTimeout(() => {
            if (!popup.closed) {
                popup.close();
            }
            onClose();
        }, 500);

    }, printDelay);

    // Cleanup on unmount
    return () => {
        clearTimeout(printTimeout);
        // Ensure the popup is closed if the component is unmounted before print/close
        if (!popup.closed) {
            popup.close();
        }
        // Do NOT call onClose() here, as it's handled by the inner setTimeout
    };
  }, [onClose, mfNos.length, printPagesHtml]);

  // Since printing is handled via a new window, the component renders nothing itself.
  return null; 
};
