'use client'
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

export default function VerticalJumperGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [showPermissionBtn, setShowPermissionBtn] = useState(false);
  const [showRestartBtn, setShowRestartBtn] = useState(false);
  const [gameKey, setGameKey] = useState(0); // for remounting Phaser game
  const [gameReady, setGameReady] = useState(false); // Track if game is ready
  const tiltXRef = useRef(0);

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

  // Restart game handler (no reload)
  const handleRestart = () => {
    setShowRestartBtn(false);
    setGameReady(false); // Reset game ready state
    phaserGameRef.current?.destroy(true);
    phaserGameRef.current = null;
    setGameKey((k) => k + 1); // trigger remount
  };

  useEffect(() => {
    if (!gameRef.current) return;
    if (phaserGameRef.current) return;

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

    function preload(this: Phaser.Scene) {
      this.load.image('background', '/images/background.png');
      this.load.image('background1', '/images/background1.png');
      this.load.image('background2', '/images/background2.png');
      this.load.image('background3', '/images/background3.png');
      this.load.image('platform', '/images/game-tiles.png');
      this.load.image('destructive', '/images/game-tiles-destructive.png');
      this.load.image('invisible', '/images/game-tiles-invisible.png');
      // this.load.image('cloud', '/images/cloud.png');
      this.load.image('enemy', '/images/enemy.png');
      this.load.image('ball', '/images/Parsnip.png');
      this.load.image('ball2', '/images/parsnip1.png');
      this.load.image('sparkle', '/images/sparkle.png');
      // this.load.image('playerSprite', 'images/player.png');
      this.load.spritesheet('playerAnims', 'images/player.png', { frameWidth: 72, frameHeight: 90 });
      this.load.spritesheet('playerLeftAnims', 'images/player_left.png', { frameWidth: 72, frameHeight: 90 });
      // this.load.image('playerJumpSprite', 'images/player_jump.png');
      // this.load.image('playerLeftSprite', 'images/player_left_jump.png');
      // this.load.image('playerRightSprite', 'images/player_right_jump.png');
      this.load.spritesheet('enemyAnims', 'images/enemy.png', { frameWidth: 161, frameHeight: 95 });
      this.load.image('enemy2', 'images/enemy2.gif');
      this.load.audio('bgdMusic', '/assets/bgdMusic.mp3');
      this.load.audio('eatSound', '/assets/eatSound.mp3');
      this.load.audio('jumpSound', '/assets/jumpSound.mp3');
      this.load.audio('gameOverSound', '/assets/gameOverSound.mp3');
    }

    function create(this: Phaser.Scene) {
      // Remove previous bg logic, use tileSprite
      // Create background with smooth transitions
      const bg = this.add.tileSprite(0, 0, 640, window.innerHeight * 2, 'background').setOrigin(0, 0);
      bg.setScrollFactor(0);
      (this as any).bgTile = bg;
      (this as any).currentBgTexture = 'background';
      (this as any).bgTransitioning = false;
      scoreText = this.add
        .text(20, 60, 'score: 0', { fontSize: '32px', color: '#fff' })
        .setScrollFactor(0)
        .setDepth(5);
      scoreMax = this.add
        .text(20, 80, `Max Score: ${localStorage.getItem('maxScore') || 0}`, {
          fontSize: '18px',
          color: '#ffffff',
        })
        .setScrollFactor(0)
        .setDepth(5);
      gameOverText = this.add.text(150, 300, 'GAME OVER ', { fontSize: '64px', color: '#fff' })
        .setScrollFactor(0)
        .setDepth(5);
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
        if (player && player.anims) {
          try {
            player.anims.play('playerIdle', true);
          } catch (e) {
            console.log('Player idle animation not ready yet');
          }
        }
        // Set game as ready after everything is initialized
        setGameReady(true);
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
          player.body.setGravityY(500 * (gravityMultiplier - 1)); // Additional gravity
          
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
        enemy.anims.stop();
        player.anims.play('playerIdle', true);
        // player.setTint('0xff0000')
        // @ts-ignore
        this.bgdMusic.stop();
        // @ts-ignore
        this.gameOverSound.play();
        gameOver = true;
        gameOverText.visible = true;
        setShowRestartBtn(true);
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
          player.body.setGravityY(500 * (gravityMultiplier - 1)); // Additional gravity
          
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

      // Timer text at the top center
      timerText = this.add.text(320, 20, 'Time: 00:00', {
        fontSize: '20px',
        color: '#ffff00', // Yellow color for timer
      });
      timerText.setOrigin(0.5, 0); // Center horizontally
      
      scoreText.setScrollFactor(0);
      scoreMax.setScrollFactor(0);
      timerText.setScrollFactor(0);
      gameOverText.setScrollFactor(0);
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
      
      // Update timer
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
      
      if (Math.abs(tiltXRef.current) > 5) {
        player.setVelocityX(tiltXRef.current * 15 * speedMultiplier);
        if (tiltXRef.current < 0) {
          player.anims.play('playerLeftJump', true);
        } else {
          player.anims.play('playerRight', true);
        }
      } else {
        if (leftKey.isDown && !rightKey.isDown) {
          player.setVelocityX(-350 * speedMultiplier);
          player.anims.play('playerLeftJump', true);
        } else if (rightKey.isDown && !leftKey.isDown) {
          player.setVelocityX(350 * speedMultiplier);
          player.anims.play('playerRight', true);
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
        const x = Phaser.Math.Between(60, 580);
        const y = lastY - Phaser.Math.Between(120, 200);
        
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
          const x = Phaser.Math.Between(60, 580);
          const y = minY - Phaser.Math.Between(120, 200);
          
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
        gameOverText.visible = true;
        setShowRestartBtn(true);
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
        scoreText.setText('Score: ' + displayScore);
      }
      storeMaxScore();
    }

    function storeMaxScore() {
      const displayScore = Math.max(0, score - scorePenalty);
      if (parseInt(localStorage.getItem('maxScore') || '0') < displayScore) {
        localStorage.setItem('maxScore', displayScore.toString());
        scoreMax.setText(`Max Score: ${localStorage.getItem('maxScore')}`);
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 640,
      height: window.innerHeight,
      parent: gameRef.current!,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 500 },
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
  }, [gameKey]);

  return (
    <>
      {!gameReady && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 50%, #f3f4f6 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{ textAlign: 'center', color: '#374151' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Monad Jump</h1>
            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#6b7280' }}>Initializing game...</p>
            
            {/* Spinner */}
            <div style={{ 
              width: '64px', 
              height: '64px', 
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 2rem'
            }}></div>
            
            {/* Progress Bar */}
            <div style={{ 
              width: '320px', 
              height: '8px', 
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              margin: '0 auto 2rem',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: '4px',
                animation: 'pulse 2s ease-in-out infinite'
              }}></div>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Loading assets and preparing game...</p>
          </div>
        </div>
      )}
      
      {showPermissionBtn && (
        <button
          style={{ position: 'absolute', top: 20, right: 20, zIndex: 2000 }}
          onClick={requestOrientationPermission}
        >
          Enable Tilt Controls
        </button>
      )}
      {showRestartBtn && (
        <button
          style={{ position: 'absolute', top: 100, right: 20, zIndex: 2000 }}
          onClick={handleRestart}
        >
          Restart Game
        </button>
      )}
      <div key={gameKey} ref={gameRef} style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000 }} />
      
      {/* Add CSS animations */}
      <style jsx>{`
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
  );
} 