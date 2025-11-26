import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

interface PaginationState<T> {
  data: T[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export const useServerPagination = <T>(endpoint: string, initialItemsPerPage = 10) => {
  const [state, setState] = useState<PaginationState<T>>({
    data: [],
    loading: false,
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
  });
  
  const [search, setSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const { data } = await api.get(endpoint, {
        params: {
          page: state.currentPage,
          limit: itemsPerPage,
          search: search
        }
      });
      
      setState(prev => ({
        ...prev,
        data: data.data || [],
        totalPages: data.pages || 0,
        totalItems: data.total || 0,
        loading: false
      }));
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}`, error);
      setState(prev => ({ ...prev, loading: false, data: [] }));
    }
  }, [endpoint, state.currentPage, itemsPerPage, search, refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setCurrentPage = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  return {
    ...state,
    search,
    setSearch,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    refresh
  };
};