import React, { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import type {
  Consignor, Consignee, GcEntry, FromPlace, ToPlace, PackingEntry,
  ContentEntry, TripSheetEntry, VehicleEntry, DriverEntry, PrintTemplateData
} from '../types';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastContext';

// --- DEFAULT TEMPLATE SETTINGS (FALLBACK) ---
const defaultPrintSettings: PrintTemplateData = {
  gc: {
    fixedGstinLabel: "GSTIN",
    fixedGstinValue: "33ABLPV5082H3Z8",
    mobileLabel: "Mobile",
    mobileNumberValue: "9787718433",
    gcNoLabel: "G.C. No.",
    dateLabel: "Date",
    companyName: "UNITED TRANSPORT COMPANY",
    tagLine: "TRANSPORT CONTRACTORS & GOODS, FORWARDERS",
    companyAddress: "164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123",
    fromLabel: "FROM",
    toLabel: "TO",
    ownerRiskText: "AT OWNER'S RISK",
    consignorLabel: "Consignor :",
    consigneeLabel: "Consignee :",
    tableHeaderPackages: "No. of Packages",
    tableHeaderDescription: "DESCRIPTION (said to Contain - Contents not known)",
    tableHeaderWeight: "WEIGHT (APPROX)",
    tableHeaderRate: "RATE",
    tableHeaderFreight: "FREIGHT",
    labelFreight: "Freight",
    labelGodownCharge: "Godown Charge",
    labelStatisticalCharge: "Statistical Charge",
    labelTollFee: "Toll Fee",
    labelTotal: "Total",
    labelAdvancePaid: "Advance Paid",
    labelBalanceToPay: "Balance To Pay",
    invoiceNoLabel: "INVOICE No.",
    invoiceDateLabel: "Dated",
    marksLabel: "Identification Marks",
    labelValueGoods: "Value of the goods",
    deliveryAtLabel: "Delivery at",
    toPayRsLabel: "To pay Rs.",
    paymentTypeToPay: "TO PAY",
    scanLabel: "Scan for Terms",
    freightFixedUptoLabel: "Freight fixed upto",
    footerSignatureLine: "For UNITED TRANSPORT COMPANY",
    footerNote: "Consignment booked subject to the terms & conditions printed overleaf.",
    footerUnloadingNote: "Unloading charges payable by party"
  },
  tripSheet: {
    title: "TRIP SHEET",
    fixedGstinLabel: "GSTIN:",
    fixedGstinValue: "33ABLPV5082H3Z8",
    mobileLabel: "Mobile:",
    mobileNumberValue: "9787718433",
    companyName: "UNITED TRANSPORT COMPANY",
    companyAddress: "164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123",
    mfNoLabel: "M.F. No.:",
    carriersLabel: "Carriers:",
    fromLabel: "From:",
    toLabel: "To:",
    dateLabel: "Date:",
    cnNoHeader: "C.N.No.",
    packagesHeader: "No. of Packages",
    contentsHeader: "Contents",
    consignorHeader: "Consignor",
    consigneeHeader: "Consignee",
    toPayHeader: "To Pay",
    footerNote0: "Goods have been loaded in good condition. All Checkpost papers have been handed over to the truck driver.",
    footerNote1: "Goods to be unloaded at",
    footerNote2: "Please pay lorry hire Rs.",
    footerNote3: "on receiving the goods in sound condition.",
    totalPackagesLabel: "TOTAL PACKAGES:",
    lorryHireLabel: "Lorry Hire",
    driverNameLabel: "Driver Name",
    dlNoLabel: "D.L.No.",
    driverMobileLabel: "Driver number",
    ownerNameLabel: "Owner Name",
    ownerMobileLabel: "Owner number",
    lorryNoLabel: "Lorry No.",
    lorryNameLabel: "Lorry Name",
    legalNote: "I have received the goods noted above in good and condition along with the documents. I am responsible for the safe delivery at the destination. All risks and expenses EN ROUTE will be of the driver. Transit risks are covered by driver/owner. Received all the related documents & goods intact. We will not be responsible for the unloading on holidays.",
    signatureDriverLabel: "Signature of the Owner/Driver/Broker",
    signatureClerkLabel: "Signature of the Booking Clerk"
  },
  loadingSheet: {
    companyName: "UNITED TRANSPORT COMPANY",
    mainHeader: "Loading Sheet",
    totalLabel: "Total :",
    companySignatureLine: "For UNITED TRANSPORT COMPANY"
  },
  stockReport: {
    title: "STOCK REPORT",
    companyName: "UNITED TRANSPORT COMPANY",
    companyAddress: "164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123",
    fixedGstinLabel: "GSTIN:",
    fixedGstinValue: "33ABLPV5082H3Z8",
    mobileLabel: "Mobile :",
    mobileNumberValue: "9787718433",
    mainHeader: "Overall Stock Report",
    gcLabel: "GC.No.",
    stockCountLabel: "Stock Qty",
    contentLabel: "Contents",
    consignorLabel: "Consignor",
    consigneeLabel: "Consignee",
    dateLabel: "GC Date",
    totalLabel: "Total :"
  },
  tripReport: {
    title: 'TRIP SHEET REPORT',
    companyName: 'UNITED TRANSPORT COMPANY',
    companyAddress: '164-A, Arumugam Road, Near A.V.T. School, SIVAKASI - 626123',
    fixedGstinLabel: 'GSTIN:',
    fixedGstinValue: '33ABLPV5082H3Z8',
    mobileLabel: 'Mobile :',
    mobileNumberValue: '9787718433',
    mainHeader: 'Overall TripSheet Report',
    tsLabel: 'TS No',
    dateLabel: 'Date',
    fromPlaceLabel: 'From',
    toPlaceLabel: 'To',
    amountLabel: 'Amount',
    totalLabel: 'Total :'
  }
};

interface DataContextType {
  // --- Existing State Arrays ---
  consignors: Consignor[];
  consignees: Consignee[];
  gcEntries: GcEntry[];
  tripSheets: TripSheetEntry[];
  fromPlaces: FromPlace[];
  toPlaces: ToPlace[];
  packingEntries: PackingEntry[];
  contentEntries: ContentEntry[];
  vehicleEntries: VehicleEntry[];
  driverEntries: DriverEntry[];

  // Print Settings State
  printSettings: PrintTemplateData;

  // --- Existing CRUD Actions ---
  addConsignor: (consignor: Consignor) => Promise<void>;
  updateConsignor: (consignor: Consignor) => Promise<void>;
  deleteConsignor: (id: string) => Promise<void>;

  importConsignors: (data: Consignor[]) => Promise<void>;
  importConsignees: (data: Consignee[]) => Promise<void>;
  importFromPlaces: (data: FromPlace[]) => Promise<void>;
  importToPlaces: (data: ToPlace[]) => Promise<void>;
  importPackings: (data: PackingEntry[]) => Promise<void>;
  importContents: (data: ContentEntry[]) => Promise<void>;
  importVehicles: (data: VehicleEntry[]) => Promise<void>;
  importDrivers: (data: DriverEntry[]) => Promise<void>;

  addConsignee: (consignee: Consignee) => Promise<void>;
  updateConsignee: (consignee: Consignee) => Promise<void>;
  deleteConsignee: (id: string) => Promise<void>;
  getNextGcNo: () => Promise<string>;
  fetchGcById: (id: string) => Promise<GcEntry | null>;
  fetchTripSheetById: (id: string) => Promise<TripSheetEntry | null>;
  addGcEntry: (gcEntry: GcEntry) => Promise<any>;
  updateGcEntry: (gcEntry: GcEntry) => Promise<any>;
  deleteGcEntry: (identifier: string) => Promise<void>;
  saveLoadingProgress: (gcId: string, selectedQuantities: number[]) => Promise<void>;
  fetchGcPrintData: (gcNos: string[], selectAll?: boolean, filters?: any) => Promise<any[]>;
  fetchLoadingSheetPrintData: (gcNos: string[], selectAll?: boolean, filters?: any) => Promise<any[]>;
  fetchTripSheetPrintData: (mfNos: string[], selectAll?: boolean, filters?: any) => Promise<TripSheetEntry[]>;
  fetchPendingStockReport: (filters: any) => Promise<any[]>;
  fetchTripSheetReport: (filters: any) => Promise<any[]>;
  fetchGcDetailsForTripSheet: (gcNo: string) => Promise<any>;
  addFromPlace: (fromPlace: FromPlace) => Promise<void>;
  updateFromPlace: (fromPlace: FromPlace) => Promise<void>;
  deleteFromPlace: (id: string) => Promise<void>;
  addToPlace: (toPlace: ToPlace) => Promise<void>;
  updateToPlace: (toPlace: ToPlace) => Promise<void>;
  deleteToPlace: (id: string) => Promise<void>;
  addPackingEntry: (entry: PackingEntry) => Promise<void>;
  updatePackingEntry: (entry: PackingEntry) => Promise<void>;
  deletePackingEntry: (id: string) => Promise<void>;
  addContentEntry: (entry: ContentEntry) => Promise<void>;
  updateContentEntry: (entry: ContentEntry) => Promise<void>;
  deleteContentEntry: (id: string) => Promise<void>;

  addTripSheet: (sheet: TripSheetEntry) => Promise<any>;
  updateTripSheet: (sheet: TripSheetEntry) => Promise<any>;

  deleteTripSheet: (id: string) => Promise<void>;
  addVehicleEntry: (entry: VehicleEntry) => Promise<void>;
  updateVehicleEntry: (entry: VehicleEntry) => Promise<void>;
  deleteVehicleEntry: (id: string) => Promise<void>;
  addDriverEntry: (entry: DriverEntry) => Promise<void>;
  updateDriverEntry: (entry: DriverEntry) => Promise<void>;
  deleteDriverEntry: (id: string) => Promise<void>;
  getUniqueDests: () => { value: string, label: string }[];
  getPackingTypes: () => { value: string, label: string }[];
  getContentsTypes: () => { value: string, label: string }[];

  // --- Individual Fetchers ---
  fetchConsignors: () => Promise<void>;
  fetchConsignees: () => Promise<void>;
  fetchFromPlaces: () => Promise<void>;
  fetchToPlaces: () => Promise<void>;
  fetchPackingEntries: () => Promise<void>;
  fetchContentEntries: () => Promise<void>;
  fetchVehicleEntries: () => Promise<void>;
  fetchDriverEntries: () => Promise<void>;

  // Template Fetcher & Updater
  fetchPrintSettings: () => Promise<void>;
  updatePrintSettings: (settings: PrintTemplateData) => Promise<void>;

  refreshData: () => Promise<void>;

  // --- Search Functions ---
  searchConsignors: (search: string, page: number) => Promise<any>;
  searchConsignees: (search: string, page: number) => Promise<any>;
  searchVehicles: (search: string, page: number) => Promise<any>;
  searchDrivers: (search: string, page: number) => Promise<any>;
  searchFromPlaces: (search: string, page: number) => Promise<any>;
  searchToPlaces: (search: string, page: number) => Promise<any>;
  searchPackings: (search: string, page: number) => Promise<any>;
  searchContents: (search: string, page: number) => Promise<any>;
}

export const useDataContext = () => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

export const useGcContext = () => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error('useGcContext must be used within a DataProvider');
  }
  return context;
};

