import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Battery, Clock, Zap, AlertTriangle } from "lucide-react";

interface PowerBankSelectorProps {
  stationId: string;
  inventory: Array<{
    id: string;
    available_units: number;
    power_bank_type: {
      id: string;
      name: string;
      category: string;
      capacity_mah: number;
      price_per_hour: number;
      price_per_day: number;
      target_devices: string;
    };
  }>;
  onSelect: (powerBankTypeId: string) => void;
}

const PowerBankSelector: React.FC<PowerBankSelectorProps> = ({
  stationId,
  inventory,
  onSelect
}) => {
  const [selectedType, setSelectedType] = useState<string>('');

  const selectedInventory = inventory.find(inv => inv.power_bank_type.id === selectedType);

  const handleRent = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Power Bank</CardTitle>
        <CardDescription>
          Choose your preferred power bank type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">Power Bank Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select power bank type" />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((inv) => (
                  <SelectItem key={inv.id} value={inv.power_bank_type.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{inv.power_bank_type.name} ({inv.power_bank_type.capacity_mah}mAh)</span>
                      <Badge variant="outline" className="ml-2">
                        {inv.available_units} available
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {selectedInventory && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Selected Power Bank Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-primary" />
                    <span>{selectedInventory.power_bank_type.capacity_mah}mAh</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>{selectedInventory.power_bank_type.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>₦{selectedInventory.power_bank_type.price_per_day}/day</span>
                  </div>
                  <div className="text-muted-foreground">
                    {selectedInventory.power_bank_type.target_devices}
                  </div>
                </div>

                {selectedInventory.available_units <= 3 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Only {selectedInventory.available_units} units left!
                  </div>
                )}
              </div>
            </>
          )}

          <Button 
            onClick={handleRent}
            className="w-full"
            disabled={!selectedType || selectedInventory?.available_units === 0}
          >
            <Battery className="h-4 w-4 mr-2" />
            {selectedInventory?.available_units === 0 ? 'Out of Stock' : 'Rent Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export { PowerBankSelector };