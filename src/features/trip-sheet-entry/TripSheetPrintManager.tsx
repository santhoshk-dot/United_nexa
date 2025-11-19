// src/features/trip-sheet-entry/TripSheetPrintManager.tsx

import { useEffect, useMemo } from "react";
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

  // Prepare print pages similar to GCPrintManager
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

  // Auto-print + auto-close
  useEffect(() => {
    const handleAfterPrint = () => {
      onClose();
      window.removeEventListener("afterprint", handleAfterPrint);
    };

    window.addEventListener("afterprint", handleAfterPrint);

    // Small delay ensures content mounts first
    setTimeout(() => {
      window.print();
    }, 100);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [onClose]);

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

      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
