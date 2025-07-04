'use client'
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

export default function StickmanArcherGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [showRestartBtn, setShowRestartBtn] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [gameReady, setGameReady] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverData, setGameOverData] = useState({ 
    result: '', 
    score: 0, 
    level: 1, 
    kills: 0,
    accuracy: 0
  });

  const handleRestart = () => {
    setShowRestartBtn(false);
    setGameReady(false);
    setGameOver(false);
    setGameOverData({ result: '', score: 0, level: 1, kills: 0, accuracy: 0 });
    phaserGameRef.current?.destroy(true);
    phaserGameRef.current = null;
    setGameKey((k) => k + 1);
  };

  useEffect(() => {
    if (!gameRef.current) return;
    if (phaserGameRef.current) return;

    // Game variables
    let scene: Phaser.Scene;
    let player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    let enemies: Phaser.Physics.Arcade.Group;
    let arrows: Phaser.Physics.Arcade.Group;
    let enemyArrows: Phaser.Physics.Arcade.Group;
    let terrain: Phaser.Physics.Arcade.StaticGroup;
    let trajectory: Phaser.GameObjects.Graphics;
    let aimLine: Phaser.GameObjects.Graphics;
    let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    let spacebar: Phaser.Input.Keyboard.Key;
    let mousePointer: Phaser.Input.Pointer | null = null;
    
    // Game state
    let score = 0;
    let level = 1;
    let kills = 0;
    let arrowsShot = 0;
    let gameState = 'aiming';
    let power = 0;
    let angle = 0;
    let chargingPower = false;
    let enemyShootTimer = 0;
    let currentEnemyIndex = 0;
    let enemiesAlive = 0;
    let windForce = 0;
    
    // UI elements
    let scoreText: Phaser.GameObjects.Text;
    let levelText: Phaser.GameObjects.Text;
    let killsText: Phaser.GameObjects.Text;
    let powerText: Phaser.GameObjects.Text;
    let angleText: Phaser.GameObjects.Text;
    let windText: Phaser.GameObjects.Text;
    let instructionText: Phaser.GameObjects.Text;
    let gameOverText: Phaser.GameObjects.Text;
    let finalStatsText: Phaser.GameObjects.Text;

    function preload(this: Phaser.Scene) {
      const graphics = this.add.graphics();
      
      // Create player archer (blue stickman)
      graphics.fillStyle(0x0066CC);
      graphics.fillCircle(15, 8, 6);
      graphics.fillRect(13, 14, 4, 20);
      graphics.fillRect(8, 20, 14, 2);
      graphics.fillRect(11, 34, 3, 16);
      graphics.fillRect(16, 34, 3, 16);
      graphics.generateTexture('player', 30, 50);
      
      // Create enemy archer (red stickman)
      graphics.clear();
      graphics.fillStyle(0xCC0000);
      graphics.fillCircle(15, 8, 6);
      graphics.fillRect(13, 14, 4, 20);
      graphics.fillRect(8, 20, 14, 2);
      graphics.fillRect(11, 34, 3, 16);
      graphics.fillRect(16, 34, 3, 16);
      graphics.generateTexture('enemy', 30, 50);
      
      // Create arrow
      graphics.clear();
      graphics.fillStyle(0x8B4513);
      graphics.fillRect(0, 4, 20, 2);
      graphics.fillStyle(0x654321);
      graphics.fillTriangle(20, 5, 25, 3, 25, 7);
      graphics.generateTexture('arrow', 25, 10);
      
      // Create terrain blocks
      graphics.clear();
      graphics.fillStyle(0x4CAF50);
      graphics.fillRect(0, 0, 60, 60);
      graphics.fillStyle(0x2E7D32);
      graphics.fillRect(0, 0, 60, 10);
      graphics.generateTexture('terrain', 60, 60);
      
      // Create ground
      graphics.clear();
      graphics.fillStyle(0x4CAF50);
      graphics.fillRect(0, 0, 800, 40);
      graphics.fillStyle(0x2E7D32);
      graphics.fillRect(0, 0, 800, 10);
      graphics.generateTexture('ground', 800, 40);
      
      // Create hill
      graphics.clear();
      graphics.fillStyle(0x4CAF50);
      graphics.fillCircle(100, 100, 100);
      graphics.fillStyle(0x2E7D32);
      graphics.fillCircle(100, 90, 100);
      graphics.generateTexture('hill', 200, 200);
      
      graphics.destroy();
    }

    function create(this: Phaser.Scene) {
      scene = this;
      
      // Set world bounds
      this.physics.world.setBounds(0, 0, 800, 1000);
      
      // Create sky background
      this.add.rectangle(400, 500, 800, 1000, 0x87CEEB);
      
      // Create terrain
      terrain = this.physics.add.staticGroup();
      
      // Ground at bottom for player
      terrain.create(400, 980, 'ground').setScale(1, 1).refreshBody();
      
      // Top platform for enemies
      terrain.create(400, 50, 'ground').setScale(1, 0.5).refreshBody();
      
      // Random terrain generation for middle area
      createTerrain();
      
      // Create player at bottom center
      player = this.physics.add.sprite(400, 900, 'player');
      player.setCollideWorldBounds(true);
      player.body.setGravityY(800);
      player.setScale(1.2);
      
      // Create enemy group
      enemies = this.physics.add.group();
      
      // Create arrow groups
      arrows = this.physics.add.group({
        defaultKey: 'arrow',
        maxSize: 20
      });
      
      enemyArrows = this.physics.add.group({
        defaultKey: 'arrow',
        maxSize: 20
      });
      
      // Create graphics
      trajectory = this.add.graphics();
      trajectory.setDepth(10);
      
      aimLine = this.add.graphics();
      aimLine.setDepth(11);
      
      // Physics collisions
      this.physics.add.collider(player, terrain);
      this.physics.add.collider(enemies, terrain);
      this.physics.add.collider(arrows, terrain, (arrow) => {
        const arrowSprite = arrow as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        arrowSprite.body.setVelocity(0, 0);
        arrowSprite.setRotation(arrowSprite.rotation + Math.PI/2);
      });
      this.physics.add.collider(enemyArrows, terrain);
      
      // Combat collisions
      this.physics.add.overlap(arrows, enemies, (arrow, enemy) => {
        const arrowSprite = arrow as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        const enemySprite = enemy as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        
        // Enemy death animation
        enemySprite.setVelocity(arrowSprite.body.velocity.x * 0.3, -200);
        enemySprite.setAngularVelocity(300);
        enemySprite.setTint(0x666666);
        
        // Remove after animation
        scene.time.delayedCall(2000, () => {
          enemySprite.destroy();
        });
        
        arrowSprite.destroy();
        kills++;
        score += 100;
        enemiesAlive--;
        
        if (enemiesAlive <= 0) {
          levelComplete();
        } else {
          gameState = 'enemyTurn';
          enemyShootTimer = 0;
        }
        
        updateUI();
      });
      
      // Player hit by enemy arrow
      this.physics.add.overlap(enemyArrows, player, (arrow, playerSprite) => {
        const arrowSprite = arrow as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        const playerSpriteTyped = playerSprite as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        
        // Player death animation
        playerSpriteTyped.setVelocity(arrowSprite.body.velocity.x * 0.3, -200);
        playerSpriteTyped.setAngularVelocity(300);
        playerSpriteTyped.setTint(0x666666);
        
        arrowSprite.destroy();
        gameState = 'gameOver';
        
        scene.time.delayedCall(2000, () => {
          endGame('defeat');
        });
      });
      
      // Input
      cursors = this.input.keyboard.createCursorKeys();
      spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      
      // Mouse input for aiming
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (gameState === 'aiming') {
          mousePointer = pointer;
          updateAiming();
        }
      });
      
      // Create UI
      scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '20px', color: '#000' });
      levelText = this.add.text(16, 40, 'Level: 1', { fontSize: '20px', color: '#000' });
      killsText = this.add.text(16, 64, 'Kills: 0', { fontSize: '20px', color: '#000' });
      powerText = this.add.text(16, 88, 'Power: 0%', { fontSize: '20px', color: '#000' });
      angleText = this.add.text(16, 112, 'Angle: 0°', { fontSize: '20px', color: '#000' });
      windText = this.add.text(16, 136, 'Wind: 0', { fontSize: '20px', color: '#000' });
      
      instructionText = this.add.text(400, 950, 'Move mouse to aim upward, SPACE to charge power, release to shoot!', {
        fontSize: '16px',
        color: '#000',
        align: 'center'
      }).setOrigin(0.5);
      
      gameOverText = this.add.text(400, 500, 'GAME OVER', {
        fontSize: '48px',
        color: '#FF0000',
        fontStyle: 'bold'
      }).setOrigin(0.5).setVisible(false);
      
      finalStatsText = this.add.text(400, 580, '', {
        fontSize: '24px',
        color: '#000',
        align: 'center'
      }).setOrigin(0.5).setVisible(false);
      
      // Start first level
      startLevel();
      setGameReady(true);
    }

    function update(this: Phaser.Scene) {
      if (gameState === 'aiming') {
        // Power charging
        if (spacebar.isDown && !chargingPower) {
          chargingPower = true;
          power = 0;
        }
        
        if (chargingPower) {
          power += 2;
          if (power > 100) power = 100;
        }
        
        if (spacebar.isUp && chargingPower) {
          shootArrow();
          chargingPower = false;
          power = 0;
        }
        
        updateAiming();
        updateUI();
      } else if (gameState === 'enemyTurn') {
        updateEnemyTurn();
      }
    }

    function createTerrain() {
      // Create varied terrain in middle area for cover
      for (let i = 0; i < 12; i++) {
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(200, 800);
        const scale = Phaser.Math.FloatBetween(0.4, 1.0);
        terrain.create(x, y, 'terrain').setScale(scale).refreshBody();
      }
      
      // Create floating platforms
      for (let i = 0; i < 4; i++) {
        const x = Phaser.Math.Between(150, 650);
        const y = Phaser.Math.Between(300, 700);
        terrain.create(x, y, 'hill').setScale(0.6).refreshBody();
      }
    }

    function startLevel() {
      // Clear previous enemies
      enemies.clear(true, true);
      
      // Generate random wind (horizontal wind for vertical shooting)
      windForce = Phaser.Math.Between(-2, 2);
      
      // Create enemies based on level at top of screen
      const numEnemies = Math.min(2 + level, 6);
      enemiesAlive = numEnemies;
      
      for (let i = 0; i < numEnemies; i++) {
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(80, 200);
        
        const enemy = enemies.create(x, y, 'enemy');
        enemy.body.setGravityY(800);
        enemy.setScale(1.2);
        enemy.setCollideWorldBounds(true);
        enemy.setFlipY(true); // Flip enemies to face downward
      }
      
      gameState = 'aiming';
      updateUI();
    }

    function updateAiming() {
      if (!mousePointer) return;
      
      const dx = mousePointer.x - player.x;
      const dy = mousePointer.y - (player.y - 20);
      angle = Math.atan2(dy, dx);
      
      // Constrain angle for vertical shooting upward only
      angle = Phaser.Math.Clamp(angle, -Math.PI * 0.9, -Math.PI * 0.1);
      
      // Draw aim line
      aimLine.clear();
      aimLine.lineStyle(3, 0xFF0000, 0.7);
      aimLine.moveTo(player.x, player.y - 20);
      aimLine.lineTo(player.x + Math.cos(angle) * 60, player.y - 20 + Math.sin(angle) * 60);
      aimLine.strokePath();
      
      // Draw trajectory if charging
      if (chargingPower) {
        drawTrajectory();
      } else {
        trajectory.clear();
      }
    }

    function drawTrajectory() {
      trajectory.clear();
      trajectory.lineStyle(2, 0x00FF00, 0.6);
      
      const velocity = power * 8;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      for (let t = 0; t < 5; t += 0.1) {
        const newX = player.x + vx * t + windForce * t * t * 3;
        const newY = player.y - 20 + vy * t + 0.5 * 800 * t * t;
        
        if (newX > 800 || newY < 0 || newY > 1000) break;
        
        trajectory.fillStyle(0x00FF00, 0.6);
        trajectory.fillCircle(newX, newY, 2);
      }
    }

    function shootArrow() {
      if (power === 0) return;
      
      const arrow = arrows.get(player.x, player.y - 20);
      if (arrow) {
        const arrowSprite = arrow as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        arrowSprite.setActive(true);
        arrowSprite.setVisible(true);
        
        const velocity = power * 8;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        arrowSprite.setVelocity(vx, vy);
        arrowSprite.body.setGravityY(800);
        arrowSprite.setRotation(angle);
        
        // Apply wind effect
        if (windForce !== 0) {
          scene.time.addEvent({
            delay: 100,
            callback: () => {
              if (arrowSprite.active) {
                arrowSprite.body.setVelocityX(arrowSprite.body.velocity.x + windForce * 2);
              }
            },
            repeat: 30
          });
        }
        
        arrowsShot++;
        gameState = 'shooting';
        
        // Clear aiming graphics
        aimLine.clear();
        trajectory.clear();
        
        // Switch to enemy turn after delay
        scene.time.delayedCall(3000, () => {
          if (gameState === 'shooting' && enemiesAlive > 0) {
            gameState = 'enemyTurn';
            enemyShootTimer = 0;
          }
        });
      }
    }

    function updateEnemyTurn() {
      enemyShootTimer++;
      
      if (enemyShootTimer > 120) {
        const aliveEnemies = enemies.children.entries.filter(enemy => enemy.active);
        
        if (aliveEnemies.length > 0) {
          const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)] as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
          shootEnemyArrow(randomEnemy);
        }
        
        enemyShootTimer = 0;
      }
    }

    function shootEnemyArrow(enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
      const arrow = enemyArrows.get(enemy.x, enemy.y + 20);
      if (arrow) {
        const arrowSprite = arrow as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        arrowSprite.setActive(true);
        arrowSprite.setVisible(true);
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const angle = Math.atan2(dy, dx);
        const velocity = Math.min(500, distance * 0.6 + Phaser.Math.Between(-30, 30));
        
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        arrowSprite.setVelocity(vx, vy);
        arrowSprite.body.setGravityY(800);
        arrowSprite.setRotation(angle);
        
        scene.time.delayedCall(4000, () => {
          if (gameState === 'enemyTurn') {
            gameState = 'aiming';
          }
        });
      }
    }

    function levelComplete() {
      gameState = 'levelComplete';
      level++;
      score += 200 * level;
      
      scene.time.delayedCall(2000, () => {
        startLevel();
      });
    }

    function updateUI() {
      scoreText.setText(`Score: ${score}`);
      levelText.setText(`Level: ${level}`);
      killsText.setText(`Kills: ${kills}`);
      powerText.setText(`Power: ${Math.round(power)}%`);
      angleText.setText(`Angle: ${Math.round(angle * 180 / Math.PI)}°`);
      windText.setText(`Wind: ${windForce > 0 ? '→' : windForce < 0 ? '←' : '○'} ${Math.abs(windForce)}`);
    }

    function endGame(result: string) {
      gameState = 'gameOver';
      const accuracy = arrowsShot > 0 ? Math.round((kills / arrowsShot) * 100) : 0;
      
      setGameOverData({
        result: result,
        score: score,
        level: level,
        kills: kills,
        accuracy: accuracy
      });
      
      const resultText = result === 'victory' ? 'VICTORY!' : 'GAME OVER';
      const resultColor = result === 'victory' ? '#00FF00' : '#FF0000';
      
      gameOverText.setText(resultText);
      gameOverText.setColor(resultColor);
      gameOverText.setVisible(true);
      
      finalStatsText.setText(
        `Final Score: ${score}\n` +
        `Level Reached: ${level}\n` +
        `Total Kills: ${kills}\n` +
        `Accuracy: ${accuracy}%`
      ).setVisible(true);
      
      setGameOver(true);
      setShowRestartBtn(true);
    }

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 1000,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    };

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [gameKey]);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-300 to-green-300">
      <div 
        ref={gameRef} 
        className={`w-full h-full ${gameOver ? 'blur-sm' : ''}`}
        style={{ minHeight: '700px' }}
      />
      
      {showRestartBtn && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="bg-white rounded-lg p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">
              {gameOverData.result === 'victory' ? '🎉 Victory!' : '💀 Game Over!'}
            </h2>
            <div className="mb-6 space-y-2">
              <p className="text-lg">Final Score: <span className="font-semibold text-blue-600">{gameOverData.score}</span></p>
              <p className="text-lg">Level Reached: <span className="font-semibold text-green-600">{gameOverData.level}</span></p>
              <p className="text-lg">Total Kills: <span className="font-semibold text-red-600">{gameOverData.kills}</span></p>
              <p className="text-lg">Accuracy: <span className="font-semibold text-purple-600">{gameOverData.accuracy}%</span></p>
            </div>
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🏹 Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 