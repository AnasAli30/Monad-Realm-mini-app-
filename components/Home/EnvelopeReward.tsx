import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useAccount } from "wagmi";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { motion, AnimatePresence } from "framer-motion";
import { APP_URL } from "@/lib/constants";
import { fetchWithVerification } from "@/lib/leaderboard"; 
interface EnvelopeRewardProps {
  setClaimed: Dispatch<SetStateAction<boolean>>;
}

export function EnvelopeReward({ setClaimed }: EnvelopeRewardProps) {
   const { actions } = useMiniAppContext();
  const { isConnected, address } = useAccount();
  const { context } = useMiniAppContext();
  const fid = context?.user?.fid;
  const name = context?.user?.username;
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<number | null>(null);

  useEffect(() => {
    if (!fid) return;
    // Check localStorage first
    const claimedKey = `envelope-claimed-${fid}`;
    console.log(claimedKey)
    if (localStorage.getItem(claimedKey) === 'true') {
      setClaimed(true);
      setShowEnvelope(false);
      return;
    }
    if (isConnected && address && fid) {
      fetch("/api/check-envelope", {
        method: "POST",
        body: JSON.stringify({ fid }),
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.claimed) {
            setShowEnvelope(true);
          } else {
            setClaimed(true);
            setShowEnvelope(false);
            localStorage.setItem(claimedKey, 'true');
          }
        });
    }
  }, [isConnected, address, fid]);

  const openEnvelope = async () => {
    setIsOpening(true);
    const amount = +(Math.random() * (0.04 - 0.03) + 0.1).toFixed(4);
    setReward(amount);
    const res = await fetchWithVerification("/api/send-envelope", {
      method: "POST",
      body: JSON.stringify({ to: address, amount, fid, name }),
      headers: { "Content-Type": "application/json" },
    });

    setTimeout(() => {
       actions?.composeCast({
        text: `I just opened my envelope and got ${amount} MON! \n\n you can get 0.1-1 MON here`,
        embeds: [APP_URL],
      });
      setClaimed(true);
      setIsOpening(false);
      setShowEnvelope(false);
    }, 2000);

  };

  return (
    <AnimatePresence>
      {showEnvelope && (
        <motion.div
          className="envelope-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="envelope-container"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Close Button */}
          
            <div className="envelope-content">
              <p className="subtitle">Open your reward envelope to get started</p>
              {reward && (
                <motion.div
                  className="reward-container"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="reward-text">
                    🎁 You received <strong>{reward} MON</strong>!
                  </p>
                </motion.div>
              )}
             { !reward && <div className="envelope-image">
                <span className="envelope-emoji">✉️</span>
              </div>}
              <button 
                className="open-button"
                onClick={openEnvelope} 
                disabled={isOpening}
              >
                {isOpening ? "Sending mon..." : "Open Envelope"}
              </button>
           
            </div>
          </motion.div>

          <style jsx>{`
            .envelope-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.85); /* no quotes, semi-transparent */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(10px);
}

            .envelope-container {
              background: rgba(0, 0, 0, 0.8);
              border-radius: 24px;
              padding: 40px;
              width: 80%;
              height:70%;
              max-width: 400px;
              text-align: center;
              box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
              border: 2px solid rgba(255, 255, 255, 0.1);
            }

            .envelope-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 10px;
            }

            .title {
              font-size: 2rem;
              font-weight: 800;
              color: #fff;
              margin: 0;
              text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }

            .subtitle {
              font-size: 1rem;
              color: #e0d7ff;
              margin: 0;
              text-align: center;
            }

            .envelope-image {
              width: 200px;
              height: 200px;
              margin: 1px 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .envelope-emoji {
              font-size: 120px;
              animation: float 3s ease-in-out infinite;
            }

            @keyframes float {
              0% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-20px);
              }
              100% {
                transform: translateY(0px);
              }
            }

            .open-button {
              background: linear-gradient(90deg, #a084ee 0%, #6C5CE7 100%);
              color: white;
              border: none;
              padding: 16px 32px;
              font-size: 1.2rem;
              font-weight: 600;
              border-radius: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
              width: 100%;
              max-width: 300px;
              box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
            }

            .open-button:hover:not(:disabled) {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(108, 92, 231, 0.6);
            }

            .open-button:disabled {
              opacity: 0.7;
              cursor: not-allowed;
            }

            .reward-container {
              background: rgba(255, 255, 255, 0.1);
              padding: 16px 24px;
              border-radius: 12px;
              margin-top: 16px;
            }

            .reward-text {
              font-size: 1.4rem;
              color: #fff;
              margin: 0;
              font-weight: 600;
            }

            .reward-text strong {
              color: #ffe066;
            }
            .envelope-close-btn {
              position: absolute;
              top: 16px;
              right: 16px;
              background: none;
              border: none;
              color: #fff;
              font-size: 28px;
              cursor: pointer;
              z-index: 10;
              transition: color 0.2s;
            }
            .envelope-close-btn:hover {
              color: #FFD700;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
