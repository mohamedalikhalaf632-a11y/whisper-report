
-- Fix privilege escalation: only allow inserting role='student' with status='pending' for self
DROP POLICY IF EXISTS "user inserts own role" ON public.user_roles;
CREATE POLICY "user inserts own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'student'::app_role
  AND status = 'pending'::account_status
);

-- Lock down trigger-only functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
