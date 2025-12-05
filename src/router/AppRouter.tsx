import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { DataProvider } from '../contexts/DataContext'; 
import { LoadingScreen } from '../components/shared/LoadingScreen';

// 🟢 CRITICAL CHANGE: Import OfflinePage DIRECTLY (Not Lazy)
// This ensures the code is already available when the network cuts out,
// preventing the Suspense "Loading..." spinner from showing.
import { OfflinePage } from '../features/misc/OfflinePage';

// Helper to load named exports lazily
const load = (importPromise: Promise<any>, componentName: string) => 
  importPromise.then(module => ({ default: module[componentName] }));

// Features -> Auth
const LoginScreen = lazy(() => load(import('../features/auth/LoginScreen'), 'LoginScreen'));

// Features -> Dashboard
const DashboardPage = lazy(() => load(import('../features/dashboard/DashboardPage'), 'DashboardPage'));
const MasterDashboardPage = lazy(() => load(import('../features/dashboard/MasterDashboardPage'), 'MasterDashboardPage'));

// Features -> Operations
const GcEntryList = lazy(() => load(import('../features/gc-entry/GcEntryList'), 'GcEntryList'));
const GcEntryForm = lazy(() => load(import('../features/gc-entry/GcEntryForm'), 'GcEntryForm'));
const LoadingSheetEntry = lazy(() => load(import('../features/loading-sheet/LoadingSheetEntry'), 'LoadingSheetEntry'));
const TripSheetList = lazy(() => load(import('../features/trip-sheet-entry/TripSheetList'), 'TripSheetList'));
const TripSheetForm = lazy(() => load(import('../features/trip-sheet-entry/TripSheetForm'), 'TripSheetForm'));
const PendingStockHistory = lazy(() => load(import('../features/pending-stock/PendingStockHistory'), 'PendingStockHistory'));

// Features -> Masters
const ConsignorList = lazy(() => load(import('../features/consignors/ConsignorList'), 'ConsignorList'));
const ConsigneeList = lazy(() => load(import('../features/consignees/ConsigneeList'), 'ConsigneeList'));
const FromPlaceList = lazy(() => load(import('../features/from-places-entry/FromPlacesList'), 'FromPlaceList'));
const ToPlacesList = lazy(() => load(import('../features/to-places-entry/ToPlacesList'), 'ToPlacesList'));
const PackingEntryList = lazy(() => load(import('../features/packing-entry/PackingUnitList'), 'PackingEntryList'));
const ContentList = lazy(() => load(import('../features/content-entry/ContentList'), 'ContentList'));
const VehicleList = lazy(() => load(import('../features/vehicle-details/VehicleList'), 'VehicleList'));
const DriverList = lazy(() => load(import('../features/driver-details copy/DriverList'), 'DriverList'));

// Features -> Templates (Settings)
// 🟢 Using load helper with 'default' because MainScreen is a default export
const MainScreen = lazy(() => load(import('../features/templates/MainScreen'), 'default'));

// Features -> Admin
const UserList = lazy(() => load(import('../features/users/UserList'), 'UserList'));

const ProtectedRoute = ({ requireAdmin = false }: { requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />; 
  }

  return (
    <DataProvider>
      <Layout>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </Layout>
    </DataProvider>
  );
};

const LoginRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LoginScreen />
    </Suspense>
  );
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/logout" element={<Navigate to="/login" replace />} />
      
      {/* 🟢 CHANGE: Use the direct component, NO Suspense fallback here */}
      <Route path="/offline" element={<OfflinePage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/gc-entry" element={<GcEntryList />} />
        <Route path="/gc-entry/new" element={<GcEntryForm />} />
        <Route path="/gc-entry/edit/:gcNo" element={<GcEntryForm />} />
        <Route path="/pending-stock" element={<PendingStockHistory />} />
        <Route path="/loading-sheet" element={<LoadingSheetEntry />} />
        <Route path="/trip-sheet" element={<TripSheetList />} />
        <Route path="/tripsheet/new" element={<TripSheetForm />} />
        <Route path="/tripsheet/edit/:id" element={<TripSheetForm />} />
        
        {/* 🟢 Added Route for MainScreen (Settings) */}
        <Route path="/settings" element={<MainScreen />} />

        <Route path="/master" element={<MasterDashboardPage />} />
        <Route path="/master/consignors" element={<ConsignorList />} />
        <Route path="/master/consignees" element={<ConsigneeList />} />
        <Route path="/master/from-places" element={<FromPlaceList />} />
        <Route path="/master/to-places" element={<ToPlacesList />} />
        <Route path="/master/packings" element={<PackingEntryList />} />
        <Route path="/master/contents" element={<ContentList />} />
        <Route path="/master/vehicles" element={<VehicleList />} />
        <Route path="/master/drivers" element={<DriverList />} />
      </Route>

      <Route element={<ProtectedRoute requireAdmin={true} />}>
        <Route path="/users" element={<UserList />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;