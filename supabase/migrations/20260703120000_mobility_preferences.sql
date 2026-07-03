-- Mobility preferences: driving, bike/scooter, transit & rideshare accounts,
-- plus a vehicle-on-file card (parking spot + TUV/insurance/tax reminders)
-- that only makes sense once someone has said they own a car.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS driving_license BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owns_car BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bike_scooter_provider TEXT,
  ADD COLUMN IF NOT EXISTS transit_passes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rideshare_provider TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_parking_address TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_parking_note TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_items JSONB NOT NULL DEFAULT '[]';
