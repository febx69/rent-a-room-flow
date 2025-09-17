import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, Calendar } from 'lucide-react';
import { BookingData } from '@/types/booking';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface ActiveBookingsProps {
  refreshTrigger: number;
}

export const ActiveBookings: React.FC<ActiveBookingsProps> = ({ refreshTrigger }) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadActiveBookings();
  }, [refreshTrigger]);

  const loadActiveBookings = async () => {
    try {
      if (isSupabaseConfigured) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5);

        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('tanggal', today)
          .gt('jam_selesai', currentTime);

        if (error) {
          console.error('Error loading active bookings:', error);
          return;
        }

        const transformedData = data?.map(booking => ({
          id: booking.id,
          tanggal: booking.tanggal,
          namaPeminjam: booking.nama_peminjam,
          ruangan: booking.ruangan,
          jamMulai: booking.jam_mulai,
          jamSelesai: booking.jam_selesai,
          keterangan: booking.keterangan,
          createdAt: booking.created_at
        })) || [];
        
        setBookings(transformedData);
      } else {
        // Fallback to localStorage
        const savedBookings = JSON.parse(localStorage.getItem('roomBookings') || '[]');
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5);
        
        const activeBookings = savedBookings.filter((booking: BookingData) => {
          if (booking.tanggal !== today) return false;
          
          if (booking.jamSelesai) {
            return booking.jamSelesai > currentTime;
          }
          
          if (booking.jamMulai) {
            const endTime = addHours(booking.jamMulai, 2);
            return endTime > currentTime;
          }
          
          return false;
        });
        
        setBookings(activeBookings);
      }
    } catch (error) {
      console.error('Error loading active bookings:', error);
    }
  };

  const addHours = (timeString: string, hours: number): string => {
    const [h, m] = timeString.split(':').map(Number);
    const totalMinutes = h * 60 + m + (hours * 60);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking =>
      Object.values(booking).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [bookings, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTimeRange = (booking: BookingData) => {
    if (booking.jamMulai && booking.jamSelesai) {
      return `${booking.jamMulai} - ${booking.jamSelesai}`;
    }
    if (booking.jamMulai) {
      const endTime = addHours(booking.jamMulai, 2);
      return `${booking.jamMulai} - ${endTime}`;
    }
    return 'N/A';
  };

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Peminjaman Aktif</CardTitle>
              <CardDescription>
                {filteredBookings.length} peminjaman yang sedang berlangsung
              </CardDescription>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari peminjaman aktif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-all duration-200 focus:shadow-soft"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-24 w-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak ada peminjaman aktif</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Tidak ada hasil yang cocok dengan pencarian' : 'Belum ada peminjaman untuk hari ini'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nama Peminjam</TableHead>
                  <TableHead>Ruangan/Lantai</TableHead>
                  <TableHead>Rentang Jam</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking, index) => (
                  <TableRow key={booking.id} className="hover:bg-muted/30 transition-colors duration-200">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{formatDate(booking.tanggal)}</TableCell>
                    <TableCell className="font-medium">{booking.namaPeminjam}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {booking.ruangan}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {getTimeRange(booking)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={booking.keterangan}>
                      {booking.keterangan}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};