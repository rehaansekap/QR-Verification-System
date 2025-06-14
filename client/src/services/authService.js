import api from './api'

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      }
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get profile'
      }
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout')
      return { success: true }
    } catch (error) {
      // Even if logout fails on server, we still clear local storage
      return { success: true }
    }
  },

  // Register new user (admin only)
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      }
    }
  }
}

export default authService