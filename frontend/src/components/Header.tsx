/**
 * Header Component
 * FE-403: Login/Logout UI
 *
 * App header with auth controls.
 */
import { useAuthStore } from '@/stores/auth-store'
import { LoginButton } from './LoginButton'
import { UserMenu } from './UserMenu'

export function Header() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)

  return (
    <header
      data-testid="app-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid #eee',
      }}
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 600,
          margin: 0,
          color: '#333',
        }}
      >
        Hydra Notes
      </h1>
      <div>
        {user ? (
          <UserMenu user={user} />
        ) : (
          <LoginButton isLoading={isLoading} />
        )}
      </div>
    </header>
  )
}
