import React, { createContext, useState, useMemo, useEffect } from 'react';
import type { Consignor, Consignee, GcEntry, FromPlace, ToPlace } from '../types';
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
    gcNo: undefined
  },
  {
    id: '1051', gcDate: getTodayDate(), from: 'Madurai', destination: 'Bangalore',
    consignorId: '2', consigneeId: 'c2',
    consigneeProofType: 'pan', consigneeProofValue: 'FGHJ1234K',
    billDate: getTodayDate(), deliveryAt: 'Bangalore', freightUptoAt: 'Bangalore', godown: 'Branch Godown',
    billNo: 'B-102', billValue: "120000", tollFee: "200", freight: "2500", godownCharge: "100", statisticCharge: "10", advanceNone: "50000", balanceToPay: "70000",
    quantity: "100", packing: 'CARTONS', contents: 'SPARKLERS', prefix: 'Marks', fromNo: "1", netQty: "100",
    paidType: 'Paid',
    gcNo: undefined
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
// --- END MOCK DATA ---

// Helper function to load data from localStorage or use mock data as a fallback
const loadFromStorage = (key: string, mockData: any[]) => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
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
  
  getUniqueDests: () => { value: string, label: string }[];
  getPackingTypes: () => { value: string, label: string }[];
  getContentsTypes: () => { value: string, label: string }[];
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  // State initialized from localStorage
  const [consignors, setConsignors] = useState<Consignor[]>(() => loadFromStorage('consignors', MOCK_CONSIGNORS));
  const [consignees, setConsignees] = useState<Consignee[]>(() => loadFromStorage('consignees', MOCK_CONSIGNEES));
  const [gcEntries, setGcEntries] = useState<GcEntry[]>(() => loadFromStorage('gcEntries', MOCK_GC_ENTRIES));
  const [fromPlaces, setFromPlaces] = useState<FromPlace[]>(() => loadFromStorage('fromPlaces', MOCK_FROM_PLACES));
  const [toPlaces, setToPlaces] = useState<ToPlace[]>(() => loadFromStorage('toPlaces', MOCK_TO_PLACES));

  // Save to localStorage whenever data changes
  useEffect(() => { localStorage.setItem('consignors', JSON.stringify(consignors)); }, [consignors]);
  useEffect(() => { localStorage.setItem('consignees', JSON.stringify(consignees)); }, [consignees]);
  useEffect(() => { localStorage.setItem('gcEntries', JSON.stringify(gcEntries)); }, [gcEntries]);
  useEffect(() => { localStorage.setItem('fromPlaces', JSON.stringify(fromPlaces)); }, [fromPlaces]);
  useEffect(() => { localStorage.setItem('toPlaces', JSON.stringify(toPlaces)); }, [toPlaces]);

  // --- Consignor Functions ---
  const addConsignor = (consignor: Consignor) => {
    setConsignors(prev => [...prev, consignor]);
  };
  const updateConsignor = (updatedConsignor: Consignor) => {
    setConsignors(prev => prev.map(c => c.id === updatedConsignor.id ? updatedConsignor : c));
  };
  const deleteConsignor = (id: string) => {
    setConsignors(prev => prev.filter(c => c.id !== id));
  };

  // --- Consignee Functions ---
  const addConsignee = (consignee: Consignee) => {
    setConsignees(prev => [...prev, consignee]);
  };
  const updateConsignee = (updatedConsignee: Consignee) => {
    setConsignees(prev => prev.map(c => c.id === updatedConsignee.id ? updatedConsignee : c));
  };
  const deleteConsignee = (id: string) => {
    setConsignees(prev => prev.filter(c => c.id !== id));
  };

  // --- GC Functions ---
  const getNextGcNo = () => {
    if (gcEntries.length === 0) return '1001';
    const maxId = Math.max(...gcEntries.map(gc => parseInt(gc.id, 10)).filter(num => !isNaN(num)));
    if (maxId < 1000) return '1001';
    return (maxId + 1).toString();
  };

  const getGcEntry = (id: string) => {
    return gcEntries.find(gc => gc.id === id);
  };

  const addGcEntry = (gcEntry: GcEntry) => {
    setGcEntries(prev => [...prev, gcEntry]);
  };

  const updateGcEntry = (updatedGcEntry: GcEntry) => {
    setGcEntries(prev => prev.map(gc => gc.id === updatedGcEntry.id ? updatedGcEntry : gc));
  };

  const deleteGcEntry = (id: string) => {
    setGcEntries(prev => prev.filter(gc => gc.id !== id));
  };

  // --- From Place Functions ---
  const addFromPlace = (fromPlace: FromPlace) => {
    setFromPlaces(prev => [...prev, fromPlace]);
  };
  const updateFromPlace = (updatedFromPlace: FromPlace) => {
    setFromPlaces(prev => prev.map(fp => fp.id === updatedFromPlace.id ? updatedFromPlace : fp));
  };
  const deleteFromPlace = (id: string) => {
    setFromPlaces(prev => prev.filter(fp => fp.id !== id));
  };

  // --- To Place Functions ---
  const addToPlace = (toPlace: ToPlace) => {
    setToPlaces(prev => [...prev, toPlace]);
  };
  const updateToPlace = (updatedToPlace: ToPlace) => {
    setToPlaces(prev => prev.map(tp => tp.id === updatedToPlace.id ? updatedToPlace : tp));
  };
  const deleteToPlace = (id: string) => {
    setToPlaces(prev => prev.filter(tp => tp.id !== id));
  };
  
  // --- Helpers ---
  const getUniqueDests = () => {
    // Combine destinations from To Places and Consignees
    const dests = new Set([
      ...toPlaces.map(tp => tp.placeName),
      ...consignees.map(c => c.destination),
      ...gcEntries.map(gc => gc.destination)
    ]);
    return Array.from(dests).map(d => ({ value: d, label: d }));
  };
  
  const getPackingTypes = () => [
    { value: 'BAGS', label: 'BAGS' },
    { value: 'BOXES', label: 'BOXES' },
    { value: 'CARTONS', label: 'CARTONS' },
    { value: 'BUNDLES', label: 'BUNDLES' },
  ];
  
  const getContentsTypes = () => [
    { value: 'FW', label: 'FW (Fireworks)' },
    { value: 'SPARKLERS', label: 'SPARKLERS' },
    { value: 'ATOM BOMBS', label: 'ATOM BOMBS' },
    { value: 'GENERAL GOODS', label: 'GENERAL GOODS' },
  ];

  const value = useMemo(() => ({
    consignors,
    consignees,
    gcEntries,
    fromPlaces,
    toPlaces,
    
    addConsignor,
    updateConsignor,
    deleteConsignor,
    
    addConsignee,
    updateConsignee,
    deleteConsignee,
    
    getNextGcNo,
    getGcEntry,
    addGcEntry,
    updateGcEntry,
    deleteGcEntry,

    addFromPlace,
    updateFromPlace,
    deleteFromPlace,

    addToPlace,
    updateToPlace,
    deleteToPlace,
    
    getUniqueDests,
    getPackingTypes,
    getContentsTypes,
  }), [consignors, consignees, gcEntries, fromPlaces, toPlaces]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};