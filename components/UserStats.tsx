import React, { useEffect, useMemo, useState } from 'react';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { useAccount } from 'wagmi';

type GameKey = 'Candy Crush' | 'Bounce Blaster' | 'Hop';

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
  games: Record<GameKey, { score: number }>;
  dailyGifts?: Record<GameKey, { claimed: number; limit: number; windowHours: number; resetsAt: string | Date }>;
}

export default function UserStats() {
  const { context, actions } = useMiniAppContext();
  const { address } = useAccount();
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [giftStatus, setGiftStatus] = useState<Record<GameKey, DailyGiftInfo> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fid = context?.user?.fid as number | undefined;
  const name = context?.user?.username;
  const pfpUrl = context?.user?.pfpUrl;

  const games: GameKey[] = useMemo(() => ['Candy Crush', 'Bounce Blaster', 'Hop'], []);

  useEffect(() => {
    if (!fid) return;
    setLoading(true);
    Promise.all([
      fetch('/api/user-stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fid }) }).then((r) => r.json()),
      fetch('/api/daily-gifts/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fid }) }).then((r) => r.json()),
    ])
      .then(([statsRes, statusRes]) => {
        if (!statsRes?.success) throw new Error(statsRes?.error || 'Failed to load user stats');
        setStats(statsRes);
        if (statusRes?.success) {
          setGiftStatus(statusRes.perGame);
        }
      })
      .catch((e: any) => setError(e.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [fid]);

  const formatTime = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return `${h}h ${m}m`;
  };


  return (
    <div style={{ minHeight: '100%', paddingBottom: 12 }}>
      {loading && <div style={{ color: '#999', textAlign: 'center' }}>Loading…</div>}
      {error && <div style={{ color: '#ef4444', textAlign: 'center', marginBottom: 12 }}>{error}</div>}
      {stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
            {stats.profile.pfpUrl && (
              <img src={stats.profile.pfpUrl} alt="pfp" style={{ width: 56, height: 56, borderRadius: 14 }} />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{stats.profile.username}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{stats.profile.walletAddress}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 800 }}>Scores</div>
              </div>
              <div>
                {games.map((g) => (
                  <div key={g} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed rgba(255,255,255,0.12)' }}>
                    <span style={{ opacity: 0.9 }}>{g}</span>
                    <span style={{ fontWeight: 700 }}>{stats.games[g]?.score ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 800 }}>Daily Gifts</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>(12h window, 5 per game)</div>
              </div>
              <div>
                {games.map((g) => {
                  const info = giftStatus?.[g];
                  const remaining = info ? info.remaining : Math.max(0, (stats.dailyGifts?.[g]?.limit ?? 5) - (stats.dailyGifts?.[g]?.claimed ?? 0));
                  const msLeft = info?.msLeft ?? 0;
                  const percent = Math.max(0, Math.min(100, ((stats.dailyGifts?.[g]?.limit ?? 5) - remaining) / (stats.dailyGifts?.[g]?.limit ?? 5) * 100));
                  return (
                    <div key={g} style={{ padding: '10px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ opacity: 0.9 }}>{g}</span>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>{remaining} left • resets in {formatTime(msLeft)}</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 6, marginTop: 6 }}>
                        <div style={{ width: `${100 - percent}%`, height: '100%', background: '#10b981', borderRadius: 6 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


