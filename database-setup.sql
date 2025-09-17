-- Table untuk menyimpan data peminjaman ruangan
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL,
  nama_peminjam TEXT NOT NULL,
  ruangan TEXT NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk query yang sering digunakan
CREATE INDEX idx_bookings_tanggal ON bookings(tanggal);
CREATE INDEX idx_bookings_ruangan ON bookings(ruangan);
CREATE INDEX idx_bookings_tanggal_ruangan ON bookings(tanggal, ruangan);

-- RLS (Row Level Security) - Biarkan semua orang bisa melihat semua data
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy untuk baca (semua orang bisa melihat)
CREATE POLICY "Everyone can view bookings" ON bookings FOR SELECT USING (true);

-- Policy untuk insert (semua orang bisa menambah)
CREATE POLICY "Everyone can create bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Policy untuk delete (hanya admin yang bisa hapus - sesuaikan dengan auth system)
CREATE POLICY "Admin can delete bookings" ON bookings FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON bookings TO anon;
GRANT ALL ON bookings TO authenticated;