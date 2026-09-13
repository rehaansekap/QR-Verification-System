import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import authService from '../services/authService'

const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,

            // Actions
            setUser: (user) => set({ user, isAuthenticated: !!user }),

            setToken: (token) => {
                set({ token })
                if (token) {
                    localStorage.setItem('token', token)
                } else {
                    localStorage.removeItem('token')
                }
            },

            setLoading: (loading) => set({ loading }),

            setError: (error) => set({ error }),

            login: async (credentials) => {
                set({ loading: true, error: null })

                try {
                    const result = await authService.login(credentials)

                    if (!result.success) {
                        throw new Error(result.error || 'Login failed')
                    }

                    const data = result.data

                    // Set user and token
                    set({
                        user: data.data.user,
                        token: data.data.token,
                        isAuthenticated: true,
                        loading: false,
                        error: null
                    })

                    // Store token in localStorage
                    localStorage.setItem('token', data.data.token)

                    return { success: true, data }
                } catch (error) {
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        loading: false,
                        error: error.message
                    })
                    return { success: false, error: error.message }
                }
            },

            logout: async () => {
                try {
                    await authService.logout()
                } catch (e) {
                    // Ignore logout failure
                }
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    loading: false,
                    error: null
                })
                localStorage.removeItem('token')
            },

            // Check if user is authenticated on app start
            checkAuth: async () => {
                const token = localStorage.getItem('token')

                if (!token) {
                    set({ isAuthenticated: false })
                    return
                }

                set({ loading: true })

                try {
                    const result = await authService.getProfile()

                    if (!result.success) {
                        throw new Error(result.error || 'Token invalid')
                    }

                    set({
                        user: result.data.data.user,
                        token,
                        isAuthenticated: true,
                        loading: false,
                        error: null
                    })
                } catch (error) {
                    // Token is invalid, clear it
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        loading: false,
                        error: null
                    })
                    localStorage.removeItem('token')
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
)

export default useAuthStore
