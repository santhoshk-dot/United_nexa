import React, { useMemo } from "react";
import type { TripSheetEntry, TripSheetGCItem } from "../../types";
import { numberToWordsInRupees } from "../../utils/toWords";

interface Props {
  sheet: TripSheetEntry;
}

// Helper to format date in DD/MM/YYYY
const fmtDate = (d?: string) => {
  if (!d) return "";
  const dateStr = d.includes('/') ? d : d.split('T')[0];
  const dt = new Date(dateStr);
  
  if (isNaN(dt.getTime())) return d;
  
  return `${String(dt.getDate()).padStart(2, "0")}/${String(
    dt.getMonth() + 1
  ).padStart(2, "0")}/${dt.getFullYear()}`;
};

// Helper to format currency for display
const formatCurrency = (amount: number | string | undefined) => {
  const num = parseFloat(amount?.toString() || "0");
  return num > 0 ? `${num.toLocaleString("en-IN")}` : "";
};


export const TripSheetPrintCopy: React.FC<Props> = ({ sheet }) => {
  
  // --- CALCULATIONS ---
  const { totalAmount, totalPackages } = useMemo(() => {
    const items: TripSheetGCItem[] = sheet.items ?? [];
    
    const calculatedTotalAmount = sheet.totalAmount ?? 0;
    const calculatedTotalPackages = items.reduce((acc, it) => acc + (it.qty || 0), 0);
    
    return {
        totalAmount: calculatedTotalAmount,
        totalPackages: calculatedTotalPackages
    }
  }, [sheet.items, sheet.totalAmount]);

  const totalWords = numberToWordsInRupees(totalAmount);
  const items: TripSheetGCItem[] = sheet.items ?? [];
  
  const visibleRowCount = 15; 
  const fillerCount = Math.max(0, visibleRowCount - items.length);


  return (
    <div 
      className="trip-sheet-print-container"
      style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#000", padding: "10mm" }}
    >
      <style>
        {`
        
        /* ---------------------------------- */
        /* BASE PRINT STYLES & OVERRIDES */
        /* ---------------------------------- */
        @page {
          size: A4;
          margin: 0; 
        }
        @media print {
          .trip-sheet-print-container, 
          .trip-sheet-print-container * {
            background-color: #fff !important;
            color: #000 !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important; 
          }
          .box { margin: 0 !important; padding: 0 !important; border-width: 1px !important; }
        }

        /* ---------------------------------- */
        /* LAYOUT STYLES */
        /* ---------------------------------- */

        .page-heading {
          text-align: center;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 6px;
        }

        .box {
          border: 1px solid #000; 
          padding: 0; 
          box-sizing: border-box;
          width: 100%;
        }

        /* HEADER: Using Floats to mimic the sharp vertical separation */
        .header-flex {
          display: block; 
          overflow: hidden; 
          border-bottom: 1px solid #000;
        }
        .company-block { 
          width: 68%; 
          float: left; 
          padding: 10px; 
          border-right: 1px solid #000;
          box-sizing: border-box;
        }
        .meta-block {
          width: 32%; 
          float: right;
          text-align: left;
          font-size: 12px;
          line-height: 1.4;
          padding: 10px 10px 10px 20px; 
          box-sizing: border-box;
        }
        
        .company-title { font-weight: 900; font-size: 20px; }
        .company-sub { font-size: 11px; margin-top: 3px; }

        /* FROM/TO/DATE LAYOUT: Using Flex with border top/bottom */
        .fromto {
          display:flex;
          justify-content:space-between;
          font-weight: 700;
          padding: 6px 10px;
          border-bottom: 1px solid #000;
          font-size: 12px;
        }
        .fromto > div { 
            width: 33.3%; 
            box-sizing: border-box;
        }

        /* TABLE STYLES */
        .ts-table {
          width:100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-top: -1px; 
        }
        .ts-table th, .ts-table td {
            border-left: 1px solid #000;
            padding: 4px 6px;
        }
        .ts-table thead th {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          font-weight: 700;
          line-height: 1.2;
        }
        .ts-table thead th:last-child { border-right: 1px solid #000; }
        .ts-table tbody td {
          vertical-align: top;
          height: 22px;
        }
        .ts-table tbody td:last-child { border-right: 1px solid #000; }

        .total-row td {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 8px 10px;
          font-weight: 800;
          font-size: 12px;
        }
        .total-label { text-align: left; }
        .total-amt { text-align: right; white-space: nowrap; }


        /* FOOTER SECTIONS */
        .footer-section { 
            border-top: 1px solid #000; 
            padding: 8px 10px; 
            font-size: 12px; 
        }

        .dash {
          display:inline-block;
          border-bottom:1px dashed #000;
          padding: 0 4px;
          min-width: 120px;
          font-weight: 700; 
        }

        .footer-text-line {
          line-height: 1.5;
        }

        /* DRIVER / OWNER / LORRY LAYOUT */
        .details-row {
            overflow: hidden;
            margin-bottom: 6px; 
        }
        .details-item {
            float: left; 
            display: block; 
            width: 33%; 
            box-sizing: border-box;
            padding-right: 10px; 
        }
        .details-row > .details-item:nth-child(3n) {
            float: right;
            width: 34%; 
            padding-right: 0;
        }

        .details-line {
            display: block; 
            margin-bottom: 4px;
            font-size: 11px; 
        }

        .col-line {
          border-bottom:1px dashed #000;
          padding-bottom:3px; 
          display:inline-block;
          min-width:100px; 
          font-weight: 600; 
        }

        /* SIGNATURES */
        .legal {
          font-size: 11px;
          text-align: justify;
          line-height: 1.35;
          margin-bottom: 10px;
        }
        .sigs {
          display:flex;
          justify-content:space-around;
          margin-top: 14px;
          font-size: 12px;
          padding: 0 10px;
        }
        .sig-box { width:45%; text-align:center; }
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
        {/* --- 1. HEADER (Company Info & Meta) --- */}
        <div className="header-flex">
          <div className="company-block">
            <div>
              <div style={{ fontSize: 11 }}>
                <strong>GSTIN:</strong> 33ABLPV5082H3Z8 &nbsp;&nbsp; <strong>Mobile:</strong> 9787718433
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

        {/* --- 2. TRIP ROUTE & DATE --- */}
        <div className="fromto">
          <div><strong>From:</strong> {(sheet.fromPlace ?? "").toUpperCase()}</div>
          <div style={{ textAlign: "center" }}><strong>To:</strong> {(sheet.toPlace ?? "").toUpperCase()}</div>
          <div style={{ textAlign: "right" }}><strong>Date:</strong> {fmtDate(sheet.tsDate)}</div>
        </div>

        {/* --- 3. GC ITEMS TABLE --- */}
        <table className="ts-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>C.N.No.</th>
              <th style={{ width: "15%" }}>No. of Packages</th>
              <th style={{ width: "15%" }}>Contents</th>
              <th style={{ width: "20%" }}>Consignor</th>
              <th style={{ width: "28%" }}>Consignee</th>
              <th style={{ width: "12%" }}>To Pay</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 700 }}>{it.gcNo}</td>
                <td>{it.qty} {(it.packingDts ?? "").toUpperCase()}</td>
                <td>{(it.contentDts ?? "").toUpperCase()}</td>
                <td>{(it.consignor ?? "").toUpperCase()}</td>
                <td>{(it.consignee ?? "").toUpperCase()}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  ₹{formatCurrency(it.amount)}
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

            {/* TOTAL ROW */}
            <tr className="total-row">
              <td colSpan={5} className="total-label">
                TOTAL PACKAGES: <strong>{totalPackages}</strong>
              </td>
              <td className="total-amt">
                <strong>₹{formatCurrency(totalAmount)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* --- 4. FOOTER TEXT --- */}
        <div className="footer-section footer-text-line">
          Goods have been loaded in good condition. All Checkpost papers have been handed over to the truck driver.
          Goods to be unloaded at <span className="dash">{(sheet.unloadPlace ?? sheet.toPlace ?? "").toUpperCase()}</span>
          &nbsp;&nbsp; Please pay lorry hire Rs. <span className="dash">₹{formatCurrency(totalAmount)}</span>,
          &nbsp;&nbsp; **<span className="dash">{totalWords}</span>** on receiving the goods in sound condition.
        </div>

        {/* --- 5. DRIVER / OWNER / LORRY DETAILS --- */}
        <div className="footer-section">
            {/* Row 1: Driver Details */}
            <div className="details-row">
                <div className="details-item details-line">
                    <strong>Driver Name</strong> <span className="col-line">{(sheet.driverName ?? "").toUpperCase()}</span>
                </div>
                <div className="details-item details-line">
                    <strong>D.L.No.</strong> <span className="col-line">{(sheet.dlNo ?? "").toUpperCase()}</span>
                </div>
                <div className="details-item details-line">
                    <strong>Driver number</strong> <span className="col-line">{(sheet.driverMobile ?? "").toUpperCase()}</span>
                </div>
            </div>

            {/* Row 2: Owner/Lorry Details */}
            <div className="details-row">
                <div className="details-item details-line">
                    <strong>Owner Name</strong> <span className="col-line">{(sheet.ownerName ?? "").toUpperCase()}</span>
                </div>
                <div className="details-item details-line">
                    <strong>Owner number</strong> <span className="col-line">{(sheet.ownerMobile ?? "").toUpperCase()}</span>
                </div>
            </div>
            <div className="details-row">
                <div className="details-item details-line">
                    <strong>Lorry No.</strong> <span className="col-line">{(sheet.lorryNo ?? "").toUpperCase()}</span>
                </div>
                <div className="details-item details-line">
                    <strong>Lorry Name</strong> <span className="col-line">{(sheet.lorryName ?? "").toUpperCase()}</span>
                </div>
            </div>
        </div>

        {/* --- 6. LEGAL CLAUSES + SIGNATURES --- */}
        <div className="footer-section" style={{ borderBottom: "none" }}>
          <div className="legal">
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
