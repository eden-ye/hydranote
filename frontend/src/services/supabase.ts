/**
 * Supabase Client Service
 * FE-401: Supabase Client (Frontend)
 *
 * Initializes the Supabase client for frontend use.
 * Uses the anon key (public) for client-side operations.
 */
import { createClient, type User, type Session, type AuthChangeEvent } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  console.warn('Missing VITE_SUPABASE_URL environment variable')
}
if (!supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

/**
 * Supabase client instance
 * Uses anon key for client-side auth operations
 */
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

/**
 * Sign in with Google OAuth
 * Redirects to Google sign-in page
 */
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  })
}

/**
 * Sign out the current user
 */
export async function signOut() {
  return supabase.auth.signOut()
}

/**
 * Get the current session
 * Returns null if no user is logged in
 */
export async function getSession() {
  return supabase.auth.getSession()
}

/**
 * Subscribe to auth state changes
 * Callback is called when user signs in, signs out, or session refreshes
 *
 * @param callback - Function to call on auth state change
 * @returns Subscription object with unsubscribe method
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}

// Re-export types for convenience
export type { User, Session, AuthChangeEvent }
