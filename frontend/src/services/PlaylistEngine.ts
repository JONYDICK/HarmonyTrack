/**
 * PlaylistEngine - ML-based Music Recommendation System
 * Correlates user mood with Spotify track features for personalized recommendations
 */

export interface MoodProfile {
  happiness: number;     // 0-1
  energy: number;        // 0-1
  calmness: number;      // 0-1
  danceability: number;  // 0-1
  valence?: number;      // 0-1 (derived from happiness/calmness)
}

export interface TrackFeatures {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  tempo: number;
  loudness: number;
  key: number;
  mode: number;
  time_signature: number;
}

export interface RecommendationProfile {
  target_energy: number;
  target_valence: number;
  target_danceability: number;
  target_acousticness: number;
  target_instrumentalness: number;
  seed_genres: string[];
}

export interface PlaylistRecommendation {
  id: string;
  name: string;
  description: string;
  mood_category: string;
  confidence: number;
  seed_mood: MoodProfile;
  tracks: Array<{
    id: string;
    name: string;
    artist: string;
    album: string;
    uri: string;
  }>;
}

/**
 * PlaylistEngine - Main recommendation engine
 */
export class PlaylistEngine {
  /**
   * Mood categories for targeting
   */
  private static readonly MOOD_CATEGORIES = {
    ENERGETIC: 'energetic',
    CALM: 'calm',
    HAPPY: 'happy',
    MELANCHOLIC: 'melancholic',
    FOCUSED: 'focused',
    PARTY: 'party',
    ROMANTIC: 'romantic',
    INTROSPECTIVE: 'introspective'
  };

  /**
   * Genre mappings for each mood
   */
  private static readonly GENRE_MAPPING: Record<string, string[]> = {
    [this.MOOD_CATEGORIES.ENERGETIC]: ['dance', 'electronic', 'hip-hop', 'pop'],
    [this.MOOD_CATEGORIES.CALM]: ['ambient', 'chill', 'lo-fi', 'indie-pop'],
    [this.MOOD_CATEGORIES.HAPPY]: ['pop', 'indie-pop', 'funk', 'dance-pop'],
    [this.MOOD_CATEGORIES.MELANCHOLIC]: ['indie', 'alternative', 'soul', 'folk'],
    [this.MOOD_CATEGORIES.FOCUSED]: ['electronic', 'ambient', 'classical', 'lo-fi'],
    [this.MOOD_CATEGORIES.PARTY]: ['dance', 'electronic', 'hip-hop', 'edm'],
    [this.MOOD_CATEGORIES.ROMANTIC]: ['r-and-b', 'soul', 'indie-pop', 'pop'],
    [this.MOOD_CATEGORIES.INTROSPECTIVE]: ['indie', 'alternative', 'singer-songwriter', 'folk']
  };

  /**
   * Analyze mood profile and determine primary mood category
   */
  static analyzeMoodProfile(mood: MoodProfile): string {
    const { happiness, energy, calmness, danceability } = mood;

    // Multi-dimensional mood analysis
    if (energy > 0.7 && happiness > 0.6) {
      return danceability > 0.6 
        ? this.MOOD_CATEGORIES.PARTY 
        : this.MOOD_CATEGORIES.ENERGETIC;
    }
    
    if (calmness > 0.7 && energy < 0.4) {
      return this.MOOD_CATEGORIES.CALM;
    }
    
    if (happiness > 0.7 && calmness > 0.5) {
      return this.MOOD_CATEGORIES.HAPPY;
    }
    
    if (happiness < 0.4 && energy < 0.5) {
      return this.MOOD_CATEGORIES.MELANCHOLIC;
    }
    
    if (energy > 0.6 && happiness < 0.5) {
      return this.MOOD_CATEGORIES.FOCUSED;
    }
    
    if (happiness > 0.6 && calmness > 0.6) {
      return this.MOOD_CATEGORIES.ROMANTIC;
    }

    return this.MOOD_CATEGORIES.INTROSPECTIVE;
  }

  /**
   * Convert mood profile to Spotify recommendation parameters
   */
  static moodToSpotifyParams(mood: MoodProfile): RecommendationProfile {
    const moodCategory = this.analyzeMoodProfile(mood);
    const valence = mood.valence || (mood.happiness + (1 - mood.calmness)) / 2;

    return {
      target_energy: mood.energy,
      target_valence: valence,
      target_danceability: mood.danceability,
      target_acousticness: 1 - mood.energy, // Calmer moods = more acoustic
      target_instrumentalness: mood.calmness * 0.4, // Calm moods can be more instrumental
      seed_genres: this.GENRE_MAPPING[moodCategory] || this.GENRE_MAPPING[this.MOOD_CATEGORIES.CALM]
    };
  }

