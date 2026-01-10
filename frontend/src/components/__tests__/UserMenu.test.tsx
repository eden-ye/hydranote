/**
 * Tests for UserMenu Component
 * FE-403: Login/Logout UI
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { User } from '@supabase/supabase-js'

// Mock the services
vi.mock('@/services/supabase', () => ({
  signOut: vi.fn(),
}))

import { UserMenu } from '../UserMenu'
import { signOut } from '@/services/supabase'

// Helper to create mock user
function createMockUser(): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    created_at: '2024-01-01',
    app_metadata: {},
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.png',
    },
  } as User
}

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render user menu', () => {
    render(<UserMenu user={createMockUser()} />)
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
  })

  it('should display user name or email', () => {
    render(<UserMenu user={createMockUser()} />)
    expect(screen.getByText(/test user|test@example.com/i)).toBeInTheDocument()
  })

  it('should have a logout button', () => {
    render(<UserMenu user={createMockUser()} />)
    expect(screen.getByTestId('logout-button')).toBeInTheDocument()
  })

  it('should call signOut when logout is clicked', () => {
    render(<UserMenu user={createMockUser()} />)
    const logoutButton = screen.getByTestId('logout-button')
    fireEvent.click(logoutButton)
    expect(signOut).toHaveBeenCalled()
  })

  it('should show user email when no name is available', () => {
    const userWithoutName = {
      ...createMockUser(),
      user_metadata: {},
    }
    render(<UserMenu user={userWithoutName as User} />)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })
})
