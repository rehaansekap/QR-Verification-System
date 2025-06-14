import jwt from 'jsonwebtoken'
import supabase from '../config/supabase.js'

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            })
        }

        const token = authHeader.substring(7) // Remove 'Bearer ' prefix

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Get user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, email, role, is_active')
            .eq('id', decoded.userId)
            .single()

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            })
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            })
        }

        // Add user to request object
        req.user = user
        next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        })
    }
}

export const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        })
    }
    next()
}