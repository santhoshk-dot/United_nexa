import React, { createContext, useState, useMemo, useEffect, useCallback } from 'react';
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
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

interface DataContextType {
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
  
  addConsignor: (consignor: Consignor) => Promise<void>;
  updateConsignor: (consignor: Consignor) => Promise<void>;
  deleteConsignor: (id: string) => Promise<void>;
  addConsignee: (consignee: Consignee) => Promise<void>;
  updateConsignee: (consignee: Consignee) => Promise<void>;
  deleteConsignee: (id: string) => Promise<void>;
  getNextGcNo: () => Promise<string>;
  fetchGcById: (id: string) => Promise<GcEntry | null>;
  fetchTripSheetById: (id: string) => Promise<TripSheetEntry | null>;
  addGcEntry: (gcEntry: GcEntry) => Promise<void>;
  updateGcEntry: (gcEntry: GcEntry) => Promise<void>;
  deleteGcEntry: (identifier: string) => Promise<void>;
  saveLoadingProgress: (gcId: string, selectedQuantities: number[]) => Promise<void>;
  
  fetchGcPrintData: (gcNos: string[], selectAll?: boolean, filters?: any) => Promise<any[]>;
  fetchLoadingSheetPrintData: (gcNos: string[], selectAll?: boolean, filters?: any) => Promise<any[]>;
  
  // UPDATED: Added selectAll and filters params
  fetchTripSheetPrintData: (mfNos: string[], selectAll?: boolean, filters?: any) => Promise<TripSheetEntry[]>;

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
  addTripSheet: (sheet: TripSheetEntry) => Promise<void>;
  updateTripSheet: (sheet: TripSheetEntry) => Promise<void>;
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
  
