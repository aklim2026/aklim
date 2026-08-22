import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Lazy initialization to prevent app crash if keys are missing initially
export const getSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
    return null;
  }
  
  // Sanitize URL to remove trailing slashes or /rest/v1 suffix if user added it by mistake
  let sanitizedUrl = supabaseUrl.trim();
  if (sanitizedUrl.endsWith('/')) {
    sanitizedUrl = sanitizedUrl.slice(0, -1);
  }
  if (sanitizedUrl.endsWith('/rest/v1')) {
    sanitizedUrl = sanitizedUrl.replace('/rest/v1', '');
  }
  
  return createClient(sanitizedUrl, supabaseAnonKey);
};

export const supabase = getSupabase();
