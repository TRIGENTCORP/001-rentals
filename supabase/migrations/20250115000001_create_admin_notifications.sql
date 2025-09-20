-- Create admin_notifications table for real-time admin alerts
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking_created', 'booking_confirmed', 'booking_cancelled', 'rental_completed', 'rental_overdue')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view their own notifications
CREATE POLICY "Admins can view their own notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (auth.uid() = user_id AND get_user_role(auth.uid()) = 'admin'::user_role);

-- Admins can update their own notifications (mark as read)
CREATE POLICY "Admins can update their own notifications" 
ON public.admin_notifications 
FOR UPDATE 
USING (auth.uid() = user_id AND get_user_role(auth.uid()) = 'admin'::user_role);

-- System can insert notifications for admins
CREATE POLICY "System can insert admin notifications" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (get_user_role(user_id) = 'admin'::user_role);

-- Add updated_at trigger
CREATE TRIGGER update_admin_notifications_updated_at
  BEFORE UPDATE ON public.admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for user notifications
CREATE INDEX idx_admin_notifications_user_id ON public.admin_notifications(user_id);

-- Create index for unread notifications
CREATE INDEX idx_admin_notifications_unread ON public.admin_notifications(user_id, read) WHERE read = false;

-- Create index for notification type
CREATE INDEX idx_admin_notifications_type ON public.admin_notifications(type);

-- Create index for created_at (for sorting)
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
