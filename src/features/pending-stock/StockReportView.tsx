import { useEffect, useMemo } from 'react'; // <-- Removed useRef
import ReactDOM from 'react-dom';
import type { GcEntry, Consignor, Consignee } from '../../types';

// --- Report Header (from PDF) ---
const ReportHeader = () => (
  <div className="w-full text-center mb-4">
    <div className="flex justify-between items-center text-xs">
      <span className="font-semibold">GSTIN: 33ABLPV5082H3Z8</span>
      <span className="font-semibold text-lg">STOCK REPORT</span>
      <span className="font-semibold">Mobile: 9787718433</span>
    </div>
    <h1 className="text-2xl font-bold text-black">UNITED TRANSPORT COMPANY</h1>
    <p className="text-sm">164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123</p>
    <h2 className="text-xl font-bold text-black mt-2">Overall Stock Report</h2>
  </div>
);

// --- Report Table (for one page) ---
interface ReportPageProps {
  jobs: {
    gc: GcEntry;
    consignor?: Consignor;
    consignee?: Consignee;
  }[];
  pageNumber: number;
  totalPages: number;
}

const ReportPage = ({ jobs, pageNumber, totalPages }: ReportPageProps) => {
  return (
    // This 'report-page' class is key for page breaks
    <div className="report-page w-[210mm] min-h-[297mm] p-6 bg-white">
      <ReportHeader />
      <table className="w-full table-auto border-collapse border border-black text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="border border-black p-2">GC.No.</th>
            <th className="border border-black p-2">Stock Qty</th>
            <th className="border border-black p-2">Contents</th>
            <th className="border border-black p-2">Consignor</th>
            <th className="border border-black p-2">Consignee</th>
            <th className="border border-black p-2">GC Date</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(({ gc, consignor, consignee }) => (
            <tr key={gc.id}>
              <td className="border border-black p-2">{gc.id}</td>
              <td className="border border-black p-2">{gc.quantity}</td>
              <td className="border border-black p-2">{`${gc.packing} - ${gc.contents}`}</td>
              <td className="border border-black p-2">{consignor?.name || 'N/A'}</td>
              <td className="border border-black p-2">{consignee?.name || 'N/A'}</td>
              <td className="border border-black p-2">{gc.gcDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-center text-xs mt-2">
        Page {pageNumber} of {totalPages}
      </div>
    </div>
  );
};

// --- Main Print Component ---
interface StockReportPrintProps {
  jobs: {
    gc: GcEntry;
    consignor?: Consignor;
    consignee?: Consignee;
  }[];
  onClose: () => void;
}

export const StockReportPrint = ({ jobs, onClose }: StockReportPrintProps) => {
  
  // --- Chunk data for pagination ---
  const ENTRIES_PER_PAGE = 35; // Adjust as needed
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < jobs.length; i += ENTRIES_PER_PAGE) {
      chunks.push(jobs.slice(i, i + ENTRIES_PER_PAGE));
    }
    return chunks;
  }, [jobs]);

  // --- UPDATED PRINT LOGIC ---
  useEffect(() => {
    // Removed the 'hasPrinted' ref and check.
    
    const handleAfterPrint = () => {
      onClose(); // Call the onClose prop to unmount this component
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);

    setTimeout(() => {
      window.print();
    }, 100); 

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]); // This will run on mount, and re-run if onClose changes.

  const printContent = (
    <div className="print-report-wrapper">
      <style>{`
        @media print {
          /* Hide the main app root */
          #root {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Show our print wrapper */
          .print-report-wrapper {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0;
            left: 0;
            width: 100%;
          }
          
          /* Handle page breaks */
          .report-page {
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
          .print-report-wrapper {
            display: none;
          }
        }
      `}</style>

      {/* Render all pages for the printer */}
      {pages.map((pageJobs, index) => (
        <ReportPage
          key={index}
          jobs={pageJobs}
          pageNumber={index + 1}
          totalPages={pages.length}
        />
      ))}
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};