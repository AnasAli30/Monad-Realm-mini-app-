'use client';
import { useState } from 'react';

export default function StoneShooterPreview() {
  // State for all fields used in the OG image
  const [score, setScore] = useState('0');
  const [time, setTime] = useState('00:00');
  const [stonesDestroyed, setStonesDestroyed] = useState('0');
  const [playerHits, setPlayerHits] = useState('0');
  const [userImg, setUserImg] = useState('https://via.placeholder.com/120x120/4F46E5/000000?text=PFP');
  const [username, setUsername] = useState('Player');

  // Position and size controls (default values from og-image-stoneshooter)
  const [pfpX, setPfpX] = useState(80);
  const [pfpY, setPfpY] = useState(80);
  const [pfpRadius, setPfpRadius] = useState(60);
  const [usernameX, setUsernameX] = useState(170);
  const [usernameY, setUsernameY] = useState(90);
  const [scoreX, setScoreX] = useState(800);
  const [scoreY, setScoreY] = useState(100);
  const [timeX, setTimeX] = useState(900);
  const [timeY, setTimeY] = useState(180);
  const [stonesX, setStonesX] = useState(900);
  const [stonesY, setStonesY] = useState(270);
  const [hitsX, setHitsX] = useState(800);
  const [hitsY, setHitsY] = useState(350);
  const [fontSize, setFontSize] = useState(48);
  const [labelFontSize, setLabelFontSize] = useState(28);

  // Generate preview URL
  const previewUrl = `/api/og-image-stoneshooter?score=${score}&time=${time}&stonesDestroyed=${stonesDestroyed}&playerHits=${playerHits}&userImg=${encodeURIComponent(userImg)}&username=${encodeURIComponent(username)}&pfpX=${pfpX}&pfpY=${pfpY}&pfpRadius=${pfpRadius}&usernameX=${usernameX}&usernameY=${usernameY}&scoreX=${scoreX}&scoreY=${scoreY}&timeX=${timeX}&timeY=${timeY}&stonesX=${stonesX}&stonesY=${stonesY}&hitsX=${hitsX}&hitsY=${hitsY}&fontSize=${fontSize}&labelFontSize=${labelFontSize}`;

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>🪨 Stone Shooter Image Preview</h1>
      <div style={{ marginBottom: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>🎛️ Content Controls</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div>
            <label>Score: </label>
            <input type="text" value={score} onChange={e => setScore(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label>Time: </label>
            <input type="text" value={time} onChange={e => setTime(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label>Stones Destroyed: </label>
            <input type="text" value={stonesDestroyed} onChange={e => setStonesDestroyed(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label>Player Hits: </label>
            <input type="text" value={playerHits} onChange={e => setPlayerHits(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label>Username: </label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label>Profile Image URL: </label>
            <input type="text" value={userImg} onChange={e => setUserImg(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '300px' }} />
          </div>
        </div>
        <h3>📍 Position & Size Controls</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <label>PFP X: </label>
            <input type="number" value={pfpX} onChange={e => setPfpX(Number(e.target.value))} style={{ width: '70px' }} />
            <label> Y: </label>
            <input type="number" value={pfpY} onChange={e => setPfpY(Number(e.target.value))} style={{ width: '70px' }} />
            <label> Radius: </label>
            <input type="number" value={pfpRadius} onChange={e => setPfpRadius(Number(e.target.value))} style={{ width: '70px' }} />
          </div>
          <div>
            <label>Username X: </label>
            <input type="number" value={usernameX} onChange={e => setUsernameX(Number(e.target.value))} style={{ width: '70px' }} />
            <label> Y: </label>
            <input type="number" value={usernameY} onChange={e => setUsernameY(Number(e.target.value))} style={{ width: '70px' }} />
          </div>
          <div>
            <label>Score X: </label>
            <input type="number" value={scoreX} onChange={e => setScoreX(Number(e.target.value))} style={{ width: '70px' }} />
            <label> Y: </label>
            <input type="number" value={scoreY} onChange={e => setScoreY(Number(e.target.value))} style={{ width: '70px' }} />
          </div>
          <div>
            <label>Time X: </label>
            <input type="number" value={timeX} onChange={e => setTimeX(Number(e.target.value))} style={{ width: '70px' }} />
            <label> Y: </label>
            <input type="number" value={timeY} onChange={e => setTimeY(Number(e.target.value))} style={{ width: '70px' }} />
          </div>
          <div>
            <label>Stones X: </label>
            <input type="number" value={stonesX} onChange={e => setStonesX(Number(e.target.value))} style={{ width: '70px' }} />
            <label> Y: </label>
            <input type="number" value={stonesY} onChange={e => setStonesY(Number(e.target.value))} style={{ width: '70px' }} />
          </div>
          <div>
            <label>Hits X: </label>
            <input type="number" value={hitsX} onChange={e => setHitsX(Number(e.target.value))} style={{ width: '70px' }} />
            <label> Y: </label>
            <input type="number" value={hitsY} onChange={e => setHitsY(Number(e.target.value))} style={{ width: '70px' }} />
          </div>
          <div>
            <label>Font Size: </label>
            <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: '70px' }} />
            <label> Label Font Size: </label>
            <input type="number" value={labelFontSize} onChange={e => setLabelFontSize(Number(e.target.value))} style={{ width: '70px' }} />
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <img src={previewUrl} alt="Stone Shooter Preview" style={{ border: '2px solid #333', borderRadius: '8px', width: '900px', maxWidth: '100%' }} />
      </div>
    </div>
  );
} 