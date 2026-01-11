/**
 * Auth Store (Zustand)
 * FE-402: Auth Store
 *
 * Manages authentication state for the application.
 * Syncs with Supabase auth state changes.
 */
import { create } from 'zustand'
import { getSession, onAuthStateChange, type User, type Session } from '@/services/supabase'

/**
 * Auth state interface
 */
export interface AuthState {
  /** Current authenticated user or null */
  user: User | null
  /** Current session or null */
  session: Session | null
  /** Whether auth is currently loading/initializing */
  isLoading: boolean
  /** Whether auth has been initialized */
  isInitialized: boolean
}

/**
 * Auth actions interface
 */
interface AuthActions {
  /** Set the current user */
  setUser: (user: User | null) => void
  /** Set the current session */
  setSession: (session: Session | null) => void
  /** Set loading state */
  setLoading: (isLoading: boolean) => void
  /** Clear user and session (logout) */
  clearUser: () => void
}

/**
 * Auth store combining state and actions
 */
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // Initial state
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  // Actions
  setUser: (user) => set({ user }),

  setSession: (session) => set({ session }),

  setLoading: (isLoading) => set({ isLoading }),

  clearUser: () => set({ user: null, session: null }),
}))

/**
 * Selector for getting the access token from session
 */
export const selectAccessToken = (state: AuthState): string | null =>
  state.session?.access_token ?? null

/**
 * Selector for checking if user is authenticated
 */
export const selectIsAuthenticated = (state: AuthState): boolean =>
  state.user !== null && state.session !== null

/**
 * Initialize auth by getting current session and subscribing to changes.
 * Call this once at app startup (e.g., in App.tsx or main.tsx).
 *
 * @returns Unsubscribe function to clean up the subscription
 */
export async function initializeAuth(): Promise<() => void> {
  const { setUser, setSession, setLoading } = useAuthStore.getState()

  // Get current session
  const { data } = await getSession()

  if (data.session) {
    setSession(data.session)
    setUser(data.session.user)
  }

  setLoading(false)
  useAuthStore.setState({ isInitialized: true })

  // Subscribe to auth state changes
  const { data: authListener } = onAuthStateChange((_event, session) => {
    setSession(session)
    setUser(session?.user ?? null)
  })

  // Return unsubscribe function
  return () => {
    authListener.subscription.unsubscribe()
  }
}
