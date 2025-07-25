import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const score = searchParams.get('score') || '0';
    const time = searchParams.get('time') || '00:00';
    const stonesDestroyed = searchParams.get('stonesDestroyed') || '0';
    const playerHits = searchParams.get('playerHits') || '0';
    const userImg = searchParams.get('userImg') || '';
    const username = searchParams.get('username') || 'Player';
    
    // Default positions and sizes
    const pfpX = 400;
    const pfpY = 250;
    const pfpRadius = 60;
    const usernameX = 400;
    const usernameY = 370;
    const scoreX = 700;
    const scoreY = 250;
    const timeX = 700;
    const timeY = 330;
    const stonesX = 700;
    const stonesY = 400;
    const hitsX = 700;
    const hitsY = 470;
    const fontSize = 48;
    const labelFontSize = 40;

    // Get the base URL for the background image
    const baseUrl = new URL(request.url).origin;
    const backgroundImageUrl = `${baseUrl}/og/bouce.png`;

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            position: 'relative',
            backgroundColor: '#22223b',
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
                border: '4px solid #fff',
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

          {/* Username */}
          <div
            style={{
              position: 'absolute',
              top: `${usernameY}px`,
              left: `${usernameX}px`,
              color: '#fff',
              fontSize: `${fontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px #000',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {username}
          </div>

          {/* Score */}
          <div
            style={{
              position: 'absolute',
              top: `${scoreY}px`,
              left: `${scoreX}px`,
              color: '#fff',
              fontSize: `${fontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px #000',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: `${labelFontSize}px`, marginLeft: 12, color: '#ffd700' }}>Score :</span>
            {score}
            
          </div>

          {/* Time */}
          <div
            style={{
              position: 'absolute',
              top: `${timeY}px`,
              left: `${timeX}px`,
              color: '#fff',
              fontSize: `${fontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px #000',
              display: 'flex',
              alignItems: 'center',
            }}
          >
             <span style={{ fontSize: `${labelFontSize}px`, marginLeft: 12, color: '#ffd700' }}>Time :</span>
            {time.split(':')[0]}:{time.split(':')[1]}
           
          </div>

          {/* Stones Destroyed */}
          <div
            style={{
              position: 'absolute',
              top: `${stonesY}px`,
              left: `${stonesX}px`,
              color: '#fff',
              fontSize: `${fontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px #000',
              display: 'flex',
              alignItems: 'center',
            }}
          >
                <span style={{ fontSize: `${labelFontSize}px`, marginLeft: 12, color: '#ffd700' }}>Kills :</span>
            {stonesDestroyed}
        
          </div>

      
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Failed to generate stone shooter image: ${e.message}`);
    return new Response(`Failed to generate stone shooter image`, {
      status: 500,
    });
  }
} 