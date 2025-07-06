import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const score = searchParams.get('score') || '0';
    const time = searchParams.get('time') || '00:00';
    const userImg = searchParams.get('userImg') || '';
    const username = searchParams.get('username') || 'Player';
    const gameType = searchParams.get('gameType') || 'vertical-jump';

    // Validate required parameters
    if (!score || !time) {
      return new Response('Missing required parameters', { status: 400 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 25% 25%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)',
              opacity: 0.1,
            }}
          />
          
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                textShadow: '0 4px 8px rgba(0,0,0,0.5)',
              }}
            >
              🏆 Monad Realm
            </div>
          </div>

          {/* Game Title */}
          <div
            style={{
              fontSize: '36px',
              fontWeight: '600',
              color: '#3b82f6',
              marginBottom: '30px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {gameType === 'vertical-jump' ? '🚀 Vertical Jump' : '🎮 Game Score'}
          </div>

          {/* Player Info Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '20px',
              padding: '20px 40px',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Profile Picture */}
            {userImg && (
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginRight: '20px',
                  border: '3px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                }}
              >
                <img
                  src={userImg}
                  alt="Player"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
            
            {/* Player Name */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {username}
            </div>
          </div>

          {/* Score Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9), rgba(185, 28, 28, 0.8))',
              borderRadius: '24px',
              padding: '30px 50px',
              border: '3px solid rgba(239, 68, 68, 0.8)',
              boxShadow: '0 12px 40px rgba(239, 68, 68, 0.4)',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '10px',
                fontWeight: '500',
              }}
            >
              FINAL SCORE
            </div>
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#ffffff',
                textShadow: '0 4px 8px rgba(0,0,0,0.5)',
                lineHeight: 1,
              }}
            >
              {parseInt(score).toLocaleString()}
            </div>
          </div>

          {/* Time Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '16px',
              padding: '15px 30px',
              border: '2px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginRight: '15px',
              }}
            >
              ⏱️ Time:
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#ffd700',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {time}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
            }}
          >
            Play Monad Realm • Challenge Your Friends
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
} 