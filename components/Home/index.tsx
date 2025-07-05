'use client'


import dynamic from 'next/dynamic';
import { useState } from 'react';

const VerticalJumperGame = dynamic(() => import('@/components/Home/VerticalJumperGame'), { ssr: false });
const CandyCrushGame = dynamic(() => import('@/components/Home/CandyCrushGame'), { ssr: false });
const StoneShooterGame = dynamic(() => import('@/components/Home/StoneShooterGame'), { ssr: false });
const Leaderboard = dynamic(() => import('@/components/Leaderboard'), { ssr: false });

export function Demo() {
  const [currentView, setCurrentView] = useState<'menu' | 'singlePlayer' | 'loading' | 'jumpGame' | 'archerGame' | 'candyGame' | 'stoneShooterGame' | 'leaderboard'>('menu');
  const [loadingGameType, setLoadingGameType] = useState<'jump' | 'archer' | 'candy' | 'stoneShooter'>('jump');

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

  const handleStartStoneShooterGame = () => {
    setLoadingGameType('stoneShooter');
    setCurrentView('loading');
    // Simulate game loading time
    setTimeout(() => {
      setCurrentView('stoneShooterGame');
    }, 2000); // 2 seconds loading time
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

  if (currentView === 'loading') {
    // Candy-themed loading screen
    if (loadingGameType === 'candy') {
      return (
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
              Preparing your Moland adventure...
            </p>
            
            {/* Moland Loading Animation */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '15px',
              marginBottom: '2rem'
            }}>
              {Array.from({ length: 6 }, (_, index) => (
                <img
                  key={index}
                  src="/candy/molandakita.png"
                  alt="Moland"
                  style={{
                    width: '40px',
                    height: '40px',
                    animation: `bounce 1.5s ease-in-out ${index * 0.2}s infinite`
                  }}
                />
              ))}
            </div>
            
            {/* Progress Bar */}
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
            
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>Loading Moland and preparing challenges...</p>
          </div>
          
          {/* Add CSS animations */}
          <style jsx>{`
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { 
                transform: translateY(0); 
              }
              40% { 
                transform: translateY(-10px); 
              }
              60% { 
                transform: translateY(-5px); 
              }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
      );
    }
    
    // Bounce Blaster loading screen
    if (loadingGameType === 'stoneShooter') {
      return (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              Loading weapons and targets...
            </p>
            
            {/* Progress Bar */}
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
            
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>Preparing physics and bouncing mechanics...</p>
          </div>
          
          {/* Add CSS animations */}
          <style jsx>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
      );
    }
    
    // Default loading screen for other games
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
            {loadingGameType === 'jump' ? 'Monad Jump' : 
             loadingGameType === 'archer' ? 'Stickman Archer' : 
             loadingGameType === 'stoneShooter' ? 'Bounce Blaster' : 'Game'}
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#6b7280' }}>
            {loadingGameType === 'jump' ? 'Initializing jumping game...' : 
             loadingGameType === 'archer' ? 'Preparing your bow and arrows...' : 
             loadingGameType === 'stoneShooter' ? 'Loading weapons and targets...' : 'Loading game...'}
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
        
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
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
