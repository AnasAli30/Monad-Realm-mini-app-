'use client'


import dynamic from 'next/dynamic';
import { useState } from 'react';

const VerticalJumperGame = dynamic(() => import('@/components/Home/VerticalJumperGame'), { 
  ssr: false,
  loading: () => (
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
          Monad Jump
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#6b7280' }}>
          Loading game...
        </p>
        
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
        
        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Preparing game assets...</p>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
});

const CandyCrushGame = dynamic(() => import('@/components/Home/CandyCrushGame'), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #f8b500 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{ textAlign: 'center', color: '#ffffff' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          MonaCrush
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#fff' }}>
          Loading game...
        </p>
        
        <div style={{ 
          width: '320px', 
          height: '8px', 
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: '4px',
          margin: '0 auto 2rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            background: 'linear-gradient(90deg, #ffffff 0%, #ffeb3b 100%)',
            borderRadius: '4px',
            animation: 'pulse 2s ease-in-out infinite'
          }}></div>
        </div>
        
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>Preparing candy adventure...</p>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
});

const StoneShooterGame = dynamic(() => import('@/components/Home/StoneShooterGame'), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #001122 0%, #003344 50%, #001122 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{ textAlign: 'center', color: '#ffffff' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          Bounce Blaster
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#fff' }}>
          Loading game...
        </p>
        
        <div style={{ 
          width: '320px', 
          height: '8px', 
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: '4px',
          margin: '0 auto 2rem',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            background: 'linear-gradient(90deg, #ffffff 0%, #ffeb3b 100%)',
            borderRadius: '4px',
            animation: 'pulse 2s ease-in-out infinite'
          }}></div>
        </div>
        
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>Preparing shooting mechanics...</p>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
});

const Leaderboard = dynamic(() => import('@/components/Leaderboard'), { ssr: false });

export function Demo() {
  const [currentView, setCurrentView] = useState<'menu' | 'singlePlayer' | 'jumpGame' | 'archerGame' | 'candyGame' | 'stoneShooterGame' | 'leaderboard'>('menu');

  const handleStartJumpGame = () => {
    setCurrentView('jumpGame');
  };

  const handleStartArcherGame = () => {
    setCurrentView('archerGame');
  };

  const handleStartCandyGame = () => {
    setCurrentView('candyGame');
  };

  const handleStartStoneShooterGame = () => {
    setCurrentView('stoneShooterGame');
  };

  // Bottom Navigation Component
  const BottomNavbar = () => (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '80px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 20px',
      zIndex: 1000,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
    }}>
      <button
        onClick={() => setCurrentView('menu')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: currentView === 'menu' ? '#ffffff' : 'rgba(255,255,255,0.7)',
          fontSize: '12px',
          fontWeight: currentView === 'menu' ? 'bold' : 'normal',
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          transform: currentView === 'menu' ? 'translateY(-2px)' : 'none'
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</div>
        <div>Home</div>
      </button>
      
      <button
        onClick={() => setCurrentView('singlePlayer')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: currentView === 'singlePlayer' ? '#ffffff' : 'rgba(255,255,255,0.7)',
          fontSize: '12px',
          fontWeight: currentView === 'singlePlayer' ? 'bold' : 'normal',
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          transform: currentView === 'singlePlayer' ? 'translateY(-2px)' : 'none'
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎮</div>
        <div>Games</div>
      </button>
      
      <button
        onClick={() => setCurrentView('leaderboard')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: currentView === 'leaderboard' ? '#ffffff' : 'rgba(255,255,255,0.7)',
          fontSize: '12px',
          fontWeight: currentView === 'leaderboard' ? 'bold' : 'normal',
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          transform: currentView === 'leaderboard' ? 'translateY(-2px)' : 'none'
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏆</div>
        <div>Leaderboard</div>
      </button>
    </div>
  );

  if (currentView === 'jumpGame') {
    return <VerticalJumperGame />;
  }

  if (currentView === 'stoneShooterGame') {
    return <StoneShooterGame />;
  }

  if (currentView === 'candyGame') {
    return <CandyCrushGame />;
  }

  if (currentView === 'leaderboard') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        paddingBottom: '80px', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Leaderboard />
        <BottomNavbar />
      </div>
    );
  }



  if (currentView === 'singlePlayer') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        paddingBottom: '80px', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
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
                🍭 MonaCrush
              </button>
              
              <button
                onClick={handleStartStoneShooterGame}
                className="w-64 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🎯 Bounce Blaster
              </button>
            </div>
          </div>
        </div>
        <BottomNavbar />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      paddingBottom: '80px', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
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
      <BottomNavbar />
    </div>
  );
}
