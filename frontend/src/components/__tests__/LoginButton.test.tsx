/**
 * Tests for LoginButton Component
 * FE-403: Login/Logout UI
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock the services
vi.mock('@/services/supabase', () => ({
  signInWithGoogle: vi.fn(),
}))

import { LoginButton } from '../LoginButton'
import { signInWithGoogle } from '@/services/supabase'

describe('LoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login button', () => {
    render(<LoginButton />)
    expect(screen.getByTestId('login-button')).toBeInTheDocument()
  })

  it('should display "Sign in with Google" text', () => {
    render(<LoginButton />)
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
  })

  it('should call signInWithGoogle when clicked', () => {
    render(<LoginButton />)
    const button = screen.getByTestId('login-button')
    fireEvent.click(button)
    expect(signInWithGoogle).toHaveBeenCalled()
  })

  it('should show loading state when isLoading is true', () => {
    render(<LoginButton isLoading={true} />)
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('should be disabled when loading', () => {
    render(<LoginButton isLoading={true} />)
    const button = screen.getByTestId('login-button')
    expect(button).toBeDisabled()
  })

  it('should not be disabled when not loading', () => {
    render(<LoginButton isLoading={false} />)
    const button = screen.getByTestId('login-button')
    expect(button).not.toBeDisabled()
  })
})
