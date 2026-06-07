
-- Enums
CREATE TYPE public.app_role AS ENUM ('student', 'supervisor', 'admin');
CREATE TYPE public.account_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE public.complaint_status AS ENUM ('pending', 'under_review', 'resolved', 'rejected');
CREATE TYPE public.complaint_category AS ENUM ('teachers','labs','internet','schedule','facilities','administration','exams','other');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  status public.account_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND status = 'active'
  )
$$;

-- Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.complaint_category NOT NULL,
  custom_category TEXT,
  status public.complaint_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Suggestions
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.suggestions TO authenticated;
GRANT ALL ON public.suggestions TO service_role;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Replies
CREATE TABLE public.replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  suggestion_id UUID REFERENCES public.suggestions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_role public.app_role NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((complaint_id IS NOT NULL)::int + (suggestion_id IS NOT NULL)::int = 1)
);
GRANT SELECT, INSERT ON public.replies TO authenticated;
GRANT ALL ON public.replies TO service_role;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============

-- profiles
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
CREATE POLICY "user reads own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin reads all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "user inserts own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin updates roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- complaints: student can insert + view own; supervisor/admin can view all (no student_id projected by app)
CREATE POLICY "student creates own complaint" ON public.complaints FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(),'student'));
CREATE POLICY "student reads own complaints" ON public.complaints FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "staff reads all complaints" ON public.complaints FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff updates complaint status" ON public.complaints FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'admin'));

-- suggestions
CREATE POLICY "student creates own suggestion" ON public.suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(),'student'));
CREATE POLICY "student reads own suggestions" ON public.suggestions FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "staff reads all suggestions" ON public.suggestions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'admin'));

-- replies
CREATE POLICY "read replies on visible complaint" ON public.replies FOR SELECT TO authenticated USING (
  (complaint_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND (c.student_id = auth.uid() OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'admin'))))
  OR
  (suggestion_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.suggestions s WHERE s.id = suggestion_id AND (s.student_id = auth.uid() OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'admin'))))
);
CREATE POLICY "insert replies as author" ON public.replies FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = author_id AND public.is_active(auth.uid()) AND (
    (complaint_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND (c.student_id = auth.uid() OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'admin'))))
    OR
    (suggestion_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.suggestions s WHERE s.id = suggestion_id AND (s.student_id = auth.uid() OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'admin'))))
  )
);

-- updated_at trigger for complaints
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Trigger: auto-create profile, first user becomes admin/active, others pending student by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT count(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role, status, approved_at)
    VALUES (NEW.id, 'admin', 'active', now())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
