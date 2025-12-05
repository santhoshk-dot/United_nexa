import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadingManager } from '../utils/loadingManager'; // 🟢 Import to control the loader

interface NetworkContextType {
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const navigate = useNavigate();
  const location = useLocation();

  // This is instant and won't get blocked by firewalls like Cloudflare might.
  const checkInternetConnection = useCallback(async () => {
    try {
      // 'HEAD' request is very light (headers only, no body)
      // Timestamp prevents caching
      await fetch(`${window.location.origin}/?_=${new Date().getTime()}`, { 
        method: 'HEAD',
        cache: 'no-store',
      });
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // 🟢 2. LESS FREQUENT POLLING
  // We rely on browser events for immediate detection.
  // This interval is just a backup sanity check (every 30s is enough).
  useEffect(() => {
    const interval = setInterval(async () => {
      if (navigator.onLine) {
        const status = await checkInternetConnection();
        setIsOnline(status);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkInternetConnection]);

  // 🟢 3. EVENT LISTENERS (Immediate Reaction)
  useEffect(() => {
    const handleOnline = async () => {
        // Double-check with a real ping to be sure
        const status = await checkInternetConnection();
        setIsOnline(status);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkInternetConnection]);

  // 🟢 4. LOGIC: Handle Offline/Online Transitions
  useEffect(() => {
    if (!isOnline) {
      // --- GOING OFFLINE ---
      
      // 1. KILL THE LOADER: Force hide any "Processing..." screens immediately
      loadingManager.hide();

      // 2. Save location if we aren't already on the offline page
      if (location.pathname !== '/offline') {
        const currentPath = location.pathname + location.search;
        // sessionStorage survives page reloads!
        sessionStorage.setItem('lastOnlinePath', currentPath);
        navigate('/offline');
      }
    } else {
      // --- COMING ONLINE ---
      
      if (location.pathname === '/offline') {
        // Retrieve the saved path or default to dashboard
        const lastPath = sessionStorage.getItem('lastOnlinePath') || '/';
        navigate(lastPath, { replace: true });
      }
    }
  }, [isOnline, navigate, location.pathname, location.search]);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};