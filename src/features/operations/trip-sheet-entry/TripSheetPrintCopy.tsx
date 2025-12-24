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

  // Pagination: Fixed rows per page that fits with header + footer
  const ROWS_PER_PAGE = 15;
  
  // Split items into pages
  const pages: TripSheetGCItem[][] = [];
  for (let i = 0; i < items.length; i += ROWS_PER_PAGE) {
    pages.push(items.slice(i, i + ROWS_PER_PAGE));
  }
  
  // If no items, still show one page
  if (pages.length === 0) {
    pages.push([]);
  }

  const totalPages = pages.length;

  // Page Title
  const PageTitle = ({ }: { pageNum: number }) => (
    <div className="ts-page-heading uppercase">
      {label.title}
      {/* {totalPages > 1 && <span style={{ fontSize: 12, fontWeight: 'normal', marginLeft: 10 }}>(Page {pageNum} of {totalPages})</span>} */}
    </div>
  );

  // Header Component - Same for all pages
  const PageHeader = () => (
    <div className="ts-box-header">
      {/* Header */}
      <div className="ts-header-flex">
        <div className="ts-company-block">
          <div>
            <div style={{ fontSize: 11 }}>
              <div>{label.fixedGstinLabel} {label.fixedGstinValue}</div> 
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
    </div>
  );

  // Footer Component - Same for all pages
  const PageFooter = () => (
    <div className="ts-box-footer">
      {/* Footer Note */}
      <div className="ts-footer no-gap">
        {label.footerNote0}
        &nbsp;{label.footerNote1}<span className="ts-dash bold font-semibold">{sheet.unloadPlace ?? sheet.toPlace}</span>
        &nbsp;&nbsp; {label.footerNote2} <span className="ts-dash bold font-bold">₹{total.toLocaleString("en-IN")}</span>,
        &nbsp;&nbsp; <strong className="ts-dash bold">{totalWords}</strong> {label.footerNote3}
      </div>

      {/* Driver / Owner / Lorry */}
      <div style={{ borderTop: "1px solid #000", marginTop: 4, paddingTop: 4 }}>
        <div className="ts-footer-grid font-thin">
          <div>
            <div><strong>{label.driverNameLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.driverName ?? "").toUpperCase()}</span></div>
            <div style={{ marginTop: 3 }}>
              <strong>{label.dlNoLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.dlNo ?? "").toUpperCase()}</span>
            </div>
            <div style={{ marginTop: 3 }}>
              <strong>{label.driverMobileLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.driverMobile ?? "").toUpperCase()}</span>
            </div>
          </div>

          <div>
            <div><strong>{label.ownerNameLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.ownerName ?? "").toUpperCase()}</span></div>
            <div style={{ marginTop: 3 }}>
              <strong>{label.ownerMobileLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.ownerMobile ?? "").toUpperCase()}</span>
            </div>
          </div>

          <div>
            <div><strong>{label.lorryNoLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.lorryNo ?? "").toUpperCase()}</span></div>
            <div style={{ marginTop: 3 }}>
              <strong>{label.lorryNameLabel}</strong> <span className="ts-col-line font-semibold">{(sheet.lorryName ?? "").toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legal + Signature */}
      <div style={{ borderTop: "1px solid #000", marginTop: 4, paddingTop: 4 }}>
        <div className="ts-legal mb-1 whitespace-pre-wrap">
          {label.legalNote}
        </div>

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
    </div>
  );

  // Table Component for each page
  const PageTable = ({ 
    pageItems, 
    isLastPage, 
    pageIndex 
  }: { 
    pageItems: TripSheetGCItem[]; 
    isLastPage: boolean;
    pageIndex: number;
  }) => {
    // Get the starting index for this page (for checking repeated GC)
    const startIdx = pageIndex * ROWS_PER_PAGE;
    
    return (
      <div className="ts-table-wrapper">
        <table className="ts-table">
          <thead>
            <tr>
              <th style={{ width: "8%" }}>{label.cnNoHeader}</th>
              <th style={{ width: "18%" }}>{label.packagesHeader}</th>
              <th style={{ width: "15%" }}>{label.contentsHeader}</th>
              <th style={{ width: "22%" }}>{label.consignorHeader}</th>
              <th style={{ width: "27%" }}>{label.consigneeHeader}</th>
              <th style={{ width: "10%" }}>{label.toPayHeader}</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.map((it, idx) => {
              // Check if this GC is repeated from previous row (within this page or from previous page)
              const globalIdx = startIdx + idx;
              const isRepeatedGc = globalIdx > 0 && items[globalIdx - 1]?.gcNo === it.gcNo;
              
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

            {/* Single filler row that expands to fill remaining space */}
            <tr className="ts-filler-row">
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>

            {/* TOTAL ROW - Only on last page */}
            {isLastPage && (
              <tr className="ts-total-row">
                <td colSpan={5} className="ts-total-left">
                  {label.totalPackagesLabel} {totalPackages}
                </td>
                <td className="ts-total-right">
                  ₹{total.toLocaleString("en-IN")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      {pages.map((pageItems, pageIndex) => (
        <div 
          key={pageIndex} 
          className={`ts-page-content ${pageIndex > 0 ? 'ts-page-break' : ''}`}
        >
          <PageTitle pageNum={pageIndex + 1} />
          
          <div className="ts-box">
            {/* Header - Fixed at top */}
            <PageHeader />

            {/* Table - Fills middle space */}
            <PageTable 
              pageItems={pageItems} 
              isLastPage={pageIndex === totalPages - 1}
              pageIndex={pageIndex}
            />

            {/* Footer - Fixed at bottom */}
            <PageFooter />
          </div>
        </div>
      ))}
    </>
  );
};

export default TripSheetPrintCopy;
