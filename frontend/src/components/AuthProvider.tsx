/**
 * Auth Provider Component
 * FE-403: Login/Logout UI
 *
 * Wraps the app to initialize auth and provide loading state.
 */
import { useEffect, type ReactNode } from 'react'
import { useAuthStore, initializeAuth } from '@/stores/auth-store'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isLoading = useAuthStore((state) => state.isLoading)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const init = async () => {
      unsubscribe = await initializeAuth()
    }

    init()

    return () => {
      unsubscribe?.()
    }
  }, [])

  // Show loading state while initializing auth
  if (isLoading && !isInitialized) {
    return (
      <div
        data-testid="auth-loading"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#666',
          fontSize: '14px',
        }}
      >
        Loading...
      </div>
    )
  }

  return <>{children}</>
}
