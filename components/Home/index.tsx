'use client'


import dynamic from 'next/dynamic';
import { useState } from 'react';

const VerticalJumperGame = dynamic(() => import('@/components/Home/VerticalJumperGame'), { ssr: false });
const StickmanArcherGame = dynamic(() => import('@/components/Home/StickmanArcherGame'), { ssr: false });
const CandyCrushGame = dynamic(() => import('@/components/Home/CandyCrushGame'), { ssr: false });

export function Demo() {
  const [currentView, setCurrentView] = useState<'menu' | 'singlePlayer' | 'loading' | 'jumpGame' | 'archerGame' | 'candyGame'>('menu');
  const [loadingGameType, setLoadingGameType] = useState<'jump' | 'archer' | 'candy'>('jump');

  const handleStartJumpGame = () => {
    setLoadingGameType('jump');
    setCurrentView('loading');
    // Simulate game loading time
    setTimeout(() => {
      setCurrentView('jumpGame');
    }, 2000); // 2 seconds loading time
  };

  const handleStartArcherGame = () => {
    setLoadingGameType('archer');
    setCurrentView('loading');
    // Simulate game loading time
    setTimeout(() => {
      setCurrentView('archerGame');
    }, 2000); // 2 seconds loading time
  };

  const handleStartCandyGame = () => {
    setLoadingGameType('candy');
    setCurrentView('loading');
    // Simulate game loading time
    setTimeout(() => {
      setCurrentView('candyGame');
    }, 2000); // 2 seconds loading time
  };

  if (currentView === 'jumpGame') {
    return <VerticalJumperGame />;
  }

  if (currentView === 'archerGame') {
    return <StickmanArcherGame />;
  }

  if (currentView === 'candyGame') {
    return <CandyCrushGame />;
  }

  if (currentView === 'loading') {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 50%, #f3f4f6 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{ textAlign: 'center', color: '#374151' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {loadingGameType === 'jump' ? 'Monad Jump' : loadingGameType === 'archer' ? 'Stickman Archer' : 'Candy Crush'}
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#6b7280' }}>
            {loadingGameType === 'jump' ? 'Initializing jumping game...' : loadingGameType === 'archer' ? 'Preparing your bow and arrows...' : 'Loading sweet candies...'}
          </p>
          
          
          
          {/* Progress Bar */}
          <div style={{ 
            width: '320px', 
            height: '8px', 
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            margin: '0 auto 2rem',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '4px',
              animation: 'pulse 2s ease-in-out infinite'
            }}></div>
          </div>
          
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Loading assets and preparing game...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'singlePlayer') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8 bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Single Player Games</h1>
          
          <div className="space-y-4">
            <button
              onClick={handleStartJumpGame}
              className="w-64 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🎮 Monad Jump
            </button>
            
            <button
              onClick={handleStartCandyGame}
              className="w-64 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🍭 Candy Crush
            </button>
            
            {/* <button
              onClick={handleStartArcherGame}
              className="w-64 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🏹 Stickman Archer
            </button> */}
          </div>
          
          <button
            onClick={() => setCurrentView('menu')}
            className="mt-8 px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg"
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-800 mb-8">Monad Realm</h1>
        <p className="text-xl text-gray-600 mb-8">Choose your game mode</p>
        
        <div className="space-y-4">
          <button
            onClick={() => setCurrentView('singlePlayer')}
            className="w-64 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            🎯 Single Player Game
          </button>
          
          <button
            disabled
            className="w-64 px-8 py-4 bg-gray-300 text-gray-500 font-bold text-xl rounded-lg shadow-lg cursor-not-allowed opacity-60"
          >
            🔒 Multiplayer (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}
