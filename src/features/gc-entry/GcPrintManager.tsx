import { useEffect, useMemo } from 'react'; // <-- Removed useRef
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

  const printPages = useMemo(() => {
    return jobs.flatMap(({ gc, consignor, consignee }) => {
      if (!consignor || !consignee) {
        return [];
      }
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


  // --- UPDATED PRINT LOGIC ---
  useEffect(() => {
    // Removed the 'hasPrinted' ref and check.
    
    const handleAfterPrint = () => {
      onClose(); // Unmount this component
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);

    setTimeout(() => {
      window.print(); // Trigger print dialog
    }, 100);

    return () => {
      // This cleanup runs when the component unmounts
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    // We add onClose to the dependency array.
    // This is correct because onClose is a prop.
  }, [onClose]);

  const printContent = (
    <div className="gc-print-wrapper">
      <style>{`
        @media print {
          /* Hide the main app root */
          #root {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Show our print wrapper */
          .gc-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0;
            left: 0;
            width: 100%;
          }
          
          /* This class comes from GcPrintCopy.tsx */
          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          
          @page {
            size: A4;
            margin: 0;
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