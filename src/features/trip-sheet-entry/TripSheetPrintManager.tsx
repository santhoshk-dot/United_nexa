import { useEffect } from "react";
import ReactDOM from "react-dom";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";

interface TripSheetPrintManagerProps {
  sheets: TripSheetEntry[];
  onClose: () => void;
}

export const TripSheetPrintManager = ({
  sheets,
  onClose,
}: TripSheetPrintManagerProps) => {

  // --- PRINT LOGIC ---
  // Trigger print dialog immediately on mount since data is pre-fetched passed via props
  useEffect(() => {
    if (sheets.length === 0) return;

    const handleAfterPrint = () => {
      onClose();
      window.removeEventListener("afterprint", handleAfterPrint);
    };

    window.addEventListener("afterprint", handleAfterPrint);

    // Small delay ensures content renders into the portal before printing
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [sheets, onClose]);

  // Don't render anything if no sheets provided
  if (sheets.length === 0) return null;

  const printContent = (
    <div className="ts-print-wrapper">
      <style>{`
        @media print {
          /* Hide main app UI */
          #root {
            display: none !important;
            visibility: hidden !important;
          }

          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0;
            left: 0;
            width: 100%;
          }

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
          .ts-print-wrapper {
            display: none;
          }
        }
      `}</style>

      {sheets.map((sheet) => (
        <div className="print-page" key={sheet.mfNo}>
          <TripSheetPrintCopy sheet={sheet} />
        </div>
      ))}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};