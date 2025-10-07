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
import { useAdminNotifications } from '@/contexts/AdminNotificationContext';
import { AdminNotificationProvider } from '@/contexts/AdminNotificationContext';
import AdminNotificationBell from '@/components/AdminNotificationBell';
import { notifyBookingConfirmed, notifyReturnConfirmed, notifyPromotionalUpdate } from '@/services/localNotificationService';
import CopyButton from '@/components/CopyButton';
import CompanySettings from '@/components/CompanySettings';
import { validateAndSanitizeInput } from '@/utils/validation';
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
  ArrowLeft,
  BarChart3,
  MapPin,
  CreditCard,
  Settings,
  Save,
  Clock
} from 'lucide-react';

const AdminDashboard = () => {
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
    deleteStation,
    refetchData
  } = useAdminData();
  const { stations, refetch: refetchStations } = useStations();
  const { stations: stationsWithInventory, refetch: refetchStationInventory } = useStationInventory();
  const { powerBankTypes, refetch: refetchPowerBankTypes } = usePowerBankTypes();
  const { refreshNotifications } = useAdminNotifications();
  
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
    dailyRate: ''
  });

  // Booking management state
  const [searchOrderId, setSearchOrderId] = useState('');
  const [foundBooking, setFoundBooking] = useState<any>(null);
  const [showReturnTimeModal, setShowReturnTimeModal] = useState(false);
  const [selectedReturnTime, setSelectedReturnTime] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [returnTimePreset, setReturnTimePreset] = useState<'custom' | '1hour' | '4hours' | '8hours' | '1day' | '2days' | '3days'>('1day');
  
  // Payment confirmation state to prevent double-clicking
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  
  // Inventory sync state
  const [isSyncingInventory, setIsSyncingInventory] = useState(false);

  // Admin dashboard sections
  const [activeSection, setActiveSection] = useState<'overview' | 'stations' | 'bookings' | 'settings'>('overview');

  // Bank account settings state
  const [bankSettings, setBankSettings] = useState({
    accountName: 'PowerBank Rental Ltd',
    accountNumber: '1234567890',
    bankName: 'Access Bank',
    paymentInstructions: 'Please use the Order ID as payment reference when making bank transfers.'
  });
  const [isEditingBankSettings, setIsEditingBankSettings] = useState(false);

  // Remove a specific rental from pending returns list
  const removeFromPendingReturns = (rentalId: string) => {
    setPendingReturns(prev => {
      const filtered = prev.filter(rental => rental.id !== rentalId);
      return filtered;
    });
  };

  // Remove a specific rental from active rentals list
  const removeFromActiveRentals = (rentalId: string) => {
    setActiveRentals(prev => {
      const filtered = prev.filter(rental => rental.id !== rentalId);
      return filtered;
    });
  };

  // Remove a rental from both pending and active lists (for confirmed returns)
  const removeFromBothLists = (rentalId: string) => {
    removeFromPendingReturns(rentalId);
    removeFromActiveRentals(rentalId);
  };

  // Refresh only user count and station inventory (not rentals since we manage them manually)
  const refreshActiveData = async () => {
    try {
      // Get total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setTotalUsers(usersCount || 0);

      // Also refresh station inventory
      refetchStationInventory();

    } catch (error) {
      // Error refreshing active data
    }
  };

  // Manual refresh of rental data - only call when needed
  const refreshRentalData = async () => {
    try {
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
      console.error('Error refreshing rental data:', error);
    }
  };

  // Fetch additional data for dashboard - only runs on initial load
  const fetchAdditionalData = async () => {
    try {
      // Get total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setTotalUsers(usersCount || 0);

      // Get active rentals with error handling for missing profiles - ONLY on initial load
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

      // Get pending returns (rentals that should have ended) with error handling - ONLY on initial load
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
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    }
  };

  // Initial data load - only runs once on mount
  useEffect(() => {
    fetchAdditionalData();
  }, []); // Empty dependency array - only runs on mount

  // User change effect - only refresh non-rental data
  useEffect(() => {
    // Only fetch user count and station inventory on user change
    // Don't fetch rental data to avoid overriding manual state updates
    refreshActiveData();
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

    try {
      // Create the promotional update in the database
      await createPromoUpdate(promo);
      
      // Send notifications to all customers
      await notifyPromotionalUpdate(promo);
      
      // Reset form
      setPromoForm({
        title: '',
        message: '',
        discount_percentage: '',
        start_date: '',
        end_date: ''
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create promotional update",
        variant: "destructive",
      });
    }
  };

  const handleConfirmReturn = async (rentalId: string) => {
    try {
      // First, get the FULL rental details for notifications BEFORE updating status
      const { data: fullRentalData, error: fullFetchError } = await supabase
        .from('rentals')
        .select(`
          *,
          station:stations(name),
          profiles(full_name, email),
          power_bank_type:power_bank_types(name)
        `)
        .eq('id', rentalId)
        .single();

      if (fullFetchError) {
        throw new Error(`Failed to fetch rental details: ${fullFetchError.message}`);
      }

      if (!fullRentalData) {
        throw new Error('Rental not found');
      }

      if (fullRentalData.status !== 'active') {
        throw new Error(`Cannot confirm return for rental with status: ${fullRentalData.status}`);
      }

      // Extract basic rental info for the update
      const rental = {
        station_id: fullRentalData.station_id,
        power_bank_type_id: fullRentalData.power_bank_type_id,
        status: fullRentalData.status
      };

      // Update rental status to completed
      const updateData = {
        status: 'completed'
      };
      
      // Try different update approaches
      
      let { error } = await supabase
        .from('rentals')
        .update(updateData)
        .eq('id', rentalId);
      
      // If approach 1 fails, try approach 2: Raw SQL
      if (error) {
        
        const { error: sqlError } = await supabase.rpc('update_rental_status', {
          rental_id: rentalId,
          new_status: 'completed',
          new_end_time: new Date().toISOString()
        });
        
        if (sqlError) {
          
          // Try direct SQL update
          const { error: directError } = await supabase
            .from('rentals')
            .update({ status: 'completed' })
            .eq('id', rentalId)
            .select();
          
          if (directError) {
            
            // Last resort: try updating without any constraints
            const { error: minimalError } = await supabase
              .from('rentals')
              .update({ status: 'completed' })
              .eq('id', rentalId)
              .is('end_time', null);
            
            error = minimalError;
          } else {
            error = null;
          }
        } else {
          error = null;
        }
      } else {
        // If status update succeeds, try updating end_time separately
        const endTimeUpdate = {
          end_time: new Date().toISOString()
        };
        
        const { error: endTimeError } = await supabase
          .from('rentals')
          .update(endTimeUpdate)
          .eq('id', rentalId);
        
        if (endTimeError) {
          // Don't throw error since the main update (status) succeeded
        }
      }

      if (error) {
        throw new Error(`Failed to update rental: ${error.message}`);
      }

      // Note: Inventory should NOT increase when admin confirms return
      // Inventory only increases when customer physically returns the power bank to a station

      // Send notification to customer about return confirmation
      try {
        // Use the full rental data we already fetched
        await notifyReturnConfirmed(fullRentalData);
      } catch (notificationError) {
        // Don't throw error since the main operation succeeded
      }
      
      toast({
        title: "Success",
        description: "Return confirmed successfully!",
      });

      // Immediately remove the confirmed rental from both pending returns and active rentals lists
      removeFromBothLists(rentalId);
      
      // Refresh station inventory and user count, but don't refresh rentals
      // since we're managing them manually to avoid overriding our immediate state update
      // Add a small delay to ensure database update is complete
      setTimeout(() => {
        refetchStationInventory();
        refreshActiveData();
      }, 100);

      // Verify the rental was actually updated in the database
      setTimeout(async () => {
        try {
          const { data: verifyRental } = await supabase
            .from('rentals')
            .select('status')
            .eq('id', rentalId)
            .single();
          
          if (verifyRental && verifyRental.status !== 'completed') {
            console.warn('Rental status not properly updated in database, refreshing data');
            // If the database wasn't properly updated, refresh the rental data
            await refreshRentalData();
          } else {
            // Database update succeeded - rental should stay removed from UI
            console.log('Rental status successfully updated to completed in database');
          }
        } catch (verifyError) {
          console.error('Error verifying rental status:', verifyError);
          // Only refresh if there was an error fetching the verification data
          await refreshRentalData();
        }
      }, 500);
      
    } catch (error) {
      
      let errorMessage = "Failed to confirm return";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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

      // Refresh only user count and station inventory, not rentals
      // since we want to preserve the current state
      refreshActiveData();
    } catch (error) {
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
      // First, get the FULL rental details for notifications BEFORE updating status
      const { data: fullRentalData, error: fullFetchError } = await supabase
        .from('rentals')
        .select(`
          *,
          station:stations(name),
          profiles(full_name, email),
          power_bank_type:power_bank_types(name)
        `)
        .eq('id', rentalId)
        .single();

      if (fullFetchError) {
        throw new Error(`Failed to fetch rental details: ${fullFetchError.message}`);
      }

      if (!fullRentalData) {
        throw new Error('Rental not found');
      }

      // Extract basic rental info for the update
      const rental = {
        station_id: fullRentalData.station_id,
        power_bank_type_id: fullRentalData.power_bank_type_id
      };

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

      // Note: Force return should NOT automatically increase inventory
      // Force return only marks the rental as completed - inventory remains unchanged
      // Inventory will only increase when the power bank is physically returned to a station

      // Send notification to customer about forced return
      try {
        // Use the full rental data we already fetched
        await notifyReturnConfirmed(fullRentalData);
      } catch (notificationError) {
        // Failed to send force return notification
        // Don't throw error since the main operation succeeded
      }

      toast({
        title: "Success",
          description: "Power bank returned successfully!",
      });

      // Immediately remove the force returned rental from both pending returns and active rentals lists
      removeFromBothLists(rentalId);

      // Refresh station inventory and user count, but don't refresh rentals
      // since we're managing them manually to avoid overriding our immediate state update
      // Add a small delay to ensure database update is complete
      setTimeout(() => {
        refetchStationInventory();
        refreshActiveData();
      }, 100);

      // Verify the rental was actually updated in the database
      setTimeout(async () => {
        try {
          const { data: verifyRental } = await supabase
            .from('rentals')
            .select('status')
            .eq('id', rentalId)
            .single();
          
          if (verifyRental && verifyRental.status !== 'completed') {
            console.warn('Rental status not properly updated in database, refreshing data');
            // If the database wasn't properly updated, refresh the rental data
            await refreshRentalData();
          } else {
            // Database update succeeded - rental should stay removed from UI
            console.log('Rental status successfully updated to completed in database');
          }
        } catch (verifyError) {
          console.error('Error verifying rental status:', verifyError);
          // Only refresh if there was an error fetching the verification data
          await refreshRentalData();
        }
      }, 500);
    } catch (error) {
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

    // Validate and sanitize input
    const validation = validateAndSanitizeInput(searchOrderId.trim(), 'orderId');
    if (!validation.isValid) {
      toast({
        title: "Error",
        description: validation.error || "Invalid order ID format",
        variant: "destructive",
      });
      return;
    }

    try {
      // Search in the bookings table by order_id
      const { data: booking, error } = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          user:profiles(full_name, email),
          station:stations(name, address),
          power_bank_type:power_bank_types(name, capacity_mah)
        `)
        .eq('order_id', validation.sanitized)
        .single();

      if (!error && booking) {
        setFoundBooking(booking);
        toast({
          title: "Booking Found",
          description: `Found booking ${booking.order_id}`,
        });
        return;
      }


      // If not found anywhere, show error
      toast({
        title: "Booking Not Found",
        description: `No booking found with order ID: ${searchOrderId}`,
        variant: "destructive",
      });
      setFoundBooking(null);

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Booking search failed",
        variant: "destructive",
      });
      setFoundBooking(null);
    }
  };


  const handleConfirmPaymentWithReturnTime = (bookingId: string) => {
    if (!bookingId) {
    toast({
        title: "Error",
        description: "No booking ID provided",
        variant: "destructive",
      });
      return;
    }

    setSelectedBookingId(bookingId);
    setReturnTimePreset('1day');
    setSelectedReturnTime(calculateReturnTime('1day'));
    setShowReturnTimeModal(true);
  };

  const calculateReturnTime = (preset: string) => {
    const now = new Date();
    const returnTime = new Date(now);

    switch (preset) {
      case '1hour':
        returnTime.setHours(returnTime.getHours() + 1);
        break;
      case '4hours':
        returnTime.setHours(returnTime.getHours() + 4);
        break;
      case '8hours':
        returnTime.setHours(returnTime.getHours() + 8);
        break;
      case '1day':
        returnTime.setDate(returnTime.getDate() + 1);
        break;
      case '2days':
        returnTime.setDate(returnTime.getDate() + 2);
        break;
      case '3days':
        returnTime.setDate(returnTime.getDate() + 3);
        break;
      default:
        break;
    }

    return returnTime.toISOString().slice(0, 16);
  };

  const handlePresetChange = (preset: string) => {
    setReturnTimePreset(preset as any);
    if (preset !== 'custom') {
      setSelectedReturnTime(calculateReturnTime(preset));
    }
  };

  const handleSubmitReturnTime = async () => {
    if (!selectedReturnTime || !selectedBookingId) {
      toast({
        title: "Error",
        description: "Please select a return time",
        variant: "destructive",
      });
      return;
    }

    try {
      await handleConfirmPayment(selectedBookingId, selectedReturnTime);
      setShowReturnTimeModal(false);
      setSelectedReturnTime('');
      setSelectedBookingId(null);
      setReturnTimePreset('1day');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPayment = async (bookingId: string, returnTime?: string) => {
    // Prevent double-clicking and duplicate processing with more robust checks
    if (isConfirmingPayment) {
      toast({
        title: "Processing...",
        description: "Payment confirmation is already in progress. Please wait.",
        variant: "destructive",
      });
      return;
    }

    if (processingBookingId === bookingId) {
      toast({
        title: "Processing...",
        description: "This booking is already being processed. Please wait.",
        variant: "destructive",
      });
      return;
    }

    // Set processing state immediately to prevent double-clicks
    setIsConfirmingPayment(true);
    setProcessingBookingId(bookingId);

    try {
      // First, check if booking is already confirmed to prevent duplicates
      const { data: existingBooking, error: checkError } = await (supabase as any)
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();

      if (checkError) {
        throw new Error(`Failed to check booking status: ${checkError.message}`);
      }

      if (existingBooking.status === 'confirmed') {
        throw new Error('This booking has already been confirmed. Cannot process duplicate payment.');
      }

      // Check if rental already exists for this booking (more specific check)
      const { data: existingRental, error: rentalCheckError } = await supabase
        .from('rentals')
        .select('id, status')
        .eq('booking_id', bookingId)
        .single();

      if (rentalCheckError && rentalCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Failed to check for existing rental: ${rentalCheckError.message}`);
      }

      if (existingRental) {
        throw new Error('A rental for this booking already exists. Cannot create duplicate rental.');
      }

      // Additional check: Look for any active rental for this user, station, and power bank type within the last 10 minutes
      const { data: recentRental, error: recentRentalError } = await supabase
        .from('rentals')
        .select('id, status, created_at')
        .eq('user_id', foundBooking.user_id)
        .eq('station_id', foundBooking.station_id)
        .eq('power_bank_type_id', foundBooking.power_bank_type_id)
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Within last 10 minutes
        .limit(1);

      if (recentRentalError) {
        throw new Error(`Failed to check for recent rental: ${recentRentalError.message}`);
      }

      if (recentRental && recentRental.length > 0) {
        throw new Error('A recent rental for this user, station, and power bank type already exists. Cannot create duplicate rental.');
      }

      // Update booking status to confirmed
      const { error: bookingError } = await (supabase as any)
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);
      
      if (bookingError) {
        throw new Error(`Failed to confirm booking: ${bookingError.message}`);
      }

      // Create rental and transaction atomically using the safe database function
      const booking = foundBooking;
      
      if (!booking) {
        throw new Error('Booking data not found');
      }
      const startTime = new Date();
      const endTime = returnTime ? new Date(returnTime) : new Date();
      
      // If no return time specified, default to 1 day rental
      if (!returnTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      // Create rental first
      const { data: rentalData, error: rentalError } = await supabase
        .from('rentals')
        .insert({
          user_id: booking.user_id,
          station_id: booking.station_id,
          power_bank_type_id: booking.power_bank_type_id,
          booking_id: bookingId, // Link to the booking
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'active',
          total_amount: booking.total_amount
        })
        .select('id')
        .single();

      if (rentalError) {
        throw new Error(`Failed to create rental: ${rentalError.message}`);
      }

      if (!rentalData) {
        throw new Error('Failed to create rental: No data returned');
      }

      // Create transaction linked to the rental
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          rental_id: rentalData.id,
          amount: booking.total_amount,
          payment_reference: booking.order_id,
          status: 'completed',
          payment_method: 'bank_transfer'
        })
        .select('id')
        .single();

      if (transactionError) {
        // If transaction creation fails, we should clean up the rental
        await supabase.from('rentals').delete().eq('id', rentalData.id);
        throw new Error(`Failed to create transaction: ${transactionError.message}`);
      }

      if (!transactionData) {
        // If transaction creation fails, we should clean up the rental
        await supabase.from('rentals').delete().eq('id', rentalData.id);
        throw new Error('Failed to create transaction: No data returned');
      }

      // Update station inventory to reduce available units
      let inventoryUpdateSuccess = false;
      try {
        // First check current inventory to ensure we have enough units
        const { data: currentInventory, error: fetchError } = await supabase
          .from('station_inventory')
          .select('available_units, total_units')
          .eq('station_id', booking.station_id)
          .eq('power_bank_type_id', booking.power_bank_type_id)
          .single();

        if (fetchError) {
          throw new Error(`Failed to fetch current inventory: ${fetchError.message}`);
        }

        if (!currentInventory || currentInventory.available_units < 1) {
          throw new Error('Insufficient inventory: No power banks available for this type');
        }

        // Update the station_inventory table to reduce available units
        const { error: inventoryError } = await supabase
          .from('station_inventory')
          .update({ 
            available_units: currentInventory.available_units - 1,
            updated_at: new Date().toISOString()
          })
          .eq('station_id', booking.station_id)
          .eq('power_bank_type_id', booking.power_bank_type_id)
          .eq('available_units', currentInventory.available_units); // Ensure no race conditions

        if (inventoryError) {
          throw new Error(`Inventory update failed: ${inventoryError.message}`);
        }

        inventoryUpdateSuccess = true;
        console.log(`Inventory updated successfully. Available units: ${currentInventory.available_units - 1}`);

      } catch (inventoryUpdateError) {
        console.error('Inventory update failed:', inventoryUpdateError);
        
        // If inventory update fails, we should clean up the rental and transaction
        try {
          await supabase.from('transactions').delete().eq('id', transactionData.id);
          await supabase.from('rentals').delete().eq('id', rentalData.id);
          await supabase.from('bookings').update({ status: 'pending' }).eq('id', bookingId);
        } catch (cleanupError) {
          console.error('Failed to cleanup after inventory error:', cleanupError);
        }
        
        throw new Error(`Inventory update failed: ${inventoryUpdateError.message}. Transaction has been cancelled.`);
      }

      // Refresh admin data to update earnings and transaction counts
      refetchData();
      
      // Refresh station inventory to show updated counts
      refetchStationInventory();

      toast({
        title: "Success",
        description: `Payment confirmed and rental created! Return time: ${endTime.toLocaleString()}. Inventory updated successfully.`,
      });

      // Refresh notifications after booking confirmation
      try {
        await refreshNotifications();
      } catch (error) {
      }

      setFoundBooking(null);
      setSearchOrderId('');
      
      // Refresh all data including transactions for charts
      refreshActiveData();
      
      // Refresh admin data (transactions and monthly earnings) for charts
      // This will update the charts with the new transaction data
      setTimeout(() => {
        refetchData(); // This will refetch transactions and monthly earnings
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to confirm payment",
        variant: "destructive",
      });
    } finally {
      // Always reset loading states
      setIsConfirmingPayment(false);
      setProcessingBookingId(null);
    }
  };

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const inventory10000mah = parseInt(stationForm.inventory_10000mah) || 0;
      const inventory20000mah = parseInt(stationForm.inventory_20000mah) || 0;
      const totalPowerBanks = inventory10000mah + inventory20000mah;

      // Add the station with total power banks
      const stationData = await addStation({
        name: stationForm.name,
        address: stationForm.address,
        total_power_banks: totalPowerBanks,
        price_per_hour: 50 // Default price per hour
      });

      // Get power bank types to find their IDs
      const { data: powerBankTypes, error: powerBankError } = await supabase
        .from('power_bank_types')
        .select('id, capacity_mah')
        .order('capacity_mah', { ascending: true });

      if (powerBankError) {
        throw new Error(`Failed to fetch power bank types: ${powerBankError.message}`);
      }

      // Create station inventory entries for each power bank type
      const inventoryEntries = [];
      
      if (inventory10000mah > 0) {
        const powerBank10000 = powerBankTypes?.find(pbt => pbt.capacity_mah === 10000);
        if (powerBank10000) {
          inventoryEntries.push({
            station_id: stationData.id,
            power_bank_type_id: powerBank10000.id,
            total_units: inventory10000mah,
            available_units: inventory10000mah,
            reserved_units: 0
          });
        }
      }

      if (inventory20000mah > 0) {
        const powerBank20000 = powerBankTypes?.find(pbt => pbt.capacity_mah === 20000);
        if (powerBank20000) {
          inventoryEntries.push({
            station_id: stationData.id,
            power_bank_type_id: powerBank20000.id,
            total_units: inventory20000mah,
            available_units: inventory20000mah,
            reserved_units: 0
          });
        }
      }

      // Insert inventory entries if any
      if (inventoryEntries.length > 0) {
        const { error: inventoryError } = await supabase
          .from('station_inventory')
          .insert(inventoryEntries);

        if (inventoryError) {
          throw new Error(`Failed to create station inventory: ${inventoryError.message}`);
        }
      }

      toast({
        title: "Success",
        description: "Station added successfully!",
      });

      setStationForm({
        name: '',
        address: '',
        inventory_10000mah: '',
        inventory_20000mah: ''
      });
      setIsAddingStation(false);
      refetchStations();
      refetchStationInventory();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add station",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStationInventory = async (stationId: string) => {
    const count = parseInt(newPowerBankCount);
    if (isNaN(count) || count < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateStationPowerBanks(stationId, count);
      toast({
        title: "Success",
        description: "Station inventory updated successfully!",
      });
      setEditingStation(null);
      setNewPowerBankCount('');
      refetchStations();
      refetchStationInventory();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update station inventory",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStation = async (stationId: string) => {
    if (confirm('Are you sure you want to delete this station? This action cannot be undone.')) {
      try {
        await deleteStation(stationId);
      toast({
        title: "Success",
          description: "Station deleted successfully!",
      });
        refetchStations();
      refetchStationInventory();
    } catch (error) {
      toast({
        title: "Error",
          description: "Failed to delete station",
        variant: "destructive",
      });
      }
    }
  };

  const handleCreatePowerBankType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Determine capacity based on the name
      const capacity = powerBankForm.category.toLowerCase().includes('10000') ? 10000 : 
                      powerBankForm.category.toLowerCase().includes('20000') ? 20000 : 
                      powerBankForm.category.toLowerCase().includes('10k') ? 10000 : 
                      powerBankForm.category.toLowerCase().includes('20k') ? 20000 : 10000;

      const { error } = await supabase
        .from('power_bank_types')
        .insert({
          name: powerBankForm.category,
          capacity_mah: capacity,
          price_per_day: parseFloat(powerBankForm.dailyRate),
          price_per_hour: parseFloat(powerBankForm.dailyRate) / 24, // Convert daily to hourly
          category: capacity === 10000 ? 'standard' : 'premium',
          target_devices: capacity === 10000 ? 'phones,tablets' : 'phones,tablets,laptops'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Power bank type created successfully!",
      });

      setPowerBankForm({
        category: '',
        dailyRate: ''
      });
      refetchPowerBankTypes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create power bank type",
        variant: "destructive",
      });
    }
  };

  const handleSaveBankSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // For now, we'll store in localStorage until the database migration is run
      localStorage.setItem('bankSettings', JSON.stringify(bankSettings));
      
      toast({
        title: "Success",
        description: "Bank account settings saved successfully!",
      });
      
      setIsEditingBankSettings(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save bank settings",
        variant: "destructive",
      });
    }
  };

  const handleSyncInventory = async () => {
    if (isSyncingInventory) return;
    
    setIsSyncingInventory(true);
    
    try {
      // Get all active rentals to calculate actual inventory
      const { data: activeRentals, error: rentalsError } = await supabase
        .from('rentals')
        .select('station_id, power_bank_type_id')
        .eq('status', 'active');

      if (rentalsError) {
        throw new Error(`Failed to fetch active rentals: ${rentalsError.message}`);
      }

      // Get all station inventory records
      const { data: stationInventory, error: inventoryError } = await supabase
        .from('station_inventory')
        .select(`
          id,
          station_id,
          power_bank_type_id,
          total_units,
          available_units,
          station:stations(name),
          power_bank_type:power_bank_types(name, capacity_mah)
        `);

      if (inventoryError) {
        throw new Error(`Failed to fetch station inventory: ${inventoryError.message}`);
      }

      let syncCount = 0;
      const syncResults = [];

      // Process each inventory record
      for (const inventory of stationInventory || []) {
        // Count active rentals for this station and power bank type
        const rentedCount = activeRentals?.filter(rental => 
          rental.station_id === inventory.station_id && 
          rental.power_bank_type_id === inventory.power_bank_type_id
        ).length || 0;

        // Calculate correct available units
        const correctAvailable = Math.max(0, inventory.total_units - rentedCount);
        const currentAvailable = inventory.available_units;

        // Update if there's a discrepancy
        if (correctAvailable !== currentAvailable) {
          const { error: updateError } = await supabase
            .from('station_inventory')
            .update({ 
              available_units: correctAvailable,
              updated_at: new Date().toISOString()
            })
            .eq('id', inventory.id);

          if (updateError) {
            syncResults.push({
              station: inventory.station?.name,
              powerBank: inventory.power_bank_type?.name,
              error: updateError.message
            });
          } else {
            syncCount++;
            syncResults.push({
              station: inventory.station?.name,
              powerBank: inventory.power_bank_type?.name,
              old: currentAvailable,
              new: correctAvailable,
              success: true
            });
          }
        }
      }

      // Refresh inventory data
      refetchStationInventory();

      if (syncCount > 0) {
        toast({
          title: "Inventory Synced",
          description: `Successfully synced ${syncCount} inventory records. Check console for details.`,
        });
        console.log('Inventory sync results:', syncResults);
      } else {
        toast({
          title: "Inventory Up to Date",
          description: "All inventory records are already synchronized.",
        });
      }

    } catch (error) {
      console.error('Inventory sync failed:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync inventory",
        variant: "destructive",
      });
    } finally {
      setIsSyncingInventory(false);
    }
  };

  const loadBankSettings = () => {
    const saved = localStorage.getItem('bankSettings');
    if (saved) {
      setBankSettings(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadBankSettings();
  }, []);


  const totalEarnings = monthlyData.reduce((sum, month) => sum + month.earnings, 0);
  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

  // Simple fallback if there are errors
  if (!user) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Admin Dashboard...</h1>
          <p className="text-muted-foreground">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminNotificationProvider>
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
              <AdminNotificationBell />
              <ThemeToggle variant="compact" />
              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border/40">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveSection('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveSection('stations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'stations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Stations
              </div>
            </button>
            <button
              onClick={() => setActiveSection('bookings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'bookings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Bookings
              </div>
            </button>
            <button
              onClick={() => setActiveSection('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'overview' && (
          <>
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
              <CardDescription>Revenue from real transactions over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">Loading earnings data...</div>
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <div className="text-muted-foreground mb-2">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Earnings Data Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Charts will display real data once you have completed transactions. 
                    Try processing some bookings to see your earnings trends.
                  </p>
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
                      formatter={(value) => [`₦${Number(value).toFixed(2)}`, 'Earnings']}
                      labelFormatter={(label) => `Month: ${label}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="earnings" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Transaction Volume Chart */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Transaction Volume</CardTitle>
              <CardDescription>Number of transactions processed per month over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">Loading transaction data...</div>
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <div className="text-muted-foreground mb-2">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Transaction Data Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Transaction volume charts will appear once you have completed transactions. 
                    Process some bookings to see your transaction trends.
                  </p>
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
                      formatter={(value) => [`${value}`, 'Transactions']}
                      labelFormatter={(label) => `Month: ${label}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="transactions" 
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
                <div className="p-6 border-2 border-primary/20 rounded-lg bg-card shadow-lg">
                  <h3 className="font-bold mb-4 text-lg text-foreground">Booking Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <p className="flex items-center gap-2"><strong className="text-foreground">Order ID:</strong> 
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-muted px-2 py-1 rounded border font-bold">{foundBooking.order_id}</span>
                          <CopyButton 
                            text={foundBooking.order_id} 
                            copyMessage="Order ID copied to clipboard!"
                            size="sm"
                            variant="ghost"
                          />
                        </div>
                      </p>
                      <p><strong className="text-foreground">User:</strong> {foundBooking.user?.full_name || foundBooking.user?.email}</p>
                      <p><strong className="text-foreground">Station:</strong> {foundBooking.station?.name}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong className="text-foreground">Power Bank:</strong> {foundBooking.power_bank_type?.name}</p>
                      <p><strong className="text-foreground">Amount:</strong> <span className="text-lg font-bold text-primary">₦{foundBooking.total_amount}</span></p>
                      <p className="flex items-center gap-2"><strong className="text-foreground">Status:</strong> 
                        <Badge variant={foundBooking.status === 'pending' ? 'secondary' : 'default'} className="ml-2">
                          {foundBooking.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  {foundBooking.status === 'pending' && (
                    <div className="mt-6 flex gap-2">
                      <Button 
                        onClick={() => handleConfirmPayment(foundBooking.id)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isConfirmingPayment || processingBookingId === foundBooking.id}
                      >
                        {isConfirmingPayment && processingBookingId === foundBooking.id ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm Payment
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Inventory Overview */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="w-5 h-5" />
                  Real-Time Inventory Overview
                </CardTitle>
                <CardDescription>Current power bank inventory across all stations</CardDescription>
              </div>
              <Button 
                onClick={handleSyncInventory}
                disabled={isSyncingInventory}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isSyncingInventory ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Sync Inventory
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stationsWithInventory?.map((station) => (
                <div key={station.id} className="border border-border/50 rounded-lg p-4 bg-background/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{station.name}</h4>
                      <p className="text-sm text-muted-foreground">{station.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Capacity</p>
                      <p className="text-lg font-bold">{station.total_power_banks || 0} units</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {station.inventory?.map((inventory) => (
                      <div key={inventory.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Battery className={`w-5 h-5 ${
                            inventory.available_units > 5 ? 'text-green-600' :
                            inventory.available_units > 2 ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                          <div>
                            <p className="font-medium">{inventory.power_bank_type?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {inventory.power_bank_type?.capacity_mah}mAh
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {inventory.available_units}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            of {inventory.total_units} available
                          </p>
                          {inventory.available_units <= 2 && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {(!station.inventory || station.inventory.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      <Battery className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No inventory data available</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Station Management */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-8">
            <CardHeader>
            <CardTitle>Station Management</CardTitle>
            <CardDescription>Add, update, and manage charging stations</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-6">
              {/* Add New Station */}
              <div className="border border-border/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Add New Station</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddingStation(!isAddingStation)}
                  >
                    {isAddingStation ? <ArrowLeft className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isAddingStation ? 'Cancel' : 'Add Station'}
                  </Button>
                </div>
                
                {isAddingStation && (
              <form onSubmit={handleAddStation} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                        <Label htmlFor="stationName">Station Name</Label>
                  <Input
                          id="stationName"
                          placeholder="e.g., Mall Station"
                    value={stationForm.name}
                          onChange={(e) => setStationForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                        <Label htmlFor="stationAddress">Address</Label>
                  <Input
                          id="stationAddress"
                          placeholder="e.g., 123 Main Street"
                    value={stationForm.address}
                          onChange={(e) => setStationForm(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
                      <div>
                        <Label htmlFor="inventory10000mah">10,000mAh Power Banks</Label>
                        <Input
                          id="inventory10000mah"
                          type="number"
                          placeholder="0"
                          value={stationForm.inventory_10000mah}
                          onChange={(e) => setStationForm(prev => ({ ...prev, inventory_10000mah: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Number of 10,000mAh power banks at this station</p>
                      </div>
                      <div>
                        <Label htmlFor="inventory20000mah">20,000mAh Power Banks</Label>
                        <Input
                          id="inventory20000mah"
                          type="number"
                          placeholder="0"
                          value={stationForm.inventory_20000mah}
                          onChange={(e) => setStationForm(prev => ({ ...prev, inventory_20000mah: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Number of 20,000mAh power banks at this station</p>
                      </div>
                     </div>
                    <div className="flex gap-2">
                      <Button type="submit">Add Station</Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddingStation(false)}>
                        Cancel
                </Button>
                    </div>
              </form>
                )}
                </div>
                
              {/* Station List */}
                <div>
                <h3 className="font-semibold mb-4">Existing Stations</h3>
                <div className="space-y-3">
                  {stations?.map((station) => (
                    <div key={station.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/50">
                      <div className="flex-1">
                        <h4 className="font-medium">{station.name}</h4>
                        <p className="text-sm text-muted-foreground">{station.address}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Battery className="w-3 h-3 text-green-600" />
                            <span>10k: {station.inventory_10000mah || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Battery className="w-3 h-3 text-blue-600" />
                            <span>20k: {station.inventory_20000mah || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Battery className="w-3 h-3 text-gray-600" />
                            <span>Total: {station.total_power_banks || 0}</span>
                          </div>
                        </div>
                  </div>
                      <div className="flex items-center gap-2">
                        {editingStation === station.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                              type="number"
                              placeholder="New count"
                              value={newPowerBankCount}
                              onChange={(e) => setNewPowerBankCount(e.target.value)}
                              className="w-24"
                            />
                            <Button size="sm" onClick={() => handleUpdateStationInventory(station.id)}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingStation(null)}>
                              <XCircle className="w-4 h-4" />
                    </Button>
                          </div>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setEditingStation(station.id)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteStation(station.id)}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                  </div>
                </div>
              ))}
            </div>
                      </div>
              </div>
            </CardContent>
          </Card>

        {/* Power Bank Type Management */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-8">
            <CardHeader>
            <CardTitle>Power Bank Type Management</CardTitle>
            <CardDescription>Manage the two power bank types: 10,000mAh and 20,000mAh</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-6">
              {/* Add New Power Bank Type */}
              <div className="border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold mb-4">Add New Power Bank Type</h3>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Only two power bank types are supported: 10,000mAh and 20,000mAh. 
                    Select from the dropdown menu below.
                  </p>
                </div>
                <form onSubmit={handleCreatePowerBankType} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="powerBankCategory">Power Bank Type</Label>
                      <Select
                        value={powerBankForm.category}
                        onValueChange={(value) => setPowerBankForm(prev => ({ ...prev, category: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select power bank type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard 10,000mAh">
                            <div className="flex items-center gap-2">
                              <Battery className="w-4 h-4 text-green-600" />
                              <span>Standard 10,000mAh</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Premium 20,000mAh">
                            <div className="flex items-center gap-2">
                              <Battery className="w-4 h-4 text-blue-600" />
                              <span>Premium 20,000mAh</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose from the two available power bank types
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="dailyRate">Daily Rate (₦)</Label>
                      <Input
                        id="dailyRate"
                        type="number"
                        step="0.01"
                        placeholder="500.00"
                        value={powerBankForm.dailyRate}
                        onChange={(e) => setPowerBankForm(prev => ({ ...prev, dailyRate: e.target.value }))}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Daily rental rate for this power bank type
                      </p>
                    </div>
                          </div>
                  <Button type="submit">Create Power Bank Type</Button>
                </form>
              </div>

              {/* Existing Power Bank Types */}
                <div>
                <h3 className="font-semibold mb-4">Existing Power Bank Types</h3>
                <div className="space-y-3">
                  {powerBankTypes?.map((powerBank) => (
                    <div key={powerBank.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/50">
                      <div>
                        <h4 className="font-medium">{powerBank.name}</h4>
                        <p className="text-sm text-muted-foreground">₦{powerBank.price_per_day} per day</p>
                </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={powerBank.capacity_mah === 10000 ? "default" : "secondary"}>
                          {powerBank.capacity_mah === 10000 ? "10,000mAh" : "20,000mAh"}
                        </Badge>
                        {powerBank.capacity_mah === 10000 ? (
                          <Battery className="w-4 h-4 text-green-600" />
                        ) : (
                          <Battery className="w-4 h-4 text-blue-600" />
                        )}
              </div>
                        </div>
                  ))}
                </div>
              </div>
            </div>
            </CardContent>
          </Card>

        {/* Promotional Updates */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle>Promotional Updates</CardTitle>
            <CardDescription>Create promotional announcements for users</CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleCreatePromo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="promoTitle">Title</Label>
                  <Input
                    id="promoTitle"
                    placeholder="e.g., Summer Special Offer"
                    value={promoForm.title}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="discountPercentage">Discount Percentage</Label>
                    <Input
                    id="discountPercentage"
                      type="number"
                      placeholder="20"
                    value={promoForm.discount_percentage}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, discount_percentage: e.target.value }))}
                    />
                  </div>
                  <div>
                  <Label htmlFor="startDate">Start Date</Label>
                    <Input
                    id="startDate"
                      type="date"
                      value={promoForm.start_date}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                  <Label htmlFor="endDate">End Date</Label>
                    <Input
                    id="endDate"
                      type="date"
                      value={promoForm.end_date}
                    onChange={(e) => setPromoForm(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              <div>
                <Label htmlFor="promoMessage">Message</Label>
                <Textarea
                  id="promoMessage"
                  placeholder="Describe the promotional offer..."
                  value={promoForm.message}
                  onChange={(e) => setPromoForm(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit">Create Promotional Update</Button>
            </form>
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
          </>
        )}

        {activeSection === 'stations' && (
          <>
            {/* Real-Time Inventory Overview */}
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Battery className="w-5 h-5" />
                      Real-Time Inventory Overview
                    </CardTitle>
                    <CardDescription>Current power bank inventory across all stations</CardDescription>
                  </div>
                  <Button 
                    onClick={handleSyncInventory}
                    disabled={isSyncingInventory}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {isSyncingInventory ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Sync Inventory
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stationsWithInventory?.map((station) => (
                    <div key={station.id} className="border border-border/50 rounded-lg p-4 bg-background/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{station.name}</h4>
                          <p className="text-sm text-muted-foreground">{station.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Capacity</p>
                          <p className="text-lg font-bold">{station.total_power_banks || 0} units</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {station.inventory?.map((inventory) => (
                          <div key={inventory.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Battery className={`w-5 h-5 ${
                                inventory.available_units > 5 ? 'text-green-600' :
                                inventory.available_units > 2 ? 'text-yellow-600' : 'text-red-600'
                              }`} />
                              <div>
                                <p className="font-medium">{inventory.power_bank_type?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {inventory.power_bank_type?.capacity_mah}mAh
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                {inventory.available_units}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                of {inventory.total_units} available
                              </p>
                              {inventory.available_units <= 2 && (
                                <Badge variant="destructive" className="text-xs mt-1">
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {(!station.inventory || station.inventory.length === 0) && (
                        <div className="text-center py-4 text-muted-foreground">
                          <Battery className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No inventory data available</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Station Management */}
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle>Station Management</CardTitle>
                <CardDescription>Add, update, and manage charging stations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add New Station */}
                  <div className="border border-border/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Add New Station</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAddingStation(!isAddingStation)}
                      >
                        {isAddingStation ? <ArrowLeft className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {isAddingStation ? 'Cancel' : 'Add Station'}
                      </Button>
                    </div>
                    
                    {isAddingStation && (
                      <form onSubmit={handleAddStation} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="stationName">Station Name</Label>
                            <Input
                              id="stationName"
                              placeholder="e.g., Mall Station"
                              value={stationForm.name}
                              onChange={(e) => setStationForm(prev => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="stationAddress">Address</Label>
                            <Input
                              id="stationAddress"
                              placeholder="e.g., 123 Main Street"
                              value={stationForm.address}
                              onChange={(e) => setStationForm(prev => ({ ...prev, address: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="inventory10000mah">10,000mAh Power Banks</Label>
                            <Input
                              id="inventory10000mah"
                              type="number"
                              placeholder="0"
                              value={stationForm.inventory_10000mah}
                              onChange={(e) => setStationForm(prev => ({ ...prev, inventory_10000mah: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Number of 10,000mAh power banks at this station</p>
                          </div>
                          <div>
                            <Label htmlFor="inventory20000mah">20,000mAh Power Banks</Label>
                            <Input
                              id="inventory20000mah"
                              type="number"
                              placeholder="0"
                              value={stationForm.inventory_20000mah}
                              onChange={(e) => setStationForm(prev => ({ ...prev, inventory_20000mah: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Number of 20,000mAh power banks at this station</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Add Station</Button>
                          <Button type="button" variant="outline" onClick={() => setIsAddingStation(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                  
                  {/* Station List */}
                  <div>
                    <h3 className="font-semibold mb-4">Existing Stations</h3>
                    <div className="space-y-3">
                      {stations?.map((station) => (
                        <div key={station.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/50">
                          <div className="flex-1">
                            <h4 className="font-medium">{station.name}</h4>
                            <p className="text-sm text-muted-foreground">{station.address}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Battery className="w-3 h-3 text-green-600" />
                                <span>10k: {station.inventory_10000mah || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Battery className="w-3 h-3 text-blue-600" />
                                <span>20k: {station.inventory_20000mah || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Battery className="w-3 h-3 text-gray-600" />
                                <span>Total: {station.total_power_banks || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingStation === station.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="New count"
                                  value={newPowerBankCount}
                                  onChange={(e) => setNewPowerBankCount(e.target.value)}
                                  className="w-24"
                                />
                                <Button size="sm" onClick={() => handleUpdateStationInventory(station.id)}>
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingStation(null)}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => setEditingStation(station.id)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteStation(station.id)}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Power Bank Type Management */}
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle>Power Bank Type Management</CardTitle>
                <CardDescription>Manage the two power bank types: 10,000mAh and 20,000mAh</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add New Power Bank Type */}
                  <div className="border border-border/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Add New Power Bank Type</h3>
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> Only two power bank types are supported: 10,000mAh and 20,000mAh. 
                        Select from the dropdown menu below.
                      </p>
                    </div>
                    <form onSubmit={handleCreatePowerBankType} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="powerBankCategory">Power Bank Type</Label>
                          <Select
                            value={powerBankForm.category}
                            onValueChange={(value) => setPowerBankForm(prev => ({ ...prev, category: value }))}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select power bank type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Standard 10,000mAh">
                                <div className="flex items-center gap-2">
                                  <Battery className="w-4 h-4 text-green-600" />
                                  <span>Standard 10,000mAh</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Premium 20,000mAh">
                                <div className="flex items-center gap-2">
                                  <Battery className="w-4 h-4 text-blue-600" />
                                  <span>Premium 20,000mAh</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Choose from the two available power bank types
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="dailyRate">Daily Rate (₦)</Label>
                          <Input
                            id="dailyRate"
                            type="number"
                            step="0.01"
                            placeholder="500.00"
                            value={powerBankForm.dailyRate}
                            onChange={(e) => setPowerBankForm(prev => ({ ...prev, dailyRate: e.target.value }))}
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Daily rental rate for this power bank type
                          </p>
                        </div>
                      </div>
                      <Button type="submit">Create Power Bank Type</Button>
                    </form>
                  </div>

                  {/* Existing Power Bank Types */}
                  <div>
                    <h3 className="font-semibold mb-4">Existing Power Bank Types</h3>
                    <div className="space-y-3">
                      {powerBankTypes?.map((powerBank) => (
                        <div key={powerBank.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/50">
                          <div>
                            <h4 className="font-medium">{powerBank.name}</h4>
                            <p className="text-sm text-muted-foreground">₦{powerBank.price_per_day} per day</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={powerBank.capacity_mah === 10000 ? "default" : "secondary"}>
                              {powerBank.capacity_mah === 10000 ? "10,000mAh" : "20,000mAh"}
                            </Badge>
                            {powerBank.capacity_mah === 10000 ? (
                              <Battery className="w-4 h-4 text-green-600" />
                            ) : (
                              <Battery className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeSection === 'bookings' && (
          <>
            
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
                    <div className="flex items-end gap-2">
                      <Button onClick={handleSearchBooking}>
                        <Send className="w-4 h-4 mr-2" />
                        Search Booking
                      </Button>
                    </div>
                  </div>

                  {foundBooking && (
                    <div className="p-6 border-2 border-primary/20 rounded-lg bg-card shadow-lg">
                      <h3 className="font-bold mb-4 text-lg text-foreground">Booking Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2">
                          <p className="flex items-center gap-2"><strong className="text-foreground">Order ID:</strong> 
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded border font-bold">{foundBooking.order_id}</span>
                              <CopyButton 
                                text={foundBooking.order_id} 
                                copyMessage="Order ID copied to clipboard!"
                                size="sm"
                                variant="ghost"
                              />
                            </div>
                          </p>
                          <p><strong className="text-foreground">User:</strong> {foundBooking.user?.full_name || foundBooking.user?.email}</p>
                          <p><strong className="text-foreground">Station:</strong> {foundBooking.station?.name}</p>
                        </div>
                        <div className="space-y-2">
                          <p><strong className="text-foreground">Power Bank:</strong> {foundBooking.power_bank_type?.name}</p>
                          <p><strong className="text-foreground">Amount:</strong> <span className="text-lg font-bold text-primary">₦{foundBooking.total_amount}</span></p>
                          <p className="flex items-center gap-2"><strong className="text-foreground">Status:</strong> 
                            <Badge variant={foundBooking.status === 'pending' ? 'secondary' : 'default'} className="ml-2">
                              {foundBooking.status}
                            </Badge>
                          </p>
                        </div>
                      </div>
                      {foundBooking.status === 'pending' && (
                        <div className="mt-6 flex gap-2">
                          <Button 
                            onClick={() => handleConfirmPaymentWithReturnTime(foundBooking.id)}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={isConfirmingPayment || processingBookingId === foundBooking.id}
                          >
                            {isConfirmingPayment && processingBookingId === foundBooking.id ? (
                              <>
                                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Confirm Payment & Set Return Time
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Operations */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Rental Management</h3>
                <Button 
                  onClick={refreshRentalData}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Refresh Rental Data
                </Button>
              </div>
              <AdminDataTables
                activeRentals={activeRentals}
                pendingReturns={pendingReturns}
                onConfirmReturn={handleConfirmReturn}
                onExtendRental={handleExtendRental}
                onForceReturn={handleForceReturn}
              />
            </div>

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
          </>
        )}

        {activeSection === 'settings' && (
          <div className="space-y-6">
            {/* Bank Account Settings */}
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Bank Account Settings
                </CardTitle>
                <CardDescription>
                  Configure bank account details for payment processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {!isEditingBankSettings ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Account Name</Label>
                          <p className="font-medium">{bankSettings.accountName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                          <p className="font-medium font-mono">{bankSettings.accountNumber}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
                          <p className="font-medium">{bankSettings.bankName}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <Label className="text-sm font-medium text-muted-foreground">Payment Instructions</Label>
                        <p className="text-sm mt-1">{bankSettings.paymentInstructions}</p>
                      </div>
                      <Button onClick={() => setIsEditingBankSettings(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Bank Settings
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveBankSettings} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="accountName">Account Name</Label>
                          <Input
                            id="accountName"
                            value={bankSettings.accountName}
                            onChange={(e) => setBankSettings(prev => ({ ...prev, accountName: e.target.value }))}
                            placeholder="e.g., PowerBank Rental Ltd"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            value={bankSettings.accountNumber}
                            onChange={(e) => setBankSettings(prev => ({ ...prev, accountNumber: e.target.value }))}
                            placeholder="e.g., 1234567890"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            value={bankSettings.bankName}
                            onChange={(e) => setBankSettings(prev => ({ ...prev, bankName: e.target.value }))}
                            placeholder="e.g., Access Bank"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                        <Textarea
                          id="paymentInstructions"
                          value={bankSettings.paymentInstructions}
                          onChange={(e) => setBankSettings(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                          placeholder="Instructions for customers making bank transfers"
                          rows={3}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">
                          <Save className="w-4 h-4 mr-2" />
                          Save Settings
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditingBankSettings(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Company Settings (when database is ready) */}
            <CompanySettings />
          </div>
        )}
      </main>


      {/* Return Time Modal */}
      {showReturnTimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Set Return Time</h3>
    </div>
            
            <div className="space-y-6">
              {/* Quick Presets */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Quick Options</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '1hour', label: '1 Hour', icon: '⏰' },
                    { value: '4hours', label: '4 Hours', icon: '🕐' },
                    { value: '8hours', label: '8 Hours', icon: '🕗' },
                    { value: '1day', label: '1 Day', icon: '📅' },
                    { value: '2days', label: '2 Days', icon: '📆' },
                    { value: '3days', label: '3 Days', icon: '🗓️' }
                  ].map((preset) => (
                    <Button
                      key={preset.value}
                      variant={returnTimePreset === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePresetChange(preset.value)}
                      className="flex items-center gap-2 justify-start h-auto py-3 px-3"
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <span className="text-sm">{preset.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Time Section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant={returnTimePreset === 'custom' ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetChange('custom')}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Custom Time
                  </Button>
                </div>
                
                {returnTimePreset === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="returnTime">Select Date & Time</Label>
                    <Input
                      id="returnTime"
                      type="datetime-local"
                      value={selectedReturnTime}
                      onChange={(e) => setSelectedReturnTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Choose a specific date and time for return
                    </p>
                  </div>
                )}
              </div>

              {/* Preview */}
              {selectedReturnTime && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Return Time Preview</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customer should return the power bank by:
                  </p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedReturnTime).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration: {Math.round((new Date(selectedReturnTime).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) * 10) / 10} days
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReturnTimeModal(false);
                    setSelectedReturnTime('');
                    setSelectedBookingId(null);
                    setReturnTimePreset('1day');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitReturnTime}
                  disabled={!selectedReturnTime}
                  className="min-w-[140px]"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminNotificationProvider>
  );
};

export default AdminDashboard;
