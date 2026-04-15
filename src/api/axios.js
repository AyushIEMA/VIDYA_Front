import axios from 'axios';

const api = axios.create({
  //baseURL: 'http://localhost:8080/api'
  baseURL:' https://vidya-backend-ft93.onrender.com/api'
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthLoginRequest = requestUrl.includes('/auth/login');

    if (error.response?.status === 401 && !isAuthLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
