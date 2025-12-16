import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { DataProvider } from '../contexts/DataContext'; 
import { LoadingScreen } from '../components/shared/LoadingScreen';
import { OfflinePage } from '../features/misc/OfflinePage';

const load = (importPromise: Promise<any>, componentName: string) => 
  importPromise.then(module => ({ default: module[componentName] }));

// Features -> Auth
const LoginScreen = lazy(() => load(import('../features/auth/LoginScreen'), 'LoginScreen'));

// Features -> Dashboard
const DashboardPage = lazy(() => load(import('../features/operations/dashboard/DashboardPage'), 'DashboardPage'));
const MasterDashboardPage = lazy(() => load(import('../features/operations/dashboard/MasterDashboardPage'), 'MasterDashboardPage'));

// Features -> Operations
const GcEntryList = lazy(() => load(import('../features/operations/gc-entry/GcEntryList'), 'GcEntryList'));
const GcEntryForm = lazy(() => load(import('../features/operations/gc-entry/GcEntryForm'), 'GcEntryForm'));
const LoadingSheetEntry = lazy(() => load(import('../features/operations/loading-sheet/LoadingSheetEntry'), 'LoadingSheetEntry'));
const TripSheetList = lazy(() => load(import('../features/operations/trip-sheet-entry/TripSheetList'), 'TripSheetList'));
const TripSheetForm = lazy(() => load(import('../features/operations/trip-sheet-entry/TripSheetForm'), 'TripSheetForm'));
const PendingStockHistory = lazy(() => load(import('../features/operations/pending-stock/PendingStockHistory'), 'PendingStockHistory'));

// Features -> Masters
const ConsignorList = lazy(() => load(import('../features/master/consignors/ConsignorList'), 'ConsignorList'));
const ConsigneeList = lazy(() => load(import('../features/master/consignees/ConsigneeList'), 'ConsigneeList'));
const FromPlaceList = lazy(() => load(import('../features/master/from-places-entry/FromPlacesList'), 'FromPlaceList'));
const ToPlacesList = lazy(() => load(import('../features/master/to-places-entry/ToPlacesList'), 'ToPlacesList'));
const PackingEntryList = lazy(() => load(import('../features/master/packing-entry/PackingUnitList'), 'PackingEntryList'));
const ContentList = lazy(() => load(import('../features/master/content-entry/ContentList'), 'ContentList'));
const VehicleList = lazy(() => load(import('../features/master/vehicle-details/VehicleList'), 'VehicleList'));
const DriverList = lazy(() => load(import('../features/master/driver-details copy/DriverList'), 'DriverList'));

// Features -> Templates (Settings)
const MainScreen = lazy(() => load(import('../features/master/admin/templates/MainScreen'), 'default'));

// Features -> Admin
const UserList = lazy(() => load(import('../features/master/admin/users/UserList'), 'UserList'));
// 🟢 Audit Logs
const AuditLogPage = lazy(() => load(import('../features/master/admin/audit-logs/AuditLogPage'), 'default'));
// 🟢 NEW: Terms Logs
const TermsLogPage = lazy(() => load(import('../features/master/admin/terms-logs/TermsLogPage'), 'default'));

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
      <Route path="/offline" element={<OfflinePage />} />

      {/* General Protected Routes (User & Admin) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/gc-entry" element={<GcEntryList />} />
        <Route path="/gc-entry/new" element={<GcEntryForm />} />
        <Route path="/gc-entry/edit/:gcNo" element={<GcEntryForm />} />
        <Route path="/pending-stock" element={<PendingStockHistory />} />
        <Route path="/loading-sheet" element={<LoadingSheetEntry />} />
        <Route path="/tripsheet" element={<TripSheetList />} />
        <Route path="/tripsheet/new" element={<TripSheetForm />} />
        <Route path="/tripsheet/edit/:id" element={<TripSheetForm />} />
        
        {/* Master Data Routes */}
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

      {/* 🟢 Admin Only Routes */}
      <Route element={<ProtectedRoute requireAdmin={true} />}>
        {/* Moved Settings here */}
        <Route path="/settings" element={<MainScreen />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/audit-logs" element={<AuditLogPage />} />
        {/* 🟢 NEW: Terms Log Route */}
        <Route path="/terms-logs" element={<TermsLogPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;