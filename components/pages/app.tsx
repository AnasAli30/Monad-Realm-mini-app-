'use client'

import { Demo } from '@/components/Home'
import { APP_URL } from '@/lib/constants';
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import sdk from '@farcaster/frame-sdk';
import { useEffect, useState } from 'react';

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame();
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);

  useEffect(() => {
    sdk.isInMiniApp().then(setIsMiniApp);
  }, []);

  if (isLoading || isMiniApp === null) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center">Monad Realm</h1>
        </div>
      </SafeAreaContainer>
    );
  }

  if (!isMiniApp) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center">Monad Realm</h1>
          <a
            href={`https://farcaster.xyz/~/mini-apps/launch?domain=monad-realm-mini-app.vercel.app`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-[#7C65C1] text-white font-bold text-lg shadow-md hover:bg-[#6a54b0] transition"
          >
            Open in Farcaster
          </a>
        </div>
      </SafeAreaContainer>
    );
  }

  if (!isSDKLoaded) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center">Monad Realm</h1>
        </div>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <Demo />
    </SafeAreaContainer>
  );
}
