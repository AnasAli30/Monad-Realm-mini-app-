interface GameData {
  level?: number;
  time?: string;
  stonesDestroyed?: number;
  playerHits?: number;
}

interface LeaderboardEntry {
  fid: number;
  username: string;
  pfpUrl?: string;
  score: number;
  game?: string;
  gameData?: GameData;
  rank?: number;
  lastPlayed?: Date;
}

// Submit score to leaderboard
export async function submitScore(
  fid: number,
  username: string,
  pfpUrl: string,
  score: number,
  game: string,
  gameData?: GameData
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fid,
        username,
        pfpUrl,
        score,
        game,
        gameData
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit score');
    }

    return result;
  } catch (error) {
    console.error('Error submitting score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get leaderboard
export async function getLeaderboard(
  game: string = 'all',
  limit: number = 50
): Promise<{ success: boolean; data?: LeaderboardEntry[]; error?: string }> {
  try {
    const params = new URLSearchParams({
      game,
      limit: limit.toString()
    });

    const response = await fetch(`/api/leaderboard?${params}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch leaderboard');
    }

    return result;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get player data from Farcaster context
export function getPlayerData(context: any): { fid: number; username: string; pfpUrl: string } {
  if (context?.user) {
    return {
      fid: context.user.fid || 0,
      username: context.user.username || `Player${Math.floor(Math.random() * 10000)}`,
      pfpUrl: context.user.pfpUrl || ''
    };
  }

  // Fallback for testing or if no context
  return {
    fid: Math.floor(Math.random() * 1000000), // Generate random FID for testing
    username: `Player${Math.floor(Math.random() * 10000)}`,
    pfpUrl: ''
  };
}

// Legacy function for backward compatibility
export function getPlayerName(): string {
  // This is kept for backward compatibility but should use getPlayerData instead
  if (typeof window !== 'undefined') {
    const storedName = localStorage.getItem('playerName');
    if (storedName) {
      return storedName;
    }
  }
  return `Player${Math.floor(Math.random() * 10000)}`;
}

// Store player name for future use
export function setPlayerName(name: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('playerName', name);
  }
} 