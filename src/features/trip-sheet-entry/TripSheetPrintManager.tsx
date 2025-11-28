import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

// 🛑 YOU MUST INSTALL THESE LIBRARIES:
// import html2canvas from 'html2canvas'; 
// import jsPDF from 'jspdf';
// (Assuming these are installed and globally accessible or mocked for this environment)


interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

export const TripSheetPrintManager = ({
  mfNos,
  onClose,
}: TripSheetPrintManagerProps) => {
  const { getTripSheet } = useData();
  // We still use the ref, but only to target the content for the PDF generator
  const printRef = useRef<HTMLDivElement>(null); 

  const printPages = useMemo(() => {
    const sheets: TripSheetEntry[] = mfNos
      .map((id) => getTripSheet(id))
      .filter(Boolean) as TripSheetEntry[];

    // Ensure the content is wrapped in a way that html2canvas can capture it
    return sheets.map((sheet) => (
      <div className="pdf-page-content" key={sheet.mfNo}> 
        <TripSheetPrintCopy sheet={sheet} />
      </div>
    ));
  }, [mfNos, getTripSheet]);

  // -------------------------------------------------------------------
  // 🚀 PDF GENERATION LOGIC (Bypasses window.print())
  // -------------------------------------------------------------------
  useEffect(() => {
    if (mfNos.length === 0 || !printRef.current) {
      onClose();
      return;
    }

    const generatePdf = async () => {
      const input = printRef.current;
      if (!input) return;

      // 1. Get all individual page elements
      const pageElements = input.querySelectorAll('.pdf-page-content');

      // Check if html2canvas and jsPDF are available (assuming they are imported)
      // 🛑 REPLACE THIS WITH YOUR ACTUAL LIBRARY CALLS
      // if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') {
      //   console.error("html2canvas or jsPDF not available. Please install and import them.");
      //   return;
      // }
      
      // We will generate the PDF based on the actual component size (A4 is 210x297mm)
      const pdf = new (window as any).jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 5; // 5mm margin on all sides

      let hasContent = false;
      let pageIndex = 0;

      for (const pageElement of Array.from(pageElements)) {
        // Use html2canvas to convert the HTML element to a canvas (image)
        const canvas = await (window as any).html2canvas(pageElement as HTMLElement, {
          scale: 2, // Increase scale for better resolution
          useCORS: true, // Handle images from external sources
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Add the image to the PDF, fitting it within the A4 width
        pdf.addImage(imgData, 'JPEG', margin, margin, pdfWidth - 2 * margin, (imgHeight * (pdfWidth - 2 * margin)) / pdfWidth);
        
        hasContent = true;
        pageIndex++;
      }

      if (hasContent) {
        // 2. Trigger download/share, which is reliable on mobile
        pdf.save(`TripSheet_${mfNos.join('_')}.pdf`);
      }
      
      onClose(); // Close the manager after download is initiated
    };
    
    // Use a small delay to ensure React has finished rendering the content to the DOM
    const initTimeout = setTimeout(generatePdf, 50);

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimeout);
    };

  }, [mfNos, onClose, printPages]);

  const printContent = (
    // We create the portal content, but it remains hidden on the screen
    // The CSS here is now only for ensuring the content looks right for html2canvas
    <div className="ts-print-generator-wrapper" ref={printRef}> 
      <style>{`
        @media screen {
            /* Keep the generator content completely off-screen but visible to html2canvas */
            .ts-print-generator-wrapper {
                position: absolute; 
                top: -99999px;
                left: -99999px;
                display: block; 
                z-index: -10;
                /* Crucial for capture: ensure white background */
                background-color: white !important;
                color: black !important;
            }
            .pdf-page-content {
                /* Define a fixed size so html2canvas knows the page dimensions */
                width: 210mm; 
                min-height: 297mm;
                padding: 12mm; /* Match your desired print margin */
                box-sizing: border-box;
                background-color: white !important;
                margin-bottom: 5mm;
                transform: scale(1); /* Ensure no scaling issues before capture */
            }
        }
      `}</style>
      {printPages}
    </div>
  );

  // We use the portal to temporarily mount the content off-screen for html2canvas to access it
  return ReactDOM.createPortal(printContent, document.body);
};
