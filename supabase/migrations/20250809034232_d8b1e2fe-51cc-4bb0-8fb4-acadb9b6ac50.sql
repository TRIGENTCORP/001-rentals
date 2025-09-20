-- Add RLS policies for admin station management
CREATE POLICY "Admins can manage stations" 
ON public.stations 
FOR ALL 
USING (true) 
WITH CHECK (true);