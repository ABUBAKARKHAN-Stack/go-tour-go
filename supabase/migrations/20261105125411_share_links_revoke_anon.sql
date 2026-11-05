-- Supabase's default privileges grant new functions to anon; ending links needs a signed-in sender.
revoke execute on function public.end_shared_location(text) from anon;
revoke execute on function public.end_my_live_links() from anon;
