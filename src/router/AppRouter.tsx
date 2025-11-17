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

// Import Dashboards
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { MasterDashboardPage } from '../features/dashboard/MasterDashboardPage';

import { LoadingScreen } from '../components/shared/LoadingScreen';


// --- AUTH PROTECTION ---
const ProtectedRoute = ({ children, noLayout = false }: { children: React.ReactNode; noLayout?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
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

      {/* Loading Sheet (Injected) */}
      <Route path="/loading-sheet" element={<ProtectedRoute><LoadingSheetEntry /></ProtectedRoute>} />
      
      {/* Placeholders for future Operations screens */}
      <Route path="/trip-sheet" element={<ProtectedRoute><div className="p-8 text-xl text-muted-foreground">Trip Sheet Module (Coming Soon)</div></ProtectedRoute>} />


      {/* ===================================================
          MASTER WORKSPACE (Admin)
         =================================================== */}
      
      {/* Master Dashboard */}
      <Route path="/master" element={<ProtectedRoute><MasterDashboardPage /></ProtectedRoute>} />

      {/* Consignor/Consignee */}
      <Route path="/master/consignors" element={<ProtectedRoute><ConsignorList /></ProtectedRoute>} />
      <Route path="/master/consignees" element={<ProtectedRoute><ConsigneeList /></ProtectedRoute>} />

      {/* From/To Places (Injected) */}
      <Route path="/master/from-places" element={<ProtectedRoute><FromPlaceList /></ProtectedRoute>} />
      <Route path="/master/to-places" element={<ProtectedRoute><ToPlacesList /></ProtectedRoute>} />

      {/* PLACEHOLDERS FOR OTHER MASTERS */}
      <Route 
        path="/master/packings" 
        element={<ProtectedRoute><div className="p-8 text-xl font-bold text-muted-foreground">Packings Entry Screen (Under Construction)</div></ProtectedRoute>} 
      />
      <Route 
        path="/master/contents" 
        element={<ProtectedRoute><div className="p-8 text-xl font-bold text-muted-foreground">Contents Entry Screen (Under Construction)</div></ProtectedRoute>} 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;