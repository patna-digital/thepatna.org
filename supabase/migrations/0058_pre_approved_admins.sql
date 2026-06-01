CREATE TABLE public.pre_approved_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  added_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pre_approved_admins_email_unique UNIQUE (email)
);

ALTER TABLE public.pre_approved_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admins_select_pre_approved"
  ON public.pre_approved_admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "super_admins_insert_pre_approved"
  ON public.pre_approved_admins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "super_admins_delete_pre_approved"
  ON public.pre_approved_admins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );
