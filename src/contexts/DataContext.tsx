import React, { createContext, useState, useMemo, useEffect } from 'react';
import type { 
  Consignor, 
  Consignee, 
  GcEntry, 
  FromPlace, 
  ToPlace,
  PackingEntry,
  ContentEntry,
  TripSheetEntry,
  VehicleEntry,
  DriverEntry
} from '../types';
import { getTodayDate, getYesterdayDate } from '../utils/dateHelpers';

// --- MOCK DATA ---
const MOCK_CONSIGNORS: Consignor[] = [
  { id: '1', name: 'Standard Fireworks', gst: '33ABCDE1234F1Z5', from: 'Sivakasi', filingDate: getTodayDate(), address: '123 Fire St, Sivakasi' },
  { id: '2', name: 'National Crackers', gst: '33FGHIJ5678K1Z9', from: 'Madurai', filingDate: getYesterdayDate(), address: '456 Sparkler Ave, Sivakasi' },
  { id: '3', name: 'Mega Crackers', gst: '33LMNOP6789Q1Z2', from: 'Sivakasi', filingDate: '2025-11-01', address: '789 Blast Rd, Sivakasi' },
];

const MOCK_CONSIGNEES: Consignee[] = [
  { id: 'c1', consignorId: '1', name: 'Raju Fireworks', phone: '9876543210', destination: 'Chennai', filingDate: getTodayDate(), address: '123 Anna Salai, Chennai', gst: '33AAAAA1111A1Z', pan: 'ABCDE1234F' },
  { id: 'c2', consignorId: '2', name: 'Deepa Crackers Mart', phone: '9123456780', destination: 'Bangalore', filingDate: getYesterdayDate(), address: '456 MG Road, Bangalore', pan: 'FGHJ1234K' },
  { id: 'c3', consignorId: '1', name: 'Suresh Traders', phone: '9998887770', destination: 'Hyderabad', filingDate: '2025-11-05', address: '789 Market St, Hyderabad', gst: '36BBBBB2222B2Z', aadhar: '123456789012' },
  { id: 'c4', name: 'Terkheda Traders', phone: '9999911111', destination: 'TERKHEDA', filingDate: '2025-11-04', address: '1 Main Rd, Terkheda', gst: '27AAAAA1111A1Z' },
];

const MOCK_GC_ENTRIES: GcEntry[] = [
  {
    id: '1050', gcDate: getYesterdayDate(), from: 'Sivakasi', destination: 'Chennai',
    consignorId: '1', consigneeId: 'c1',
    consigneeProofType: 'gst', consigneeProofValue: '33AAAAA1111A1Z',
    billDate: getYesterdayDate(), deliveryAt: 'Chennai', freightUptoAt: 'Chennai', godown: 'Main Godown',
    billNo: 'B-101', billValue: "57500", tollFee: "150", freight: "1200", godownCharge: "50", statisticCharge: "10", advanceNone: "0", balanceToPay: "57500",
    quantity: "50", packing: 'BOXES', contents: 'FW', prefix: 'Case No.', fromNo: "1", netQty: "50",
    paidType: 'To Pay',
    gcNo: undefined,
    date: '',
    invoiceDate: '',
    invoiceNo: '',
    pkgDesc: '',
    marks: undefined
  },
  {
    id: '1051', gcDate: getTodayDate(), from: 'Madurai', destination: 'Bangalore',
    consignorId: '2', consigneeId: 'c2',
    consigneeProofType: 'pan', consigneeProofValue: 'FGHJ1234K',
    billDate: getTodayDate(), deliveryAt: 'Bangalore', freightUptoAt: 'Bangalore', godown: 'Branch Godown',
    billNo: 'B-102', billValue: "120000", tollFee: "200", freight: "2500", godownCharge: "100", statisticCharge: "10", advanceNone: "50000", balanceToPay: "70000",
    quantity: "100", packing: 'CARTONS', contents: 'SPARKLERS', prefix: 'Marks', fromNo: "1", netQty: "100",
    paidType: 'Paid',
    gcNo: undefined,
    date: '',
    invoiceDate: '',
    invoiceNo: '',
    pkgDesc: '',
    marks: undefined
  },
];

const MOCK_FROM_PLACES: FromPlace[] = [
  { id: 'fp1', placeName: 'Sivakasi', shortName: 'SVK' },
  { id: 'fp2', placeName: 'Madurai', shortName: 'MDU' },
];

const MOCK_TO_PLACES: ToPlace[] = [
  { id: 'tp1', placeName: 'Chennai', shortName: 'MAA' },
  { id: 'tp2', placeName: 'Bangalore', shortName: 'BLR' },
  { id: 'tp3', placeName: 'Hyderabad', shortName: 'HYD' },
  { id: 'tp4', placeName: 'TERKHEDA', shortName: 'TRK' },
];

const MOCK_PACKING_ENTRIES: PackingEntry[] = [
  { id: 'p1', packingName: 'BAGS', shortName: 'BAGS' },
  { id: 'p2', packingName: 'BOXES', shortName: 'BOXES' },
  { id: 'p3', packingName: 'CARTONS', shortName: 'CTN' },
  { id: 'p4', packingName: 'BUNDLES', shortName: 'BNDL' },
];

const MOCK_CONTENT_ENTRIES: ContentEntry[] = [
  { id: 'cn1', contentName: 'FW (Fireworks)', shortName: 'FW' },
  { id: 'cn2', contentName: 'SPARKLERS', shortName: 'SPK' },
  { id: 'cn3', contentName: 'ATOM BOMBS', shortName: 'AB' },
  { id: 'cn4', contentName: 'GENERAL GOODS', shortName: 'GEN' },
];

const MOCK_VEHICLES: VehicleEntry[] = [
  {
    id: 'V-1',
    vehicleNo: 'TN-67-AB-1234',
    vehicleName: 'TATA 1412',
    ownerName: 'RAMESH',
    ownerMobile: '9876543210'
  },
  {
    id: 'V-2',
    vehicleNo: 'KA-01-XY-5678',
    vehicleName: 'EICHER 2517',
    ownerName: 'SURESH',
    ownerMobile: '9123456789'
  }
];

const MOCK_DRIVERS: DriverEntry[] = [
  { id: 'd1', driverName: 'Ramesh', dlNo: 'TN6720100012345', mobile: '9876543210' },
  { id: 'd2', driverName: 'Suresh', dlNo: 'KA0120150067890', mobile: '9123456789' },
];

const MOCK_TRIP_SHEETS: TripSheetEntry[] = [
  {
    id: '1',
    mfNo: '1001',
    tsDate: getYesterdayDate(),
    fromPlace: 'Sivakasi',
    toPlace: 'Chennai',
    totalAmount: 57500,
    driverName: 'Ramesh',
    driverMobile: '9876543210',
    lorryNo: 'TN-67-AB-1234',
    items: [
      {
        gcNo: '1050',
        qty: 50,
        rate: 1200,
        amount: 57500,
        consignor: 'Standard Fireworks',
        consignee: 'Raju Fireworks'
      }
    ]
  },
  {
    id: '2',
    mfNo: '1002',
    tsDate: getTodayDate(),
    fromPlace: 'Madurai',
    toPlace: 'Bangalore',
    totalAmount: 70000,
    driverName: 'Suresh',
    driverMobile: '9123456789',
    lorryNo: 'KA-01-XY-5678',
    items: [
      {
        gcNo: '1051',
        qty: 100,
        rate: 2500,
        amount: 70000,
        consignor: 'National Crackers',
        consignee: 'Deepa Crackers Mart'
      }
    ]
  }
];
// --- END MOCK DATA ---

const loadFromStorage = (key: string, mockData: any[]) => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      const parsed = JSON.parse(storedValue);
      if (Array.isArray(parsed) && parsed.length === 0 && mockData.length > 0) {
        return mockData;
      }
      return parsed;
    }
  } catch (e) {
    console.error(`Failed to parse ${key} from localStorage`, e);
  }
  return mockData;
};

interface DataContextType {
  consignors: Consignor[];
  consignees: Consignee[];
  gcEntries: GcEntry[];
  fromPlaces: FromPlace[];
  toPlaces: ToPlace[];
  packingEntries: PackingEntry[];
  contentEntries: ContentEntry[];
  tripSheets: TripSheetEntry[];
  vehicleEntries: VehicleEntry[];
  driverEntries: DriverEntry[];
  
  addConsignor: (consignor: Consignor) => void;
  updateConsignor: (consignor: Consignor) => void;
  deleteConsignor: (id: string) => void;
  
  addConsignee: (consignee: Consignee) => void;
  updateConsignee: (consignee: Consignee) => void;
  deleteConsignee: (id: string) => void;
  
  getNextGcNo: () => string;
  getGcEntry: (id: string) => GcEntry | undefined;
  addGcEntry: (gcEntry: GcEntry) => void;
  updateGcEntry: (gcEntry: GcEntry) => void;
  deleteGcEntry: (id: string) => void;

  addFromPlace: (fromPlace: FromPlace) => void;
  updateFromPlace: (fromPlace: FromPlace) => void;
  deleteFromPlace: (id: string) => void;

  addToPlace: (toPlace: ToPlace) => void;
  updateToPlace: (toPlace: ToPlace) => void;
  deleteToPlace: (id: string) => void;

