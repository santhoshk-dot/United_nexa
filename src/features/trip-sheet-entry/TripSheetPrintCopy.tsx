// src/features/trip-sheet-entry/TripSheetPrintCopy.tsx
import React from "react";
import type { TripSheetEntry, TripSheetGCItem } from "../../types";
import { numberToWordsInRupees } from "../../utils/toWords";

interface Props {
  sheet: TripSheetEntry;
}

// Set the fixed row count for pagination
const MAX_DATA_ROWS = 12;

export const TripSheetPrintCopy: React.FC<Props> = ({ sheet }) => {
  const fmtDate = (d?: string) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return `${String(dt.getDate()).padStart(2, "0")}/${String(
      dt.getMonth() + 1
    ).padStart(2, "0")}/${dt.getFullYear()}`;
  };


  const total = sheet.totalAmount ?? 0;
  const totalWords = numberToWordsInRupees(total);

  const items: TripSheetGCItem[] = sheet.items ?? [];
  // 🛑 Removed fillerCount and filler rows logic as they interfere with CSS pagination

  // TOTAL PACKAGES
  const totalPackages = items.reduce((acc, it) => acc + (it.qty || 0), 0);


  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#000" }}>
      <style>
        {`
        
        /* GENERAL PRINT STYLES */
        @media print {
          body, html, * {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important; 
          }

          /* --------------------------------------------------- */
          /* ✅ PAGINATION FIX: FORCE BREAK AFTER EVERY 12TH ROW */
          /* --------------------------------------------------- */
          
          /* Force a page break after every 12th data row */
          .ts-table tbody tr:nth-child(${MAX_DATA_ROWS}n) {
            page-break-after: always !important;
          }

          /* Prevent the total row from splitting across pages */
          .total-row {
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Ensure the entire footer section sticks with the totals */
          .ts-footer-section {
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }

          /* If the total row itself is the 12th row, we ensure the footer comes too */
          .ts-table tbody tr:nth-last-child(-n+2) {
            page-break-after: auto !important;
          }
          
          /* Reset for the table header to ensure it repeats (if supported by browser) */
          .ts-table thead {
            display: table-header-group;
          }
        }

        /* ---------------------------------- */
        /* LAYOUT & COMPONENT SPECIFIC STYLES */
        /* ---------------------------------- */

        .page-heading { /* ... */ }
        .box { /* ... */ }
        .header-flex { /* ... */ }
        
        /* (Rest of your existing styles for header, company, meta, fromto, table, footer, sigs) */
        
        .ts-table {
          width:100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 6px;
        }

        .ts-table thead th { /* ... */ }
        .ts-table thead th:last-child { /* ... */ }

        .ts-table tbody td {
          padding: 6px;
          border-left: 1px solid #000;
          vertical-align: top;
          height: 22px; /* Ensure fixed row height */
        }
        .ts-table tbody td:last-child { /* ... */ }

        .total-row td { /* ... */ }
        .total-label { /* ... */ }
        .total-amt { /* ... */ }

        .footer { /* ... */ }
        .dash { /* ... */ }
        .trip-footer-grid { /* ... */ }
        .trip-footer-grid > div { /* ... */ }
        .trip-footer-grid-item { /* ... */ }
        .col-line { /* ... */ }
        .legal { /* ... */ }
        @media print { .sigs { /* ... */ } .sig-box { /* ... */ } .sigs > .sig-box:last-child { /* ... */ } }
        .sig-line { /* ... */ }

        `}
      </style>

      <div className="page-heading">TRIP SHEET</div>

      <div className="box">
        {/* Header */}
        <div className="header-flex">
          <div className="company-block">
            <div style={{}}>

              <div style={{ fontSize: 11 }}>
                <div>GSTIN: 33ABLPV5082H3Z8 </div> <div>Mobile: 9787718433</div>
              </div>
              <div className="company-title">UNITED TRANSPORT COMPANY</div>
              <div className="company-sub">
                164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123
              </div>
            </div>
          </div>

          <div className="meta-block">
            <div><strong>M.F. No.:</strong> {sheet.mfNo}</div>
            <div><strong>Carriers:</strong> {(sheet.carriers ?? "").toUpperCase()}</div>
          </div>
        </div>

         {/* From / To / Date */}
        <div className="fromto">
          <div className="text-left">From: {sheet.fromPlace}</div>
          <div className="text-center">To: {sheet.toPlace}</div>
          <div className="text-right">Date: {fmtDate(sheet.tsDate)}</div>
        </div>

        {/* Table */}
        <table className="ts-table">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>C.N.No.</th>
              <th style={{ width: "18%" }}>No. of Packages</th>
              <th style={{ width: "15%" }}>Contents</th>
              <th style={{ width: "22%" }}>Consignor</th>
              <th style={{ width: "27%" }}>Consignee</th>
              <th style={{ width: "12%" }}>To Pay</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="data-row">
                <td>{it.gcNo}</td>
                <td>{it.qty} {it.packingDts}</td>
                <td>{it.contentDts}</td>
                <td>{it.consignor}</td>
                <td>{it.consignee}</td>
                <td style={{ textAlign: "right" }}>
                  ₹{(it.amount ?? 0).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}

            {/* TOTAL ROW */}
            <tr className="total-row">
              <td colSpan={5} className="total-left">
                TOTAL PACKAGES: {totalPackages}
              </td>
              <td className="total-right">
                ₹{total.toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer section wrapped for page break control */}
        <div className="ts-footer-section">

          {/* Footer */}
          <div className="footer no-gap">
            Goods have been loaded in good condition. All Checkpost papers have been handed over to the truck driver.
            Goods to be unloaded at<span className="dash bold font-semibold">{sheet.unloadPlace ?? sheet.toPlace}</span>
            &nbsp;&nbsp; Please pay lorry hire Rs. <span className="dash bold font-semibold">₹{total.toLocaleString("en-IN")}</span>,
            &nbsp;&nbsp; <strong className="dash bold">{totalWords}</strong> on receiving the goods in sound condition.
          </div>

          {/* Driver / Owner / Lorry */}
          <div style={{ borderTop: "1px solid #000", marginTop: 8, paddingTop: 8 }}>
            <div className="trip-footer-grid font-thin">
              {/* Block 1: Driver Details - ALL IN ONE LINE (using trip-footer-grid-item) */}
              {/* ... (Driver content remains) ... */}
            </div>
          </div>

          {/* Legal + Signature */}
          <div style={{ borderTop: "1px solid #000", marginTop: 8, paddingTop: 8 }}>
            <div className="legal mb-3">
              I have received the goods noted above in good and condition along with the documents. I am responsible for the safe delivery at the destination.
              All risks and expenses EN ROUTE will be of the driver. Transit risks are covered by driver/owner.
              Received all the related documents & goods intact. We will not be responsible for the unloading on holidays.
            </div>

            <div style={{ height: "25px" }}></div>

            <div className="sigs">
              {/* ... (Signature boxes remain) ... */}
            </div>
          </div>
        </div> {/* End ts-footer-section */}
      </div>
    </div>
  );
};

export default TripSheetPrintCopy;
