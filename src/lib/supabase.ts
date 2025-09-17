import { createClient } from '@supabase/supabase-js'

// Get Supabase config from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Export configuration status
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey)

// Create a mock client if environment variables are not available
// This allows the code to run without errors while you set up Supabase
let supabase: any

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
} else {
  // Mock Supabase client for development
  console.warn('Supabase not configured - using localStorage fallback')
  supabase = {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
      gt: () => ({ data: [], error: null }),
      order: () => ({ data: [], error: null })
    })
  }
}

export { supabase }

// Database types
export interface BookingRow {
  id: string
  tanggal: string
  nama_peminjam: string
  ruangan: string
  jam_mulai: string
  jam_selesai: string
  keterangan: string
  created_at: string
}