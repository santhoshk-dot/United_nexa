import React from "react";
import type { GcEntry, Consignor, Consignee } from "../../../types";
import { numberToWords, numberToWordsInRupees } from "../../../utils/toWords";
import { useAuth } from "../../../hooks/useAuth";
import { API_URL } from "../../../utils/api";
import { useDataContext } from "../../../contexts/DataContext";
import { QRCodeSVG } from 'qrcode.react';

const formatCurrency = (amount: number | string | undefined) => {
  const num = parseFloat(amount?.toString() || "0");
  return num > 0 ? `${num.toLocaleString("en-IN")}` : "";
};

const getRoleSlug = (copyType: string) => {
  const lower = copyType.toLowerCase();
  if (lower.includes('consignor')) return 'consignor';
  if (lower.includes('consignee')) return 'consignee';
  if (lower.includes('lorry') || lower.includes('driver')) return 'driver';
  return 'viewer';
};

interface Props {
  gc: GcEntry;
  consignor: Consignor;
  consignee: Consignee;
  copyType: string;
}

export const GcPrintCopy: React.FC<Props> = ({
  gc,
  consignor,
  consignee,
  copyType,
}) => {
  const { user } = useAuth();
  const { printSettings } = useDataContext();
  const label = printSettings.gc;

  const roleSlug = getRoleSlug(copyType);
  const directApiUrl = `${API_URL}/public/view-terms?gcNo=${gc.gcNo}&role=${roleSlug}`;

  const quantityNum = gc.contentItems?.reduce((sum, item) => sum + (parseFloat(String(item.qty)) || 0), 0) || gc.netQty || 0;
  const billValueNum = parseFloat(String(gc.billValue)) || 0;

  const balanceToPayNum = (gc as any).tripSheetAmount !== undefined
    ? (gc as any).tripSheetAmount
    : (parseFloat(String(gc.balanceToPay)) || 0);

  const freightNum = parseFloat(String(gc.freight)) || 0;
  const godownChargeNum = parseFloat(String(gc.godownCharge)) || 0;
  const statisticChargeNum = parseFloat(String(gc.statisticCharge)) || 0;
  const tollFeeNum = parseFloat(String(gc.tollFee)) || 0;

  const totalCharges = freightNum + godownChargeNum + statisticChargeNum + tollFeeNum;

  const isPaid = gc.paymentType?.toLowerCase() === 'paid';
  const paymentStatusLabel = isPaid ? "PAID" : (label as any).paymentTypeToPay || "TO PAY";

  const marks = gc.contentItems
    ?.map(item => {
      const itemFromNo = parseFloat(String(item.fromNo)) || 0;
      const itemQty = parseFloat(String(item.qty)) || 0;
      const toNo = (itemFromNo > 0 && itemQty > 0) ? (itemFromNo + itemQty - 1) : '';
      return item.prefix
        ? `${item.prefix} ${itemFromNo} to ${toNo}`
        : `${itemFromNo} to ${toNo}`;
    })
    .join(', ') || '';

  const descriptionLines: string[] = [];
  if (gc.contentItems && gc.contentItems.length > 0) {
    gc.contentItems.forEach(item => {
      const qty = parseFloat(String(item.qty)) || 0;
      if (qty > 0 && item.packing && item.contents) {
        descriptionLines.push(`${qty} ${item.packing} of ${item.contents}`);
      }
    });
  }
  if (descriptionLines.length === 0) {
    descriptionLines.push(`${numberToWords(quantityNum)} packages`);
  }

  let proofLabel = "GSTIN";
  let proofValue = "---";

  if (gc.consigneeProofType === 'gst' && gc.consigneeProofValue) {
    proofLabel = "GSTIN";
    proofValue = gc.consigneeProofValue;
  } else if (consignee.gst) {
    proofLabel = "GSTIN";
    proofValue = consignee.gst;
  } else if (gc.consigneeProofType === 'pan' && gc.consigneeProofValue) {
    proofLabel = "PAN";
    proofValue = gc.consigneeProofValue;
  } else if (consignee.pan) {
    proofLabel = "PAN";
    proofValue = consignee.pan;
  } else if (gc.consigneeProofType === 'aadhar' && gc.consigneeProofValue) {
    proofLabel = "AADHAR";
    proofValue = gc.consigneeProofValue;
  } else if (consignee.aadhar) {
    proofLabel = "AADHAR";
    proofValue = consignee.aadhar;
  }

  return (
    <div
      className="print-page font-sans text-black bg-white"
      style={{
        width: "100%",
        height: "146mm", 
        // Increased padding to push content inwards slightly and look balanced
        padding: "5mm 6mm 0 6mm", 
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 210mm 148mm !important;
            margin: 0mm !important;
          }
        }
      `}} />

      {/* --- HEADER --- */}
      {/* Increased margin-bottom (mb-2) and text sizes */}
      <div className="relative mb-2 flex min-h-[75px] items-start">
        <div className="flex flex-col justify-start w-1/4 pt-1">
          <div className="uppercase text-xs font-bold w-fit mb-1 border-b border-black">
            {copyType}
          </div>
          <div className="font-bold text-[11px] leading-snug">
            <div className="whitespace-nowrap">{label.gcNoLabel} : <span className="text-[12px]">{gc.gcNo}</span></div>
            <div className="whitespace-nowrap">{label.dateLabel} : {gc.gcDate}</div>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 px-2 text-center">
          <div className="text-[10px] font-bold flex gap-3 mb-1">
            <span>{label.fixedGstinLabel}:{label.fixedGstinValue}</span>
            <span>{label.mobileLabel} : {label.mobileNumberValue}</span>
          </div>
          {/* Increased Company Name Size significantly */}
          <h1 className="text-2xl font-extrabold uppercase tracking-tight leading-none mb-1">
            {label.companyName}
          </h1>
          <div className="font-bold text-[10px] uppercase leading-tight">
            {label.tagLine}
          </div>
          <div className="font-bold text-[9px] whitespace-pre-wrap leading-tight mt-0.5">
            {label.companyAddress}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-1/4 pt-1">
          <QRCodeSVG value={directApiUrl} size={54} level="M" />
          <span className="text-[8px] font-bold mt-1 uppercase">
            {label.scanLabel}
          </span>
        </div>
      </div>

      {/* --- FROM / TO BAR --- */}
      {/* Increased text size to text-[11px] and padding py-1 */}
      <div className="border border-black flex font-bold text-[11px] uppercase mb-2">
        <div className="flex-none px-2 py-1 border-r border-black">
          {label.fromLabel} <span className="ml-1 text-[12px]">{gc.from}</span>
        </div>
        <div className="flex-1 text-center px-2 py-1 border-r border-black bg-gray-50">
          {label.ownerRiskText}
        </div>
        <div className="flex-none px-2 py-1">
          {label.toLabel} <span className="ml-1 text-[12px]">{gc.destination}</span>
        </div>
      </div>

      {/* --- CONSIGNOR / CONSIGNEE --- */}
      {/* Increased gap and font sizes */}
      <div className="flex mb-2 gap-4">
        <div className="w-1/2">
          <div className="text-[10px] mb-1 font-bold text-gray-600 uppercase border-b border-gray-300 w-fit">{label.consignorLabel}</div>
          <div className="pl-1">
            <div className="font-extrabold text-[12px] uppercase leading-snug">{consignor.name}</div>
            <div className="font-bold text-[10px] uppercase mb-1 leading-snug">{consignor.address}</div>
            <div className="text-[10px] font-bold leading-none">GSTIN : {consignor.gst}</div>
          </div>
        </div>
        <div className="w-1/2">
          <div className="text-[10px] mb-1 font-bold text-gray-600 uppercase border-b border-gray-300 w-fit">{label.consigneeLabel}</div>
          <div className="pl-1">
            <div className="font-extrabold text-[12px] uppercase leading-snug">{consignee.name}</div>
            <div className="font-bold text-[10px] uppercase mb-1 leading-snug">{consignee.address}</div>
            <div className="text-[10px] font-bold leading-none">{proofLabel} : {proofValue}</div>
          </div>
        </div>
      </div>

      {/* --- MAIN TABLE --- */}
      {/* Increased border width slightly visually with structure, increased cell padding */}
      <div className="border border-black mb-0 flex-grow flex flex-col">
        <table className="w-full border-collapse flex-grow">
          <thead>
            <tr className="text-center text-[10px] font-normal border-b border-black bg-gray-100">
              <th className="border-r border-black w-[12%] py-1 font-bold">{label.tableHeaderPackages}</th>
              <th className="border-r border-black w-[43%] py-1 font-bold">{label.tableHeaderDescription}</th>
              <th className="border-r border-black w-[10%] py-1 font-bold">{label.tableHeaderWeight}</th>
              <th className="border-r border-black w-[10%] py-1 font-bold">{label.tableHeaderRate}</th>
              <th className="w-[25%] py-1 font-bold">{label.tableHeaderFreight}</th>
            </tr>
          </thead>
          <tbody className="text-[11px] font-bold">
            {/* Main Row - let it grow to fill space if needed */}
            <tr className="align-top">
              <td className="border-r border-black text-center pt-2">{quantityNum}</td>
              <td className="border-r border-black pl-2 pt-2 uppercase">
                {descriptionLines.map((line, idx) => (
                  <div key={idx} className="leading-snug text-[11px] mb-1">{line}</div>
                ))}
              </td>
              <td className="border-r border-black text-center pt-2"></td>
              <td className="border-r border-black text-center pt-2"></td>
              {/* Freight Column Breakdown */}
              <td rowSpan={2} className="relative align-top p-0 h-full">
                <div className="flex flex-col h-full justify-between">
                  <div className="px-2 pt-2 text-right text-[11px] leading-normal">
                    <div className="flex justify-between mb-1">
                      <span className="font-normal text-[10px]">{label.labelFreight}</span>
                      <span>{formatCurrency(gc.freight)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="font-normal text-[10px]">{label.labelGodownCharge}</span>
                      <span>{formatCurrency(gc.godownCharge)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="font-normal text-[10px]">{label.labelStatisticalCharge}</span>
                      <span>{formatCurrency(gc.statisticCharge)}</span>
                    </div>
                    {tollFeeNum > 0 && (
                      <div className="flex justify-between mb-1">
                        <span className="font-normal text-[10px]">{label.labelTollFee}</span>
                        <span>{formatCurrency(gc.tollFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-black mt-1 pt-1 font-extrabold text-[12px]">
                      <span className="font-bold">{label.labelTotal}</span>
                      <span>{formatCurrency(totalCharges)}</span>
                    </div>
                  </div>
                  
                  <div className="text-right text-[11px] px-2 pb-2 pt-1 border-t border-black bg-gray-50 mt-auto">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-normal text-[10px]">{label.labelAdvancePaid}</span>
                      <span className="font-bold">{gc.advanceNone || "NIL"}</span>
                    </div>
                    <div className="flex justify-between items-center font-extrabold text-[13px]">
                      <span className="font-normal text-[11px]">{label.labelBalanceToPay}</span>
                      <span>{formatCurrency(balanceToPayNum)}</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            {/* Invoice Row */}
            <tr className="border-t border-black h-10">
              <td colSpan={2} className="border-r border-black align-top p-1">
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span>{label.invoiceNoLabel}: {gc.billNo}</span>
                  <span>{label.invoiceDateLabel} : {gc.billDate}</span>
                </div>
                <div className="text-[10px] font-bold leading-tight">
                  {label.marksLabel} : <span className="ml-1 font-normal italic">{marks}</span>
                </div>
              </td>
              <td colSpan={2} className="border-r border-black align-middle p-1 text-center bg-gray-50">
                <div className="text-[12px] font-extrabold mb-0.5 inline-block uppercase leading-none">
                  {paymentStatusLabel}
                </div>
                <div className="text-[8px] font-normal leading-none mb-0.5 text-gray-600">
                  {label.labelValueGoods}
                </div>
                <div className="text-[11px] font-extrabold leading-none">
                  Rs. {formatCurrency(billValueNum)}
                </div>
              </td>
            </tr>
            {/* Delivery / Words Row */}
            <tr className="border-t border-black">
              <td colSpan={2} className="border-r border-black p-1 h-8 align-middle">
                <span className="font-normal text-[10px] mr-2">{label.deliveryAtLabel}:</span>
                <span className="font-bold text-[12px] uppercase">{gc.deliveryAt}</span>
              </td>
              <td colSpan={3} className="p-1 align-middle bg-gray-100">
                <div className="flex items-baseline gap-2 pl-2">
                  <span className="text-[10px] font-normal whitespace-nowrap">{label.toPayRsLabel}</span>
                  <span className="text-[10px] font-extrabold uppercase leading-none italic">
                    {numberToWordsInRupees(balanceToPayNum)}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- FOOTER --- */}
      {/* Increased heights and font sizes in footer */}
      <div className="border-x border-b border-black pt-2 pb-2 px-2 flex justify-between items-end min-h-[3rem] relative bg-white">
        <div className="w-1/3">
          <div className="text-[10px] font-bold leading-tight">
            <span className="font-normal block text-[9px] text-gray-600 mb-0.5 italic">{label.freightFixedUptoLabel}</span>
            <span className="uppercase text-[11px]">{gc.freightUptoAt}</span>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-center text-[9px] leading-tight font-bold w-1/3 text-gray-500">
          {label.footerUnloadingNote}
        </div>
        <div className="text-[10px] flex flex-col items-center w-1/3 text-right">
          <div className="h-4"></div> {/* Space for signature */}
          <span className="font-extrabold uppercase text-[10px]">{user?.name || 'Admin'}</span>
          <span className="italic font-bold text-[8px] pt-1 border-t border-black w-3/4 text-center mt-1">{label.footerSignatureLine}</span>
        </div>
      </div>

      <div className="text-center text-[8px] font-bold uppercase tracking-widest mt-1 text-gray-500">
        {label.footerNote}
      </div>
    </div>
  );
};