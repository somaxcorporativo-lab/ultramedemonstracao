import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars in different environments (CRA, Vite, etc)
const getEnv = (key: string) => {
  // Check import.meta.env (Vite)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // Check process.env (CRA/Node)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

// Uses the provided credentials as default if env vars are missing
const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || 'https://awyvggdlkchfktlslpdy.supabase.co';
const supabaseKey = getEnv('REACT_APP_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable__l8JIDUAYxjIDoca4mNQog_bOTOLDgL';

export const isConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);