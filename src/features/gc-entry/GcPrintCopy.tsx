import React from "react";
import type { GcEntry, Consignor, Consignee } from "../../types";
import { numberToWords, numberToWordsInRupees } from "../../utils/toWords";
import { useAuth } from "../../hooks/useAuth"; 
import { useData } from "../../hooks/useData"; 

const formatCurrency = (amount: number | string | undefined) => {
  const num = parseFloat(amount?.toString() || "0");
  return num > 0 ? `${num.toLocaleString("en-IN")}` : "";
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
  const { tripSheets } = useData(); 

  const linkedTripSheetItem = tripSheets
    .flatMap(sheet => sheet.items || [])
    .find(item => item.gcNo === gc.gcNo); 

  const quantityNum = parseFloat(gc.quantity) || 0;
  const fromNoNum = parseFloat(gc.fromNo) || 0;
  const billValueNum = parseFloat(gc.billValue) || 0;
  
  const balanceToPayNum = linkedTripSheetItem 
    ? linkedTripSheetItem.amount 
    : (parseFloat(gc.balanceToPay) || 0);
  
  const freightNum = parseFloat(gc.freight) || 0;
  const godownChargeNum = parseFloat(gc.godownCharge) || 0;
  const statisticChargeNum = parseFloat(gc.statisticCharge) || 0;
  const tollFeeNum = parseFloat(gc.tollFee) || 0;
  
  const totalCharges = freightNum + godownChargeNum + statisticChargeNum + tollFeeNum;
  
  const isPaid = gc.paymentType?.toLowerCase() === 'paid';
  const paymentStatusLabel = isPaid ? "PAID" : "TO PAY";

  const marks = `${gc.prefix} ${fromNoNum} to ${
    (fromNoNum > 0 && quantityNum > 0) ? (fromNoNum + quantityNum - 1) : ''
  }`;

  const description = `${numberToWords(quantityNum)} ${gc.packing} of ${gc.contents}`;

  // --- LOGIC FOR CONSIGNEE PROOF DISPLAY ---
  // Priority: GST (Entry) -> GST (Master) -> PAN (Entry) -> PAN (Master) -> Aadhar (Entry) -> Aadhar (Master)
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
      <div className="flex justify-between items-end mb-2 font-bold text-sm">
        <div className="uppercase text-base">{copyType}</div>
        <div className="flex gap-8">
          <div>GSTIN:33ABLPV5082H3Z8</div>
          <div>Mobile : 9787718433</div>
        </div>
      </div>

      <div className="flex justify-between items-start mb-1">
        <div className="font-bold text-sm leading-relaxed">
          <div className="flex gap-2">
            <span className="w-20">G.C. No.</span>
            <span>{gc.gcNo}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-20">Date :</span>
            <span>{gc.gcDate}</span>
          </div>
        </div>

        <div className="text-right flex-1 ml-4">
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            UNITED TRANSPORT COMPANY
          </h1>
          <div className="font-bold text-sm uppercase">
            TRANSPORT CONTRACTORS & GOODS, FORWARDERS
          </div>
          <div className="font-bold text-xs mt-0.5">
            164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123
          </div>
        </div>
      </div>

      <div className="border border-black flex font-bold text-lg uppercase mb-2">
        <div className="flex-none px-2 py-1 border-r border-black">
          FROM <span className="ml-2">{gc.from}</span>
        </div>
        <div className="flex-1 text-center px-2 py-1 border-r border-black">
          AT OWNER'S RISK
        </div>
        <div className="flex-none px-2 py-1">
          TO <span className="ml-2">{gc.destination}</span>
        </div>
      </div>

      <div className="flex mb-2">
        <div className="w-1/2 pr-2">
          <div className="text-xs mb-1 pl-4">Consignor :</div>
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
          <div className="text-xs mb-1 pl-4">Consignee :</div>
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

      <div className="border border-black mb-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-center text-xs font-normal border-b border-black">
              <th className="border-r border-black w-[10%] py-1 font-normal leading-tight">
                No. of<br />Packages
              </th>
              <th className="border-r border-black w-[45%] py-1 font-normal leading-tight">
                DESCRIPTION<br />(said to Contain - Contents not known)
              </th>
              <th className="border-r border-black w-[10%] py-1 font-normal leading-tight">
                WEIGHT<br />(APPROX)
              </th>
              <th className="border-r border-black w-[10%] py-1 font-normal leading-tight">
                RATE
              </th>
              <th className="w-[25%] py-1 font-normal">
                FREIGHT
              </th>
            </tr>
          </thead>
          
          <tbody className="text-sm font-bold">
            <tr className="align-top h-32">
              <td className="border-r border-black text-center pt-2">{gc.quantity}</td>
              <td className="border-r border-black pl-2 pt-2 uppercase">{description}</td>
              <td className="border-r border-black text-center pt-2"></td>
              <td className="border-r border-black text-center pt-2"></td>
              
              <td rowSpan={2} className="relative align-top p-0">
                <div className="flex flex-col h-full">
                  <div className="flex-1 px-2 pt-2 text-right text-xs leading-loose">
                    <div className="flex justify-between">
                      <span className="font-normal">Freight :</span>
                      <span>{formatCurrency(gc.freight)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-normal">Godown Charge :</span>
                      <span>{formatCurrency(gc.godownCharge)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-normal">Statistical Charge :</span>
                      <span>{formatCurrency(gc.statisticCharge)}</span>
                    </div>
                    {tollFeeNum > 0 && (
                        <div className="flex justify-between">
                        <span className="font-normal">Toll Fee :</span>
                        <span>{formatCurrency(gc.tollFee)}</span>
                        </div>
                    )}
                    <div className="flex justify-between border-t border-black mt-1 pt-1">
                      <span className="font-normal">Total :</span>
                      <span>{formatCurrency(totalCharges)}</span>
                    </div>
                  </div>

                  <div className="mt-auto text-right text-xs px-2 pb-1">
                     <div className="flex justify-between items-center mb-1">
                        <span className="font-normal">Advance Paid :</span>
                        <span className="font-bold">{gc.advanceNone || "NIL"}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="font-normal">Balance To Pay :</span>
                        <span className="font-bold">{formatCurrency(balanceToPayNum)}</span>
                     </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr className="border-t border-black h-16">
              <td colSpan={2} className="border-r border-black align-top p-1">
                 <div className="flex justify-between text-xs font-bold mb-2">
                    <span>INVOICE No.: {gc.billNo}</span>
                    <span>Dated : {gc.billDate}</span>
                 </div>
                 <div className="text-xs font-bold">
                    Identification Marks : <span className="ml-2">{marks}</span>
                 </div>
              </td>

              <td colSpan={2} className="border-r border-black align-top p-1">
                 <div className="text-xs font-bold mb-1 whitespace-nowrap">
                    {paymentStatusLabel}
                 </div>
                 <div className="text-xs font-normal mb-1">
                    Value of the goods
                 </div>
                 <div className="text-sm font-bold">
                    Rs. {formatCurrency(billValueNum)}
                 </div>
              </td>
            </tr>

            <tr className="border-t border-black">
              <td colSpan={2} className="border-r border-black p-1 h-10 align-top">
                 <span className="font-normal text-xs mr-2">Delivery at :</span>
                 <span className="font-bold text-sm uppercase">{gc.deliveryAt}</span>
              </td>
              
              <td colSpan={3} className="p-1 align-top">
                 <div className="flex items-baseline gap-2">
                    <span className="text-xs font-normal whitespace-nowrap">To pay Rs.</span>
                    <span className="text-xs font-bold uppercase leading-tight break-words">
                        {numberToWordsInRupees(balanceToPayNum)}
                    </span>
                 </div>
              </td>
            </tr>
            
          </tbody>
        </table>
      </div>
      
      <div className="border-x border-b border-black p-1 flex justify-between items-end h-16 relative">
         <div className="text-xs font-bold mb-4">
            <span className="font-normal mr-2">Freight fixed upto :</span>
            {gc.freightUptoAt}
         </div>

         <div className="absolute inset-x-0 bottom-4 text-center text-xs leading-tight">
             Unloading charges<br/>payable by party
         </div>

         <div className="text-xs mb-1 flex flex-col items-center mr-2"> 
            <span className="font-bold uppercase mb-1">{user?.name || 'Admin'}</span>
            <span className="italic font-bold">For UNITED TRANSPORT COMPANY</span>
         </div>
      </div>

      <div className="text-center text-[10px] mt-1">
        Consignment booked subject to the terms & conditions printed overleaf.
      </div>

    </div>
  );
};