
// --- User Interface ---
export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string; 
  mobile: string;
  role: 'admin' | 'user';
}

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
  date: string;
  invoiceDate: string;
  invoiceNo: string;
  pkgDesc: string;
  marks: any;
  gcNo: string; // CHANGED from ReactNode to string
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

// --- NEW TYPES FOR MASTER MODULES ---

export interface PackingEntry {
  id: string;
  packingName: string;
  shortName: string;
}

export interface ContentEntry {
  id: string;
  contentName: string;
  shortName: string;
}

// --- NEW TYPES FOR VEHICLES & DRIVERS ---

export interface VehicleEntry {
  id: string;
  vehicleNo: string;
  vehicleName: string;
  ownerName?: string;
  ownerMobile?: string;

}

export interface DriverEntry {
  id: string;
  driverName: string;
  dlNo: string;
  mobile: string;
}

// --- NEW TYPES FOR TRIP SHEET ---

export interface TripSheetGCItem {
  gcNo: string;
  qty: number;
  rate: number;
  qtyDts?: string;
  packingDts?: string;
  contentDts?: string;
  consignor?: string;
  consignee?: string;
  amount: number;
}

export interface TripSheetEntry {
  id: string;
  mfNo: string;
  tsDate: string;
  carriers?: string;
  fromPlace: string;
  toPlace: string;
  items: TripSheetGCItem[];
  unloadPlace?: string;
  totalAmount: number;
  driverName?: string;
  dlNo?: string;
  driverMobile?: string;
  ownerName?: string;
  ownerMobile?: string;
  lorryNo?: string;
  lorryName?: string;
  consignorid?: string; 
  consigneeid?: string;
}