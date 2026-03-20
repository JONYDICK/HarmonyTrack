// Mock Spotify data for Demo Mode
// This provides realistic data with real Spotify images so users can see the full app experience

export const mockProfile = {
  id: 'demo_user',
  display_name: 'Demo User',
  email: 'demo@harmonytrack.app',
  images: [{ url: 'https://images.unsplash.com/photo-1611339555312-e607c90352fd?w=300&h=300&fit=crop' }],
  country: 'ES',
  product: 'premium',
  followers: { total: 42 },
};

export const mockTopTracks = [
  { id: '11dFghVv5Yb0LwMKqWFEM5', name: 'Blinding Lights', artists: [{ name: 'The Weeknd' }], album: { name: 'After Hours', images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80' }] }, duration_ms: 200000 },
  { id: '7qiZfU4dY1lsylvNEZs3Jv', name: 'Levitating', artists: [{ name: 'Dua Lipa' }], album: { name: 'Future Nostalgia', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&q=80' }] }, duration_ms: 203000 },
  { id: '5XeFesDftLpXzIVDNQP79', name: 'Stay', artists: [{ name: 'The Kid LAROI' }, { name: 'Justin Bieber' }], album: { name: 'F*CK LOVE 3: OVER YOU', images: [{ url: 'https://images.unsplash.com/photo-1514614382346-1a76d7c87c7d?w=200&q=80' }] }, duration_ms: 141000 },
  { id: '68Yq1yIy4uyB0DPk7JNLyV', name: 'Heat Waves', artists: [{ name: 'Glass Animals' }], album: { name: 'Dreamland', images: [{ url: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=200&q=80' }] }, duration_ms: 238000 },
  { id: '1301WleyT98MSxVHPZCA6M', name: 'Peaches', artists: [{ name: 'Justin Bieber' }], album: { name: 'Justice', images: [{ url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&q=80' }] }, duration_ms: 198000 },
  { id: '5r7Sx0bTJz8cCcpvtEUhcY', name: 'drivers license', artists: [{ name: 'Olivia Rodrigo' }], album: { name: 'SOUR', images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80' }] }, duration_ms: 242000 },
  { id: '2takcwgaBMom9W6n3eMFWE', name: 'good 4 u', artists: [{ name: 'Olivia Rodrigo' }], album: { name: 'SOUR', images: [{ url: 'https://images.unsplash.com/photo-1514614382346-1a76d7c87c7d?w=200&q=80' }] }, duration_ms: 178000 },
  { id: '3T8xYBsCNT5YzrSY3mCkZ', name: 'Save Your Tears', artists: [{ name: 'The Weeknd' }], album: { name: 'After Hours', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&q=80' }] }, duration_ms: 215000 },
  { id: '7K5LYG3T1kWAF2d6mZRCx0', name: 'Kiss Me More', artists: [{ name: 'Doja Cat' }, { name: 'SZA' }], album: { name: 'Planet Her', images: [{ url: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=200&q=80' }] }, duration_ms: 208000 },
  { id: '7iXgkLnZPcC8w2Dx2rxEZ0', name: 'Industry Baby', artists: [{ name: 'Lil Nas X' }, { name: 'Jack Harlow' }], album: { name: 'MONTERO', images: [{ url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&q=80' }] }, duration_ms: 212000 },
  { id: '3mApc_BlKt1X8v0PcF1jZa', name: 'Shivers', artists: [{ name: 'Ed Sheeran' }], album: { name: '=', images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80' }] }, duration_ms: 207000 },
  { id: '6rqhFgbbKwnb9MLmUQDvDm', name: 'Bad Habits', artists: [{ name: 'Ed Sheeran' }], album: { name: '=', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&q=80' }] }, duration_ms: 231000 },
  { id: '0DiWxABD2UrAleG5zLc4zO', name: 'Sun Goes Down', artists: [{ name: 'Lil Nas X' }], album: { name: 'MONTERO', images: [{ url: 'https://images.unsplash.com/photo-1514614382346-1a76d7c87c7d?w=200&q=80' }] }, duration_ms: 137000 },
  { id: '5n8qKmFPpQe9lSB6chEjt2', name: 'STAY', artists: [{ name: 'The Kid LAROI' }, { name: 'Justin Bieber' }], album: { name: 'F*CK LOVE 3: OVER YOU', images: [{ url: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=200&q=80' }] }, duration_ms: 141000 },
  { id: '3aAc0lzwfQPgLBFOd9IKvU', name: 'As It Was', artists: [{ name: 'Harry Styles' }], album: { name: 'Harry\'s House', images: [{ url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&q=80' }] }, duration_ms: 173000 },
];

export const mockTopTracksLong = [
  { id: '3z8h0TU7RczrM9GEp7RFSM', name: 'Bohemian Rhapsody', artists: [{ name: 'Queen' }], album: { name: 'A Night at the Opera', images: [{ url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200&q=80' }] }, duration_ms: 354000 },
  { id: '3n3Ppam7vgaVa1iaRUc9Lp', name: 'Billie Jean', artists: [{ name: 'Michael Jackson' }], album: { name: 'Thriller', images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80' }] }, duration_ms: 294000 },
  { id: '0VjIjW4GlUZAMYd2vXMwbv', name: 'Hotel California', artists: [{ name: 'Eagles' }], album: { name: 'Hotel California', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&q=80' }] }, duration_ms: 390000 },
  { id: '4cOdK2wGLETKBW3PvgPWqK', name: 'Smells Like Teen Spirit', artists: [{ name: 'Nirvana' }], album: { name: 'Nevermind', images: [{ url: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=200&q=80' }] }, duration_ms: 301000 },
  { id: '3qm84nBvXcjf6OdNDUpLId', name: 'Sweet Child O\'Mine', artists: [{ name: 'Guns N\' Roses' }], album: { name: 'Appetite for Destruction', images: [{ url: 'https://images.unsplash.com/photo-1514614382346-1a76d7c87c7d?w=200&q=80' }] }, duration_ms: 356000 },
  { id: '3AJwUDP5qsKqKsTQ51b8IA', name: 'Stairway to Heaven', artists: [{ name: 'Led Zeppelin' }], album: { name: 'Led Zeppelin IV', images: [{ url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&q=80' }] }, duration_ms: 482000 },
  { id: '7qiHG1LZKLirQnpH1DQnGd', name: 'Comfortably Numb', artists: [{ name: 'Pink Floyd' }], album: { name: 'The Wall', images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80' }] }, duration_ms: 382000 },
  { id: '03ldSKH1W4n7ceTzFnZPyJ', name: 'November Rain', artists: [{ name: 'Guns N\' Roses' }], album: { name: 'Use Your Illusion I', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&q=80' }] }, duration_ms: 537000 },
  { id: '1f2zSDZ2vK8lqUWVPtMzxj', name: 'Wonderwall', artists: [{ name: 'Oasis' }], album: { name: '(What\'s the Story) Morning Glory?', images: [{ url: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=200&q=80' }] }, duration_ms: 258000 },
  { id: '4cOdK2wGLETKBW3PvgPWqL', name: 'Iris', artists: [{ name: 'Goo Goo Dolls' }], album: { name: 'Dizzy Up the Girl', images: [{ url: 'https://images.unsplash.com/photo-1514614382346-1a76d7c87c7d?w=200&q=80' }] }, duration_ms: 288000 },
];

export const mockTopArtists = [
  { id: '1Xyo4u8uIvCHVHTLjNVFiX', name: 'The Weeknd', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&q=80' }], genres: ['canadian pop', 'pop'], popularity: 95, followers: { total: 75000000 } },
  { id: '6HfYRM6deXj8GsuWMowsWc', name: 'Dua Lipa', images: [{ url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200&q=80' }], genres: ['dance pop', 'pop', 'uk pop'], popularity: 92, followers: { total: 65000000 } },
  { id: '6eUKZXaKkcviVWZIuS1NeP', name: 'Ed Sheeran', images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80' }], genres: ['pop', 'uk pop'], popularity: 93, followers: { total: 90000000 } },
  { id: '1mYsTxnqsietFxj1OXvjX7', name: 'Olivia Rodrigo', images: [{ url: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=200&q=80' }], genres: ['pop', 'alt z', 'gen z'], popularity: 94, followers: { total: 35000000 } },
  { id: '4q3ewBCX7sLwd24euL69G6', name: 'Bad Bunny', images: [{ url: 'https://images.unsplash.com/photo-1514614382346-1a76d7c87c7d?w=200&q=80' }], genres: ['reggaeton', 'trap latino', 'urbano latino'], popularity: 96, followers: { total: 60000000 } },
  { id: '06HL4z0CvFAxyc27GXpf02', name: 'Taylor Swift', images: [{ url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&q=80' }], genres: ['pop'], popularity: 96, followers: { total: 85000000 } },
  { id: '0oS5by1ABe7ZHr1NcWQAdd', name: 'Drake', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&q=80' }], genres: ['canadian hip hop', 'hip hop', 'rap'], popularity: 93, followers: { total: 70000000 } },
  { id: '6ltl5XRN3t1zVMXZ1PXJ1B', name: 'Billie Eilish', images: [{ url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=200&q=80' }], genres: ['art pop', 'electropop', 'pop'], popularity: 92, followers: { total: 55000000 } },
  { id: '687EzudS3eCKQ7NhcHmPNf', name: 'BTS', images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80' }], genres: ['k-pop', 'k-pop boy group'], popularity: 95, followers: { total: 55000000 } },
  { id: '66CXWjxzNUsdJxJ2JdwZCl', name: 'Ariana Grande', images: [{ url: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=200&q=80' }], genres: ['pop'], popularity: 93, followers: { total: 80000000 } },
];

export const mockRecentlyPlayed = [
  { played_at: new Date(Date.now() - 5 * 60000).toISOString(), track: mockTopTracks[0] },
  { played_at: new Date(Date.now() - 15 * 60000).toISOString(), track: mockTopTracks[1] },
  { played_at: new Date(Date.now() - 25 * 60000).toISOString(), track: mockTopTracks[2] },
  { played_at: new Date(Date.now() - 35 * 60000).toISOString(), track: mockTopTracks[3] },
  { played_at: new Date(Date.now() - 50 * 60000).toISOString(), track: mockTopTracks[4] },
  { played_at: new Date(Date.now() - 70 * 60000).toISOString(), track: mockTopTracks[5] },
  { played_at: new Date(Date.now() - 90 * 60000).toISOString(), track: mockTopTracks[6] },
  { played_at: new Date(Date.now() - 120 * 60000).toISOString(), track: mockTopTracks[7] },
  { played_at: new Date(Date.now() - 180 * 60000).toISOString(), track: mockTopTracks[8] },
  { played_at: new Date(Date.now() - 240 * 60000).toISOString(), track: mockTopTracks[9] },
  { played_at: new Date(Date.now() - 300 * 60000).toISOString(), track: mockTopTracks[10] },
  { played_at: new Date(Date.now() - 360 * 60000).toISOString(), track: mockTopTracks[11] },
  { played_at: new Date(Date.now() - 420 * 60000).toISOString(), track: mockTopTracks[12] },
  { played_at: new Date(Date.now() - 480 * 60000).toISOString(), track: mockTopTracks[13] },
  { played_at: new Date(Date.now() - 540 * 60000).toISOString(), track: mockTopTracks[14] },
  // Yesterday
  { played_at: new Date(Date.now() - 24 * 3600000 - 60000).toISOString(), track: mockTopTracks[2] },
  { played_at: new Date(Date.now() - 24 * 3600000 - 120000).toISOString(), track: mockTopTracks[5] },
  { played_at: new Date(Date.now() - 24 * 3600000 - 180000).toISOString(), track: mockTopTracks[8] },
  // 2 days ago
  { played_at: new Date(Date.now() - 48 * 3600000 - 60000).toISOString(), track: mockTopTracks[1] },
  { played_at: new Date(Date.now() - 48 * 3600000 - 120000).toISOString(), track: mockTopTracks[4] },
];

export const mockAudioFeatures = [
  { id: '1', valence: 0.85, energy: 0.78, danceability: 0.82, acousticness: 0.05, tempo: 171 },
  { id: '2', valence: 0.91, energy: 0.83, danceability: 0.90, acousticness: 0.03, tempo: 103 },
  { id: '3', valence: 0.48, energy: 0.76, danceability: 0.59, acousticness: 0.04, tempo: 170 },
  { id: '4', valence: 0.32, energy: 0.53, danceability: 0.76, acousticness: 0.11, tempo: 80 },
  { id: '5', valence: 0.67, energy: 0.68, danceability: 0.68, acousticness: 0.32, tempo: 90 },
  { id: '6', valence: 0.13, energy: 0.43, danceability: 0.59, acousticness: 0.73, tempo: 144 },
  { id: '7', valence: 0.76, energy: 0.61, danceability: 0.74, acousticness: 0.11, tempo: 179 },
  { id: '8', valence: 0.69, energy: 0.66, danceability: 0.56, acousticness: 0.01, tempo: 166 },
  { id: '9', valence: 0.59, energy: 0.83, danceability: 0.68, acousticness: 0.03, tempo: 118 },
  { id: '10', valence: 0.75, energy: 0.70, danceability: 0.79, acousticness: 0.02, tempo: 111 },
  { id: '11', valence: 0.90, energy: 0.70, danceability: 0.74, acousticness: 0.04, tempo: 150 },
  { id: '12', valence: 0.54, energy: 0.86, danceability: 0.78, acousticness: 0.02, tempo: 141 },
  { id: '13', valence: 0.67, energy: 0.90, danceability: 0.81, acousticness: 0.03, tempo: 126 },
  { id: '14', valence: 0.72, energy: 0.62, danceability: 0.71, acousticness: 0.06, tempo: 134 },
  { id: '15', valence: 0.95, energy: 0.65, danceability: 0.70, acousticness: 0.03, tempo: 110 },
];

export const mockMoodData = {
  happiness: 0.68,
  energy: 0.71,
  calmness: 0.15,
  danceability: 0.73,
};

export function isDemoMode(): boolean {
  // Respect an explicit localStorage override if present
  try {
    const forced = localStorage.getItem('harmonytrack_demo');
    if (forced === 'true') return true;
    if (forced === 'false') return false;

    // If a real JWT token exists, prefer real mode
    if (localStorage.getItem('harmonytrack_token')) return false;
  } catch (e) {
    // If localStorage is not available (SSR), fall back to env
  }

  // Fallback to environment variable (useful for CI/demo builds)
  return import.meta.env.VITE_DEMO === 'true';
}
