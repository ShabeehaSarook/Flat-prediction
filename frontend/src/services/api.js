import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const apiService = {
  // Authentication
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData)
    return response.data
  },

  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials)
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  updateProfile: async (userData) => {
    const response = await api.put('/api/auth/profile', userData)
    return response.data
  },

  // Health checks
  checkHealth: async () => {
    const response = await api.get('/api/health')
    return response.data
  },

  checkFlaskHealth: async () => {
    const response = await api.get('/api/health/flask')
    return response.data
  },

  // Features
  getRequiredFeatures: async () => {
    const response = await api.get('/api/predict/features')
    return response.data
  },

  getExampleProperty: async () => {
    const response = await api.get('/api/predict/example')
    return response.data
  },

  validateProperty: async (propertyData) => {
    const response = await api.post('/api/predict/validate', propertyData)
    return response.data
  },

  // Predictions
  predictPrice: async (propertyData) => {
    const response = await api.post('/api/predict', propertyData)
    return response.data
  },

  getPredictionHistory: async () => {
    const response = await api.get('/api/predict/history')
    return response.data
  },

  getAllPredictions: async () => {
    const response = await api.get('/api/predict/all')
    return response.data
  },

  deletePrediction: async (id) => {
    const response = await api.delete(`/api/predict/${id}`)
    return response.data
  },

  // Prediction management (Admin)
  getPredictionStats: async () => {
    const response = await api.get('/api/predict/stats')
    return response.data
  },

  getPredictionById: async (id) => {
    const response = await api.get(`/api/predict/${id}`)
    return response.data
  },

  updatePrediction: async (id, data) => {
    const response = await api.put(`/api/predict/${id}`, data)
    return response.data
  },

  deleteMultiplePredictions: async (predictionIds) => {
    const response = await api.post('/api/predict/delete-multiple', { predictionIds })
    return response.data
  },

  // User management (Admin only)
  getAllUsers: async () => {
    const response = await api.get('/api/auth/users')
    return response.data
  },

  updateUserRole: async (userId, role) => {
    const response = await api.put(`/api/auth/users/${userId}/role`, { role })
    return response.data
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/api/auth/users/${userId}`)
    return response.data
  },

  getUserStats: async () => {
    const response = await api.get('/api/auth/users/stats')
    return response.data
  }
}

export default api
