import api from './api'

export const qrcodeService = {
    // Create new QR code
    createQRCode: async (qrData) => {
        try {
            const response = await api.post('/qrcode', qrData)
            return {
                success: true,
                data: response.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create QR code'
            }
        }
    },

    // Get QR codes with pagination
    getQRCodes: async (params = {}) => {
        try {
            const response = await api.get('/qrcode', { params })
            return {
                success: true,
                data: response.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch QR codes'
            }
        }
    },

    // Get QR code by ID
    getQRCodeById: async (id) => {
        try {
            const response = await api.get(`/qrcode/${id}`)
            return {
                success: true,
                data: response.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch QR code'
            }
        }
    },

    // Update QR code
    updateQRCode: async (id, qrData) => {
        try {
            const response = await api.put(`/qrcode/${id}`, qrData)
            return {
                success: true,
                data: response.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update QR code'
            }
        }
    },

    // Delete QR code
    deleteQRCode: async (id) => {
        try {
            const response = await api.delete(`/qrcode/${id}`)
            return {
                success: true,
                data: response.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete QR code'
            }
        }
    },

    // Verify QR code
    verifyQRCode: async (code) => {
        try {
            const response = await api.get(`/qrcode/verify/${code}`)
            return {
                success: true,
                data: response.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'QR code verification failed'
            }
        }
    },

    // Get QR statistics
    getQRStats: async () => {
        try {
            const response = await api.get('/qrcode/stats')
            return {
                success: true,
                data: response.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch statistics'
            }
        }
    },

    // Get advanced analytics
    getAdvancedAnalytics: async (timeRange = '7d') => {
        try {
            const response = await api.get('/qrcode/analytics', { 
                params: { timeRange } 
            })
            return {
                success: true,
                data: response.data
            }
        } catch (error) {
            console.error('Analytics fetch error:', error)
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch analytics'
            }
        }
    },

    // Export analytics data
    exportAnalytics: async (format = 'csv', timeRange = '7d') => {
        try {
            const response = await api.get('/qrcode/export', {
                params: { format, timeRange },
                responseType: ['csv', 'pdf'].includes(format) ? 'blob' : 'json'
            })
            
            if (format === 'csv') {
                // Handle CSV blob download
                const blob = new Blob([response.data], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                
                return { success: true, message: 'Analytics exported as CSV' }
            }
            else if (format === 'pdf') {
                // Handle PDF blob download
                const blob = new Blob([response.data], { type: 'application/pdf' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                
                return { success: true, message: 'Analytics exported as PDF' }
            }
            else if (format === 'json') {
                // Handle JSON download
                const jsonData = JSON.stringify(response.data, null, 2)
                const blob = new Blob([jsonData], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                
                return { success: true, message: 'Analytics exported as JSON' }
            }
            
            return {
                success: true,
                data: response.data
            }
        } catch (error) {
            console.error('Export error:', error)
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to export analytics'
            }
        }
    }
}

export default qrcodeService