'use client'

import { Demo } from '@/components/Home'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import { useEffect, useState } from 'react';

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame();

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

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <Demo />
    </SafeAreaContainer>
  );
}
