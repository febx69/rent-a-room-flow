import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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