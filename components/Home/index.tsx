'use client'

import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import dynamic from 'next/dynamic';
import { useState } from 'react';

const VerticalJumperGame = dynamic(() => import('@/components/Home/VerticalJumperGame'), { ssr: false });

export function Demo() {
  const [currentView, setCurrentView] = useState<'menu' | 'singlePlayer' | 'loading' | 'game'>('menu');

  const handleStartGame = () => {
    setCurrentView('loading');
    // Simulate game loading time
    setTimeout(() => {
      setCurrentView('game');
    }, 2000); // 2 seconds loading time
  };

  if (currentView === 'game') {
    return <VerticalJumperGame />;
  }

  if (currentView === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8 bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Monad Jump</h1>
          <p className="text-xl text-gray-600 mb-8">Loading game...</p>
          
          {/* Spinner Loader */}
          <div className="flex justify-center mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-80 bg-gray-200 rounded-full h-2 mx-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>
          
          {/* Loading Messages */}
          <div className="space-y-2">
            <p className="text-gray-500 animate-pulse">Initializing game engine...</p>
            <p className="text-gray-500 animate-pulse">Loading assets...</p>
            <p className="text-gray-500 animate-pulse">Preparing platforms...</p>
          </div>
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
              onClick={handleStartGame}
              className="w-64 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🎮 Monad Jump
            </button>
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
