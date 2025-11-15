import axios from 'axios';

// Use environment variable for production, fallback to relative path for development
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Only handle 401 errors (unauthorized) - don't redirect on other errors
    const status = error.response?.status || error.status;
    if (status === 401) {
      // Only clear auth if we're not already on login/signup page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use replace to avoid adding to history
        window.location.replace('/login');
      }
    }
    // Return error in a consistent format
    return Promise.reject(error.response?.data || error.data || { message: error.message || 'An error occurred' });
  }
);

export const apiService = {
  // Auth
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),

  // Jobs
  getJobs: (params = {}) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  getMyJobs: () => api.get('/jobs/my-jobs'),
  createJob: (jobData) => api.post('/jobs', jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  deleteJob: (id) => api.delete(`/jobs/${id}`),

  // Applications
  applyForJob: (formData) => {
    const token = localStorage.getItem('token');
    return axios.post(`${API_BASE_URL}/applications`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  getMyApplications: () => api.get('/applications/my-applications'),
  getJobApplications: (jobId) => api.get(`/applications/job/${jobId}`),
  updateApplicationStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),

  // Users
  getProfile: () => api.get('/users/profile'),
  updateProfile: (formData) => {
    const token = localStorage.getItem('token');
    return axios.put(`${API_BASE_URL}/users/profile`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  getUser: (id) => api.get(`/users/${id}`),

  // Admin
  getAllUsers: () => api.get('/admin/users'),
  blockUser: (id) => api.put(`/admin/users/${id}/block`),
  getAllJobs: () => api.get('/admin/jobs'),
  updateJobStatus: (id, status) => api.put(`/admin/jobs/${id}/status`, { status }),
  deleteJobAdmin: (id) => api.delete(`/admin/jobs/${id}`),
  getAdminStats: () => api.get('/admin/stats'),

  // Chat
  getConversations: (jobId) => {
    const params = jobId ? { jobId } : {};
    return api.get('/chat/conversations', { params });
  },
  getMessages: (userId, jobId) => {
    const params = jobId ? { jobId } : {};
    return api.get(`/chat/messages/${userId}`, { params });
  },
  getJobConversations: (jobId) => api.get(`/chat/job/${jobId}/conversations`),
  getMyApplicationConversations: () => api.get('/chat/my-application-conversations'),
  canSendMessage: (userId, jobId) => {
    const params = jobId ? { jobId } : {};
    return api.get(`/chat/can-send-message/${userId}`, { params });
  },
};

export default apiService;

