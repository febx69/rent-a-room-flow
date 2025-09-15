export interface BookingData {
  id: string;
  tanggal: string;
  namaPeminjam: string;
  ruangan: string;
  jam: string;
  keterangan: string;
  createdAt: string;
}

export interface BookingFormData {
  tanggal: string;
  namaPeminjam: string;
  ruangan: string;
  jam: string;
  keterangan: string;
}