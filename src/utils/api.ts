// src/utils/api.ts
import axios from 'axios';
import { loadingManager } from './loadingManager';

const API_URL = 'https://united-transport-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: (params) => {
    const parts: string[] = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val === null || typeof val === 'undefined') return;
      if (Array.isArray(val)) {
        val.forEach((v) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`));
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
      }
    });
    return parts.join('&');
  },
});

// --- HELPER: Generate Dynamic Message ---
const getLoadingMessage = (method: string = 'GET', url: string = '') => {
  // Priority: Specific URL checks
  if (url.includes('/auth/login')) return 'Authenticating...';
  if (url.includes('/report')) return 'Generating Report...';

  // Fallback: Method based checks
  switch (method.toUpperCase()) {
    case 'POST': return 'Saving Data...';
    case 'PUT': return 'Updating Records...';
    case 'DELETE': return 'Deleting Entry...';
    case 'GET': return 'Fetching Data...';
    default: return 'Processing Request...';
  }
};

// 1. Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Calculate the dynamic message
    const msg = getLoadingMessage(config.method, config.url);
    
    // Trigger loader with the message
    loadingManager.show(msg);

    const userInfo = localStorage.getItem('authUser');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    loadingManager.hide();
    return Promise.reject(error);
  }
);

// 2. Response Interceptor
api.interceptors.response.use(
  (response) => {
    loadingManager.hide();
    if (response.data) response.data = transformId(response.data);
    return response;
  },
  (error) => {
    loadingManager.hide();
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authYear');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ID Helper (unchanged)
const transformId = (data: any): any => {
  if (Array.isArray(data)) return data.map(transformId);
  else if (data !== null && typeof data === 'object') {
    const { _id, ...rest } = data;
    const newObj = _id ? { ...rest, id: _id } : { ...rest };
    Object.keys(newObj).forEach((key) => { newObj[key] = transformId(newObj[key]); });
    return newObj;
  }
  return data;
};

export default api;