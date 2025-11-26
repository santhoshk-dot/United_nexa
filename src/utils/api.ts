import axios from 'axios';

// Base URL matches your backend server port
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Add the JWT Token to every request
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('authUser');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Map MongoDB '_id' to frontend 'id'
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = transformId(response.data);
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized (Token expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authYear');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper to recursively transform _id to id
const transformId = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(transformId);
  } else if (data !== null && typeof data === 'object') {
    const { _id, ...rest } = data;
    const newObj = _id ? { ...rest, id: _id } : { ...rest };
    
    // Recursively process nested objects
    Object.keys(newObj).forEach((key) => {
      newObj[key] = transformId(newObj[key]);
    });
    return newObj;
  }
  return data;
};

export default api;