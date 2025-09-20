-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" 
ON public.payments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow admins to view all payments
CREATE POLICY "Admin users can view all payments" 
ON public.payments 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');