  /**
   * Calculate recommendation confidence score
   */
  static calculateConfidence(
    targetProfile: RecommendationProfile,
    actualFeatures: TrackFeatures
  ): number {
    const weights = {
      energy: 0.25,
      valence: 0.25,
      danceability: 0.20,
      acousticness: 0.15,
      instrumentalness: 0.15
    };

    const energyDiff = Math.abs(targetProfile.target_energy - actualFeatures.energy);
    const valenceDiff = Math.abs(targetProfile.target_valence - actualFeatures.valence);
    const danceabilityDiff = Math.abs(targetProfile.target_danceability - actualFeatures.danceability);
    const acousticnessDiff = Math.abs(targetProfile.target_acousticness - actualFeatures.acousticness);
    const instrumentalnessDiff = Math.abs(targetProfile.target_instrumentalness - actualFeatures.instrumentalness);

    // Convert differences to confidence (1 = perfect match, 0 = no match)
    const confidence = 
      (1 - energyDiff) * weights.energy +
      (1 - valenceDiff) * weights.valence +
      (1 - danceabilityDiff) * weights.danceability +
      (1 - acousticnessDiff) * weights.acousticness +
      (1 - instrumentalnessDiff) * weights.instrumentalness;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate playlist recommendation name based on mood
   */
  static generatePlaylistName(mood: MoodProfile): string {
    const moodCategory = this.analyzeMoodProfile(mood);
    const names: Record<string, string[]> = {
      [this.MOOD_CATEGORIES.ENERGETIC]: ['Energy Boost', 'Power Up Mix', 'Adrenaline Rush', 'Let\'s Go!', 'Maximum Energy'],
      [this.MOOD_CATEGORIES.CALM]: ['Zen Vibes', 'Chill Out', 'Peace & Quiet', 'Unwind', 'Relaxation Era'],
      [this.MOOD_CATEGORIES.HAPPY]: ['Good Vibes Only', 'Feel Good Playlist', 'Pure Joy', 'Smile Mix', 'Sunshine Sounds'],
      [this.MOOD_CATEGORIES.MELANCHOLIC]: ['Deep Thoughts', 'Reflective Moods', 'Soul Search', 'Introspection', 'Silent Nights'],
      [this.MOOD_CATEGORIES.FOCUSED]: ['Focus Mode', 'Deep Work', 'Concentration Zone', 'Flow State', 'Mind Focus'],
      [this.MOOD_CATEGORIES.PARTY]: ['Party Time', 'Dance Floor Hits', 'Celebration Beats', 'Night Out', 'Hype Master'],
      [this.MOOD_CATEGORIES.ROMANTIC]: ['Love Songs', 'Romance Vibes', 'Heart & Soul', 'Intimate Moments', 'Soulmate Mix'],
      [this.MOOD_CATEGORIES.INTROSPECTIVE]: ['Midnight Thoughts', 'Personal Space', 'Deep Dive', 'Self-Reflection', 'Inner Journey']
    };

    const categoryNames = names[moodCategory] || names[this.MOOD_CATEGORIES.CALM];
    return categoryNames[Math.floor(Math.random() * categoryNames.length)];
  }

  /**
   * Generate recommendation description
   */
  static generateDescription(mood: MoodProfile): string {
    const moodCategory = this.analyzeMoodProfile(mood);
    
    const descriptions: Record<string, string> = {
      [this.MOOD_CATEGORIES.ENERGETIC]: `Curated tracks to match your energetic mood. High energy beats and uplifting rhythms.`,
      [this.MOOD_CATEGORIES.CALM]: `Soothing melodies designed for your calm and peaceful mood. Perfect for relaxation.`,
      [this.MOOD_CATEGORIES.HAPPY]: `Uplifting tracks celebrating your happy mood. Feel-good vibes and positive energy.`,
      [this.MOOD_CATEGORIES.MELANCHOLIC]: `Emotionally resonant songs for your introspective mood. Deep and meaningful tracks.`,
      [this.MOOD_CATEGORIES.FOCUSED]: `Concentration-optimized playlist to enhance your focus and productivity.`,
      [this.MOOD_CATEGORIES.PARTY]: `High-energy party tracks for your celebratory mood. Dance the night away!`,
      [this.MOOD_CATEGORIES.ROMANTIC]: `Romantic tracks matching your romantic mood. Perfect for intimate moments.`,
      [this.MOOD_CATEGORIES.INTROSPECTIVE]: `Thoughtful tracks for personal reflection and deep introspection.`
    };

    return descriptions[moodCategory] || 'HarmonyTrack curated playlist based on your mood analysis.';
  }

  /**
   * Calculate mood similarity between two mood profiles
   */
  static calculateMoodSimilarity(mood1: MoodProfile, mood2: MoodProfile): number {
    const dimensions = ['happiness', 'energy', 'calmness', 'danceability'] as const;
    let totalDiff = 0;

    dimensions.forEach(dim => {
      totalDiff += Math.abs(mood1[dim] - mood2[dim]);
    });

    const avgDiff = totalDiff / dimensions.length;
    return 1 - avgDiff; // 1 = identical, 0 = complete opposite
  }
}

export default PlaylistEngine;
