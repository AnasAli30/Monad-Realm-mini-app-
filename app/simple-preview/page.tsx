'use client';
import { useState } from 'react';

export default function SimplePreview() {
  const [score, setScore] = useState('1250');
  const [time, setTime] = useState('01:23');
  const [userImg, setUserImg] = useState('https://via.placeholder.com/100x100/4F46E5/000000?text=PFP');
  
  // Position controls (full size coordinates)
  const [pfpX, setPfpX] = useState(282);
  const [pfpY, setPfpY] = useState(249);
  const [scoreX, setScoreX] = useState(610);
  const [scoreY, setScoreY] = useState(170);
  const [timeX, setTimeX] = useState(534);
  const [timeY, setTimeY] = useState(400);

  // Size controls
  const [pfpRadius, setPfpRadius] = useState(110);
  const [scoreFontSize, setScoreFontSize] = useState(54);
  const [timeFontSize, setTimeFontSize] = useState(48);

  // Generate URLs with current positions and sizes
  const canvasUrl = `http://localhost:3000/api/preview-image?score=${score}&time=${time}&userImg=${encodeURIComponent(userImg)}&pfpX=${pfpX}&pfpY=${pfpY}&scoreX=${scoreX}&scoreY=${scoreY}&timeX=${timeX}&timeY=${timeY}&pfpRadius=${pfpRadius}&scoreFontSize=${scoreFontSize}&timeFontSize=${timeFontSize}`;
  const ogUrl = `http://localhost:3000/api/og-image?score=${score}&time=${time}&userImg=${encodeURIComponent(userImg)}&pfpX=${pfpX}&pfpY=${pfpY}&scoreX=${scoreX}&scoreY=${scoreY}&timeX=${timeX}&timeY=${timeY}&pfpRadius=${pfpRadius}&scoreFontSize=${scoreFontSize}&timeFontSize=${timeFontSize}`;

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>🎮 Adjustable Image Preview</h1>
      
      {/* Controls */}
      <div style={{ marginBottom: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>🎛️ Content Controls</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div>
            <label>Score: </label>
            <input 
              type="text" 
              value={score} 
              onChange={(e) => setScore(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label>Time: </label>
            <input 
              type="text" 
              value={time} 
              onChange={(e) => setTime(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label>Profile Image URL: </label>
            <input 
              type="text" 
              value={userImg} 
              onChange={(e) => setUserImg(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '300px' }}
            />
          </div>
        </div>

        <h3>📍 Position Controls (1200x630 coordinates)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
          {/* Profile Picture Position */}
          <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
            <h4>👤 Profile Picture</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label>X (Left/Right): </label>
                <input 
                  type="number" 
                  value={pfpX} 
                  onChange={(e) => setPfpX(parseInt(e.target.value) || 0)}
                  style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
                />
              </div>
              <div>
                <label>Y (Top/Bottom): </label>
                <input 
                  type="number" 
                  value={pfpY} 
                  onChange={(e) => setPfpY(parseInt(e.target.value) || 0)}
                  style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
                />
              </div>
            </div>
          </div>

          {/* Score Position */}
          <div style={{ padding: '15px', background: '#e8f5e8', borderRadius: '8px' }}>
            <h4>🎯 Score</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label>X (Left/Right): </label>
                <input 
                  type="number" 
                  value={scoreX} 
                  onChange={(e) => setScoreX(parseInt(e.target.value) || 0)}
                  style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
                />
              </div>
              <div>
                <label>Y (Top/Bottom): </label>
                <input 
                  type="number" 
                  value={scoreY} 
                  onChange={(e) => setScoreY(parseInt(e.target.value) || 0)}
                  style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
                />
              </div>
            </div>
          </div>

          {/* Time Position */}
          <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
            <h4>⏱️ Time</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label>X (Left/Right): </label>
                <input 
                  type="number" 
                  value={timeX} 
                  onChange={(e) => setTimeX(parseInt(e.target.value) || 0)}
                  style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
                />
              </div>
              <div>
                <label>Y (Top/Bottom): </label>
                <input 
                  type="number" 
                  value={timeY} 
                  onChange={(e) => setTimeY(parseInt(e.target.value) || 0)}
                  style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
                />
              </div>
            </div>
          </div>
        </div>

        <h3>📏 Size Controls</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {/* Profile Picture Size */}
          <div style={{ padding: '15px', background: '#f3e5f5', borderRadius: '8px' }}>
            <h4>👤 Profile Picture Size</h4>
            <div>
              <label>Radius (px): </label>
              <input 
                type="number" 
                value={pfpRadius} 
                onChange={(e) => setPfpRadius(parseInt(e.target.value) || 40)}
                min="10"
                max="100"
                style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Diameter: {pfpRadius * 2}px
              </div>
            </div>
          </div>

          {/* Score Font Size */}
          <div style={{ padding: '15px', background: '#e8f5e8', borderRadius: '8px' }}>
            <h4>🎯 Score Font Size</h4>
            <div>
              <label>Font Size (px): </label>
              <input 
                type="number" 
                value={scoreFontSize} 
                onChange={(e) => setScoreFontSize(parseInt(e.target.value) || 24)}
                min="12"
                max="60"
                style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
              />
            </div>
          </div>

          {/* Time Font Size */}
          <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
            <h4>⏱️ Time Font Size</h4>
            <div>
              <label>Font Size (px): </label>
              <input 
                type="number" 
                value={timeFontSize} 
                onChange={(e) => setTimeFontSize(parseInt(e.target.value) || 20)}
                min="12"
                max="60"
                style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div style={{ 
        border: '2px solid #333', 
        borderRadius: '8px', 
        overflow: 'hidden',
        width: '600px', // Half size for preview
        height: '315px',
        margin: '0 auto',
        position: 'relative',
        backgroundImage: 'url(/images/hop.png)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1e40af'
      }}>
        {/* Profile Picture */}
        {userImg && (
          <div style={{
            position: 'absolute',
            top: `${pfpY / 2}px`, // Half for preview
            left: `${pfpX / 2}px`, // Half for preview
            width: `${pfpRadius}px`, // Half radius for preview
            height: `${pfpRadius}px`,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #000000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            background: '#000000',
          }}>
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
        <div style={{
          position: 'absolute',
          top: `${scoreY / 2}px`, // Half for preview
          left: `${scoreX / 2}px`, // Half for preview
          color: '#000000',
          fontSize: `${scoreFontSize / 2}px`, // Half font size for preview
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          textAlign: 'center',
          width: '60px',
        }}>
          {parseInt(score).toLocaleString()}
        </div>

        {/* Time */}
        <div style={{
          position: 'absolute',
          top: `${timeY / 2}px`, // Half for preview
          left: `${timeX / 2}px`, // Half for preview
          color: '#000000',
          fontSize: `${timeFontSize / 2}px`, // Half font size for preview
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          textAlign: 'center',
          width: '60px',
        }}>
          {time}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>👆 Adjust the position and size controls above to move and resize elements!</p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          (Preview shown at 50% size - coordinates and sizes are for full 1200x630 image)
        </p>
      </div>

      {/* Current Settings Display */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f8ff', borderRadius: '8px' }}>
        <h3>📊 Current Settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', fontSize: '14px' }}>
          <div>
            <strong>👤 Profile Picture:</strong><br/>
            Position: ({pfpX}, {pfpY})<br/>
            Radius: {pfpRadius}px (Diameter: {pfpRadius * 2}px)
          </div>
          <div>
            <strong>🎯 Score:</strong><br/>
            Position: ({scoreX}, {scoreY})<br/>
            Font Size: {scoreFontSize}px
          </div>
          <div>
            <strong>⏱️ Time:</strong><br/>
            Position: ({timeX}, {timeY})<br/>
            Font Size: {timeFontSize}px
          </div>
        </div>
      </div>

      {/* Test URLs */}
      <div style={{ marginTop: '30px', padding: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
        <h3>🔗 Test URLs (with current positions and sizes)</h3>
        <div style={{ fontSize: '14px' }}>
          <p><strong>Canvas Preview:</strong></p>
          <code style={{ background: '#f0f0f0', padding: '8px', borderRadius: '4px', fontSize: '12px', wordBreak: 'break-all', display: 'block', marginBottom: '10px' }}>
            {canvasUrl}
          </code>
          
          <p><strong>Vercel OG:</strong></p>
          <code style={{ background: '#f0f0f0', padding: '8px', borderRadius: '4px', fontSize: '12px', wordBreak: 'break-all', display: 'block' }}>
            {ogUrl}
          </code>
        </div>
      </div>
    </div>
  );
} 