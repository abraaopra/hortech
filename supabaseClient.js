import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Encontre essas informações nas configurações do seu projeto Supabase
// (Project Settings > API)
const supabaseUrl = "https://byylcqsphzvwkrehlwgf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eWxjcXNwaHp2d2tyZWhsd2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDQzMjAsImV4cCI6MjA3MTgyMDMyMH0.zWvIbSYY4ontCZ5f9q1jiHztMV8JMv8tXcOjVsZvo9M";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Especifica como a sessão do usuário será armazenada no dispositivo
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});