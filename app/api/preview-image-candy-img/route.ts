import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const score = searchParams.get('score') || '0';
  const moves = searchParams.get('moves') || '0';
  const level = searchParams.get('level') || '1';
  const userImg = searchParams.get('userImg') || '';
  const username = searchParams.get('username') || 'Player';
  
  // Position parameters with defaults for Candy Crush layout
  const pfpX = parseInt(searchParams.get('pfpX') || '300');
  const pfpY = parseInt(searchParams.get('pfpY') || '250');
  const scoreX = parseInt(searchParams.get('scoreX') || '500');
  const scoreY = parseInt(searchParams.get('scoreY') || '150');
  const movesX = parseInt(searchParams.get('movesX') || '700');
  const movesY = parseInt(searchParams.get('movesY') || '150');
  const levelX = parseInt(searchParams.get('levelX') || '600');
  const levelY = parseInt(searchParams.get('levelY') || '300');
  const usernameX = parseInt(searchParams.get('usernameX') || '300');
  const usernameY = parseInt(searchParams.get('usernameY') || '500');

  // Size parameters with defaults
  const pfpRadius = parseInt(searchParams.get('pfpRadius') || '80');
  const scoreFontSize = parseInt(searchParams.get('scoreFontSize') || '48');
  const movesFontSize = parseInt(searchParams.get('movesFontSize') || '48');
  const levelFontSize = parseInt(searchParams.get('levelFontSize') || '48');
  const usernameFontSize = parseInt(searchParams.get('usernameFontSize') || '32');

  // Return HTML that generates and displays only the image
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Candy Crush Image</title>
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          background: #000;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        #canvas {
          max-width: 100%;
          max-height: 100vh;
          border: none;
        }
      </style>
    </head>
    <body>
      <canvas id="canvas" width="1200" height="630"></canvas>

      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Position variables from URL
        const positions = {
          pfp: { x: ${pfpX}, y: ${pfpY} },
          score: { x: ${scoreX}, y: ${scoreY} },
          moves: { x: ${movesX}, y: ${movesY} },
          level: { x: ${levelX}, y: ${levelY} },
          username: { x: ${usernameX}, y: ${usernameY} }
        };

        // Size variables from URL
        const sizes = {
          pfpRadius: ${pfpRadius},
          scoreFontSize: ${scoreFontSize},
          movesFontSize: ${movesFontSize},
          levelFontSize: ${levelFontSize},
          usernameFontSize: ${usernameFontSize}
        };
        
        function generateImage() {
          // Clear canvas
          ctx.clearRect(0, 0, 1200, 630);
          
          // Load and draw background image
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.onload = function() {
            // Fill background color (pink for candy theme)
            ctx.fillStyle = '#ff69b4';
            ctx.fillRect(0, 0, 1200, 630);
            
            // Draw background image (cover to fill entire frame, positioned at top center)
            const scale = Math.max(1200/bgImg.width, 630/bgImg.height);
            const x = (1200 - bgImg.width * scale) / 2; // Center horizontally
            const y = 0; // Position at top
            ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
            
            // Add overlays
            addTextOverlays();
            addProfilePicture();
          };
          bgImg.src = '/og/mona.png';
        }
        
        function addTextOverlays() {
          // Set common text properties
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          // Score
          ctx.font = \`bold \${sizes.scoreFontSize}px Arial\`;
          ctx.fillText('${parseInt(score).toLocaleString()}', positions.score.x, positions.score.y);
          
          // Moves
          ctx.font = \`bold \${sizes.movesFontSize}px Arial\`;
          ctx.fillText('${moves}', positions.moves.x, positions.moves.y);
          
          // Level
          ctx.font = \`bold \${sizes.levelFontSize}px Arial\`;
          ctx.fillText('${level}', positions.level.x, positions.level.y);
          
          // Username
          ctx.font = \`bold \${sizes.usernameFontSize}px Arial\`;
          ctx.fillText('${username}', positions.username.x, positions.username.y);
          
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        function addProfilePicture() {
          const userImgUrl = '${userImg}';
          if (!userImgUrl) {
            // Draw a placeholder circle if no image
            const x = positions.pfp.x;
            const y = positions.pfp.y;
            const radius = sizes.pfpRadius;
            
            ctx.fillStyle = '#cccccc';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Add "?" text
            ctx.fillStyle = '#666666';
            ctx.font = \`bold \${radius}px Arial\`;
            ctx.textAlign = 'center';
            ctx.fillText('?', x, y + radius/3);
            return;
          }
          
          const pfpImg = new Image();
          pfpImg.crossOrigin = 'anonymous';
          pfpImg.onload = function() {
            // Draw circular profile picture using dynamic position and size
            const x = positions.pfp.x;
            const y = positions.pfp.y;
            const radius = sizes.pfpRadius;
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.clip();
            
            ctx.drawImage(pfpImg, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();
            
            // Add white border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
          };
          pfpImg.onerror = function() {
            // Fallback if image fails to load
            const x = positions.pfp.x;
            const y = positions.pfp.y;
            const radius = sizes.pfpRadius;
            
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Add "X" text
            ctx.fillStyle = '#ffffff';
            ctx.font = \`bold \${radius}px Arial\`;
            ctx.textAlign = 'center';
            ctx.fillText('X', x, y + radius/3);
          };
          pfpImg.src = userImgUrl;
        }
        
        // Generate image on load
        generateImage();
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
} 