import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const score = searchParams.get('score') || '0';
    const time = searchParams.get('time') || '00:00';
    const userImg = searchParams.get('userImg') || '';
    const username = searchParams.get('username') || 'Player';
    const gameType = searchParams.get('gameType') || 'vertical-jump';
    
    // Position parameters with defaults
    const pfpX = parseInt(searchParams.get('pfpX') || '282');
    const pfpY = parseInt(searchParams.get('pfpY') || '249');
    const scoreX = parseInt(searchParams.get('scoreX') || '610');
    const scoreY = parseInt(searchParams.get('scoreY') || '170');
    const timeX = parseInt(searchParams.get('timeX') || '534');
    const timeY = parseInt(searchParams.get('timeY') || '400');

    // New label and username positions
    const scoreLabelX = parseInt(searchParams.get('scoreLabelX') || '622');
    const scoreLabelY = parseInt(searchParams.get('scoreLabelY') || '237');
    const timeLabelX = parseInt(searchParams.get('timeLabelX') || '542');
    const timeLabelY = parseInt(searchParams.get('timeLabelY') || '459');
    const usernameX = parseInt(searchParams.get('usernameX') || '282');
    const usernameY = parseInt(searchParams.get('usernameY') || '562');

    // Size parameters with defaults
    const pfpRadius = parseInt(searchParams.get('pfpRadius') || '110');
    const scoreFontSize = parseInt(searchParams.get('scoreFontSize') || '54');
    const timeFontSize = parseInt(searchParams.get('timeFontSize') || '48');
    const scoreLabelFontSize = parseInt(searchParams.get('scoreLabelFontSize') || '32');
    const timeLabelFontSize = parseInt(searchParams.get('timeLabelFontSize') || '32');
    const usernameFontSize = parseInt(searchParams.get('usernameFontSize') || '39');

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

          {/* Score Number */}
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

          {/* Score Label */}
          <div
            style={{
              position: 'absolute',
              top: `${scoreLabelY}px`,
              left: `${scoreLabelX}px`,
              color: '#ffffff',
              fontSize: `${scoreLabelFontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              display: 'flex',
              textAlign: 'center',
              width: '120px',
              justifyContent: 'center',
            }}
          >
            SCORE
          </div>

          {/* Time Number */}
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

          {/* Time Label */}
          <div
            style={{
              position: 'absolute',
              top: `${timeLabelY}px`,
              left: `${timeLabelX}px`,
              color: '#ffffff',
              fontSize: `${timeLabelFontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              display: 'flex',
              textAlign: 'center',
              width: '120px',
              justifyContent: 'center',
            }}
          >
            TIME
          </div>

          {/* Username */}
          <div
            style={{
              position: 'absolute',
              top: `${usernameY}px`,
              left: `${usernameX}px`,
              color: '#ffffff',
              fontSize: `${usernameFontSize}px`,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
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
    console.log(`Failed to generate image: ${e.message}`);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
} 