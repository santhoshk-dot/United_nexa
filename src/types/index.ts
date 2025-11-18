import type { ReactNode } from "react";

// --- NEW: User Interface ---
export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string; 
  mobile: string;
  role: 'admin' | 'user';
}
// --- END NEW ---

export interface Consignor {
  id: string;
  name: string;
  from: string;
  filingDate: string;
  gst: string;
  pan?: string;
  aadhar?: string;
  mobile?: string;
  address: string;
}

export interface Consignee {
  id: string;
  consignorId?: string;
  name: string;
  
  gst?: string;
  pan?: string;
  aadhar?: string;

  filingDate: string;
  address: string;
  phone: string;
  destination: string;
  mobile?: string;
}

export interface GcEntry {
  gcNo: ReactNode;
  id: string;
  gcDate: string;
  from: string;
  destination: string;

  consignorId: string;
  consigneeId: string;

  consigneeProofType: 'gst' | 'pan' | 'aadhar';
  consigneeProofValue: string;

  billDate: string;
  deliveryAt: string;
  freightUptoAt: string;
  godown: string;

  billNo: string;
  billValue: string;
  tollFee: string;
  freight: string;
  godownCharge: string;
  statisticCharge: string;
  advanceNone: string;
  balanceToPay: string;

  quantity: string;
  packing: string;
  contents: string;
  prefix: string;
  fromNo: string;
  netQty: string;

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