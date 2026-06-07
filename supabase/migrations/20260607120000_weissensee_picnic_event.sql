-- Weisser See Picnic event seed
-- Run this in the Supabase SQL editor (uses service_role context)

DO $$
DECLARE
  v_organizer_id uuid;
  v_event_id uuid;
BEGIN
  -- Look up the organiser by email (works in service-role / SQL-editor context)
  SELECT id INTO v_organizer_id
  FROM auth.users
  WHERE email = 'myrthetjaarda@gmail.com'
  LIMIT 1;

  IF v_organizer_id IS NULL THEN
    RAISE EXCEPTION 'Organiser user not found – make sure you are signed up first';
  END IF;

  -- Insert the event
  INSERT INTO public.events (id, organizer_id, name, description, starts_at, location)
  VALUES (
    gen_random_uuid(),
    v_organizer_id,
    'Weisser See Picnic ☀️',
    E'Summer picnic at Weißer See!\n\nAdmission: Strandbad 9,50 €\n\nEveryone brings: Drinks (beer/wine/water), Sunscreen, Sunglasses, Towel, Bathing suit, Blanket, Paper plates, Fork & Knife\n\nPlan B if rain: BRLO or Cafe am Neuen See\n\nOptional evening from 19:00: free Indian vegetarian food at Jagannatha Temple ISKCON Berlin 🕌',
    '2026-06-20 14:00:00+02',  -- adjust date if needed
    'Strandbad Weißer See, Falkenberger Str. 135, 13088 Berlin (M12 tram: Berliner Allee)'
  )
  RETURNING id INTO v_event_id;

  -- Shared food items (with suggested claimer notes)
  INSERT INTO public.bring_items (event_id, name, emoji, required, created_by) VALUES
    (v_event_id, 'Baguette',     '🥖', true,  v_organizer_id),
    (v_event_id, 'Tomatoes',     '🍅', true,  v_organizer_id),
    (v_event_id, 'Fruit',        '🍓', true,  v_organizer_id),
    (v_event_id, 'Nuts',         '🥜', false, v_organizer_id),
    (v_event_id, 'Chips',        '🥨', false, v_organizer_id),
    (v_event_id, 'Boiled eggs',  '🥚', true,  v_organizer_id),
    (v_event_id, 'Dips',         '🫙', false, v_organizer_id);

  -- Other shared gear
  INSERT INTO public.bring_items (event_id, name, emoji, required, created_by) VALUES
    (v_event_id, 'Music box',    '🎵', false, v_organizer_id),
    (v_event_id, 'Garbage bags', '🗑️', true,  v_organizer_id),
    (v_event_id, 'Games',        '🎲', false, v_organizer_id),
    (v_event_id, 'Parasol',      '☂️', false, v_organizer_id);

  RAISE NOTICE 'Weisser See Picnic created: event_id = %', v_event_id;
END;
$$;
