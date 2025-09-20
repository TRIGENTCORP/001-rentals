import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Battery, Clock, AlertTriangle, ArrowLeft, CreditCard, Banknote, CheckCircle } from "lucide-react";
import { useStationInventory } from "@/hooks/useStationInventory";
import { useRentals } from "@/hooks/useRentals";
import { useReservations } from "@/hooks/useReservations";
import { useToast } from "@/hooks/use-toast";
import { PowerBankSelector } from "@/components/PowerBankSelector";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import UserNotificationBell from "@/components/UserNotificationBell";
import CopyButton from "@/components/CopyButton";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { notifyBookingCreated } from "@/services/localNotificationService";
import { validateAndSanitizeInput, isValidEmail, isValidUUID } from "@/utils/validation";

const RentNow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [selectedPowerBank, setSelectedPowerBank] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<'select' | 'payment' | 'confirmation'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  const { stations, loading, error, refetch } = useStationInventory();
  const { createRental } = useRentals();
  const { createReservation, reservations } = useReservations();
  const { toast } = useToast();
  
  // Get bank settings from localStorage
  const getBankSetting = (key: string, defaultValue: string) => {
    try {
      const saved = localStorage.getItem('bankSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings[key] || defaultValue;
      }
    } catch (error) {
      // Error loading bank settings
    }
    return defaultValue;
  };

  const selectedStationData = stations?.find(s => s.id === selectedStation);
  const selectedPowerBankData = selectedStationData?.inventory?.find(inv => inv.power_bank_type.id === selectedPowerBank);

  const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BK-${timestamp}${random}`;
  };

  const handleRentPowerBank = async (powerBankTypeId: string) => {
    if (!selectedStation || !user) {
      toast({
        title: "Error",
        description: "Please select a station and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    setSelectedPowerBank(powerBankTypeId);
    setBookingStep('payment');
  };

  const handleCreateBooking = async () => {
    if (!selectedStation || !selectedPowerBank || !user) {
      toast({
        title: "Error",
        description: "Please select a station and power bank type",
        variant: "destructive",
      });
      return;
    }

    // Validate user data
    if (!user.id || !isValidUUID(user.id)) {
      toast({
        title: "Error",
        description: "Invalid user session",
        variant: "destructive",
      });
      return;
    }

    // Validate station and power bank IDs
    if (!isValidUUID(selectedStation) || !isValidUUID(selectedPowerBank)) {
      toast({
        title: "Error",
        description: "Invalid station or power bank selection",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingBooking(true);
    try {
      const orderId = generateOrderId();
      const totalAmount = selectedPowerBankData?.power_bank_type?.price_per_day || 0;

      // Validate order ID format
      if (!orderId || orderId.length < 8) {
        toast({
          title: "Error",
          description: "Failed to generate valid order ID",
          variant: "destructive",
        });
        return;
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          order_id: orderId,
          user_id: user.id,
          station_id: selectedStation,
          power_bank_type_id: selectedPowerBank,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create booking: ${error.message}`);
      }

      const bookingDetails = {
        ...booking,
        station: selectedStationData,
        power_bank_type: selectedPowerBankData?.power_bank_type,
        user: user
      };

      setBookingDetails(bookingDetails);

      // Booking is now stored in Supabase, no need for localStorage

      setBookingStep('confirmation');
      
      // Notify admin about the new booking
      try {
        await notifyBookingCreated({
          ...booking,
          user: user,
          station: selectedStationData,
          power_bank_type: selectedPowerBankData?.power_bank_type
        });
      } catch (notificationError) {
        // Failed to send admin notification
      }
      
      toast({
        title: "Booking Created",
        description: `Your booking order ID is: ${orderId}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handlePaymentMethodChange = (method: 'card' | 'bank_transfer') => {
    setPaymentMethod(method);
    if (method === 'bank_transfer') {
      toast({
        title: "Bank Transfer Instructions",
        description: "Please use the booking order ID as payment reference",
      });
    }
  };


  // Show booking confirmation
  if (bookingStep === 'confirmation' && bookingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-2 border-primary/20 shadow-2xl bg-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Booking Confirmation
              </CardTitle>
              <CardDescription>Your power bank rental has been booked successfully</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="font-bold text-green-800 dark:text-green-200 mb-4 text-lg">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <p className="flex items-center gap-2"><strong className="text-green-700 dark:text-green-300">Order ID:</strong> 
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border">{bookingDetails.order_id}</span>
                        <CopyButton 
                          text={bookingDetails.order_id} 
                          copyMessage="Order ID copied to clipboard!"
                          size="sm"
                          variant="ghost"
                        />
                      </div>
                    </p>
                    <p><strong className="text-green-700 dark:text-green-300">Station:</strong> {bookingDetails.station?.name}</p>
                    <p><strong className="text-green-700 dark:text-green-300">Address:</strong> {bookingDetails.station?.address}</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong className="text-green-700 dark:text-green-300">Power Bank:</strong> {bookingDetails.power_bank_type?.name}</p>
                    <p><strong className="text-green-700 dark:text-green-300">Amount:</strong> <span className="text-lg font-bold text-green-600 dark:text-green-400">₦{bookingDetails.total_amount}</span></p>
                    <p><strong className="text-green-700 dark:text-green-300">Payment Method:</strong> {bookingDetails.payment_method === 'card' ? 'Card Payment' : 'Bank Transfer'}</p>
                  </div>
                </div>
              </div>

              {paymentMethod === 'bank_transfer' && (
                <div className="p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                  <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-4 text-lg">Bank Transfer Instructions</h3>
                  <div className="space-y-3 text-sm">
                    <p><strong className="text-blue-700 dark:text-blue-300">Account Name:</strong> {getBankSetting('accountName', 'PowerBank Rental Ltd')}</p>
                    <p><strong className="text-blue-700 dark:text-blue-300">Account Number:</strong> {getBankSetting('accountNumber', '1234567890')}</p>
                    <p><strong className="text-blue-700 dark:text-blue-300">Bank:</strong> {getBankSetting('bankName', 'Access Bank')}</p>
                    <p className="flex items-center gap-2"><strong className="text-blue-700 dark:text-blue-300">Reference:</strong> 
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded border font-bold text-blue-600 dark:text-blue-400">{bookingDetails.order_id}</span>
                        <CopyButton 
                          text={bookingDetails.order_id} 
                          copyMessage="Payment reference copied to clipboard!"
                          size="sm"
                          variant="ghost"
                        />
                      </div>
                    </p>
                    <p className="text-red-600 dark:text-red-400 font-bold text-base">⚠️ {getBankSetting('paymentInstructions', 'Please use the Order ID as payment reference when making bank transfers.')}</p>
                  </div>
                </div>
              )}

              <div className="p-6 bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-4 text-lg">Next Steps</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li className="text-yellow-700 dark:text-yellow-300">Complete your payment using the method selected</li>
                  <li className="text-yellow-700 dark:text-yellow-300">Admin will confirm your payment and set return time</li>
                  <li className="text-yellow-700 dark:text-yellow-300">You'll receive notification when your power bank is ready</li>
                  <li className="text-yellow-700 dark:text-yellow-300">Collect your power bank from the selected station</li>
                </ol>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => navigate('/')} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
                <Button onClick={() => setBookingStep('select')}>
                  Book Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Loading stations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-destructive">Error: {error}</p>
      </div>
    );
  }

  // Calculate quick stats
  const totalStations = stations.length;
  const totalAvailable = stations.reduce((sum, station) => sum + station.total_available, 0);
  const averagePrice = stations.length > 0 
    ? stations.reduce((sum, station) => {
        const stationAvgPrice = station.inventory.reduce((invSum, inv) => 
          invSum + (inv.power_bank_type.price_per_day || 0), 0
        ) / Math.max(station.inventory.length, 1);
        return sum + stationAvgPrice;
      }, 0) / stations.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Rent Power Bank
              </h1>
              <p className="text-muted-foreground mt-1">
                Find and rent power banks near you
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserNotificationBell />
            <ThemeToggle variant="compact" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stations Nearby</p>
                  <p className="text-2xl font-bold">{totalStations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20">
                  <Battery className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Now</p>
                  <p className="text-2xl font-bold">{totalAvailable}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Price</p>
                  <p className="text-2xl font-bold">₦{Math.round(averagePrice).toLocaleString()}/day</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Station List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Available Stations</h2>
          
          <div className="grid gap-6">
            {stations.map((station) => (
              <Card key={station.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{station.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {station.address}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant={station.total_available > 0 ? "default" : "secondary"}>
                        {station.total_available} Available
                      </Badge>
                      {station.low_stock_alert && (
                        <div className="flex items-center gap-1 text-amber-600 text-sm mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {selectedStation === station.id ? (
                    <div className="space-y-6">
                      <PowerBankSelector
                        stationId={station.id}
                        inventory={station.inventory}
                        onSelect={handleRentPowerBank}
                      />
                      
                      {selectedPowerBank && (
                        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <CreditCard className="w-5 h-5" />
                              Payment Method
                            </CardTitle>
                            <CardDescription>Choose how you'd like to pay</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <Button
                                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                                  onClick={() => handlePaymentMethodChange('card')}
                                  className="h-20 flex flex-col gap-2"
                                >
                                  <CreditCard className="w-6 h-6" />
                                  <span>Card Payment</span>
                                </Button>
                                <Button
                                  variant={paymentMethod === 'bank_transfer' ? 'default' : 'outline'}
                                  onClick={() => handlePaymentMethodChange('bank_transfer')}
                                  className="h-20 flex flex-col gap-2"
                                >
                                  <Banknote className="w-6 h-6" />
                                  <span>Bank Transfer</span>
                                </Button>
                              </div>

                              <div className="p-4 bg-muted/30 rounded-lg">
                                <h3 className="font-semibold mb-2">Order Summary</h3>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>Station:</span>
                                    <span>{station.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Power Bank:</span>
                                    <span>{selectedPowerBankData?.power_bank_type?.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Capacity:</span>
                                    <span>{selectedPowerBankData?.power_bank_type?.capacity_mah}mAh</span>
                                  </div>
                                  <div className="flex justify-between font-semibold">
                                    <span>Daily Rate:</span>
                                    <span>₦{selectedPowerBankData?.power_bank_type?.price_per_day || 0}</span>
                                  </div>
                                </div>
                              </div>

                              <Button 
                                onClick={handleCreateBooking}
                                disabled={isCreatingBooking}
                                className="w-full"
                                size="lg"
                              >
                                {isCreatingBooking ? "Creating Booking..." : "Create Booking"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-sm">
                          <span className="font-medium">Distance:</span> {station.distance} km
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Power Bank Types:</span> {station.inventory.length}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mb-4">
                        {station.inventory.slice(0, 4).map((inv) => (
                          <Badge key={inv.id} variant="outline" className="text-xs">
                            {inv.power_bank_type.category} ({inv.available_units})
                          </Badge>
                        ))}
                      </div>

                      <Button 
                        onClick={() => setSelectedStation(station.id)}
                        className="w-full"
                        disabled={station.total_available === 0}
                      >
                        <Battery className="h-4 w-4 mr-2" />
                        {station.total_available === 0 ? 'Out of Stock' : 'Select Power Bank'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-8 border-muted">
          <CardHeader>
            <CardTitle className="text-lg">How to Rent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-medium">Select Station & Type</p>
                  <p className="text-muted-foreground">Choose power bank capacity and rental duration</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-medium">Reserve & Pay</p>
                  <p className="text-muted-foreground">5-minute reservation with secure payment</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="font-medium">Pickup</p>
                  <p className="text-muted-foreground">Collect your power bank from the station</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <p className="font-medium">Return</p>
                  <p className="text-muted-foreground">Return to any station when done</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default RentNow;