  addPackingEntry: (entry: PackingEntry) => void;
  updatePackingEntry: (entry: PackingEntry) => void;
  deletePackingEntry: (id: string) => void;

  addContentEntry: (entry: ContentEntry) => void;
  updateContentEntry: (entry: ContentEntry) => void;
  deleteContentEntry: (id: string) => void;

  addTripSheet: (sheet: TripSheetEntry) => void;
  updateTripSheet: (sheet: TripSheetEntry) => void;
  deleteTripSheet: (id: string) => void;
  getTripSheet: (id: string) => TripSheetEntry | undefined;

  addVehicleEntry: (entry: VehicleEntry) => void;
  updateVehicleEntry: (entry: VehicleEntry) => void;
  deleteVehicleEntry: (id: string) => void;

  addDriverEntry: (entry: DriverEntry) => void;
  updateDriverEntry: (entry: DriverEntry) => void;
  deleteDriverEntry: (id: string) => void;
  
  getUniqueDests: () => { value: string, label: string }[];
  getPackingTypes: () => { value: string, label: string }[];
  getContentsTypes: () => { value: string, label: string }[];
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [consignors, setConsignors] = useState<Consignor[]>(() => loadFromStorage('consignors', MOCK_CONSIGNORS));
  const [consignees, setConsignees] = useState<Consignee[]>(() => loadFromStorage('consignees', MOCK_CONSIGNEES));
  const [gcEntries, setGcEntries] = useState<GcEntry[]>(() => loadFromStorage('gcEntries', MOCK_GC_ENTRIES));
  const [fromPlaces, setFromPlaces] = useState<FromPlace[]>(() => loadFromStorage('fromPlaces', MOCK_FROM_PLACES));
  const [toPlaces, setToPlaces] = useState<ToPlace[]>(() => loadFromStorage('toPlaces', MOCK_TO_PLACES));
  const [packingEntries, setPackingEntries] = useState<PackingEntry[]>(() => loadFromStorage('packingEntries', MOCK_PACKING_ENTRIES));
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>(() => loadFromStorage('contentEntries', MOCK_CONTENT_ENTRIES));
  const [tripSheets, setTripSheets] = useState<TripSheetEntry[]>(() => loadFromStorage('tripSheets', MOCK_TRIP_SHEETS));
  const [vehicleEntries, setVehicleEntries] = useState<VehicleEntry[]>(() => loadFromStorage('vehicleEntries', MOCK_VEHICLES));
  const [driverEntries, setDriverEntries] = useState<DriverEntry[]>(() => loadFromStorage('driverEntries', MOCK_DRIVERS));

  useEffect(() => { localStorage.setItem('consignors', JSON.stringify(consignors)); }, [consignors]);
  useEffect(() => { localStorage.setItem('consignees', JSON.stringify(consignees)); }, [consignees]);
  useEffect(() => { localStorage.setItem('gcEntries', JSON.stringify(gcEntries)); }, [gcEntries]);
  useEffect(() => { localStorage.setItem('fromPlaces', JSON.stringify(fromPlaces)); }, [fromPlaces]);
  useEffect(() => { localStorage.setItem('toPlaces', JSON.stringify(toPlaces)); }, [toPlaces]);
  useEffect(() => { localStorage.setItem('packingEntries', JSON.stringify(packingEntries)); }, [packingEntries]);
  useEffect(() => { localStorage.setItem('contentEntries', JSON.stringify(contentEntries)); }, [contentEntries]);
  useEffect(() => { localStorage.setItem('tripSheets', JSON.stringify(tripSheets)); }, [tripSheets]);
  useEffect(() => { localStorage.setItem('vehicleEntries', JSON.stringify(vehicleEntries)); }, [vehicleEntries]);
  useEffect(() => { localStorage.setItem('driverEntries', JSON.stringify(driverEntries)); }, [driverEntries]);

  const addConsignor = (consignor: Consignor) => setConsignors(p => [...p, consignor]);
  const updateConsignor = (c: Consignor) => setConsignors(p => p.map(x => x.id === c.id ? c : x));
  const deleteConsignor = (id: string) => setConsignors(p => p.filter(x => x.id !== id));
  
  const addConsignee = (consignee: Consignee) => setConsignees(p => [...p, consignee]);
  const updateConsignee = (c: Consignee) => setConsignees(p => p.map(x => x.id === c.id ? c : x));
  const deleteConsignee = (id: string) => setConsignees(p => p.filter(x => x.id !== id));

