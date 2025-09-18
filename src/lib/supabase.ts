import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase belum dikonfigurasi: isi SUPABASE_URL dan SUPABASE_ANON_KEY di src/lib/supabaseConfig.ts')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)


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