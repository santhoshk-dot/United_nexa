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
        height: "auto", /* Changed from 100% to auto */
        padding: "4mm 4mm 0 4mm", /* Removed bottom padding */
        boxSizing: "border-box",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A5;
            margin: 0mm !important;
          }
        }
      `}} />

      {/* --- HEADER --- */}
      <div className="relative mb-1 flex min-h-[85px]">
        <div className="flex flex-col justify-start w-1/4">
          <div className="uppercase text-[12px] font-bold w-fit mb-1">
            {copyType}
          </div>
          <div className="font-bold text-[11px] leading-tight">
            <div className="whitespace-nowrap">{label.gcNoLabel} : {gc.gcNo}</div>
            <div className="whitespace-nowrap">{label.dateLabel} : {gc.gcDate}</div>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 px-2 text-center">
          <div className="text-[10px] font-bold flex gap-3 mb-0.5">
            <span>{label.fixedGstinLabel}:{label.fixedGstinValue}</span>
            <span>{label.mobileLabel} : {label.mobileNumberValue}</span>
          </div>
          <h1 className="text-xl font-extrabold uppercase tracking-tight leading-none">
            {label.companyName}
          </h1>
          <div className="font-bold text-[9px] uppercase leading-tight mt-0.5">
            {label.tagLine}
          </div>
          <div className="font-bold text-[7px] whitespace-pre-wrap leading-tight">
            {label.companyAddress}
          </div>
        </div>

        <div className="flex flex-col items-center w-1/4">
          <QRCodeSVG value={directApiUrl} size={60} level="M" />
          <span className="text-[8px] font-bold mt-0.5 uppercase">
            {label.scanLabel}
          </span>
        </div>
      </div>

      <div className="border border-black flex font-bold text-[11px] uppercase mb-1">
        <div className="flex-none px-2 py-0.5 border-r border-black">
          {label.fromLabel} <span className="ml-2">{gc.from}</span>
        </div>
        <div className="flex-1 text-center px-2 py-0.5 border-r border-black">
          {label.ownerRiskText}
        </div>
        <div className="flex-none px-2 py-0.5">
          {label.toLabel} <span className="ml-2">{gc.destination}</span>
        </div>
      </div>

      {/* --- CONSIGNOR / CONSIGNEE --- */}
      <div className="flex mb-2 gap-3">
        <div className="w-1/2 p-1">
          <div className="text-[9px] mb-0.5 font-normal uppercase">{label.consignorLabel}</div>
          <div className="pl-4">
            <div className="font-extrabold text-[11px] uppercase leading-tight">{consignor.name}</div>
            <div className="font-bold text-[10px] uppercase mb-1 leading-tight">{consignor.address}</div>
            <div className="text-[10px] font-bold">GSTIN : {consignor.gst}</div>
          </div>
        </div>
        <div className="w-1/2 p-1">
          <div className="text-[9px] mb-0.5 font-normal uppercase">{label.consigneeLabel}</div>
          <div className="pl-4">
            <div className="font-extrabold text-[11px] uppercase leading-tight">{consignee.name}</div>
            <div className="font-bold text-[10px] uppercase mb-1 leading-tight">{consignee.address}</div>
            <div className="text-[10px] font-bold">{proofLabel} : {proofValue}</div>
          </div>
        </div>
      </div>

      {/* --- MAIN TABLE --- */}
      <div className="border border-black mb-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-center text-[9px] font-normal border-b border-black bg-gray-50">
              <th className="border-r border-black w-[12%] py-0.5 font-bold">{label.tableHeaderPackages}</th>
              <th className="border-r border-black w-[43%] py-0.5 font-bold">{label.tableHeaderDescription}</th>
              <th className="border-r border-black w-[10%] py-0.5 font-bold">{label.tableHeaderWeight}</th>
              <th className="border-r border-black w-[10%] py-0.5 font-bold">{label.tableHeaderRate}</th>
              <th className="w-[25%] py-0.5 font-bold">{label.tableHeaderFreight}</th>
            </tr>
          </thead>
          <tbody className="text-[11px] font-bold">
            <tr className="align-top h-24">
              <td className="border-r border-black text-center pt-1">{quantityNum}</td>
              <td className="border-r border-black pl-1 pt-1 uppercase">
                {descriptionLines.map((line, idx) => (
                  <div key={idx} className="leading-tight">{line}</div>
                ))}
              </td>
              <td className="border-r border-black text-center pt-1"></td>
              <td className="border-r border-black text-center pt-1"></td>
              <td rowSpan={2} className="relative align-top p-0">
                <div className="flex flex-col h-full">
                  <div className="px-1 pt-1 text-right text-[10px] leading-tight">
                    <div className="flex justify-between mb-0.5">
                      <span className="font-normal">{label.labelFreight}</span>
                      <span>{formatCurrency(gc.freight)}</span>
                    </div>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-normal">{label.labelGodownCharge}</span>
                      <span>{formatCurrency(gc.godownCharge)}</span>
                    </div>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-normal">{label.labelStatisticalCharge}</span>
                      <span>{formatCurrency(gc.statisticCharge)}</span>
                    </div>
                    {tollFeeNum > 0 && (
                      <div className="flex justify-between mb-0.5">
                        <span className="font-normal">{label.labelTollFee}</span>
                        <span>{formatCurrency(gc.tollFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-black mt-1 pt-0.5 font-extrabold">
                      <span className="font-bold">{label.labelTotal}</span>
                      <span>{formatCurrency(totalCharges)}</span>
                    </div>
                  </div>
                  <div className="text-right text-[10px] px-1 pb-1 border-t border-black bg-gray-50 mt-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-normal">{label.labelAdvancePaid}</span>
                      <span className="font-bold">{gc.advanceNone || "NIL"}</span>
                    </div>
                    <div className="flex justify-between items-center font-extrabold text-[11px]">
                      <span className="font-normal">{label.labelBalanceToPay}</span>
                      <span>{formatCurrency(balanceToPayNum)}</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-t border-black h-12">
              <td colSpan={2} className="border-r border-black align-top p-1">
                <div className="flex justify-between text-[9px] font-bold mb-1">
                  <span>{label.invoiceNoLabel}: {gc.billNo}</span>
                  <span>{label.invoiceDateLabel} : {gc.billDate}</span>
                </div>
                <div className="text-[9px] font-bold">
                  {label.marksLabel} : <span className="ml-1 font-normal italic">{marks}</span>
                </div>
              </td>
              <td colSpan={2} className="border-r border-black align-top p-1 text-center">
                <div className="text-[10px] font-extrabold mb-0.5 inline-block uppercase">
                  {paymentStatusLabel}
                </div>
                <div className="text-[8px] font-normal leading-none mb-0.5">
                  {label.labelValueGoods}
                </div>
                <div className="text-[10px] font-extrabold">
                  Rs. {formatCurrency(billValueNum)}
                </div>
              </td>
            </tr>
            <tr className="border-t border-black">
              <td colSpan={2} className="border-r border-black p-1 h-8 align-top">
                <span className="font-normal text-[9px] mr-1">{label.deliveryAtLabel}:</span>
                <span className="font-bold text-[10px] uppercase">{gc.deliveryAt}</span>
              </td>
              <td colSpan={3} className="p-1 align-top bg-gray-50">
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] font-normal whitespace-nowrap">{label.toPayRsLabel}</span>
                  <span className="text-[9px] font-extrabold uppercase leading-none italic">
                    {numberToWordsInRupees(balanceToPayNum)}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- FOOTER --- */}
      <div className="border-x border-b border-black pt-0 pb-2 px-2 flex justify-between items-end min-h-[2rem] relative">
        <div className="w-1/3">
          <div className="text-[9px] font-bold leading-tight">
            <span className="font-normal block text-[8px] text-gray-600 mb-0.5 italic">{label.freightFixedUptoLabel}</span>
            <span className="uppercase">{gc.freightUptoAt}</span>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-center text-[8px] leading-tight font-bold w-1/3">
          {label.footerUnloadingNote}
        </div>
        <div className="text-[10px] flex flex-col items-center w-1/3 text-right">
          <div className="h-3"></div>
          <span className="font-extrabold uppercase">{user?.name || 'Admin'}</span>
          <span className="italic font-bold text-[8px]  pt-0.5">{label.footerSignatureLine}</span>
        </div>
      </div>

      {/* FOOTER NOTE - Extra space below this is removed by height:auto and padding-bottom:0 */}
      <div className="text-center text-[8px] font-bold uppercase tracking-widest mt-1">
        {label.footerNote}
      </div>
    </div>
  );
};