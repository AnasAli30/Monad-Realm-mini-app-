// Shared reward logic for all games

export const rewardTypes = [ "YAKI", "CHOG", "USDC"] as const;
export type RewardToken = typeof rewardTypes[number];

export function getRandomValue(token: RewardToken): number {
  switch (token) {
    // case "MON":
    //   const monValues = [0.01, 0.03, 0.05, 0.07, 0.09];
    //   return monValues[Math.floor(Math.random() * monValues.length)];
    case "YAKI":
      return +(Math.random() * (30 - 10) + 0.5).toFixed(3);
    case "CHOG":
      return +(Math.random() * (3 - 0.01) + 0.01).toFixed(3);
    case "USDC":
      return +(Math.random() * (0.4 - 0.05) + 0.005).toFixed(4);
    default:
      return 0;
  }
}

export function getTokenAddress(token: RewardToken): string {
  switch (token) {
    case "USDC":
      return process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS as string;
    case "CHOG":
      return process.env.NEXT_PUBLIC_OWL_TOKEN_ADDRESS as string;
    case "YAKI":
      return process.env.NEXT_PUBLIC_YAKI_TOKEN_ADDRESS as string;
    // case "MON":
    //   return process.env.NEXT_PUBLIC_MON_TOKEN_ADDRESS as string;
    default:
      return "";
  }
}

export function getTokenDecimals(token: RewardToken): number {
  switch (token) {
    case "USDC":
      return 6;
    default:
      return 18;
  }
}

export function getTokenImage(token: RewardToken): string {
  switch (token) {
    // case "MON":
    //   return "/images/mon.png";
    case "USDC":
      return "/images/usdc.png";
    case "YAKI":
      return "/images/yaki.png";
    case "CHOG":
      return "/images/chog.png";
    default:
      return "/images/mon.png";
  }
} 