  refreshData: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  const [consignors, setConsignors] = useState<Consignor[]>([]);
  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [fromPlaces, setFromPlaces] = useState<FromPlace[]>([]);
  const [toPlaces, setToPlaces] = useState<ToPlace[]>([]);
  const [packingEntries, setPackingEntries] = useState<PackingEntry[]>([]);
  const [contentEntries, setContentEntries] = useState<ContentEntry[]>([]);
  const [vehicleEntries, setVehicleEntries] = useState<VehicleEntry[]>([]);
  const [driverEntries, setDriverEntries] = useState<DriverEntry[]>([]);

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    try {
      const [
        consignorsRes, consigneesRes, fromRes, toRes, 
        packRes, contentRes, vehRes, drvRes
      ] = await Promise.all([
        api.get('/master/consignors'),
        api.get('/master/consignees'),
        api.get('/master/from-places'),
        api.get('/master/to-places'),
        api.get('/master/packings'),
        api.get('/master/contents'),
        api.get('/master/vehicles'),
        api.get('/master/drivers')
      ]);

      setConsignors(consignorsRes.data);
      setConsignees(consigneesRes.data);
      setFromPlaces(fromRes.data);
      setToPlaces(toRes.data);
      setPackingEntries(packRes.data);
      setContentEntries(contentRes.data);
      setVehicleEntries(vehRes.data);
      setDriverEntries(drvRes.data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  }, [user]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // --- GC ACTIONS ---
  const getNextGcNo = async () => {
    try { const { data } = await api.get('/operations/gc/next-no'); return data.nextGcNo; } 
    catch (e) { return "Error"; }
  };
  
  const fetchGcById = async (id: string) => {
    try { const { data } = await api.get(`/operations/gc/${id}`); return data; }
    catch (e) { console.error(e); return null; }
  };

  const fetchGcPrintData = async (gcNos: string[], selectAll?: boolean, filters?: any) => {
    try {
      const { data } = await api.post('/operations/gc/print-data', { gcNos, selectAll, filters });
      return data;
    } catch (e) {
      console.error("Error fetching bulk print data:", e);
      return [];
    }
  };

  const fetchLoadingSheetPrintData = async (gcNos: string[], selectAll?: boolean, filters?: any) => {
    try {
      const { data } = await api.post('/operations/loading-sheet/print-data', { gcNos, selectAll, filters });
      return data;
    } catch (e) {
      console.error("Error fetching loading sheet print data:", e);
      return [];
    }
  };

  // UPDATED: fetchTripSheetPrintData
  const fetchTripSheetPrintData = async (mfNos: string[], selectAll?: boolean, filters?: any) => {
    try {
      const { data } = await api.post('/operations/tripsheet/print-data', { mfNos, selectAll, filters });
      return data;
    } catch (e) {
      console.error("Error fetching trip sheet print data:", e);
      return [];
    }
  };

  const addGcEntry = async (data: GcEntry) => { await api.post('/operations/gc', data); };
  const updateGcEntry = async (data: GcEntry) => { await api.put(`/operations/gc/${data.gcNo}`, data); };
  const deleteGcEntry = async (identifier: string) => { await api.delete(`/operations/gc/${identifier}`); };
  
  const saveLoadingProgress = async (gcId: string, selectedQuantities: number[]) => {
    await api.put('/operations/loading/save', { gcId, selectedQuantities });
  };

  // --- TRIP SHEET ACTIONS ---
  const fetchTripSheetById = async (id: string) => {
    try { const { data } = await api.get(`/operations/tripsheet/${id}`); return data; }
    catch (e) { console.error(e); return null; }
  };

  const addTripSheet = async (data: TripSheetEntry) => { await api.post('/operations/tripsheet', data); };
  const updateTripSheet = async (data: TripSheetEntry) => { await api.put(`/operations/tripsheet/${data.mfNo}`, data); };
  const deleteTripSheet = async (id: string) => { await api.delete(`/operations/tripsheet/${id}`); };

  // --- MASTER ACTIONS ---
  const addConsignor = async (data: Consignor) => { const res = await api.post('/master/consignors', data); setConsignors(prev => [res.data, ...prev]); };
  const updateConsignor = async (data: Consignor) => { const res = await api.put(`/master/consignors/${data.id}`, data); setConsignors(prev => prev.map(item => item.id === data.id ? res.data : item)); };
  const deleteConsignor = async (id: string) => { await api.delete(`/master/consignors/${id}`); setConsignors(prev => prev.filter(item => item.id !== id)); };

  const addConsignee = async (data: Consignee) => { const res = await api.post('/master/consignees', data); setConsignees(prev => [res.data, ...prev]); };
  const updateConsignee = async (data: Consignee) => { const res = await api.put(`/master/consignees/${data.id}`, data); setConsignees(prev => prev.map(item => item.id === data.id ? res.data : item)); };
  const deleteConsignee = async (id: string) => { await api.delete(`/master/consignees/${id}`); setConsignees(prev => prev.filter(item => item.id !== id)); };

  const addFromPlace = async (data: FromPlace) => { const res = await api.post('/master/from-places', data); setFromPlaces(prev => [res.data, ...prev]); };
  const updateFromPlace = async (data: FromPlace) => { const res = await api.put(`/master/from-places/${data.id}`, data); setFromPlaces(prev => prev.map(x => x.id === data.id ? res.data : x)); };
  const deleteFromPlace = async (id: string) => { await api.delete(`/master/from-places/${id}`); setFromPlaces(prev => prev.filter(x => x.id !== id)); };

  const addToPlace = async (data: ToPlace) => { const res = await api.post('/master/to-places', data); setToPlaces(prev => [res.data, ...prev]); };
  const updateToPlace = async (data: ToPlace) => { const res = await api.put(`/master/to-places/${data.id}`, data); setToPlaces(prev => prev.map(x => x.id === data.id ? res.data : x)); };
  const deleteToPlace = async (id: string) => { await api.delete(`/master/to-places/${id}`); setToPlaces(prev => prev.filter(x => x.id !== id)); };

  const addPackingEntry = async (data: PackingEntry) => { const res = await api.post('/master/packings', data); setPackingEntries(prev => [res.data, ...prev]); };
  const updatePackingEntry = async (data: PackingEntry) => { const res = await api.put(`/master/packings/${data.id}`, data); setPackingEntries(prev => prev.map(x => x.id === data.id ? res.data : x)); };
  const deletePackingEntry = async (id: string) => { await api.delete(`/master/packings/${id}`); setPackingEntries(prev => prev.filter(x => x.id !== id)); };

  const addContentEntry = async (data: ContentEntry) => { const res = await api.post('/master/contents', data); setContentEntries(prev => [res.data, ...prev]); };
  const updateContentEntry = async (data: ContentEntry) => { const res = await api.put(`/master/contents/${data.id}`, data); setContentEntries(prev => prev.map(x => x.id === data.id ? res.data : x)); };
  const deleteContentEntry = async (id: string) => { await api.delete(`/master/contents/${id}`); setContentEntries(prev => prev.filter(x => x.id !== id)); };

  const addVehicleEntry = async (data: VehicleEntry) => { const res = await api.post('/master/vehicles', data); setVehicleEntries(prev => [res.data, ...prev]); };
  const updateVehicleEntry = async (data: VehicleEntry) => { const res = await api.put(`/master/vehicles/${data.id}`, data); setVehicleEntries(prev => prev.map(x => x.id === data.id ? res.data : x)); };
  const deleteVehicleEntry = async (id: string) => { await api.delete(`/master/vehicles/${id}`); setVehicleEntries(prev => prev.filter(x => x.id !== id)); };

  const addDriverEntry = async (data: DriverEntry) => { const res = await api.post('/master/drivers', data); setDriverEntries(prev => [res.data, ...prev]); };
  const updateDriverEntry = async (data: DriverEntry) => { const res = await api.put(`/master/drivers/${data.id}`, data); setDriverEntries(prev => prev.map(x => x.id === data.id ? res.data : x)); };
  const deleteDriverEntry = async (id: string) => { await api.delete(`/master/drivers/${id}`); setDriverEntries(prev => prev.filter(x => x.id !== id)); };

  const getUniqueDests = useCallback(() => {
    const dests = new Set([...toPlaces.map(tp => tp.placeName), ...consignees.map(c => c.destination)]);
    return Array.from(dests).map(d => ({ value: d, label: d }));
  }, [toPlaces, consignees]);
  
  const getPackingTypes = useCallback(() => packingEntries.map(p => ({ value: p.packingName, label: p.packingName })), [packingEntries]);
  const getContentsTypes = useCallback(() => contentEntries.map(c => ({ value: c.contentName, label: c.contentName })), [contentEntries]);

  const value = useMemo(() => ({
    consignors, consignees, gcEntries: [], tripSheets: [], 
    fromPlaces, toPlaces, packingEntries, contentEntries, vehicleEntries, driverEntries,
    addConsignor, updateConsignor, deleteConsignor,
    addConsignee, updateConsignee, deleteConsignee,
    getNextGcNo, fetchGcById, fetchTripSheetById, addGcEntry, updateGcEntry, deleteGcEntry, saveLoadingProgress,
    fetchGcPrintData,
    fetchLoadingSheetPrintData,
    fetchTripSheetPrintData,
    addFromPlace, updateFromPlace, deleteFromPlace,
    addToPlace, updateToPlace, deleteToPlace,
    addPackingEntry, updatePackingEntry, deletePackingEntry,
    addContentEntry, updateContentEntry, deleteContentEntry,
    addTripSheet, updateTripSheet, deleteTripSheet,
    addVehicleEntry, updateVehicleEntry, deleteVehicleEntry,
    addDriverEntry, updateDriverEntry, deleteDriverEntry,
    getUniqueDests, getPackingTypes, getContentsTypes,
    refreshData: fetchAllData
  }), [consignors, consignees, fromPlaces, toPlaces, packingEntries, contentEntries, vehicleEntries, driverEntries, fetchAllData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};