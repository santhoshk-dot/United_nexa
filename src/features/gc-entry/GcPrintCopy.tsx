import React from "react";
import type { GcEntry, Consignor, Consignee } from "../../types";
import { numberToWords, numberToWordsInRupees } from "../../utils/toWords";
import { useAuth } from "../../hooks/useAuth";
import { API_URL } from "../../utils/api";
import { useDataContext } from "../../contexts/DataContext";

const formatCurrency = (amount: number | string | undefined) => {
  const num = parseFloat(amount?.toString() || "0");
  return num > 0 ? `${num.toLocaleString("en-IN")}` : "";
};

// Helper to determine role for URL based on copy type
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

  // --- QR Code Logic (Backend Direct) ---
  const roleSlug = getRoleSlug(copyType);

  // 2. Build Backend API URL (Direct Redirect)
  // Example: http://localhost:5000/api/public/view-terms?gcNo=1050&role=consignor
  const directApiUrl = `${API_URL}/public/view-terms?gcNo=${gc.gcNo}&role=${roleSlug}`;

  // 3. Generate QR Code Image URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=0&data=${encodeURIComponent(directApiUrl)}`;

  // Calculate totals from contentItems
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

  // Calculate marks from all content items
  const marks = gc.contentItems
    ?.map(item => {
      const itemFromNo = parseFloat(String(item.fromNo)) || 0;
      const itemQty = parseFloat(String(item.qty)) || 0;
      const toNo = (itemFromNo > 0 && itemQty > 0) ? (itemFromNo + itemQty - 1) : '';
      // Show "prefix fromNo to toNo" or just "fromNo to toNo" if no prefix
      return item.prefix
        ? `${item.prefix} ${itemFromNo} to ${toNo}`
        : `${itemFromNo} to ${toNo}`;
    })
    .join(', ') || '';

  // Build description lines from contentItems array (each item on new line)
  const descriptionLines: string[] = [];
  if (gc.contentItems && gc.contentItems.length > 0) {
    gc.contentItems.forEach(item => {
      const qty = parseFloat(String(item.qty)) || 0;
      if (qty > 0 && item.packing && item.contents) {
        descriptionLines.push(`${qty} ${item.packing} of ${item.contents}`);
      }
    });
  }
  // Fallback for legacy single-item data
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
        width: "210mm",
        minHeight: "297mm",
        padding: "5mm",
        boxSizing: "border-box",
      }}
    >
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end mb-2 font-bold text-sm">
        <div className="uppercase text-base">{copyType}</div>
        <div className="flex gap-8">
          <div>{label.fixedGstinLabel}:{label.fixedGstinValue}</div>
          <div>{label.mobileLabel} : {label.mobileNumberValue}</div>
        </div>
      </div>

      <div className="flex justify-between items-start mb-1">
        <div className="font-bold text-sm leading-relaxed">
          <div className="flex gap-2">
            <span className="w-20">{label.gcNoLabel}</span>
            <span>{gc.gcNo}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-20">{label.dateLabel} :</span>
            <span>{gc.gcDate}</span>
          </div>
        </div>

        <div className="text-right flex-1 ml-4">
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            {label.companyName}
          </h1>
          <div className="font-bold text-sm uppercase">
            {label.tagLine}
          </div>
          <div className="font-bold text-xs mt-0.5 whitespace-pre-wrap">
            {label.companyAddress}
          </div>
        </div>
      </div>

      <div className="border border-black flex font-bold text-lg uppercase mb-2">
        <div className="flex-none px-2 py-1 border-r border-black">
          {label.fromLabel} <span className="ml-2">{gc.from}</span>
        </div>
        <div className="flex-1 text-center px-2 py-1 border-r border-black">
          {label.ownerRiskText}
        </div>
        <div className="flex-none px-2 py-1">
          {label.toLabel} <span className="ml-2">{gc.destination}</span>
        </div>
      </div>

      {/* --- CONSIGNOR / CONSIGNEE --- */}
      <div className="flex mb-2">
        <div className="w-1/2 pr-2">
          <div className="text-xs mb-1 pl-4">{label.consignorLabel}</div>
          <div className="pl-8 font-bold text-sm uppercase">
            {consignor.name}
          </div>
          <div className="pl-8 font-bold text-sm uppercase mb-1">
            {consignor.address}
          </div>
          <div className="pl-4 text-sm font-bold">
            GSTIN : {consignor.gst}
          </div>
        </div>

        <div className="w-1/2 pl-2">
          <div className="text-xs mb-1 pl-4">{label.consigneeLabel}</div>
          <div className="pl-8 font-bold text-sm uppercase">
            {consignee.name}
          </div>
          <div className="pl-8 font-bold text-sm uppercase mb-1">
            {consignee.address}
          </div>
          <div className="pl-4 text-sm font-bold">
            {proofLabel} : {proofValue}
          </div>
        </div>
      </div>

      {/* --- MAIN TABLE --- */}
      <div className="border border-black mb-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-center text-xs font-normal border-b border-black">
              <th className="border-r border-black w-[10%] py-1 font-normal leading-tight whitespace-pre-wrap">
                {label.tableHeaderPackages}
              </th>
              <th className="border-r border-black w-[45%] py-1 font-normal leading-tight whitespace-pre-wrap">
                {label.tableHeaderDescription}
              </th>
              <th className="border-r border-black w-[10%] py-1 font-normal leading-tight whitespace-pre-wrap">
                {label.tableHeaderWeight}
              </th>
              <th className="border-r border-black w-[10%] py-1 font-normal leading-tight whitespace-pre-wrap">
                {label.tableHeaderRate}
              </th>
              <th className="w-[25%] py-1 font-normal whitespace-pre-wrap">
                {label.tableHeaderFreight}
              </th>
            </tr>
          </thead>

          <tbody className="text-sm font-bold">
            <tr className="align-top h-32">
              <td className="border-r border-black text-center pt-2">{quantityNum}</td>
              <td className="border-r border-black pl-2 pt-2 uppercase">
                {descriptionLines.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </td>
              <td className="border-r border-black text-center pt-2"></td>
              <td className="border-r border-black text-center pt-2"></td>

              <td rowSpan={2} className="relative align-top p-0">
                <div className="flex flex-col h-full">
                  <div className="flex-1 px-2 pt-2 text-right text-xs leading-loose">
                    <div className="flex justify-between">
                      <span className="font-normal">{label.labelFreight} :</span>
                      <span>{formatCurrency(gc.freight)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-normal">{label.labelGodownCharge} :</span>
                      <span>{formatCurrency(gc.godownCharge)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-normal">{label.labelStatisticalCharge} :</span>
                      <span>{formatCurrency(gc.statisticCharge)}</span>
                    </div>
                    {tollFeeNum > 0 && (
                      <div className="flex justify-between">
                        <span className="font-normal">{label.labelTollFee} :</span>
                        <span>{formatCurrency(gc.tollFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-black mt-1 pt-1">
                      <span className="font-normal">{label.labelTotal} :</span>
                      <span>{formatCurrency(totalCharges)}</span>
                    </div>
                  </div>

                  <div className="mt-auto text-right text-xs px-2 pb-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-normal">{label.labelAdvancePaid} :</span>
                      <span className="font-bold">{gc.advanceNone || "NIL"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-normal">{label.labelBalanceToPay} :</span>
                      <span className="font-bold">{formatCurrency(balanceToPayNum)}</span>
                    </div>
                  </div >
                </div >
              </td >
            </tr >

            <tr className="border-t border-black h-16">
              <td colSpan={2} className="border-r border-black align-top p-1">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>{label.invoiceNoLabel}: {gc.billNo}</span>
                  <span>{label.invoiceDateLabel} : {gc.billDate}</span>
                </div>
                <div className="text-xs font-bold">
                  {label.marksLabel} : <span className="ml-2">{marks}</span>
                </div>
              </td>

              <td colSpan={2} className="border-r border-black align-top p-1">
                <div className="text-xs font-bold mb-1 whitespace-nowrap">
                  {paymentStatusLabel}
                </div>
                <div className="text-xs font-normal mb-1">
                  {label.labelValueGoods}
                </div>
                <div className="text-sm font-bold">
                  Rs. {formatCurrency(billValueNum)}
                </div>
              </td>
            </tr >

            <tr className="border-t border-black">
              <td colSpan={2} className="border-r border-black p-1 h-10 align-top">
                <span className="font-normal text-xs mr-2">{label.deliveryAtLabel} :</span>
                <span className="font-bold text-sm uppercase">{gc.deliveryAt}</span>
              </td >

              <td colSpan={3} className="p-1 align-top">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-normal whitespace-nowrap">{label.toPayRsLabel}</span>
                  <span className="text-xs font-bold uppercase leading-tight break-words">
                    {numberToWordsInRupees(balanceToPayNum)}
                  </span>
                </div>
              </td >
            </tr >

          </tbody >
        </table >
      </div >

      {/* --- FOOTER --- */}
      < div className="border-x border-b border-black p-3 flex justify-between items-end min-h-[6rem] relative" >

        <div className="flex items-end gap-3 w-1/3">
          <div className="flex flex-col items-center flex-shrink-0">
            <img
              src={qrCodeUrl}
              alt="T&C QR"
              className="w-20 h-20"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wide">
              {label.scanLabel}
            </span>
          </div>

          <div className="text-xs font-bold mb-3 leading-tight">
            <span className="font-normal block text-[10px] text-gray-600 mb-0.5">{label.freightFixedUptoLabel}</span>
            <span className="uppercase">{gc.freightUptoAt}</span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 text-center text-xs leading-tight pointer-events-none whitespace-pre-wrap">
          {label.footerUnloadingNote}
        </div>

        <div className="text-xs mb-1 flex flex-col items-center mr-2 w-1/3 text-right">
          <div className="h-10"></div>
          <span className="font-bold uppercase mb-1">{user?.name || 'Admin'}</span>
          <span className="italic font-bold text-[10px]">{label.footerSignatureLine}</span>
        </div>
      </div >

      <div className="text-center text-[10px] mt-1 whitespace-pre-wrap">
        {label.footerNote}
      </div>

    </div >
  );
};