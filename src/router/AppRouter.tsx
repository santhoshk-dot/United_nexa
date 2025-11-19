import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

// Import Existing Features
import { LoginScreen } from '../features/auth/LoginScreen';
import { ConsignorList } from '../features/consignors/ConsignorList';
import { ConsigneeList } from '../features/consignees/ConsigneeList';
import { GcEntryList } from '../features/gc-entry/GcEntryList';
import { GcEntryForm } from '../features/gc-entry/GcEntryForm';
import { PendingStockHistory } from '../features/pending-stock/PendingStockHistory';

// Import New Features (Injected)
import { LoadingSheetEntry } from '../features/loading-sheet/LoadingSheetEntry';
import { FromPlaceList } from '../features/from-places-entry/FromPlacesList';
import { ToPlacesList } from '../features/to-places-entry/ToPlacesList';

// --- NEW IMPORTS FOR RECENTLY ADDED MODULES ---
import { PackingEntryList } from '../features/packing-entry/PackingUnitList';
import { ContentList } from '../features/content-entry/ContentList';
import { TripSheetList } from '../features/trip-sheet-entry/TripSheetList';
import { TripSheetForm } from '../features/trip-sheet-entry/TripSheetForm';
// -----------------------------------------------

// Import Dashboards
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { MasterDashboardPage } from '../features/dashboard/MasterDashboardPage';

import { LoadingScreen } from '../components/shared/LoadingScreen';

// Import User Management
import { UserList } from '../features/users/UserList';


// --- AUTH PROTECTION ---
const ProtectedRoute = ({ children, noLayout = false, requireAdmin = false }: { children: React.ReactNode; noLayout?: boolean; requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  // Role Check for Admin routes
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

const LogoutRoute = () => {
  const { logout } = useAuth();
  useEffect(() => { logout(); }, [logout]);
  return <LoadingScreen />;
}

// --- ROUTER DEFINITION ---
const AppRouter = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/logout" element={<LogoutRoute />} />

      {/* ===================================================
          OPERATIONS WORKSPACE (Default)
         =================================================== */}
      
      {/* Main Dashboard */}
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      {/* GC Entry */}
      <Route path="/gc-entry" element={<ProtectedRoute><GcEntryList /></ProtectedRoute>} />
      <Route path="/gc-entry/new" element={<ProtectedRoute><GcEntryForm /></ProtectedRoute>} />
      <Route path="/gc-entry/edit/:gcNo" element={<ProtectedRoute><GcEntryForm /></ProtectedRoute>} />
      
      {/* Pending Stock */}
      <Route path="/pending-stock" element={<ProtectedRoute><PendingStockHistory /></ProtectedRoute>} />

      {/* Loading Sheet */}
      <Route path="/loading-sheet" element={<ProtectedRoute><LoadingSheetEntry /></ProtectedRoute>} />
      
      {/* --- TRIP SHEET MODULE ROUTES --- */}
      {/* List View (Matches Sidebar Link) */}
      <Route path="/trip-sheet" element={<ProtectedRoute><TripSheetList /></ProtectedRoute>} />
      
      {/* Create/Edit Forms (Matches Internal Navigation) */}
      <Route path="/tripsheet/new" element={<ProtectedRoute><TripSheetForm /></ProtectedRoute>} />
      <Route path="/tripsheet/edit/:id" element={<ProtectedRoute><TripSheetForm /></ProtectedRoute>} />
      
     


      {/* ===================================================
          MASTER WORKSPACE (Admin)
         =================================================== */}
      
      {/* Master Dashboard */}
      <Route path="/master" element={<ProtectedRoute><MasterDashboardPage /></ProtectedRoute>} />

      {/* Consignor/Consignee */}
      <Route path="/master/consignors" element={<ProtectedRoute><ConsignorList /></ProtectedRoute>} />
      <Route path="/master/consignees" element={<ProtectedRoute><ConsigneeList /></ProtectedRoute>} />

      {/* From/To Places */}
      <Route path="/master/from-places" element={<ProtectedRoute><FromPlaceList /></ProtectedRoute>} />
      <Route path="/master/to-places" element={<ProtectedRoute><ToPlacesList /></ProtectedRoute>} />

      {/* --- NEW MASTER ROUTES --- */}
      <Route 
        path="/master/packings" 
        element={<ProtectedRoute><PackingEntryList /></ProtectedRoute>} 
      />
      <Route 
        path="/master/contents" 
        element={<ProtectedRoute><ContentList /></ProtectedRoute>} 
      />

      {/* User Management (Admin Only) */}
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