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

  const userName = user?.name;

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
  
  // TOTAL PACKAGES
  const totalPackages = items.reduce((acc, it) => acc + (it.qty || 0), 0);

  const itemCount = items.length;
  
  // Maximum rows that fit on one page WITH all footer sections
  const MAX_ROWS_SINGLE_PAGE = 15;
  
  // If more than 15 items, we need page 2 for footer sections
  const needsPage2 = itemCount > MAX_ROWS_SINGLE_PAGE;

  // Calculate filler rows - only add if content fits on one page
  const visibleRowCount = needsPage2 ? 0 : Math.max(0, MAX_ROWS_SINGLE_PAGE - itemCount);

  // Footer sections component to avoid duplication
  const FooterSections = () => (
    <>
      {/* Footer Note */}
      <div className="ts-footer no-gap">
        {label.footerNote0}
        &nbsp;{label.footerNote1}<span className="ts-dash bold font-semibold">{sheet.unloadPlace ?? sheet.toPlace}</span>
        &nbsp;&nbsp; {label.footerNote2} <span className="ts-dash bold font-bold">₹{total.toLocaleString("en-IN")}</span>,
        &nbsp;&nbsp; <strong className="ts-dash bold">{totalWords}</strong> {label.footerNote3}
      </div>

      {/* Driver / Owner / Lorry */}
      <div style={{ borderTop: "1px solid #000", marginTop: 6, paddingTop: 6 }}>
        <div className="ts-footer-grid font-thin">
          <div>
            <div><strong>{label.driverNameLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.driverName ?? "").toUpperCase()}</span></div>
            <div style={{ marginTop: 4 }}>
              <strong>{label.dlNoLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.dlNo ?? "").toUpperCase()}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>{label.driverMobileLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.driverMobile ?? "").toUpperCase()}</span>
            </div>
          </div>

          <div>
            <div><strong>{label.ownerNameLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.ownerName ?? "").toUpperCase()}</span></div>
            <div style={{ marginTop: 4 }}>
              <strong>{label.ownerMobileLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.ownerMobile ?? "").toUpperCase()}</span>
            </div>
          </div>

          <div>
            <div><strong>{label.lorryNoLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.lorryNo ?? "").toUpperCase()}</span></div>
            <div style={{ marginTop: 4 }}>
              <strong>{label.lorryNameLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.lorryName ?? "").toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legal + Signature */}
      <div style={{ borderTop: "1px solid #000", marginTop: 6, paddingTop: 6 }}>
        <div className="ts-legal mb-2 whitespace-pre-wrap">
          {label.legalNote}
        </div>

        <div style={{ height: "5px" }}></div>

        <div className="ts-sigs">
          <div className="ts-sig-box">
            <div className="ts-sig-name">&nbsp;</div>
            <span className="ts-sig-line" />
            <div>{label.signatureDriverLabel}</div>
          </div>
          <div className="ts-sig-box">
            <div className="ts-sig-name">{userName}</div>
            <span className="ts-sig-line" />
            <div>{label.signatureClerkLabel}</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ==================== PAGE 1: Header + Table ==================== */}
      <div className="ts-page-content">
        <div className="ts-page-heading uppercase">{label.title}</div>

        <div className="ts-box">
          {/* Header */}
          <div className="ts-header-flex">
            <div className="ts-company-block">
              <div>
                <div style={{ fontSize: 11 }}>
                  <div>{label.fixedGstinLabel} {label.fixedGstinValue} </div> 
                  <div>{label.mobileLabel} {label.mobileNumberValue}</div>
                </div>
                <div className="ts-company-title uppercase">{label.companyName}</div>
                <div className="ts-company-sub whitespace-pre-wrap">
                  {label.companyAddress}
                </div>
              </div>
            </div>

            <div className="ts-meta-block">
              <div><strong>{label.mfNoLabel}</strong> {sheet.mfNo}</div>
              <div><strong>{label.carriersLabel}</strong> {(sheet.carriers ?? "").toUpperCase()}</div>
            </div>
          </div>

          {/* From / To / Date */}
          <div className="ts-fromto">
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

              {/* Filler rows - only if not overflowing */}
              {Array.from({ length: visibleRowCount }).map((_, i) => (
                <tr key={`f-${i}`}>
                  <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                  <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                </tr>
              ))}

              {/* TOTAL ROW */}
              <tr className="ts-total-row">
                <td colSpan={5} className="ts-total-left">
                  {label.totalPackagesLabel} {totalPackages}
                </td>
                <td className="ts-total-right">
                  ₹{total.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer sections on page 1 if fits */}
          {!needsPage2 && <FooterSections />}
        </div>
      </div>

      {/* ==================== PAGE 2: Footer sections (only if overflow) ==================== */}
      {needsPage2 && (
        <div className="ts-page-content ts-page-break">
          <div className="ts-page-heading uppercase">{label.title} (Continued)</div>
          
          <div className="ts-box">
            <div className="ts-continuation-header">
              MF No: {sheet.mfNo} | {sheet.fromPlace} → {sheet.toPlace} | Date: {fmtDate(sheet.tsDate)}
            </div>

            <FooterSections />
          </div>
        </div>
      )}
    </>
  );
};

export default TripSheetPrintCopy;
