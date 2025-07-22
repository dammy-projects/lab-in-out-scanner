-- Create demo users using Supabase auth.signup function approach
-- First ensure the demo user email doesn't already exist

-- Check if demo user exists and delete if necessary
DELETE FROM auth.users WHERE email = 'demo@ibacmi.edu';
DELETE FROM auth.users WHERE email = 'admin@ibacmi.edu';

-- Now create the demo users properly
-- For production apps, users would normally sign up through the UI
-- These are demo credentials for testing

-- Demo student user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  confirmed_at,
  email_change,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  role,
  aud
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'demo@ibacmi.edu',
  crypt('demo123', gen_salt('bf')),
  now(),
  null,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Demo", "last_name": "Student", "student_id": "DEMO001"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  now(),
  '',
  '',
  0,
  null,
  '',
  null,
  false,
  null,
  'authenticated',
  'authenticated'
);

-- Demo admin user  
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  confirmed_at,
  email_change,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  role,
  aud
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'admin@ibacmi.edu',
  crypt('admin123', gen_salt('bf')),
  now(),
  null,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "User"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  now(),
  '',
  '',
  0,
  null,
  '',
  null,
  false,
  null,
  'authenticated',
  'authenticated'
);

-- The handle_new_user trigger should automatically create profile records
-- but let's ensure they exist with the correct data
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
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  student_id = EXCLUDED.student_id,
  role = EXCLUDED.role,
  qr_code = EXCLUDED.qr_code;

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
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;