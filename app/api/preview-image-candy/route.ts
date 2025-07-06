import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const score = searchParams.get('score') || '0';
  const moves = searchParams.get('moves') || '0';
  const level = searchParams.get('level') || '1';
  const userImg = searchParams.get('userImg') || '';
  const username = searchParams.get('username') || 'Player';
  const gameType = searchParams.get('gameType') || 'candy-crush';
  
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

  // Return HTML that generates the image using Canvas
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Candy Crush Image Preview</title>
      <style>
        body { 
          margin: 0; 
          padding: 20px; 
          font-family: Arial, sans-serif;
          background: #f0f0f0;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        #canvas {
          border: 2px solid #333;
          border-radius: 8px;
          background: white;
          display: block;
          margin: 20px auto;
        }
        .info {
          text-align: center;
          margin: 20px 0;
        }
        .download-btn {
          background: #ff69b4;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px;
        }
        .coords {
          background: #ffe4e1;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
        }
        .settings {
          background: #fff0f5;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🍭 Candy Crush Image Preview</h1>
        <div class="info">
          <p><strong>Score:</strong> ${score} | <strong>Level:</strong> ${level} | <strong>Moves:</strong> ${moves} | <strong>Username:</strong> ${username}</p>
        </div>
        
        <canvas id="canvas" width="1200" height="630"></canvas>
        
        <div class="coords">
          <h3>📍 Current Positions:</h3>
          <p><strong>Profile Picture:</strong> (${pfpX}, ${pfpY})</p>
          <p><strong>Score:</strong> (${scoreX}, ${scoreY}) | <strong>Moves:</strong> (${movesX}, ${movesY})</p>
          <p><strong>Level:</strong> (${levelX}, ${levelY}) | <strong>Username:</strong> (${usernameX}, ${usernameY})</p>
        </div>

        <div class="settings">
          <h3>📏 Current Sizes:</h3>
          <p><strong>Profile Picture:</strong> ${pfpRadius}px radius (${pfpRadius * 2}px diameter)</p>
          <p><strong>Score:</strong> ${scoreFontSize}px | <strong>Moves:</strong> ${movesFontSize}px</p>
          <p><strong>Level:</strong> ${levelFontSize}px | <strong>Username:</strong> ${usernameFontSize}px</p>
        </div>
        
        <div class="info">
          <button class="download-btn" onclick="downloadImage()">📥 Download Image</button>
          <button class="download-btn" onclick="regenerateImage()">🔄 Regenerate</button>
          <button class="download-btn" onclick="goBack()">← Back to Editor</button>
        </div>
      </div>

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
            // Draw background image (fit to canvas)
            const scale = Math.min(1200/bgImg.width, 630/bgImg.height);
            const x = (1200 - bgImg.width * scale) / 2;
            const y = (630 - bgImg.height * scale) / 2;
            
            // Fill background color (pink for candy theme)
            ctx.fillStyle = '#ff69b4';
            ctx.fillRect(0, 0, 1200, 630);
            
            // Draw scaled image
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
          if (!userImgUrl) return;
          
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
          pfpImg.src = userImgUrl;
        }
        
        function downloadImage() {
          const link = document.createElement('a');
          link.download = 'candy-crush-score-' + Date.now() + '.png';
          link.href = canvas.toDataURL();
          link.click();
        }
        
        function regenerateImage() {
          generateImage();
        }
        
        function goBack() {
          window.history.back();
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