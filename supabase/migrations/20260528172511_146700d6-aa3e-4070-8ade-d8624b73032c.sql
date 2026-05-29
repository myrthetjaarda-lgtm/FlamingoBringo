
REVOKE EXECUTE ON FUNCTION public.is_event_organizer(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_event_organizer(UUID) TO authenticated, service_role;
