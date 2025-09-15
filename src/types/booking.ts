export interface BookingData {
  id: string;
  tanggal: string;
  namaPeminjam: string;
  ruangan: string;
  jamMulai: string;
  jamSelesai: string;
  jam?: string; // For backward compatibility
  keterangan: string;
  createdAt: string;
}

export interface BookingFormData {
  tanggal: string;
  namaPeminjam: string;
  ruangan: string;
  jamMulai: string;
  jamSelesai: string;
  keterangan: string;
}