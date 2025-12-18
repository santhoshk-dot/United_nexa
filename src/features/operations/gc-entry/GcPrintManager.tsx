import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GcEntry, Consignor, Consignee } from "../../../types";
import { GcPrintCopy } from "./GcPrintCopy";
import { X, Printer } from 'lucide-react';

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
  const printTriggered = useRef(false);

  const printPages = useMemo(() => {
    return jobs.flatMap(({ gc, consignor, consignee }) => {
      if (!consignor || !consignee) return [];
      return [
        <GcPrintCopy key={`${gc.id}-consignor`} gc={gc} consignor={consignor} consignee={consignee} copyType="CONSIGNOR COPY" />,
        <GcPrintCopy key={`${gc.id}-consignee`} gc={gc} consignor={consignor} consignee={consignee} copyType="CONSIGNEE COPY" />,
        <GcPrintCopy key={`${gc.id}-lorry`} gc={gc} consignor={consignor} consignee={consignee} copyType="LORRY COPY" />,
      ];
    });
  }, [jobs]);

  // --- AUTO PRINT TRIGGER ---
  useEffect(() => {
    if (printTriggered.current) return;
    const timer = setTimeout(() => {
      printTriggered.current = true;
      window.print();
    }, 1000); 
    return () => clearTimeout(timer);
  }, []);

  const handleManualPrint = () => {
    window.print();
  };

  const printContent = (
    <div className="gc-print-wrapper">
      <style>{`
        @media print {
          @page {
            size: A5;
            margin: 0; 
          }

          body > *:not(.gc-print-wrapper) {
            display: none !important;
          }
          #root { display: none !important; }

          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }

          .gc-print-wrapper {
            display: block !important;
            position: absolute;
            top: 0; left: 0; width: 100%;
            margin: 0; padding: 0;
            background: white;
            z-index: 9999;
          }

          .gc-print-wrapper * {
            color: black !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          .print-actions { display: none !important; }

          .print-page {
            break-after: page;
            page-break-after: always;
            width: 148mm;
            height: auto !important; /* Changed from 210mm to auto to remove bottom white space */
            overflow: hidden;
            position: relative;
            margin: 0;
            padding: 0;
          }
        }

        @media screen {
          .gc-print-wrapper {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw;
            height: 100dvh; 
            background-color: hsl(var(--muted)); 
            z-index: 2147483647; 
            overflow-y: auto;
            overflow-x: hidden;
            padding-top: 80px; 
            padding-bottom: 40px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            -webkit-overflow-scrolling: touch;
          }

          .print-page {
            background: white;
            color: black;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
            transform-origin: top center;
            transition: transform 0.2s ease;
            width: 148mm;
            min-height: 100px; /* Let preview height be dynamic */
          }
        }

        @media screen and (max-width: 800px) {
          .gc-print-wrapper {
            padding-top: 70px;
            padding-left: 0;
            padding-right: 0;
            background-color: #1f2937;
          }

          .print-page {
            transform: scale(0.6); 
            margin-bottom: -40mm; 
            margin-top: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          }
        }

        .print-actions {
          position: fixed;
          top: 0; left: 0;
          width: 100%;
          height: 64px;
          background-color: hsl(var(--card));
          color: hsl(var(--foreground));
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          z-index: 2147483648;
        }

        .preview-title {
          font-weight: 700;
          font-size: 16px;
        }

        .action-group {
          display: flex;
          gap: 10px;
        }

        .btn-base {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .print-btn {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }

        .close-btn {
          background-color: hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
        }
      `}</style>

      <div className="print-actions">
        <span className="preview-title">
          Preview ({jobs.length} Slips)
        </span>
        <div className="action-group">
          <button onClick={handleManualPrint} className="btn-base print-btn">
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button onClick={onClose} className="btn-base close-btn">
            <X size={18} />
            <span>Close</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {printPages}
      </div>
    </div>
  );

  return createPortal(printContent, document.body);
};