'use client'

import { Demo } from '@/components/Home'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import { useEffect, useState } from 'react';

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame();
  const [loadingProgress, setLoadingProgress] = useState(0);

  // THEME STATE (read from localStorage, fallback to light)
  let theme: 'light' | 'dark' = 'dark';
  if (typeof window !== 'undefined') {
    theme = (localStorage.getItem('monad-theme') as 'light' | 'dark') || 'dark';
  }
  const themeColors = {
    light: {
      background: 'linear-gradient(135deg, #f9f7f4 0%, #e8e6e3 100%)',
      text: '#222',
    },
    dark: {
      background: 'linear-gradient(135deg, #23272f 0%, #181a20 100%)',
      text: '#f9f7f4',
    },
  };
  const colors = themeColors[theme];

  // Loading progress animation
  useEffect(() => {
    if (!isLoading && isSDKLoaded) return;
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random increment between 5-20
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setLoadingProgress(Math.min(progress, 100));
    }, 200);

    return () => clearInterval(interval);
  }, [isLoading, isSDKLoaded]);

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-center">Monad Realm</h1>
          
          {/* Loading Progress Bar */}
          <div style={{
            width: '300px',
            maxWidth: '90vw',
            marginTop: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: colors.text,
                opacity: 0.8
              }}>
                {loadingProgress < 33 && 'Initializing...'}
                {loadingProgress >= 33 && loadingProgress < 66 && 'Loading SDK...'}
                {loadingProgress >= 66 && loadingProgress < 100 && 'Connecting...'}
                {loadingProgress === 100 && 'Ready!'}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.text
              }}>
                {Math.round(loadingProgress)}%
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div style={{
              width: '100%',
              height: '8px',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Progress Bar Fill */}
              <div style={{
                height: '100%',
                width: `${loadingProgress}%`,
                background: theme === 'dark' 
                  ? 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981)' 
                  : 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981)',
                borderRadius: '4px',
                transition: 'width 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Shimmer Effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                  animation: 'shimmer 2s infinite'
                }} />
              </div>
            </div>
            
            {/* Loading Steps */}
            <div style={{
              marginTop: '1rem',
              fontSize: '12px',
              color: colors.text,
              opacity: 0.7,
              textAlign: 'center'
            }}>
              {loadingProgress < 33 && 'Setting up your gaming experience...'}
              {loadingProgress >= 33 && loadingProgress < 66 && 'Loading game assets...'}
              {loadingProgress >= 66 && loadingProgress < 100 && 'Almost ready...'}
              {loadingProgress === 100 && 'Welcome to Monad Realm!'}
            </div>
          </div>
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
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}</style>
      </SafeAreaContainer>
    );
  }

  if (!isSDKLoaded) {
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
          <h1 className="text-3xl font-bold text-center">Monad Realm</h1>
          
          {/* Loading Progress Bar */}
          <div style={{
            width: '300px',
            maxWidth: '90vw',
            marginTop: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: colors.text,
                opacity: 0.8
              }}>
                {loadingProgress < 33 && 'Initializing...'}
                {loadingProgress >= 33 && loadingProgress < 66 && 'Loading SDK...'}
                {loadingProgress >= 66 && loadingProgress < 100 && 'Connecting...'}
                {loadingProgress === 100 && 'Ready!'}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.text
              }}>
                {Math.round(loadingProgress)}%
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div style={{
              width: '100%',
              height: '8px',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Progress Bar Fill */}
              <div style={{
                height: '100%',
                width: `${loadingProgress}%`,
                background: theme === 'dark' 
                  ? 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981)' 
                  : 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981)',
                borderRadius: '4px',
                transition: 'width 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Shimmer Effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                  animation: 'shimmer 2s infinite'
                }} />
              </div>
            </div>
            
            {/* Loading Steps */}
            <div style={{
              marginTop: '1rem',
              fontSize: '12px',
              color: colors.text,
              opacity: 0.7,
              textAlign: 'center'
            }}>
              {loadingProgress < 33 && 'Setting up your gaming experience...'}
              {loadingProgress >= 33 && loadingProgress < 66 && 'Loading game assets...'}
              {loadingProgress >= 66 && loadingProgress < 100 && 'Almost ready...'}
              {loadingProgress === 100 && 'Welcome to Monad Realm!'}
            </div>
          </div>
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
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}</style>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <Demo />
    </SafeAreaContainer>
  );
}
