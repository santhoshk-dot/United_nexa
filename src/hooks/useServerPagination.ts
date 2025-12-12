import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

interface PaginationState<T> {
  data: T[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface UseServerPaginationProps {
  endpoint: string;
  initialItemsPerPage?: number;
  initialFilters?: Record<string, any>;
  debounceDelay?: number; // New prop for custom delay
  skipLoader?: boolean;   // <--- NEW PROP
}

export const useServerPagination = <T>({ 
  endpoint, 
  initialItemsPerPage = 10, 
  initialFilters = {},
  debounceDelay = 500, // Default 500ms delay
  skipLoader = false   // <--- DEFAULT TO FALSE
}: UseServerPaginationProps) => {
  const [state, setState] = useState<PaginationState<T>>({
    data: [],
    loading: false,
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
  });
  
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  
  // Immediate filters (updated by UI)
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  
  // Debounced filters (used for API calls)
  const [debouncedFilters, setDebouncedFilters] = useState<Record<string, any>>(initialFilters);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Debounce Logic: Update debouncedFilters after delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, debounceDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [filters, debounceDelay]);

  // 2. Fetch Logic: Depends on debouncedFilters
  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(debouncedFilters).filter(([_, v]) => v !== '' && v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true))
      );

      const params = {
        page: state.currentPage,
        limit: itemsPerPage,
        ...cleanFilters
      };

      const { data } = await api.get(endpoint, {
        params,
        signal: abortControllerRef.current.signal,
        skipLoader // <--- PASSING THE FLAG
      } as any); // Cast to any if Typescript complains about skipLoader
      
      setState(prev => ({
        ...prev,
        data: data.data || [],
        totalPages: data.pages || 0,
        totalItems: data.total || 0,
        loading: false
      }));
    } catch (error: any) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        return;
      }
      console.error(`Error fetching data from ${endpoint}`, error);
      setState(prev => ({ ...prev, loading: false, data: [] }));
    }
  }, [endpoint, state.currentPage, itemsPerPage, debouncedFilters, refreshTrigger, skipLoader]);

  // 3. Trigger Fetch when Debounced Filters Change
  useEffect(() => {
    fetchData();
    return () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchData]);

  const setCurrentPage = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to page 1 immediately on filter interaction
    setCurrentPage(1); 
  };

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  return {
    ...state,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    setFilters: handleFilterChange,
    filters, // Return immediate filters for UI inputs (so typing shows immediately)
    refresh
  };
};