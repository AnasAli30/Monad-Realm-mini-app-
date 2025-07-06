import { Metadata } from "next";
import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'

export async function generateMetadata({ searchParams }: { searchParams?: Record<string, string> }): Promise<Metadata> {
  const { score, time, userImg, username, gameType } = searchParams || {};
  
  // Default image and frame
  let imageUrl = `${APP_URL}/images/feed.png`;
  let title = 'Monad Realm';
  let description = 'pvp game on monad';

  // If we have game score data, generate dynamic image
  if (score && time && gameType) {
    const params = new URLSearchParams({
      score,
      time,
      gameType,
      ...(userImg && { userImg }),
      ...(username && { username }),
    });
    
    imageUrl = `${APP_URL}/api/og-image?${params.toString()}`;
    

  }

  const frame = {
    version: 'next',
    imageUrl,
    button: {
      title: 'Play Game',
      action: {
        type: 'launch_frame',
        name: 'Monad Realm',
        url: APP_URL,
        splashImageUrl: `${APP_URL}/images/splash.png`,
        splashBackgroundColor: '#f7f7f7',
      },
    },
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}
