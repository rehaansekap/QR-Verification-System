import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import supabase from '../config/supabase.js'

// Validation rules
export const loginValidation = [
    body('username').trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
]

export const registerValidation = [
    body('username').trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
]

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    )
}

// Login controller
export const login = async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body)

        // Check validation errors
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array())
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            })
        }

        const { username, password } = req.body
        console.log('🔍 Looking for user:', username)

        // Get user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single()

        console.log('📊 Database query result:', { user: user ? 'found' : 'not found', error })

        if (error) {
            console.log('❌ Database error:', error)
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            })
        }

        if (!user) {
            console.log('❌ User not found')
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            })
        }

        console.log('👤 User found:', {
            id: user.id,
            username: user.username,
            email: user.email,
            is_active: user.is_active,
            passwordHashExists: !!user.password
        })

        // Check if account is active
        if (!user.is_active) {
            console.log('❌ Account not active')
            return res.status(401).json({
                success: false,
                message: 'Akun tidak aktif'
            })
        }

        // Verify password
        console.log('🔓 Comparing passwords...')
        console.log('Input password:', password)
        console.log('Hash from DB:', user.password)

        const isPasswordValid = await bcrypt.compare(password, user.password)
        console.log('🔐 Password comparison result:', isPasswordValid)

        if (!isPasswordValid) {
            console.log('❌ Password invalid')
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            })
        }

        console.log('✅ Password valid, generating token...')

        // Generate token
        const token = generateToken(user.id)

        // Update last login
        await supabase
            .from('users')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', user.id)

        console.log('✅ Login successful for user:', user.username)

        // Return success response
        res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        })

    } catch (error) {
        console.error('💥 Login error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}

// Register controller (for creating new admin users)
export const register = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            })
        }

        const { username, email, password } = req.body

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${username},email.eq.${email}`)
            .single()

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username atau email sudah digunakan'
            })
        }

        // Hash password
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        // Create user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                username,
                email,
                password: hashedPassword,
                role: 'admin'
            })
            .select('id, username, email, role')
            .single()

        if (error) {
            console.error('Register error:', error)
            return res.status(500).json({
                success: false,
                message: 'Gagal membuat akun'
            })
        }

        res.status(201).json({
            success: true,
            message: 'Akun berhasil dibuat',
            data: {
                user: newUser
            }
        })

    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        })
    } catch (error) {
        console.error('Get profile error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
}

// Logout (client-side will handle token removal)
export const logout = async (req, res) => {
    res.json({
        success: true,
        message: 'Logout berhasil'
    })
}