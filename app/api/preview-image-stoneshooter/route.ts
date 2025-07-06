import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const score = searchParams.get('score') || '0';
  const time = searchParams.get('time') || '00:00';
  const stonesDestroyed = searchParams.get('stonesDestroyed') || '0';
  const playerHits = searchParams.get('playerHits') || '0';
  const userImg = searchParams.get('userImg') || 'https://images.ctfassets.net/h6goo9gw1hh6/2sNZtFAWOdP1lmQ33VwRN3/24e953b920a9cd0ff2e1d587742a2472/1-intro-photo-final.jpg?w=1200&h=992&fl=progressive&q=70&fm=jpg';
  const username = searchParams.get('username') || 'Player';

  // Position and size parameters with defaults (from og-image-stoneshooter)
  const pfpX = parseInt(searchParams.get('pfpX') || '400');
  const pfpY = parseInt(searchParams.get('pfpY') || '250');
  const pfpRadius = parseInt(searchParams.get('pfpRadius') || '60');
  const usernameX = parseInt(searchParams.get('usernameX') || '400');
  const usernameY = parseInt(searchParams.get('usernameY') || '370');
  const scoreX = parseInt(searchParams.get('scoreX') || '700');
  const scoreY = parseInt(searchParams.get('scoreY') || '250');
  const timeX = parseInt(searchParams.get('timeX') || '700');
  const timeY = parseInt(searchParams.get('timeY') || '330');
  const stonesX = parseInt(searchParams.get('stonesX') || '700');
  const stonesY = parseInt(searchParams.get('stonesY') || '400');
  const hitsX = parseInt(searchParams.get('hitsX') || '700');
  const hitsY = parseInt(searchParams.get('hitsY') || '470');
  const fontSize = parseInt(searchParams.get('fontSize') || '48');
  const labelFontSize = parseInt(searchParams.get('labelFontSize') || '28');

  // Return HTML that generates the image using Canvas
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Stone Shooter Image Preview</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f0f0f0; }
        .container { max-width: 1200px; margin: 0 auto; }
        #canvas { border: 2px solid #333; border-radius: 8px; background: white; display: block; margin: 20px auto; }
        .info { text-align: center; margin: 20px 0; }
        .download-btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 10px; }
        .coords { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
        .settings { background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🪨 Stone Shooter Generated Image Preview</h1>
        <div class="info">
          <p><strong>Score:</strong> ${score} | <strong>Time:</strong> ${time} | <strong>Stones:</strong> ${stonesDestroyed} | <strong>Hits:</strong> ${playerHits} | <strong>Username:</strong> ${username}</p>
        </div>
        <canvas id="canvas" width="1200" height="630"></canvas>
        <div class="coords">
          <h3>📍 Current Positions:</h3>
          <p><strong>Profile Picture:</strong> (${pfpX}, ${pfpY})</p>
          <p><strong>Username:</strong> (${usernameX}, ${usernameY})</p>
          <p><strong>Score:</strong> (${scoreX}, ${scoreY})</p>
          <p><strong>Time:</strong> (${timeX}, ${timeY})</p>
          <p><strong>Stones:</strong> (${stonesX}, ${stonesY})</p>
          <p><strong>Hits:</strong> (${hitsX}, ${hitsY})</p>
        </div>
        <div class="settings">
          <h3>📝 Current Sizes:</h3>
          <p><strong>Profile Picture:</strong> ${pfpRadius}px radius (${pfpRadius * 2}px diameter)</p>
          <p><strong>Font Size:</strong> ${fontSize}px | <strong>Label Font Size:</strong> ${labelFontSize}px</p>
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
        function draw() {
          ctx.clearRect(0, 0, 1200, 630);
          // Background
          const bgImg = new window.Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.onload = function() {
            ctx.drawImage(bgImg, 0, 0, 1200, 630);
            drawProfile();
            drawText();
          };
          bgImg.src = '/og/bouce.png';
        }
        function drawProfile() {
          if ('${userImg}') {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
              ctx.save();
              ctx.beginPath();
              ctx.arc(${pfpX} + ${pfpRadius}, ${pfpY} + ${pfpRadius}, ${pfpRadius}, 0, 2 * Math.PI);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(img, ${pfpX}, ${pfpY}, ${pfpRadius * 2}, ${pfpRadius * 2});
              ctx.restore();
            };
            img.src = '${userImg}';
          }
        }
        function drawText() {
          ctx.font = 'bold ' + ${fontSize} + 'px Arial';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'left';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          // Username
          ctx.fillText('${username}', ${usernameX}, ${usernameY} + ${fontSize});
          // Score
          ctx.font = 'bold ' + ${labelFontSize} + 'px Arial';
          ctx.fillStyle = '#ffd700';
          ctx.fillText('Score', ${scoreX}, ${scoreY});
          ctx.font = 'bold ' + ${fontSize} + 'px Arial';
          ctx.fillStyle = '#fff';
          ctx.fillText('${score}', ${scoreX} + 120, ${scoreY});
          // Time
          ctx.font = 'bold ' + ${labelFontSize} + 'px Arial';
          ctx.fillStyle = '#ffd700';
          ctx.fillText('Time', ${timeX}, ${timeY});
          ctx.font = 'bold ' + ${fontSize} + 'px Arial';
          ctx.fillStyle = '#fff';
          ctx.fillText('${time}', ${timeX} + 120, ${timeY});
          // Stones Destroyed
          ctx.font = 'bold ' + ${labelFontSize} + 'px Arial';
          ctx.fillStyle = '#ffd700';
          ctx.fillText('Stones', ${stonesX}, ${stonesY});
          ctx.font = 'bold ' + ${fontSize} + 'px Arial';
          ctx.fillStyle = '#fff';
          ctx.fillText('${stonesDestroyed}', ${stonesX} + 120, ${stonesY});
          // Player Hits
          ctx.font = 'bold ' + ${labelFontSize} + 'px Arial';
          ctx.fillStyle = '#ffd700';
          ctx.fillText('Hits', ${hitsX}, ${hitsY});
          ctx.font = 'bold ' + ${fontSize} + 'px Arial';
          ctx.fillStyle = '#fff';
          ctx.fillText('${playerHits}', ${hitsX} + 120, ${hitsY});
        }
        function downloadImage() {
          const link = document.createElement('a');
          link.download = 'stone-shooter-preview.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
        function regenerateImage() { draw(); }
        function goBack() { window.history.back(); }
        window.onload = draw;
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
} 