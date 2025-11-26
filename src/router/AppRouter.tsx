import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';

// Import Existing Features
import { LoginScreen } from '../features/auth/LoginScreen';
import { ConsignorList } from '../features/consignors/ConsignorList';
import { ConsigneeList } from '../features/consignees/ConsigneeList';
import { GcEntryList } from '../features/gc-entry/GcEntryList';
import { GcEntryForm } from '../features/gc-entry/GcEntryForm';
import { PendingStockHistory } from '../features/pending-stock/PendingStockHistory';
import { LoadingSheetEntry } from '../features/loading-sheet/LoadingSheetEntry';
import { FromPlaceList } from '../features/from-places-entry/FromPlacesList';
import { ToPlacesList } from '../features/to-places-entry/ToPlacesList';
import { PackingEntryList } from '../features/packing-entry/PackingUnitList';
import { ContentList } from '../features/content-entry/ContentList';
import { TripSheetList } from '../features/trip-sheet-entry/TripSheetList';
import { TripSheetForm } from '../features/trip-sheet-entry/TripSheetForm';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { MasterDashboardPage } from '../features/dashboard/MasterDashboardPage';
import { LoadingScreen } from '../components/shared/LoadingScreen';
import { UserList } from '../features/users/UserList';
import { VehicleList } from '../features/vehicle-details/VehicleList';
import { DriverList } from '../features/driver-details copy/DriverList';

// --- AUTH PROTECTION ---
const ProtectedRoute = ({ children, noLayout = false, requireAdmin = false }: { children: React.ReactNode; noLayout?: boolean; requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />; 
  }

  if (noLayout) return <>{children}</>;
  return <Layout>{children}</Layout>;
};

const LoginRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <LoginScreen />;
};

// --- ROUTER DEFINITION ---
const AppRouter = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginRoute />} />
      {/* Redirect /logout manually to /login just in case someone types it */}
      <Route path="/logout" element={<Navigate to="/login" replace />} />

      {/* ===================================================
          MAIN APPLICATION ROUTES
         =================================================== */}
      
      {/* Main Dashboard (Operations View) */}
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      {/* GC Entry */}
      <Route path="/gc-entry" element={<ProtectedRoute><GcEntryList /></ProtectedRoute>} />
      <Route path="/gc-entry/new" element={<ProtectedRoute><GcEntryForm /></ProtectedRoute>} />
      <Route path="/gc-entry/edit/:gcNo" element={<ProtectedRoute><GcEntryForm /></ProtectedRoute>} />
      
      {/* Pending Stock */}
      <Route path="/pending-stock" element={<ProtectedRoute><PendingStockHistory /></ProtectedRoute>} />

      {/* Loading Sheet */}
      <Route path="/loading-sheet" element={<ProtectedRoute><LoadingSheetEntry /></ProtectedRoute>} />
      
      {/* Trip Sheet */}
      <Route path="/trip-sheet" element={<ProtectedRoute><TripSheetList /></ProtectedRoute>} />
      <Route path="/tripsheet/new" element={<ProtectedRoute><TripSheetForm /></ProtectedRoute>} />
      <Route path="/tripsheet/edit/:id" element={<ProtectedRoute><TripSheetForm /></ProtectedRoute>} />

      {/* ===================================================
          DATA MANAGEMENT (Sub-Menu Items)
         =================================================== */}
      
      {/* Master Dashboard Landing Page */}
      <Route path="/master" element={<ProtectedRoute><MasterDashboardPage /></ProtectedRoute>} />

      <Route path="/master/consignors" element={<ProtectedRoute><ConsignorList /></ProtectedRoute>} />
      <Route path="/master/consignees" element={<ProtectedRoute><ConsigneeList /></ProtectedRoute>} />
      <Route path="/master/from-places" element={<ProtectedRoute><FromPlaceList /></ProtectedRoute>} />
      <Route path="/master/to-places" element={<ProtectedRoute><ToPlacesList /></ProtectedRoute>} />
      <Route path="/master/packings" element={<ProtectedRoute><PackingEntryList /></ProtectedRoute>} />
      <Route path="/master/contents" element={<ProtectedRoute><ContentList /></ProtectedRoute>} />
      
      {/* Vehicle & Driver Management Routes */}
      <Route path="/master/vehicles" element={<ProtectedRoute><VehicleList /></ProtectedRoute>} />
      <Route path="/master/drivers" element={<ProtectedRoute><DriverList /></ProtectedRoute>} />

      {/* Admin - User Management */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <UserList />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;