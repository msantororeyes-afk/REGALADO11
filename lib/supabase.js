// /lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// --- Safe Supabase initialization ---
// Next.js renders pages both on the server and the browser.
// To avoid Vercel build crashes, we only use localStorage in the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// If we're in the browser, use localStorage for persistent login
// If we're on the server (during build or SSR), skip storage to avoid errors.
export const supabase =
  typeof window !== "undefined"
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          storage: window.localStorage,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
