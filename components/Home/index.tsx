'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useFrame } from '@/components/farcaster-provider';
import { SafeAreaContainer } from '@/components/safe-area-container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad as faGamepadSolid, faCoins, faUsers, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useAccount, useSwitchChain } from 'wagmi';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { monadTestnet } from 'wagmi/chains';
import { EnvelopeReward } from './EnvelopeReward';

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

const LeaderboardLoadingBar = () => {
  const [progress, setProgress] = useState(0);
  // Get theme from Demo context (pass as prop or use window.localStorage fallback)
  let theme: 'light' | 'dark' = 'light';
  if (typeof window !== 'undefined') {
    theme = (localStorage.getItem('monad-theme') as 'light' | 'dark') || 'light';
  }
  const themeColors = {
    light: {
      background: 'linear-gradient(135deg, #f9f7f4 0%, #e8e6e3 100%)',
      text: '#3b82f6',
      bar: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
      barBg: 'rgba(0,0,0,0.05)',
    },
    dark: {
      background: 'linear-gradient(135deg, #23272f 0%, #181a20 100%)',
      text: '#FFD700',
      bar: 'linear-gradient(90deg, #FFD700, #7c65c1)',
      barBg: 'rgba(255,255,255,0.08)',
    },
  };
  const colors = themeColors[theme];
  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 800; // ms
    function animateBar(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const percent = Math.min(100, (elapsed / duration) * 100);
      setProgress(percent);
      if (percent < 100) {
        frame = requestAnimationFrame(animateBar);
      }
    }
    frame = requestAnimationFrame(animateBar);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: colors.background,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.text,
      transition: 'background 0.3s, color 0.3s',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: 4,
        width: '100%',
        background: colors.barBg,
        zIndex: 10,
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: colors.bar,
          transition: 'width 0.2s',
        }} />
      </div>
      <span style={{ color: colors.text, fontWeight: 600, fontSize: 18, opacity: 0.7 }}>Loading leaderboard...</span>
    </div>
  );
};

const Leaderboard = dynamic(() => import('@/components/Leaderboard'), {
  ssr: false,
  loading: LeaderboardLoadingBar
});

