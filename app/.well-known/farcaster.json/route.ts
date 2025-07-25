import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
 "accountAssociation": {
    "header": "eyJmaWQiOjI0OTcwMiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweGU2Q2ZkQWY3NGJGRUMwMEZhZmRFOTcyNEE0NmNiMDUyNTQ4Qzg0ODgifQ",
    "payload": "eyJkb21haW4iOiJtb25hZC1yZWFsbS1taW5pLWFwcC52ZXJjZWwuYXBwIn0",
    "signature": "nt1YRlYCGJ0Ds1FMB97OFboZCWBMYhWLy1nqykL9bk0guTJZWdn/+mBBKtkd1AipjkC7/A8Rr1NV2M1ETjxGkxs="
  },
    frame: {
      version: "1",
      name: "Monad Realm",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "games","playtoearn"],
      primaryCategory: "games",
      buttonTitle: "Play Now",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
      subtitle: "Monad Realm",
      description: "Play and Earn",
      tagline:"Play and Earn",
      ogTitle:"Monad Realm",
      ogDescription: "Play and Earn",
      ogImageUrl: `${APP_URL}/images/feed.png`,
      heroImageUrl: `${APP_URL}/images/feed.png`,
      requiredChains: ["eip155:10143"],
    },
  };

  return NextResponse.json(farcasterConfig);
}
