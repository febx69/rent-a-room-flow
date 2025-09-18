import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { BookingData } from '@/types/booking';

interface EditBookingDialogProps {
  booking: BookingData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RUANGAN_OPTIONS = [
  'Lantai 1 - Ruang Rapat',
  'Lantai 1 - Ruang Tunggu',
  'Lantai 2 - Ruang Kepala Dinas',
  'Lantai 2 - Ruang Sekretaris',
  'Lantai 2 - Ruang Staff',
  'Lantai 3 - Aula',
  'Lantai 3 - Ruang Training'
];

export const EditBookingDialog: React.FC<EditBookingDialogProps> = ({
  booking,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    tanggal: '',
    namaPeminjam: '',
    ruangan: '',
    jamMulai: '',
    jamSelesai: '',
    keterangan: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (booking) {
      setFormData({
        tanggal: booking.tanggal,
        namaPeminjam: booking.namaPeminjam,
        ruangan: booking.ruangan,
        jamMulai: booking.jamMulai,
        jamSelesai: booking.jamSelesai,
        keterangan: booking.keterangan
      });
      setSelectedDate(new Date(booking.tanggal));
    }
  }, [booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setIsLoading(true);
    try {
      // Check for conflicts (excluding current booking)
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('*')
        .eq('tanggal', formData.tanggal)
        .eq('ruangan', formData.ruangan)
        .neq('id', booking.id)
        .or(`jam_mulai.lt.${formData.jamSelesai},jam_selesai.gt.${formData.jamMulai}`);

      if (conflicts && conflicts.length > 0) {
        toast({
          title: "Konflik jadwal",
          description: "Ruangan sudah dibooking pada waktu tersebut.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          tanggal: formData.tanggal,
          nama_peminjam: formData.namaPeminjam,
          ruangan: formData.ruangan,
          jam_mulai: formData.jamMulai,
          jam_selesai: formData.jamSelesai,
          keterangan: formData.keterangan
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Peminjaman berhasil diupdate",
        description: "Data peminjaman telah diperbarui.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Gagal mengupdate",
        description: "Terjadi kesalahan saat mengupdate peminjaman.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const formattedDate = format(date, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, tanggal: formattedDate }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Edit Peminjaman Ruangan</DialogTitle>
          <DialogDescription>
            Ubah detail peminjaman ruangan di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "dd MMMM yyyy", { locale: id })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Peminjam</Label>
              <Input
                id="nama"
                value={formData.namaPeminjam}
                onChange={(e) => setFormData(prev => ({ ...prev, namaPeminjam: e.target.value }))}
                placeholder="Masukkan nama peminjam"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ruangan">Ruangan/Lantai</Label>
            <Select 
              value={formData.ruangan} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, ruangan: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih ruangan atau lantai" />
              </SelectTrigger>
              <SelectContent>
                {RUANGAN_OPTIONS.map((ruangan) => (
                  <SelectItem key={ruangan} value={ruangan}>
                    {ruangan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jamMulai">Jam Mulai</Label>
              <Input
                id="jamMulai"
                type="time"
                value={formData.jamMulai}
                onChange={(e) => setFormData(prev => ({ ...prev, jamMulai: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jamSelesai">Jam Selesai</Label>
              <Input
                id="jamSelesai"
                type="time"
                value={formData.jamSelesai}
                onChange={(e) => setFormData(prev => ({ ...prev, jamSelesai: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              value={formData.keterangan}
              onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
              placeholder="Masukkan keterangan peminjaman"
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Menyimpan...' : 'Update Peminjaman'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};