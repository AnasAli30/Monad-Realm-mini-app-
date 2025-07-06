import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const score = searchParams.get('score') || '0';
    const time = searchParams.get('time') || '00:00';
    const userImg = searchParams.get('userImg') || '';
    const gameType = searchParams.get('gameType') || 'vertical-jump';

    // Validate required parameters
    if (!score || !time) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Get the full URL for the background image
    const baseUrl = new URL(request.url).origin;
    const backgroundImage = gameType === 'vertical-jump' 
      ? `${baseUrl}/images/hop.png` 
      : `${baseUrl}/images/feed.png`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            position: 'relative',
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Profile Picture - Replace character face (positioned where the character's face is) */}
          {userImg && (
            <div
              style={{
                position: 'absolute',
                top: '260px', // Positioned where the character's face is
                left: '160px', // Centered on the character
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid #ffffff',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                zIndex: 10,
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

          {/* Score - In the green SCORE tile at top */}
          <div
            style={{
              position: 'absolute',
              top: '210px', // Position in the green SCORE tile
              left: '440px', // Centered in the SCORE tile
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '120px',
              height: '30px',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                textAlign: 'center',
              }}
            >
              {parseInt(score).toLocaleString()}
            </div>
          </div>

          {/* Time - In the green TIME tile at bottom */}
          <div
            style={{
              position: 'absolute',
              top: '400px', // Position in the green TIME tile
              left: '350px', // Centered in the TIME tile
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '120px',
              height: '30px',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                textAlign: 'center',
              }}
            >
              {time}
            </div>
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