-- Clear example power bank types
DELETE FROM public.power_bank_types WHERE name IN (
  'Mini Power Bank',
  'Standard Power Bank', 
  'Pro Power Bank',
  'Max Power Bank'
);

-- Also clear any station inventory that references these power bank types
DELETE FROM public.station_inventory 
WHERE power_bank_type_id IN (
  SELECT id FROM public.power_bank_types WHERE name IN (
    'Mini Power Bank',
    'Standard Power Bank',
    'Pro Power Bank', 
    'Max Power Bank'
  )
);
