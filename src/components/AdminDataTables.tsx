import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { CheckCircle, Clock, Users, AlertTriangle, Plus, RotateCcw } from 'lucide-react';

interface AdminDataTablesProps {
  activeRentals: any[];
  pendingReturns: any[];
  onConfirmReturn: (rentalId: string) => void;
  onExtendRental?: (rentalId: string, duration: number, type: 'hours' | 'days') => void;
  onForceReturn?: (rentalId: string) => void;
}

export const AdminDataTables: React.FC<AdminDataTablesProps> = ({
  activeRentals,
  pendingReturns,
  onConfirmReturn,
  onExtendRental,
  onForceReturn
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInfo = (item: any) => {
    // Handle different data structures for user info
    if (item.profiles) {
      return {
        name: item.profiles.full_name || 'Unknown User',
        email: item.profiles.email || 'Unknown Email'
      };
    }
    if (item.rental?.profiles) {
      return {
        name: item.rental.profiles.full_name || 'Unknown User',
        email: item.rental.profiles.email || 'Unknown Email'
      };
    }
    return {
      name: 'Unknown User',
      email: 'Unknown Email'
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Rentals */}
      <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-blue-600" />
            Active Rentals ({activeRentals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeRentals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active rentals
              </p>
            ) : (
              activeRentals.slice(0, 5).map((rental) => {
                const userInfo = getUserInfo(rental);
                return (
                  <div key={rental.id} className="p-3 bg-background/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{userInfo.name}</p>
                        <p className="text-xs text-muted-foreground">{userInfo.email}</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Station: {rental.station?.name || 'Unknown Station'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Started: {formatDate(rental.start_time)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ends: {formatDate(rental.end_time)}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {onExtendRental && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const duration = prompt('Extend by how many hours?');
                            if (duration && !isNaN(Number(duration))) {
                              onExtendRental(rental.id, Number(duration), 'hours');
                            }
                          }}
                          className="text-xs px-2 py-1"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Extend
                        </Button>
                      )}
                      {onForceReturn && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => onForceReturn(rental.id)}
                          className="text-xs px-2 py-1"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Force Return
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Returns */}
      <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Pending Returns ({pendingReturns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingReturns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending returns
              </p>
            ) : (
              pendingReturns.slice(0, 5).map((rental) => {
                const userInfo = getUserInfo(rental);
                return (
                  <div key={rental.id} className="p-3 bg-background/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{userInfo.name}</p>
                        <p className="text-xs text-muted-foreground">{userInfo.email}</p>
                      </div>
                      <Badge variant="destructive">Overdue</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Station: {rental.station?.name || 'Unknown Station'}
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => onConfirmReturn(rental.id)}
                      className="w-full"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Confirm Return
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};