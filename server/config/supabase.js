import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

console.log('🔧 Supabase URL:', supabaseUrl)
console.log('🔧 Service Key exists:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
}

// Service role client (for backend operations)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Test connection
async function testConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count').single()
        if (error) {
            console.error('❌ Supabase connection failed:', error.message)
        } else {
            console.log('✅ Supabase connected successfully')
        }
    } catch (err) {
        console.error('❌ Supabase test failed:', err.message)
    }
}

testConnection()

export default supabase