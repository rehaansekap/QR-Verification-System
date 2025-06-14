import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

// Import routes
import authRoutes from './routes/auth.js'
import qrcodeRoutes from './routes/qrcode.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.CLIENT_URL]
        : ['http://localhost:5173'],
    credentials: true
}))

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        message: 'QR Verification Server is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/qrcode', qrcodeRoutes)

// Default route
app.get('/', (req, res) => {
    res.json({ message: 'QR Verification API Server' })
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    })
})

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' })
})

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📱 Environment: ${process.env.NODE_ENV}`)
    console.log(`🗄️ Database: Connected to Supabase`)
})