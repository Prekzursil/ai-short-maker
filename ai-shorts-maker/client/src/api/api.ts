import axios, { AxiosRequestConfig, AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  validateStatus: (status) => {
    return status >= 200 && status < 300;
  },
});

let accessToken: string | null = null;

// Axios request interceptor: Attach access token to headers
api.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    if (!accessToken) {
      accessToken = localStorage.getItem('accessToken');
    }
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
);

// Axios response interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError): Promise<any> => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if ([401, 403].includes(error.response?.status) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(`/api/auth/refresh`, {
          refreshToken: localStorage.getItem('refreshToken'),
        });
        accessToken = data.data.accessToken;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('accessToken');
        accessToken = null;
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;