  const getNextGcNo = () => {
    if (gcEntries.length === 0) return '1001';
    const maxId = Math.max(...gcEntries.map(gc => parseInt(gc.id, 10)).filter(num => !isNaN(num)));
    if (maxId < 1000) return '1001';
    return (maxId + 1).toString();
  };
  const getGcEntry = (id: string) => gcEntries.find(gc => gc.id === id);
  const addGcEntry = (gc: GcEntry) => setGcEntries(p => [...p, gc]);
  const updateGcEntry = (gc: GcEntry) => setGcEntries(p => p.map(x => x.id === gc.id ? gc : x));
  const deleteGcEntry = (id: string) => setGcEntries(p => p.filter(x => x.id !== id));

  const addFromPlace = (fp: FromPlace) => setFromPlaces(p => [...p, fp]);
  const updateFromPlace = (fp: FromPlace) => setFromPlaces(p => p.map(x => x.id === fp.id ? fp : x));
  const deleteFromPlace = (id: string) => setFromPlaces(p => p.filter(x => x.id !== id));

  const addToPlace = (tp: ToPlace) => setToPlaces(p => [...p, tp]);
  const updateToPlace = (tp: ToPlace) => setToPlaces(p => p.map(x => x.id === tp.id ? tp : x));
  const deleteToPlace = (id: string) => setToPlaces(p => p.filter(x => x.id !== id));

  const addPackingEntry = (entry: PackingEntry) => setPackingEntries(p => [...p, entry]);
  const updatePackingEntry = (entry: PackingEntry) => setPackingEntries(p => p.map(x => x.id === entry.id ? entry : x));
  const deletePackingEntry = (id: string) => setPackingEntries(p => p.filter(x => x.id !== id));

  const addContentEntry = (entry: ContentEntry) => setContentEntries(p => [...p, entry]);
  const updateContentEntry = (entry: ContentEntry) => setContentEntries(p => p.map(x => x.id === entry.id ? entry : x));
  const deleteContentEntry = (id: string) => setContentEntries(p => p.filter(x => x.id !== id));

  const addTripSheet = (sheet: TripSheetEntry) => setTripSheets(p => [...p, sheet]);
  const updateTripSheet = (sheet: TripSheetEntry) => setTripSheets(p => p.map(x => x.mfNo === sheet.mfNo ? sheet : x));
  const deleteTripSheet = (id: string) => setTripSheets(p => p.filter(x => x.mfNo !== id));
  const getTripSheet = (id: string) => tripSheets.find(ts => ts.mfNo === id || ts.id === id);

  // Vehicles
  const addVehicleEntry = (x: VehicleEntry) => setVehicleEntries((p) => [...p, x]);
  const updateVehicleEntry = (x: VehicleEntry) =>
    setVehicleEntries((p) => p.map((y) => (y.id === x.id ? x : y)));
  const deleteVehicleEntry = (id: string) =>
    setVehicleEntries((p) => p.filter((x) => x.id !== id));

  // Drivers
  const addDriverEntry = (entry: DriverEntry) => setDriverEntries(p => [...p, entry]);
  const updateDriverEntry = (entry: DriverEntry) => setDriverEntries(p => p.map(x => x.id === entry.id ? entry : x));
  const deleteDriverEntry = (id: string) => setDriverEntries(p => p.filter(x => x.id !== id));

  const getUniqueDests = () => {
    const dests = new Set([
      ...toPlaces.map(tp => tp.placeName),
      ...consignees.map(c => c.destination),
      ...gcEntries.map(gc => gc.destination)
    ]);
    return Array.from(dests).map(d => ({ value: d, label: d }));
  };
  
  const getPackingTypes = () => {
    return packingEntries.map(p => ({ value: p.packingName, label: p.packingName }));
  };
  
  const getContentsTypes = () => {
    return contentEntries.map(c => ({ value: c.contentName, label: c.contentName }));
  };

  const value = useMemo(() => ({
    consignors, consignees, gcEntries, fromPlaces, toPlaces, packingEntries, contentEntries, tripSheets, vehicleEntries, driverEntries,
    addConsignor, updateConsignor, deleteConsignor,
    addConsignee, updateConsignee, deleteConsignee,
    getNextGcNo, getGcEntry, addGcEntry, updateGcEntry, deleteGcEntry,
    addFromPlace, updateFromPlace, deleteFromPlace,
    addToPlace, updateToPlace, deleteToPlace,
    addPackingEntry, updatePackingEntry, deletePackingEntry,
    addContentEntry, updateContentEntry, deleteContentEntry,
    addTripSheet, updateTripSheet, deleteTripSheet, getTripSheet,
    addVehicleEntry, updateVehicleEntry, deleteVehicleEntry,
    addDriverEntry, updateDriverEntry, deleteDriverEntry,
    getUniqueDests, getPackingTypes, getContentsTypes,
  }), [consignors, consignees, gcEntries, fromPlaces, toPlaces, packingEntries, contentEntries, tripSheets, vehicleEntries, driverEntries]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};