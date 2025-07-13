import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const score = searchParams.get('score') || '0';
    const moves = searchParams.get('moves') || '0';
    const level = searchParams.get('level') || '1';
    const userImg = searchParams.get('userImg') || '';
    const username = searchParams.get('username') || 'Player';
    
    // Position parameters with updated defaults for Candy Crush layout
    const pfpX = '531';
    const pfpY = '192';
    const scoreX = '170';
    const scoreY = '46';
    const levelX = '698';
    const levelY = '46';
    const usernameX = '640';
    const usernameY = '210';

    // Size parameters with updated defaults
    const pfpRadius = 50;
    const scoreFontSize = '48';
    const levelFontSize = '48';
    const usernameFontSize = '43';

    // Get the base URL for the background image
    const baseUrl = new URL(request.url).origin;
    const backgroundImageUrl = `${baseUrl}/og/mona.png`;

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            position: 'relative',
            backgroundColor: '#ff69b4', // Pink fallback for candy theme
          }}
        >
          {/* Background Image */}
          <img
            src={backgroundImageUrl}
            alt="Background"
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
            }}
          />

          {/* Profile Picture */}
          {userImg && (
            <div
              style={{
                position: 'absolute',
                top: `${pfpY}px`,
                left: `${pfpX}px`,
                width: `${pfpRadius * 2}px`,
                height: `${pfpRadius * 2}px`,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid #ffffff',
                display: 'flex',
              }}
            >
              <img
                src={userImg}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          {/* Score */}
          <div
            style={{
              position: 'absolute',
              top: `${scoreY}px`,
              left: `${scoreX}px`,
              color: '#000000',
              fontSize: `${scoreFontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(255,255,255,0.8)',
              display: 'flex',
              textAlign: 'center',
              width: '400px',
              justifyContent: 'center',
            }}
          >
           Score: {parseInt(score).toLocaleString()}
          </div>

         

          {/* Level */}
          <div
            style={{
              position: 'absolute',
              top: `${levelY}px`,
              left: `${levelX}px`,
              color: '#000000',
              fontSize: `${levelFontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(255,255,255,0.8)',
              display: 'flex',
              textAlign: 'center',
              width: '200px',
              justifyContent: 'center',
            }}
          >
          Level:{level}
          </div>

          {/* Username */}
          <div
            style={{
              position: 'absolute',
              top: `${usernameY}px`,
              left: `${usernameX}px`,
              color: '#000000',
              fontSize: `${usernameFontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(255,255,255,0.8)',
              display: 'flex',
              textAlign: 'center',
              width: '200px',
              justifyContent: 'center',
            }}
          >
            {username}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Failed to generate candy crush image: ${e.message}`);
    return new Response(`Failed to generate candy crush image`, {
      status: 500,
    });
  }
} 