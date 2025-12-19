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
        height: "208mm", 
        padding: "3mm 4mm 0 4mm", 
        boxSizing: "border-box",
        overflow: "hidden"
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 148mm 210mm !important;
            margin: 0mm !important;
          }
        }
      `}} />

      {/* --- HEADER --- */}
      <div className="relative mb-0.5 flex min-h-[65px] ">
        <div className="flex flex-col justify-start w-1/4">
          <div className="uppercase text-[10px] font-bold w-fit mb-0.5">
            {copyType}
          </div>
          <div className="font-bold text-[9px] leading-tight">
            <div className="whitespace-nowrap">{label.gcNoLabel} : {gc.gcNo}</div>
            <div className="whitespace-nowrap">{label.dateLabel} : {gc.gcDate}</div>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1 px-1 text-center">
          <div className="text-[8px] font-bold flex gap-2 mb-0.5">
            <span>{label.fixedGstinLabel}:{label.fixedGstinValue}</span>
            <span>{label.mobileLabel} : {label.mobileNumberValue}</span>
          </div>
          <h1 className="text-[16px] font-extrabold uppercase tracking-tight leading-none">
            {label.companyName}
          </h1>
          <div className="font-bold text-[8px] uppercase leading-tight mt-0.5">
            {label.tagLine}
          </div>
          <div className="font-bold text-[7px] whitespace-pre-wrap leading-tight">
            {label.companyAddress}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-1/4">
          <QRCodeSVG value={directApiUrl} size={48} level="M" />
          <span className="text-[7px] font-bold mt-0.5 uppercase">
            {label.scanLabel}
          </span>
        </div>
      </div>

      <div className="border border-black flex font-bold text-[9px] uppercase mb-0.5">
        <div className="flex-none px-1 py-[1px] border-r border-black">
          {label.fromLabel} <span className="ml-1">{gc.from}</span>
        </div>
        <div className="flex-1 text-center px-1 py-[1px] border-r border-black">
          {label.ownerRiskText}
        </div>
        <div className="flex-none px-1 py-[1px]">
          {label.toLabel} <span className="ml-1">{gc.destination}</span>
        </div>
      </div>

      {/* --- CONSIGNOR / CONSIGNEE --- */}
      <div className="flex mb-1 gap-2">
        <div className="w-1/2 p-0.5">
          <div className="text-[8px] mb-[1px] font-normal uppercase">{label.consignorLabel}</div>
          <div className="pl-2">
            <div className="font-extrabold text-[9px] uppercase leading-none">{consignor.name}</div>
            <div className="font-bold text-[8px] uppercase mb-0.5 leading-none">{consignor.address}</div>
            <div className="text-[8px] font-bold leading-none">GSTIN : {consignor.gst}</div>
          </div>
        </div>
        <div className="w-1/2 p-0.5">
          <div className="text-[8px] mb-[1px] font-normal uppercase">{label.consigneeLabel}</div>
          <div className="pl-2">
            <div className="font-extrabold text-[9px] uppercase leading-none">{consignee.name}</div>
            <div className="font-bold text-[8px] uppercase mb-0.5 leading-none">{consignee.address}</div>
            <div className="text-[8px] font-bold leading-none">{proofLabel} : {proofValue}</div>
          </div>
        </div>
      </div>

      {/* --- MAIN TABLE --- */}
      <div className="border border-black mb-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-center text-[8px] font-normal border-b border-black bg-gray-50">
              <th className="border-r border-black w-[12%] py-[1px] font-bold">{label.tableHeaderPackages}</th>
              <th className="border-r border-black w-[43%] py-[1px] font-bold">{label.tableHeaderDescription}</th>
              <th className="border-r border-black w-[10%] py-[1px] font-bold">{label.tableHeaderWeight}</th>
              <th className="border-r border-black w-[10%] py-[1px] font-bold">{label.tableHeaderRate}</th>
              <th className="w-[25%] py-[1px] font-bold">{label.tableHeaderFreight}</th>
            </tr>
          </thead>
          <tbody className="text-[9px] font-bold">
            <tr className="align-top h-16">
              <td className="border-r border-black text-center pt-1">{quantityNum}</td>
              <td className="border-r border-black pl-1 pt-1 uppercase">
                {descriptionLines.map((line, idx) => (
                  <div key={idx} className="leading-tight text-[9px]">{line}</div>
                ))}
              </td>
              <td className="border-r border-black text-center pt-1"></td>
              <td className="border-r border-black text-center pt-1"></td>
              <td rowSpan={2} className="relative align-top p-0">
                <div className="flex flex-col h-full">
                  <div className="px-1 pt-1 text-right text-[9px] leading-tight">
                    <div className="flex justify-between mb-[1px]">
                      <span className="font-normal">{label.labelFreight}</span>
                      <span>{formatCurrency(gc.freight)}</span>
                    </div>
                    <div className="flex justify-between mb-[1px]">
                      <span className="font-normal">{label.labelGodownCharge}</span>
                      <span>{formatCurrency(gc.godownCharge)}</span>
                    </div>
                    <div className="flex justify-between mb-[1px]">
                      <span className="font-normal">{label.labelStatisticalCharge}</span>
                      <span>{formatCurrency(gc.statisticCharge)}</span>
                    </div>
                    {tollFeeNum > 0 && (
                      <div className="flex justify-between mb-[1px]">
                        <span className="font-normal">{label.labelTollFee}</span>
                        <span>{formatCurrency(gc.tollFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-black mt-[1px] pt-[1px] font-extrabold">
                      <span className="font-bold">{label.labelTotal}</span>
                      <span>{formatCurrency(totalCharges)}</span>
                    </div>
                  </div>
                  <div className="text-right text-[9px] px-1 pb-1 border-t border-black bg-gray-50 mt-auto">
                    <div className="flex justify-between items-center mb-[1px]">
                      <span className="font-normal">{label.labelAdvancePaid}</span>
                      <span className="font-bold">{gc.advanceNone || "NIL"}</span>
                    </div>
                    <div className="flex justify-between items-center font-extrabold text-[10px]">
                      <span className="font-normal">{label.labelBalanceToPay}</span>
                      <span>{formatCurrency(balanceToPayNum)}</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-t border-black h-9">
              <td colSpan={2} className="border-r border-black align-top p-[2px]">
                <div className="flex justify-between text-[8px] font-bold mb-[1px]">
                  <span>{label.invoiceNoLabel}: {gc.billNo}</span>
                  <span>{label.invoiceDateLabel} : {gc.billDate}</span>
                </div>
                <div className="text-[8px] font-bold leading-none">
                  {label.marksLabel} : <span className="ml-1 font-normal italic">{marks}</span>
                </div>
              </td>
              <td colSpan={2} className="border-r border-black align-top p-[2px] text-center">
                <div className="text-[9px] font-extrabold mb-[1px] inline-block uppercase leading-none">
                  {paymentStatusLabel}
                </div>
                <div className="text-[7px] font-normal leading-none mb-[1px]">
                  {label.labelValueGoods}
                </div>
                <div className="text-[9px] font-extrabold leading-none">
                  Rs. {formatCurrency(billValueNum)}
                </div>
              </td>
            </tr>
            <tr className="border-t border-black">
              <td colSpan={2} className="border-r border-black p-[2px] h-6 align-middle">
                <span className="font-normal text-[8px] mr-1">{label.deliveryAtLabel}:</span>
                <span className="font-bold text-[9px] uppercase">{gc.deliveryAt}</span>
              </td>
              <td colSpan={3} className="p-[2px] align-middle bg-gray-50">
                <div className="flex items-baseline gap-1">
                  <span className="text-[8px] font-normal whitespace-nowrap">{label.toPayRsLabel}</span>
                  <span className="text-[8px] font-extrabold uppercase leading-none italic">
                    {numberToWordsInRupees(balanceToPayNum)}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- FOOTER --- */}
      <div className="border-x border-b border-black pt-0 pb-1 px-1 flex justify-between items-end min-h-[1.5rem] relative">
        <div className="w-1/3">
          <div className="text-[8px] font-bold leading-none">
            <span className="font-normal block text-[7px] text-gray-600 mb-[1px] italic">{label.freightFixedUptoLabel}</span>
            <span className="uppercase">{gc.freightUptoAt}</span>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1 text-center text-[7px] leading-none font-bold w-1/3">
          {label.footerUnloadingNote}
        </div>
        <div className="text-[9px] flex flex-col items-center w-1/3 text-right">
          <div className="h-2"></div>
          <span className="font-extrabold uppercase text-[8px]">{user?.name || 'Admin'}</span>
          <span className="italic font-bold text-[7px] pt-[1px]">{label.footerSignatureLine}</span>
        </div>
      </div>

      <div className="text-center text-[7px] font-bold uppercase tracking-widest mt-[2px]">
        {label.footerNote}
      </div>
    </div>
  );
};