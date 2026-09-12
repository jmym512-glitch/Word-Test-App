import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://afsmlwktxopnkenuqccq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'dummy-key-for-initialization'
);

export interface DbStudent {
  id?: string;
  student_id: string;
  password?: string;
  name: string;
  email: string;
  english_name?: string;
  course_class?: string;
  institution?: string;
  nationality?: string;
  created_at?: string;
}