export const useStockContext = () => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error('useStockContext must be used within a DataProvider');
  }
  return context;
};

export const useReportContext = () => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error('useReportContext must be used within a DataProvider');
  }
  return context;
};

export const useTripPrintContext = () => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error('useTripPrintContext must be used within a DataProvider');
  }
  return context;
};

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [fromPlaces, setFromPlaces] = useState<FromPlace[]>([]);
  const [toPlaces, setToPlaces] = useState<ToPlace[]>([]);
  const [packingEntries, setPackingEntries] = useState<PackingEntry[]>([]);
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>([]);
  const [vehicleEntries, setVehicleEntries] = useState<VehicleEntry[]>([]);
  const [driverEntries, setDriverEntries] = useState<DriverEntry[]>([]);

  // Print Settings State
  const [printSettings, setPrintSettings] = useState<PrintTemplateData>(defaultPrintSettings);



  const handleError = (error: any, defaultMsg: string) => {
    const msg = error.response?.data?.message || defaultMsg;
    toast.error(msg);
  };

  const fetchConsignors = useCallback(async () => {
    try { const { data } = await api.get('/master/consignors'); setConsignors(data); } catch (e) { console.error(e); }
  }, []);
  const fetchConsignees = useCallback(async () => {
    try { const { data } = await api.get('/master/consignees'); setConsignees(data); } catch (e) { console.error(e); }
  }, []);
  const fetchFromPlaces = useCallback(async () => {
    try { const { data } = await api.get('/master/from-places'); setFromPlaces(data); } catch (e) { console.error(e); }
  }, []);
  const fetchToPlaces = useCallback(async () => {
    try { const { data } = await api.get('/master/to-places'); setToPlaces(data); } catch (e) { console.error(e); }
  }, []);
  const fetchPackingEntries = useCallback(async () => {
    try { const { data } = await api.get('/master/packings'); setPackingEntries(data); } catch (e) { console.error(e); }
  }, []);
  const fetchContentEntries = useCallback(async () => {
    try { const { data } = await api.get('/master/contents'); setContentEntries(data); } catch (e) { console.error(e); }
  }, []);
  const fetchVehicleEntries = useCallback(async () => {
    try { const { data } = await api.get('/master/vehicles'); setVehicleEntries(data); } catch (e) { console.error(e); }
  }, []);
  const fetchDriverEntries = useCallback(async () => {
    try { const { data } = await api.get('/master/drivers'); setDriverEntries(data); } catch (e) { console.error(e); }
  }, []);

  // NEW: Fetch Print Settings
  const fetchPrintSettings = useCallback(async () => {
    try {
      // 🟢 Add a timestamp to the request to bypass browser caching if necessary
      const { data } = await api.get(`/master/templates?_=${new Date().getTime()}`);

      // Merge with defaults to ensure all fields exist even if DB is partial
      setPrintSettings(prev => ({
        ...prev,
        gc: { ...prev.gc, ...data.gc },
        tripSheet: { ...prev.tripSheet, ...data.tripSheet },
        loadingSheet: { ...prev.loadingSheet, ...data.loadingSheet },
        stockReport: { ...prev.stockReport, ...data.stockReport },
        tripReport: { ...prev.tripReport, ...data.tripReport },
      }));
    } catch (e) {
      console.error("Failed to fetch print settings, using defaults.", e);
    }
  }, []);

  // NEW: Update Print Settings
  const updatePrintSettings = async (settings: PrintTemplateData) => {
    try {
      const { data } = await api.put('/master/templates', settings);
      setPrintSettings(data);
      toast.success("Print settings updated successfully");
    } catch (e) {
      handleError(e, "Failed to update print settings");
    }
  };

  const fetchAllData = useCallback(async () => {
    if (!user) return;

    // We execute these in parallel for speed
    await Promise.all([

      fetchPrintSettings() // 🟢 This fetches the latest labels from DB
    ]);
  }, [user, fetchConsignors, fetchConsignees, fetchFromPlaces, fetchToPlaces, fetchPackingEntries, fetchContentEntries, fetchVehicleEntries, fetchDriverEntries, fetchPrintSettings]);

  // 🟢🟢 FIX: The missing trigger! This ensures fetchAllData runs on login/load. 🟢🟢
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  // --- Search Functions ---
  const searchConsignors = async (search: string, page: number) => {
    try {
      const { data } = await api.get('/master/consignors', { params: { search, page }, skipLoader: true } as any);
      return data;
    } catch (e) { return { data: [], hasMore: false }; }
  };

  const searchConsignees = async (search: string, page: number) => {
    try {
      const { data } = await api.get('/master/consignees', { params: { search, page }, skipLoader: true } as any);
      return data;
    } catch (e) { return { data: [], hasMore: false }; }
  };

  const searchVehicles = async (search: string, page: number) => {
    try {
      const { data } = await api.get('/master/vehicles', { params: { search, page }, skipLoader: true } as any);
      return data;
    } catch (e) { return { data: [], hasMore: false }; }
  };

  const searchDrivers = async (search: string, page: number) => {
    try {
      const { data } = await api.get('/master/drivers', { params: { search, page }, skipLoader: true } as any);
      return data;
    } catch (e) { return { data: [], hasMore: false }; }
  };

  const searchFromPlaces = async (search: string, page: number) => {
    try {
      const { data } = await api.get('/master/from-places', { params: { search, page }, skipLoader: true } as any);
      return data;
    } catch (e) { return { data: [], hasMore: false }; }
  };

  const searchToPlaces = async (search: string, page: number) => {
    try {
      const { data } = await api.get('/master/to-places', { params: { search, page }, skipLoader: true } as any);
      return data;
    } catch (e) { return { data: [], hasMore: false }; }
  };

  const searchPackings = async (search: string, page: number) => {
    try {
      const { data } = await api.get('/master/packings', { params: { search, page }, skipLoader: true } as any);
      return data;
    } catch (e) { return { data: [], hasMore: false }; }
  };

  const searchContents = async (search: string, page: number) => {
    try {
      const { data } = await api.get('/master/contents', { params: { search, page }, skipLoader: true } as any);
      return data;
    } catch (e) { return { data: [], hasMore: false }; }
  };

  // GC Actions (Real API calls)
  const getNextGcNo = async () => {
    try { const { data } = await api.get('/operations/gc/next-no'); return data.nextGcNo; } catch (e) { return "Error"; }
  };

  const fetchGcById = async (id: string) => {
    try { const { data } = await api.get(`/operations/gc/${id}`); return data; } catch (e) { return null; }
  };

  const fetchGcDetailsForTripSheet = async (gcNo: string) => {
    try { const { data } = await api.get(`/operations/gc/details/${gcNo}`); return data; }
    catch (e: any) { toast.error(e.response?.data?.message || "Error fetching GC details"); return null; }
  };

  const fetchGcPrintData = async (gcNos: string[], selectAll?: boolean, filters?: any) => {
    try { const { data } = await api.post('/operations/gc/print-data', { gcNos, selectAll, filters }); return data; } catch (e) { handleError(e, "Error fetching bulk print data"); return []; }
  };

  const fetchLoadingSheetPrintData = async (gcNos: string[], selectAll?: boolean, filters?: any) => {
    try { const { data } = await api.post('/operations/loading-sheet/print-data', { gcNos, selectAll, filters }); return data; } catch (e) { handleError(e, "Error fetching loading sheet print data"); return []; }
  };

  const fetchTripSheetPrintData = async (mfNos: string[], selectAll?: boolean, filters?: any) => {
    try { const { data } = await api.post('/operations/tripsheet/print-data', { mfNos, selectAll, filters }); return data; } catch (e) { handleError(e, "Error fetching trip sheet print data"); return []; }
  };

  const fetchPendingStockReport = async (filters: any) => {
    try { const { data } = await api.get('/operations/pending-stock/report', { params: filters }); return data; } catch (e) { handleError(e, "Error fetching report"); return []; }
  };

  const fetchTripSheetReport = async (filters: any) => {
    try { const { data } = await api.get('/operations/tripsheet/report', { params: filters }); return data; } catch (e) { handleError(e, "Error fetching report"); return []; }
  };

  const addGcEntry = async (data: GcEntry) => {
    try { const response = await api.post('/operations/gc', data); toast.success("GC Entry created successfully"); return response.data; }
    catch (e) { handleError(e, "Failed to create GC"); }
  };

  const updateGcEntry = async (data: GcEntry) => {
    try { const response = await api.put(`/operations/gc/${data.gcNo}`, data); toast.success("GC Entry updated successfully"); return response.data; }
    catch (e) { handleError(e, "Failed to update GC"); }
  };

  const deleteGcEntry = async (identifier: string) => {
    try { await api.delete(`/operations/gc/${identifier}`); toast.success("GC Entry deleted successfully"); }
    catch (e) { handleError(e, "Failed to delete GC"); }
  };

  const saveLoadingProgress = async (gcId: string, selectedQuantities: number[]) => {
    try { await api.put('/operations/loading/save', { gcId, selectedQuantities }); toast.success("Loading progress saved"); }
    catch (e) { handleError(e, "Failed to save loading progress"); }
  };

  const fetchTripSheetById = async (id: string) => {
    try { const { data } = await api.get(`/operations/tripsheet/${id}`); return data; } catch (e) { return null; }
  };

  const addTripSheet = async (data: TripSheetEntry) => {
    try {
      const response = await api.post('/operations/tripsheet', data);
      toast.success("Trip Sheet created successfully");
      return response.data;
    } catch (e) { handleError(e, "Failed to create Trip Sheet"); }
  };

  const updateTripSheet = async (data: TripSheetEntry) => {
    try {
      const response = await api.put(`/operations/tripsheet/${data.mfNo}`, data);
      toast.success("Trip Sheet updated successfully");
      return response.data;
    } catch (e) { handleError(e, "Failed to update Trip Sheet"); }
  };

  const deleteTripSheet = async (id: string) => {
    try { await api.delete(`/operations/tripsheet/${id}`); toast.success("Trip Sheet deleted successfully"); } catch (e) { handleError(e, "Failed to delete Trip Sheet"); }
  };

  // BULK IMPORT FUNCTIONS
  const importConsignors = async (data: Consignor[]) => {
    try { await api.post('/master/consignors/bulk', data); toast.success(`${data.length} Consignors imported successfully`); fetchConsignors(); } catch (e) { handleError(e, "Import failed"); }
  };
  const importConsignees = async (data: Consignee[]) => {
    try { await api.post('/master/consignees/bulk', data); toast.success(`${data.length} Consignees imported successfully`); fetchConsignees(); } catch (e) { handleError(e, "Import failed"); }
  };
  const importFromPlaces = async (data: FromPlace[]) => {
    try { await api.post('/master/from-places/bulk', data); toast.success(`${data.length} From Places imported successfully`); fetchFromPlaces(); } catch (e) { handleError(e, "Import failed"); }
  };
  const importToPlaces = async (data: ToPlace[]) => {
    try { await api.post('/master/to-places/bulk', data); toast.success(`${data.length} To Places imported successfully`); fetchToPlaces(); } catch (e) { handleError(e, "Import failed"); }
  };
  const importPackings = async (data: PackingEntry[]) => {
    try { await api.post('/master/packings/bulk', data); toast.success(`${data.length} Packings imported successfully`); fetchPackingEntries(); } catch (e) { handleError(e, "Import failed"); }
  };
  const importContents = async (data: ContentEntry[]) => {
    try { await api.post('/master/contents/bulk', data); toast.success(`${data.length} Contents imported successfully`); fetchContentEntries(); } catch (e) { handleError(e, "Import failed"); }
  };
  const importVehicles = async (data: VehicleEntry[]) => {
    try { await api.post('/master/vehicles/bulk', data); toast.success(`${data.length} Vehicles imported successfully`); fetchVehicleEntries(); } catch (e) { handleError(e, "Import failed"); }
  };
  const importDrivers = async (data: DriverEntry[]) => {
    try { await api.post('/master/drivers/bulk', data); toast.success(`${data.length} Drivers imported successfully`); fetchDriverEntries(); } catch (e) { handleError(e, "Import failed"); }
  };

  // Masters Actions (Standard)
  const addConsignor = async (d: Consignor) => { try { const res = await api.post('/master/consignors', d); setConsignors(p => [res.data, ...p]); toast.success("Consignor added"); } catch (e) { handleError(e, "Failed to add consignor"); } };
  const updateConsignor = async (d: Consignor) => { try { const res = await api.put(`/master/consignors/${d.id}`, d); setConsignors(p => p.map(i => i.id === d.id ? res.data : i)); toast.success("Consignor updated"); } catch (e) { handleError(e, "Failed to update consignor"); } };
  const deleteConsignor = async (id: string) => { try { await api.delete(`/master/consignors/${id}`); setConsignors(p => p.filter(i => i.id !== id)); toast.success("Consignor deleted"); } catch (e) { handleError(e, "Failed to delete consignor"); } };

  const addConsignee = async (d: Consignee) => { try { const res = await api.post('/master/consignees', d); setConsignees(p => [res.data, ...p]); toast.success("Consignee added"); } catch (e) { handleError(e, "Failed to add consignee"); } };
  const updateConsignee = async (d: Consignee) => { try { const res = await api.put(`/master/consignees/${d.id}`, d); setConsignees(p => p.map(i => i.id === d.id ? res.data : i)); toast.success("Consignee updated"); } catch (e) { handleError(e, "Failed to update consignee"); } };
  const deleteConsignee = async (id: string) => { try { await api.delete(`/master/consignees/${id}`); setConsignees(p => p.filter(i => i.id !== id)); toast.success("Consignee deleted"); } catch (e) { handleError(e, "Failed to delete consignee"); } };

  const addFromPlace = async (d: FromPlace) => { try { const res = await api.post('/master/from-places', d); setFromPlaces(p => [res.data, ...p]); toast.success("From Place added"); } catch (e) { handleError(e, "Failed to add"); } };
  const updateFromPlace = async (d: FromPlace) => { try { const res = await api.put(`/master/from-places/${d.id}`, d); setFromPlaces(p => p.map(i => i.id === d.id ? res.data : i)); toast.success("From Place updated"); } catch (e) { handleError(e, "Failed to update"); } };
  const deleteFromPlace = async (id: string) => { try { await api.delete(`/master/from-places/${id}`); setFromPlaces(p => p.filter(i => i.id !== id)); toast.success("From Place deleted"); } catch (e) { handleError(e, "Failed to delete"); } };

  const addToPlace = async (d: ToPlace) => { try { const res = await api.post('/master/to-places', d); setToPlaces(p => [res.data, ...p]); toast.success("To Place added"); } catch (e) { handleError(e, "Failed to add"); } };
  const updateToPlace = async (d: ToPlace) => { try { const res = await api.put(`/master/to-places/${d.id}`, d); setToPlaces(p => p.map(i => i.id === d.id ? res.data : i)); toast.success("To Place updated"); } catch (e) { handleError(e, "Failed to update"); } };
  const deleteToPlace = async (id: string) => { try { await api.delete(`/master/to-places/${id}`); setToPlaces(p => p.filter(i => i.id !== id)); toast.success("To Place deleted"); } catch (e) { handleError(e, "Failed to delete"); } };

  const addPackingEntry = async (d: PackingEntry) => { try { const res = await api.post('/master/packings', d); setPackingEntries(p => [res.data, ...p]); toast.success("Packing added"); } catch (e) { handleError(e, "Failed to add"); } };
  const updatePackingEntry = async (d: PackingEntry) => { try { const res = await api.put(`/master/packings/${d.id}`, d); setPackingEntries(p => p.map(i => i.id === d.id ? res.data : i)); toast.success("Packing updated"); } catch (e) { handleError(e, "Failed to update"); } };
  const deletePackingEntry = async (id: string) => { try { await api.delete(`/master/packings/${id}`); setPackingEntries(p => p.filter(i => i.id !== id)); toast.success("Packing deleted"); } catch (e) { handleError(e, "Failed to delete"); } };

  const addContentEntry = async (d: ContentEntry) => { try { const res = await api.post('/master/contents', d); setContentEntries(p => [res.data, ...p]); toast.success("Content added"); } catch (e) { handleError(e, "Failed to add"); } };
  const updateContentEntry = async (d: ContentEntry) => { try { const res = await api.put(`/master/contents/${d.id}`, d); setContentEntries(p => p.map(i => i.id === d.id ? res.data : i)); toast.success("Content updated"); } catch (e) { handleError(e, "Failed to update"); } };
  const deleteContentEntry = async (id: string) => { try { await api.delete(`/master/contents/${id}`); setContentEntries(p => p.filter(i => i.id !== id)); toast.success("Content deleted"); } catch (e) { handleError(e, "Failed to delete"); } };

  const addVehicleEntry = async (d: VehicleEntry) => { try { const res = await api.post('/master/vehicles', d); setVehicleEntries(p => [res.data, ...p]); toast.success("Vehicle added"); } catch (e) { handleError(e, "Failed to add"); } };
  const updateVehicleEntry = async (d: VehicleEntry) => { try { const res = await api.put(`/master/vehicles/${d.id}`, d); setVehicleEntries(p => p.map(i => i.id === d.id ? res.data : i)); toast.success("Vehicle updated"); } catch (e) { handleError(e, "Failed to update"); } };
  const deleteVehicleEntry = async (id: string) => { try { await api.delete(`/master/vehicles/${id}`); setVehicleEntries(p => p.filter(i => i.id !== id)); toast.success("Vehicle deleted"); } catch (e) { handleError(e, "Failed to delete"); } };

  const addDriverEntry = async (d: DriverEntry) => { try { const res = await api.post('/master/drivers', d); setDriverEntries(p => [res.data, ...p]); toast.success("Driver added"); } catch (e) { handleError(e, "Failed to add"); } };
  const updateDriverEntry = async (d: DriverEntry) => { try { const res = await api.put(`/master/drivers/${d.id}`, d); setDriverEntries(p => p.map(i => i.id === d.id ? res.data : i)); toast.success("Driver updated"); } catch (e) { handleError(e, "Failed to update"); } };
  const deleteDriverEntry = async (id: string) => { try { await api.delete(`/master/drivers/${id}`); setDriverEntries(p => p.filter(i => i.id !== id)); toast.success("Driver deleted"); } catch (e) { handleError(e, "Failed to delete"); } };

  const getUniqueDests = useCallback(() => {
    const dests = new Set([...toPlaces.map(tp => tp.placeName), ...consignees.map(c => c.destination)]);
    return Array.from(dests).map(d => ({ value: d, label: d }));
  }, [toPlaces, consignees]);

  const getPackingTypes = useCallback(() => packingEntries.map(p => ({ value: p.packingName, label: p.packingName })), [packingEntries]);
  const getContentsTypes = useCallback(() => contentEntries.map(c => ({ value: c.contentName, label: c.contentName })), [contentEntries]);

  const value = useMemo(() => ({
    consignors, consignees, gcEntries: [], tripSheets: [], fromPlaces, toPlaces, packingEntries, contentEntries, vehicleEntries, driverEntries,
    // EXPORT NEW STATE & FUNCTIONS
    printSettings, fetchPrintSettings, updatePrintSettings,

    addConsignor, updateConsignor, deleteConsignor, addConsignee, updateConsignee, deleteConsignee,
    getNextGcNo, fetchGcById, fetchTripSheetById, addGcEntry, updateGcEntry, deleteGcEntry, saveLoadingProgress,
    fetchGcPrintData, fetchLoadingSheetPrintData, fetchTripSheetPrintData, fetchPendingStockReport, fetchTripSheetReport, fetchGcDetailsForTripSheet,
    addFromPlace, updateFromPlace, deleteFromPlace, addToPlace, updateToPlace, deleteToPlace,
    addPackingEntry, updatePackingEntry, deletePackingEntry, addContentEntry, updateContentEntry, deleteContentEntry,
    addTripSheet, updateTripSheet, deleteTripSheet, addVehicleEntry, updateVehicleEntry, deleteVehicleEntry,
    addDriverEntry, updateDriverEntry, deleteDriverEntry, getUniqueDests, getPackingTypes, getContentsTypes,
    refreshData: fetchAllData,
    fetchConsignors, fetchConsignees, fetchFromPlaces, fetchToPlaces, fetchPackingEntries, fetchContentEntries, fetchVehicleEntries, fetchDriverEntries,
    searchConsignors, searchConsignees, searchVehicles, searchDrivers, searchFromPlaces, searchToPlaces, searchPackings, searchContents,
    importConsignors, importConsignees, importFromPlaces, importToPlaces, importPackings, importContents, importVehicles, importDrivers
  }), [consignors, consignees, fromPlaces, toPlaces, packingEntries, contentEntries, vehicleEntries, driverEntries, printSettings, fetchAllData, fetchConsignors, fetchConsignees, fetchFromPlaces, fetchToPlaces, fetchPackingEntries, fetchContentEntries, fetchVehicleEntries, fetchDriverEntries, fetchPrintSettings]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};