// ShareButton component
function ShareButton() {
  const shareUrl = 'https://monad-realm-mini-app.vercel.app';
  const shareText = 'Check out Monad Realm! \n\nPlay fun games on Farcaster.';
  const { actions } = useMiniAppContext();
  const handleShare = async () => {

      try {
        await actions?.composeCast({
          text: shareText,
          embeds: [shareUrl]
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  

  return (
    <div style={{
      position: 'relative',
      left: 0,
      right: 0,
      bottom: 0, // just above navbar
      margin: '40px 0px 30px 0px',

      display: 'flex',
      justifyContent: 'center',
      // zIndex: 1100,
      pointerEvents: 'none',
    }}>
      <button
        onClick={handleShare}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#7c65c1',
          color: 'white',
          border: 'none',
          borderRadius: '2rem',
          padding: '0.7rem 1.5rem',
          fontWeight: 600,
          fontSize: '1.1rem',
          boxShadow: '0 2px 8px rgba(124,101,193,0.15)',
          cursor: 'pointer',
          transition: 'background 0.2s',
          pointerEvents: 'auto',
        }}
      >
        {/* SVG Share Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="none" style={{display: 'inline-block', verticalAlign: 'middle'}}><rect width="256" height="256" rx="56" fill="#7C65C1"></rect><path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path></svg>
        Share
      </button>
    </div>
  );
}

export function Demo() {
  
  const { context } = useFrame();
  const [currentTab, setCurrentTab] = useState<'game' | 'earn' | 'pvp' | 'leaderboard'>('game');
  const [selectedGame, setSelectedGame] = useState<null | 'hop' | 'candy' | 'blaster'>(null);
  const { actions } = useMiniAppContext();
  const { switchChain } = useSwitchChain();
  const {isConnected,address} = useAccount()
  const [imagesLoaded, setImagesLoaded] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('monad-images-loaded') === 'true';
    }
    return false;
  });
  const [showEnvelopeReward, setShowEnvelopeReward] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [showEnvelope, setShowEnvelope] = useState(false);

  // THEME STATE
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('monad-theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('monad-theme', theme);
    }
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // Store user info to backend when game opens (once per session)
  useEffect(() => {
    switchChain({ chainId: monadTestnet.id })
    if (!context || !context.user || !address) return;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('user-info-sent') === 'true') return;

    const { fid, username, pfpUrl } = context.user;
    const userInfo = {
      fid,
      username,
      pfpUrl,
      walletAddress: address,
      name: username, // Default name to username
    };
    fetch('/api/userinfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userInfo),
    })
      .then(() => {
        sessionStorage.setItem('user-info-sent', 'true');
      })
      .catch((err) => {
        // Optionally handle error
        console.error('Failed to send user info:', err);
      });
  }, [context, address]);

  useEffect(()=>{
    
    actions?.addFrame()
  },[isConnected,context])

  useEffect(() => {
    async function checkEnvelope() {
      if (!isConnected || !context?.user?.fid) return;
      if (localStorage.getItem(`envelope-claimed-${context.user.fid}`) === 'true') return;
      const res = await fetch('/api/check-envelope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: context.user.fid })
      });
      const data = await res.json();
      if (!data.claimed) {
        setShowEnvelopeReward(true);
      }else{
        localStorage.setItem(`envelope-claimed-${context.user.fid}`, 'true');
        setClaimed(true);
      }
    }
    checkEnvelope();
  }, [isConnected, context?.user?.fid]);

  // useEffect(() => {
  //   fetch("/api/check-envelope")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       if (data && !data.claimed) {
  //         setShowEnvelope(true);
  //       }
  //     })
  //     .catch(() => {
  //       // Optionally handle error
  //     });
  // }, []);

  

  // Preload game images only if not already loaded
  useEffect(() => {
    if (imagesLoaded) return; // Skip if already loaded

    const gameImages = [
      '/images/hop.png',
      '/images/mona.png', 
      '/images/bouce.png'
    ];

    const preloadImage = (src: string) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
      });
    };

    Promise.all(gameImages.map(preloadImage))
      .then(() => {
        setImagesLoaded(true);
        sessionStorage.setItem('monad-images-loaded', 'true');
      })
      .catch((error) => {
        console.error('Failed to load images:', error);
        // Still show the page even if some images fail
        setImagesLoaded(true);
        sessionStorage.setItem('monad-images-loaded', 'true');
      });
  }, [imagesLoaded]);

  const handleStartJumpGame = () => {
    setCurrentTab('game');
  };

  const handleStartArcherGame = () => {
    setCurrentTab('game');
  };

  const handleStartCandyGame = () => {
    setCurrentTab('game');
  };

  const handleStartStoneShooterGame = () => {
    setCurrentTab('game');
  };

  // Show loading screen until all images are loaded
  // THEME COLORS
  const themeColors = {
    light: {
      background: 'linear-gradient(135deg, #f9f7f4 0%, #e8e6e3 100%)',
      cardBg: 'white',
      text: '#222',
      buttonBg: 'linear-gradient(90deg, #0371c3 0%, #0d8ce8 100%)',
      buttonText: 'white',
      navBg: 'white',
      navBorder: '1px solid rgba(255,255,255,0.1)',
    },
    dark: {
      background: 'linear-gradient(135deg, #23272f 0%, #181a20 100%)',
      cardBg: '#23272f',
      text: '#f9f7f4',
      buttonBg: 'linear-gradient(90deg, #23272f 0%, #3b82f6 100%)',
      buttonText: 'white',
      navBg: '#181a20',
      navBorder: '1px solid #23272f',
    },
  };
  const colors = themeColors[theme];

  if (!imagesLoaded) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div
          className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8"
          style={{
            background: colors.background,
            color: colors.text,
            width: '100vw',
            minHeight: '100vh',
            transition: 'background 0.3s, color 0.3s',
          }}
        >
          <h1 className="text-3xl font-bold text-center">
            Monad Realm
          </h1>
        </div>
        {/* THEME SCROLLBAR CSS */}
        <style jsx global>{`
          ::-webkit-scrollbar {
            width: 10px;
            background: ${theme === 'dark' ? '#181a20' : '#e8e6e3'};
          }
          ::-webkit-scrollbar-thumb {
            background: ${theme === 'dark' ? '#23272f' : '#cfcfcf'};
            border-radius: 8px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'dark' ? '#31343a' : '#bdbdbd'};
          }
          html {
            scrollbar-color: ${theme === 'dark' ? '#23272f #181a20' : '#cfcfcf #e8e6e3'};
            scrollbar-width: thin;
          }
        `}</style>
      </SafeAreaContainer>
    );
  }

  // THEME TOGGLE BUTTON
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: 10,
        right:20,
        zIndex: 2001,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 8,
        borderRadius: '50%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        backgroundColor: theme === 'dark' ? '#23272f' : 'white',
        transition: 'background 0.2s',
      }}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        // Moon icon
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 0 1 12.21 3a7 7 0 1 0 8.79 9.79z" stroke="#7c65c1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      ) : (
        // Sun icon
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="#FFD700" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/></svg>
      )}
    </button>
  );

  // Bottom Navigation Component
  const BottomNavbar = () => (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: colors.navBg,
      borderTop: colors.navBorder,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0px 0px',
      zIndex: 1000,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
    }}>
      <button
        onClick={() => setCurrentTab('game')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: currentTab === 'game' ? (theme === 'dark' ? '#3b82f6' : '#0371c3') : (theme === 'dark' ? '#aaa' : 'rgba(0,0,0,0.5)'),
          fontSize: currentTab === 'game' ? '20px' : '18px',
          fontWeight: currentTab === 'game' ? 'bold' : 'normal',
          cursor: 'pointer',
        }}
      >
        <FontAwesomeIcon icon={faGamepadSolid} size="lg" style={{ opacity: currentTab === 'game' ? 1 : 0.5 }} />
      </button>
      <button
        onClick={() => setCurrentTab('earn')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          opacity: 0.3,
          color: currentTab === 'earn' ? (theme === 'dark' ? '#FFD700' : '#FFD700') : (theme === 'dark' ? '#aaa' : 'rgba(0,0,0,0.5)'),
          fontSize: currentTab === 'earn' ? '20px' : '16px',
          fontWeight: currentTab === 'earn' ? 'bold' : 'normal',
          cursor: 'pointer',
        }}
      disabled>
        <FontAwesomeIcon icon={faCoins} size="lg" />
      </button>
      <button
        onClick={() => setCurrentTab('pvp')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          opacity: 0.3,
          color: currentTab === 'pvp' ? (theme === 'dark' ? '#8b16b1' : '#8b16b1') : (theme === 'dark' ? '#aaa' : 'rgba(0,0,0,0.5)'),
          fontSize: currentTab === 'pvp' ? '20px' : '16px',
          fontWeight: currentTab === 'pvp' ? 'bold' : 'normal',
          cursor: 'pointer',
        }}
      disabled>
        <FontAwesomeIcon icon={faUsers} size="lg" />
      </button>
      <button
        onClick={() => setCurrentTab('leaderboard')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: currentTab === 'leaderboard' ? (theme === 'dark' ? '#FFD700' : '#FFD700') : (theme === 'dark' ? '#aaa' : 'rgba(0,0,0,0.5)'),
          fontSize: currentTab === 'leaderboard' ? '20px' : '18px',
          fontWeight: currentTab === 'leaderboard' ? 'bold' : 'normal',
          cursor: 'pointer',
        }}
      >
        <FontAwesomeIcon icon={faTrophy} size="lg" />
      </button>
    </div>
  );

  // Replace currentView logic with currentTab for main content rendering as needed.
  if (selectedGame === 'hop') {
    return <VerticalJumperGame onBack={() => setSelectedGame(null)} />;
  }
  if (selectedGame === 'candy') {
    return <CandyCrushGame onBack={() => setSelectedGame(null)} />;
  }
  if (selectedGame === 'blaster') {
    return <StoneShooterGame onBack={() => setSelectedGame(null)} />;
  }

  if (currentTab === 'game') {
    return (
      <>
      {showEnvelopeReward &&
        <div style={{ position: 'fixed', top: 150, zIndex: 3000, background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(5px)',padding: '10px' ,borderRadius:'10px'}}> 
         <EnvelopeReward setClaimed={setClaimed} />
       </div> 
       }
      <div style={{ 
        paddingTop: '10px',
        minHeight: '100vh',
        minWidth: '100vw',
        padding: '30px 0px 60px 0px', 
        background: colors.background,
        color: colors.text,
        transition: 'background 0.3s, color 0.3s',
        position: 'relative',
        overflowX: 'hidden',
      }}>
        {/* Particle Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: 'float 4s ease-in-out infinite',
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 2}s`,
                opacity: 0.3
              }}
            />
          ))}
        </div>
        {/* Absolutely position the theme toggle at the top right, above all content */}
        {/* <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 3000 }}> */}
          <ThemeToggle />
        {/* </div> */}
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="text-center space-y-0 ">
            <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              {/* Hop Up Card */}
              <div>
                <button
                  onClick={() => setSelectedGame('hop')}
                  style={{
                    width: '20rem',
                    height: '13rem',
                    padding: '0',
                    marginTop: '0rem',
                    background: `url('/images/hop.png')`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center bottom',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    borderRadius: '1rem 1rem 0rem 0rem',
                    boxShadow: '0 15px 25px -5px rgba(0,0,0,0.2)',
                    transform: 'scale(1.08)',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    cursor: 'pointer',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
               
                </button>
                <div style={{ marginTop: 0,width:'100%',scale:'1.08' }}>
                  <button
                    onClick={() => setSelectedGame('hop')}
                    style={{
                      background: 'linear-gradient(90deg, #0371c3 0%, #0d8ce8 100%)',
                      color: 'white',
                      fontWeight: 'bold',
                      width:'100%',
                      fontSize: '1.1rem',
                      borderRadius: '0rem 0rem 1rem 1rem',
                      padding: '10px 36px',
                      border: 'none',
                      boxShadow: '0 2px 8px #0371c322',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Play now
                  </button>
                </div>
              </div>
              {/* MonaCrush Card */}
              <div>
                <button
                  onClick={() => setSelectedGame('candy')}
                  style={{
                    width: '22rem',
                    height: '11rem',
                    padding: '0',
                    background: `url('/images/mona.png')`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center bottom',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    borderRadius: '1rem 1rem 0rem 0rem',
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
                <div style={{  display: 'flex', justifyContent: 'center',width:"100%",scale:'1' }}>
                  <button
                    onClick={() => setSelectedGame('candy')}
                    style={{
                      background: 'linear-gradient(90deg, #aa1c15 0%, #d4251c 100%)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      borderRadius: '0rem 0rem 1rem 1rem',
                      width:'100%',
                      padding: '10px 36px',
                      border: 'none',
                      boxShadow: '0 2px 8px #aa1c1522',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Play now
                  </button>
                </div>
              </div>
              {/* Bounce Blaster Card */}
              <div>
                <button
                  onClick={() => setSelectedGame('blaster')}
                  style={{
                    width: '22rem',
                    height: '14rem',
                    padding: '0',
                    background: `url('/images/bouce.png')`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center bottom',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    borderRadius: '1rem 1rem 0rem 0rem',
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
                <div style={{ marginTop: 0, display: 'flex', justifyContent: 'center' , flexDirection:"column" }}>
                  <button
                    onClick={() => setSelectedGame('blaster')}
                    style={{
                      background: 'linear-gradient(90deg, #f9e7bc 0%, #f9e7bc 100%)',
                      color: 'black',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      borderRadius: '0rem 0rem 1rem 1rem',
                      padding: '10px 36px',
                      border: 'none',
                      boxShadow: '0 2px 8px #0371c322',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Play now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ShareButton />
        <BottomNavbar />
        {/* Particle CSS */}
        <style jsx>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-8px);
              opacity: 0.6;
            }
          }
        `}</style>
        {/* THEME SCROLLBAR CSS */}
        <style jsx global>{`
          ::-webkit-scrollbar {
            width: 10px;
            background: ${theme === 'dark' ? '#181a20' : '#e8e6e3'};
          }
          ::-webkit-scrollbar-thumb {
            background: ${theme === 'dark' ? '#23272f' : '#cfcfcf'};
            border-radius: 8px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'dark' ? '#31343a' : '#bdbdbd'};
          }
          html {
            scrollbar-color: ${theme === 'dark' ? '#23272f #181a20' : '#cfcfcf #e8e6e3'};
            scrollbar-width: thin;
          }
        `}</style>
      </div>
      </>
    );
  }

  if (currentTab === 'leaderboard') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        paddingBottom: '80px', 
        background: colors.background,
        color: colors.text,
        transition: 'background 0.3s, color 0.3s',
      }}>
        {/* <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 3000 }}>
          <ThemeToggle />
        </div> */}
        <Leaderboard />
        <ShareButton />
        <BottomNavbar />
        {/* THEME SCROLLBAR CSS */}
        <style jsx global>{`
          ::-webkit-scrollbar {
            width: 10px;
            background: ${theme === 'dark' ? '#181a20' : '#e8e6e3'};
          }
          ::-webkit-scrollbar-thumb {
            background: ${theme === 'dark' ? '#23272f' : '#cfcfcf'};
            border-radius: 8px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'dark' ? '#31343a' : '#bdbdbd'};
          }
          html {
            scrollbar-color: ${theme === 'dark' ? '#23272f #181a20' : '#cfcfcf #e8e6e3'};
            scrollbar-width: thin;
          }
        `}</style>
      </div>
    );
  }

  // Default to Games view (singlePlayer)
  return (
    <div style={{ 
      minHeight: '100vh', 
      paddingBottom: '80px', 
      background: colors.background,
      color: colors.text,
      transition: 'background 0.3s, color 0.3s',
    }}>
      <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 3000 }}>
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen flex-col items-center justify-center p-1 space-y-3">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Single Player Games</h1>
          
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
      <ShareButton />
      <BottomNavbar />
      {/* THEME SCROLLBAR CSS */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 10px;
          background: ${theme === 'dark' ? '#181a20' : '#e8e6e3'};
        }
        ::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#23272f' : '#cfcfcf'};
          border-radius: 8px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#31343a' : '#bdbdbd'};
        }
        html {
          scrollbar-color: ${theme === 'dark' ? '#23272f #181a20' : '#cfcfcf #e8e6e3'};
          scrollbar-width: thin;
        }
      `}</style>
    </div>
  );
}
