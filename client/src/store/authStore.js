import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(credentials),
                    })

                    const data = await response.json()

                    if (!response.ok) {
                        throw new Error(data.message || 'Login failed')
                    }

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

            logout: () => {
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
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    })

                    if (!response.ok) {
                        throw new Error('Token invalid')
                    }

                    const data = await response.json()

                    set({
                        user: data.data.user,
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
