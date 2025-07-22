-- Insert demo users directly into auth.users and profiles
-- Note: In production, users should sign up through the application

-- Insert demo student user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  raw_user_meta_data
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'demo@ibacmi.edu',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{"first_name": "Demo", "last_name": "Student", "student_id": "DEMO001"}'::jsonb
);

-- Insert demo admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  raw_user_meta_data
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'admin@ibacmi.edu',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{"first_name": "Admin", "last_name": "User"}'::jsonb
);

-- Insert corresponding profile records
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  student_id,
  role,
  qr_code
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo',
  'Student',
  'DEMO001',
  'student',
  'DEMO001'
);

INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  role
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Admin',
  'User',
  'admin'
);