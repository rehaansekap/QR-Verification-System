import { create } from 'zustand'
import qrcodeService from '../services/qrcodeService'

const useQRCodeStore = create((set, get) => ({
    // State
    qrcodes: [],
    currentQRCode: null,
    stats: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    },
    filters: {
        search: '',
        status: 'all'
    },

    // Actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Fetch QR codes
    fetchQRCodes: async (params = {}) => {
        set({ loading: true, error: null })

        try {
            const result = await qrcodeService.getQRCodes(params)

            if (result.success) {
                set({
                    qrcodes: result.data.data.qrcodes,
                    pagination: result.data.data.pagination,
                    loading: false
                })
            } else {
                set({
                    error: result.error,
                    loading: false
                })
            }
        } catch (error) {
            set({
                error: 'Failed to fetch QR codes',
                loading: false
            })
        }
    },

    // Create QR code
    createQRCode: async (qrData) => {
        set({ loading: true, error: null })

        try {
            const result = await qrcodeService.createQRCode(qrData)

            if (result.success) {
                // Refresh QR codes list
                await get().fetchQRCodes()
                set({ loading: false })
                return { success: true, data: result.data }
            } else {
                set({
                    error: result.error,
                    loading: false
                })
                return { success: false, error: result.error }
            }
        } catch (error) {
            set({
                error: 'Failed to create QR code',
                loading: false
            })
            return { success: false, error: 'Failed to create QR code' }
        }
    },

    // Get QR code by ID
    fetchQRCodeById: async (id) => {
        set({ loading: true, error: null })

        try {
            const result = await qrcodeService.getQRCodeById(id)

            if (result.success) {
                set({
                    currentQRCode: result.data.data.qrcode,
                    loading: false
                })
            } else {
                set({
                    error: result.error,
                    loading: false
                })
            }
        } catch (error) {
            set({
                error: 'Failed to fetch QR code',
                loading: false
            })
        }
    },

    // Update QR code
    updateQRCode: async (id, qrData) => {
        set({ loading: true, error: null })

        try {
            const result = await qrcodeService.updateQRCode(id, qrData)

            if (result.success) {
                // Refresh QR codes list
                await get().fetchQRCodes()
                set({ loading: false })
                return { success: true, data: result.data }
            } else {
                set({
                    error: result.error,
                    loading: false
                })
                return { success: false, error: result.error }
            }
        } catch (error) {
            set({
                error: 'Failed to update QR code',
                loading: false
            })
            return { success: false, error: 'Failed to update QR code' }
        }
    },

    // Delete QR code
    deleteQRCode: async (id) => {
        set({ loading: true, error: null })

        try {
            const result = await qrcodeService.deleteQRCode(id)

            if (result.success) {
                // Refresh QR codes list
                await get().fetchQRCodes()
                set({ loading: false })
                return { success: true }
            } else {
                set({
                    error: result.error,
                    loading: false
                })
                return { success: false, error: result.error }
            }
        } catch (error) {
            set({
                error: 'Failed to delete QR code',
                loading: false
            })
            return { success: false, error: 'Failed to delete QR code' }
        }
    },

    // Fetch statistics
    fetchStats: async () => {
        try {
            const result = await qrcodeService.getQRStats()

            if (result.success) {
                set({ stats: result.data.data })
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        }
    },

    // Update filters
    setFilters: (filters) => {
        set(state => ({
            filters: { ...state.filters, ...filters }
        }))
    },

    // Reset current QR code
    clearCurrentQRCode: () => set({ currentQRCode: null })
}))

export default useQRCodeStore