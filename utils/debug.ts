import Constants from 'expo-constants';

export const debugSupabaseConfig = () => {
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('=== DEBUG SUPABASE CONFIG ===');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key (primeros 10 chars):', supabaseAnonKey?.substring(0, 10) + '...');
  console.log('Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
  console.log('process.env:', {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
  });
  console.log('=============================');
};