import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookingForm } from './BookingForm';
import { BookingHistory } from './BookingHistory';
import { LogOut, User, Crown, Building2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleBookingAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-border/40 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Sistem Peminjaman Ruangan
                </h1>
                <p className="text-sm text-muted-foreground">
                  Kelola peminjaman ruangan dengan mudah dan efisien
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-lg">
                {user?.role === 'admin' ? (
                  <Crown className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{user?.username}</span>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                  {user?.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
              
              <Button
                variant="outline"
                onClick={logout}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Booking Form */}
        <BookingForm onBookingAdded={handleBookingAdded} />
        
        {/* Booking History */}
        <BookingHistory refreshTrigger={refreshTrigger} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>© 2024 Sistem Peminjaman Ruangan</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Dibuat dengan ❤️ menggunakan React & Tailwind CSS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};