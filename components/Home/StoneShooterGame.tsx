'use client'
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Phaser from 'phaser';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { APP_URL } from '@/lib/constants';
import { submitScore, getPlayerData, fetchWithVerification } from '@/lib/leaderboard';
import GiftRewardModal from '../GiftRewardModal';
import ConfirmEndGameModal from '../ConfirmEndGameModal';
import { getRandomValue, getTokenAddress, getTokenDecimals, getTokenImage, rewardTypes, RewardToken } from '@/lib/rewards';
import { useContractWrite, useAccount, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';
import { monadTestnet } from 'wagmi/chains';

interface StoneShooterGameProps {
  onBack?: () => void;
}

export default function StoneShooterGame({ onBack }: StoneShooterGameProps) {
  const { context, actions } = useMiniAppContext();
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [showRestartBtn, setShowRestartBtn] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [gameReady, setGameReady] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverData, setGameOverData] = useState({ 
    score: 0, 
    time: '00:00', 
    bestScore: 0, 
    previousBestScore: 0,
    stonesDestroyed: 0,
    playerHits: 0 
  });
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showPermissionBtn, setShowPermissionBtn] = useState(false);
  const tiltXRef = useRef(0);
  const [controlMode, setControlMode] = useState<'tilt' | 'button' | null>(null);
  const buttonDirectionRef = useRef<0 | -1 | 1>(0);
  const { address } = useAccount();
  const { switchChain } = useSwitchChain();
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [claimedReward, setClaimedReward] = useState<{ type: RewardToken, amount: number } | null>(null);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('stoneShooterMaxScore') || '0'));
  const [previousBestScore, setPreviousBestScore] = useState(() => parseInt(localStorage.getItem('stoneShooterMaxScore') || '0'));
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const { writeContract, data: claimData, isSuccess: claimSuccess, isError: claimError, error: claimErrorObj, reset: resetClaim } = useContractWrite();
  const { isLoading: isClaiming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ hash: claimData });
  // Add state for blockchain submission status
  const [showSubmitScoreStatus, setShowSubmitScoreStatus] = useState(false);
  const { writeContract: writeSubmitScore, data: submitScoreTx, isSuccess: submitScoreSuccess, isError: submitScoreError, error: submitScoreErrorObj, reset: resetSubmitScore } = useContractWrite();

  // --- Touch/Mouse controls for button mode ---
  useEffect(() => {
    if (controlMode !== 'button') return;
    const el = gameRef.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length > 0) {
        const x = e.touches[0].clientX;
        if (x < window.innerWidth / 2) {
          buttonDirectionRef.current = -1;
        } else {
          buttonDirectionRef.current = 1;
        }
      }
    }
    function handleTouchEnd() {
      buttonDirectionRef.current = 0;
    }
    function handleMouseDown(e: MouseEvent) {
      const x = e.clientX;
      if (x < window.innerWidth / 2) {
        buttonDirectionRef.current = -1;
      } else {
        buttonDirectionRef.current = 1;
      }
    }
    function handleMouseUp() {
      buttonDirectionRef.current = 0;
    }
    el.addEventListener('touchstart', handleTouchStart as EventListener);
    el.addEventListener('touchend', handleTouchEnd as EventListener);
    el.addEventListener('mousedown', handleMouseDown as EventListener);
    el.addEventListener('mouseup', handleMouseUp as EventListener);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart as EventListener);
      el.removeEventListener('touchend', handleTouchEnd as EventListener);
      el.removeEventListener('mousedown', handleMouseDown as EventListener);
      el.removeEventListener('mouseup', handleMouseUp as EventListener);
    };
  }, [controlMode, gameKey]);

  // Score counting animation
  useEffect(() => {
    if (gameOverData.score > 0 && gameOver) {
      setAnimatedScore(0);
      const targetScore = gameOverData.score;
      const duration = 2000; // 2 seconds animation
      const steps = 60; // 60 steps for smooth animation
      const increment = targetScore / steps;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setAnimatedScore(targetScore);
          clearInterval(timer);
        } else {
          setAnimatedScore(Math.floor(increment * currentStep));
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }
  }, [gameOverData.score, gameOver]);

  useEffect(() => {
    // Device orientation event handler
    function handleOrientation(event: DeviceOrientationEvent) {
      tiltXRef.current = event.gamma ?? 0;
    }
    window.addEventListener('deviceorientation', handleOrientation, true);

    // iOS permission check
    if (
      typeof window !== 'undefined' &&
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      setShowPermissionBtn(true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // iOS permission request
  function requestOrientationPermission() {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      (DeviceOrientationEvent as any).requestPermission().then((response: string) => {
        if (response === 'granted') {
          setShowPermissionBtn(false);
        }
      });
    }
  }

  // Restart game handler
  const handleRestart = () => {
    setShowRestartBtn(false);
    setGameReady(false);
    setGameOver(false);
    setGameOverData({ score: 0, time: '00:00', bestScore: 0, previousBestScore: 0, stonesDestroyed: 0, playerHits: 0 });
    setAnimatedScore(0);
    setPreviousBestScore(parseInt(localStorage.getItem('stoneShooterMaxScore') || '0'));
    // Reset tilt controls
    tiltXRef.current = 0;
    phaserGameRef.current?.destroy(true);
    phaserGameRef.current = null;
    setGameKey((k) => k + 1);
  };

  useEffect(() => {
    if (!gameRef.current) return;
    if (phaserGameRef.current) return;

    let player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    let stones: Phaser.Physics.Arcade.Group;
    let projectiles: Phaser.Physics.Arcade.Group;
    let powerUps: Phaser.Physics.Arcade.Group;
    let score = 0;
    let stonesDestroyed = 0;
    let playerHits = 0;
    let gameStartTime = Date.now();
    let gameTimer = 0;
    let gameOver = false;
    
    // Power-up system variables
    let shieldActive = false;
    let laserActive = false;
    let freezeActive = false;
    let multishotActive = false;
    let shieldTimer = 0;
    let laserTimer = 0;
    let laserBeamCooldown = 0;
    let freezeTimer = 0;
    let multishotTimer = 0;

    let scoreText: Phaser.GameObjects.Text;
    let healthHearts: Phaser.GameObjects.Text[] = [];
    let powerUpText: Phaser.GameObjects.Text;
    let shieldBarrier: Phaser.GameObjects.Graphics;
    let laserBeam: Phaser.GameObjects.Graphics;
    // let gameOverText: Phaser.GameObjects.Text;
    let gameOverOverlay: Phaser.GameObjects.Graphics;

    function preload(this: Phaser.Scene) {
      // Create simple colored rectangles for game objects
      this.load.image('background', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
      
      // Load player images from shoot folder
      this.load.image('player', '/shoot/player.png');
      this.load.image('player-left', '/shoot/player-left.png');
      
      // Create power-up sprites
      const powerUpGraphics = this.add.graphics();
      
      // Shield power-up (blue circle with shield icon)
      powerUpGraphics.fillStyle(0x0066ff);
      powerUpGraphics.fillCircle(15, 15, 15);
      powerUpGraphics.fillStyle(0xffffff);
      powerUpGraphics.fillRect(8, 8, 14, 14);
      powerUpGraphics.fillStyle(0x0066ff);
      powerUpGraphics.fillRect(10, 10, 10, 10);
      powerUpGraphics.generateTexture('powerup-shield', 30, 30);
      powerUpGraphics.clear();
      
      // Laser power-up (red circle with lightning bolt)
      powerUpGraphics.fillStyle(0xff0000);
      powerUpGraphics.fillCircle(15, 15, 15);
      powerUpGraphics.fillStyle(0xffff00);
      powerUpGraphics.fillRect(12, 5, 6, 20);
      powerUpGraphics.fillTriangle(10, 12, 18, 12, 14, 18);
      powerUpGraphics.generateTexture('powerup-laser', 30, 30);
      powerUpGraphics.clear();
      
      // Freeze power-up (cyan circle with snowflake)
      powerUpGraphics.fillStyle(0x00ffff);
      powerUpGraphics.fillCircle(15, 15, 15);
      powerUpGraphics.fillStyle(0xffffff);
      powerUpGraphics.fillRect(14, 8, 2, 14);
      powerUpGraphics.fillRect(8, 14, 14, 2);
      powerUpGraphics.fillRect(11, 11, 8, 8);
      powerUpGraphics.generateTexture('powerup-freeze', 30, 30);
      powerUpGraphics.clear();
      
      // Multishot power-up (orange circle with triple arrows)
      powerUpGraphics.fillStyle(0xff8800);
      powerUpGraphics.fillCircle(15, 15, 15);
      powerUpGraphics.fillStyle(0xffffff);
      powerUpGraphics.fillTriangle(15, 8, 12, 14, 18, 14);
      powerUpGraphics.fillTriangle(10, 12, 7, 18, 13, 18);
      powerUpGraphics.fillTriangle(20, 12, 17, 18, 23, 18);
      powerUpGraphics.generateTexture('powerup-multishot', 30, 30);
      powerUpGraphics.clear();
      
      // Heart power-up (pink heart)
      powerUpGraphics.fillStyle(0xff1493);
      powerUpGraphics.fillCircle(15, 15, 15);
      powerUpGraphics.fillStyle(0xff69b4);
      // Heart shape
      powerUpGraphics.fillCircle(11, 12, 4);
      powerUpGraphics.fillCircle(19, 12, 4);
      powerUpGraphics.fillTriangle(7, 15, 23, 15, 15, 23);
      powerUpGraphics.generateTexture('powerup-heart', 30, 30);
      powerUpGraphics.destroy();

      // Create projectile sprite (yellow circle)
      const projectileGraphics = this.add.graphics();
      projectileGraphics.fillStyle(0xffff00);
      projectileGraphics.fillCircle(5, 5, 5);
      projectileGraphics.generateTexture('projectile', 10, 10);
      projectileGraphics.destroy();

      // Load Monad moanimals PNG files for stones from shoot folder
      this.load.image('monad1', '/shoot/1.png');
      this.load.image('monad2', '/shoot/2.png');
      this.load.image('monad3', '/shoot/3.png');
      this.load.image('monad4', '/shoot/4.png');
      this.load.image('monad5', '/shoot/5.png');
      this.load.image('monad6', '/shoot/6.png');
      this.load.image('monad7', '/shoot/7.png');
      this.load.image('monad8', '/shoot/8.png');
      this.load.image('monad9', '/shoot/9.png');
      this.load.image('monad10', '/shoot/10.png');

      // Load audio files
      this.load.audio('hitSound', '/assets/eatSound.mp3');
      this.load.audio('gameOverSound', 'assets/gameOverSound.mp3');
    }

    function create(this: Phaser.Scene) {
      // Background will be handled by CSS gradient

      // Create UI text
      scoreText = this.add.text( 30, 20, 'Score: 0', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setDepth(100);

      // Create heart icons for health display
      healthHearts = [];
      for (let i = 0; i < 3; i++) {
        const heart = this.add.text(640 - 220 + (i * 30), 20, '❤️', {
          fontSize: '24px'
        }).setDepth(100);
        healthHearts.push(heart);
      }
      
      // Function to update heart display
      function updateHeartDisplay() {
        const currentHealth = 3 - playerHits;
        for (let i = 0; i < 3; i++) {
          if (i < currentHealth) {
            healthHearts[i].setText('❤️'); // Full heart
          } else {
            healthHearts[i].setText('🖤'); // Empty heart
          }
        }
      }
      
      updateHeartDisplay();

      powerUpText = this.add.text(98, 50, '', {
        fontSize: '16px',
        color: '#00ff00',
        fontStyle: 'bold'
      }).setDepth(100);

    // //   gameOverText = this.add.text(320, 200, 'GAME OVER', {
    // //     fontSize: '48px',
    // //     color: '#ffffff',
    // //     fontStyle: 'bold'
    // //   }).setOrigin(0.5).setDepth(101);
    //   gameOverText.visible = false;

      // Create game over overlay
      gameOverOverlay = this.add.graphics();
      gameOverOverlay.fillStyle(0x000000, 0.7);
      gameOverOverlay.fillRect(0, 0, 640, window.innerHeight);
      gameOverOverlay.setDepth(100);
      gameOverOverlay.visible = false;

      // Create player
      player = this.physics.add.sprite(320, window.innerHeight - 60, 'player');
      player.setCollideWorldBounds(true);
      player.body.setSize(60, 40);
      player.body.setGravityY(-400); // Cancel out world gravity for player
      
      // Ensure player is properly initialized for smooth movement
      player.body.setVelocity(0, 0);
      player.body.setAcceleration(0, 0);
      player.body.setDrag(1200, 0); // Higher drag for faster deceleration
      player.body.setMaxVelocity(600, 0); // Increased max speed
      player.body.setBounce(0, 0);
      player.body.setFriction(0, 0);
      player.body.enable = true;
      player.body.moves = true;
      player.body.immovable = false;
      player.setActive(true);
      player.setVisible(true);
      
      // Add smooth visual effects
      player.setScale(1.0);
      player.setOrigin(0.5, 0.5);

      // Create shield barrier (initially invisible)
      shieldBarrier = this.add.graphics();
      shieldBarrier.lineStyle(4, 0x0066ff, 0.8);
      shieldBarrier.strokeCircle(0, 0, 45);
      shieldBarrier.fillStyle(0x0066ff, 0.1);
      shieldBarrier.fillCircle(0, 0, 45);
      shieldBarrier.setDepth(5);
      shieldBarrier.visible = false;

      // Create laser beam (initially invisible)
      laserBeam = this.add.graphics();
      laserBeam.setDepth(6);
      laserBeam.visible = false;

      // Create groups
      stones = this.physics.add.group();
      projectiles = this.physics.add.group();
      powerUps = this.physics.add.group();

      // Create sounds with error handling
      try {
        (this as any).hitSound = this.sound.add('hitSound', { volume: 0.5 });
      } catch (error) {
        console.log('Failed to load hit sound:', error);
        (this as any).hitSound = null;
      }
      
      try {
        (this as any).gameOverSound = this.sound.add('gameOverSound', { volume: 0.7 });
      } catch (error) {
        console.log('Failed to load game over sound:', error);
        (this as any).gameOverSound = null;
      }

      // Keyboard input is now handled directly in update loop with createCursorKeys()

      // Collision between projectiles and stones - use collider for more reliable detection
      this.physics.add.collider(projectiles, stones, (projectile: any, stone: any) => {
        projectile.destroy();
        
        // Add vibration feedback on hit
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(30); // Short vibration for hit
        }
        
        // Reduce stone health (laser does double damage)
        const damage = laserActive ? 2 : 1;
        stone.health -= damage;
        score += 10 * damage; // More points for laser hits
        scoreText.setText(`Score: ${score}`);
        
        // Update stone size based on health (keep same image)
        if (stone.health > 0) {
          // Update visual size and physics body size to match new health
          const baseSize = 120; // Increased base size for monad images
          const sizeMultiplier = 0.6 + (stone.health * 0.1); // Scale from 0.7x to 1.6x (larger range)
          const newSize = Math.floor(baseSize * sizeMultiplier);
          
          // Update visual size (keep same texture)
          stone.setDisplaySize(newSize, newSize);
          
          // Update collision size based on new visual size (larger hit area)
          const collisionSize = Math.floor(newSize * 0.9); // 90% of visual size for collision (increased from 80%)
          stone.body.setSize(collisionSize, collisionSize);
          stone.body.setOffset((newSize - collisionSize) / 2, (newSize - collisionSize) / 2); // Center collision body
          
          // Refresh physics body to ensure changes take effect
          stone.body.enable = true;
          
          // Update health bar
          if (stone.healthBar) {
            // Clear old health bar and redraw
            stone.healthBar.clear();
            
            const barWidth = 40;
            const barHeight = 6;
            
            // Draw background
            stone.healthBar.fillStyle(0x333333);
            stone.healthBar.fillRect(-barWidth/2, -barHeight/2, barWidth, barHeight);
            
            // Draw health fill
            const healthPercent = stone.health / stone.maxHealth;
            const fillWidth = barWidth * healthPercent;
            let barColor = 0x00ff00; // Green
            if (healthPercent < 0.7) barColor = 0xffff00; // Yellow
            if (healthPercent < 0.4) barColor = 0xff0000; // Red
            
            stone.healthBar.fillStyle(barColor);
            stone.healthBar.fillRect(-barWidth/2, -barHeight/2, fillWidth, barHeight);
          }
          
          // Create hit effect
          createHitEffect(scene, stone.x, stone.y);
          try {
            if ((scene as any).hitSound) {
              (scene as any).hitSound.play();
            }
          } catch (error) {
            console.log('Hit sound failed to play:', error);
          }
        } else {
          // Stone destroyed - stronger vibration
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([80, 50, 80]); // Double pulse for destruction
          }
          
          // Drop power-up with 25% chance (but only if not too many on screen)
          if (Phaser.Math.Between(1, 100) <= 25 && powerUps.children.entries.length < 3) {
            const powerUpTypes = ['shield', 'laser', 'freeze', 'multishot', 'heart'];
            const type = powerUpTypes[Phaser.Math.Between(0, powerUpTypes.length - 1)];
            
            const powerUp = powerUps.create(stone.x, stone.y, `powerup-${type}`);
            powerUp.powerUpType = type;
            powerUp.setVelocityY(100); // Slow fall
            powerUp.body.setSize(25, 25);
            powerUp.body.setGravityY(-200); // Slower than stones
            
            // Add gentle rotation
            powerUp.rotationSpeed = 0.02;
          }
          
          if (stone.healthBar) {
            stone.healthBar.destroy();
          }
          stone.destroy();
          stonesDestroyed++;
          score += 50; // Bonus for destroying stone
          scoreText.setText(`Score: ${score}`);
          
          // Create destruction effect
          createDestructionEffect(scene, stone.x, stone.y);
          try {
            if ((scene as any).hitSound) {
              (scene as any).hitSound.play();
            }
          } catch (error) {
            console.log('Hit sound failed to play:', error);
          }
        }
      });

      // Collision between stones and player
      this.physics.add.overlap(player, stones, (playerObj: any, stone: any) => {
        // Check if player has shield active
        if (shieldActive) {
          // Shield protects - destroy stone but don't damage player
          if (stone.healthBar) {
            stone.healthBar.destroy();
          }
          stone.destroy();
          return;
        }
        
        if (stone.healthBar) {
          stone.healthBar.destroy();
        }
        stone.destroy();
        playerHits++;
        updateHeartDisplay();
        
        // Add vibration feedback when player is hit (but not on game over)
        if (typeof navigator !== 'undefined' && navigator.vibrate && playerHits < 3) {
          // Player hit - medium vibration
          navigator.vibrate(150);
        }
        
        // Flash player red
        player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
          player.clearTint();
        });
        
        // Check if game over
        if (playerHits >= 3) {
          endGame();
        }
      });

      // Collision between player and power-ups
      this.physics.add.overlap(player, powerUps, (playerObj: any, powerUp: any) => {
        powerUp.destroy();
        activatePowerUp(powerUp.powerUpType);
      });

      // Spawn stones periodically
      this.time.addEvent({
        delay: 1500, // Spawn every 1.5 seconds
        callback: spawnStone,
        callbackScope: this,
        loop: true
      });

      // Power-ups will drop from destroyed stones instead of spawning periodically

      // Auto-shoot projectiles every 0.1 seconds
      this.time.addEvent({
        delay: 100, // Shoot every 0.1 seconds
        callback: () => {
          if (!gameOver) {
            shoot();
          }
        },
        callbackScope: this,
        loop: true
      });

      // Power-up functions
      function activatePowerUp(type: string) {
        switch (type) {
          case 'shield':
            shieldActive = true;
            shieldTimer = 8000; // 8 seconds
            shieldBarrier.visible = true;
            break;
          case 'laser':
            laserActive = true;
            laserTimer = 6000; // 6 seconds
            break;
          case 'freeze':
            freezeActive = true;
            freezeTimer = 4000; // 4 seconds
            break;
          case 'multishot':
            multishotActive = true;
            multishotTimer = 10000; // 10 seconds
            break;
          case 'heart':
            if (playerHits > 0) {
              playerHits--;
              updateHeartDisplay();
            }
            break;
        }
        updatePowerUpDisplay();
      }

      function updatePowerUpDisplay() {
        let powerUpStatus = '';
        if (shieldActive) powerUpStatus += '🛡️ Shield ';
        if (laserActive) powerUpStatus += '⚡ Laser ';
        if (freezeActive) powerUpStatus += '❄️ Freeze ';
        if (multishotActive) powerUpStatus += '🎯 Multishot ';
        powerUpText.setText(powerUpStatus);
      }

      function spawnPowerUp() {
        if (gameOver || powerUps.children.entries.length >= 2) return;
        
        const x = Phaser.Math.Between(80, 560);
        const y = -50;
        
        const powerUpTypes = ['shield', 'laser', 'freeze', 'multishot', 'heart'];
        const type = powerUpTypes[Phaser.Math.Between(0, powerUpTypes.length - 1)];
        
        const powerUp = powerUps.create(x, y, `powerup-${type}`);
        powerUp.powerUpType = type;
        powerUp.setVelocityY(150); // Slow fall
        powerUp.body.setSize(25, 25);
        powerUp.body.setGravityY(-250); // Slower than stones
        
        // Add gentle rotation
        powerUp.rotationSpeed = 0.02;
      }

      // Game over function - store scene reference
      const scene = this;
      
      function endGame() {
        gameOver = true;
        gameOverOverlay.visible = true;
        // gameOverText.visible = true;
        
        // Calculate final stats
        const minutes = Math.floor(gameTimer / 60);
        const seconds = gameTimer % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const maxScore = parseInt(localStorage.getItem('stoneShooterMaxScore') || '0');
        
        // Always submit score to leaderboard when game is over
        const playerData = getPlayerData(context);
        submitScore(playerData.fid, playerData.username, playerData.pfpUrl, score, 'Bounce Blaster', {
          time: formattedTime,
          stonesDestroyed,
          playerHits
        }).then(result => {
          if (result.success) {
            console.log('Score submitted successfully:', result.data);
          } else {
            console.log('Failed to submit score:', result.error);
          }
        }).catch(error => {
          console.error('Error submitting score:', error);
        });

        setGameOverData({
          score,
          time: formattedTime,
          bestScore: Math.max(score, maxScore),
          previousBestScore: maxScore, // Use the value before updating localStorage
          stonesDestroyed,
          playerHits
        });
        setGameOver(true);
        setShowRestartBtn(true);

        // Now update localStorage if needed
        if (score > maxScore) {
          localStorage.setItem('stoneShooterMaxScore', score.toString());
        }
        
        // Submit score to leaderboard (share URL logic remains unchanged)
        const shareParams = new URLSearchParams({
          score: gameOverData.score.toString(),
          time: gameOverData.time,
          stonesDestroyed: gameOverData.stonesDestroyed.toString(),
          playerHits: gameOverData.playerHits.toString(),
          gameType: 'stone-shooter',
          ...(playerData.username && { username: playerData.username }),
          ...(playerData.pfpUrl && { userImg: playerData.pfpUrl }),
        });
        const shareUrl = `${APP_URL}?${shareParams.toString()}`;
       
        
        // Play game over sound with proper scene reference
        try {
          if ((scene as any).gameOverSound) {
            (scene as any).gameOverSound.play();
          }
        } catch (error) {
          console.log('Game over sound failed to play:', error);
        }
      }

      // Spawn stone function
      function spawnStone() {
        if (gameOver) return;
        
        // Limit maximum stones on screen to 3
        const activeStones = stones.children.entries.filter((stone: any) => stone.active).length;
        if (activeStones >= 3) {
          return; // Don't spawn if we already have 3 stones
        }
        
        const x = Phaser.Math.Between(80, 560);
        const health = Phaser.Math.Between(1, 10); // Increased health range
        
        // Use direct health-to-image mapping (health 1-10 = monad1-10)
        const stone = stones.create(x, -60, `monad${health}`);
        stone.health = health;
        
        // Set stone size based on health and set collision size
        const baseSize = 120; // Increased base size for monad images
        const sizeMultiplier = 0.6 + (health * 0.1); // Scale from 0.7x to 1.6x (larger range)
        const stoneSize = Math.floor(baseSize * sizeMultiplier);
        
        // Set visual size
        stone.setDisplaySize(stoneSize, stoneSize);
        
        // Set collision size based on visual size (larger hit area)
        const collisionSize = Math.floor(stoneSize * 0.9); // 90% of visual size for collision (increased from 80%)
        stone.body.setSize(collisionSize, collisionSize);
        stone.body.setOffset((stoneSize - collisionSize) / 2, (stoneSize - collisionSize) / 2); // Center collision body
        
        // Ensure stone physics body is properly enabled
        stone.body.enable = true;
        stone.body.moves = true;
        
        // Set up bouncing physics - high power bouncing
        stone.setBounce(0.8, 0.9); // X bounce: 0.95, Y bounce: 0.98 (very high bounce retention)
        stone.setCollideWorldBounds(true); // Enable collision with world boundaries
        stone.body.setDamping(false); // Disable air resistance for more power
        stone.body.setDrag(0, 0); // No drag - stones maintain full energy
        
        // Calculate angle towards player position
        const angleToPlayer = Phaser.Math.Angle.Between(x, -60, player.x, player.y);
        const speed = Phaser.Math.Between(300, 450);
        
        // Set velocity towards player
        const velocityX = Math.cos(angleToPlayer) * speed;
        const velocityY = Math.sin(angleToPlayer) * speed;
        
        stone.setVelocity(velocityX, velocityY);
        
        // Add rotation properties for spinning animation
        stone.rotationSpeed = Phaser.Math.Between(-3, 3); // Random rotation speed (-3 to +3 radians/sec)
        if (Math.abs(stone.rotationSpeed) < 0.5) {
          stone.rotationSpeed = stone.rotationSpeed < 0 ? -1 : 1; // Minimum rotation speed
        }
        
        // Add health bar above stone
        const barWidth = 40;
        const barHeight = 6;
        const healthBar = scene.add.graphics();
        
        // Create health bar background (dark)
        healthBar.fillStyle(0x333333);
        healthBar.fillRect(-barWidth/2, -barHeight/2, barWidth, barHeight);
        
        // Create health bar fill (green to red based on health)
        const healthPercent = health / 10;
        const fillWidth = barWidth * healthPercent;
        let barColor = 0x00ff00; // Green
        if (healthPercent < 0.7) barColor = 0xffff00; // Yellow
        if (healthPercent < 0.4) barColor = 0xff0000; // Red
        
        healthBar.fillStyle(barColor);
        healthBar.fillRect(-barWidth/2, -barHeight/2, fillWidth, barHeight);
        
        healthBar.x = stone.x;
        healthBar.y = stone.y - stoneSize/2 - 12; // Position above stone
        healthBar.setDepth(10);
        
        stone.healthBar = healthBar;
        stone.maxHealth = health; // Store original health for percentage calculation
        
        // Set creation time for cleanup
        stone.creationTime = Date.now();
      }

      // Hit effect function - orange/yellow impact effect
      function createHitEffect(scene: Phaser.Scene, x: number, y: number) {
        for (let i = 0; i < 10; i++) {
          const particle = scene.add.graphics();
          
          // Orange/yellow colors for hit effect
          const hitColors = [0xffaa00, 0xff8800, 0xffcc00, 0xff6600, 0xffdd44];
          const color = hitColors[Phaser.Math.Between(0, hitColors.length - 1)];
          particle.fillStyle(color);
          particle.fillCircle(0, 0, Phaser.Math.Between(2, 4));
          particle.x = x + Phaser.Math.Between(-8, 8);
          particle.y = y + Phaser.Math.Between(-8, 8);
          
          const angle = (i / 10) * Math.PI * 2;
          const speed = Phaser.Math.Between(80, 140);
          
          scene.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: Phaser.Math.Between(250, 400),
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      }

      // Destruction effect function - red "kill" effect
      function createDestructionEffect(scene: Phaser.Scene, x: number, y: number) {
        // Create red explosion particles
        for (let i = 0; i < 15; i++) {
          const debris = scene.add.graphics();
          
          // Red colors for kill effect
          const redColors = [0xff0000, 0xff3333, 0xff6666, 0xcc0000, 0xff4444];
          const color = redColors[Phaser.Math.Between(0, redColors.length - 1)];
          debris.fillStyle(color);
          
          // Different shaped debris for more dramatic effect
          const shapeType = Phaser.Math.Between(0, 2);
          if (shapeType === 0) {
            debris.fillRect(-4, -4, 8, 8); // Square debris
          } else if (shapeType === 1) {
            debris.fillCircle(0, 0, 4); // Circular debris
          } else {
            debris.fillTriangle(-5, 5, 0, -5, 5, 5); // Triangle debris
          }
          
          debris.x = x + Phaser.Math.Between(-25, 25);
          debris.y = y + Phaser.Math.Between(-15, 15);
          
          const vx = Phaser.Math.Between(-200, 200);
          const vy = Phaser.Math.Between(-150, -250);
          
          scene.tweens.add({
            targets: debris,
            x: debris.x + vx,
            y: debris.y + vy + 250,
            rotation: Phaser.Math.Between(-Math.PI * 2, Math.PI * 2),
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: Phaser.Math.Between(600, 1000),
            ease: 'Power2',
            onComplete: () => debris.destroy()
          });
        }
      }



      // Shoot function
      function shoot() {
        if (multishotActive) {
          // Multishot: fire 3 projectiles in spread pattern
          for (let i = -1; i <= 1; i++) {
            const projectile = projectiles.create(player.x + (i * 20), player.y - 20, 'projectile');
            projectile.setVelocityY(-400);
            projectile.setVelocityX(i * 100); // Spread pattern
            
            if (laserActive) {
              projectile.setTint(0xff0000); // Red laser color
              projectile.setScale(1.5); // Larger laser projectiles
            }
            
            projectile.body.setSize(15, 15);
            projectile.body.setOffset(-2.5, -2.5);
            projectile.body.setGravityY(-400);
            projectile.body.enable = true;
            projectile.body.moves = true;
          }
        } else {
          // Normal single shot
          const projectile = projectiles.create(player.x, player.y - 20, 'projectile');
          projectile.setVelocityY(-400);
          
          if (laserActive) {
            projectile.setTint(0xff0000); // Red laser color
            projectile.setScale(1.5); // Larger laser projectiles
          }
          
          projectile.body.setSize(15, 15);
          projectile.body.setOffset(-2.5, -2.5);
          projectile.body.setGravityY(-400);
          projectile.body.enable = true;
          projectile.body.moves = true;
        }
      }

      // Reset game state completely
      gameOver = false;
      score = 0;
      stonesDestroyed = 0;
      playerHits = 0;
      gameStartTime = Date.now();
      gameTimer = 0;
      
      // Reset power-up states
      shieldActive = false;
      laserActive = false;
      freezeActive = false;
      multishotActive = false;
      shieldBarrier.visible = false;
      laserBeam.visible = false;
      laserBeamCooldown = 0;
      
      // Reset hearts display
      updateHeartDisplay();
      
      // Debug: Log initial state
      console.log('Game initialized - Player at:', player.x, player.y);
      console.log('Game over state:', gameOver);
      console.log('Player body enabled:', player.body.enable);
      
      setGameReady(true);
    }

    function update(this: Phaser.Scene) {
      if (gameOver) return;

      // Update timer
      gameTimer = Math.floor((Date.now() - gameStartTime) / 1000);

      // Update power-up timers
      const deltaTime = 16; // Assume 60fps
      
      if (shieldActive) {
        shieldTimer -= deltaTime;
        if (shieldTimer <= 0) {
          shieldActive = false;
          shieldBarrier.visible = false;
          // Update power-up display
          let powerUpStatus = '';
          if (laserActive) powerUpStatus += '⚡ Laser ';
          if (freezeActive) powerUpStatus += '❄️ Freeze ';
          if (multishotActive) powerUpStatus += '🎯 Multishot ';
          powerUpText.setText(powerUpStatus);
        }
      }
      
      if (laserActive) {
        laserTimer -= deltaTime;
        if (laserTimer <= 0) {
          laserActive = false;
          // Update power-up display
          let powerUpStatus = '';
          if (shieldActive) powerUpStatus += '🛡️ Shield ';
          if (freezeActive) powerUpStatus += '❄️ Freeze ';
          if (multishotActive) powerUpStatus += '🎯 Multishot ';
          powerUpText.setText(powerUpStatus);
        }
      }
      
      if (freezeActive) {
        freezeTimer -= deltaTime;
        if (freezeTimer <= 0) {
          freezeActive = false;
          // Update power-up display
          let powerUpStatus = '';
          if (shieldActive) powerUpStatus += '🛡️ Shield ';
          if (laserActive) powerUpStatus += '⚡ Laser ';
          if (multishotActive) powerUpStatus += '🎯 Multishot ';
          powerUpText.setText(powerUpStatus);
        }
      }
      
      if (multishotActive) {
        multishotTimer -= deltaTime;
        if (multishotTimer <= 0) {
          multishotActive = false;
          // Update power-up display
          let powerUpStatus = '';
          if (shieldActive) powerUpStatus += '🛡️ Shield ';
          if (laserActive) powerUpStatus += '⚡ Laser ';
          if (freezeActive) powerUpStatus += '❄️ Freeze ';
          powerUpText.setText(powerUpStatus);
        }
      }

      // Player movement - smooth acceleration-based movement
      if (player && player.body && player.body.enable) {
        let isMoving = false;
        let movementDirection = 0;

        if (controlMode === 'tilt' && Math.abs(tiltXRef.current) > 3) {
          // Use tilt controls
          const tiltForce = Math.max(-1, Math.min(1, tiltXRef.current / 10));
          player.body.setAccelerationX(tiltForce * 2000);
          isMoving = Math.abs(tiltForce) > 0.1;
          movementDirection = tiltForce > 0 ? 1 : -1;
          if (tiltForce < -0.1) {
            player.setTexture('player-left');
          } else if (tiltForce > 0.1) {
            player.setTexture('player');
          }
        } else if (controlMode === 'button') {
          if (buttonDirectionRef.current === -1) {
            player.body.setAccelerationX(-2000);
            isMoving = true;
            movementDirection = -1;
            player.setTexture('player-left');
          } else if (buttonDirectionRef.current === 1) {
            player.body.setAccelerationX(2000);
            isMoving = true;
            movementDirection = 1;
            player.setTexture('player');
          } else {
            player.body.setAccelerationX(0);
            isMoving = false;
          }
        } else {
          // Use keyboard input as fallback
          const cursors = this.input.keyboard!.createCursorKeys();
          if (cursors.left.isDown) {
            player.body.setAccelerationX(-2000);
            isMoving = true;
            movementDirection = -1;
            player.setTexture('player-left');
          } else if (cursors.right.isDown) {
            player.body.setAccelerationX(2000);
            isMoving = true;
            movementDirection = 1;
            player.setTexture('player');
          } else {
            player.body.setAccelerationX(0);
            isMoving = false;
          }
        }
        
        // Smooth visual effects during movement
        if (isMoving) {
          // Scale effect when moving
          const targetScale = 1.1;
          if (Math.abs(player.scaleX - targetScale) > 0.01) {
            player.setScale(
              Phaser.Math.Linear(player.scaleX, targetScale, 0.1),
              Phaser.Math.Linear(player.scaleY, targetScale, 0.1)
            );
          }
          
          // Slight rotation based on movement direction
          const targetRotation = movementDirection * 0.1;
          player.setRotation(Phaser.Math.Linear(player.rotation, targetRotation, 0.15));
          
                     // Create movement particles occasionally
           if (gameTimer % 3 === 0) { // Every 3 frames
             const particle = this.add.graphics();
             const colors = [0x00ff00, 0x88ff88, 0x66ff66, 0xaaffaa];
             const color = colors[Phaser.Math.Between(0, colors.length - 1)];
             particle.fillStyle(color, 0.7);
             particle.fillCircle(0, 0, Phaser.Math.Between(2, 4));
             particle.x = player.x - movementDirection * 20 + Phaser.Math.Between(-5, 5);
             particle.y = player.y + 15 + Phaser.Math.Between(-5, 5);
             
             this.tweens.add({
               targets: particle,
               x: particle.x + Phaser.Math.Between(-20, 20),
               y: particle.y + Phaser.Math.Between(10, 30),
               scaleX: 0,
               scaleY: 0,
               alpha: 0,
               duration: Phaser.Math.Between(300, 600),
               ease: 'Power2',
               onComplete: () => particle.destroy()
             });
           }
        } else {
          // Return to normal when not moving
          const targetScale = 1.0;
          const targetRotation = 0;
          player.setScale(
            Phaser.Math.Linear(player.scaleX, targetScale, 0.1),
            Phaser.Math.Linear(player.scaleY, targetScale, 0.1)
          );
          player.setRotation(Phaser.Math.Linear(player.rotation, targetRotation, 0.15));
        }
      }

      // Automatic shooting is handled by timer event (no manual input needed)

      // Update shield barrier position
      if (shieldBarrier) {
        shieldBarrier.x = player.x;
        shieldBarrier.y = player.y;
      }

      // Update laser beam
      if (laserBeam) {
        laserBeam.clear();
        if (laserActive) {
          // Update laser beam cooldown
          laserBeamCooldown -= deltaTime;
          
          // Find nearest stone to player
          let nearestStone: any = null;
          let minDistance = Infinity;
          
          stones.children.iterate((stone: any) => {
            if (stone && stone.active) {
              const distance = Phaser.Math.Distance.Between(player.x, player.y, stone.x, stone.y);
              if (distance < minDistance) {
                minDistance = distance;
                nearestStone = stone;
              }
            }
            return null;
          });
          
          if (nearestStone && minDistance < 400) { // Only target stones within range
            // Always draw the targeting beam
            laserBeam.lineStyle(4, 0xff0000, 0.8);
            laserBeam.strokeLineShape(
              new Phaser.Geom.Line(player.x, player.y - 10, nearestStone.x, nearestStone.y)
            );
            
            // Add glow effect
            laserBeam.lineStyle(8, 0xff0000, 0.3);
            laserBeam.strokeLineShape(
              new Phaser.Geom.Line(player.x, player.y - 10, nearestStone.x, nearestStone.y)
            );
            
            laserBeam.visible = true;
            
            // Only destroy stone when cooldown is ready
            if (laserBeamCooldown <= 0) {
              laserBeamCooldown = 800; // 800ms cooldown between laser shots
              
              // Instantly destroy the stone
              if (nearestStone.healthBar) {
                nearestStone.healthBar.destroy();
              }
              
              // Drop power-up with 25% chance (but only if not too many on screen)
              if (Phaser.Math.Between(1, 100) <= 25 && powerUps.children.entries.length < 3) {
                const powerUpTypes = ['shield', 'laser', 'freeze', 'multishot', 'heart'];
                const type = powerUpTypes[Phaser.Math.Between(0, powerUpTypes.length - 1)];
                
                const powerUp = powerUps.create(nearestStone.x, nearestStone.y, `powerup-${type}`);
                powerUp.powerUpType = type;
                powerUp.setVelocityY(100); // Slow fall
                powerUp.body.setSize(25, 25);
                powerUp.body.setGravityY(-200); // Slower than stones
                
                // Add gentle rotation
                powerUp.rotationSpeed = 0.02;
              }
              
              nearestStone.destroy();
              stonesDestroyed++;
              score += 100; // Bonus for laser kill
              scoreText.setText(`Score: ${score}`);
              
              // Simple red flash effect for laser kills
              const flash = this.add.graphics();
              flash.fillStyle(0xff0000, 0.5);
              flash.fillCircle(nearestStone.x, nearestStone.y, 30);
              this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => flash.destroy()
              });
              
              // Stronger vibration for laser kills
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([50, 30, 50]); // Triple pulse for laser kill
              }
              
              try {
                if ((this as any).hitSound) {
                  (this as any).hitSound.play();
                }
              } catch (error) {
                console.log('Hit sound failed to play:', error);
              }
            }
          } else {
            laserBeam.visible = false;
          }
        } else {
          laserBeam.visible = false;
        }
      }

      // Update stone health bar positions and stone rotation
      stones.children.iterate((stone: any) => {
        if (stone && stone.healthBar) {
          // Position health bar above stone (doesn't rotate)
          stone.healthBar.x = stone.x;
          stone.healthBar.y = stone.y - stone.displayHeight/2 - 12;
          
          // Apply rotation animation to stone only (slower when frozen)
          if (stone.rotationSpeed) {
            const rotationMultiplier = freezeActive ? 0.1 : 1; // Very slow rotation when frozen
            stone.rotation += stone.rotationSpeed * 0.016 * rotationMultiplier;
          }
          
          // Apply freeze effect to stone velocity
          if (freezeActive) {
            stone.body.setVelocity(stone.body.velocity.x * 0.1, stone.body.velocity.y * 0.1);
            stone.setTint(0x88ccff); // Light blue tint for frozen effect
          } else {
            stone.clearTint();
          }
        }
        return null;
      });

      // Update power-ups
      powerUps.children.iterate((powerUp: any) => {
        if (powerUp && powerUp.rotationSpeed) {
          powerUp.rotation += powerUp.rotationSpeed;
        }
        
        // Remove power-ups that fall off screen
        if (powerUp && powerUp.y > window.innerHeight + 50) {
          powerUp.destroy();
        }
        return null;
      });

      // Remove stones that are too old (cleanup bouncing stones)
      stones.children.iterate((stone: any) => {
        if (stone) {
          const stoneAge = Date.now() - (stone.creationTime || 0);
          
          // Remove stone only if it's too old (60 seconds) - let them bounce with full power
          if (stoneAge > 60000) {
            if (stone.healthBar) stone.healthBar.destroy();
            stone.destroy();
          }
        }
        return null;
      });

      // Remove projectiles that go off screen
      projectiles.children.iterate((projectile: any) => {
        if (projectile && projectile.y < -50) {
          projectile.destroy();
        }
        return null;
      });
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 640,
      height: window.innerHeight,
      parent: gameRef.current!,
      transparent: true, // Make canvas transparent to show CSS background
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 400 }, // Add gravity for realistic bouncing
          debug: false,
          fps: 60, // Ensure 60 FPS physics for better collision detection
          fixedStep: true, // Use fixed time step for consistent physics
          overlapBias: 4, // Improve overlap detection
          tileBias: 16, // Improve tile collision detection
        },
      },
      scene: {
        preload,
        create,
        update,
      },
      scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    phaserGameRef.current = new Phaser.Game(config);

    // Responsive resize
    function handleResize() {
      phaserGameRef.current?.scale.resize(640, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      phaserGameRef.current?.destroy(true);
      phaserGameRef.current = null;
    };
  }, [gameKey, controlMode]);

  // On game over, attempt daily gift claim based on remaining (not strictly new high score)
  useEffect(() => {
    const tryDailyGift = async () => {
      if (!gameOver || gameOverData.score <= 0) return;
      try {
        const playerData = getPlayerData(context);
        const res = await fetch('/api/daily-gifts/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid: playerData.fid, game: 'Bounce Blaster' })
        });
        if (!res.ok) {
          setShowGiftModal(false);
          return;
        }
        const data = await res.json();
        if (data?.success && data?.reward) {
          setClaimedReward({ type: data.reward.token as RewardToken, amount: data.reward.amount });
          setShowGiftModal(true);
        } else {
          setShowGiftModal(false);
        }
      } catch (_e) {
        setShowGiftModal(false);
      }
    };
    tryDailyGift();
  }, [gameOver, gameOverData, context]);

  // Claim handler
  const handleClaimReward = async () => {
    try {
      const rewardType = claimedReward?.type as RewardToken;
      const amount = claimedReward?.amount;
      if (!rewardType || amount == null) throw new Error('No reward selected');
      const decimals = getTokenDecimals(rewardType);
      const amountInt = parseUnits(amount.toString(), decimals).toString();
      const playerData = getPlayerData(context);
      const userAddress = address || '';
      const res = await   fetchWithVerification('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          tokenAddress: getTokenAddress(rewardType),
          amount: amountInt,
          tokenName: rewardType,
          name: playerData.username,
          pfpUrl: playerData.pfpUrl,
          score: gameOverData.bestScore,
          fid: playerData.fid,
          game: 'Bounce Blaster'
        })
      });
      if (res.status === 403) {
        setShowGiftModal(false);
        // alert('Score verification failed. Please refresh and try again.');
        return;
      }
      if (!res.ok) throw new Error('Failed to get signature');
      const { signature } = await res.json();
      await switchChain({ chainId: monadTestnet.id });
      writeContract({
        abi: [
          {
            name: 'claimTokenReward',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
              { name: 'signature', type: 'bytes' }
            ],
            outputs: []
          }
        ],
        address: process.env.NEXT_PUBLIC_TOKEN_REWARD_ADDRESS as `0x${string}`,
        functionName: 'claimTokenReward',
        args: [
          getTokenAddress(rewardType) as `0x${string}`,
          BigInt(amountInt),
          signature as `0x${string}`
        ]
      });
    } catch (err: any) {
      console.log(err);
      // error handled by wagmi
    }
  };

  // Memoized star and shooting star data for stable animation
  const starData = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => {
      const size = Math.random() * 8 + 4;
      const starColor = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffff88' : '#88ccff';
      return {
        size,
        color: starColor,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.8 + 0.2,
        textShadow: `0 0 ${size/2}px ${starColor}`,
      };
    }),
    []
  );
  const shootingStarData = useMemo(() =>
    Array.from({ length: 3 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 50}%`,
      animation: `shoot ${Math.random() * 15 + 10}s linear infinite`,
      animationDelay: `${Math.random() * 10}s`,
    })),
    []
  );

  // Trigger blockchain submission on game over (not high score)
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (
      gameOver &&
      gameOverData.score > 0 &&
      gameOverData.bestScore === gameOverData.previousBestScore
    ) {
      setShowSubmitScoreStatus(true);
      timer = setTimeout(() => {
        const playerData = getPlayerData(context);
        switchChain({ chainId: monadTestnet.id });
        writeSubmitScore({
          abi: [
            {
              "inputs": [
                { "internalType": "string", "name": "username", "type": "string" },
                { "internalType": "uint256", "name": "score", "type": "uint256" }
              ],
              "name": "submitScore",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          address: "0x6Fc22a9e82F8008B04c7fa14b07A09212660c0B2",
          functionName: "submitScore",
          args: [playerData.username, BigInt(gameOverData.score)]
        });
      }, 2000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [gameOver, gameOverData, context, switchChain, writeSubmitScore]);

  // Hide status after 1s only on error
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (showSubmitScoreStatus && submitScoreError) {
      timer = setTimeout(() => {
        setShowSubmitScoreStatus(false);
        resetSubmitScore();
      }, 1000);
      return () => { if (timer) clearTimeout(timer); };
    }
  }, [showSubmitScoreStatus, submitScoreError, resetSubmitScore]);

  if (controlMode === null) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(180deg, #001122 0%, #f9f7f4 100%)',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '20px',
        paddingTop: '100px',
      }}>
        <h2 style={{ color: 'white', fontSize: 32, marginBottom: 24 }}>Control Mode</h2>
        <button
          style={{
            fontSize: 17,
            margin: 12,
            padding: '10px',
            borderRadius: 8,
            height: '200px',
            width: '200px',
            textAlign: 'center',
            border: '1px solid #ffffff',
            color: '#ffffff',
            background: " url('/images/tilt.png') no-repeat  center / 200px 200px"
          }}
          onClick={() => setControlMode('tilt')}
        >
          Sensor
        </button>
        <button
          style={{
            fontSize: 17,
            margin: 12,
            padding: '10px',
            borderRadius: 8,
            height: '200px',
            width: '200px',
            textAlign: 'center',
            border: '1px solid #ffffff',
            color: '#ffffff',
            background: " url('/images/leftright.png') no-repeat  center / 200px 200px"
          }}
          onClick={() => setControlMode('button')}
        >
          Touch
        </button>
      </div>
    );
  }

  return (
    <>
      {showPermissionBtn && (
        <button
          style={{ position: 'absolute', top: 20, right: 20, zIndex: 2000 }}
          onClick={requestOrientationPermission}
        >
          Enable Tilt Controls
        </button>
      )}
      
      {!gameReady && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'linear-gradient(180deg, #001122 0%, #f9f7f4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          overflow: 'hidden'
        }}>
          <img
            src="/shoot/player-left.png"
            alt="Player"
            style={{
              position: 'absolute',
              left: 'calc(50% - 60px)', // center horizontally (image width is 120px)
              // width: '120px',
              // height: '120px',
              animation: 'fall-spin 2.5s linear infinite'
            }}
          />
        </div>
      )}

      {gameOver && (
        <>
          <button
            style={{
              position: 'fixed',
              top: '10px',
              left: '0px',
              zIndex: 2100,
              padding: '8px 16px',
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.7)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto'
            }}
            onClick={onBack}
          >
            ◀ Games
          </button>
          <div style={{
            position: 'fixed',
            top: -50,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            pointerEvents: 'none'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              margin: '0 0 20px 0'
            }}>
              GAME OVER
            </h1>
            {/* Blockchain submission status for non-high score */}
            {showSubmitScoreStatus && (
              <div
                style={{
                  margin: '0px 0px 10px 0px',
                  padding: '5px 10px',
                  borderRadius: 14,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 200,
                  maxWidth: 400,
                  background:
                    submitScoreSuccess
                      ? ' rgba(0,0,0,0.38)'
                      : submitScoreError
                        ? ' rgba(0,0,0,0.38)'
                        : ' rgba(0,0,0,0.38)',
                  color:
                    submitScoreSuccess
                      ? '#fff'
                      : submitScoreError
                        ? '#fff'
                        : '#fff',
                  fontWeight: 600,
                  fontSize: 18,
                  transition: 'all 0.3s',
                  border: submitScoreSuccess
                    ? '2px solid #fff'
                    : submitScoreError
                      ? '2px solid #fff'
                      : '',
                  position: 'relative',
                  zIndex: 2000,
                  cursor:'pointer'
                }}
              >
                {submitScoreSuccess ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, marginBottom: 1 }}>
                      <span style={{ fontSize: 20, color: '#1a7f37' }}>✔️</span>
                      <span>Score Stored!</span>
                    </div>
                    {submitScoreTx && (
                      <button
                        onClick={() => actions?.openUrl(`https://testnet.monadexplorer.com/tx/${submitScoreTx}`)}
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: '#fff',
                          background: 'linear-gradient(90deg, #7C65C1 0%, #4e3a8c 100%)',
                          padding: '7px 18px',
                          borderRadius: 7,
                          textDecoration: 'none',
                          fontWeight: 700,
                          boxShadow: '0 2px 8px rgba(124,101,193,0.12)',
                          transition: 'background 0.2s',
                          display: 'inline-block',
                          cursor:'pointer',
                          pointerEvents: 'auto'
                        }}
                      >
                        View Transaction ↗
                      </button>
                    )}
                  </>
                ) : submitScoreError ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20 }}>
                    <span style={{ fontSize: 26, color: '#b91c1c' }}>❌</span>
                    <span>{'Error submitting score.'}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center',flexDirection:"column", fontSize: 19 }}>
                    <span style={{ display: 'inline-block', width: 25, height: 25 }}>
                      <svg width="22" height="22" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" stroke="#fff" strokeWidth="5" fill="none" opacity="0.3"/><circle cx="25" cy="25" r="20" stroke="#fff" strokeWidth="5" fill="none" strokeDasharray="31.4 94.2" strokeLinecap="round"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg>
                    </span>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                    <span>Storing score onChain...</span>
                    <span style={{fontSize: 12, color: '#fff'}}>Confirm Transaction</span>
                    </div>
                 
                  </div>
                )}
              </div>
            )}
            <button style={{
              fontSize: '40px',
              fontWeight: 'bold',
              border: '2px solid #ffffff',
              padding: '15px 25px',
              borderRadius: '10px',
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.5)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              margin: '0 0 15px 0',
              cursor: 'pointer',
              zIndex: 2001,
              pointerEvents: 'auto'
            }} onClick={async () => {
              try {
                const improvementText = gameOverData.score > gameOverData.previousBestScore && gameOverData.previousBestScore > 0 
                  ? `\n\🔥 That's +${Math.round(((gameOverData.score - gameOverData.previousBestScore) / gameOverData.previousBestScore) * 100)}% improvement from my Highest Score!`
                  : '';
                
                const shareText = `🎯 Just scored ${gameOverData.score} points in Bounce Blaster! 💥\n\ ${gameOverData.stonesDestroyed} kills and survived ${gameOverData.playerHits} hits!${improvementText}\n\nCan you beat my score?`;
                
                const playerData = getPlayerData(context);
                const shareParams = new URLSearchParams({
                  score: gameOverData.score.toString(),
                  time: gameOverData.time,
                  stonesDestroyed: gameOverData.stonesDestroyed.toString(),
                  playerHits: gameOverData.playerHits.toString(),
                  gameType: 'stone-shooter',
                  ...(playerData.username && { username: playerData.username }),
                  ...(playerData.pfpUrl && { userImg: playerData.pfpUrl }),
                });
                const shareUrl = `${APP_URL}?${shareParams.toString()}`;
                if (actions && actions.composeCast) {
                  await actions.composeCast({
                    text: shareText,
                    embeds: [shareUrl],
                  });
                }
              } catch (error) {
                console.error('Error sharing score:', error);
              }
            }}>
              <div style={{fontSize: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="none" style={{display: 'inline-block', verticalAlign: 'middle'}}><rect width="256" height="256" rx="56" fill="#7C65C1"></rect><path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path></svg>
                Cast my score
               
              </div>
              <div>{animatedScore}</div>
              {gameOverData.score > gameOverData.previousBestScore && gameOverData.previousBestScore > 0 && (
                <div style={{
                  fontSize: '11px',
                  color: '#00ff00',
                  fontWeight: 'bold',
                  marginTop: '3px'
                }}>
                  +{Math.round(((gameOverData.score - gameOverData.previousBestScore) / gameOverData.previousBestScore) * 100)}% from best
                </div>
              )}
              <div style={{
                width: '100%',
                height: '1px',
                backgroundColor: '#ffffff',
                margin: '8px 0'
              }}></div>
              <div style={{fontSize: '12px'}}>
                Kills: {gameOverData.stonesDestroyed}
              </div>
            </button>

            <div style={{
              fontSize: '13px',
              color: '#ffff00',
              fontWeight: 'bold',
              border: '1px solid #ffff00',
              padding: '8px 16px',
              borderRadius: '8px',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              Best
              <p style={{ fontSize: '29px', fontWeight: 'bold', color: '#ffff00' }}>{gameOverData.bestScore}</p>
            </div>
          </div>
        </>
      )}

      {showRestartBtn && (
        <button
          style={{ 
            position: 'fixed', 
            bottom: '80px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 2000,
            padding: '12px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: '#00ff00',
            color: '#000000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00cc00';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00ff00';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          }}
          onClick={handleRestart}
        >
          ▶ Play Again
        </button>
      )}

      <div 
        key={gameKey} 
        ref={gameRef} 
        style={{ 
          width: '100vw', 
          height: '100vh', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          zIndex: 1000,
          filter: gameOver ? 'blur(2px)' : 'none',
          transition: 'filter 0.5s ease',
          background: 'linear-gradient(180deg, #001122 0%, #f9f7f4 100%)'
        }} 
      >
        {/* Animated Stars Background */}
        <div 
          className={gameOver ? 'stars-paused' : ''}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            zIndex: -1
          }}
        >
          {/* Generate stars with stable positions and animation */}
          {starData.map((star, i) => (
            <div
              key={i}
              className="star"
              style={{
                position: 'absolute',
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                color: star.color,
                fontSize: `${star.size}px`,
                lineHeight: '1',
                animation: star.animation,
                animationDelay: star.animationDelay,
                opacity: star.opacity,
                textShadow: star.textShadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
          {/* Shooting stars with stable positions and animation */}
          {shootingStarData.map((shoot, i) => (
            <div
              key={`shooting-${i}`}
              className="shooting-star"
              style={{
                position: 'absolute',
                left: shoot.left,
                top: shoot.top,
                width: '12px',
                height: '12px',
                color: '#ffffff',
                fontSize: '12px',
                lineHeight: '1',
                animation: shoot.animation,
                animationDelay: shoot.animationDelay,
                opacity: 0.9,
                textShadow: '0 0 8px #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fall-spin {
          0% {
            top: -120px;
            transform: rotate(0deg);
          }
          100% {
            top: 100vh;
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.2;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes shoot {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(-100vw) translateY(100vh);
            opacity: 0;
          }
        }
        .stars-paused .star, .stars-paused .shooting-star {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* Home button, ConfirmEndGameModal, and GiftRewardModal */}
      
     
      <GiftRewardModal
        open={showGiftModal}
        onClose={() => { setShowGiftModal(false); resetClaim(); }}
        rewardType={claimedReward?.type as RewardToken || "MON"}
        amount={claimedReward?.amount || 0}
        tokenIcon={<span style={{fontSize: 32}}>🪙</span>}
        tokenImg={getTokenImage((claimedReward?.type as RewardToken) || "MON")}
        onClaim={handleClaimReward}
        claimSuccess={claimSuccess}
        claimError={
          claimError
            ? (claimErrorObj?.message?.toLowerCase().includes('user rejected')
                ? 'You rejected the transaction. Please confirm the transaction in your wallet to claim your reward.'
                : claimErrorObj?.message || "Transaction failed")
            : null
        }
        onShare={async () => {
          if (!actions || !actions.composeCast) return;
          const rewardType = claimedReward?.type as RewardToken || "MON";
          const amount = claimedReward?.amount || 0;
          const playerData = getPlayerData(context);
          const improvementText = gameOverData.score > previousBestScore && previousBestScore > 0
            ? `+${Math.round(((gameOverData.score - previousBestScore) / previousBestScore) * 100)}% improvement from my Highest Score!`
            : '';
            const shareParams = new URLSearchParams({
              score: gameOverData.score.toString(),
              time: gameOverData.time,
              stonesDestroyed: gameOverData.stonesDestroyed.toString(),
              playerHits: gameOverData.playerHits.toString(),
              gameType: 'stone-shooter',
              ...(playerData.username && { username: playerData.username }),
              ...(playerData.pfpUrl && { userImg: playerData.pfpUrl }),
            });
            const shareUrl = `${APP_URL}?${shareParams.toString()}`;
          const shareText = `🎮 Just claimed a reward: ${amount} ${rewardType} and Scored ${gameOverData.score} points in Bounce Blaster! 💥\n\ ${gameOverData.stonesDestroyed} kills and survived ${gameOverData.playerHits} hits!\n🚀${improvementText}\n\nCan you beat my score?`;
          await actions.composeCast({
            text: shareText,
            embeds: [shareUrl],
          });
        }}
      />
    </>
  );
} 