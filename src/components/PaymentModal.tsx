import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: {
    id: string;
    station_name: string;
    amount: number;
    pricing?: any;
    scheduledStartTime?: Date;
  };
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  rental,
  onSuccess
}) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!phone) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to proceed with payment.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('opay-payment', {
        body: {
          amount: Math.round(rental.amount * 100), // Convert to kobo
          phone: phone,
          reference: `rental_${rental.id}_${Date.now()}`,
          description: `Power bank rental at ${rental.station_name}`
        }
      });

      if (error) throw error;

      if (data?.status === 'success') {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
        onSuccess();
      } else {
        throw new Error(data?.message || 'Payment failed');
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {rental.scheduledStartTime ? 'Schedule Rental Payment' : 'Complete Payment'}
          </DialogTitle>
          <DialogDescription>
            {rental.scheduledStartTime 
              ? `Schedule and pay for your power bank rental at ${rental.station_name}`
              : `Complete payment for your power bank rental at ${rental.station_name}`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {rental.pricing ? (
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h4 className="font-medium">Pricing Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base price</span>
                  <span>₦{rental.pricing.base_price?.toFixed(2) || 0}</span>
                </div>
                
                {rental.pricing.peak_surcharge > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Peak hour surcharge</span>
                    <span>+₦{rental.pricing.peak_surcharge?.toFixed(2) || 0}</span>
                  </div>
                )}
                
                {rental.pricing.weekend_premium > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Weekend premium</span>
                    <span>+₦{rental.pricing.weekend_premium?.toFixed(2) || 0}</span>
                  </div>
                )}
                
                {rental.pricing.loyalty_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Loyalty discount</span>
                    <span>-₦{rental.pricing.loyalty_discount?.toFixed(2) || 0}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-muted-foreground">
                  <span>Security deposit</span>
                  <span>₦{rental.pricing.security_deposit?.toFixed(2) || 0}</span>
                </div>
                
                <hr className="my-2" />
                
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Total Amount:</span>
                  <span>₦{rental.pricing.total_amount?.toFixed(2) || 0}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-2xl font-bold">₦{rental.amount}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Includes security deposit
              </p>
            </div>
          )}

          {rental.scheduledStartTime && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📅 Scheduled for {rental.scheduledStartTime.toLocaleDateString()} at {rental.scheduledStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Free cancellation until 1 hour before pickup time
              </p>
            </div>
          )}
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2"
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={loading || !phone}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₦${rental.amount}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};