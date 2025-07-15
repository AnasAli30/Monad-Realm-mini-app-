import React, { useState, useEffect } from 'react';
// ConfettiExplosion is a placeholder import; user must install the package: pnpm add react-confetti-explosion
// @ts-ignore
import ConfettiExplosion from 'react-confetti-explosion';

interface GiftRewardModalProps {
  open: boolean;
  onClose: () => void;
  rewardType: string; // e.g. 'MON', 'USDC'
  amount: number;
  tokenIcon?: React.ReactNode; // Optional: custom icon
  onClaim?: () => Promise<void> | void; // Optional: claim handler
  claimSuccess?: boolean;
  claimError?: string | null;
  txHash?: string;
  tokenImg?: string; // New prop for token image URL
  onShare?: () => void; // New prop for share button
}

export const GiftRewardModal: React.FC<GiftRewardModalProps> = ({ open, onClose, rewardType, amount, tokenIcon, tokenImg, onClaim, claimSuccess = false, claimError = null, txHash, onShare }) => {
  // All hooks must be before any return
  const [opened, setOpened] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (claimSuccess) {
      onShare?.();
    }
  }, [claimSuccess]);

  if (!open) return null;

  // Handler for claim button
  const handleClaim = async () => {
    if (!onClaim) {
      onClose();
      return;
    }
    setClaiming(true);
    try {
      await onClaim();
    } finally {
      setClaiming(false);
    }
  };

  // Block explorer link (Etherscan for mainnet, or testnet explorer)
  const explorerBase = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'https://explorer.monad.xyz/tx/';
  const txUrl = txHash ? `${explorerBase}${txHash}` : null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.6)',
      zIndex: 3000,
      display: open ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Cancel/Close Icon at top right */}
   
      {/* Modal content */}
      <div style={{
        position: 'relative',
        background: 'transparent',
        borderRadius: 16,
        padding: 32,
        minWidth: 320,
        maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Step 1: Show gift box, wait for user click */}
        {!opened && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
              marginBottom: 60,
              cursor: 'pointer',
              textAlign: 'center',
              width: 400,
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setOpened(true)}
          >
            {/* Glowing animated shadow */}
            <div style={{
              position: 'absolute',
              top: 110,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 32,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ffe066 0%, #eab308 60%, transparent 100%)',
              filter: 'blur(8px)',
              opacity: 0.7,
              zIndex: 0,
              animation: 'glowPulse 1.6s infinite alternate',
            }} />
            {/* Sparkle effect */}
            <div style={{ position: 'absolute', left: 20, top: 20, zIndex: 3, pointerEvents: 'none' }}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <g opacity="0.7">
                  <circle cx="16" cy="16" r="2" fill="#fffbe7" />
                  <path d="M16 8v-4M16 28v-4M8 16h-4M28 16h-4" stroke="#ffe066" strokeWidth="2" strokeLinecap="round" />
                </g>
              </svg>
            </div>
            <div style={{ position: 'absolute', right: 20, top: 40, zIndex: 3, pointerEvents: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 20 20">
                <g opacity="0.5">
                  <circle cx="10" cy="10" r="1.2" fill="#fffbe7" />
                  <path d="M10 4v-2M10 18v-2M4 10h-2M18 10h-2" stroke="#ffe066" strokeWidth="1.2" strokeLinecap="round" />
                </g>
              </svg>
            </div>
            {/* Floating animation for the box */}
            <div style={{
              animation: 'floatBox 2.2s ease-in-out infinite alternate',
              zIndex: 2,
              position: 'relative',
            }}>
              <svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block', margin: '0 auto' }}
              >
                {/* Box base shadow */}
                <ellipse cx="70" cy="120" rx="44" ry="10" fill="#000" opacity="0.12" />
                {/* Box base with gradient */}
                <rect x="26" y="60" width="88" height="54" rx="14" fill="url(#boxGradient)" stroke="#eab308" strokeWidth="4" filter="url(#shadow)" />
                {/* Box lid with gradient */}
                <rect x="36" y="36" width="68" height="32" rx="10" fill="url(#lidGradient)" stroke="#fff" strokeWidth="4" />
                {/* Vertical ribbon with gradient */}
                <rect x="66" y="36" width="8" height="78" rx="4" fill="url(#ribbonGradient)" />
                {/* Horizontal ribbon on lid with gradient */}
                <rect x="36" y="50" width="68" height="8" rx="4" fill="url(#ribbonGradient)" />
                {/* Bow left with highlight */}
                <ellipse cx="60" cy="36" rx="12" ry="8" fill="url(#bowGradient)" stroke="#fff" strokeWidth="2" />
                {/* Bow right with highlight */}
                <ellipse cx="80" cy="36" rx="12" ry="8" fill="url(#bowGradient)" stroke="#fff" strokeWidth="2" />
                {/* Bow knot with highlight */}
                <circle cx="70" cy="36" r="6" fill="url(#knotGradient)" stroke="#fff" strokeWidth="2" />
                {/* Box highlight */}
                <rect x="36" y="70" width="68" height="10" rx="5" fill="#fff" opacity="0.18" />
                {/* Lid highlight */}
                <rect x="46" y="40" width="48" height="6" rx="3" fill="#fff" opacity="0.22" />
                <defs>
                  <linearGradient id="boxGradient" x1="26" y1="60" x2="114" y2="114" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fffbe7" />
                    <stop offset="1" stopColor="#eab308" />
                  </linearGradient>
                  <linearGradient id="lidGradient" x1="36" y1="36" x2="104" y2="68" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffe066" />
                    <stop offset="1" stopColor="#eab308" />
                  </linearGradient>
                  <linearGradient id="ribbonGradient" x1="66" y1="36" x2="74" y2="114" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fca5a5" />
                    <stop offset="1" stopColor="#f87171" />
                  </linearGradient>
                  <linearGradient id="bowGradient" x1="48" y1="28" x2="92" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fff" />
                    <stop offset="0.3" stopColor="#fca5a5" />
                    <stop offset="1" stopColor="#f87171" />
                  </linearGradient>
                  <linearGradient id="knotGradient" x1="64" y1="30" x2="76" y2="42" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fffbe7" />
                    <stop offset="1" stopColor="#eab308" />
                  </linearGradient>
                  <filter id="shadow" x="0" y="60" width="140" height="60" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.10" />
                  </filter>
                </defs>
              </svg>
            </div>
            <div style={{ marginTop: 32, fontSize: 22, color: '#fff', fontWeight: 700, textShadow: '0 2px 12px #eab308, 0 2px 8px #0008', letterSpacing: 1 }}>
              🎉 Tap to open your gift!🎉
            </div>
          </div>
        )}
        {/* Step 2: Show reward and confetti after box is opened */}
        {opened && (
          <>
            {/* Confetti explosion */}
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
              <ConfettiExplosion force={0.7} duration={3000} particleCount={120} width={1200} height={900} zIndex={10000} />
            </div>
               <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 24,
          right: 20,
          background: 'transparent',
          border: 'none',
          fontSize: 40,
          color: '#000',
          cursor: 'pointer',
          zIndex: 3100,
        }}
        aria-label="Close"
      >
        ×
      </button>
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 16,
              padding: '32px 40px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              textAlign: 'center',
              zIndex: 4,
              minWidth: 260,
              animation: 'popIn 0.5s cubic-bezier(.68,-0.55,.27,1.55)',
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#eab308', marginBottom: 12 }}>🎁 Congratulations!</div>
              <div style={{ fontSize: 20, color: '#222', marginBottom: 16 }}>You won a reward:</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                {tokenImg && <img src={tokenImg} alt={rewardType} style={{ width: 40, height: 40, borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px #eab30833' }} />}
                <span style={{fontSize: 24,color: '#16a34a'}}>{amount} {rewardType}</span>
              </div>
              {/* Claiming/loading state */}
              {!claimSuccess && !claimError && claiming && (
                <div style={{ marginTop: 24, color: '#888', fontSize: 18 }}>
                  <span className="spinner" style={{ marginRight: 8, display: 'inline-block', width: 20, height: 20, border: '3px solid #eab308', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Claiming reward...
                </div>
              )}
              {/* Success state */}
              {claimSuccess && !claimError && (
                <div style={{ color: '#16a34a', marginTop: 16, fontSize: 18, fontWeight: 600 }}>
                  ✅ Claimed! Enjoy your reward.
                  {txUrl && (
                    <div style={{ marginTop: 8 }}>
                      <a href={txUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontSize: 15 }}>
                        View Transaction ↗
                      </a>
                    </div>
                  )}
                </div>
              )} 
              {/* Share button */}
              <button
                onClick={onShare}
                style={{
                  marginTop: 18,
                  fontSize: 17,
                  fontWeight: 600,
                  background: '#7C65C1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 28px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #7C65C122',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="none" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: 8}}><rect width="256" height="256" rx="56" fill="#7C65C1"></rect><path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path></svg>
                Share my reward
              </button>
              {/* Claim button, only show if not claimed and not error */}
              {!claimSuccess && !claimError && (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  style={{
                    marginTop: 28,
                    fontSize: 20,
                    fontWeight: 700,
                    background: '#eab308',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 32px',
                    cursor: claiming ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px #eab30844',
                    opacity: claiming ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {claiming ? 'Claiming...' : 'Claim Reward'}
                </button>
              )}
              {/* Close button, only show after claim or error */}
              {(claimSuccess || claimError) && (
                <button
                  onClick={onClose}
                  style={{
                    marginTop: 18,
                    fontSize: 17,
                    fontWeight: 600,
                    background: '#fff',
                    color: '#eab308',
                    border: '2px solid #eab308',
                    borderRadius: 8,
                    padding: '8px 28px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px #eab30822',
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </>
        )}
        {/* CSS Animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popIn {
            0% { transform: scale(0.7); opacity: 0; }
            80% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes lidPop {
            0% { transform: translateY(0); }
            60% { transform: translateY(-40px) rotate(-10deg); }
            100% { transform: translateY(-60px) rotate(-15deg); opacity: 0; }
          }
          @keyframes glowPulse {
            0% { opacity: 0.7; filter: blur(8px); }
            100% { opacity: 1; filter: blur(16px); }
          }
          @keyframes floatBox {
            0% { transform: translateY(0); }
            100% { transform: translateY(-18px); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default GiftRewardModal; 