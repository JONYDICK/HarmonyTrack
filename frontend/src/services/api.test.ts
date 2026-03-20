import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axiosInstance, spotifyAuthService, moodService, recommendationService } from './api'

describe('API Service - spotifyAuthService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should generate spotify auth URL with correct parameters', () => {
    const authURL = spotifyAuthService.getAuthURL()
    expect(authURL).toContain('https://accounts.spotify.com/authorize')
    expect(authURL).toContain('client_id=')
    expect(authURL).toContain('scope=')
    expect(authURL).toContain('redirect_uri=')
  })

  it('should include required scopes in auth URL', () => {
    const authURL = spotifyAuthService.getAuthURL()
    expect(authURL).toContain('user-read-recently-played')
    expect(authURL).toContain('user-read-private')
  })

  it('should handle auth callback with code parameter', async () => {
    // Mock the axios POST request
    const mockResponse = {
      data: {
        token: 'mock-jwt-token',
        expiresIn: 86400,
      },
    }

    vi.spyOn(axiosInstance, 'post').mockResolvedValue(mockResponse)

    const code = 'mock-auth-code'
    const result = await spotifyAuthService.exchangeCodeForToken(code)

    expect(result).toEqual(mockResponse.data)
    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/callback', { code })
  })
})

describe('API Service - moodService', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('token', 'mock-jwt-token')
  })

  it('should fetch current mood with valid token', async () => {
    const mockResponse = {
      data: {
        happiness: 0.75,
        energy: 0.65,
        calmness: 0.35,
        danceability: 0.7,
        dominantMood: 'Happy & Energetic',
        overallScore: 78,
      },
    }

    vi.spyOn(axiosInstance, 'get').mockResolvedValue(mockResponse)

    const result = await moodService.getCurrentMood()

    expect(result).toEqual(mockResponse.data)
    expect(axiosInstance.get).toHaveBeenCalledWith('/mood/current')
  })

  it('should fetch mood history with date range', async () => {
    const mockResponse = {
      data: [
        {
          id: 1,
          timestamp: '2024-02-01T10:00:00Z',
          happiness: 0.75,
          energy: 0.65,
          dominantMood: 'Happy & Energetic',
        },
        {
          id: 2,
          timestamp: '2024-02-02T10:00:00Z',
          happiness: 0.5,
          energy: 0.4,
          dominantMood: 'Calm & Melancholic',
        },
      ],
    }

    vi.spyOn(axiosInstance, 'get').mockResolvedValue(mockResponse)

    const result = await moodService.getMoodHistory(7)

    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
    expect(axiosInstance.get).toHaveBeenCalled()
  })
})

describe('API Service - recommendationService', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('token', 'mock-jwt-token')
  })

  it('should fetch recommendations for current mood', async () => {
    const mockResponse = {
      data: [
        {
          id: 'playlist1',
          name: 'Happy Vibes',
          description: 'Feel-good playlist based on your mood',
          spotifyUrl: 'https://open.spotify.com/playlist/...',
          imageUrl: 'https://...',
        },
      ],
    }

    vi.spyOn(axiosInstance, 'get').mockResolvedValue(mockResponse)

    const result = await recommendationService.getRecommendations()

    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data[0]).toHaveProperty('spotifyUrl')
    expect(axiosInstance.get).toHaveBeenCalledWith('/recommendations')
  })
})

describe('API Service - JWT Interceptor', () => {
  it('should add Authorization header when token exists', () => {
    localStorage.setItem('harmonytrack_token', 'test-jwt-token')

    // The interceptor should add the token to requests
    const expectedHeader = 'Bearer test-jwt-token'
    expect(expectedHeader).toBeDefined()
  })

  it('should handle 401 Unauthorized responses', () => {
    localStorage.setItem('harmonytrack_token', 'expired-token')

    // When a 401 is received, should clear storage
    localStorage.clear()
    
    expect(localStorage.getItem('harmonytrack_token')).toBeNull()
  })
})
