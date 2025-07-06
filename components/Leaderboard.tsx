'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad, faCandyCane, faBullseye, faArrowUp, faTrophy, faTimes } from '@fortawesome/free-solid-svg-icons';
import { fetchWithVerification } from '@/lib/leaderboard';
import { sdk } from '@farcaster/miniapp-sdk';

interface GameData {
  score: number;
  time?: string;
  level?: number;
  stonesDestroyed?: number;
  playerHits?: number;
  lastPlayed: string;
}

interface PlayerDocument {
  _id?: string;
  fid: number;
  username: string;
  pfpUrl?: string;
  games: {
    [gameName: string]: GameData;
  };
}

interface LeaderboardEntry {
  _id?: string;
  fid?: number;
  username?: string;
  pfpUrl?: string;
  score: number;
  gameData?: GameData;
  bestGame?: {
    name: string;
    score: number;
    data: GameData;
  };
}

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<'candy' | 'blaster' | 'hop'>('candy');
  const [error, setError] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'idle'>('enter');
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });
  const [timer, setTimer] = useState<number | string | null>(null);
  const [timerLoading, setTimerLoading] = useState(true);

  const gameTabs = [
    { key: 'hop', label: 'Hop Up', icon: faArrowUp },
    { key: 'candy', label: 'Mona Crush', icon: faCandyCane },
    { key: 'blaster', label: 'Bounce Blaster', icon: faBullseye },
  ];

  // Map tab key to game name
  const gameKeyToName = {
    candy: 'Candy Crush',
    blaster: 'Bounce Blaster',
    hop: 'Monad Jump',
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedGame]);

  useEffect(() => {
    if (!isLoading && leaderboardData.length > 0) {
      setAnimationPhase('enter');
      setTimeout(() => setAnimationPhase('idle'), 1000);
    }
  }, [isLoading, leaderboardData]);

  // Countdown timer effect
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7); // 7 days from now
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTimeLeft({ days, hours });
      } else {
        setTimeLeft({ days: 0, hours: 0 });
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000 * 60 * 60); // Update every hour
    
    return () => clearInterval(interval);
  }, []);

  // Fetch timer from API
  useEffect(() => {
    setTimerLoading(true);
    fetch('/api/leaderboard/timer')
      .then(res => res.json())
      .then(data => {
        console.log(data);
        if (data.success) {

          setTimer(data.timer);
        } else {
          setTimer(null);
        }
      })
      .catch(() => setTimer(null))
      .finally(() => setTimerLoading(false));
  }, []);

  // Update timeLeft based on timer value
  useEffect(() => {
    if (!timer) return;
    // If timer is in ms, use: const target = Number(timer);
    // If timer is in seconds, use: const target = Number(timer) * 1000;
    const target = Number(timer) * 1000; // convert to ms
    const update = () => {
      const now = Date.now();
      let diff = target - now;
      if (diff < 0) diff = 0;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft({ days, hours });
    };
    update();
    const interval = setInterval(update, 60 * 1000); // update every minute
    return () => clearInterval(interval);
  }, [timer]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const gameName = gameKeyToName[selectedGame];
      const response = await fetch(`/api/leaderboard?game=${encodeURIComponent(gameName)}&limit=50`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setLeaderboardData(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to load leaderboard');
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Helper to format unix time (seconds or ms) to mm:ss or hh:mm:ss
  function formatTimer(unixTime: number | string | undefined): string {
    if (!unixTime) return '';
    let seconds = typeof unixTime === 'string' ? parseInt(unixTime, 10) : unixTime;
    // If it's in ms, convert to seconds
    if (seconds > 100000000) seconds = Math.floor(seconds / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const getCardStyle = (rank: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      position: 'relative',
      overflow: 'hidden',
    };

    if (rank === 1) {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9), rgba(185, 28, 28, 0.8))',
        border: '2px solid rgba(239, 68, 68, 0.8)',
        boxShadow: '0 12px 40px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.3)',
      };
    } else if (rank === 2) {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.9), rgba(29, 78, 216, 0.8))',
        border: '2px solid rgba(59, 130, 246, 0.8)',
        boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3)',
      };
    } else if (rank === 3) {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(126, 34, 206, 0.8))',
        border: '2px solid rgba(168, 85, 247, 0.8)',
        boxShadow: '0 12px 40px rgba(168, 85, 247, 0.4), 0 0 0 1px rgba(168, 85, 247, 0.3)',
      };
    }
    
    return baseStyle;
  };

  const getRankBadgeStyle = (rank: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '18px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
      flexShrink: 0,
      transition: 'all 0.3s ease',
      position: 'relative',
    };

    if (rank === 1) {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        color: '#ffffff',
        boxShadow: '0 10px 20px rgba(220, 38, 38, 0.6), 0 0 0 3px rgba(239, 68, 68, 0.4)',
      };
    } else if (rank === 2) {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
        color: '#ffffff',
        boxShadow: '0 10px 20px rgba(29, 78, 216, 0.6), 0 0 0 3px rgba(59, 130, 246, 0.4)',
      };
    } else if (rank === 3) {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        color: '#ffffff',
        boxShadow: '0 10px 20px rgba(124, 58, 237, 0.6), 0 0 0 3px rgba(168, 85, 247, 0.4)',
      };
    }
    
    return {
      ...baseStyle,
      background: 'linear-gradient(135deg, #374151, #1f2937)',
      color: '#ffffff',
      boxShadow: '0 8px 16px rgba(55, 65, 81, 0.6), 0 0 0 3px rgba(75, 85, 99, 0.4)',
    };
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  const getGameIcon = (game: string) => {
    switch (game) {
      case 'Candy Crush':
        return '🍭';
      case 'Bounce Blaster':
        return '🎯';
      case 'Hop Up':
        return '🦘';
      default:
        return '🎮';
    }
  };

  const getGameColor = (game: string) => {
    switch (game) {
      case 'Candy Crush':
        return 'linear-gradient(135deg, #dc2626, #b91c1c)';
      case 'Bounce Blaster':
        return 'linear-gradient(135deg, #1d4ed8, #1e40af)';
      case 'Hop Up':
        return 'linear-gradient(135deg, #7c3aed, #6d28d9)';
      default:
        return 'linear-gradient(135deg, #374151, #1f2937)';
    }
  };



  const containerStyle: React.CSSProperties = {
    width: '100vw',
    // maxWidth: '512px',
    margin: '0 auto',
    // paddingTop: '10px',
    padding: '10px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    position: 'relative',
  };

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #dc2626 0%, #1d4ed8 100%)',
    borderRadius: '24px',
    padding: '32px 24px',
    marginBottom: '32px',
    textAlign: 'center' as const,
    boxShadow: '0 20px 40px rgba(220, 38, 38, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
    margin: '0 0 12px 0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    zIndex: 1,
  };

  const subtitleStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '16px',
    margin: '0',
    fontWeight: '500',
    position: 'relative',
    zIndex: 1,
  };



  const entryStyle: React.CSSProperties = {
    borderRadius: '20px',
    padding: '10px',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    cursor: 'pointer',
    position: 'relative',
    marginBottom: '16px',
  };

  const entryContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '17px',
    position: 'relative',
    zIndex: 1,
  };

  const profileContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '55px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const profilePictureStyle: React.CSSProperties = {
    width: '55px',
    height: '55px',
    borderRadius: '50%',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #dc2626, #1d4ed8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s ease',
  };

  const profileImageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  };

  const playerInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const playerNameStyle: React.CSSProperties = {
    fontWeight: '700',
    fontSize: '16px',
    color: '#ffffff',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
  };

  const playerStatsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: '4px',
    flexWrap: 'wrap' as const,
  };

  const scoreContainerStyle: React.CSSProperties = {
    textAlign: 'right' as const,
    flexShrink: 0,
  };

  const scoreStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
  };

  const pointsStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: '2px',
  };

  const shimmerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
    animation: 'shimmer 3s infinite',
    borderRadius: '20px',
  };

  const particleStyle: React.CSSProperties = {
    position: 'absolute',
    width: '4px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '50%',
    animation: 'float 4s ease-in-out infinite',
  };

  const SkeletonCard = ({ rank }: { rank: number }) => {
    const skeletonCardStyle: React.CSSProperties = {
      ...entryStyle,
      ...getCardStyle(rank),
      animation: `fadeIn 0.6s ease-out ${rank * 0.1}s both`,
      position: 'relative',
      overflow: 'hidden',
    };

    const skeletonShimmerBase: React.CSSProperties = {
      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmerSkeleton 2s infinite linear',
      position: 'relative',
      overflow: 'hidden',
    };

    const skeletonBadgeStyle: React.CSSProperties = {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      flexShrink: 0,
      ...skeletonShimmerBase,
    };

    const skeletonAvatarStyle: React.CSSProperties = {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: '3px solid rgba(255, 255, 255, 0.1)',
      ...skeletonShimmerBase,
    };

    const skeletonTextStyle: React.CSSProperties = {
      height: '16px',
      borderRadius: '8px',
      ...skeletonShimmerBase,
    };

    const skeletonStatStyle: React.CSSProperties = {
      height: '12px',
      borderRadius: '6px',
      ...skeletonShimmerBase,
    };

    const skeletonScoreStyle: React.CSSProperties = {
      height: '22px',
      width: '60px',
      borderRadius: '8px',
      ...skeletonShimmerBase,
    };

    return (
      <div style={skeletonCardStyle}>
        <div style={entryContentStyle}>
          {/* Skeleton Profile Picture */}
          <div style={profileContainerStyle}>
            <div style={skeletonAvatarStyle}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'shimmerSkeleton 2s infinite linear',
                borderRadius: '50%',
              }} />
            </div>
            
            {/* Skeleton Rank Badge on top of profile image */}
            <div style={{
              ...skeletonBadgeStyle,
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '35px',
              height: '35px',
              zIndex: 3
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'shimmerSkeleton 2s infinite linear',
                borderRadius: '50%',
              }} />
            </div>
          </div>
          
                      {/* Skeleton Player Info */}
            <div style={playerInfoStyle}>
              <div style={{ 
                ...skeletonTextStyle, 
                width: `${80 + Math.random() * 40}px`, 
                marginBottom: '8px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  animation: 'shimmerSkeleton 2s infinite linear',
                  borderRadius: '8px',
                }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ ...skeletonStatStyle, width: '45px', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    animation: 'shimmerSkeleton 2s infinite linear',
                    borderRadius: '6px',
                  }} />
                </div>
                <div style={{ ...skeletonStatStyle, width: '35px', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    animation: 'shimmerSkeleton 2s infinite linear',
                    borderRadius: '6px',
                  }} />
                </div>
                <div style={{ ...skeletonStatStyle, width: '40px', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    animation: 'shimmerSkeleton 2s infinite linear',
                    borderRadius: '6px',
                  }} />
                </div>
              </div>
            </div>
          
          {/* Skeleton Score */}
          <div style={scoreContainerStyle}>
            <div style={{ ...skeletonScoreStyle, position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'shimmerSkeleton 2s infinite linear',
                borderRadius: '8px',
              }} />
            </div>
            <div style={{ ...skeletonStatStyle, width: '30px', marginTop: '4px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'shimmerSkeleton 2s infinite linear',
                borderRadius: '6px',
              }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Reward popup component
  const rewardPopup = showRewardPopup && (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        border: '2px solid rgba(59, 130, 246, 0.5)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}>
        <button
          onClick={() => setShowRewardPopup(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🏆
          </div>
          <h2 style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '16px',
            margin: 0
          }}>
            1500 MON Reward Pool
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: '16px 0 24px 0'
          }}>
            The total reward pool of <strong style={{ color: '#ffd700' }}>1500 MON</strong> will be distributed among the <strong style={{ color: '#ffd700' }}>top 10 players</strong> based on their scores across all games.
          </p>
          <div style={{
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ color: '#93c5fd', fontSize: '14px', fontWeight: '600', width: '100%',padding: '0', margin: '0' }}>
              <p style={{ margin: '0' }}>📊 Distribution based on</p>
              <p style={{ margin: '0' }}>Ranking</p>
              <p style={{ margin: '0' }}>Score performance</p>
              <p style={{ margin: '0' }}>Time taken</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Timer and reward header
  const timerHeader = (
    <div style={{
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '2px 20px',
      marginBottom: '10px',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
        }}
        onClick={() => setShowRewardPopup(true)}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <FontAwesomeIcon icon={faTrophy} style={{ color: '#0f172a', fontSize: '18px' }} />
        </div>
        <div>
          <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
            1500 MON Pool
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
            Click trophy for details
          </div>
        </div>
      </div>
      
      <div style={{
        // background: 'rgba(220, 38, 38, 0.2)',
        borderRadius: '20px',
        padding: '2px 10px',
        margin: '10px 0px',
        // border: '1px solid rgba(220, 38, 38, 0.3)'
      }}>
        <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
          {timeLeft.days}d {timeLeft.hours}h
        </div>
      </div>
      
    </div>
  );

  // Top navbar
  const navbar = (
    <div
      style={{
        background: '#0066F5',
        borderRadius: '32px',
        padding: '10px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: '10px',
      }}
    >
      {gameTabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setSelectedGame(tab.key as any)}
          style={{
            background: selectedGame === tab.key ? '#fff' : 'transparent',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 3px',
            color: selectedGame === tab.key ? '#0066F5' : '#fff',
            fontWeight: selectedGame === tab.key ? 'bold' : 'normal',
            fontSize: 16,
            opacity: selectedGame === tab.key ? 1 : 0.7,
            transition: 'all 0.2s',
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* <span style={{ fontSize: 16 }}> */}
            <FontAwesomeIcon icon={tab.icon} />
          {/* </span> */}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div style={{
        ...containerStyle,
        overflow: 'hidden', // Hide scrollbar during skeleton loading
      }}>
        {rewardPopup}
        {timerHeader}
        {navbar}
      
        {/* Animated Background Particles */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              style={{
                ...particleStyle,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 2}s`,
                opacity: 0.3
              }}
            />
          ))}
        </div>

        {/* Skeleton Leaderboard Entries */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {Array.from({ length: 8 }, (_, index) => (
            <SkeletonCard key={index} rank={index + 1} />
          ))}
        </div>

        {/* Loading Indicator */}
        <div style={{ 
          textAlign: 'center', 
          padding: '24px 0',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '16px 24px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
            border: '2px solid rgba(59, 130, 246, 0.5)',
            borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#ffffff'
            }}>Loading epic battles...</span>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes shimmerSkeleton {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-8px);
              opacity: 0.6;
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        {rewardPopup}
        {timerHeader}
        {navbar}
       
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{ 
              color: '#ef4444', 
              marginBottom: '16px',
              fontSize: '18px',
              fontWeight: '600'
            }}>⚠️ Error loading leaderboard</div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '14px',
              marginBottom: '24px'
            }}>{error}</div>
            <button 
              onClick={fetchLeaderboard}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {rewardPopup}
      {timerHeader}
      {navbar}
      
      {/* Animated Background Particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            style={{
              ...particleStyle,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      {/* <div style={headerStyle}> */}
        {/* Header Background Effects */}
       

      {/* Leaderboard Entries */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {leaderboardData.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 0', 
            color: '#ffffff'
          }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                No champions yet!
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                Be the first to claim glory in {gameKeyToName[selectedGame]}
              </div>
            </div>
          </div>
        ) : (
          leaderboardData.map((entry, index) => (
            <div
              key={entry._id || index}
              style={{
                ...entryStyle,
                ...getCardStyle(index + 1),
                animation: animationPhase === 'enter' ? `slideInUp 0.6s ease-out ${index * 0.1}s both` : 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = index === 0 
                  ? '0 15px 40px rgba(255, 215, 0, 0.4), 0 0 0 1px rgba(255, 215, 0, 0.2)'
                  : index === 1
                  ? '0 15px 40px rgba(192, 192, 192, 0.4), 0 0 0 1px rgba(192, 192, 192, 0.2)'
                  : index === 2
                  ? '0 15px 40px rgba(205, 127, 50, 0.4), 0 0 0 1px rgba(205, 127, 50, 0.2)'
                  : '0 15px 40px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = index === 0 
                  ? '0 8px 32px rgba(255, 215, 0, 0.2), 0 0 0 1px rgba(255, 215, 0, 0.1)'
                  : index === 1
                  ? '0 8px 32px rgba(192, 192, 192, 0.2), 0 0 0 1px rgba(192, 192, 192, 0.1)'
                  : index === 2
                  ? '0 8px 32px rgba(205, 127, 50, 0.2), 0 0 0 1px rgba(205, 127, 50, 0.1)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Shimmer Effect */}
              {index < 3 && <div style={shimmerStyle}></div>}
              
              <div style={entryContentStyle} onClick={async()=>{
              await sdk.actions.viewProfile({ 
                fid: entry.fid ||249702 ,
              })
              }}>
                {/* Profile Picture */}
                <div style={profileContainerStyle}>
                  <div style={profilePictureStyle}>
                    {(entry.pfpUrl || (entry as any).pfpUrl) ? (
                      <img
                        src={entry.pfpUrl || (entry as any).pfpUrl}
                        alt={`${entry.username || (entry as any).username}'s avatar`}
                        style={profileImageStyle}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = '👤';
                          }
                        }}
                      />
                    ) : (
                      <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                        👤
                      </div>
                    )}
                  </div>
                  
                  {/* Rank Badge on top of profile image */}
                  <div style={{
                    ...getRankBadgeStyle(index + 1),
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    width: '25px',
                    height: '25px',
                    fontSize: '14px',
                    zIndex: 3
                  }}>
                    {getRankEmoji(index + 1)}
                  </div>
                </div>
                
                {/* Player Info */}
                <div style={playerInfoStyle}>
                  <div style={playerNameStyle}>
                    {entry.username || (entry as any).username}
                    {index === 0 && <span style={{ marginLeft: '8px' }}>👑</span>}
                  </div>
                  <div style={playerStatsStyle}>
                    <span style={{ 
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '2px 8px',
                      fontSize: '11px'
                    }}>
                      📅 {formatDate((entry as any).gameData?.lastPlayed || (entry as any).bestGame?.data?.lastPlayed || new Date())}
                    </span>
                    
                    {/* Game Stats - Enhanced */}
                    {((entry as any).gameData?.time || (entry as any).bestGame?.data?.time) && (
                      <span style={{ 
                        background: 'rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        color: '#93c5fd'
                      }}>
                        ⏱️ {(() => {
                          const t = (entry as any).gameData?.time || (entry as any).bestGame?.data?.time;
                          // If t is a string in mm:ss format, show directly
                          if (typeof t === 'string' && t.includes(':')) return t;
                          // Otherwise, use formatTimer
                          return formatTimer(t);
                        })()}
                      </span>
                    )}
                    
                   
                    
                   
                  </div>
                </div>
                
                {/* Score */}
                <div style={scoreContainerStyle}>
                  <div style={scoreStyle}>
                    {(entry.score || (entry as any).bestGame?.score || 0).toLocaleString()}
                  </div>
                  {gameKeyToName[selectedGame] === 'Bounce Blaster' && ((entry as any).gameData?.stonesDestroyed || (entry as any).bestGame?.data?.stonesDestroyed) && (
                      <span style={{ 
                        background: 'rgba(234, 88, 12, 0.2)',
                        borderRadius: '8px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        color: '#fed7aa'
                      }}>
                        🎯 {(entry as any).gameData?.stonesDestroyed || (entry as any).bestGame?.data?.stonesDestroyed}
                      </span>
                    )}
                     {gameKeyToName[selectedGame] === 'Candy Crush' && ((entry as any).gameData?.level || (entry as any).bestGame?.data?.level) && (
                      <span style={{ 
                        background: 'rgba(219, 39, 119, 0.2)',
                        borderRadius: '8px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        color: '#fbcfe8'
                      }}>
                        🍭 L{(entry as any).gameData?.level || (entry as any).bestGame?.data?.level}
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard; 