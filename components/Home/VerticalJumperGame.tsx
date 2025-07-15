'use client'
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { APP_URL } from '@/lib/constants';
import { submitScore, getPlayerData, generateRandomKey, generateFusedKey, fetchWithVerification } from '@/lib/leaderboard';
import GiftRewardModal from '../GiftRewardModal';
import { useContractWrite,useAccount, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';
import { monadTestnet } from 'wagmi/chains';
import { getRandomValue, getTokenAddress, getTokenDecimals, getTokenImage, rewardTypes, RewardToken } from '@/lib/rewards';

interface VerticalJumperGameProps {
  onBack?: () => void;
}

export default function VerticalJumperGame({ onBack }: VerticalJumperGameProps) {
  const componentStartTime = performance.now();
  console.log('🎮 [MONAD JUMP] Component initializing at:', componentStartTime);
  const { address } = useAccount();
  const { context, actions } = useMiniAppContext();
  const gameRef = useRef<HTMLDivElement>(null);
  const { switchChain } = useSwitchChain();

  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [showPermissionBtn, setShowPermissionBtn] = useState(false);
  const [showRestartBtn, setShowRestartBtn] = useState(false);
  const [gameKey, setGameKey] = useState(0); // for remounting Phaser game
  const [gameLoading, setGameLoading] = useState(true); // Track loading state
  
  const [gameOver, setGameOver] = useState(false); // Track game over state for blur effect
  const [gameOverData, setGameOverData] = useState({ score: 0, time: '00:00', bestScore: 0, previousBestScore: 0 }); // Game over data
  const [animatedScore, setAnimatedScore] = useState(0);
  const tiltXRef = useRef(0);
  const [controlMode, setControlMode] = useState<'tilt' | 'button' | null>(null);
  const buttonDirectionRef = useRef<0 | -1 | 1>(0);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('maxScore') || '0'));
  const [claiming, setClaiming] = useState(false);
  const { writeContract, data: claimData, isSuccess: claimSuccess, isError: claimError, error: claimErrorObj, reset: resetClaim } = useContractWrite();
  
  const { isLoading: isClaiming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimData,
  });
  const [claimedReward, setClaimedReward] = useState<{ type: string, amount: number } | null>(null);
  
  // Add state for submit score modal
  const [showSubmitScoreModal, setShowSubmitScoreModal] = useState(false);
  const { writeContract: writeSubmitScore, data: submitScoreTx, isSuccess: submitScoreSuccess, isError: submitScoreError, error: submitScoreErrorObj, reset: resetSubmitScore } = useContractWrite();
  
  console.log('🎮 [MONAD JUMP] Component state initialized, gameKey:', gameKey);

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

  // Only start the Phaser game after controlMode is selected
  useEffect(() => {
    if (controlMode === null) return;
    
    let player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    let platforms: Phaser.Physics.Arcade.StaticGroup;
    let enemies: Phaser.Physics.Arcade.Group;
    let ball: Phaser.Physics.Arcade.Group;
    let missiles: Phaser.Physics.Arcade.Group;
    let leftKey: Phaser.Input.Keyboard.Key;
    let rightKey: Phaser.Input.Keyboard.Key;
    let score = 0;
    let scorePenalty = 0; // Track total penalties from missile hits
    let highestY = 0; // Track the highest Y position reached
    let gameStartTime = Date.now(); // Track when game started
    let gameTimer = 0; // Track elapsed time in seconds
    let currentDifficulty = 'easy'; // Track current difficulty level
    let gameOver = false;
    let gameOverDistance = 300;

    // Function to determine difficulty based on score
    const getDifficulty = (currentScore: number) => {
      if (currentScore < 3000) return 'easy';
      else if (currentScore < 5000) return 'normal';
      else if (currentScore < 9000 ) return 'hard';
      else return 'extreme';
    };
    
    // Function to get platform type probabilities based on difficulty
    const getPlatformProbabilities = (difficulty: string) => {
      switch (difficulty) {
        case 'easy':
          return { normal: 90, destructive: 5, invisible: 5 }; // Very easy
        case 'normal':
          return { normal: 70, destructive: 15, invisible: 15 }; // Balanced
        case 'hard':
          return { normal: 50, destructive: 25, invisible: 25 }; // Challenging
        case 'extreme':
          return { normal: 30, destructive: 35, invisible: 35 }; // Very hard
        default:
          return { normal: 90, destructive: 5, invisible: 5 };
      }
    };

    // Function to get player speed multiplier based on difficulty
    const getPlayerSpeedMultiplier = (difficulty: string) => {
      switch (difficulty) {
        case 'easy':
          return 1.0; // Normal speed
        case 'normal':
          return 0.85; // 15% slower
        case 'hard':
          return 0.7; // 30% slower
        case 'extreme':
          return 0.55; // 45% slower
        default:
          return 1.0;
      }
    };
    
    let bgdMusicConfig: Phaser.Types.Sound.SoundConfig;
    let scoreText: Phaser.GameObjects.Text;
    let scoreMax: Phaser.GameObjects.Text;
    let gameOverText: Phaser.GameObjects.Text;
    let timerText: Phaser.GameObjects.Text;
    let finalScoreText: Phaser.GameObjects.Text;
    let maxScoreText: Phaser.GameObjects.Text;
    let gameOverOverlay: Phaser.GameObjects.Graphics;

    function preload(this: Phaser.Scene) {
      console.log('📦 [MONAD JUMP] PRELOAD started - loading assets...');
      
      this.load.image('background', '/images/jump/background.png');
      this.load.image('background1', '/images/jump/background1.png');
      this.load.image('background2', '/images/jump/background2.png');
      this.load.image('background3', '/images/jump/background3.png');
      this.load.image('platform', '/images/jump/game-tiles.png');
      this.load.image('destructive', '/images/jump/game-tiles-destructive.png');
      this.load.image('invisible', '/images/jump/game-tiles-invisible.png');
      this.load.image('enemy', '/images/jump/enemy.png');
      this.load.image('ball', '/images/jump/Parsnip.png');
      this.load.image('ball2', '/images/jump/parsnip1.png');
      this.load.image('sparkle', '/images/jump/parsnip1.png');
      this.load.spritesheet('playerAnims', 'images/jump/player.png', { frameWidth: 72, frameHeight: 90 });
      this.load.spritesheet('playerLeftAnims', 'images/jump/player_left.png', { frameWidth: 72, frameHeight: 90 });
      this.load.spritesheet('enemyAnims', 'images/jump/enemy.png', { frameWidth: 161, frameHeight: 95 });
      this.load.image('enemy2', 'images/jump/enemy2.gif');
      this.load.audio('bgdMusic', '/assets/bgdMusic.mp3');
      this.load.audio('eatSound', '/assets/eatSound.mp3');
      this.load.audio('jumpSound', '/assets/jumpSound.mp3');
      this.load.audio('gameOverSound', '/assets/gameOverSound.mp3');
      
      console.log('📦 [MONAD JUMP] PRELOAD completed - all assets queued');
    }

    function create(this: Phaser.Scene) {
      console.log('🎨 [MONAD JUMP] CREATE started - building game scene...');
      
      // Remove previous bg logic, use tileSprite
      // Create background with smooth transitions
      const bg = this.add.tileSprite(0, 0, 640, window.innerHeight * 2, 'background').setOrigin(0, 0);
      bg.setScrollFactor(0);
      (this as any).bgTile = bg;
      (this as any).currentBgTexture = 'background';
      (this as any).bgTransitioning = false;
      
      console.log('🖼️ [MONAD JUMP] Background created');
      scoreText = this.add
        .text(130, 10, 'Score: 0', { fontSize: '32px', color: '#fff', fontStyle: 'bold' })
        .setScrollFactor(0)
        .setDepth(5);
      // scoreMax = this.add
      //   .text(20, 80, `Max Score: ${localStorage.getItem('maxScore') || 0}`, {
      //     fontSize: '18px',
      //     color: '#ffffff',
      //   })
        // .setScrollFactor(0)
        // .setDepth(5);
      gameOverText = this.add.text(320, 150, 'GAME OVER', { fontSize: '50px', color: '#ffffff', fontStyle: 'bold' })
        .setScrollFactor(0)
        .setDepth(5);
      gameOverText.setOrigin(0.5, 0.5); // Center the text
      gameOverText.setShadow(2, 2, '#000000', 4); // Add shadow for better visibility
      gameOverText.visible = false;
      this.anims.create({
        key: 'jump',
        frames: [{ key: 'playerJumpSprite' }, { key: 'playerSprite' }],
        frameRate: 10,
        repeat: 0
      });
      this.anims.create({
        key: 'left',
        frames: [{ key: 'playerLeftSprite' }],
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({
        key: 'right',
        frames: [{ key: 'playerRightSprite' }],
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({
        key: 'turn',
        frames: [{ key: 'playerSprite' }],
        frameRate: 20,
        repeat: 0,
      });
      this.anims.create({
        key: 'playerIdle',
        frames: this.anims.generateFrameNames('playerAnims', {
          start: 4,
          end: 5,
        }),
        frameRate: 10,
        repeat: -1,
        yoyo: true,
      });
      this.anims.create({
        key: 'playerRight',
        frames: this.anims.generateFrameNames('playerAnims', {
          start: 0,
          end: 3,
        }),
        frameRate: 10,
        repeat: -1,
        yoyo: true,
      });
      this.anims.create({
        key: 'playerLeftJump',
        frames: this.anims.generateFrameNames('playerLeftAnims', {
          start: 1,
          end: 3,
        }),
        frameRate: 10,
        repeat: -1,
        yoyo: true,
      });
      this.anims.create({
        key: 'playerGameOver',
        frames: [{ key: 'playerGameOver0' }, { key: 'playerGameOver2' }, { key: 'playerGameOver1' }],
        frameRate: 5,
        repeat: -1,
      });
      this.anims.create({
        key: 'enemy',
        frames: 'enemyAnims',
        frameRate: 10,
        repeat: -1,
        yoyo: true,
      });
      // Sounds
      // @ts-ignore
      this.bgdMusic = this.sound.add('bgdMusic');
      // @ts-ignore
      this.jumpSound = this.sound.add('jumpSound');
      // @ts-ignore
      this.eatSound = this.sound.add('eatSound');
      // @ts-ignore
      this.gameOverSound = this.sound.add('gameOverSound');
      bgdMusicConfig = {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: true,
        delay: 0
      };
      // @ts-ignore
      this.bgdMusic.play(bgdMusicConfig);
      createPlayer(this.physics);
      createPlatforms(this.physics);
      createEnemies(this.physics);
      createBall(this.physics);
      createMissiles(this.physics);
      
      // Start player idle animation after a short delay to ensure animation system is ready
      this.time.delayedCall(100, () => {
        console.log('🏃 [MONAD JUMP] Starting player idle animation...');
        if (player && player.anims) {
          try {
            player.anims.play('playerIdle', true);
            console.log('✅ [MONAD JUMP] Player idle animation started successfully');
          } catch (e) {
            console.log('❌ [MONAD JUMP] Player idle animation not ready yet:', e);
          }
        }
        const totalTime = performance.now() - componentStartTime;
        console.log('🎮 [MONAD JUMP] GAME FULLY READY AND PLAYABLE! 🚀');
        console.log(`⏱️ [MONAD JUMP] TOTAL LOADING TIME: ${totalTime.toFixed(2)}ms`);
        setGameLoading(false); // Hide loading screen when game is ready
      });
      
      // Custom sparkle effect
      (this as any).sparkleGroup = this.add.group();
      (this as any).createSparkle = (x: number, y: number) => {
        const sparkle = this.add.graphics();
        
        // Random colors: white, yellow, cyan
        const colors = [0xffffff, 0xffff00, 0x00ffff, 0xff00ff];
        const color = colors[Phaser.Math.Between(0, colors.length - 1)];
        sparkle.fillStyle(color, 1);
        
        // Create different shapes randomly
        const shapeType = Phaser.Math.Between(0, 2);
        if (shapeType === 0) {
          // Star shape (diamond)
          sparkle.fillTriangle(0, -6, -4, 0, 0, 6);
          sparkle.fillTriangle(0, -6, 4, 0, 0, 6);
        } else if (shapeType === 1) {
          // Circle
          sparkle.fillCircle(0, 0, 4);
        } else {
          // Cross shape
          sparkle.fillRect(-1, -5, 2, 10);
          sparkle.fillRect(-5, -1, 10, 2);
        }
        
        sparkle.x = x + Phaser.Math.Between(-15, 15);
        sparkle.y = y + Phaser.Math.Between(-5, 5);
        sparkle.setScale(0.3);
        
        // Sparkles spread in all directions (full 360 degrees)
        const angle = Phaser.Math.Between(0, 360);
        const speed = Phaser.Math.Between(60, 150);
        const vx = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
        const vy = Math.sin(Phaser.Math.DegToRad(angle)) * speed;
        
        (this as any).sparkleGroup.add(sparkle);
        
        // Add rotation to sparkles
        const rotationSpeed = Phaser.Math.Between(-360, 360);
        
        this.tweens.add({
          targets: sparkle,
          x: sparkle.x + vx,
          y: sparkle.y + vy,
          rotation: Phaser.Math.DegToRad(rotationSpeed),
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: Phaser.Math.Between(1200, 1500),
          ease: 'Power2',
          onComplete: () => {
            sparkle.destroy();
          }
        });
      };
      
      // Create destruction effect function
      (this as any).createDestructionEffect = (x: number, y: number) => {
        // Create debris particles
        for (let i = 0; i < 12; i++) {
          const debris = this.add.graphics();
          
          // Random colors for debris (browns, grays, dark colors)
          const colors = [0x8B4513, 0x654321, 0x696969, 0x808080, 0x5D4E37];
          const color = colors[Phaser.Math.Between(0, colors.length - 1)];
          debris.fillStyle(color, 1);
          
          // Create different debris shapes
          const shapeType = Phaser.Math.Between(0, 2);
          if (shapeType === 0) {
            // Square debris
            debris.fillRect(-3, -3, 6, 6);
          } else if (shapeType === 1) {
            // Rectangle debris
            debris.fillRect(-4, -2, 8, 4);
          } else {
            // Triangle debris
            debris.fillTriangle(-4, 3, 0, -4, 4, 3);
          }
          
          debris.x = x + Phaser.Math.Between(-20, 20);
          debris.y = y + Phaser.Math.Between(-10, 10);
          debris.setScale(Phaser.Math.Between(0.5, 1.2));
          
          // Debris flies in all directions
          const angle = Phaser.Math.Between(0, 360);
          const speed = Phaser.Math.Between(100, 250);
          const vx = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
          const vy = Math.sin(Phaser.Math.DegToRad(angle)) * speed;
          
          // Add gravity effect to debris
          const rotationSpeed = Phaser.Math.Between(-720, 720);
          
          this.tweens.add({
            targets: debris,
            x: debris.x + vx,
            y: debris.y + vy + 100, // Add gravity effect
            rotation: Phaser.Math.DegToRad(rotationSpeed),
            scaleX: 0.1,
            scaleY: 0.1,
            alpha: 0,
            duration: Phaser.Math.Between(800, 1200),
            ease: 'Power2',
            onComplete: () => {
              debris.destroy();
            }
          });
        }
        
        // Create dust cloud effect
        for (let i = 0; i < 8; i++) {
          const dust = this.add.graphics();
          dust.fillStyle(0xD2B48C, 0.6); // Light brown dust
          dust.fillCircle(0, 0, Phaser.Math.Between(4, 8));
          
          dust.x = x + Phaser.Math.Between(-25, 25);
          dust.y = y + Phaser.Math.Between(-15, 15);
          
          this.tweens.add({
            targets: dust,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: Phaser.Math.Between(600, 1000),
            ease: 'Power2',
            onComplete: () => {
              dust.destroy();
            }
          });
        }
      };
      
      this.physics.add.collider(player, platforms, (playerObj: any, platformObj: any) => {
        if (platformObj.body.touching.up && playerObj.body.touching.down) {
          // Check if it's a destructive platform and player is landing on top
          if (platformObj.platformType === 'destructive') {
            // Add shake effect before disappearing
            const originalX = platformObj.x;
            const originalY = platformObj.y;
            
            // Shake the platform
            this.tweens.add({
              targets: platformObj,
              x: originalX + Phaser.Math.Between(-3, 3),
              y: originalY + Phaser.Math.Between(-2, 2),
              duration: 50,
              yoyo: true,
              repeat: 6, // Shake 4 times total
              onComplete: () => {
                // Reset position and then make it disappear
                platformObj.x = originalX;
                platformObj.y = originalY;
                
                // Create destruction animation with particles
                (this as any).createDestructionEffect(platformObj.x, platformObj.y);
                
                platformObj.setVisible(false);
                platformObj.body.enable = false; // Disable collision
              }
            });
          }
          
          // Dynamic jump speed based on difficulty
          const currentDiff = getDifficulty(Math.max(0, score - scorePenalty));
          
          // Set normal jump velocity
          player.setVelocityY(-550);
          
          // Apply dynamic gravity based on difficulty for faster landing
          let gravityMultiplier;
          switch (currentDiff) {
            case 'easy':
              gravityMultiplier = 1.0; // Normal gravity
              break;
            case 'normal':
              gravityMultiplier = 1.2; // 20% faster falling
              break;
            case 'hard':
              gravityMultiplier = 1.4; // 40% faster falling
              break;
            case 'extreme':
              gravityMultiplier = 1.6; // 60% faster falling
              break;
            default:
              gravityMultiplier = 1.0;
          }
          player.body.setGravityY(600 * (gravityMultiplier - 1)); // Additional gravity
          
          // @ts-ignore
          this.jumpSound.play();
          // Sparkle effect from the player's feet - Create only 5 sparkles for better performance
          for (let i = 0; i < 5; i++) {
            (this as any).createSparkle(player.x, player.y + player.displayHeight / 2);
          }
        }
      });
      this.physics.add.collider(platforms, platforms, (collider: any) => {
        collider.x = Phaser.Math.Between(0, 640);
        collider.refreshBody();
      });
      this.physics.add.collider(player, enemies, (_: any, enemy: any) => {
        if (enemy.enemyType === 'enemy2') return; // Ignore collision with enemy2
        enemy.anims.stop();
        player.anims.play('playerIdle', true);
        // player.setTint('0xff0000')
        // @ts-ignore
        this.bgdMusic.stop();
        // @ts-ignore
        this.gameOverSound.play();
        gameOver = true;
        gameOverOverlay.visible = true; // Show blur overlay
        // Hide Phaser text elements (we'll show them in React)
        gameOverText.visible = false;
        timerText.visible = false;
        finalScoreText.visible = false;
        maxScoreText.visible = false;
        // Calculate game over data
        const displayScore = Math.max(0, score - scorePenalty);
        const minutes = Math.floor(gameTimer / 60);
        const seconds = gameTimer % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const prevMaxScore = parseInt(localStorage.getItem('maxScore') || '0'); // Capture BEFORE updating
        // Pass data to React state
        setGameOverData({
          score: displayScore,
          time: formattedTime,
          bestScore: Math.max(displayScore, prevMaxScore),
          previousBestScore: prevMaxScore
        });
        setGameOver(true); // Set React state for blur effect
        setShowRestartBtn(true);
        // Submit score to leaderboard
        const playerData = getPlayerData(context);
        submitScore(playerData.fid, playerData.username, playerData.pfpUrl, displayScore, 'Monad Jump', {
          time: formattedTime
        }).then(result => {
          if (result.success) {
            console.log('Score submitted successfully:', result.data);
          } else {
            console.log('Failed to submit score:', result.error);
          }
        }).catch(error => {
          console.error('Error submitting score:', error);
        });
        // Now update localStorage if needed
        if (displayScore > prevMaxScore) {
          localStorage.setItem('maxScore', displayScore.toString());
          setBestScore(displayScore);
        }
        player.body.allowGravity = true;
        player.setVelocityY(600);
        player.body.checkCollision.none = true;
        player.body.setVelocityX(0);
        player.body.moves = true;
        player.body.immovable = false;
        player.body.enable = true;
        player.setCollideWorldBounds(false);
      });
      this.physics.add.collider(platforms, enemies, (collider: any) => {
        collider.x = Phaser.Math.Between(0, 640);
        collider.refreshBody();
      });
      this.physics.add.collider(player, ball, (playerObj: any, ballObj: any) => {
        if (ballObj.body.touching && playerObj.body.touching) {
          ballObj.disableBody(true, true);
          score += 100;
          scoreText.setText('Score: ' + score);
          
          // Dynamic super jump speed based on difficulty for food collection
          const currentDiff = getDifficulty(Math.max(0, score - scorePenalty));
          
          // Set normal super jump velocity
          player.setVelocityY(-1000);
          
          // Apply same dynamic gravity for food collection
          let gravityMultiplier;
          switch (currentDiff) {
            case 'easy':
              gravityMultiplier = 1.0; // Normal gravity
              break;
            case 'normal':
              gravityMultiplier = 1.2; // 20% faster falling
              break;
            case 'hard':
              gravityMultiplier = 1.4; // 40% faster falling
              break;
            case 'extreme':
              gravityMultiplier = 1.6; // 60% faster falling
              break;
            default:
              gravityMultiplier = 1.0;
          }
          player.body.setGravityY(600 * (gravityMultiplier - 1)); // Additional gravity
          
          // @ts-ignore
          this.eatSound.play();
        }
      });
      this.physics.add.collider(platforms, ball, (collider: any) => {
        collider.x = Phaser.Math.Between(0, 640);
        collider.refreshBody();
      });
      this.physics.add.collider(enemies, ball, (collider: any) => {
        collider.x = Phaser.Math.Between(0, 640);
        collider.refreshBody();
      });
      this.physics.add.collider(player, missiles, (playerObj: any, missileObj: any) => {
        missileObj.destroy();
        // Add penalty instead of directly reducing score
        scorePenalty += 200;
        // Update displayed score immediately
        const displayScore = Math.max(0, score - scorePenalty);
        scoreText.setText('Score: ' + displayScore);
        // Flash player red briefly
        player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
          player.clearTint();
        });
      });
      this.cameras.main.startFollow(player, false, 0, 1);
      createKeys(this.input.keyboard!);

      // Store enemy shooting timer
      (this as any).enemyShootTimer = 0;
      
      // Define createMissile function on the scene
      (this as any).createMissile = (enemyX: number, enemyY: number) => {
        // Fire 1 missile towards player within 60-degree cone
        const missile = this.add.graphics();
        missile.fillStyle(0xff0000, 1); // Red color
        missile.fillRect(-2, -8, 4, 16); // Vertical rectangle
        missile.x = enemyX;
        missile.y = enemyY;
        
        // Add physics body
        this.physics.world.enable(missile);
        if (missile.body) {
          (missile.body as Phaser.Physics.Arcade.Body).setSize(4, 16);
          (missile.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        }
        
        // Calculate angle towards player
        let targetAngle = Phaser.Math.Angle.Between(enemyX, enemyY, player.x, player.y);
        targetAngle = Phaser.Math.RadToDeg(targetAngle);
        
        // Constrain angle to 60-degree cone towards bottom (60° to 120°)
        const minAngle = 60;
        const maxAngle = 120;
        const finalAngle = Phaser.Math.Clamp(targetAngle, minAngle, maxAngle);
        
        const speed = 200;
        if (missile.body) {
          (missile.body as Phaser.Physics.Arcade.Body).setVelocity(
            Math.cos(Phaser.Math.DegToRad(finalAngle)) * speed,
            Math.sin(Phaser.Math.DegToRad(finalAngle)) * speed
          );
        }
        
        missiles.add(missile);
        
        // Remove missile after 3 seconds
        this.time.delayedCall(3000, () => {
          if (missile && missile.active) {
            missile.destroy();
          }
        });
      };

      // Timer text (hidden during gameplay, shown on game over)
      timerText = this.add.text(320, 220, 'Time: 00:00', {
        fontSize: '24px',
        color: '#ffff00', // Yellow color for timer
        fontStyle: 'bold'
      });
      timerText.setOrigin(0.5, 0.5); // Center horizontally
      timerText.setDepth(5); // Above overlay
      timerText.setShadow(2, 2, '#000000', 4); // Add shadow for better visibility
      timerText.visible = false; // Hide during gameplay
      
      // Final score text (shown on game over)
      finalScoreText = this.add.text(320, 270, 'Score: 0', {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      finalScoreText.setOrigin(0.5, 0.5);
      finalScoreText.setDepth(5); // Above overlay
      finalScoreText.setShadow(2, 2, '#000000', 4); // Add shadow for better visibility
      finalScoreText.visible = false;
      
      // Max score text (shown on game over)
      maxScoreText = this.add.text(320, 320, 'Best: 0', {
        fontSize: '24px',
        color: '#ffd700', // Gold color for best score
        fontStyle: 'bold'
      });
      maxScoreText.setOrigin(0.5, 0.5);
      maxScoreText.setDepth(5); // Above overlay
      maxScoreText.setShadow(2, 2, '#000000', 4); // Add shadow for better visibility
      maxScoreText.visible = false;
      
      // Game over blur overlay - handled with CSS blur on the game container
      // Keep a light overlay for contrast
      gameOverOverlay = this.add.graphics();
      gameOverOverlay.fillStyle(0x000000, 0.2); // Very light semi-transparent
      gameOverOverlay.fillRect(0, 0, 640, window.innerHeight);
      gameOverOverlay.setScrollFactor(0);
      gameOverOverlay.setDepth(3); // Behind text but above game
      gameOverOverlay.visible = false;
      
      scoreText.setScrollFactor(0);
      // scoreMax.setScrollFactor(0);
      timerText.setScrollFactor(0);
      gameOverText.setScrollFactor(0);
      finalScoreText.setScrollFactor(0);
      maxScoreText.setScrollFactor(0);
    }

    function update(this: Phaser.Scene) {
      if (gameOver) {
        // Move clouds upward with parallax and fade out
        if ((this as any).clouds) {
          (this as any).clouds.getChildren().forEach((cloud: any, i: number) => {
            cloud.y -= 1.5 + i * 0.7; // Parallax: each cloud moves at a different speed
            cloud.alpha = Math.max(0.2, cloud.alpha - 0.004); // Fade out clouds, min 0.2
          });
        }
        // Fade out and rotate player as they fall
        if (player) {
          player.alpha = Math.max(0.3, player.alpha - 0.01); // min 0.3
          player.angle += 2; // Rotate for effect
        }
      }
      // Scroll tileSprite background with camera
      const bgTile = (this as any).bgTile;
      if (bgTile) {
        bgTile.tilePositionY = this.cameras.main.scrollY;
      }
      if (gameOver) return;
      
      // Update timer (but keep it hidden during gameplay)
      if (!gameOver) {
        gameTimer = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(gameTimer / 60);
        const seconds = gameTimer % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerText.setText(`Time: ${formattedTime}`);
      }
      
      // Update background music speed based on difficulty
      if ((this as any).bgdMusic && !gameOver) {
        const currentDiff = getDifficulty(Math.max(0, score - scorePenalty));
        let musicSpeed;
        switch (currentDiff) {
          case 'easy':
            musicSpeed = 1.0; // Normal speed
            break;
          case 'normal':
            musicSpeed = 1.15; // 15% faster
            break;
          case 'hard':
            musicSpeed = 1.3; // 30% faster
            break;
          case 'extreme':
            musicSpeed = 1.5; // 50% faster
            break;
          default:
            musicSpeed = 1.0;
        }
        (this as any).bgdMusic.setRate(musicSpeed);
        
        // Update background based on difficulty with smooth transitions
        let targetBgTexture;
        switch (currentDiff) {
          case 'easy':
            targetBgTexture = 'background';
            break;
          case 'normal':
            targetBgTexture = 'background1';
            break;
          case 'hard':
            targetBgTexture = 'background2';
            break;
          case 'extreme':
            targetBgTexture = 'background3';
            break;
          default:
            targetBgTexture = 'background';
        }
        
        // Smooth background transition
        if (targetBgTexture !== (this as any).currentBgTexture && !(this as any).bgTransitioning) {
          (this as any).bgTransitioning = true;
          const bgTile = (this as any).bgTile;
          
          // Fade out current background
          this.tweens.add({
            targets: bgTile,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
              // Change texture and fade back in
              bgTile.setTexture(targetBgTexture);
              (this as any).currentBgTexture = targetBgTexture;
              this.tweens.add({
                targets: bgTile,
                alpha: 1,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                  (this as any).bgTransitioning = false;
                }
              });
            }
          });
        }
      }
      
      // Get current difficulty and speed multiplier
      const playerDiff = getDifficulty(Math.max(0, score - scorePenalty));
      const speedMultiplier = getPlayerSpeedMultiplier(playerDiff);
      
      if (controlMode === 'button') {
        if (buttonDirectionRef.current === -1) {
          player.setVelocityX(-350 * speedMultiplier);
          player.anims.play('playerLeftJump', true);
        } else if (buttonDirectionRef.current === 1) {
          player.setVelocityX(350 * speedMultiplier);
          player.anims.play('playerRight', true);
        } else {
          player.setVelocityX(0);
          player.anims.play('playerIdle', true);
        }
      } else if (controlMode === 'tilt') {
        if (Math.abs(tiltXRef.current) > 5) {
          player.setVelocityX(tiltXRef.current * 15 * speedMultiplier);
          if (tiltXRef.current < 0) {
            player.anims.play('playerLeftJump', true);
          } else {
            player.anims.play('playerRight', true);
          }
        } else {
          player.setVelocityX(0);
          player.anims.play('playerIdle', true);
        }
      }
      // Wrap horizontally
      if (player.x < 0) {
        player.x = 640;
      } else if (player.x > 640) {
        player.x = 0;
      }
      newPlatforms();
      newEnemies();
      newSnack();
      
      // Move invisible platforms
      platforms.children.iterate((platform: any) => {
        if (platform.platformType === 'invisible' && platform.isMoving) {
          // Move platform horizontally using stored properties
          platform.x += platform.moveDirection * platform.moveSpeed * 0.016; // 60fps timing
          
          // Check if platform has moved too far from start position
          const distanceFromStart = Math.abs(platform.x - platform.startX);
          if (distanceFromStart >= platform.moveDistance) {
            // Reverse direction
            platform.moveDirection *= -1;
            // Clamp position to exact distance
            platform.x = platform.startX + (platform.moveDirection * platform.moveDistance * -1);
          }
          
          // Keep platform within screen bounds
          if (platform.x < 50) {
            platform.x = 50;
            platform.moveDirection = 1;
          } else if (platform.x > 590) {
            platform.x = 590;
            platform.moveDirection = -1;
          }
          
          // Update physics body position
          platform.body.x = platform.x - platform.body.width / 2;
        }
        return null; // Required for iterate callback
      });
      
      // Enemy shooting logic
      const currentDiff = getDifficulty(Math.max(0, score - scorePenalty));
      // Adjust shooting frequency based on difficulty
      let shootingInterval;
      let enemyDelay;
      switch (currentDiff) {
        case 'easy':
          shootingInterval = 4000; // 4 seconds between shots
          enemyDelay = 8000; // 8 seconds delay before shooting
          break;
        case 'normal':
          shootingInterval = 3000; // 3 seconds between shots
          enemyDelay = 6000; // 6 seconds delay before shooting
          break;
        case 'hard':
          shootingInterval = 2000; // 2 seconds between shots
          enemyDelay = 4000; // 4 seconds delay before shooting
          break;
        case 'extreme':
          shootingInterval = 1500; // 1.5 seconds between shots
          enemyDelay = 2000; // 2 seconds delay before shooting
          break;
        default:
          shootingInterval = 4000;
          enemyDelay = 8000;
      }
      
      (this as any).enemyShootTimer += 16; // Assuming 60fps, add ~16ms per frame
      if ((this as any).enemyShootTimer > shootingInterval) {
        (this as any).enemyShootTimer = 0;
        // Make each enemy shoot a missile if they've been alive for 5+ seconds
        enemies.children.iterate((enemy: any) => {
          if (enemy.active && enemy.visible && enemy.creationTime) {
            // Check if enemy has been alive for the required delay
            if (Date.now() - enemy.creationTime >= enemyDelay) {
              (this as any).createMissile(enemy.x, enemy.y);
            }
          }
          return null; // Required for iterate callback
        });
      }
      
      checkIfFall(this.physics);
      updateScore();
    }

    function createPlayer(physics: Phaser.Physics.Arcade.ArcadePhysics) {
      player = physics.add.sprite(325, -100, 'playerAnims');
      player.setBounce(0, 1);
      player.setVelocityY(-300);
      player.body.setSize(56, 90);
      player.body.setOffset(-2, 0);
      player.setDepth(10);
    }

    function createPlatforms(physics: Phaser.Physics.Arcade.ArcadePhysics) {
      platforms = physics.add.staticGroup();
      // First platform in the center
      let lastX = 325;
      let lastY = 0;
      platforms.create(lastX, lastY, 'platform'); // First platform is always normal
      for (let i = 1; i < 13; i++) {
        // More challenging: randomize X fully within bounds
        const x = Phaser.Math.Between(80, 640 - 80);
        const y = lastY - Phaser.Math.Between(100, 150);
        
        // Randomly choose platform type
        const currentDiff = getDifficulty(Math.max(0, score - scorePenalty));
        const probabilities = getPlatformProbabilities(currentDiff);
        const platformType = Phaser.Math.Between(1, 100);
        let platformTexture;
        if (platformType <= probabilities.normal) {
          platformTexture = 'platform'; // 60% normal platforms
        } else if (platformType <= probabilities.normal + probabilities.destructive) {
          platformTexture = 'destructive'; // 20% destructive platforms
        } else {
          platformTexture = 'invisible'; // 20% invisible platforms
        }
        
        const platform = platforms.create(x, y, platformTexture);
        
        // Set properties for different platform types
        if (platformTexture === 'invisible') {
          platform.setAlpha(0.3);
          platform.platformType = 'invisible';
          
          // Add moving behavior to invisible platforms
          // Dynamic speed based on difficulty
          const currentDiff = getDifficulty(Math.max(0, score - scorePenalty));
          let baseSpeed, speedRange;
          switch (currentDiff) {
            case 'easy':
              baseSpeed = 50; speedRange = 100; // 50-150 speed
              break;
            case 'normal':
              baseSpeed = 80; speedRange = 120; // 80-200 speed
              break;
            case 'hard':
              baseSpeed = 120; speedRange = 150; // 120-270 speed
              break;
            case 'extreme':
              baseSpeed = 180; speedRange = 170; // 180-350 speed
              break;
            default:
              baseSpeed = 50; speedRange = 100;
          }
          const moveSpeed = Phaser.Math.Between(baseSpeed, baseSpeed + speedRange);
          const moveDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1; // Random direction
          const moveDistance = Phaser.Math.Between(100, 200); // Random distance
          
          // Store movement properties
          platform.moveSpeed = moveSpeed;
          platform.moveDirection = moveDirection;
          platform.moveDistance = moveDistance;
          platform.startX = platform.x;
          platform.isMoving = true;
          
        } else if (platformTexture === 'destructive') {
          platform.setAlpha(1);
          platform.platformType = 'destructive';
        } else {
          platform.setAlpha(1);
          platform.platformType = 'normal';
        }
        
        // Re-enable the platform if it was disabled (from destructive)
        platform.setVisible(true);
        platform.body.enable = true;
        
        platform.x = x;
        platform.y = y;
        platform.refreshBody();
        lastX = x;
        lastY = y;
      }
      platforms.children.iterate(function (platform: any) {
        platform.body.checkCollision.down = false;
        platform.body.checkCollision.left = false;
        platform.body.checkCollision.right = false;
        return null;
      });
    }

    function createEnemies(physics: Phaser.Physics.Arcade.ArcadePhysics) {
      enemies = physics.add.group();
      // Randomly choose enemy type
      const enemyType = Phaser.Math.Between(1, 2) === 1 ? 'enemy' : 'enemy2';
      const newEnemy = enemies.create(Phaser.Math.Between(0, 640), Phaser.Math.Between(-1350, -1800), enemyType);
      newEnemy.enemyType = enemyType;
      enemies.children.iterate(function (enemy: any) {
        // Apply different sizes based on enemy type
        if (enemy.enemyType === 'enemy2') {
          enemy.setScale(0.2); // Reduce enemy2 size by 75%
          enemy.body.setSize(15, 15); // Adjusted for 25% of original size
          enemy.body.setOffset(12, 2); // Adjusted offset
        } else {
          // Keep enemy (original) at current size
          enemy.body.setSize(60, 60);
          enemy.body.setOffset(50, 10);
        }
        enemy.body.setAllowGravity(false);
        // Play animation based on enemy type
        if (enemy.enemyType === 'enemy') {
          enemy.anims.play('enemy');
        }
        // enemy2 is a GIF, so no animation needed
        // Set creation time for 5-second delay before shooting
        enemy.creationTime = Date.now();
        return null;
      });
    }

    function createBall(physics: Phaser.Physics.Arcade.ArcadePhysics) {
      ball = physics.add.group();
                      // Randomly choose between ball and ball2 (50/50 chance)
                const ballType = Math.random() < 0.5 ? 'ball' : 'ball2';
                const newBall = ball.create(Phaser.Math.Between(0, 640), Phaser.Math.Between(-450, -980), ballType);
                
                // Set scale based on ball type
                if (ballType === 'ball2') {
                  newBall.setScale(0.2); // 80% reduction = 20% of original size
                }
                // ball (original) keeps its default size - no scaling needed
                
      ball.children.iterate(function (balls: any) {
        balls.body.setSize(30, 30);
        balls.body.setAllowGravity(false);
        return null;
      });
    }

    function createMissiles(physics: Phaser.Physics.Arcade.ArcadePhysics) {
      missiles = physics.add.group();
      // Missiles will be created dynamically by enemies
    }

    function createKeys(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
      leftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT, true, true);
      rightKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT, true, true);
    }

    function newPlatforms() {
      let minY = 0;
      let lastX = null;
      let lastY = null;
      platforms.children.iterate(function (platform: any) {
        if (platform.y < minY) {
          minY = platform.y;
          lastX = platform.x;
          lastY = platform.y;
        }
        return null;
      });
      platforms.children.iterate(function (platform: any) {
        if (platform.y > player.y && player.body.center.distance(platform.body.center) > 700) {
          // More challenging: randomize X fully within bounds
          const x = Phaser.Math.Between(80, 640 - 80);
          const y = minY - Phaser.Math.Between(100, 150);
          
          platform.x = x;
          platform.y = y;
          
          // Only change platform type occasionally to reduce lag
          if (Phaser.Math.Between(1, 5) === 1) { // 20% chance to change type
            const currentDiff = getDifficulty(Math.max(0, score - scorePenalty));
            const probabilities = getPlatformProbabilities(currentDiff);
            const platformType = Phaser.Math.Between(1, 100);
            let platformTexture;
            if (platformType <= probabilities.normal) {
              platformTexture = 'platform'; // 60% normal platforms
            } else if (platformType <= probabilities.normal + probabilities.destructive) {
              platformTexture = 'destructive'; // 20% destructive platforms
            } else {
              platformTexture = 'invisible'; // 20% invisible platforms
            }
            
            platform.setTexture(platformTexture);
            
            // Set properties for different platform types
            if (platformTexture === 'invisible') {
              platform.setAlpha(0.3);
              platform.platformType = 'invisible';
            } else if (platformTexture === 'destructive') {
              platform.setAlpha(1);
              platform.platformType = 'destructive';
            } else {
              platform.setAlpha(1);
              platform.platformType = 'normal';
            }
          }
          
          // Always re-enable platform if it was disabled
          if (!platform.visible || !platform.body.enable) {
            platform.setVisible(true);
            platform.body.enable = true;
          }
          
          platform.refreshBody();
          lastX = x;
          minY = y;
        }
        return null;
      });
    }

    function newEnemies() {
      enemies.children.iterate(function (enemy: any) {
        if (enemy.y > player.y && player.body.center.distance(enemy.body.center) > 700) {
          // Randomly choose enemy type when respawning
          const enemyType = Phaser.Math.Between(1, 2) === 1 ? 'enemy' : 'enemy2';
          enemy.setTexture(enemyType);
          enemy.enemyType = enemyType;
          enemy.x = Phaser.Math.Between(0, 640);
          enemy.y = enemy.y - Phaser.Math.Between(1600, 2000);
          enemy.enableBody(true, enemy.x, enemy.y, true, true);
          // Apply different sizes based on enemy type
          if (enemy.enemyType === 'enemy2') {
            enemy.setScale(0.25); // Reduce enemy2 size by 75%
            enemy.body.setSize(15, 15); // Adjusted for 25% of original size
            enemy.body.setOffset(12, 2); // Adjusted offset
          } else {
            // Keep enemy (original) at current size
            enemy.setScale(1.0); // Reset to normal scale
            enemy.body.setSize(60, 60);
            enemy.body.setOffset(50, 10);
          }
          // Play animation based on enemy type
          if (enemy.enemyType === 'enemy') {
            enemy.anims.play('enemy');
          }
          // enemy2 is a GIF, so no animation needed
          // Reset creation time for 5-second delay before shooting
          enemy.creationTime = Date.now();
        }
        return null;
      });
    }

    function newSnack() {
      ball.children.iterate(function (ball: any) {
        if (ball.y > player.y && player.body.center.distance(ball.body.center) > 700) {
          // Randomly choose new ball type when respawning
          const ballType = Math.random() < 0.5 ? 'ball' : 'ball2';
          ball.setTexture(ballType);
          
          // Set scale based on ball type
          if (ballType === 'ball2') {
            ball.setScale(0.2); // 80% reduction = 20% of original size
          } else {
            ball.setScale(1.0); // Original ball keeps default size
          }
          
          ball.x = Phaser.Math.Between(0, 640);
          ball.y = ball.y - Phaser.Math.Between(1600, 2000);
          ball.enableBody(true, ball.x, ball.y, true, true);
        }
        return null;
      });
    }

    function checkIfFall(physics: Phaser.Physics.Arcade.ArcadePhysics) {
      if (player.body.y > gameOverDistance) {
        gameOver = true;
        gameOverOverlay.visible = true; // Show blur overlay
        
        // Hide Phaser text elements (we'll show them in React)
        gameOverText.visible = false;
        timerText.visible = false;
        finalScoreText.visible = false;
        maxScoreText.visible = false;
        
        // Calculate game over data
        const displayScore = Math.max(0, score - scorePenalty);
        const minutes = Math.floor(gameTimer / 60);
        const seconds = gameTimer % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const prevMaxScore = parseInt(localStorage.getItem('maxScore') || '0'); // Capture BEFORE updating
        // Pass data to React state
        setGameOverData({
          score: displayScore,
          time: formattedTime,
          bestScore: Math.max(displayScore, prevMaxScore),
          previousBestScore: prevMaxScore
        });
        setGameOver(true); // Set React state for blur effect
        setShowRestartBtn(true);
        
        // Submit score to leaderboard
        const playerData = getPlayerData(context);
        submitScore(playerData.fid, playerData.username, playerData.pfpUrl, displayScore, 'Monad Jump', {
          time: formattedTime
        }).then(result => {
          if (result.success) {
            console.log('Score submitted successfully:', result.data);
          } else {
            console.log('Failed to submit score:', result.error);
          }
        }).catch(error => {
          console.error('Error submitting score:', error);
        });
        // Now update localStorage if needed
        if (displayScore > prevMaxScore) {
          localStorage.setItem('maxScore', displayScore.toString());
          setBestScore(displayScore);
        }
        player.anims.play('playerIdle', true);
        player.body.allowGravity = true;
        player.setVelocityY(600);
        player.body.checkCollision.none = true;
        player.body.setVelocityX(0);
        player.body.moves = true;
        player.body.immovable = false;
        player.body.enable = true;
        player.setCollideWorldBounds(false);
      } else if (player.body.y * -1 - gameOverDistance * -1 > 700) {
        gameOverDistance = player.body.y + 700;
      }
    }

    function updateScore() {
      const currentHeight = Math.floor(player.y * -1 / 20) * 20; // Round to nearest 20 (slower progression)
      if (currentHeight > highestY) {
        const heightDifference = currentHeight - highestY;
        score += Math.floor(heightDifference / 4); // Reduce score increase to 1/4 of height difference
        highestY = currentHeight;
        // Display score minus penalties
        const displayScore = Math.max(0, score - scorePenalty);
        scoreText.setText(displayScore.toString());
      }
    }

    // Set game width dynamically
    const gameWidth = window.innerWidth;

    console.log('⚙️ [MONAD JUMP] Creating Phaser config...');
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: gameWidth ,
      height: window.innerHeight,
      parent: gameRef.current!,
      backgroundColor: '#87CEEB', // Sky blue background - no more black screen!
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 800 },
          debug: false,
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

    console.log('🎮 [MONAD JUMP] Creating new Phaser.Game instance...');
    const startTime = performance.now();
    phaserGameRef.current = new Phaser.Game(config);
    const endTime = performance.now();
    console.log(`⚡ [MONAD JUMP] Phaser.Game created in ${(endTime - startTime).toFixed(2)}ms`);

    // Apply background color to canvas immediately
    setTimeout(() => {
      console.log('🎨 [MONAD JUMP] Looking for canvas element...');
      const canvas = gameRef.current?.querySelector('canvas');
      if (canvas) {
        console.log('✅ [MONAD JUMP] Canvas found! Applying background color...');
        canvas.style.backgroundColor = '#87CEEB';
        console.log('🎨 [MONAD JUMP] Canvas background color applied');
      } else {
        console.log('❌ [MONAD JUMP] Canvas not found yet');
      }
    }, 0);

   

    // Responsive resize
    function handleResize() {
      phaserGameRef.current?.scale.resize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      console.log('🧹 [MONAD JUMP] Cleaning up component...');
      window.removeEventListener('resize', handleResize);
      phaserGameRef.current?.destroy(true);
      phaserGameRef.current = null;
      console.log('✅ [MONAD JUMP] Component cleanup completed');
    };
  }, [gameKey, controlMode]);

  // In useEffect for device orientation, only set tiltXRef if in tilt mode
  useEffect(() => {
    function handleOrientation(event: DeviceOrientationEvent) {
      if (controlMode === 'tilt') {
        tiltXRef.current = event.gamma ?? 0;
      }
    }
    if (controlMode === 'tilt') {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [controlMode]);

  // In update function (inside Phaser scene), set player velocity based on controlMode
  // If controlMode === 'button', use buttonDirection to set velocity
  // If controlMode === 'tilt', use tiltXRef.current as before

  useEffect(() => {
    if (controlMode !== 'button' || !gameRef.current) return;
    // Try to get the Phaser canvas inside the container
    const canvas = gameRef.current.querySelector('canvas');
    const el = canvas || gameRef.current;

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length > 0) {
        const x = e.touches[0].clientX;
        console.log('touchstart', x, window.innerWidth);
        if (x < window.innerWidth / 2) {
          buttonDirectionRef.current = -1;
        } else {
          buttonDirectionRef.current = 1;
        }
      }
    }
    function handleTouchEnd() {
      console.log('touchend');
      buttonDirectionRef.current = 0;
    }
    function handleMouseDown(e: MouseEvent) {
      const x = e.clientX;
      console.log('mousedown', x, window.innerWidth);
      if (x < window.innerWidth / 2) {
        buttonDirectionRef.current = -1;
      } else {
        buttonDirectionRef.current = 1;
      }
    }
    function handleMouseUp() {
      console.log('mouseup');
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
  }, [controlMode, gameRef.current, gameKey]);

  
  // Inside the component, add the reward claim logic:
  const handleClaimReward = async () => {
    try {
      const rewardType = claimedReward?.type as RewardToken;
      const amount = claimedReward?.amount;
      if (!rewardType || amount == null) throw new Error('No reward selected');
      const decimals = getTokenDecimals(rewardType);
      const amountInt = parseUnits(amount.toString(), decimals).toString();
      const playerData = getPlayerData(context);
      const userAddress = address || '';
      const res = await fetchWithVerification('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          tokenAddress: getTokenAddress(rewardType),
          amount: amountInt,
          tokenName: rewardType,
          name: playerData.username,
          pfpUrl: playerData.pfpUrl,
          score: gameOverData.score,
          fid: playerData.fid,
          game: 'Monad Jump'
        })
      });
      if (res.status === 403) {
        setShowGiftModal(false);
        // alert('Score verification failed. Please refresh and try again.');
        return;
      }
      if (!res.ok) throw new Error('Failed to get signature');
      const { signature } = await res.json();
      switchChain({ chainId: monadTestnet.id })
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
      // error handled by wagmi
    }
  };

  // Function to open the gift modal and set reward
  const openGiftModal = () => {
    const rewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)] as RewardToken;
    const amount = getRandomValue(rewardType);
    setClaimedReward({ type: rewardType, amount });
    setShowGiftModal(true);
  };

  // Show gift modal when new high score is achieved
  useEffect(() => {
    if (
      gameOver &&
      gameOverData.score > 0 &&
      gameOverData.bestScore > gameOverData.previousBestScore
    ) {
      openGiftModal();
    } else {
      setShowGiftModal(false);
    }
  }, [gameOver, gameOverData]);

  // Show submit score modal if not a new high score
  useEffect(() => {
    if (
      gameOver &&
      gameOverData.score > 0 &&
      gameOverData.bestScore === gameOverData.previousBestScore // not a new high score
    ) {
      setShowSubmitScoreModal(true);
    } else {
      setShowSubmitScoreModal(false);
    }
  }, [gameOver, gameOverData]);

  // Automatically submit score when modal is shown, but delay by 2 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (showSubmitScoreModal) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSubmitScoreModal]);

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

  

  const handleRestart = () => {
    setShowRestartBtn(false);
    setGameOver(false);
    setGameOverData({ score: 0, time: '00:00', bestScore: 0, previousBestScore: 0 });
    setAnimatedScore(0);
    setGameLoading(true);
    phaserGameRef.current?.destroy(true);
    phaserGameRef.current = null;
    setGameKey((k) => k + 1);
    setShowSubmitScoreModal(false);
    resetSubmitScore();
  };

  const requestOrientationPermission = () => {
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
  };

  console.log('🎬 [MONAD JUMP] Component rendering JSX...');
  
  // Render pre-game mode selection if controlMode is null
  if (controlMode === null) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: '#46a6ce', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '20px',paddingTop: '100px'
      }}>
        <h2 style={{ color: 'white', fontSize: 32, marginBottom: 24 }}>Control Mode</h2>
        <button
          style={{
            fontSize: 17,
            margin: 12,
            padding: '10px', // extra left padding for icon
            borderRadius: 8,
            height: '200px',
            width: '200px',
            textAlign: 'center',
            border: '1px solid #ffffff',
            color: '#ffffff',
            background: "#87CEEB url('/images/tilt.png') no-repeat  center / 200px 200px"
          }}
          onClick={() => setControlMode('tilt')}
        >
           Sensor
        </button>
        <button
          style={{
            fontSize: 17,
            margin: 12,
            padding: '10px', // extra left padding for icon
            borderRadius: 8,
            height: '200px',
            width: '200px',
            textAlign: 'center',
            border: '1px solid #ffffff',
            objectFit: 'none',
            color: '#ffffff',
            background: "#87CEEB url('/images/leftright.png') no-repeat  center / 200px 200px"
          }}
          onClick={() => setControlMode('button')}
        >
          Touch
        </button>
      </div>
    );
  }

  // Render left/right buttons at the bottom if in button mode
  {controlMode === 'button' && !gameOver && (
    <div style={{ position: 'fixed', bottom: 24, left: 0, width: '100vw', display: 'flex', justifyContent: 'center', zIndex: 2000 }}>
      <button style={{ fontSize: 36, margin: '0 32px', width: 80, height: 80, borderRadius: 40 }}
        onTouchStart={() => buttonDirectionRef.current = -1} onTouchEnd={() => buttonDirectionRef.current = 0} onMouseDown={() => buttonDirectionRef.current = -1} onMouseUp={() => buttonDirectionRef.current = 0}>
        ◀
      </button>
      <button style={{ fontSize: 36, margin: '0 32px', width: 80, height: 80, borderRadius: 40 }}
        onTouchStart={() => buttonDirectionRef.current = 1} onTouchEnd={() => buttonDirectionRef.current = 0} onMouseDown={() => buttonDirectionRef.current = 1} onMouseUp={() => buttonDirectionRef.current = 0}>
        ▶
      </button>
    </div>
  )}
  
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
      
      {gameLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#46a6ce',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          overflow: 'hidden'
        }}>
          <img
            src="/images/jump/playersnip.png"
            alt="Player"
            style={{
              position: 'absolute',
              left: 'calc(50% - 20px)', // center horizontally (image width is 120px)
              // width: '120px',
              // height: '120px',
              animation: 'fall-spin 2.5s linear infinite'
            }}
          />
        </div>
      )}
      
      {gameOver && (
        <>
          {/* Back to Games Button - Top Left */}
          <button
            style={{
              position: 'fixed',
              top: '5px',
              left: '0px',
              zIndex: 2100,
              padding: '8px 16px',
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onClick={onBack}
          >
◀ Games
          </button>
          
          {/* Game Over Content */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            pointerEvents: 'none' // Allow clicks to pass through except for button
          }}>
            {/* Game Over Text */}
            <h1 style={{
              fontSize: '50px',
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              margin: '0 0 5px 0',
              textAlign: 'center'
            }}>
              GAME OVER
            </h1>
             {/* Submission status for non-high score */}
            {gameOverData.score > 0 && gameOverData.bestScore === gameOverData.previousBestScore && (
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
                      ? 'transparent'
                      : submitScoreError
                        ? 'transparent'
                        : 'transparent',
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
                    ? '1.5px solid #7be87b'
                    : submitScoreError
                      ? '1.5px solid #ffb3b3'
                      : '1.5px solid #e0e0f0',
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
                    <span>Storing score on blockchain...</span>
                    <span style={{fontSize: 12, color: '#fff'}}>Confirm Transaction</span>
                    </div>
                 
                  </div>
                )}
              </div>
            )}
               {/* Current Score */}
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
                  ? `\n\n🔥 That's +${Math.round(((gameOverData.score - gameOverData.previousBestScore) / gameOverData.previousBestScore) * 100)}% improvement from my Highest Score!`
                  : '';
                
                const shareText = `🎮 Just scored ${gameOverData.score} in ${gameOverData.time.split(':')[0]}m ${gameOverData.time.split(':')[1]}s in Hop up! 🚀${improvementText}\n\nCan you beat my score?`;
                
                // Get player data for dynamic image
                const playerData = getPlayerData(context);
                
                // Create dynamic share URL with score data
                const shareParams = new URLSearchParams({
                  score: gameOverData.score.toString(),
                  time: gameOverData.time,
                  gameType: 'vertical-jump',
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
                {gameOverData.time.split(':')[0]}m {gameOverData.time.split(':')[1]}s
              </div>
            </button>
            
           
            
            {/* Timer */}
            
            
         
            
            {/* Best Score */}
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
            🏆 Best
              <p style={{ fontSize: '29px', fontWeight: 'bold', color: '#ffff00', margin: '3px 0 0 0' }}>{gameOverData.bestScore}</p>
            </div>
          </div>
        </>
      )}

      {showRestartBtn && (
        <button
          style={{ 
            position: 'fixed', 
            bottom: '50px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 2000,
            padding: '10px 20px',
            fontSize: '20px',
            fontWeight: 'bold',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.5s ease',
            pointerEvents: 'auto' // Enable clicks for button
          }}
                     onMouseEnter={(e) => {
             e.currentTarget.style.backgroundColor = '#45a049';
             e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
           }}
           onMouseLeave={(e) => {
             e.currentTarget.style.backgroundColor = '#4CAF50';
             e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
           }}
          onClick={handleRestart}
        >
         ▶ Play Again 
        </button>
      )}
      {/* <div style={{ position: 'absolute', top: 10, right: 20, zIndex: 2001, color: '#FFD700', fontWeight: 700, fontSize: 22 }}>
         Best: {bestScore}
      </div> */}
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
          const rewardType = claimedReward?.type || "MON";
          const amount = claimedReward?.amount || 0;
          // Build share URL with reward details
            const playerData = getPlayerData(context); // <-- Add this line
            console.log(gameOverData);
            const improvementText = gameOverData.score > gameOverData.previousBestScore && gameOverData.previousBestScore > 0 ? `+${Math.round(((gameOverData.score - gameOverData.previousBestScore) / gameOverData.previousBestScore) * 100)}% from best` : '';

            
            const shareParams = new URLSearchParams({
                  score: gameOverData.score.toString(),
                  time: gameOverData.time,
                  gameType: 'vertical-jump',
                  ...(playerData.username && { username: playerData.username }),
                  ...(playerData.pfpUrl && { userImg: playerData.pfpUrl }),
                });
          const shareUrl = `${APP_URL}?${shareParams.toString()}`;
          const shareText = `🎁 I just claimed a reward: ${amount} ${rewardType} and scored ${gameOverData.score} in ${gameOverData.time.split(':')[0]}m ${gameOverData.time.split(':')[1]}s in Hop up ! 🚀\n\n${improvementText}\n\nCan you beat my score? in Monad Realm!\n\nPlay and win your own rewards!`;
          await actions.composeCast({
            text: shareText,
            embeds: [shareUrl],
          });
        }}
      />
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
          filter: gameOver ? 'blur(3px)' : 'none',
          transition: 'filter 0.5s ease',
          display: gameLoading ? 'none' : 'block' // Hide game container while loading
        }} 
      />
      
      {/* Add CSS animations */}
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
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  )
  }
