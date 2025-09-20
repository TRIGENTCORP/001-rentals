-- Add RLS policies for admin station management
CREATE POLICY "Admins can manage stations" 
ON public.stations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for stations updated_at
CREATE TRIGGER update_stations_updated_at
BEFORE UPDATE ON public.stations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();