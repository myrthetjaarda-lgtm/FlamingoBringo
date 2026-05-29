
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_group_owner_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid) TO authenticated;
