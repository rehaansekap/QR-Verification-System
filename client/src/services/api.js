import axios from 'axios'

// Determine API URL safely:
// 1. If VITE_API_URL starts with http://, https://, or /api, use it
// 2. Otherwise in production, always use '/api'
// 3. In local development, use 'http://localhost:5000/api'
const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL
    if (envUrl && typeof envUrl === 'string') {
        const trimmed = envUrl.trim()
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
            return trimmed.replace(/\/+$/, '')
        }
    }
    return import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'
}

const API_BASE_URL = getApiBaseUrl()

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export { api }
export default api