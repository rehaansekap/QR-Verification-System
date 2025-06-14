import { body, validationResult } from 'express-validator'
import QRCode from 'qrcode'
import crypto from 'crypto'
import supabase from '../config/supabase.js'
import puppeteer from 'puppeteer'

// Validation rules
export const createQRValidation = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('data').isObject().withMessage('Data must be an object'),
  body('expires_at').optional().isISO8601().withMessage('Invalid expiration date')
]

// Generate unique QR code
const generateUniqueCode = () => {
  return crypto.randomBytes(16).toString('hex')
}

// Create QR Code
export const createQRCode = async (req, res) => {
  try {
    console.log('🔢 Creating QR Code:', req.body)

    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      })
    }

    const { title, description, data, expires_at } = req.body
    const userId = req.user.id

    // Generate unique code
    let uniqueCode
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      uniqueCode = generateUniqueCode()

      const { data: existing } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('code', uniqueCode)
        .single()

      if (!existing) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique code'
      })
    }

    // Create verification URL
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const verificationUrl = `${baseUrl}/verify/${uniqueCode}`

    // Generate QR code image
    const qrOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 512
    }

    const qrImageDataUrl = await QRCode.toDataURL(verificationUrl, qrOptions)

    // Save to database
    const { data: qrCodeData, error } = await supabase
      .from('qr_codes')
      .insert({
        code: uniqueCode,
        title,
        description,
        data: JSON.stringify(data),
        qr_image_url: qrImageDataUrl,
        created_by: userId,
        expires_at: expires_at || null
      })
      .select('*')
      .single()

    if (error) {
      console.error('Create QR code error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to create QR code'
      })
    }

    // Parse data back to object
    qrCodeData.data = JSON.parse(qrCodeData.data)

    console.log('✅ QR Code created successfully:', qrCodeData.id)

    res.status(201).json({
      success: true,
      message: 'QR code created successfully',
      data: {
        qrcode: qrCodeData,
        verification_url: verificationUrl
      }
    })

  } catch (error) {
    console.error('Create QR code error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Get all QR codes
export const getQRCodes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('qr_codes')
      .select(`
        *,
        users!qr_codes_created_by_fkey(username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,code.ilike.%${search}%`)
    }

    // Apply status filter
    if (status !== 'all') {
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'inactive') {
        query = query.eq('is_active', false)
      } else if (status === 'expired') {
        query = query.lt('expires_at', new Date().toISOString())
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: qrCodes, error, count } = await query

    if (error) {
      console.error('Get QR codes error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch QR codes'
      })
    }

    // Parse data field for each QR code
    const parsedQRCodes = qrCodes.map(qr => ({
      ...qr,
      data: JSON.parse(qr.data || '{}')
    }))

    res.json({
      success: true,
      data: {
        qrcodes: parsedQRCodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get QR codes error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Get QR code by ID
export const getQRCodeById = async (req, res) => {
  try {
    const { id } = req.params

    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select(`
        *,
        users!qr_codes_created_by_fkey(username),
        verifications(*)
      `)
      .eq('id', id)
      .single()

    if (error || !qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      })
    }

    // Parse data field
    qrCode.data = JSON.parse(qrCode.data || '{}')

    res.json({
      success: true,
      data: {
        qrcode: qrCode
      }
    })

  } catch (error) {
    console.error('Get QR code error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Update QR code
export const updateQRCode = async (req, res) => {
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

    const { id } = req.params
    const { title, description, data, expires_at, is_active } = req.body

    // Check if QR code exists
    const { data: existingQR, error: fetchError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingQR) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      })
    }

    // Update QR code
    const { data: updatedQR, error } = await supabase
      .from('qr_codes')
      .update({
        title,
        description,
        data: JSON.stringify(data),
        expires_at: expires_at || null,
        is_active: is_active !== undefined ? is_active : existingQR.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Update QR code error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to update QR code'
      })
    }

    // Parse data field
    updatedQR.data = JSON.parse(updatedQR.data)

    res.json({
      success: true,
      message: 'QR code updated successfully',
      data: {
        qrcode: updatedQR
      }
    })

  } catch (error) {
    console.error('Update QR code error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Delete QR code
export const deleteQRCode = async (req, res) => {
  try {
    const { id } = req.params

    // Check if QR code exists
    const { data: existingQR, error: fetchError } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingQR) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      })
    }

    // Delete QR code (this will also delete related verifications due to CASCADE)
    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete QR code error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to delete QR code'
      })
    }

    res.json({
      success: true,
      message: 'QR code deleted successfully'
    })

  } catch (error) {
    console.error('Delete QR code error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Get QR code by code (for verification)
export const getQRCodeByCode = async (req, res) => {
  try {
    const { code } = req.params
    const clientIP = req.ip || req.connection.remoteAddress
    const userAgent = req.get('User-Agent')

    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      })
    }

    // Check if QR code is active
    if (!qrCode.is_active) {
      return res.status(400).json({
        success: false,
        message: 'QR code is inactive'
      })
    }

    // Check if QR code is expired
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'QR code has expired'
      })
    }

    // Record verification
    await supabase
      .from('verifications')
      .insert({
        qr_code_id: qrCode.id,
        ip_address: clientIP,
        user_agent: userAgent,
        device_info: {
          ip: clientIP,
          userAgent: userAgent,
          timestamp: new Date().toISOString()
        }
      })

    // Update scan count
    await supabase
      .from('qr_codes')
      .update({
        scan_count: (qrCode.scan_count || 0) + 1
      })
      .eq('id', qrCode.id)

    // Parse data field
    qrCode.data = JSON.parse(qrCode.data || '{}')

    res.json({
      success: true,
      message: 'QR code verified successfully',
      data: {
        qrcode: {
          id: qrCode.id,
          code: qrCode.code,
          title: qrCode.title,
          description: qrCode.description,
          data: qrCode.data,
          created_at: qrCode.created_at,
          scan_count: (qrCode.scan_count || 0) + 1
        }
      }
    })

  } catch (error) {
    console.error('Verify QR code error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Get QR code statistics
export const getQRStats = async (req, res) => {
  try {
    // Total QR codes
    const { count: totalQRCodes } = await supabase
      .from('qr_codes')
      .select('*', { count: 'exact', head: true })

    // Active QR codes
    const { count: activeQRCodes } = await supabase
      .from('qr_codes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total scans
    const { count: totalScans } = await supabase
      .from('verifications')
      .select('*', { count: 'exact', head: true })

    // Scans today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: scansToday } = await supabase
      .from('verifications')
      .select('*', { count: 'exact', head: true })
      .gte('verified_at', today.toISOString())

    // Recent scans (last 7 days)
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    const { data: recentScans } = await supabase
      .from('verifications')
      .select(`
        verified_at,
        qr_codes(title, code)
      `)
      .gte('verified_at', lastWeek.toISOString())
      .order('verified_at', { ascending: false })
      .limit(10)

    res.json({
      success: true,
      data: {
        stats: {
          total_qr_codes: totalQRCodes || 0,
          active_qr_codes: activeQRCodes || 0,
          total_scans: totalScans || 0,
          scans_today: scansToday || 0
        },
        recent_scans: recentScans || []
      }
    })

  } catch (error) {
    console.error('Get QR stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Get advanced analytics
export const getAdvancedAnalytics = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query

    // Calculate date range
    let startDate = new Date()
    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Get scans by day
    const { data: scansByDay } = await supabase
      .from('verifications')
      .select('verified_at')
      .gte('verified_at', startDate.toISOString())
      .order('verified_at', { ascending: true })

    // Process scans by day
    const dailyScans = {}
    scansByDay?.forEach(scan => {
      const date = new Date(scan.verified_at).toISOString().split('T')[0]
      dailyScans[date] = (dailyScans[date] || 0) + 1
    })

    // Generate complete date range
    const scansByDayArray = []
    const days = timeRange === '24h' ? 1 : (timeRange === '7d' ? 7 : (timeRange === '30d' ? 30 : 90))

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      scansByDayArray.push({
        date: dateStr,
        scans: dailyScans[dateStr] || 0
      })
    }

    // Get hourly activity (last 24 hours)
    const last24Hours = new Date()
    last24Hours.setHours(last24Hours.getHours() - 24)

    const { data: hourlyData } = await supabase
      .from('verifications')
      .select('verified_at')
      .gte('verified_at', last24Hours.toISOString())

    const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({ hour: i, scans: 0 }))
    hourlyData?.forEach(scan => {
      const hour = new Date(scan.verified_at).getHours()
      hourlyActivity[hour].scans++
    })

    // Get top performing QR codes
    const { data: topQRCodes } = await supabase
      .from('qr_codes')
      .select('id, title, scan_count')
      .order('scan_count', { ascending: false })
      .limit(5)

    // Get device type statistics (mock for now, would need user-agent parsing)
    const totalScans = scansByDay?.length || 0
    const deviceTypes = [
      { type: 'Mobile', count: Math.floor(totalScans * 0.65), percentage: 65 },
      { type: 'Desktop', count: Math.floor(totalScans * 0.29), percentage: 29 },
      { type: 'Tablet', count: Math.floor(totalScans * 0.06), percentage: 6 }
    ]

    // Get basic stats
    const { data: basicStats } = await supabase
      .from('qr_codes')
      .select('id, scan_count, is_active')

    const totalQRCodes = basicStats?.length || 0
    const activeQRCodes = basicStats?.filter(qr => qr.is_active).length || 0
    const totalScansCount = basicStats?.reduce((sum, qr) => sum + (qr.scan_count || 0), 0) || 0

    // Today's scans
    const today = new Date().toISOString().split('T')[0]
    const scansToday = dailyScans[today] || 0

    res.json({
      success: true,
      data: {
        timeRange,
        stats: {
          total_qr_codes: totalQRCodes,
          active_qr_codes: activeQRCodes,
          total_scans: totalScansCount,
          scans_today: scansToday,
          avg_daily_scans: Math.round(totalScansCount / 30)
        },
        scansByDay: scansByDayArray,
        hourlyActivity,
        topQRCodes: topQRCodes?.map(qr => ({
          title: qr.title,
          scans: qr.scan_count || 0
        })) || [],
        deviceTypes
      }
    })

  } catch (error) {
    console.error('Get advanced analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
};

// Helper function untuk get analytics data (TANPA req/res)
const getAnalyticsDataHelper = async (timeRange = '7d') => {
  try {
    // Calculate date range
    let startDate = new Date()
    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Get scans by day
    const { data: scansByDay } = await supabase
      .from('verifications')
      .select('verified_at')
      .gte('verified_at', startDate.toISOString())
      .order('verified_at', { ascending: true })

    // Process scans by day
    const dailyScans = {}
    scansByDay?.forEach(scan => {
      const date = new Date(scan.verified_at).toISOString().split('T')[0]
      dailyScans[date] = (dailyScans[date] || 0) + 1
    })

    // Generate complete date range
    const scansByDayArray = []
    const days = timeRange === '24h' ? 1 : (timeRange === '7d' ? 7 : (timeRange === '30d' ? 30 : 90))

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      scansByDayArray.push({
        date: dateStr,
        scans: dailyScans[dateStr] || 0
      })
    }

    // Get hourly activity (last 24 hours)
    const last24Hours = new Date()
    last24Hours.setHours(last24Hours.getHours() - 24)

    const { data: hourlyData } = await supabase
      .from('verifications')
      .select('verified_at')
      .gte('verified_at', last24Hours.toISOString())

    const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({ hour: i, scans: 0 }))
    hourlyData?.forEach(scan => {
      const hour = new Date(scan.verified_at).getHours()
      hourlyActivity[hour].scans++
    })

    // Get top performing QR codes
    const { data: topQRCodes } = await supabase
      .from('qr_codes')
      .select('id, title, scan_count')
      .order('scan_count', { ascending: false })
      .limit(5)

    // Get device type statistics
    const totalScans = scansByDay?.length || 0
    const deviceTypes = [
      { type: 'Mobile', count: Math.floor(totalScans * 0.65), percentage: 65 },
      { type: 'Desktop', count: Math.floor(totalScans * 0.29), percentage: 29 },
      { type: 'Tablet', count: Math.floor(totalScans * 0.06), percentage: 6 }
    ]

    // Get basic stats
    const { data: basicStats } = await supabase
      .from('qr_codes')
      .select('id, scan_count, is_active')

    const totalQRCodes = basicStats?.length || 0
    const activeQRCodes = basicStats?.filter(qr => qr.is_active).length || 0
    const totalScansCount = basicStats?.reduce((sum, qr) => sum + (qr.scan_count || 0), 0) || 0

    // Today's scans
    const today = new Date().toISOString().split('T')[0]
    const scansToday = dailyScans[today] || 0

    return {
      timeRange,
      stats: {
        total_qr_codes: totalQRCodes,
        active_qr_codes: activeQRCodes,
        total_scans: totalScansCount,
        scans_today: scansToday,
        avg_daily_scans: Math.round(totalScansCount / 30)
      },
      scansByDay: scansByDayArray,
      hourlyActivity,
      topQRCodes: topQRCodes?.map(qr => ({
        title: qr.title,
        scans: qr.scan_count || 0
      })) || [],
      deviceTypes
    }

  } catch (error) {
    console.error('Get analytics data helper error:', error)
    throw error
  }
}

// Export analytics data
export const exportAnalytics = async (req, res) => {
  try {
    const { format = 'csv', timeRange = '7d' } = req.query

    console.log(`📊 Exporting analytics: format=${format}, timeRange=${timeRange}`);

    // Get analytics data using helper function
    const analyticsData = await getAnalyticsDataHelper(timeRange)

    // Calculate date range for verifications
    let startDate = new Date()
    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
    }

    // Get detailed verification data
    const { data: verifications } = await supabase
      .from('verifications')
      .select(`
        *,
        qr_codes(title, code, data)
      `)
      .gte('verified_at', startDate.toISOString())
      .order('verified_at', { ascending: false })

    if (format === 'csv') {
      const csvData = [
        ['Date', 'Time', 'QR Code', 'Title', 'Type', 'IP Address'],
        ...verifications.map(v => [
          new Date(v.verified_at).toLocaleDateString(),
          new Date(v.verified_at).toLocaleTimeString(),
          v.qr_codes?.code || '',
          v.qr_codes?.title || '',
          v.qr_codes?.data?.type || '',
          v.ip_address || ''
        ])
      ].map(row => row.join(',')).join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`)
      res.send(csvData)
    }
    else if (format === 'json') {
      res.json({
        success: true,
        data: {
          summary: analyticsData,
          verifications: verifications,
          exported_at: new Date().toISOString(),
          time_range: timeRange
        }
      })
    }
    else if (format === 'pdf') {
      console.log('🔄 Starting PDF generation...');

      try {
        // Generate PDF
        const pdfBuffer = await generateAnalyticsPDF(analyticsData, verifications, timeRange)

        console.log(`✅ PDF generated successfully, size: ${pdfBuffer.length} bytes`);

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf"`)
        res.setHeader('Content-Length', pdfBuffer.length)
        res.send(pdfBuffer)
      } catch (pdfError) {
        console.error('❌ PDF generation failed:', pdfError);
        res.status(500).json({
          success: false,
          message: 'Failed to generate PDF: ' + pdfError.message
        });
      }
    }
    else {
      res.status(400).json({
        success: false,
        message: 'Invalid format. Supported: csv, json, pdf'
      })
    }

  } catch (error) {
    console.error('Export analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Simple PDF generation tanpa complex HTML
const generateAnalyticsPDF = async (analyticsData, verifications, timeRange) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const htmlContent = `
    <html>
      <body style="font-family: Arial; padding: 40px;">
        <h1>Analytics Report - ${timeRange}</h1>
        <h2>Statistics</h2>
        <p>Total QR Codes: ${analyticsData.stats?.total_qr_codes || 0}</p>
        <p>Total Scans: ${analyticsData.stats?.total_scans || 0}</p>
        <p>Scans Today: ${analyticsData.stats?.scans_today || 0}</p>
        
        <h2>Recent Verifications</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr>
            <th>Date</th>
            <th>QR Code</th>
            <th>Title</th>
          </tr>
          ${verifications?.slice(0, 10).map(v => `
            <tr>
              <td>${new Date(v.verified_at).toLocaleDateString()}</td>
              <td>${v.qr_codes?.code?.substring(0, 8) || 'N/A'}</td>
              <td>${v.qr_codes?.title || 'Unknown'}</td>
            </tr>
          `).join('') || '<tr><td colspan="3">No data</td></tr>'}
        </table>
        
        <p style="margin-top: 50px; text-align: center; color: #666;">
          Generated on ${new Date().toLocaleString()}
        </p>
      </body>
    </html>
  `;

  await page.setContent(htmlContent);
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdf;
};

// Helper function untuk generate PDF
// const generateAnalyticsPDF = async (analyticsData, verifications, timeRange) => {
//   let browser = null;

//   try {
//     // Launch browser with better configuration
//     browser = await puppeteer.launch({
//       headless: 'new',
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage',
//         '--disable-web-security',
//         '--disable-features=VizDisplayCompositor'
//       ]
//     });

//     const page = await browser.newPage();

//     // Set viewport
//     await page.setViewport({ width: 1200, height: 800 });

//     // Generate HTML content for PDF
//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="UTF-8">
//         <title>Analytics Report</title>
//         <style>
//           * {
//             margin: 0;
//             padding: 0;
//             box-sizing: border-box;
//           }
//           body { 
//             font-family: Arial, sans-serif; 
//             margin: 40px; 
//             color: #333;
//             line-height: 1.6;
//           }
//           .header { 
//             text-align: center; 
//             margin-bottom: 30px; 
//             border-bottom: 2px solid #3b82f6;
//             padding-bottom: 20px;
//           }
//           .header h1 {
//             color: #1f2937;
//             font-size: 28px;
//             margin-bottom: 10px;
//           }
//           .header p {
//             color: #6b7280;
//             font-size: 14px;
//           }
//           .metrics { 
//             display: grid; 
//             grid-template-columns: repeat(2, 1fr); 
//             gap: 20px; 
//             margin: 30px 0; 
//           }
//           .metric-card { 
//             border: 1px solid #e5e7eb; 
//             padding: 20px; 
//             border-radius: 8px; 
//             text-align: center;
//             background: #f9fafb;
//           }
//           .metric-value { 
//             font-size: 32px; 
//             font-weight: bold; 
//             color: #3b82f6; 
//             margin-bottom: 8px;
//           }
//           .metric-label { 
//             font-size: 14px; 
//             color: #6b7280; 
//           }
//           .section { 
//             margin: 40px 0; 
//             page-break-inside: avoid;
//           }
//           .section-title { 
//             font-size: 20px; 
//             font-weight: bold; 
//             margin-bottom: 20px; 
//             color: #1f2937;
//             border-bottom: 1px solid #e5e7eb;
//             padding-bottom: 10px;
//           }
//           table { 
//             width: 100%; 
//             border-collapse: collapse; 
//             margin-top: 15px;
//           }
//           th, td { 
//             border: 1px solid #e5e7eb; 
//             padding: 12px 8px; 
//             text-align: left; 
//             font-size: 12px;
//           }
//           th { 
//             background-color: #f3f4f6; 
//             font-weight: bold;
//             color: #374151;
//           }
//           tr:nth-child(even) {
//             background-color: #f9fafb;
//           }
//           .footer {
//             margin-top: 50px;
//             text-align: center;
//             font-size: 12px;
//             color: #6b7280;
//             border-top: 1px solid #e5e7eb;
//             padding-top: 20px;
//           }
//           .summary-grid {
//             display: grid;
//             grid-template-columns: repeat(2, 1fr);
//             gap: 30px;
//             margin: 30px 0;
//           }
//           .chart-placeholder {
//             background: #f3f4f6;
//             border: 2px dashed #d1d5db;
//             padding: 40px;
//             text-align: center;
//             border-radius: 8px;
//             color: #6b7280;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="header">
//           <h1>QR Code Analytics Report</h1>
//           <p>Time Range: ${timeRange.toUpperCase()} | Generated: ${new Date().toLocaleString()}</p>
//           <p>QR Verification System Analytics Dashboard</p>
//         </div>

//         <div class="metrics">
//           <div class="metric-card">
//             <div class="metric-value">${analyticsData.stats?.total_qr_codes || 0}</div>
//             <div class="metric-label">Total QR Codes</div>
//           </div>
//           <div class="metric-card">
//             <div class="metric-value">${analyticsData.stats?.total_scans || 0}</div>
//             <div class="metric-label">Total Scans</div>
//           </div>
//           <div class="metric-card">
//             <div class="metric-value">${analyticsData.stats?.scans_today || 0}</div>
//             <div class="metric-label">Scans Today</div>
//           </div>
//           <div class="metric-card">
//             <div class="metric-value">${analyticsData.stats?.active_qr_codes || 0}</div>
//             <div class="metric-label">Active QR Codes</div>
//           </div>
//         </div>

//         <div class="summary-grid">
//           <div class="section">
//             <div class="section-title">Top Performing QR Codes</div>
//             ${analyticsData.topQRCodes?.length > 0 ? `
//               <table>
//                 <thead>
//                   <tr>
//                     <th>Rank</th>
//                     <th>Title</th>
//                     <th>Scans</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   ${analyticsData.topQRCodes.map((qr, index) => `
//                     <tr>
//                       <td>${index + 1}</td>
//                       <td>${qr.title || 'Untitled'}</td>
//                       <td>${qr.scans || 0}</td>
//                     </tr>
//                   `).join('')}
//                 </tbody>
//               </table>
//             ` : `
//               <div class="chart-placeholder">
//                 <p>No QR code data available</p>
//               </div>
//             `}
//           </div>

//           <div class="section">
//             <div class="section-title">Device Types</div>
//             ${analyticsData.deviceTypes?.length > 0 ? `
//               <table>
//                 <thead>
//                   <tr>
//                     <th>Device Type</th>
//                     <th>Count</th>
//                     <th>Percentage</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   ${analyticsData.deviceTypes.map(device => `
//                     <tr>
//                       <td>${device.type}</td>
//                       <td>${device.count}</td>
//                       <td>${device.percentage}%</td>
//                     </tr>
//                   `).join('')}
//                 </tbody>
//               </table>
//             ` : `
//               <div class="chart-placeholder">
//                 <p>No device data available</p>
//               </div>
//             `}
//           </div>
//         </div>

//         <div class="section">
//           <div class="section-title">Recent Verifications</div>
//           ${verifications?.length > 0 ? `
//             <table>
//               <thead>
//                 <tr>
//                   <th>Date</th>
//                   <th>Time</th>
//                   <th>QR Code</th>
//                   <th>Title</th>
//                   <th>IP Address</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 ${verifications.slice(0, 15).map(v => `
//                   <tr>
//                     <td>${new Date(v.verified_at).toLocaleDateString()}</td>
//                     <td>${new Date(v.verified_at).toLocaleTimeString()}</td>
//                     <td style="font-family: monospace; font-size: 10px;">${v.qr_codes?.code?.substring(0, 12) || 'N/A'}...</td>
//                     <td>${v.qr_codes?.title || 'Unknown'}</td>
//                     <td>${v.ip_address || 'N/A'}</td>
//                   </tr>
//                 `).join('')}
//               </tbody>
//             </table>
//           ` : `
//             <div class="chart-placeholder">
//               <p>No verification data available</p>
//             </div>
//           `}
//         </div>

//         <div class="section">
//           <div class="section-title">Scans by Day (${timeRange})</div>
//           ${analyticsData.scansByDay?.length > 0 ? `
//             <table>
//               <thead>
//                 <tr>
//                   <th>Date</th>
//                   <th>Scans</th>
//                   <th>Percentage</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 ${analyticsData.scansByDay.map(day => {
//       const maxScans = Math.max(...analyticsData.scansByDay.map(d => d.scans));
//       const percentage = maxScans > 0 ? Math.round((day.scans / maxScans) * 100) : 0;
//       return `
//                     <tr>
//                       <td>${new Date(day.date).toLocaleDateString()}</td>
//                       <td>${day.scans}</td>
//                       <td>${percentage}%</td>
//                     </tr>
//                   `;
//     }).join('')}
//               </tbody>
//             </table>
//           ` : `
//             <div class="chart-placeholder">
//               <p>No daily scan data available</p>
//             </div>
//           `}
//         </div>

//         <div class="footer">
//           <p><strong>QR Verification System</strong> - Analytics Report</p>
//           <p>Generated automatically on ${new Date().toLocaleString()}</p>
//           <p>System Version: 1.0.0 | Report ID: ${Date.now()}</p>
//         </div>
//       </body>
//       </html>
//     `;

//     // Set content with better options
//     await page.setContent(htmlContent, {
//       waitUntil: 'networkidle0',
//       timeout: 30000
//     });

//     // Generate PDF with optimized settings
//     const pdf = await page.pdf({
//       format: 'A4',
//       margin: {
//         top: '20px',
//         bottom: '20px',
//         left: '20px',
//         right: '20px'
//       },
//       printBackground: true,
//       preferCSSPageSize: true
//     });

//     return pdf;

//   } catch (error) {
//     console.error('PDF generation error:', error);
//     throw new Error('Failed to generate PDF: ' + error.message);
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// };

const getAnalyticsData = async (timeRange) => {
  try {
    const { timeRange = '7d' } = req.query

    // Calculate date range
    let startDate = new Date()
    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Get scans by day
    const { data: scansByDay } = await supabase
      .from('verifications')
      .select('verified_at')
      .gte('verified_at', startDate.toISOString())
      .order('verified_at', { ascending: true })

    // Process scans by day
    const dailyScans = {}
    scansByDay?.forEach(scan => {
      const date = new Date(scan.verified_at).toISOString().split('T')[0]
      dailyScans[date] = (dailyScans[date] || 0) + 1
    })

    // Generate complete date range
    const scansByDayArray = []
    const days = timeRange === '24h' ? 1 : (timeRange === '7d' ? 7 : (timeRange === '30d' ? 30 : 90))

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      scansByDayArray.push({
        date: dateStr,
        scans: dailyScans[dateStr] || 0
      })
    }

    // Get hourly activity (last 24 hours)
    const last24Hours = new Date()
    last24Hours.setHours(last24Hours.getHours() - 24)

    const { data: hourlyData } = await supabase
      .from('verifications')
      .select('verified_at')
      .gte('verified_at', last24Hours.toISOString())

    const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({ hour: i, scans: 0 }))
    hourlyData?.forEach(scan => {
      const hour = new Date(scan.verified_at).getHours()
      hourlyActivity[hour].scans++
    })

    // Get top performing QR codes
    const { data: topQRCodes } = await supabase
      .from('qr_codes')
      .select('id, title, scan_count')
      .order('scan_count', { ascending: false })
      .limit(5)

    // Get device type statistics (mock for now, would need user-agent parsing)
    const totalScans = scansByDay?.length || 0
    const deviceTypes = [
      { type: 'Mobile', count: Math.floor(totalScans * 0.65), percentage: 65 },
      { type: 'Desktop', count: Math.floor(totalScans * 0.29), percentage: 29 },
      { type: 'Tablet', count: Math.floor(totalScans * 0.06), percentage: 6 }
    ]

    // Get basic stats
    const { data: basicStats } = await supabase
      .from('qr_codes')
      .select('id, scan_count, is_active')

    const totalQRCodes = basicStats?.length || 0
    const activeQRCodes = basicStats?.filter(qr => qr.is_active).length || 0
    const totalScansCount = basicStats?.reduce((sum, qr) => sum + (qr.scan_count || 0), 0) || 0

    // Today's scans
    const today = new Date().toISOString().split('T')[0]
    const scansToday = dailyScans[today] || 0

    res.json({
      success: true,
      data: {
        timeRange,
        stats: {
          total_qr_codes: totalQRCodes,
          active_qr_codes: activeQRCodes,
          total_scans: totalScansCount,
          scans_today: scansToday,
          avg_daily_scans: Math.round(totalScansCount / 30)
        },
        scansByDay: scansByDayArray,
        hourlyActivity,
        topQRCodes: topQRCodes?.map(qr => ({
          title: qr.title,
          scans: qr.scan_count || 0
        })) || [],
        deviceTypes
      }
    })

  } catch (error) {
    console.error('Get advanced analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}