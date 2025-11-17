import type { ReactNode } from "react";

export interface Consignor {
  id: string;
  name: string;
  from: string; // This is used for the GC Form
  filingDate: string; // ISO date string (e.g., "2025-11-12")
  gst: string;
  pan?: string;
  aadhar?: string;
  mobile?: string;
  address: string;
}

export interface Consignee {
  id: string;
  consignorId?: string; // To link to a consignor (now optional)
  name: string;
  
  // --- THIS IS THE FIX ---
  // The 'proof' object is removed
  // We now use optional, separate fields for each proof
  gst?: string;
  pan?: string;
  aadhar?: string;
  // --- END FIX ---

  filingDate: string; // ISO date string
  address: string;
  phone: string;
  destination: string;
  mobile?: string; // Added this property as it was in GcPrintCopy
}

// --- THIS IS THE FIX ---
// This interface holds all the data for a single GC Entry
// - `godown` field added
// - All number fields changed to `string`
export interface GcEntry {
  gcNo: ReactNode;
  id: string; // This will be the GC No
  gcDate: string; // ISO date string
  from: string;
  destination: string;

  consignorId: string;
  consigneeId: string;

  // Stores which proof was selected *for this specific GC*
  consigneeProofType: 'gst' | 'pan' | 'aadhar';
  consigneeProofValue: string;

  // Editable location fields
  billDate: string; // ISO date string
  deliveryAt: string;
  freightUptoAt: string;
  godown: string; // <-- NEW FIELD

  // Billing & Charges
  billNo: string;
  billValue: string;
  tollFee: string;
  freight: string;
  godownCharge: string;
  statisticCharge: string;
  advanceNone: string;
  balanceToPay: string;

  // Quantity & Contents
  quantity: string;
  packing: string; // e.g., "BOXES"
  contents: string; // e.g., "FW"
  prefix: string; // e.g., "Case No."
  fromNo: string;
  // toNo is calculated: (fromNo + quantity) - 1
  netQty: string;

  // Payment Type
  paidType: 'To Pay' | 'Paid';
}

export interface FromPlace {
    id: string;
    placeName: string;
    shortName: string;
}

export interface ToPlace {
    id: string;
    placeName: string;
    shortName: string;
}