/**
 * User Menu Component
 * FE-403: Login/Logout UI
 *
 * Displays user info and logout option when authenticated.
 */
import { signOut, type User } from '@/services/supabase'

interface UserMenuProps {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const displayName = user.user_metadata?.full_name || user.email || 'User'
  const avatarUrl = user.user_metadata?.avatar_url

  const handleLogout = () => {
    signOut()
  }

  return (
    <div
      data-testid="user-menu"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#4285f4',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span
          style={{
            fontSize: '14px',
            color: '#333',
          }}
        >
          {displayName}
        </span>
      </div>
      <button
        data-testid="logout-button"
        onClick={handleLogout}
        style={{
          padding: '6px 12px',
          backgroundColor: 'transparent',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          color: '#666',
        }}
      >
        Sign out
      </button>
    </div>
  )
}
