// src/features/trip-sheet-entry/TripSheetPrintManager.tsx

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
    const afterPrint = () => {
      onClose();
      window.removeEventListener("afterprint", afterPrint);
    };

    window.addEventListener("afterprint", afterPrint);

    // delay ensures print DOM is mounted
    setTimeout(() => {
      window.print();
    }, 350);

    return () => window.removeEventListener("afterprint", afterPrint);
  }, [onClose]);

  const printContent = (
    <div className="ts-print-wrapper" ref={printRef}>
      <style>{`
        
        @media print {

          /* Hide entire application */

          body > *:not(.ts-print-wrapper) {
            display: none !important;
            visibility: hidden !important;
          }

          /* FORCE SHOW print wrapper */
          
          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: fixed !important;
            inset: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 999999 !important;
          }

          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }

      `}</style>

      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
