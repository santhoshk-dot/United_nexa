import React from "react";
import type { TripSheetEntry, TripSheetGCItem } from "../../../types";
import { numberToWordsInRupees } from "../../../utils/toWords";
import { useDataContext } from "../../../contexts/DataContext";
import { useAuth } from '../../../hooks/useAuth';

interface Props {
  sheet: TripSheetEntry;
}

export const TripSheetPrintCopy: React.FC<Props> = ({ sheet }) => {
  const { printSettings } = useDataContext(); 
  const label = printSettings.tripSheet; 
  const { user } = useAuth();

  const userName = user?.name


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

  // Adjusted to fill the page properly with larger fonts
  const visibleRowCount = 15;
  const items: TripSheetGCItem[] = sheet.items ?? [];
  const fillerCount = Math.max(0, visibleRowCount - items.length);

  // TOTAL PACKAGES
  const totalPackages = items.reduce((acc, it) => acc + (it.qty || 0), 0);

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#000", padding: "6mm 10mm" }}>
      <style>
        {`
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body, html {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
          }

          * {
            background: #ffffff !important;
          }
        }

        .page-heading {
          text-align: center;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 5px;
        }

        .box {
          border: 2px solid #000;
          padding: 8px 10px;
          box-sizing: border-box;
          width: 100%;
        }

        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .company-block { 
          width: 64%; 
          border-right: 1px solid #000; 
          font-weight: 600;
          padding-right: 8px;
        }
        .company-title { 
          font-weight: 900; 
          font-size: 20px; 
        }
        .company-sub { 
          font-size: 11px; 
          margin-top: 2px; 
        }

        .meta-block {
          width: 36%;
          text-align: left;
          font-size: 13px;
          line-height: 1.4;
          padding: 6px 8px;
        }

        .fromto {
          display: flex;
          justify-content: space-between;
          margin-top: 5px;
          padding: 5px 2px;
          font-weight: 200;
          font-size: 13px;
          border-top: 1px solid #000;
        }

        .ts-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 5px;
        }

        .ts-table thead th {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          border-left: 1px solid #000;
          padding: 5px;
          font-weight: 700;
        }
        .ts-table thead th:last-child {
          border-right: 1px solid #000;
        }

        .ts-table tbody td {
          padding: 4px 5px;
          border-left: 1px solid #000;
          vertical-align: top;
          height: 20px;
          line-height: 1.3;
        }
        .ts-table tbody td:last-child {
          border-right: 1px solid #000;
        }

        .total-row td {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 6px 5px;
          font-weight: 800;
        }
        .total-label { text-align: right; }
        .total-amt { text-align: right; white-space: nowrap; }

        .footer {
          margin-top: 5px;
          font-size: 11px;
          line-height: 1.4;
        }

        .dash {
          display: inline-block;
          border-bottom: 1px dashed #000;
          padding: 0 5px;
          min-width: 100px;
        }

        .trip-footer-grid {
          margin-top: 6px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
          font-size: 11px;
        }
        .col-line {
          border-bottom: 1px dashed #000;
          padding-bottom: 2px; 
          display: inline-block;
          min-width: 110px;
        }

        .legal {
          margin-top: 6px;
          font-size: 10px;
          text-align: left;
          line-height: 1.3;
        }

        .sigs {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 15px;
          font-size: 11px;
          padding: 0 20px;
        }
        .sig-box {
          text-align: center;
          width: 45%;
        }
        .sig-line {
          display: block;
          width: 70%;
          height: 1px;
          margin: 0 auto 5px;
          border-top: 1px solid #000;
        }
        .sig-name {
          font-weight: bold;
          margin-bottom: 5px;
          min-height: 16px;
        }
      `}
      </style>

      <div className="page-heading uppercase">{label.title}</div>

      <div className="box">
        {/* Header */}
        <div className="header-flex">
          <div className="company-block">
            <div>
              <div style={{ fontSize: 11 }}>
                <div>{label.fixedGstinLabel} {label.fixedGstinValue} </div> 
                <div>{label.mobileLabel} {label.mobileNumberValue}</div>
              </div>
              <div className="company-title uppercase">{label.companyName}</div>
              <div className="company-sub whitespace-pre-wrap">
                {label.companyAddress}
              </div>
            </div>
          </div>

          <div className="meta-block">
            <div><strong>{label.mfNoLabel}</strong> {sheet.mfNo}</div>
            <div><strong>{label.carriersLabel}</strong> {(sheet.carriers ?? "").toUpperCase()}</div>
          </div>
        </div>

        {/* From / To / Date */}
        <div className="fromto">
          <div>
            <span className="w-10">{label.fromLabel} </span>
            <span className="font-bold">{sheet.fromPlace}</span>
          </div>
          <div>
             <span className="w-10">{label.toLabel} </span>
            <span className="font-bold">{sheet.toPlace}</span>
            </div>
          <div>
            <span className="w-10">{label.dateLabel} </span>
            <span className="font-bold">{fmtDate(sheet.tsDate)}</span>
          </div>
        </div>

        {/* Table */}
        <table className="ts-table">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>{label.cnNoHeader}</th>
              <th style={{ width: "18%" }}>{label.packagesHeader}</th>
              <th style={{ width: "15%" }}>{label.contentsHeader}</th>
              <th style={{ width: "22%" }}>{label.consignorHeader}</th>
              <th style={{ width: "27%" }}>{label.consigneeHeader}</th>
              <th style={{ width: "12%" }}>{label.toPayHeader}</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it, idx) => {
              const isRepeatedGc = idx > 0 && items[idx - 1].gcNo === it.gcNo;
              
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: isRepeatedGc ? 'normal' : 'bold' }}>
                    {isRepeatedGc ? "" : it.gcNo}
                  </td>
                  <td>{it.qty} {it.packingDts}</td>
                  <td>{it.contentDts}</td>
                  <td>{it.consignor}</td>
                  <td>{it.consignee}</td>
                  <td style={{ textAlign: "right" }}>
                    ₹{(it.amount ?? 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}

            {/* Filler rows */}
            {Array.from({ length: fillerCount }).map((_, i) => (
              <tr key={`f-${i}`}>
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
              </tr>
            ))}

            {/* TOTAL ROW */}
            <tr className="total-row">
              <td colSpan={5} className="total-left">
                {label.totalPackagesLabel} {totalPackages}
              </td>
              <td className="total-right">
                ₹{total.toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
         <div className="footer no-gap">
          {label.footerNote0}
          &nbsp;{label.footerNote1}<span className="dash bold font-semibold">{sheet.unloadPlace ?? sheet.toPlace}</span>
          &nbsp;&nbsp; {label.footerNote2} <span className="dash bold font-bold">₹{total.toLocaleString("en-IN")}</span>,
          &nbsp;&nbsp; <strong className="dash bold">{totalWords}</strong> {label.footerNote3}
        </div>

        {/* Driver / Owner / Lorry */}
        <div style={{ borderTop: "1px solid #000", marginTop: 6, paddingTop: 6 }}>
          <div className="trip-footer-grid font-thin">
          <div>
            <div><strong>{label.driverNameLabel}</strong> <span className="col-line font-semibold">{(sheet.driverName ?? "").toUpperCase()}</span></div>
            <div style={{ marginTop: 4 }}>
              <strong>{label.dlNoLabel}</strong> <span className="col-line font-semibold">{(sheet.dlNo ?? "").toUpperCase()}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>{label.driverMobileLabel}</strong> <span className="col-line font-semibold">{(sheet.driverMobile ?? "").toUpperCase()}</span>
            </div>
          </div>

          <div>
            <div><strong>{label.ownerNameLabel}</strong> <span className="col-line font-semibold">{(sheet.ownerName ?? "").toUpperCase()}</span></div>
            <div style={{ marginTop: 4 }}>
              <strong>{label.ownerMobileLabel}</strong> <span className="col-line font-semibold">{(sheet.ownerMobile ?? "").toUpperCase()}</span>
            </div>
          </div>

          <div>
            <div><strong>{label.lorryNoLabel}</strong> <span className="col-line font-semibold">{(sheet.lorryNo ?? "").toUpperCase()}</span></div>
            <div style={{ marginTop: 4 }}>
              <strong>{label.lorryNameLabel}</strong> <span className="col-line font-semibold">{(sheet.lorryName ?? "").toUpperCase()}</span></div>
          </div>
        </div>
        </div>

        {/* Legal + Signature */}
        <div style={{ borderTop: "1px solid #000", marginTop: 6, paddingTop: 6 }}>
          <div className="legal mb-2 whitespace-pre-wrap">
            {label.legalNote}
          </div>

          <div style={{ height: "5px" }}></div>

          <div className="sigs">
            <div className="sig-box">
              <div className="sig-name">&nbsp;</div>
              <span className="sig-line" />
              <div>{label.signatureDriverLabel}</div>
            </div>
            <div className="sig-box">
              <div className="sig-name">{userName}</div>
              <span className="sig-line" />
              <div>{label.signatureClerkLabel}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TripSheetPrintCopy;
