/**
 * UserInfo Component
 * FE-503: Left Panel with Favorites
 *
 * Displays user avatar and name when logged in, login button when not.
 */
import { useAuthStore } from '@/stores/auth-store'
import { signInWithGoogle, signOut } from '@/services/supabase'

export function UserInfo() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)

  if (!user) {
    return (
      <button
        data-testid="sidebar-login-button"
        onClick={() => signInWithGoogle()}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '8px 12px',
          backgroundColor: isLoading ? '#333' : '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    )
  }

  const displayName = user.user_metadata?.full_name || user.email || 'User'
  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <div
      data-testid="sidebar-user-info"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '4px 0',
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
          }}
        />
      ) : (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#4285f4',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            color: '#ddd',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </div>
      </div>
      <button
        data-testid="sidebar-logout-button"
        onClick={() => signOut()}
        title="Sign out"
        style={{
          padding: '4px 8px',
          backgroundColor: 'transparent',
          border: '1px solid #444',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          color: '#888',
        }}
      >
        Sign out
      </button>
    </div>
  )
}
