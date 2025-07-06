import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
  const scoreLabelX = parseInt(searchParams.get('scoreLabelX') || '610');
  const scoreLabelY = parseInt(searchParams.get('scoreLabelY') || '200');
  const timeLabelX = parseInt(searchParams.get('timeLabelX') || '534');
  const timeLabelY = parseInt(searchParams.get('timeLabelY') || '430');
  const usernameX = parseInt(searchParams.get('usernameX') || '400');
  const usernameY = parseInt(searchParams.get('usernameY') || '500');

  // Size parameters with defaults
  const pfpRadius = parseInt(searchParams.get('pfpRadius') || '110');
  const scoreFontSize = parseInt(searchParams.get('scoreFontSize') || '54');
  const timeFontSize = parseInt(searchParams.get('timeFontSize') || '48');
  const scoreLabelFontSize = parseInt(searchParams.get('scoreLabelFontSize') || '18');
  const timeLabelFontSize = parseInt(searchParams.get('timeLabelFontSize') || '18');
  const usernameFontSize = parseInt(searchParams.get('usernameFontSize') || '24');

  // Return HTML that generates the image using Canvas
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Image Preview</title>
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
          background: #4CAF50;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px;
        }
        .coords {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
        }
        .settings {
          background: #f0f8ff;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎮 Generated Image Preview</h1>
        <div class="info">
          <p><strong>Score:</strong> ${score} | <strong>Time:</strong> ${time} | <strong>Username:</strong> ${username}</p>
        </div>
        
        <canvas id="canvas" width="1200" height="630"></canvas>
        
        <div class="coords">
          <h3>📍 Current Positions:</h3>
          <p><strong>Profile Picture:</strong> (${pfpX}, ${pfpY})</p>
          <p><strong>Score Number:</strong> (${scoreX}, ${scoreY}) | <strong>Score Label:</strong> (${scoreLabelX}, ${scoreLabelY})</p>
          <p><strong>Time Number:</strong> (${timeX}, ${timeY}) | <strong>Time Label:</strong> (${timeLabelX}, ${timeLabelY})</p>
          <p><strong>Username:</strong> (${usernameX}, ${usernameY})</p>
        </div>

        <div class="settings">
          <h3>📏 Current Sizes:</h3>
          <p><strong>Profile Picture:</strong> ${pfpRadius}px radius (${pfpRadius * 2}px diameter)</p>
          <p><strong>Score:</strong> Number ${scoreFontSize}px | Label ${scoreLabelFontSize}px</p>
          <p><strong>Time:</strong> Number ${timeFontSize}px | Label ${timeLabelFontSize}px</p>
          <p><strong>Username:</strong> ${usernameFontSize}px</p>
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
          time: { x: ${timeX}, y: ${timeY} },
          scoreLabel: { x: ${scoreLabelX}, y: ${scoreLabelY} },
          timeLabel: { x: ${timeLabelX}, y: ${timeLabelY} },
          username: { x: ${usernameX}, y: ${usernameY} }
        };

        // Size variables from URL
        const sizes = {
          pfpRadius: ${pfpRadius},
          scoreFontSize: ${scoreFontSize},
          timeFontSize: ${timeFontSize},
          scoreLabelFontSize: ${scoreLabelFontSize},
          timeLabelFontSize: ${timeLabelFontSize},
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
            
            // Fill background color
            ctx.fillStyle = '#1e40af';
            ctx.fillRect(0, 0, 1200, 630);
            
            // Draw scaled image
            ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
            
            // Add overlays
            addTextOverlays();
            addProfilePicture();
          };
          bgImg.src = '/og/hop.png';
        }
        
        function addTextOverlays() {
          // Set common text properties
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          // Score Number
          ctx.font = \`bold \${sizes.scoreFontSize}px Arial\`;
          ctx.fillText('${parseInt(score).toLocaleString()}', positions.score.x, positions.score.y);
          
          // Score Label
          ctx.font = \`bold \${sizes.scoreLabelFontSize}px Arial\`;
          ctx.fillText('SCORE', positions.scoreLabel.x, positions.scoreLabel.y);
          
          // Time Number
          ctx.font = \`bold \${sizes.timeFontSize}px Arial\`;
          ctx.fillText('${time}', positions.time.x, positions.time.y);
          
          // Time Label
          ctx.font = \`bold \${sizes.timeLabelFontSize}px Arial\`;
          ctx.fillText('TIME', positions.timeLabel.x, positions.timeLabel.y);
          
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
          link.download = 'game-score-' + Date.now() + '.png';
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