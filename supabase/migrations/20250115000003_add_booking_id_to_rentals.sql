-- Add booking_id field to rentals table to link rentals to bookings
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Add unique constraint to prevent duplicate rentals for the same booking
-- Note: IF NOT EXISTS is not supported for ADD CONSTRAINT, so we use DO block
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_rental_per_booking'
    ) THEN
        ALTER TABLE public.rentals ADD CONSTRAINT unique_rental_per_booking UNIQUE (booking_id);
    END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rentals_booking_id ON public.rentals(booking_id);

-- Add comment for documentation
COMMENT ON COLUMN public.rentals.booking_id IS 'Links rental to the original booking that created it';
