import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, CalendarDays } from 'lucide-react';
import { TimePicker24 } from './TimePicker24';
import { BookingFormData } from '@/types/booking';
import { supabase } from '@/lib/supabase';

interface BookingFormProps {
  onBookingAdded: () => void;
}

const ROOMS = [
  'Lantai 1 - Aula Mini',
  'Lantai 2',
  'Lantai 3 - Aula Bhakti Husada'
];

export const BookingForm: React.FC<BookingFormProps> = ({ onBookingAdded }) => {
  const [formData, setFormData] = useState<BookingFormData>({
    tanggal: '',
    namaPeminjam: '',
    ruangan: '',
    jamMulai: '',
    jamSelesai: '',
    keterangan: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValidTime24 = (time: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

  const normalizeTime = (time: string) => {
    const safe = time.replace('.', ':').trim();
    const parts = safe.split(':');
    if (parts.length !== 2) return time;
    let [h, m] = parts;
    h = h.padStart(2, '0');
    m = m.padStart(2, '0');
    return `${h.slice(-2)}:${m.slice(0, 2)}`;
  };

  const checkBookingConflict = async (newBooking: BookingFormData): Promise<string | null> => {
    try {
      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('ruangan', newBooking.ruangan)
        .eq('tanggal', newBooking.tanggal);

      if (error) {
        console.error('Error checking conflicts:', error);
        return null;
      }

      if (!existingBookings) return null;

      for (const booking of existingBookings) {
        const existingStart = booking.jam_mulai;
        const existingEnd = booking.jam_selesai;
        const newStart = newBooking.jamMulai;
        const newEnd = newBooking.jamSelesai;
        
        // Convert time strings to minutes for easier comparison
        const timeToMinutes = (time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };
        
        const existingStartMin = timeToMinutes(existingStart);
        const existingEndMin = timeToMinutes(existingEnd);
        const newStartMin = timeToMinutes(newStart);
        const newEndMin = timeToMinutes(newEnd);
        
        // Check for time overlap
        if (
          (newStartMin >= existingStartMin && newStartMin < existingEndMin) ||
          (newEndMin > existingStartMin && newEndMin <= existingEndMin) ||
          (newStartMin <= existingStartMin && newEndMin >= existingEndMin)
        ) {
          return `Konflik jadwal! ${booking.ruangan} sudah dipesan oleh ${booking.nama_peminjam} pada ${existingStart}-${existingEnd}`;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking booking conflicts:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Normalize and validate 24h time inputs consistently across all devices
    const start = normalizeTime(formData.jamMulai.trim());
    const end = normalizeTime(formData.jamSelesai.trim());

    if (!isValidTime24(start) || !isValidTime24(end)) {
      toast({
        title: "Format jam tidak valid",
        description: "Gunakan format 24 jam HH:MM (contoh 08:00).",
        variant: "destructive",
      });
      return;
    }

    // Optional business constraints
    const MIN = '06:00';
    const MAX = '23:00';
    if (start < MIN || end > MAX) {
      toast({
        title: "Di luar jam operasional",
        description: `Peminjaman hanya diperbolehkan antara ${MIN} - ${MAX}.`,
        variant: "destructive",
      });
      return;
    }

    // Validate time range
    if (end <= start) {
      toast({
        title: "Waktu tidak valid",
        description: "Jam selesai harus lebih besar dari jam mulai.",
        variant: "destructive",
      });
      return;
    }

    const normalizedData: BookingFormData = { ...formData, jamMulai: start, jamSelesai: end };

    // Check for booking conflicts
    const conflictMessage = await checkBookingConflict(normalizedData);
    if (conflictMessage) {
      toast({
        title: "Peminjaman ditolak",
        description: conflictMessage,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            tanggal: normalizedData.tanggal,
            nama_peminjam: normalizedData.namaPeminjam,
            ruangan: normalizedData.ruangan,
            jam_mulai: normalizedData.jamMulai,
            jam_selesai: normalizedData.jamSelesai,
            keterangan: normalizedData.keterangan
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Peminjaman berhasil ditambahkan!",
        description: `Ruang ${normalizedData.ruangan} berhasil dipesan untuk ${normalizedData.tanggal} jam ${normalizedData.jamMulai}-${normalizedData.jamSelesai}`,
      });

      // Reset form
      setFormData({
        tanggal: '',
        namaPeminjam: '',
        ruangan: '',
        jamMulai: '',
        jamSelesai: '',
        keterangan: ''
      });

      onBookingAdded();
    } catch (error) {
      toast({
        title: "Gagal menambahkan peminjaman",
        description: "Terjadi kesalahan saat menyimpan data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Tambah Peminjaman Ruangan</CardTitle>
            <CardDescription>Isi form berikut untuk membuat peminjaman baru</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input
              id="tanggal"
              type="date"
              value={formData.tanggal}
              onChange={(e) => handleInputChange('tanggal', e.target.value)}
              required
              className="transition-all duration-200 focus:shadow-soft"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="namaPeminjam">Nama Peminjam</Label>
            <Input
              id="namaPeminjam"
              type="text"
              placeholder="Masukkan nama peminjam"
              value={formData.namaPeminjam}
              onChange={(e) => handleInputChange('namaPeminjam', e.target.value)}
              required
              className="transition-all duration-200 focus:shadow-soft"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ruangan">Ruangan/Lantai</Label>
            <Select value={formData.ruangan} onValueChange={(value) => handleInputChange('ruangan', value)}>
              <SelectTrigger className="transition-all duration-200 focus:shadow-soft">
                <SelectValue placeholder="Pilih ruangan/lantai" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg z-50">
                {ROOMS.map((room) => (
                  <SelectItem key={room} value={room} className="hover:bg-gray-100 dark:hover:bg-gray-700">{room}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <TimePicker24
              id="jamMulai"
              label="Jam Mulai"
              value={formData.jamMulai}
              onChange={(val) => handleInputChange('jamMulai', val)}
              min="06:00"
              max="22:00"
              stepMinutes={5}
            />
          </div>

          <div className="space-y-2">
            <TimePicker24
              id="jamSelesai"
              label="Jam Selesai"
              value={formData.jamSelesai}
              onChange={(val) => handleInputChange('jamSelesai', val)}
              min="06:00"
              max="23:00"
              stepMinutes={5}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              placeholder="Masukkan keterangan atau keperluan peminjaman"
              value={formData.keterangan}
              onChange={(e) => handleInputChange('keterangan', e.target.value)}
              className="transition-all duration-200 focus:shadow-soft min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              💡 Sistem akan otomatis menolak peminjaman jika terdapat konflik jadwal pada ruangan dan waktu yang sama
            </p>
          </div>

          <div className="md:col-span-2">
            <Button 
              type="submit" 
              className="bg-gradient-primary hover:opacity-90 transition-opacity duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Menyimpan...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Tambah Peminjaman</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};