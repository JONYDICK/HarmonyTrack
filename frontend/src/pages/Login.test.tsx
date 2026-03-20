import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'

// Mock the api service
vi.mock('../../services/api', () => ({
  spotifyAuthService: {
    getAuthURL: vi.fn(() => 'https://accounts.spotify.com/authorize?client_id=test'),
  },
}))

describe('Login Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should render the login page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByText(/HarmonyTrack/i)).toBeInTheDocument()
    expect(screen.getByText(/mood tracker/i)).toBeInTheDocument()
  })

  it('should display spotify login button', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const loginButton = screen.getByRole('button', { name: /spotify/i })
    expect(loginButton).toBeInTheDocument()
  })

  it('should display feature highlights', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByText(/analyze your mood/i)).toBeInTheDocument()
    expect(screen.getByText(/discover playlists/i)).toBeInTheDocument()
    expect(screen.getByText(/track your emotions/i)).toBeInTheDocument()
  })

  it('should have correct styling classes', () => {
    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    const loginContainer = container.querySelector('.login-container')
    expect(loginContainer).toBeInTheDocument()
    expect(loginContainer).toHaveClass('spotify-login-theme')
  })
})
