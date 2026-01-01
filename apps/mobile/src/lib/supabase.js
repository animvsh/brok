import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables, using fallback');
}

export const supabase = createClient(
  supabaseUrl || 'https://iqqkdhifygfrqpxedtgk.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcWtkaGlmeWdmcnFweGVkdGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjU0ODQsImV4cCI6MjA4MTM0MTQ4NH0.CQYSrcEy-NbSYnZKOxahMCB86O_NqeToQZ0cRWH7OsA',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export default supabase;
