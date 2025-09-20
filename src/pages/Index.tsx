import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useStationInventory } from "@/hooks/useStationInventory";
import { useRentals } from "@/hooks/useRentals";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { 
  Battery, 
  Zap, 
  Clock, 
  DollarSign, 
  MapPin, 
  Star,
  Plus,
  Calendar,
  TrendingUp,
  Users,
  LogOut,
  User as UserIcon
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { stations } = useStationInventory();
  const { rentals } = useRentals();
  const { activities, loading: activitiesLoading, formatTimeAgo } = useRecentActivity();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">PowerBank Booking</CardTitle>
            <CardDescription>
              Book power banks of different sizes and prices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Sign In / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Battery className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">PowerBank Pro</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back!
          </h2>
          <p className="text-muted-foreground">
            Manage your power bank rentals and discover new locations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Rentals</p>
                  <p className="text-2xl font-bold text-foreground">
                    {rentals?.filter(r => r.status === 'active').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₦{rentals?.reduce((sum, r) => sum + (r.total_amount || 0), 0).toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Power Banks</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stations?.reduce((sum, s) => sum + s.total_available, 0) || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Battery className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stations Available</p>
                  <p className="text-2xl font-bold text-foreground">{stations?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Power Banks */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold">Available Power Banks</CardTitle>
                  <CardDescription>Find and rent power banks near you</CardDescription>
                </div>
                <Button className="shrink-0" onClick={() => navigate("/rent")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Rent Now
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dynamic Power Bank Items from stations */}
                {stations?.slice(0, 3).map((station, index) => {
                  // Get the most available power bank type from this station
                  const topInventory = station.inventory.sort((a, b) => b.available_units - a.available_units)[0];
                  if (!topInventory) return null;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Battery className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{topInventory.power_bank_type.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {station.name}
                            </span>
                            <span className="flex items-center">
                              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                              4.{8 - index}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">₦{topInventory.power_bank_type.price_per_day || 0}/day</p>
                        <Badge 
                          variant={topInventory.available_units > 5 ? "default" : topInventory.available_units > 0 ? "secondary" : "destructive"} 
                          className="text-xs"
                        >
                          {topInventory.available_units} available
                        </Badge>
                      </div>
                    </div>
                  );
                }) || [
                  // Fallback mock data if no stations yet
                  { name: "Standard 10,000mAh", price: "₦500/day", location: "Loading stations...", rating: 4.8, available: 0 }
                ].map((powerbank, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Battery className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{powerbank.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {powerbank.location}
                          </span>
                          <span className="flex items-center">
                            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {powerbank.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{powerbank.price}</p>
                      <Badge variant="secondary" className="text-xs">
                        {powerbank.available} available
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading activities...</span>
                  </div>
                ) : activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'active' ? 'bg-green-500' : 
                        activity.status === 'completed' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.station_name && `${activity.station_name} • `}
                          {activity.amount && `₦${activity.amount.toLocaleString()} • `}
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground">Your activity will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  Find Locations
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Rental History
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Payment Methods
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
