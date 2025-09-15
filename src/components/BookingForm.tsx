import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, CalendarDays } from 'lucide-react';
import { BookingFormData } from '@/types/booking';

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

  const checkBookingConflict = (newBooking: BookingFormData): string | null => {
    const existingBookings = JSON.parse(localStorage.getItem('roomBookings') || '[]');
    
    for (const booking of existingBookings) {
      // Check if same room and same date
      if (booking.ruangan === newBooking.ruangan && booking.tanggal === newBooking.tanggal) {
        const existingStart = booking.jamMulai || booking.jam; // Support old format
        const existingEnd = booking.jamSelesai || booking.jam; // Support old format
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
          return `Konflik jadwal! ${booking.ruangan} sudah dipesan oleh ${booking.namaPeminjam} pada ${existingStart}-${existingEnd}`;
        }
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate time range
    if (formData.jamSelesai <= formData.jamMulai) {
      toast({
        title: "Waktu tidak valid",
        description: "Jam selesai harus lebih besar dari jam mulai.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for booking conflicts
    const conflictMessage = checkBookingConflict(formData);
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const bookingData = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      const existingBookings = JSON.parse(localStorage.getItem('roomBookings') || '[]');
      const updatedBookings = [...existingBookings, bookingData];
      localStorage.setItem('roomBookings', JSON.stringify(updatedBookings));

      toast({
        title: "Peminjaman berhasil ditambahkan!",
        description: `Ruang ${formData.ruangan} berhasil dipesan untuk ${formData.tanggal} jam ${formData.jamMulai}-${formData.jamSelesai}`,
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
            <Label htmlFor="jamMulai">Jam Mulai (Format 24 Jam)</Label>
            <Input
              id="jamMulai"
              type="time"
              value={formData.jamMulai}
              onChange={(e) => handleInputChange('jamMulai', e.target.value)}
              required
              className="transition-all duration-200 focus:shadow-soft"
              step="300"
              min="06:00"
              max="22:00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jamSelesai">Jam Selesai (Format 24 Jam)</Label>
            <Input
              id="jamSelesai"
              type="time"
              value={formData.jamSelesai}
              onChange={(e) => handleInputChange('jamSelesai', e.target.value)}
              required
              className="transition-all duration-200 focus:shadow-soft"
              step="300"
              min="06:00"
              max="23:00"
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