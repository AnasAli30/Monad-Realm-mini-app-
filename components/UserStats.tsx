import React, { useEffect, useMemo, useState } from 'react';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { useAccount } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrophy, 
  faGamepad, 
  faGift, 
  faCrown, 
  faFire, 
  faStar,
  faChartLine,
  faClock,
  faUser,
  faWallet
} from '@fortawesome/free-solid-svg-icons';

interface UserStatsProps {
  theme?: 'light' | 'dark';
}

type FrontendGameKey = 'Candy Crush' | 'Bounce Blaster' | 'Hop Up';
type BackendGameKey = 'Candy Crush' | 'Bounce Blaster' | 'Monad Jump';

interface DailyGiftInfo {
  claimed: number;
  limit: number;
  remaining: number;
  resetsAt: string | Date;
  msLeft: number;
  windowHours: number;
}

interface UserStatsData {
  profile: {
    fid: number;
    username: string;
    pfpUrl?: string;
    walletAddress?: string;
  };
  games: Record<BackendGameKey, { score: number }>;
  dailyGifts?: Record<BackendGameKey, { claimed: number; limit: number; windowHours: number; resetsAt: string | Date }>;
}

export default function UserStats({ theme = 'dark' }: UserStatsProps) {
  const { context, actions } = useMiniAppContext();
  const { address } = useAccount();
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [giftStatus, setGiftStatus] = useState<Record<BackendGameKey, DailyGiftInfo> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fid = context?.user?.fid as number | undefined;
  const name = context?.user?.username;
  const pfpUrl = context?.user?.pfpUrl;

  // Theme-based colors
  const colors = useMemo(() => ({
    background: theme === 'dark' 
      ? 'linear-gradient(135deg, #23272f 0%, #181a20 100%)' 
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    text: theme === 'dark' ? '#f9f7f4' : '#1a202c',
    textSecondary: theme === 'dark' ? '#9ca3af' : '#4a5568',
    cardBackground: theme === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(255, 255, 255, 0.8)',
    cardBorder: theme === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.1)',
    profileCardBackground: theme === 'dark'
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
    hoverBackground: theme === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.05)',
    progressBackground: theme === 'dark' ? '#374151' : '#e5e7eb',
    errorBackground: theme === 'dark' 
      ? 'rgba(239, 68, 68, 0.1)' 
      : 'rgba(239, 68, 68, 0.05)',
    errorBorder: theme === 'dark' 
      ? 'rgba(239, 68, 68, 0.2)' 
      : 'rgba(239, 68, 68, 0.1)',
    errorText: theme === 'dark' ? '#fca5a5' : '#dc2626'
  }), [theme]);

  // Mapping between frontend display names and backend API names
  const gameMapping = useMemo(() => ({
    'Candy Crush': 'Candy Crush',
    'Bounce Blaster': 'Bounce Blaster', 
    'Hop Up': 'Monad Jump'
  } as const), []);

  const frontendGames: FrontendGameKey[] = useMemo(() => ['Candy Crush', 'Bounce Blaster', 'Hop Up'], []);
  const backendGames: BackendGameKey[] = useMemo(() => ['Candy Crush', 'Bounce Blaster', 'Monad Jump'], []);

  useEffect(() => {
    if (!fid) return;
    
    setLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        const [statsRes, statusRes] = await Promise.all([
          fetch('/api/user-stats', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ fid }) 
          }).then((r) => r.json()),
          fetch('/api/daily-gifts/status', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ fid }) 
          }).then((r) => r.json()),
        ]);

        if (!statsRes?.success) throw new Error(statsRes?.error || 'Failed to load user stats');
        setStats(statsRes);
        if (statusRes?.success) {
          setGiftStatus(statusRes.perGame);
        }
      } catch (e: any) {
        // setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fid]);

  const formatTime = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return `${h}h ${m}m`;
  };


  // Get highest score and best game
  const bestScore = useMemo(() => {
    if (!stats?.games) return { score: 0, game: '' };
    let maxScore = 0;
    let bestGame = '';
    Object.entries(stats.games).forEach(([game, data]) => {
      if (data.score > maxScore) {
        maxScore = data.score;
        bestGame = game;
      }
    });
    return { score: maxScore, game: bestGame };
  }, [stats]);

  // Get total gifts remaining
  const totalGifts = useMemo(() => {
    if (!giftStatus) return 0;
    return Object.values(giftStatus).reduce((sum, info) => sum + info.remaining, 0);
  }, [giftStatus]);

  return (
    <div 
      className="min-h-screen p-4 pb-6"
      style={{
        background: colors.background,
        color: colors.text,
        minWidth: '100vw'
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 
          className="text-3xl font-bold mb-2"
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(90deg, #60a5fa, #a855f7, #06b6d4)' 
              : 'linear-gradient(90deg, #2563eb, #7c3aed, #0891b2)',
            WebkitBackgroundClip: 'text',
            // color:theme === 'dark' ? '#f9f7f4' : '#1a202c',
            // WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Player Stats
        </h1>
        <p style={{ color: colors.textSecondary }} className="text-sm">Your gaming achievements and progress</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
            style={{ borderColor: theme === 'dark' ? '#60a5fa' : '#2563eb' }}
          ></div>
          <p style={{ color: colors.textSecondary }}>Loading your stats...</p>
        </div>
      )}
      
      {error && (
        <div 
          className="rounded-xl p-4 mb-4"
          style={{
            background: colors.errorBackground,
            border: `1px solid ${colors.errorBorder}`
          }}
        >
          <div className="flex items-center">
            <FontAwesomeIcon icon={faFire} style={{ color: colors.errorText }} className="mr-2" />
            <span style={{ color: colors.errorText }}>{error}</span>
          </div>
        </div>
      )}
      
      {stats && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Profile Card */}
          <div 
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: colors.profileCardBackground,
              border: `1px solid ${colors.cardBorder}`,
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Animated background gradient */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: theme === 'dark' 
                  ? 'linear-gradient(-45deg, #3b82f6, #8b5cf6, #06b6d4, #10b981)'
                  : 'linear-gradient(-45deg, #dbeafe, #e0e7ff, #cffafe, #d1fae5)',
                backgroundSize: '400% 400%',
                animation: 'gradient 15s ease infinite'
              }}
            />
            
            <div className="relative z-10 flex items-center space-x-4">
              <div className="relative">
                {stats.profile.pfpUrl ? (
                  <img 
                    src={stats.profile.pfpUrl} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover border-3 border-white/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-white text-2xl" />
                  </div>
                )}
                {bestScore.score > 0 && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                    <FontAwesomeIcon icon={faCrown} className="text-white text-xs" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h2 style={{ color: colors.text }} className="text-2xl font-bold mb-1">{stats.profile.username}</h2>
                <div className="flex items-center text-sm mb-2" style={{ color: colors.textSecondary }}>
                  <FontAwesomeIcon icon={faWallet} className="mr-2" />
                  <span className="font-mono truncate">
                    {stats.profile.walletAddress ? 
                      `${stats.profile.walletAddress.slice(0, 6)}...${stats.profile.walletAddress.slice(-4)}` : 
                      'Not connected'
                    }
                  </span>
                </div>
                {bestScore.score > 0 && (
                  <div className="flex items-center space-x-2">
                    <div 
                      className="rounded-full px-3 py-1"
                      style={{ background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                    >
                      <span 
                        className="text-xs font-semibold"
                        style={{ color: theme === 'dark' ? '#fbbf24' : '#d97706' }}
                      >
                        BEST: {bestScore.score}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div 
              className="rounded-xl p-4 text-center"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`
              }}
            >
              <FontAwesomeIcon 
                icon={faGamepad} 
                className="text-2xl mb-2" 
                style={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}
              />
              <div style={{ color: colors.text }} className="text-xl font-bold">{frontendGames.length}</div>
              <div style={{ color: colors.textSecondary }} className="text-xs">Games</div>
            </div>
            <div 
              className="rounded-xl p-4 text-center"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`
              }}
            >
              <FontAwesomeIcon 
                icon={faTrophy} 
                className="text-2xl mb-2" 
                style={{ color: theme === 'dark' ? '#fbbf24' : '#d97706' }}
              />
              <div style={{ color: colors.text }} className="text-xl font-bold">{bestScore.score}</div>
              <div style={{ color: colors.textSecondary }} className="text-xs">High Score</div>
            </div>
            <div 
              className="rounded-xl p-4 text-center"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`
              }}
            >
              <FontAwesomeIcon 
                icon={faGift} 
                className="text-2xl mb-2" 
                style={{ color: theme === 'dark' ? '#a855f7' : '#7c3aed' }}
              />
              <div style={{ color: colors.text }} className="text-xl font-bold">{totalGifts}</div>
              <div style={{ color: colors.textSecondary }} className="text-xs">Gifts Left</div>
            </div>
          </div>

          {/* Game Scores */}
          <div 
            className="rounded-2xl p-6"
            style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.cardBorder}`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon 
                  icon={faChartLine} 
                  style={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}
                />
                <h3 style={{ color: colors.text }} className="text-xl font-bold">Game Scores</h3>
              </div>
              <div 
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                  color: theme === 'dark' ? '#93c5fd' : '#1d4ed8'
                }}
              >
                Season Best
              </div>
            </div>
            
            <div className="space-y-4">
              {frontendGames.map((frontendGame, index) => {
                const backendGame = gameMapping[frontendGame];
                const score = stats.games[backendGame]?.score ?? 0;
                const isHighest = score === bestScore.score && score > 0;
                
                return (
                  <div 
                    key={frontendGame} 
                    className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: isHighest 
                        ? (theme === 'dark' 
                            ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.2), rgba(251, 146, 60, 0.2))' 
                            : 'linear-gradient(90deg, rgba(251, 191, 36, 0.1), rgba(251, 146, 60, 0.1))')
                        : colors.cardBackground,
                      border: isHighest 
                        ? (theme === 'dark' ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(251, 191, 36, 0.2)')
                        : `1px solid ${colors.cardBorder}`
                    }}
                    onMouseEnter={(e) => {
                      if (!isHighest) {
                        e.currentTarget.style.background = colors.hoverBackground;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isHighest) {
                        e.currentTarget.style.background = colors.cardBackground;
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: index === 0 
                            ? (theme === 'dark' ? 'linear-gradient(135deg, #f472b6, #ef4444)' : 'linear-gradient(135deg, #fce7f3, #fecaca)')
                            : index === 1 
                            ? (theme === 'dark' ? 'linear-gradient(135deg, #60a5fa, #6366f1)' : 'linear-gradient(135deg, #dbeafe, #e0e7ff)')
                            : (theme === 'dark' ? 'linear-gradient(135deg, #34d399, #10b981)' : 'linear-gradient(135deg, #d1fae5, #a7f3d0)')
                        }}
                      >
                        <FontAwesomeIcon 
                          icon={index === 0 ? faStar : index === 1 ? faGamepad : faTrophy} 
                          className="text-sm"
                          style={{ color: theme === 'dark' ? '#ffffff' : '#1f2937' }}
                        />
                      </div>
                      <div>
                        <div style={{ color: colors.text }} className="font-semibold">{frontendGame}</div>
                        <div style={{ color: colors.textSecondary }} className="text-xs">Best performance</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ color: colors.text }} className="text-2xl font-bold flex items-center">
                        {score.toLocaleString()}
                        {isHighest && (
                          <FontAwesomeIcon 
                            icon={faCrown} 
                            className="ml-2 text-lg"
                            style={{ color: theme === 'dark' ? '#fbbf24' : '#d97706' }}
                          />
                        )}
                      </div>
                      <div style={{ color: colors.textSecondary }} className="text-xs">points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Gifts */}
          <div 
            className="rounded-2xl p-6"
            style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.cardBorder}`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon 
                  icon={faGift} 
                  style={{ color: theme === 'dark' ? '#a855f7' : '#7c3aed' }}
                />
                <h3 style={{ color: colors.text }} className="text-xl font-bold">Daily Gifts</h3>
              </div>
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon 
                  icon={faClock} 
                  style={{ color: colors.textSecondary }}
                  className="text-sm" 
                />
                <span style={{ color: colors.textSecondary }} className="text-xs">12h window • 5 per game</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {frontendGames.map((frontendGame, index) => {
                const backendGame = gameMapping[frontendGame];
                const info = giftStatus?.[backendGame];
                const remaining = info ? info.remaining : Math.max(0, (stats.dailyGifts?.[backendGame]?.limit ?? 5) - (stats.dailyGifts?.[backendGame]?.claimed ?? 0));
                const msLeft = info?.msLeft ?? 0;
                const limit = stats.dailyGifts?.[backendGame]?.limit ?? 5;
                const claimed = limit - remaining;
                const percent = Math.max(0, Math.min(100, (claimed / limit) * 100));
                
                return (
                  <div 
                    key={frontendGame} 
                    className="rounded-xl p-4 transition-all duration-300 hover:bg-opacity-10"
                    style={{
                      background: colors.cardBackground
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.hoverBackground;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.cardBackground;
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                          style={{
                            background: index === 0 
                              ? (theme === 'dark' ? 'linear-gradient(135deg, #f472b6, #ef4444)' : 'linear-gradient(135deg, #fce7f3, #fecaca)')
                              : index === 1 
                              ? (theme === 'dark' ? 'linear-gradient(135deg, #60a5fa, #6366f1)' : 'linear-gradient(135deg, #dbeafe, #e0e7ff)')
                              : (theme === 'dark' ? 'linear-gradient(135deg, #34d399, #10b981)' : 'linear-gradient(135deg, #d1fae5, #a7f3d0)')
                          }}
                        >
                          <FontAwesomeIcon 
                            icon={index === 0 ? faStar : index === 1 ? faGamepad : faTrophy} 
                            style={{ color: theme === 'dark' ? '#ffffff' : '#1f2937' }}
                          />
                        </div>
                        <span style={{ color: colors.text }} className="font-semibold">{frontendGame}</span>
                      </div>
                      <div className="text-right">
                        <div style={{ color: colors.text }} className="text-sm font-bold">{remaining} left</div>
                        <div style={{ color: colors.textSecondary }} className="text-xs">resets in {formatTime(msLeft)}</div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="relative">
                      <div 
                        className="w-full rounded-full h-2 overflow-hidden"
                        style={{ background: colors.progressBackground }}
                      >
                        <div 
                          className="h-2 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${percent}%`,
                            background: remaining === 0 ? 
                              (theme === 'dark' ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #fca5a5, #f87171)')
                              : (theme === 'dark' ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #34d399, #10b981)')
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span style={{ color: colors.textSecondary }} className="text-xs">{claimed}/{limit} claimed</span>
                        <span style={{ color: colors.textSecondary }} className="text-xs">{Math.round(percent)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}


