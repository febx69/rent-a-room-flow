import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Trash2, History, ChevronUp, ChevronDown } from 'lucide-react';
import { BookingData } from '@/types/booking';
import * as XLSX from 'xlsx';

interface BookingHistoryProps {
  refreshTrigger: number;
}

export const BookingHistory: React.FC<BookingHistoryProps> = ({ refreshTrigger }) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof BookingData>('tanggal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, [refreshTrigger]);

  const loadBookings = () => {
    const savedBookings = JSON.parse(localStorage.getItem('roomBookings') || '[]');
    setBookings(savedBookings);
  };

  const handleSort = (field: keyof BookingData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking =>
      Object.values(booking).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [bookings, searchTerm, sortField, sortDirection]);

  const handleDelete = (id: string) => {
    const updatedBookings = bookings.filter(booking => booking.id !== id);
    setBookings(updatedBookings);
    localStorage.setItem('roomBookings', JSON.stringify(updatedBookings));
    
    toast({
      title: "Peminjaman dihapus",
      description: "Data peminjaman berhasil dihapus dari sistem.",
    });
  };

  const handleExportExcel = () => {
    const exportData = filteredAndSortedBookings.map((booking, index) => ({
      No: index + 1,
      Tanggal: booking.tanggal,
      'Nama Peminjam': booking.namaPeminjam,
      'Ruangan/Lantai': booking.ruangan,
      Jam: booking.jam,
      Keterangan: booking.keterangan
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'History Peminjaman');
    
    // Auto-width columns
    const maxWidth = exportData.reduce((acc, row) => {
      Object.entries(row).forEach(([key, value]) => {
        const length = value ? value.toString().length : 10;
        acc[key] = Math.max(acc[key] || 10, length + 2);
      });
      return acc;
    }, {} as Record<string, number>);

    worksheet['!cols'] = Object.values(maxWidth).map(width => ({ width }));

    XLSX.writeFile(workbook, `History_Peminjaman_Ruangan_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Export berhasil!",
      description: "File Excel telah berhasil diunduh.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const SortIcon = ({ field }: { field: keyof BookingData }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">History Peminjaman Ruangan</CardTitle>
              <CardDescription>
                {filteredAndSortedBookings.length} dari {bookings.length} peminjaman
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari peminjaman..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-all duration-200 focus:shadow-soft"
              />
            </div>
            {user?.role === 'admin' && bookings.length > 0 && (
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="hover:bg-success hover:text-success-foreground transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredAndSortedBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-24 w-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
              <History className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Belum ada data peminjaman</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Tidak ada hasil yang cocok dengan pencarian' : 'Tambahkan peminjaman pertama Anda'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-16">No</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80 transition-colors duration-200"
                    onClick={() => handleSort('tanggal')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tanggal</span>
                      <SortIcon field="tanggal" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80 transition-colors duration-200"
                    onClick={() => handleSort('namaPeminjam')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nama Peminjam</span>
                      <SortIcon field="namaPeminjam" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80 transition-colors duration-200"
                    onClick={() => handleSort('ruangan')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ruangan/Lantai</span>
                      <SortIcon field="ruangan" />
                    </div>
                  </TableHead>
                  
                  <TableHead>Jam</TableHead>
                  <TableHead>Keterangan</TableHead>
                  {user?.role === 'admin' && <TableHead className="w-20">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedBookings.map((booking, index) => (
                  <TableRow key={booking.id} className="hover:bg-muted/30 transition-colors duration-200">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{formatDate(booking.tanggal)}</TableCell>
                    <TableCell className="font-medium">{booking.namaPeminjam}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {booking.ruangan}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{booking.jam}</TableCell>
                    <TableCell className="max-w-xs truncate" title={booking.keterangan}>
                      {booking.keterangan}
                    </TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(booking.id)}
                          className="hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
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