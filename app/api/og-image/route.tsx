import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const score = searchParams.get('score') || '0';
    const time = searchParams.get('time') || '00:00';
    const userImg = searchParams.get('userImg') || '';
    const gameType = searchParams.get('gameType') || 'vertical-jump';
    
    // Position parameters with defaults
    const pfpX = parseInt(searchParams.get('pfpX') || '282');
    const pfpY = parseInt(searchParams.get('pfpY') || '249');
    const scoreX = parseInt(searchParams.get('scoreX') || '610');
    const scoreY = parseInt(searchParams.get('scoreY') || '170');
    const timeX = parseInt(searchParams.get('timeX') || '534');
    const timeY = parseInt(searchParams.get('timeY') || '400');

    // Size parameters with defaults
    const pfpRadius = parseInt(searchParams.get('pfpRadius') || '110');
    const scoreFontSize = parseInt(searchParams.get('scoreFontSize') || '54');
    const timeFontSize = parseInt(searchParams.get('timeFontSize') || '48');

    // Get the base URL for the background image
    const baseUrl = new URL(request.url).origin;
    const backgroundImageUrl = `${baseUrl}/images/hop.png`;

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            position: 'relative',
            backgroundColor: '#1e40af',
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
              objectFit: 'contain',
              objectPosition: 'center',
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
              color: '#ffffff',
              fontSize: `${scoreFontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              display: 'flex',
              textAlign: 'center',
              width: '120px',
              justifyContent: 'center',
            }}
          >
            {parseInt(score).toLocaleString()}
          </div>

          {/* Time */}
          <div
            style={{
              position: 'absolute',
              top: `${timeY}px`,
              left: `${timeX}px`,
              color: '#ffffff',
              fontSize: `${timeFontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              display: 'flex',
              textAlign: 'center',
              width: '120px',
              justifyContent: 'center',
            }}
          >
            {time}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Failed to generate image: ${e.message}`);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
} 