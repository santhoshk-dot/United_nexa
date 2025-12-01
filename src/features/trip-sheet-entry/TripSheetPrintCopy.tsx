// src/features/trip-sheet-entry/TripSheetPrintCopy.tsx
import React from "react";
import type { TripSheetEntry, TripSheetGCItem } from "../../types";
import { numberToWordsInRupees } from "../../utils/toWords";

interface Props {
  sheet: TripSheetEntry;
}

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

  // 1. ⬇️ REDUCED ROWS: Decreased from 15 to 10 to fit on a single page
  const visibleRowCount = 12; 
  const items: TripSheetGCItem[] = sheet.items ?? [];
  const fillerCount = Math.max(0, visibleRowCount - items.length);

  // TOTAL PACKAGES
  const totalPackages = items.reduce((acc, it) => acc + (it.qty || 0), 0);


  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#000" }}>
      <style>
        {`
        
        /* GENERAL PRINT STYLES */
        @media print {
          /* Force colors to print and remove shadows for clean output */
          body, html, * {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important; 
          }
        }

        /* ---------------------------------- */
        /* LAYOUT & COMPONENT SPECIFIC STYLES */
        /* ---------------------------------- */

        .page-heading {
          text-align: center;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 6px;
        }

        .box {
          border: 2px solid #000;
          padding: 10px;
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
        }

        /* Use Flexbox for Screen, use Floats for Print */
        .header-flex {
          display:flex; /* Default for screen view */
          justify-content:space-between;
          align-items:flex-start;
        }

        @media print {
          .header-flex {
            display: block; /* Override Flexbox for print */
            overflow: hidden; 
          }
          .company-block { 
            float: left; 
            width: 65%; 
            border-right: 1px solid #000;
          }
          .meta-block {
            float: right; 
            width: 35%;
            padding: 0 0 0 10px;
            text-align: left;
            box-sizing: border-box;
          }
        }
        
        .company-title { font-weight: 900; font-size: 20px; }
        .company-sub { font-size: 11px; margin-top: 3px; }
        .meta-block {
          font-size: 12px;
          line-height: 1.4;
          padding: 10px;
        }

        /* From / To / Date layout using inline-block for side-by-side */
        .fromto {
          display: block;
          margin-top: 8px;
          padding: 6px 2px;
          font-weight: 100;
          border-top: 1px solid #000;
          overflow: hidden; 
        }
        .fromto > div {
          display: inline-block; 
          width: 33.3%;
          box-sizing: border-box;
          float: left; 
        }
        
        .ts-table {
          width:100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 6px;
        }

        .ts-table thead th {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          border-left: 1px solid #000;
          padding: 6px;
          font-weight: 700;
        }
        .ts-table thead th:last-child {
          border-right: 1px solid #000;
        }

        .ts-table tbody td {
          padding: 6px;
          border-left: 1px solid #000;
          vertical-align: top;
          height: 22px;
        }
        .ts-table tbody td:last-child {
          border-right: 1px solid #000;
        }

        .total-row td {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 8px 6px;
          font-weight: 800;
        }
        .total-label { text-align: right; }
        .total-amt { text-align: right; white-space: nowrap; }

        .footer {
          margin-top: 6px;
          font-size: 12px;
          line-height: 1.4;
        }

        .dash {
          display:inline-block;
          border-bottom:1px dashed #000;
          padding: 0 6px;
          min-width: 120px;
        }

        /* 2. ⬇️ ROW LAYOUT: Trip footer is now three distinct rows */
        .trip-footer-grid {
          margin-top: 8px;
          font-size: 12px;
          display: block; 
        }
        .trip-footer-grid > div {
          display: block; /* Ensures each block (Driver/Owner/Lorry) is on its own line */
          width: 100%; 
          box-sizing: border-box;
          margin-bottom: 8px; 
        }
        
        /* 3. ✅ NEW FIX: Styles for the inline elements inside the footer blocks */
        .trip-footer-grid-item {
            display: inline-block; /* Makes the label/value pairs sit next to each other */
            margin-right: 15px; /* Spacing between inline items */
        }
        
        .col-line {
          border-bottom:1px dashed #000;
          padding-bottom:3px; 
          display:inline-block;
          min-width:140px;
        }

        .legal {
          margin-top: 10px;
          font-size: 11px;
          text-align: left;
          line-height: 1.35;
        }

        /* Use Floats for Signatures */
        @media print {
          .sigs {
            display: block; 
            overflow: hidden; 
            margin-top: 14px;
          }
          .sig-box { 
            width: 45%; 
            text-align: center;
            float: left; 
          }
          .sigs > .sig-box:last-child {
            float: right; 
          }
        }

        .sig-line {
          display:block;
          width: 70%;
          height: 2px;
          margin: 0 auto 6px;
          border-top: 1px solid #000;
        }
      `}</style>

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
              <tr key={idx}>
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

            {/* Filler rows */}
            {Array.from({ length: fillerCount }).map((_, i) => (
              <tr key={`f-${i}`}>
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
              </tr>
            ))}

            {/* TOTAL ROW (OPTION A) */}
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
            <div className="trip-footer-row">
              <span className="trip-footer-grid-item">
                <strong>Driver Name</strong> <span className="col-line font-semibold">{(sheet.driverName ?? "").toUpperCase()}</span>
              </span>
              <span className="trip-footer-grid-item">
                <strong>D.L.No.</strong> <span className="col-line font-semibold">{(sheet.dlNo ?? "").toUpperCase()}</span>
              </span>
              <span className="trip-footer-grid-item">
                <strong>Driver number</strong> <span className="col-line font-semibold">{(sheet.driverMobile ?? "").toUpperCase()}</span>
              </span>
            </div>

            {/* Block 2: Owner Details - ALL IN ONE LINE */}
            <div className="trip-footer-row">
              <span className="trip-footer-grid-item">
                <strong>Owner Name</strong> <span className="col-line font-semibold">{(sheet.ownerName ?? "").toUpperCase()}</span>
              </span>
              <span className="trip-footer-grid-item">
                <strong>Owner number</strong> <span className="col-line font-semibold">{(sheet.ownerMobile ?? "").toUpperCase()}</span>
              </span>
            </div>

            {/* Block 3: Lorry Details - ALL IN ONE LINE */}
            <div className="trip-footer-row">
              <span className="trip-footer-grid-item">
                <strong>Lorry No.</strong> <span className="col-line font-semibold">{(sheet.lorryNo ?? "").toUpperCase()}</span>
              </span>
              <span className="trip-footer-grid-item">
                <strong>Lorry Name</strong> <span className="col-line font-semibold">{(sheet.lorryName ?? "").toUpperCase()}</span>
              </span>
            </div>
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
            <div className="sig-box">
              <span className="sig-line" />
              Signature of the Owner/Driver/Broker
            </div>
            <div className="sig-box">
              <span className="sig-line" />
              Signature of the Booking Clerk
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TripSheetPrintCopy;
