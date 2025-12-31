export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: 'admin' | 'user';
  createdBy?: string;
  updatedBy?: string;
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
  address?: string;
  createdBy?: string;
  updatedBy?: string;
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
  createdBy?: string;
  updatedBy?: string;
}

export interface GcContentItem {
  id: string;
  qty: number | string;
  packing: string;
  contents: string;
  prefix: string;
  fromNo: number | string;
}

export interface GcEntry {
  // Optional legacy fields
  date?: string;
  invoiceDate?: string;
  invoiceNo?: string;
  pkgDesc?: string;
  marks?: any;

  // Added to fix LoadingSheetEntry errors
  quantity?: number | string;
  packing?: string;
  contents?: string;
  fromNo?: number | string;

  gcNo: string;
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
  billValue: number;
  tollFee: number;
  freight: number;
  godownCharge: number;
  statisticCharge: number;
  advanceNone: number;
  balanceToPay: number;
  netQty: number;
  totalQty: number;

  // New repeater field for multiple content items
  contentItems?: GcContentItem[];

  paymentType: 'To Pay' | 'Paid';

  // Trip Sheet & Loading Fields
  tripSheetId?: string | null;
  isLoaded?: boolean;
  loadingStatus?: 'Pending' | 'Partially Loaded' | 'Loaded';

  loadedPackages?: number[];

  // Audit Fields
  createdBy?: string;
  updatedBy?: string;
}

export interface FromPlace {
  id: string;
  placeName: string;
  shortName: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ToPlace {
  id: string;
  placeName: string;
  shortName: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PackingEntry {
  id: string;
  packingName: string;
  shortName: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ContentEntry {
  id: string;
  contentName: string;
  shortName: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface VehicleEntry {
  id: string;
  vehicleNo: string;
  vehicleName: string;
  ownerName?: string;
  ownerMobile?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface DriverEntry {
  id: string;
  driverName: string;
  dlNo: string;
  mobile: string;
  createdBy?: string;
  updatedBy?: string;
}

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
  createdBy?: string;
  updatedBy?: string;
}

export type LoadingSheetLabels = {
  companyName: string;
  mainHeader: string;
  totalLabel: string;
  companySignatureLine: string;
};


export type GcEntryLabels = {
  fixedGstinLabel: string,
  fixedGstinValue: string,
  mobileLabel: string,
  mobileNumberValue: string,
  gcNoLabel: string,
  dateLabel: string,
  companyName: string,
  tagLine: string,
  companyAddress: string,
  fromLabel: string,
  toLabel: string,
  ownerRiskText: string,
  consignorLabel: string,
  consigneeLabel: string,
  tableHeaderPackages: string,
  tableHeaderDescription: string,
  tableHeaderWeight: string,
  paymentTypeToPay: string
  tableHeaderRate: string,
  tableHeaderFreight: string,
  labelFreight: string,
  labelGodownCharge: string,
  labelStatisticalCharge: string,
  labelTollFee: string,
  labelTotal: string,
  labelAdvancePaid: string,
  labelBalanceToPay: string,
  invoiceNoLabel: string,
  invoiceDateLabel: string,
  marksLabel: string,
  labelValueGoods: string,
  deliveryAtLabel: string,
  toPayRsLabel: string,
  scanLabel: string,
  freightFixedUptoLabel: string,
  footerSignatureLine: string,
  footerNote: string,
  footerUnloadingNote: string,
}


export type StockLabels = {
  title: string,
  companyName: string,
  companyAddress: string,
  fixedGstinLabel: string,
  fixedGstinValue: string,
  mobileLabel: string,
  mobileNumberValue: string,
  mainHeader: string,
  gcLabel: string,
  stockCountLabel: string,
  contentLabel: string,
  consignorLabel: string,
  consigneeLabel: string,
  dateLabel: string,
  totalLabel: string,
};

export type TripReportLabels = {
  title: string,
  companyName: string,
  companyAddress: string,
  fixedGstinLabel: string,
  fixedGstinValue: string,
  mobileLabel: string,
  mobileNumberValue: string,
  mainHeader: string,
  tsLabel: string,
  fromPlaceLabel: string,
  toPlaceLabel: string,
  amountLabel: string,
  dateLabel: string,
  totalLabel: string,
};

export type TripPrintLabels = {
  // Header/Company Details
  title: string;
  fixedGstinLabel: string;
  fixedGstinValue: string;
  mobileLabel: string;
  mobileNumberValue: string;
  companyName: string;
  companyAddress: string;

  // Meta Details
  mfNoLabel: string;
  carriersLabel: string;

  // Trip Details
  fromLabel: string;
  toLabel: string;
  dateLabel: string;

  // Table Headers
  cnNoHeader: string;
  packagesHeader: string;
  contentsHeader: string;
  consignorHeader: string;
  consigneeHeader: string;
  toPayHeader: string;

  // Footer Text
  footerNote0: string;
  footerNote1: string;
  footerNote2: string; // The "Please pay lorry hire..." part
  footerNote3: string; // The "on receiving the goods..." part
  totalPackagesLabel: string;
  lorryHireLabel: string;

  // Driver/Owner/Lorry Details Labels
  driverNameLabel: string;
  dlNoLabel: string;
  driverMobileLabel: string;
  ownerNameLabel: string;
  ownerMobileLabel: string;
  lorryNoLabel: string;
  lorryNameLabel: string;

  // Legal/Signatures
  legalNote: string;
  signatureDriverLabel: string;
  signatureClerkLabel: string;
};

// Aggregated Interface for all templates
export interface PrintTemplateData {
  gc: GcEntryLabels;
  tripSheet: TripPrintLabels;
  loadingSheet: LoadingSheetLabels;
  stockReport: StockLabels;
  tripReport: TripReportLabels;
  updatedBy?: string;
}

// 🟢 NEW: History Log Interface
export interface HistoryLog {
  _id: string;
  collectionName: string;
  documentId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changedBy: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  snapshot?: any;
  timestamp: string;
}
export type GcFilter = {
  search?: string;
  filterType?: string;
  startDate?: string;
  endDate?: string;
  customStart?: string;
  customEnd?: string;
  destination?: string;
  consignor?: string;
  consignee?: string[];
};

export type ExclusionFilterState = {
  isActive: boolean;
  filterKey?: string;
};
 
export type SelectAllSnapshot = {
  active: boolean;
  total: number;
  filters: GcFilter;
};

export type LoadingSheetFilter = {
  search?: string;
  filterType?: string;
  startDate?: string;
  endDate?: string;
  customStart?: string;
  customEnd?: string;
  destination?: string;
  consignor?: string;
  consignee?: string[];
  godown?: string;
  pending?: string;
};
export type SelectAllSnapshotLS = {
  active: boolean;
  total: number;
  filters: LoadingSheetFilter;
};
export type PendingStockFilter = {
  search?: string;
  filterType?: string;
  startDate?: string;
  endDate?: string;
  customStart?: string;
  customEnd?: string;
  destination?: string;
  consignor?: string;
  consignee?: string[];
};

export type TripSheetFilter = {
  search?: string;
  filterType?: string;
  startDate?: string;
  endDate?: string;
  customStart?: string;
  customEnd?: string;
  toPlace?: string;
  consignor?: string;
  consignee?: string[];
  excludeIds?: string[];
};



