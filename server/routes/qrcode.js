import express from 'express'
import {
  createQRCode,
  getQRCodes,
  getQRCodeById,
  updateQRCode,
  deleteQRCode,
  getQRCodeByCode,
  getQRStats,
  createQRValidation,
  getAdvancedAnalytics,
  exportAnalytics,
} from '../controllers/qrcodeController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.get('/verify/:code', getQRCodeByCode)

// Protected admin routes
router.use(authMiddleware)
router.use(adminMiddleware)

// IMPORTANT: Put specific routes BEFORE parameterized routes
router.post('/', createQRValidation, createQRCode)
router.get('/', getQRCodes)
router.get('/stats', getQRStats)
router.get('/analytics', getAdvancedAnalytics)  // Move BEFORE /:id
router.get('/export', exportAnalytics)          // Move BEFORE /:id
router.get('/:id', getQRCodeById)               // Keep /:id routes LAST
router.put('/:id', createQRValidation, updateQRCode)
router.delete('/:id', deleteQRCode)

export default router