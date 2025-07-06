'use client';

import { useState } from 'react';

export default function CandyCrushPreviewPage() {
  // Position states for Candy Crush layout
  const [pfpX, setPfpX] = useState(300);
  const [pfpY, setPfpY] = useState(250);
  const [scoreX, setScoreX] = useState(500);
  const [scoreY, setScoreY] = useState(150);
  const [movesX, setMovesX] = useState(700);
  const [movesY, setMovesY] = useState(150);
  const [levelX, setLevelX] = useState(600);
  const [levelY, setLevelY] = useState(300);
  const [usernameX, setUsernameX] = useState(300);
  const [usernameY, setUsernameY] = useState(500);

  // Size states
  const [pfpRadius, setPfpRadius] = useState(80);
  const [scoreFontSize, setScoreFontSize] = useState(48);
  const [movesFontSize, setMovesFontSize] = useState(48);
  const [levelFontSize, setLevelFontSize] = useState(48);
  const [usernameFontSize, setUsernameFontSize] = useState(32);

  // Game data states
  const [score, setScore] = useState('15000');
  const [moves, setMoves] = useState('25');
  const [level, setLevel] = useState('3');
  const [username, setUsername] = useState('Player');
  const [userImg, setUserImg] = useState('https://i.pravatar.cc/200?img=1');

  const generatePreviewUrl = () => {
    const params = new URLSearchParams({
      score,
      moves,
      level,
      username,
      userImg,
      pfpX: pfpX.toString(),
      pfpY: pfpY.toString(),
      scoreX: scoreX.toString(),
      scoreY: scoreY.toString(),
      movesX: movesX.toString(),
      movesY: movesY.toString(),
      levelX: levelX.toString(),
      levelY: levelY.toString(),
      usernameX: usernameX.toString(),
      usernameY: usernameY.toString(),
      pfpRadius: pfpRadius.toString(),
      scoreFontSize: scoreFontSize.toString(),
      movesFontSize: movesFontSize.toString(),
      levelFontSize: levelFontSize.toString(),
      usernameFontSize: usernameFontSize.toString(),
    });
    return `/api/preview-image-candy-img?${params}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-center mb-4 text-pink-600">
            🍭 Candy Crush Image Preview Editor
          </h1>
          
          {/* Game Data Controls */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Score</label>
              <input
                type="text"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Moves</label>
              <input
                type="text"
                value={moves}
                onChange={(e) => setMoves(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Level</label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Profile Image URL</label>
              <input
                type="url"
                value={userImg}
                onChange={(e) => setUserImg(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Position Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-pink-700">📍 Position Controls</h3>
              
              {/* Profile Picture Position */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Profile Picture</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm">X: {pfpX}</label>
                    <input
                      type="range"
                      min="0"
                      max="1200"
                      value={pfpX}
                      onChange={(e) => setPfpX(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Y: {pfpY}</label>
                    <input
                      type="range"
                      min="0"
                      max="630"
                      value={pfpY}
                      onChange={(e) => setPfpY(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Score Position */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Score</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm">X: {scoreX}</label>
                    <input
                      type="range"
                      min="0"
                      max="1200"
                      value={scoreX}
                      onChange={(e) => setScoreX(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Y: {scoreY}</label>
                    <input
                      type="range"
                      min="0"
                      max="630"
                      value={scoreY}
                      onChange={(e) => setScoreY(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Moves Position */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Moves</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm">X: {movesX}</label>
                    <input
                      type="range"
                      min="0"
                      max="1200"
                      value={movesX}
                      onChange={(e) => setMovesX(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Y: {movesY}</label>
                    <input
                      type="range"
                      min="0"
                      max="630"
                      value={movesY}
                      onChange={(e) => setMovesY(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Level Position */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Level</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm">X: {levelX}</label>
                    <input
                      type="range"
                      min="0"
                      max="1200"
                      value={levelX}
                      onChange={(e) => setLevelX(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Y: {levelY}</label>
                    <input
                      type="range"
                      min="0"
                      max="630"
                      value={levelY}
                      onChange={(e) => setLevelY(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Username Position */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Username</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm">X: {usernameX}</label>
                    <input
                      type="range"
                      min="0"
                      max="1200"
                      value={usernameX}
                      onChange={(e) => setUsernameX(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Y: {usernameY}</label>
                    <input
                      type="range"
                      min="0"
                      max="630"
                      value={usernameY}
                      onChange={(e) => setUsernameY(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Size Controls */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-purple-700">📏 Size Controls</h3>
              
              {/* Profile Picture Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Profile Picture Radius: {pfpRadius}px (Diameter: {pfpRadius * 2}px)
                </label>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={pfpRadius}
                  onChange={(e) => setPfpRadius(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Score Font Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Score Font Size: {scoreFontSize}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={scoreFontSize}
                  onChange={(e) => setScoreFontSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Moves Font Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Moves Font Size: {movesFontSize}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={movesFontSize}
                  onChange={(e) => setMovesFontSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Level Font Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Level Font Size: {levelFontSize}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={levelFontSize}
                  onChange={(e) => setLevelFontSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Username Font Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Username Font Size: {usernameFontSize}px
                </label>
                <input
                  type="range"
                  min="16"
                  max="60"
                  value={usernameFontSize}
                  onChange={(e) => setUsernameFontSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">🖼️ Live Preview</h3>
            <div className="flex justify-center">
              <iframe
                src={generatePreviewUrl()}
                width="600"
                height="315"
                className="border-2 border-gray-300 rounded-lg shadow-lg"
                title="Candy Crush Image Preview"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <a
              href={generatePreviewUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🔍 Open Full Preview
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatePreviewUrl());
                alert('Preview URL copied to clipboard!');
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              📋 Copy Preview URL
            </button>
          </div>

          {/* Current Values Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">📊 Current Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Positions:</h4>
                <p>Profile Picture: ({pfpX}, {pfpY})</p>
                <p>Score: ({scoreX}, {scoreY})</p>
                <p>Moves: ({movesX}, {movesY})</p>
                <p>Level: ({levelX}, {levelY})</p>
                <p>Username: ({usernameX}, {usernameY})</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Sizes:</h4>
                <p>Profile Picture: {pfpRadius}px radius</p>
                <p>Score: {scoreFontSize}px</p>
                <p>Moves: {movesFontSize}px</p>
                <p>Level: {levelFontSize}px</p>
                <p>Username: {usernameFontSize}px</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 