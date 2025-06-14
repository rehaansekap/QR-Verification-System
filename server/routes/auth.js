import express from 'express'
import {
    login,
    register,
    getProfile,
    logout,
    loginValidation,
    registerValidation
} from '../controllers/authController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/login', loginValidation, login)
router.post('/register', registerValidation, register)

// Protected routes
router.get('/profile', authMiddleware, getProfile)
router.post('/logout', authMiddleware, logout)

export default router