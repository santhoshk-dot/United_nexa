import React from "react";
import type { GcEntry, Consignor, Consignee } from "../../types";
import { numberToWords, numberToWordsInRupees } from "../../utils/toWords";

const Field = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) => (
  <div className={`py-0.5 ${className}`}>
    <span className="text-xs font-semibold pr-2">{label}</span>
    <span className="text-sm font-bold">{value ?? "---"}</span>
  </div>
);

const AddressBlock = ({
  title,
  name,
  place,
  gst,
  mobile,
  dynamicProof, // <-- This prop is for the consignee
}: {
  title: string;
  name?: string;
  place?: string;
  gst?: string; // This prop is for the consignor
  mobile?: string;
  dynamicProof?: string;
}) => (
  <div className="p-1">
    <div className="text-xs font-semibold">{title}</div>
    <div className="text-sm font-bold mt-1">{name ?? "---"}</div>
    {place && <div className="text-xs">{place}</div>}
    
    {/* This block is for the Consignor, which ALWAYS shows "GSTIN :" */}
    {gst && (
      <div className="flex items-center mt-1">
        <span className="text-xs font-semibold pr-2">GSTIN :</span>
        <span className="text-sm font-bold">{gst}</span>
      </div>
    )}

    {/* This block is for the Consignee, which shows the full proof string */}
    {dynamicProof && (
      <div className="flex items-center mt-1">
        <span className="text-sm font-bold">{dynamicProof}</span>
      </div>
    )}

    {mobile && (
      <div className="flex items-center mt-1">
        <span className="text-xs font-semibold pr-2">Mobile :</span>
        <span className="text-sm font-bold">{mobile}</span>
      </div>
    )}
  </div>
);

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
  
  // Parse all string fields into numbers for calculation
  const quantityNum = parseFloat(gc.quantity) || 0;
  const fromNoNum = parseFloat(gc.fromNo) || 0;
  const billValueNum = parseFloat(gc.billValue) || 0;
  const balanceToPayNum = parseFloat(gc.balanceToPay) || 0; // <-- This is the value we need
  const freightNum = parseFloat(gc.freight) || 0;
  const godownChargeNum = parseFloat(gc.godownCharge) || 0;
  const statisticChargeNum = parseFloat(gc.statisticCharge) || 0;
  const tollFeeNum = parseFloat(gc.tollFee) || 0;

  const totalCharges =
    freightNum + godownChargeNum + statisticChargeNum + tollFeeNum;
  
  const marks = `${gc.prefix} ${fromNoNum} to ${
    (fromNoNum > 0 && quantityNum > 0) ? (fromNoNum + quantityNum - 1) : ''
  }`;
  
  const invoiceNo = gc.billNo ?? "N/A";
  
  // --- THIS IS THE FIX ---
  // Both "Balance To Pay" (number) and "To pay Rs." (words)
  // are now based on the 'balanceToPayNum' from the form.
  const printBalanceToPay = `Rs. ${balanceToPayNum.toLocaleString("en-IN")}`;
  const printToPayWords = numberToWordsInRupees(balanceToPayNum);
  // --- END FIX ---
  
  const description = `${numberToWords(quantityNum)} ${gc.packing} of ${gc.contents}`;
  
  const proofLabel = gc.consigneeProofType === 'gst' 
    ? 'GSTIN' 
    : gc.consigneeProofType.toUpperCase();
    
  const consigneeProofDisplay = `${proofLabel} : ${gc.consigneeProofValue}`;


  return (
    <div
      className="print-page font-sans text-black"
      style={{ fontSize: "10pt", padding: "10mm", boxSizing: "border-box" }}
    >
      <div className="w-full border-2 border-black">
        {/* HEADER */}
        <div className="flex border-b-2 border-black">
          <div className="w-1/4 p-1 border-r-2 border-black">
            <span className="text-sm font-bold">
              {copyType}{" "}
             <div className="mt-1 leading-tight">
                <div className="text-xs font-semibold">GSTIN: 33ABLPV5082H3Z8</div>
                <div className="text-xs font-semibold">Mobile: 9787718433</div>
              </div>
            </span>
          </div>

          <div className="w-1/2 text-center p-1 border-r-2 border-black">
            <div className="text-sm font-bold">UNITED TRANSPORT COMPANY</div>
            <div className="text-xs font-semibold mt-1" style={{ fontSize: '8pt' }}>
              TRANSPORT CONTRACTORS & GOODS, FORWARDERS
            </div>
            <div className="text-xs mt-1" style={{ fontSize: '8pt' }}>
              164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123
            </div>
          </div>

          <div className="w-1/4">
            <div className="flex border-b-2 border-black">
              <span className="w-1/3 p-1 text-xs font-semibold border-r-2 border-black">
                G.C. No.
              </span>
              <span className="w-2/3 p-1 text-sm font-bold">{gc.id}</span>
            </div>

            <div className="flex">
              <span className="w-1/3 p-1 text-xs font-semibold border-r-2 border-black">
                Date :
              </span>
              <span className="w-2/3 p-1 text-sm font-bold">{gc.gcDate}</span>
            </div>
          </div>
        </div>

        {/* FROM / RISK */}
        <div className="flex border-b-2 border-black">
          <div className="w-1/4 p-1 border-r-2 border-black">
            <span className="text-xs font-semibold">FROM</span>
            <span className="text-sm font-bold ml-2">{gc.from}</span>
          </div>

          <div className="w-1/2 text-center p-1 border-r-2 border-black" style={{ fontSize: '8pt' }}>
            <span className="text-xs font-semibold">
              TRANSPORT CONTRACTORS & GOODS, FORWARDERS
            </span>
          </div>

          <div className="w-1/4 p-1">
            <span className="text-xs">AT OWNER'S RISK TO</span>
            <span className="text-sm font-bold ml-2">{gc.destination}</span>
          </div>
        </div>

        {/* CONSIGNOR / CONSIGNEE */}
        <div className="flex border-b-2 border-black" style={{ minHeight: '6rem' }}>
          <div className="w-1/2 border-r-2 border-black p-1">
            <AddressBlock
              title="Consignor :"
              name={consignor.name}
              place={consignor.address}
              gst={consignor.gst}
              mobile={consignor.mobile}
            />
          </div>

          <div className="w-1/2 p-1">
            <AddressBlock
              title="Consignee :"
              name={consignee.name}
              place={consignee.address}
              dynamicProof={consigneeProofDisplay} 
              mobile={consignee.phone}
            />
          </div>
        </div>

        {/* TABLE */}
        <table className="w-full table-fixed border-b-2 border-black">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="w-1/5 text-center border-r-2 border-black p-1 text-xs font-semibold">
                No. of Packages
              </th>
              <th className="w-3/5 text-center border-r-2 border-black p-1 text-xs font-semibold">
                DESCRIPTION (said to Contain - Contents not known)
              </th>
              <th className="w-1/5 text-center p-1 text-xs font-semibold">
                WEIGHT (APPROX)
              </th>
            </tr>
          </thead>

          <tbody>
            <tr className="h-28 align-top">
              <td className="border-r-2 border-black text-center font-bold p-1">
                {gc.quantity}
              </td>
              <td className="border-r-2 border-black font-bold p-1">
                {description}
              </td>
              <td className="text-center font-bold p-1">---</td>
            </tr>
          </tbody>
        </table>

        {/* CHARGES */}
        <div className="flex border-b-2 border-black">
          <div className="w-1/5 border-r-2 border-black p-1">&nbsp;</div>
          <div className="w-3/5 border-r-2 border-black p-1">&nbsp;</div>

          <div className="w-1/5 p-1">
            <div className="flex justify-between">
              <span className="text-xs font-semibold">Freight :</span>
              <span className="text-sm font-bold">{gc.freight}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-semibold">Godown Charge :</span>
              <span className="text-sm font-bold">{gc.godownCharge}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-semibold">Statistical Charge :</span>
              <span className="text-sm font-bold">{gc.statisticCharge}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-semibold">Toll Fee :</span>
              <span className="text-sm font-bold">{gc.tollFee}</span>
            </div>
            <div className="flex justify-between border-t border-black mt-1 pt-1">
              <span className="text-xs font-semibold">Total :</span>
              <span className="text-sm font-bold">{totalCharges}</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex border-b-2 border-black">
          <div className="w-3/4 border-r-2 border-black p-1">
            <div className="flex">
              <Field label="INVOICE No.:" value={invoiceNo} className="w-1/2" />
              <Field label="Dated:" value={gc.billDate} className="w-1/2" />
            </div>

            <div className="flex">
              <Field label="Advance Paid:" value={gc.advanceNone} className="w-1/2" />
              <Field
                label="Value of the goods:"
                value={`Rs. ${billValueNum.toLocaleString("en-IN")}`}
                className="w-1/2"
              />
            </div>

            <Field label="Identification Marks:" value={marks} />
          </div>

          <div className="w-1/4 p-1">
            <span className="text-lg font-bold">
              {gc.paidType?.toUpperCase()}
            </span>
            {/* Data Mapping: "Balance To Pay" field shows "Balance ToPay" */}
            <Field label="Balance To Pay:" value={printBalanceToPay} />
          </div>
        </div>

        {/* LAST LINE */}
        <div className="flex">
          <div className="w-3/4 p-1 border-r-2 border-black">
             {/* Data Mapping: "To pay Rs." field shows "Balance ToPay" in words */}
            <Field label="To pay Rs." value={printToPayWords} />
            <Field label="Delivery at :" value={gc.deliveryAt} />
            <Field label="Freight fixed upto" value={gc.freightUptoAt} />

            <p className="text-xs mt-2">
              Consignment booked subject to the terms & conditions printed overleaf.
            </p>
          </div>

          <div className="w-1/4 p-1 text-right flex flex-col justify-end" style={{minHeight: '6rem'}}>
            <span className="text-xs font-bold">For UNITED TRANSPORT COMPANY</span>
          </div>
        </div>
      </div>
    </div>
  );
};