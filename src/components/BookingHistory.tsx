import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Trash2, History, ChevronUp, ChevronDown, Edit, Filter } from 'lucide-react';
import { BookingData } from '@/types/booking';
import { supabase } from '@/lib/supabase';
import { EditBookingDialog } from './EditBookingDialog';
import { FilterDialog, FilterOptions } from './FilterDialog';
import * as XLSX from 'xlsx';

interface BookingHistoryProps {
  refreshTrigger: number;
}

export const BookingHistory: React.FC<BookingHistoryProps> = ({ refreshTrigger }) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof BookingData>('tanggal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<BookingData | null>(null);
  const [exportFilterOpen, setExportFilterOpen] = useState(false);
  const [deleteFilterOpen, setDeleteFilterOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterOptions | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, [refreshTrigger]);

  useEffect(() => {
    applyCurrentFilter();
  }, [bookings, currentFilter]);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
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
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const applyCurrentFilter = () => {
    if (!currentFilter) {
      setFilteredBookings(bookings);
      return;
    }

    let filtered = [...bookings];

    switch (currentFilter.type) {
      case 'month':
        if (currentFilter.month && currentFilter.year) {
          filtered = bookings.filter(booking => {
            const bookingDate = new Date(booking.tanggal);
            return bookingDate.getMonth() + 1 === currentFilter.month &&
                   bookingDate.getFullYear() === currentFilter.year;
          });
        }
        break;
      case 'quarter':
        if (currentFilter.quarter && currentFilter.year) {
          filtered = bookings.filter(booking => {
            const bookingDate = new Date(booking.tanggal);
            const month = bookingDate.getMonth() + 1;
            const quarter = Math.ceil(month / 3);
            return quarter === currentFilter.quarter &&
                   bookingDate.getFullYear() === currentFilter.year;
          });
        }
        break;
      case 'year':
        if (currentFilter.year) {
          filtered = bookings.filter(booking => {
            const bookingDate = new Date(booking.tanggal);
            return bookingDate.getFullYear() === currentFilter.year;
          });
        }
        break;
      case 'custom':
        if (currentFilter.startDate && currentFilter.endDate) {
          const startDate = currentFilter.startDate.toISOString().split('T')[0];
          const endDate = currentFilter.endDate.toISOString().split('T')[0];
          filtered = bookings.filter(booking => 
            booking.tanggal >= startDate && booking.tanggal <= endDate
          );
        }
        break;
    }

    setFilteredBookings(filtered);
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
    let filtered = filteredBookings.filter(booking =>
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
  }, [filteredBookings, searchTerm, sortField, sortDirection]);

  const handleEdit = (booking: BookingData) => {
    setBookingToEdit(booking);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setBookingToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingToDelete);

      if (error) {
        console.error('Error deleting booking:', error);
        toast({
          title: "Gagal menghapus",
          description: "Terjadi kesalahan saat menghapus peminjaman.",
          variant: "destructive",
        });
        return;
      }

      await loadBookings();
      
      toast({
        title: "Peminjaman dihapus",
        description: "Data peminjaman berhasil dihapus dari sistem.",
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Gagal menghapus",
        description: "Terjadi kesalahan saat menghapus peminjaman.",
        variant: "destructive",
      });
    }
    
    setDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  const handleBulkDelete = async (filter: FilterOptions) => {
    try {
      let query = supabase.from('bookings').delete();

      switch (filter.type) {
        case 'month':
          if (filter.month && filter.year) {
            const startDate = new Date(filter.year, filter.month - 1, 1).toISOString().split('T')[0];
            const endDate = new Date(filter.year, filter.month, 0).toISOString().split('T')[0];
            query = query.gte('tanggal', startDate).lte('tanggal', endDate);
          }
          break;
        case 'quarter':
          if (filter.quarter && filter.year) {
            const startMonth = (filter.quarter - 1) * 3;
            const startDate = new Date(filter.year, startMonth, 1).toISOString().split('T')[0];
            const endDate = new Date(filter.year, startMonth + 3, 0).toISOString().split('T')[0];
            query = query.gte('tanggal', startDate).lte('tanggal', endDate);
          }
          break;
        case 'year':
          if (filter.year) {
            const startDate = `${filter.year}-01-01`;
            const endDate = `${filter.year}-12-31`;
            query = query.gte('tanggal', startDate).lte('tanggal', endDate);
          }
          break;
        case 'custom':
          if (filter.startDate && filter.endDate) {
            const startDate = filter.startDate.toISOString().split('T')[0];
            const endDate = filter.endDate.toISOString().split('T')[0];
            query = query.gte('tanggal', startDate).lte('tanggal', endDate);
          }
          break;
      }

      const { error } = await query;

      if (error) {
        console.error('Error bulk deleting bookings:', error);
        toast({
          title: "Gagal menghapus",
          description: "Terjadi kesalahan saat menghapus data peminjaman.",
          variant: "destructive",
        });
        return;
      }

      await loadBookings();
      
      toast({
        title: "Data berhasil dihapus",
        description: "Data peminjaman pada periode yang dipilih berhasil dihapus.",
      });
    } catch (error) {
      console.error('Error bulk deleting bookings:', error);
      toast({
        title: "Gagal menghapus",
        description: "Terjadi kesalahan saat menghapus data peminjaman.",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = (filter?: FilterOptions) => {
    let dataToExport = filteredAndSortedBookings;
    
    if (filter) {
      setCurrentFilter(filter);
      // Filter will be applied automatically by useEffect
      dataToExport = applyFilterToData(bookings, filter);
    }

    const exportData = dataToExport.map((booking, index) => ({
      No: index + 1,
      Tanggal: formatDate(booking.tanggal),
      'Nama Peminjam': booking.namaPeminjam,
      'Ruangan/Lantai': booking.ruangan,
      'Rentang Jam': getTimeRange(booking),
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

    const periodName = getFilterPeriodName(filter);
    XLSX.writeFile(workbook, `History_Peminjaman_${periodName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Export berhasil!",
      description: "File Excel telah berhasil diunduh.",
    });
  };

  const applyFilterToData = (data: BookingData[], filter: FilterOptions): BookingData[] => {
    switch (filter.type) {
      case 'month':
        if (filter.month && filter.year) {
          return data.filter(booking => {
            const bookingDate = new Date(booking.tanggal);
            return bookingDate.getMonth() + 1 === filter.month &&
                   bookingDate.getFullYear() === filter.year;
          });
        }
        break;
      case 'quarter':
        if (filter.quarter && filter.year) {
          return data.filter(booking => {
            const bookingDate = new Date(booking.tanggal);
            const month = bookingDate.getMonth() + 1;
            const quarter = Math.ceil(month / 3);
            return quarter === filter.quarter &&
                   bookingDate.getFullYear() === filter.year;
          });
        }
        break;
      case 'year':
        if (filter.year) {
          return data.filter(booking => {
            const bookingDate = new Date(booking.tanggal);
            return bookingDate.getFullYear() === filter.year;
          });
        }
        break;
      case 'custom':
        if (filter.startDate && filter.endDate) {
          const startDate = filter.startDate.toISOString().split('T')[0];
          const endDate = filter.endDate.toISOString().split('T')[0];
          return data.filter(booking => 
            booking.tanggal >= startDate && booking.tanggal <= endDate
          );
        }
        break;
    }
    return data;
  };

  const getFilterPeriodName = (filter?: FilterOptions): string => {
    if (!filter) return 'Semua';
    
    switch (filter.type) {
      case 'month':
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                       'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${months[(filter.month || 1) - 1]}_${filter.year}`;
      case 'quarter':
        return `Q${filter.quarter}_${filter.year}`;
      case 'year':
        return `${filter.year}`;
      case 'custom':
        if (filter.startDate && filter.endDate) {
          const start = filter.startDate.toISOString().split('T')[0];
          const end = filter.endDate.toISOString().split('T')[0];
          return `${start}_to_${end}`;
        }
        return 'Custom';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    // Convert HH:MM:SS to HH:MM
    return timeString.slice(0, 5);
  };

  const getTimeRange = (booking: BookingData) => {
    if (booking.jamMulai && booking.jamSelesai) {
      return `${formatTime(booking.jamMulai)} - ${formatTime(booking.jamSelesai)}`;
    }
    if (booking.jamMulai) {
      const endTime = addHours(booking.jamMulai, 2);
      return `${formatTime(booking.jamMulai)} - ${formatTime(endTime)}`;
    }
    return 'N/A';
  };

  const addHours = (timeString: string, hours: number): string => {
    const [h, m] = timeString.split(':').map(Number);
    const totalMinutes = h * 60 + m + (hours * 60);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
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
              <>
                <Button
                  onClick={() => setCurrentFilter(null)}
                  variant="outline"
                  className="hover:bg-primary/10 transition-colors duration-200"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset Filter
                </Button>
                <Button
                  onClick={() => setExportFilterOpen(true)}
                  variant="outline"
                  className="hover:bg-success hover:text-success-foreground transition-colors duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <Button
                  onClick={() => setDeleteFilterOpen(true)}
                  variant="outline"
                  className="hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Bulk
                </Button>
              </>
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
                  <TableHead>Rentang Jam</TableHead>
                  <TableHead>Keterangan</TableHead>
                  {user?.role === 'admin' && <TableHead className="w-32">Aksi</TableHead>}
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
                    <TableCell className="font-mono text-sm">
                      {getTimeRange(booking)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={booking.keterangan}>
                      {booking.keterangan}
                    </TableCell>
                    {user?.role === 'admin' && (
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(booking)}
                            className="hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(booking.id)}
                            className="hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <EditBookingDialog
        booking={bookingToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={loadBookings}
      />

      <FilterDialog
        open={exportFilterOpen}
        onOpenChange={setExportFilterOpen}
        onApplyFilter={handleExportExcel}
        title="Export Data Excel"
        description="Pilih periode data yang ingin diekspor ke Excel."
      />

      <FilterDialog
        open={deleteFilterOpen}
        onOpenChange={setDeleteFilterOpen}
        onApplyFilter={handleBulkDelete}
        title="Hapus Data Bulk"
        description="Pilih periode data yang ingin dihapus. HATI-HATI: Tindakan ini tidak dapat dibatalkan!"
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data peminjaman ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};