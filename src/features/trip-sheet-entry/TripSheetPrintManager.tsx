// src/features/trip-sheet-entry/TripSheetPrintManager.tsx

import { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useData } from "../../hooks/useData";
import { TripSheetPrintCopy } from "./TripSheetPrintCopy";
import type { TripSheetEntry } from "../../types";
import * as html2pdf from "html2pdf.js";

interface TripSheetPrintManagerProps {
  mfNos: string[];
  onClose: () => void;
}

const isMobile = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const TripSheetPrintManager = ({
  mfNos,
  onClose,
}: TripSheetPrintManagerProps) => {
  const { getTripSheet } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  // Prepare print pages
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
    const generatePDF = async () => {
      if (!printRef.current) return;

    const options: any = {      
      margin: 10,
      filename: `TripSheet-${mfNos.join("_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    await (html2pdf as any)()
      .set(options)
      .from(printRef.current)
      .toPdf()
      .get('pdf')
      .then((pdf: any) => {
        pdf.autoPrint();   // 🔥 Force print dialog
        const pdfUrl = pdf.output('bloburl');
        window.open(pdfUrl, "_blank"); // 🔥 Opens PDF → mobile shows print dialog
      });
      setTimeout(onClose, 300);
    };

    // MOBILE → Export PDF
    if (isMobile()) {
      setTimeout(generatePDF, 300);
      return;
    }

    // DESKTOP → Normal printing
    const afterPrint = () => {
      onClose();
      window.removeEventListener("afterprint", afterPrint);
    };

    window.addEventListener("afterprint", afterPrint);

    setTimeout(() => window.print(), 150);

    return () => {
      window.removeEventListener("afterprint", afterPrint);
    };
  }, [onClose, mfNos]);

  const printContent = (
    <div
      className="ts-print-wrapper"
      ref={printRef}
      style={{
        display: "",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        background: "white",
        padding: "0",
        margin: "0 auto",
      }}
    >
      <style>{`
        @media print {
          #root {
            display: none !important;
            visibility: hidden !important;
          }

          .ts-print-wrapper {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
          }

          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4;
            margin: 12mm !important;
          }
        }
      `}</style>

      {printPages}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};
