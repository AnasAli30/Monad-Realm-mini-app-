'use client'


import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamic Loading Component
const DynamicLoader = ({ title, subtitle, description, background, textColor }: {
  title: string;
  subtitle: string;
  description: string;
  background: string;
  textColor: string;
}) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const stages = [
      { percent: 15, text: 'Loading assets...', delay: 200 },
      { percent: 35, text: 'Preparing graphics...', delay: 300 },
      { percent: 55, text: 'Setting up physics...', delay: 400 },
      { percent: 75, text: 'Configuring gameplay...', delay: 350 },
      { percent: 90, text: 'Finalizing...', delay: 250 },
      { percent: 100, text: 'Ready to play!', delay: 200 }
    ];

    let currentStage = 0;
    const animate = () => {
      if (currentStage < stages.length) {
        const stage = stages[currentStage];
        setLoadingText(stage.text);
        
        // Smooth progress animation
        const startProgress = progress;
        const targetProgress = stage.percent;
        const duration = stage.delay;
        const startTime = Date.now();
        
        const animateProgress = () => {
          const elapsed = Date.now() - startTime;
          const progressRatio = Math.min(elapsed / duration, 1);
          const currentProgress = startProgress + (targetProgress - startProgress) * progressRatio;
          
          setProgress(Math.floor(currentProgress));
          
          if (progressRatio < 1) {
            requestAnimationFrame(animateProgress);
          } else {
            currentStage++;
            setTimeout(animate, 100);
          }
        };
        
        animateProgress();
      }
    };

    setTimeout(animate, 100);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{ textAlign: 'center', color: textColor }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          {title}
        </h1>
      
        
        {/* Progress Container */}
        <div style={{ 
          width: '350px', 
          margin: '0 auto 1rem',
          padding: '20px',
          // backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          // border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {/* Percentage Display */}
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            color: textColor
          }}>
            {progress}%
          </div>
          
          {/* Progress Bar */}
          <div style={{ 
            width: '100%', 
            height: '12px', 
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '6px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{ 
              width: `${progress}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)',
              borderRadius: '6px',
              transition: 'width 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Animated shine effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shine 2s infinite'
              }}></div>
            </div>
          </div>
          
          {/* Loading Status Text */}
          <div style={{ 
            fontSize: '0.9rem', 
            marginTop: '10px',
            color: textColor,
            opacity: 0.8
          }}>
            {loadingText}
          </div>
        </div>
        
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>{description}</p>
      </div>
      
      <style jsx>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

const VerticalJumperGame = dynamic(() => import('@/components/Home/VerticalJumperGame'), { 
  ssr: false,
  loading: () => (
    <DynamicLoader 
      title="Hop Up"
      subtitle=""
      description=""
      background="#46a6ce"
      textColor="white"
    />
  )
});

const CandyCrushGame = dynamic(() => import('@/components/Home/CandyCrushGame'), { 
  ssr: false,
  loading: () => (
    <DynamicLoader 
      title="MonaCrush"
      subtitle="Loading game..."
      description=""
      background="radial-gradient(circle at center, #ff69b4 0%, #ffffff 100%)"
      textColor="#ffffff"
    />
  )
});

const StoneShooterGame = dynamic(() => import('@/components/Home/StoneShooterGame'), { 
  ssr: false,
  loading: () => (
    <DynamicLoader 
      title="Bounce Blaster"
      subtitle=""
      description=""
      background="linear-gradient(180deg, #001122 0%, #f9f7f4 100%)"
      textColor="#ffffff"
    />
  )
});

const Leaderboard = dynamic(() => import('@/components/Leaderboard'), { ssr: false });

export function Demo() {
  const [currentView, setCurrentView] = useState<'singlePlayer' | 'jumpGame' | 'archerGame' | 'candyGame' | 'stoneShooterGame' | 'leaderboard'>('singlePlayer');

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
      height: '64px',
      background: 'white',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      padding: '0 10px',
      zIndex: 1000,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
    }}>

      
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
          padding: '0px 16px',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          transform: currentView === 'singlePlayer' ? 'translateY(-2px)' : 'none'
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎮</div>
       
      </button>
      
      
      
      <button
        disabled
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '12px',
          fontWeight: 'normal',
          cursor: 'not-allowed',
          padding: '0px 16px',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          opacity: 0.6
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '4px' }}>💰</div>
        
      </button>
      
      <button
        disabled
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '12px',
          fontWeight: 'normal',
          cursor: 'not-allowed',
          padding: '0px 16px',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          opacity: 0.6
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚔️</div>
       
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
          padding: '0px 16px',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          transform: currentView === 'leaderboard' ? 'translateY(-2px)' : 'none'
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏆</div>
      
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
        background: 'linear-gradient(135deg, #f9f7f4 0%, #e8e6e3 100%)'
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
        background: 'linear-gradient(135deg, #f9f7f4 0%, #e8e6e3 100%)'
      }}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <div className="text-center space-y-6">
            
            <div className="space-y-6">
              <button
                onClick={handleStartJumpGame}
                style={{
                  width: '20rem',
                  height: '13rem',
                  padding: '1.5rem 2rem',
                  background: `url('/images/hop.png')`,
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center bottom',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  borderRadius: '1rem',
                  boxShadow: '0 15px 25px -5px rgba(0,0,0,0.2)',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  cursor: 'pointer',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
             
              >
                 {/* Hop Up */}
              </button>
              
              <button
                onClick={handleStartCandyGame}
                style={{
                  width: '20rem',
                  height: '11rem',
                  padding: '1.5rem 2rem',
                  background: `url('/images/mona.png')`,
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center bottom',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  borderRadius: '1rem',
                  boxShadow: '0 15px 25px -5px rgba(0,0,0,0.2)',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  cursor: 'pointer',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
          
              >
                
              </button>
              
              <button
                onClick={handleStartStoneShooterGame}
                style={{
                  width: '20rem',
                  height: '14rem',
                  padding: '1.5rem 2rem',
                  background: `url('/images/bouce.png')`,
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center bottom',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  borderRadius: '1rem',
                  boxShadow: '0 15px 25px -5px rgba(0,0,0,0.2)',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  cursor: 'pointer',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
              </button>
            </div>
          </div>
        </div>
        <BottomNavbar />
      </div>
    );
  }

  // Default to Games view (singlePlayer)
  return (
    <div style={{ 
      minHeight: '100vh', 
      paddingBottom: '80px', 
      background: 'linear-gradient(135deg, #f9f7f4 0%, #e8e6e3 100%)'
    }}>
      <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Single Player Games</h1>
          
          <div className="space-y-4">
            <button
              onClick={handleStartJumpGame}
              style={{
                width: '16rem',
                padding: '1rem 2rem',
                background: 'linear-gradient(90deg, #0371c3 0%, #0d8ce8 100%)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                transform: 'scale(1)',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = 'linear-gradient(90deg, #025ba1 0%, #0b7acc 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(90deg, #0371c3 0%, #0d8ce8 100%)';
              }}
            >
              🎮 Hop Up
            </button>
            
            <button
              onClick={handleStartCandyGame}
              style={{
                width: '16rem',
                padding: '1rem 2rem',
                background: 'linear-gradient(90deg, #aa1c15 0%, #d4251c 100%)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                transform: 'scale(1)',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = 'linear-gradient(90deg, #8b1611 0%, #b01f18 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(90deg, #aa1c15 0%, #d4251c 100%)';
              }}
            >
              🍭 MonaCrush
            </button>
            
            <button
              onClick={handleStartStoneShooterGame}
              style={{
                width: '16rem',
                padding: '1rem 2rem',
                background: 'linear-gradient(90deg, #0371c3 0%, #aa1c15 100%)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                transform: 'scale(1)',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = 'linear-gradient(90deg, #025ba1 0%, #8b1611 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'linear-gradient(90deg, #0371c3 0%, #aa1c15 100%)';
              }}
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
