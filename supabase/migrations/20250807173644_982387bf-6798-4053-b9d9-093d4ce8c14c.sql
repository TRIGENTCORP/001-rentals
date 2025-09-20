-- Create stations table
CREATE TABLE public.stations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    total_power_banks INTEGER NOT NULL DEFAULT 0,
    price_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rentals table
CREATE TABLE public.rentals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    station_id UUID NOT NULL REFERENCES public.stations(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rental_id UUID NOT NULL REFERENCES public.rentals(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'opay',
    payment_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stations (public read access)
CREATE POLICY "Anyone can view stations" 
ON public.stations 
FOR SELECT 
USING (true);

-- RLS Policies for rentals (users can only see their own)
CREATE POLICY "Users can view their own rentals" 
ON public.rentals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rentals" 
ON public.rentals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rentals" 
ON public.rentals 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for transactions (users can only see their own)
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.rentals 
        WHERE rentals.id = transactions.rental_id 
        AND rentals.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create transactions for their rentals" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.rentals 
        WHERE rentals.id = transactions.rental_id 
        AND rentals.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update transactions for their rentals" 
ON public.transactions 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.rentals 
        WHERE rentals.id = transactions.rental_id 
        AND rentals.user_id = auth.uid()
    )
);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_stations_updated_at
    BEFORE UPDATE ON public.stations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rentals_updated_at
    BEFORE UPDATE ON public.rentals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to get available power banks for a station
CREATE OR REPLACE FUNCTION public.get_available_power_banks(station_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_power_banks INTEGER;
    active_rentals INTEGER;
BEGIN
    -- Get total power banks for the station
    SELECT stations.total_power_banks INTO total_power_banks
    FROM public.stations
    WHERE stations.id = station_id;
    
    -- Get count of active rentals for the station
    SELECT COUNT(*) INTO active_rentals
    FROM public.rentals
    WHERE rentals.station_id = station_id
    AND rentals.status = 'active';
    
    -- Return available power banks
    RETURN COALESCE(total_power_banks, 0) - COALESCE(active_rentals, 0);
END;
$$ LANGUAGE plpgsql;

-- Insert sample stations
INSERT INTO public.stations (name, address, total_power_banks, price_per_hour, latitude, longitude) VALUES
('Metro Station Central', '123 Downtown Ave, Lagos', 10, 5.00, 6.5244, 3.3792),
('Shopping Mall Power Point', '456 Victoria Island, Lagos', 15, 6.00, 6.4281, 3.4219),
('Airport Terminal Hub', 'Murtala Muhammed Airport, Lagos', 20, 7.50, 6.5772, 3.3212),
('University Campus Hub', 'University of Lagos, Akoka', 12, 4.50, 6.5158, 3.3904),
('Business District Station', 'Ikoyi Business District, Lagos', 8, 8.00, 6.4698, 3.4398);