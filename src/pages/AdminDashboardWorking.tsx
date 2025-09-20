import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { useStations } from '@/hooks/useStations';
import { useStationInventory } from '@/hooks/useStationInventory';
import { AdminDataTables } from '@/components/AdminDataTables';
import { usePowerBankTypes } from '@/hooks/usePowerBankTypes';
import { supabase } from '@/integrations/supabase/client';
import ThemeToggle from '@/components/ThemeToggle';
import AdminNotificationPanel from '@/components/AdminNotificationPanel';
import CopyButton from '@/components/CopyButton';
import { useAdminNotifications } from '@/contexts/AdminNotificationContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  Shield,
  DollarSign,
  Battery,
  TrendingUp,
  Users,
  LogOut,
  Edit,
  Send,
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  ArrowLeft
} from 'lucide-react';

const AdminDashboardWorking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { 
    transactions, 
    monthlyData, 
    loading, 
    updateStationPowerBanks, 
    createPromoUpdate,
    addStation,
    updateStation,
    deleteStation
  } = useAdminData();
  const { stations, refetch: refetchStations } = useStations();
  const { stations: stationsWithInventory, refetch: refetchStationInventory } = useStationInventory();
  const { powerBankTypes, refetch: refetchPowerBankTypes } = usePowerBankTypes();
  const { addNotification } = useAdminNotifications();
  
  // Additional state for new features
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeRentals, setActiveRentals] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);

  // Promo form state
  const [promoForm, setPromoForm] = useState({
    title: '',
    message: '',
    discount_percentage: '',
    start_date: '',
    end_date: ''
  });

  // Station update state
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [newPowerBankCount, setNewPowerBankCount] = useState('');

  // Station management state
  const [stationForm, setStationForm] = useState({
    name: '',
    address: '',
    inventory_10000mah: '',
    inventory_20000mah: ''
  });
  const [isAddingStation, setIsAddingStation] = useState(false);

  // Power bank management state
  const [powerBankForm, setPowerBankForm] = useState({
    category: '',
    dailyPrice: ''
  });

  // Booking management state
  const [searchOrderId, setSearchOrderId] = useState('');
  const [foundBooking, setFoundBooking] = useState<any>(null);

  // Fetch additional data for dashboard
  const fetchAdditionalData = async () => {
    try {
      // Get total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setTotalUsers(usersCount || 0);

      // Get active rentals with error handling for missing profiles
      const { data: rentalsData, error: rentalsError } = await supabase
        .from('rentals')
        .select(`
          *,
          station:stations(name),
          profiles!rentals_user_id_fkey(full_name, email),
          power_bank_type:power_bank_types(name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (rentalsError) {
        console.error('Error fetching rentals:', rentalsError);
        // Fallback: fetch without profile join
        const { data: fallbackRentals } = await supabase
          .from('rentals')
          .select(`
            *,
            station:stations(name),
            power_bank_type:power_bank_types(name)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        setActiveRentals(fallbackRentals || []);
      } else {
        setActiveRentals(rentalsData || []);
      }

      // Get pending returns (rentals that should have ended) with error handling
      const { data: pendingReturnsData, error: pendingReturnsError } = await supabase
        .from('rentals')
        .select(`
          *,
          station:stations(name),
          profiles!rentals_user_id_fkey(full_name, email),
          power_bank_type:power_bank_types(name)
        `)
        .eq('status', 'active')
        .lt('end_time', new Date().toISOString())
        .order('end_time', { ascending: true });
      
      if (pendingReturnsError) {
        console.error('Error fetching pending returns:', pendingReturnsError);
        // Fallback: fetch without profile join
        const { data: fallbackPendingReturns } = await supabase
          .from('rentals')
          .select(`
            *,
            station:stations(name),
            power_bank_type:power_bank_types(name)
          `)
          .eq('status', 'active')
          .lt('end_time', new Date().toISOString())
          .order('end_time', { ascending: true });
        
        setPendingReturns(fallbackPendingReturns || []);
      } else {
        setPendingReturns(pendingReturnsData || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('AdminDashboard mounted, user:', user);
    fetchAdditionalData();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate('/auth');
  };

  const handleUpdateStation = async (stationId: string) => {
    const count = parseInt(newPowerBankCount);
    if (isNaN(count) || count < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }

    await updateStationPowerBanks(stationId, count);
    setEditingStation(null);
    setNewPowerBankCount('');
    refetchStations();
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const promo = {
      ...promoForm,
      discount_percentage: promoForm.discount_percentage ? parseFloat(promoForm.discount_percentage) : undefined,
      start_date: promoForm.start_date || undefined,
      end_date: promoForm.end_date || undefined
    };

    await createPromoUpdate(promo);
    setPromoForm({
      title: '',
      message: '',
      discount_percentage: '',
      start_date: '',
      end_date: ''
    });
  };

  const handleConfirmReturn = async (rentalId: string) => {
    try {
      const { error } = await supabase
        .from('rentals')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', rentalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Return confirmed successfully!",
      });

      fetchAdditionalData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm return",
        variant: "destructive",
      });
    }
  };

  const handleExtendRental = async (rentalId: string, additionalDuration: number, durationType: 'hours' | 'days') => {
    try {
      // Get current rental
      const { data: rental, error: rentalError } = await supabase
        .from('rentals')
        .select('end_time, power_bank_type_id')
        .eq('id', rentalId)
        .single();

      if (rentalError) {
        throw new Error(`Failed to get rental: ${rentalError.message}`);
      }

      // Calculate new end time
      const currentEndTime = new Date(rental.end_time);
      const newEndTime = new Date(currentEndTime);
      
      if (durationType === 'hours') {
        newEndTime.setHours(newEndTime.getHours() + additionalDuration);
      } else {
        newEndTime.setDate(newEndTime.getDate() + additionalDuration);
      }

      // Update rental
      const { error: updateError } = await supabase
        .from('rentals')
        .update({ end_time: newEndTime.toISOString() })
        .eq('id', rentalId);

      if (updateError) {
        throw new Error(`Failed to extend rental: ${updateError.message}`);
      }

      toast({
        title: "Success",
        description: `Rental extended by ${additionalDuration} ${durationType}`,
      });

      fetchAdditionalData();
    } catch (error) {
      console.error('Extend rental error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extend rental",
        variant: "destructive",
      });
    }
  };

  const handleForceReturn = async (rentalId: string) => {
    if (confirm('Are you sure you want to force return this power bank?')) {
      try {
        const { error } = await supabase
          .from('rentals')
          .update({ 
            status: 'completed',
            end_time: new Date().toISOString()
          })
          .eq('id', rentalId);

        if (error) {
          throw new Error(`Failed to force return: ${error.message}`);
        }

        toast({
          title: "Success",
          description: "Power bank returned successfully!",
        });

        fetchAdditionalData();
        refetchStationInventory();
      } catch (error) {
        console.error('Force return error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to force return",
          variant: "destructive",
        });
      }
    }
  };

  const handleSearchBooking = async () => {
    if (!searchOrderId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          user:profiles(full_name, email),
          station:stations(name, address),
          power_bank_type:power_bank_types(name, capacity_mah)
        `)
        .eq('order_id', searchOrderId)
        .single();

      if (error) {
        throw new Error(`Booking not found: ${error.message}`);
      }

      setFoundBooking(booking);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Booking not found",
        variant: "destructive",
      });
      setFoundBooking(null);
    }
  };

  const handleConfirmPayment = async (bookingId: string) => {
    try {
      // Update booking status to confirmed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);
      
      if (bookingError) {
        throw new Error(`Failed to confirm booking: ${bookingError.message}`);
      }

      // Create rental record
      const booking = foundBooking;
      const startTime = new Date();
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + 1); // 1 day rental

      const { error: rentalError } = await supabase
        .from('rentals')
        .insert({
          user_id: booking.user_id,
          station_id: booking.station_id,
          power_bank_type_id: booking.power_bank_type_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'active'
        });

      if (rentalError) {
        throw new Error(`Failed to create rental: ${rentalError.message}`);
      }

      toast({
        title: "Success",
        description: "Payment confirmed and rental created!",
      });

      // Add notification for booking confirmation
      try {
        addNotification({
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: `Booking ${booking.order_id} has been confirmed and rental created`,
          data: { booking },
          read: false,
        });
      } catch (error) {
        console.warn('Failed to add notification:', error);
      }

      setFoundBooking(null);
      setSearchOrderId('');
      fetchAdditionalData();
      refetchStationInventory();
    } catch (error) {
      console.error('Confirm payment error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to confirm payment",
        variant: "destructive",
      });
    }
  };

  const totalEarnings = monthlyData.reduce((sum, month) => sum + month.earnings, 0);
  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Welcome, {user?.full_name || user?.email}</span>
              </div>
              <AdminNotificationPanel />
              <ThemeToggle variant="compact" />
              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-foreground">₦{totalEarnings.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold text-foreground">{totalTransactions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Stations</p>
                  <p className="text-2xl font-bold text-foreground">{stations?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Battery className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Earnings Chart */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Monthly Earnings</CardTitle>
              <CardDescription>Revenue trends from real transactions over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">Loading earnings data...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <RechartsTooltip 
                      formatter={(value) => [`₦${Number(value).toFixed(2)}`, 'Earnings']}
                      labelFormatter={(label) => `Month: ${label}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Transaction Volume Chart */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Transaction Volume</CardTitle>
              <CardDescription>Number of actual transactions processed per month</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">Loading transaction data...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <RechartsTooltip 
                      formatter={(value) => [`${value}`, 'Transactions']}
                      labelFormatter={(label) => `Month: ${label}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="transactions" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Management */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle>Booking Management</CardTitle>
            <CardDescription>Search and confirm pending bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    placeholder="Enter order ID to search"
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearchBooking}>
                    <Send className="w-4 h-4 mr-2" />
                    Search Booking
                  </Button>
                </div>
              </div>

              {foundBooking && (
                <div className="p-4 border border-border/50 rounded-lg bg-background/50">
                  <h3 className="font-semibold mb-3">Booking Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="flex items-center gap-2"><strong>Order ID:</strong> 
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-muted px-2 py-1 rounded border">{foundBooking.order_id}</span>
                          <CopyButton 
                            text={foundBooking.order_id} 
                            copyMessage="Order ID copied to clipboard!"
                            size="sm"
                            variant="ghost"
                          />
                        </div>
                      </p>
                      <p><strong>User:</strong> {foundBooking.user?.full_name || foundBooking.user?.email}</p>
                      <p><strong>Station:</strong> {foundBooking.station?.name}</p>
                    </div>
                    <div>
                      <p><strong>Power Bank:</strong> {foundBooking.power_bank_type?.name}</p>
                      <p><strong>Amount:</strong> ₦{foundBooking.total_amount}</p>
                      <p><strong>Status:</strong> 
                        <Badge variant={foundBooking.status === 'pending' ? 'secondary' : 'default'} className="ml-2">
                          {foundBooking.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  {foundBooking.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <Button 
                        onClick={() => handleConfirmPayment(foundBooking.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Payment
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Operations */}
        <AdminDataTables
          activeRentals={activeRentals}
          pendingReturns={pendingReturns}
          onConfirmReturn={handleConfirmReturn}
          onExtendRental={handleExtendRental}
          onForceReturn={handleForceReturn}
        />

        {/* Recent Transactions */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mt-8">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-500' : 
                      transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">₦{transaction.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.rental?.station?.name || 'Unknown Station'} • 
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      transaction.status === 'completed' ? 'default' : 
                      transaction.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {transaction.status}
                    </Badge>
                    {transaction.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : transaction.status === 'pending' ? (
                      <Calendar className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboardWorking;
