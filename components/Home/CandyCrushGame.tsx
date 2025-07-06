'use client'

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Phaser from 'phaser';
import { APP_URL } from '@/lib/constants';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { submitScore, getPlayerData } from '@/lib/leaderboard';

interface CandyCrushGameProps {
  onBack?: () => void;
}

export default function CandyCrushGame({ onBack }: CandyCrushGameProps) {
  const { context, actions } = useMiniAppContext();
  const gameRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [gameInitialized, setGameInitialized] = useState(false);
  const [gameOverState, setGameOverState] = useState(false); // Track game over for blur effect
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(10);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [previousBestScore, setPreviousBestScore] = useState(0);
  
  // Challenge system state
  const [challengeCandyType, setChallengeCandyType] = useState('1');
  const [challengeTarget, setChallengeTarget] = useState(10);
  const [challengeProgress, setChallengeProgress] = useState(0);

  // Score counting animation
  useEffect(() => {
    if (score > 0 && gameOver) {
      setAnimatedScore(0);
      const targetScore = score;
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
  }, [score, gameOver]);

  const handleRestart = () => {
    setGameInitialized(false);
    setGameOver(false);
    setGameOverState(false); // Reset blur state
    setScore(0);
    setLevel(1);
    setMoves(10);
    setChallengeCandyType('1');
    setChallengeTarget(10);
    setChallengeProgress(0);
    setAnimatedScore(0);
    setPreviousBestScore(0);
    
    if (gameRef.current) {
      const existingGame = gameRef.current.querySelector('canvas');
      if (existingGame) {
        existingGame.remove();
      }
      initGame();
    }
  };

  const handleBackToMenu = () => {
    if (onBack) onBack();
  };



  const CANDY_TYPES = ['1', '2', '3', '4', '5', '6'];

  useEffect(() => {
    if (gameRef.current) {
      setGameInitialized(false);
      initGame();
    }
    return () => {
      if (gameRef.current) {
        const canvas = gameRef.current.querySelector('canvas');
        if (canvas) canvas.remove();
      }
    };
  }, []);

  const initGame = () => {
    let scene: Phaser.Scene;
    let grid: any[][] = [];
    let gameScore = 0;
    let gameLevel = level;
    let gameMoves = moves;
    let gameChallengeCandy = challengeCandyType;
    let gameChallengeTarget = challengeTarget;
    let gameChallengeProgress = challengeProgress;

    const GRID_COLS = 6;
    const GRID_ROWS = 8;
    const CANDY_SIZE = 55; // Smaller candy size to create padding
    let CANDY_SPACING = 60; // Will be calculated based on screen width
    const CELL_PADDING = 7; // Padding inside each grid cell
    const GRID_PADDING = 20; // Padding around the entire grid
    let GRID_X = 0; // Will be calculated after scene creation
    const GRID_Y = 150;
    const CANDY_TYPES = ['1', '2', '3', '4', '5', '6'];

    class Candy extends Phaser.GameObjects.Sprite {
      gridX: number;
      gridY: number;
      candyType: string;
      debugBorder: Phaser.GameObjects.Graphics | null = null;

      constructor(scene: Phaser.Scene, x: number, y: number, gridX: number, gridY: number, type: string) {
        super(scene, x, y, 'candy-' + type);
        this.gridX = gridX;
        this.gridY = gridY;
        this.candyType = type;
        
        // Better scaling for crisp images
        this.setDisplaySize(CANDY_SIZE, CANDY_SIZE);
        this.setInteractive();
        scene.add.existing(this);
      }
      
      showCollisionBorder() {
        if (!this.debugBorder) {
          this.debugBorder = this.scene.add.graphics();
        }
        this.debugBorder.clear();
        this.debugBorder.lineStyle(3, 0xff0000, 1);
        this.debugBorder.strokeRect(this.x - CANDY_SIZE/2, this.y - CANDY_SIZE/2, CANDY_SIZE, CANDY_SIZE);
      }
      
      hideCollisionBorder() {
        if (this.debugBorder) {
          this.debugBorder.clear();
        }
      }
      
      destroy() {
        if (this.debugBorder) {
          this.debugBorder.destroy();
        }
        super.destroy();
      }
    }

    function preload(this: Phaser.Scene) {
      // Load all the meme images from candy folder
      CANDY_TYPES.forEach(type => {
        this.load.image('candy-' + type, `/candy/${type}.png`);
      });
      
      // Ensure images maintain quality when loaded
      this.load.on('filecomplete-image', (key: string) => {
        const texture = this.textures.get(key);
        if (texture) {
          // Set high quality filtering for each texture
          texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }
        console.log('✅ Loaded high-quality meme image:', key);
      });
      
      // Log any errors but don't create fallbacks
      this.load.on('loaderror', (file: any) => {
        console.error('❌ Failed to load meme image:', file.key);
      });
    }

    function getMemeColor(type: string): number {
      const colors: { [key: string]: number } = {
        '1': 0xff4444,       // Red
        '2': 0x44ff44,       // Green  
        '3': 0x4444ff,       // Blue
        '4': 0xffff44,       // Yellow
        '5': 0xff44ff,       // Magenta
        '6': 0xff8844        // Orange
      };
      return colors[type] || 0xff0000;
    }

    // UI Text objects - store references so we can update them
    let scoreText: Phaser.GameObjects.Text | null = null;
    let levelText: Phaser.GameObjects.Text | null = null;
    let movesText: Phaser.GameObjects.Text | null = null;
    let challengeLabelText: Phaser.GameObjects.Text | null = null;
    let challengeText: Phaser.GameObjects.Text | null = null;
    let challengeIcon: Phaser.GameObjects.Sprite | null = null;
    let challengeBarBg: Phaser.GameObjects.Graphics | null = null;
    let challengeBarFill: Phaser.GameObjects.Graphics | null = null;
    let statusText: Phaser.GameObjects.Text | null = null;
    let currentProgressBarWidth = 0; // Track animated progress bar width

        function create(this: Phaser.Scene) {
      scene = this;
      
      // Calculate responsive grid dimensions after scene is initialized
      const availableWidth = this.cameras.main.width - (GRID_PADDING * 2);
      CANDY_SPACING = availableWidth / GRID_COLS;
      GRID_X = GRID_PADDING;
      
      // Create grid table lines with rounded corner awareness
      const gridLines = this.add.graphics();
      gridLines.lineStyle(2, 0xffffff, 0.5); // White lines, semi-transparent
      
      const cornerRadius = 15;
      const gridWidth = availableWidth;
      const gridHeight = GRID_ROWS * CANDY_SPACING;
      
      // Draw vertical grid lines (skip corners for rounded effect)
      for (let col = 1; col < GRID_COLS; col++) { // Skip first and last lines
        const x = GRID_X + col * CANDY_SPACING;
        gridLines.moveTo(x, GRID_Y + cornerRadius);
        gridLines.lineTo(x, GRID_Y + gridHeight - cornerRadius);
      }
      
      // Draw horizontal grid lines (skip corners for rounded effect)
      for (let row = 1; row < GRID_ROWS; row++) { // Skip first and last lines
        const y = GRID_Y + row * CANDY_SPACING;
        gridLines.moveTo(GRID_X + cornerRadius, y);
        gridLines.lineTo(GRID_X + gridWidth - cornerRadius, y);
      }
      
      gridLines.strokePath();
      
      initializeGrid();
      setupDragInput();
      
      // Add periodic collision detection for debugging
      this.time.addEvent({
        delay: 2000, // Check every 2 seconds
        callback: () => {
          debugGrid('PERIODIC CHECK');
          validateAndFixGrid();
        },
        loop: true
      });
      
            // Create UI text objects and store references (responsive positioning)
      const screenWidth = this.cameras.main.width;
      const centerX = screenWidth / 2;
      const progressBarWidth = Math.min(screenWidth - 40, 300); // Responsive progress bar width
      
      scoreText = this.add.text(20, 10, 'Score: 0', { fontSize: '20px', color: 'black', fontStyle: 'bold' });
      movesText = this.add.text(screenWidth - 20, 10, 'Moves:10', { fontSize: '20px', color: 'black', fontStyle: 'bold' }).setOrigin(1, 0);
      
      // Level text above progress bar
      levelText = this.add.text(centerX, 40, 'Level: 1', { fontSize: '20px', color: 'black', fontStyle: 'bold' }).setOrigin(0.5, 0);
      
      // Challenge display centered
     
      
      // Challenge progress bar centered
      challengeBarBg = this.add.graphics();
      challengeBarBg.fillStyle(0x333333, 0.3);
      challengeBarBg.fillRect(centerX - progressBarWidth/2, 60, progressBarWidth, 20); // Responsive background bar
      
      challengeBarFill = this.add.graphics();
      challengeBarFill.fillStyle(0x00aa00, 1);
      challengeBarFill.fillRect(centerX - progressBarWidth/2, 60, 0, 20); // Responsive progress fill (starts at 0 width)
      
            // Challenge text below progress bar
        challengeIcon = this.add.sprite(centerX - 40, 102, 'candy-' + gameChallengeCandy);
       challengeIcon.setDisplaySize(35,35); // Small icon size
        challengeText = this.add.text(centerX + 10, 100, '(0/10)', { fontSize: '17px', color: 'black', fontStyle: 'bold' }).setOrigin(0.5, 0);
      
    
      
      // Initialize UI
      updateUI();
    }

    // Function to update both React state and Phaser UI
    function updateUI() {
      // Update React state
      setScore(gameScore);
      setLevel(gameLevel);
      setMoves(gameMoves);
      setChallengeProgress(gameChallengeProgress);
      
      // Update Phaser text objects
      if (scoreText) scoreText.setText(`Score: ${gameScore}`);
      if (levelText) levelText.setText(`Level: ${gameLevel}`);
      if (movesText) movesText.setText(`Moves: ${gameMoves}`);
      // Update challenge display
      
      
      if (challengeText) {
        challengeText.setText(`(${gameChallengeProgress}/${gameChallengeTarget})`);
        
        // Color coding for progress
        if (gameChallengeProgress >= gameChallengeTarget) {
          challengeText.setColor('#00ff00'); // Bright green when complete
        } else if (gameChallengeProgress >= gameChallengeTarget * 0.7) {
          challengeText.setColor('#ffaa00'); // Bright orange when close
        } else {
          challengeText.setColor('#000000'); // White otherwise
        }
      }
      
      // Update challenge icon when candy type changes
      if (challengeIcon) {
        challengeIcon.setTexture('candy-' + gameChallengeCandy);
      }
      
      // Update challenge progress bar with smooth animation
      if (challengeBarFill) {
        const progressPercent = Math.min(gameChallengeProgress / gameChallengeTarget, 1);
        const centerX = scene.cameras.main.width / 2;
        const progressBarWidth = Math.min(scene.cameras.main.width - 40, 300);
        const targetWidth = progressBarWidth * progressPercent;
        
        // Color based on progress
        let barColor = 0x666666; // Gray for no progress
        if (progressPercent >= 1) {
          barColor = 0x00aa00; // Green when complete
        } else if (progressPercent >= 0.7) {
          barColor = 0xff8800; // Orange when close
        } else if (progressPercent > 0) {
          barColor = 0x3498db; // Blue for progress
        }
        
        // Animate the progress bar filling
        scene.tweens.add({
          targets: { width: currentProgressBarWidth },
          width: targetWidth,
          duration: 500, // 500ms smooth animation
          ease: 'Power2.out',
          onUpdate: (tween: any) => {
            currentProgressBarWidth = tween.targets[0].width;
            challengeBarFill!.clear();
            challengeBarFill!.fillStyle(barColor, 1);
            challengeBarFill!.fillRect(centerX - progressBarWidth/2, 60, currentProgressBarWidth, 20);
          },
          onComplete: () => {
            // Add a slight bounce effect when complete
            if (progressPercent >= 1) {
              scene.tweens.add({
                targets: challengeBarFill,
                scaleY: 1.2,
                duration: 150,
                ease: 'Back.out',
                yoyo: true
              });
            }
          }
        });
      }
      
      // Update status based on game state
      if (statusText) {
        if (!isGameStable) {
          statusText.setText('⏳ Processing...');
          statusText.setColor('#ffaa00');
        } else {
          statusText.setText('✅ Ready to play');
          statusText.setColor('#ffffff');
        }
      }
      
      // Check for challenge completion - auto advance to next level
      if (gameChallengeProgress >= gameChallengeTarget) {
        console.log('🎉 Challenge completed! Auto advancing to next level...');
        
        // Increment level and generate new challenge
        gameLevel++;
        
        // Calculate new challenge parameters
        const newChallengeTarget = 10 + (gameLevel - 1) * 5; // Start with 10, add 5 per level
        const newChallengeCandy = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
        
        // Add moves equal to the new challenge target
        gameMoves += newChallengeTarget;
        
        // Apply new challenge
        gameChallengeCandy = newChallengeCandy;
        gameChallengeTarget = newChallengeTarget;
        gameChallengeProgress = 0;
        
        console.log(`🎯 New Level ${gameLevel} Challenge: Match ${gameChallengeTarget} candies of type ${gameChallengeCandy}`);
        console.log(`💪 Bonus moves added: +${newChallengeTarget} (Total moves: ${gameMoves})`);
      }
    }

    function initializeGrid() {
      console.log('🎯 Initializing grid');
      
      // Clear any existing grid state
      grid = [];
      
      for (let row = 0; row < GRID_ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_COLS; col++) {
          const candyType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
          const x = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
          const y = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
          
          const candy = new Candy(scene, x, y, col, row, candyType);
          
          // Ensure position matches grid
          candy.gridX = col;
          candy.gridY = row;
          
          grid[row][col] = candy;
        }
      }
      
      // Validate initial grid state
      console.log('✅ Grid initialized, validating...');
      debugGrid('AFTER INITIALIZATION');
      validateAndFixGrid();
      
      // Game starts in stable state
      isGameStable = true;
      console.log('✅ Game initialized and stable');
      console.log(`🎯 Level ${gameLevel} Challenge: Match ${gameChallengeTarget} candies of type ${gameChallengeCandy}`);
      updateUI();
      
      // Mark game as fully initialized
      setTimeout(() => setGameInitialized(true), 100); // Small delay to ensure rendering
    }

    // Touch/drag variables
    let isDragging = false;
    let dragStartCandy: Candy | null = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let isProcessingSwap = false; // Prevent multiple simultaneous swaps
    let isProcessingCascade = false; // Prevent multiple cascading operations
    let isGameStable = true; // Only allow swaps when game is stable

    function setupDragInput() {
      scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // Only allow input when game is stable
        if (!isGameStable || isProcessingSwap || isProcessingCascade) {
          console.log('🚫 Input blocked - game not stable');
          return;
        }
        
        const candy = getCandyAtPosition(pointer.x, pointer.y);
        if (candy) {
          isDragging = true;
          dragStartCandy = candy;
          dragStartX = pointer.x;
          dragStartY = pointer.y;
          
          // Light vibration feedback when starting to drag
          triggerVibration([30]);
        }
      });

      scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (isDragging && dragStartCandy && gameMoves > 0 && !isProcessingSwap) {
          const deltaX = pointer.x - dragStartX;
          const deltaY = pointer.y - dragStartY;
          const minDragDistance = 25; // Slightly increased for better recognition

          if (Math.abs(deltaX) > minDragDistance || Math.abs(deltaY) > minDragDistance) {
            // Determine swipe direction - only allow one direction
            let targetCol = dragStartCandy.gridX;
            let targetRow = dragStartCandy.gridY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              // Horizontal swipe - only move horizontally
              if (deltaX > 0) {
                targetCol = dragStartCandy.gridX + 1; // Right
              } else {
                targetCol = dragStartCandy.gridX - 1; // Left
              }
            } else {
              // Vertical swipe - only move vertically  
              if (deltaY > 0) {
                targetRow = dragStartCandy.gridY + 1; // Down
              } else {
                targetRow = dragStartCandy.gridY - 1; // Up
              }
            }

            // Validate bounds and ensure target exists
            if (targetCol >= 0 && targetCol < GRID_COLS && 
                targetRow >= 0 && targetRow < GRID_ROWS) {
              const targetCandy = grid[targetRow][targetCol];
              if (targetCandy && areAdjacent(dragStartCandy, targetCandy)) {
                swapCandies(dragStartCandy, targetCandy);
              }
            }
          }
        }

        isDragging = false;
        dragStartCandy = null;
      });
    }

    function getCandyAtPosition(x: number, y: number): Candy | null {
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const candy = grid[row][col];
          if (candy) {
            const candyBounds = candy.getBounds();
            if (candyBounds.contains(x, y)) {
              return candy;
            }
          }
        }
      }
      return null;
    }

    function triggerVibration(pattern: number[]) {
      // Check if vibration is supported
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch (error) {
          console.log('Vibration not supported on this device');
        }
      }
    }

    function areAdjacent(candy1: Candy, candy2: Candy): boolean {
      const dx = Math.abs(candy1.gridX - candy2.gridX);
      const dy = Math.abs(candy1.gridY - candy2.gridY);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    function checkSwapValidity(candy1: Candy, candy2: Candy): boolean {
      // Temporarily perform the swap to check if it creates matches
      const originalCandy1Pos = { gridX: candy1.gridX, gridY: candy1.gridY };
      const originalCandy2Pos = { gridX: candy2.gridX, gridY: candy2.gridY };
      
      // Temporarily swap grid positions
      grid[candy1.gridY][candy1.gridX] = candy2;
      grid[candy2.gridY][candy2.gridX] = candy1;
      
      candy1.gridX = originalCandy2Pos.gridX;
      candy1.gridY = originalCandy2Pos.gridY;
      candy2.gridX = originalCandy1Pos.gridX;
      candy2.gridY = originalCandy1Pos.gridY;
      
      // Check if this creates any matches
      const isValid = checkForMatchesAfterSwap();
      
      // Immediately revert the temporary swap
      grid[candy2.gridY][candy2.gridX] = candy1;
      grid[candy1.gridY][candy1.gridX] = candy2;
      
      candy1.gridX = originalCandy1Pos.gridX;
      candy1.gridY = originalCandy1Pos.gridY;
      candy2.gridX = originalCandy2Pos.gridX;
      candy2.gridY = originalCandy2Pos.gridY;
      
      return isValid;
    }

    function swapCandies(candy1: Candy, candy2: Candy) {
      if (isProcessingSwap || !isGameStable) return; // Prevent simultaneous swaps and ensure stability
      isProcessingSwap = true;
      isGameStable = false; // Mark game as unstable during swap
      updateUI(); // Update status immediately
      
      console.log(`🔄 Checking swap validity for [${candy1.gridY}][${candy1.gridX}] and [${candy2.gridY}][${candy2.gridX}]`);
      
      // Validate positions before any changes
      if (grid[candy1.gridY][candy1.gridX] !== candy1) {
        console.error(`🔴 SWAP ERROR: Candy1 not at expected position [${candy1.gridY}][${candy1.gridX}]`);
        isProcessingSwap = false;
        return;
      }
      if (grid[candy2.gridY][candy2.gridX] !== candy2) {
        console.error(`🔴 SWAP ERROR: Candy2 not at expected position [${candy2.gridY}][${candy2.gridX}]`);
        isProcessingSwap = false;
        return;
      }
      
      // Check if swap is valid BEFORE making any changes
      if (!checkSwapValidity(candy1, candy2)) {
        console.log(`❌ Invalid swap - no matches created, showing revert animation`);
        
        // Store original positions for revert animation
        const originalCandy1 = { x: candy1.x, y: candy1.y };
        const originalCandy2 = { x: candy2.x, y: candy2.y };
        
        // Calculate target positions for the "attempted" swap
        const candy1NewX = GRID_X + candy2.gridX * CANDY_SPACING + CANDY_SPACING / 2;
        const candy1NewY = GRID_Y + candy2.gridY * CANDY_SPACING + CANDY_SPACING / 2;
        const candy2NewX = GRID_X + candy1.gridX * CANDY_SPACING + CANDY_SPACING / 2;
        const candy2NewY = GRID_Y + candy1.gridY * CANDY_SPACING + CANDY_SPACING / 2;
        
        // Animate the "attempted" swap
        scene.tweens.add({
          targets: candy1,
          x: candy1NewX,
          y: candy1NewY,
          duration: 150
        });
        
        scene.tweens.add({
          targets: candy2,
          x: candy2NewX,
          y: candy2NewY,
          duration: 150,
          onComplete: () => {
            // Now animate back to original positions
            triggerVibration([50, 50]); // Double short vibration for invalid swap
            
            scene.tweens.add({
              targets: candy1,
              x: originalCandy1.x,
              y: originalCandy1.y,
              duration: 150,
              ease: 'Back.out'
            });
            
            scene.tweens.add({
              targets: candy2,
              x: originalCandy2.x,
              y: originalCandy2.y,
              duration: 150,
              ease: 'Back.out',
              onComplete: () => {
                isProcessingSwap = false;
                isGameStable = true; // Game is stable again after invalid swap
                console.log('✅ Game stable - invalid swap completed');
                updateUI(); // Update status
              }
            });
          }
        });
        return;
      }
      
      console.log(`✅ Valid swap detected - proceeding with actual swap`);
      
      // Store original positions 
      const originalCandy1 = { gridX: candy1.gridX, gridY: candy1.gridY, x: candy1.x, y: candy1.y };
      const originalCandy2 = { gridX: candy2.gridX, gridY: candy2.gridY, x: candy2.x, y: candy2.y };
      
      // Now perform the actual swap (we know it's valid)
      grid[candy1.gridY][candy1.gridX] = candy2;
      grid[candy2.gridY][candy2.gridX] = candy1;
      
      candy1.gridX = candy2.gridX;
      candy1.gridY = candy2.gridY;
      candy2.gridX = originalCandy1.gridX;
      candy2.gridY = originalCandy1.gridY;
      
      const candy1NewX = GRID_X + candy1.gridX * CANDY_SPACING + CANDY_SPACING / 2;
      const candy1NewY = GRID_Y + candy1.gridY * CANDY_SPACING + CANDY_SPACING / 2;
      const candy2NewX = GRID_X + candy2.gridX * CANDY_SPACING + CANDY_SPACING / 2;
      const candy2NewY = GRID_Y + candy2.gridY * CANDY_SPACING + CANDY_SPACING / 2;
      
      // Animate the swap
      scene.tweens.add({
        targets: candy1,
        x: candy1NewX,
        y: candy1NewY,
        duration: 200
      });
      
      scene.tweens.add({
        targets: candy2,
        x: candy2NewX,
        y: candy2NewY,
        duration: 200,
        onComplete: () => {
          debugGrid('AFTER VALID SWAP ANIMATION');
          
          // We already know this creates matches, so proceed directly
          triggerVibration([100]); // Short vibration for successful swap
          gameMoves--;
          updateUI();
          debugGrid('BEFORE MATCH CHECK');
          checkForMatches();
          isProcessingSwap = false; // Clear flag after successful swap
          // Note: isGameStable will be set to true after all cascading completes
        }
      });
    }



    function showInvalidMoveEffect() {
      // Create a brief "X" or "Invalid" text effect
      const centerX = scene.cameras.main.width / 2;
      const centerY = scene.cameras.main.height / 2;
      const invalidText = scene.add.text(centerX, centerY, '❌', {
        fontSize: '48px',
        color: '#ffffff'
      }).setOrigin(0.5).setAlpha(0);
      
      scene.tweens.add({
        targets: invalidText,
        alpha: 1,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        onComplete: () => invalidText.destroy()
      });
    }

    function checkForMatchesAfterSwap(): boolean {
      // Same logic as checkForMatches but only returns true/false
      const matches: Candy[] = [];
      
      // Check horizontal matches
      for (let row = 0; row < GRID_ROWS; row++) {
        let count = 1;
        let currentType = grid[row][0]?.candyType;
        
        for (let col = 1; col < GRID_COLS; col++) {
          if (grid[row][col]?.candyType === currentType && currentType) {
            count++;
          } else {
            if (count >= 3) {
              for (let i = col - count; i < col; i++) {
                if (!matches.includes(grid[row][i])) {
                  matches.push(grid[row][i]);
                }
              }
            }
            count = 1;
            currentType = grid[row][col]?.candyType;
          }
        }
        
        if (count >= 3) {
          for (let i = GRID_COLS - count; i < GRID_COLS; i++) {
            if (!matches.includes(grid[row][i])) {
              matches.push(grid[row][i]);
            }
          }
        }
      }
      
      // Check vertical matches
      for (let col = 0; col < GRID_COLS; col++) {
        let count = 1;
        let currentType = grid[0][col]?.candyType;
        
        for (let row = 1; row < GRID_ROWS; row++) {
          if (grid[row][col]?.candyType === currentType && currentType) {
            count++;
          } else {
            if (count >= 3) {
              for (let i = row - count; i < row; i++) {
                if (!matches.includes(grid[i][col])) {
                  matches.push(grid[i][col]);
                }
              }
            }
            count = 1;
            currentType = grid[row][col]?.candyType;
          }
        }
        
        if (count >= 3) {
          for (let i = GRID_ROWS - count; i < GRID_ROWS; i++) {
            if (!matches.includes(grid[i][col])) {
              matches.push(grid[i][col]);
            }
          }
        }
      }
      
      return matches.length > 0;
    }

    function checkForMatches() {
      const matches: Candy[] = [];
      
      // Check horizontal matches
      for (let row = 0; row < GRID_ROWS; row++) {
        let count = 1;
        let currentType = grid[row][0]?.candyType;
        
        for (let col = 1; col < GRID_COLS; col++) {
          if (grid[row][col]?.candyType === currentType && currentType) {
            count++;
          } else {
            if (count >= 3) {
              for (let i = col - count; i < col; i++) {
                matches.push(grid[row][i]);
              }
            }
            count = 1;
            currentType = grid[row][col]?.candyType;
          }
        }
        
        if (count >= 3) {
          for (let i = GRID_COLS - count; i < GRID_COLS; i++) {
            matches.push(grid[row][i]);
          }
        }
      }
      
      // Check vertical matches
      for (let col = 0; col < GRID_COLS; col++) {
        let count = 1;
        let currentType = grid[0][col]?.candyType;
        
        for (let row = 1; row < GRID_ROWS; row++) {
          if (grid[row][col]?.candyType === currentType && currentType) {
            count++;
          } else {
            if (count >= 3) {
              for (let i = row - count; i < row; i++) {
                matches.push(grid[i][col]);
              }
            }
            count = 1;
            currentType = grid[row][col]?.candyType;
          }
        }
        
        if (count >= 3) {
          for (let i = GRID_ROWS - count; i < GRID_ROWS; i++) {
            matches.push(grid[i][col]);
          }
        }
      }
      
      if (matches.length > 0) {
        removeMatches(matches);
      } else {
        // No more matches found - game is now stable
        isGameStable = true;
        console.log('✅ Game stable - no more matches found');
        updateUI(); // Update status
        
        if (gameMoves <= 0) {
          // Store previous best score before updating
          const currentBest = parseInt(localStorage.getItem('candyBestScore') || '0');
          setPreviousBestScore(currentBest);
          
          // Update best score if current score is better
          if (gameScore > currentBest) {
            localStorage.setItem('candyBestScore', gameScore.toString());
          }
          
          setGameOver(true);
          setGameOverState(true); // Set blur state
          
          // In the game over logic (when gameMoves <= 0), the score is submitted securely:
          // submitScore(playerData.fid, playerData.username, playerData.pfpUrl, gameScore, 'Candy Crush', { level: gameLevel })
          // This uses fetchWithVerification for secure, one-time-key POST requests.
          const playerData = getPlayerData(context);
          submitScore(playerData.fid, playerData.username, playerData.pfpUrl, gameScore, 'Candy Crush', { level: gameLevel }).then(result => {
            if (result.success) {
              console.log('Score submitted successfully:', result.data);
            } else {
              console.log('Failed to submit score:', result.error);
            }
          }).catch(error => {
            console.error('Error submitting score:', error);
          });
        }
      }
    }

    function removeMatches(matches: Candy[]) {
      // Count challenge candies in this match
      let challengeCandiesMatched = 0;
      matches.forEach(candy => {
        if (candy && candy.candyType === gameChallengeCandy) {
          challengeCandiesMatched++;
        }
      });
      
      // Update challenge progress
      gameChallengeProgress += challengeCandiesMatched;
      console.log(`🍭 Challenge progress: ${challengeCandiesMatched} candies of type ${gameChallengeCandy} matched (${gameChallengeProgress}/${gameChallengeTarget})`);
      
      gameScore += matches.length * 100;
      updateUI();
      
      console.log(`💥 Removing ${matches.length} matches`);
      
      // Vibrate based on match size - bigger matches = longer vibration
      const vibrationIntensity = Math.min(matches.length * 30, 200);
      triggerVibration([vibrationIntensity]);
      
      debugGrid('BEFORE MATCH REMOVAL');
      
      // Clear grid positions immediately and validate
      matches.forEach(candy => {
        console.log(`🗑️ Clearing candy at [${candy.gridY}][${candy.gridX}]`);
        
        // Validate the candy is actually at the expected position
        if (grid[candy.gridY][candy.gridX] !== candy) {
          console.error(`🔴 REMOVE ERROR: Expected candy at [${candy.gridY}][${candy.gridX}] but found different candy`);
          debugGrid('ERROR STATE');
        }
        
        grid[candy.gridY][candy.gridX] = null;
      });
      
      debugGrid('AFTER MATCH REMOVAL');
      
      // Animate removal
      let completedAnimations = 0;
      matches.forEach(candy => {
        scene.tweens.add({
          targets: candy,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 250,
          onComplete: () => {
            candy.destroy();
            completedAnimations++;
            // Only proceed when ALL removal animations are done
            if (completedAnimations === matches.length) {
              debugGrid('BEFORE CASCADE');
              animatedCascade();
            }
          }
        });
      });
    }

    function reconstructGrid() {
      console.log('🔧 EMERGENCY: Reconstructing entire grid to fix collisions');
      
      // Collect all valid candy objects currently in the scene
      const allCandies: Candy[] = [];
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          if (grid[row][col] && grid[row][col].active) {
            allCandies.push(grid[row][col]);
          }
        }
      }
      
      // Clear grid completely
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          grid[row][col] = null;
        }
      }
      
      // Sort candies by their visual Y position (bottom to top)
      allCandies.sort((a, b) => b.y - a.y);
      
      // Place candies column by column from bottom up
      const columnCandies: { [col: number]: Candy[] } = {};
      
      // Group candies by column
      allCandies.forEach(candy => {
        const col = Math.round((candy.x - GRID_X - CANDY_SPACING / 2) / CANDY_SPACING);
        if (col >= 0 && col < GRID_COLS) {
          if (!columnCandies[col]) columnCandies[col] = [];
          columnCandies[col].push(candy);
        }
      });
      
      // Place candies in grid from bottom up
      for (let col = 0; col < GRID_COLS; col++) {
        const candiesInCol = columnCandies[col] || [];
        
        for (let i = 0; i < candiesInCol.length && i < GRID_ROWS; i++) {
          const row = GRID_ROWS - 1 - i;
          const candy = candiesInCol[i];
          
          grid[row][col] = candy;
          candy.gridX = col;
          candy.gridY = row;
          
          // Snap to correct position
          const correctX = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
          const correctY = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
          candy.setPosition(correctX, correctY);
        }
        
        // Remove excess candies if any
        for (let i = GRID_ROWS; i < candiesInCol.length; i++) {
          candiesInCol[i].destroy();
        }
      }
      
      // Fill any remaining empty spaces
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          if (!grid[row][col]) {
            const candyType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
            const x = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
            const y = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
            
            const candy = new Candy(scene, x, y, col, row, candyType);
            grid[row][col] = candy;
          }
        }
      }
      
      console.log('✅ Grid reconstruction complete');
    }

    function debugGrid(context: string) {
      console.log(`🔍 GRID DEBUG (${context}):`);
      
      // Check for null entries
      let nullCount = 0;
      let candyCount = 0;
      const visualPositions = new Map();
      
      for (let row = 0; row < GRID_ROWS; row++) {
        let rowStr = '';
        for (let col = 0; col < GRID_COLS; col++) {
          const candy = grid[row][col];
          if (candy) {
            candyCount++;
            rowStr += `[${candy.candyType}]`;
            
            // Check visual position
            const visualKey = `${Math.round(candy.x)}-${Math.round(candy.y)}`;
            if (visualPositions.has(visualKey)) {
              console.error(`🔴 VISUAL COLLISION: Two candies at visual position ${visualKey}`);
              console.error(`   Candy 1: [${visualPositions.get(visualKey).gridY}][${visualPositions.get(visualKey).gridX}]`);
              console.error(`   Candy 2: [${candy.gridY}][${candy.gridX}]`);
              
              // Show red borders on colliding candies
              visualPositions.get(visualKey).showCollisionBorder();
              candy.showCollisionBorder();
            } else {
              // Hide border if no collision
              candy.hideCollisionBorder();
            }
            visualPositions.set(visualKey, candy);
            
            // Check grid sync
            if (candy.gridX !== col || candy.gridY !== row) {
              console.error(`🔴 GRID DESYNC: Candy at [${row}][${col}] thinks it's at [${candy.gridY}][${candy.gridX}]`);
            }
          } else {
            nullCount++;
            rowStr += '[ ]';
          }
        }
        console.log(`Row ${row}: ${rowStr}`);
      }
      
      console.log(`📊 Total: ${candyCount} candies, ${nullCount} empty spaces`);
      
      // Check for duplicates in grid array
      const gridCandies = new Set();
      let duplicatesFound = false;
      
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const candy = grid[row][col];
          if (candy) {
            if (gridCandies.has(candy)) {
              console.error(`🔴 DUPLICATE CANDY REFERENCE: Same candy object in multiple grid positions`);
              duplicatesFound = true;
            }
            gridCandies.add(candy);
          }
        }
      }
      
      return { candyCount, nullCount, duplicatesFound };
    }

    function validateAndFixGrid() {
      const debug = debugGrid('VALIDATION');
      
      if (debug.duplicatesFound) {
        console.error('🚨 CRITICAL: Duplicate candy references found - forcing reconstruction');
        reconstructGrid();
        return false;
      }
      
      return true;
    }

    function animatedCascade() {
      if (isProcessingCascade) {
        console.log('⏸️ Cascade already in progress, skipping');
        return;
      }
      
      isProcessingCascade = true;
      console.log('🌊 Starting natural cascade');
      
      // Stop all tweens first
      scene.tweens.killAll();
      
      // Check for and fix any collisions
      if (!validateAndFixGrid()) {
        // Grid was reconstructed, check for matches again
        isProcessingCascade = false;
        scene.time.delayedCall(100, () => checkForMatches());
        return;
      }
      
      let totalAnimations = 0;
      let completedAnimations = 0;
      
      // Process each column with natural gravity
      for (let col = 0; col < GRID_COLS; col++) {
        console.log(`🔽 Processing column ${col}`);
        
        // Scan from bottom to top, filling empty spaces
        for (let row = GRID_ROWS - 1; row >= 0; row--) {
          if (grid[row][col] === null) {
            // Found empty space, look for candy above to fall down
            let foundCandyRow = -1;
            for (let searchRow = row - 1; searchRow >= 0; searchRow--) {
              if (grid[searchRow][col] !== null) {
                foundCandyRow = searchRow;
                break;
              }
            }
            
            if (foundCandyRow >= 0) {
              // Move candy from foundCandyRow to row
              const fallingCandy = grid[foundCandyRow][col];
              grid[foundCandyRow][col] = null;
              grid[row][col] = fallingCandy;
              
              // Update candy's grid position
              fallingCandy!.gridX = col;
              fallingCandy!.gridY = row;
              
              const newY = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
              
              // Animate the fall
              totalAnimations++;
              const fallDistance = row - foundCandyRow;
              console.log(`📉 Candy falling from row ${foundCandyRow} to row ${row} (distance: ${fallDistance})`);
              
              scene.tweens.add({
                targets: fallingCandy,
                y: newY,
                duration: 150 + (fallDistance * 50), // Longer falls take more time
                ease: 'Power2.out',
                onComplete: () => {
                  completedAnimations++;
                  checkAllAnimationsComplete();
                }
              });
            }
          }
        }
        
        // After all existing candies have fallen, add new candies at the top
        let newCandiesNeeded = 0;
        for (let row = 0; row < GRID_ROWS; row++) {
          if (grid[row][col] === null) {
            newCandiesNeeded++;
          }
        }
        
        if (newCandiesNeeded > 0) {
          console.log(`➕ Adding ${newCandiesNeeded} new candies to column ${col}`);
          
          let addedCandies = 0;
          for (let row = 0; row < GRID_ROWS; row++) {
            if (grid[row][col] === null) {
              const candyType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
              const x = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
              const y = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
              
              // Start candy above the grid
              const startY = y - CANDY_SPACING * (newCandiesNeeded + 2);
              const candy = new Candy(scene, x, startY, col, row, candyType);
              grid[row][col] = candy;
              
              totalAnimations++;
              
              scene.tweens.add({
                targets: candy,
                y: y,
                duration: 200 + (addedCandies * 30), // Stagger new candies
                ease: 'Bounce.out',
                delay: 100, // Small delay to let existing candies fall first
                onComplete: () => {
                  completedAnimations++;
                  checkAllAnimationsComplete();
                }
              });
              
              addedCandies++;
            }
          }
        }
      }
      
      // If no animations needed, proceed immediately
      if (totalAnimations === 0) {
        console.log('📭 No cascade animations needed');
        finalizeCascade();
        return;
      }
      
      console.log(`📊 Starting ${totalAnimations} natural cascade animations`);
      
      function checkAllAnimationsComplete() {
        if (completedAnimations >= totalAnimations) {
          console.log(`✅ All ${totalAnimations} cascade animations completed`);
          finalizeCascade();
        }
      }
      
      function finalizeCascade() {
        // Final validation
        debugGrid('AFTER CASCADE');
        validateAndFixGrid();
        
        isProcessingCascade = false;
        
        // Check for matches after brief delay
        scene.time.delayedCall(150, () => {
          console.log('🔍 Cascade complete, checking matches');
          debugGrid('BEFORE NEXT MATCH CHECK');
          checkForMatches();
        });
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      transparent: true, // Make canvas transparent to show CSS background
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // Handle high DPI displays for better image quality
        zoom: window.devicePixelRatio || 1
      },
      render: {
        // High quality rendering settings
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        powerPreference: 'high-performance',
        batchSize: 4096,
        mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
      },
      scene: {
        preload: preload,
        create: create
      }
    };

    new Phaser.Game(config);
  };

  // Memoized background animation data for stable animation
  const sparkleData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const size = Math.random() * 6 + 3;
      const candyColors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#ff8844'];
      const sparkleColor = candyColors[Math.floor(Math.random() * candyColors.length)];
      return {
        size,
        color: sparkleColor,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `candySparkle ${Math.random() * 4 + 3}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 6}s`,
        opacity: Math.random() * 0.7 + 0.3,
        textShadow: `0 0 ${size}px ${sparkleColor}`,
      };
    }),
    []
  );
  const heartData = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => {
      const size = Math.random() * 8 + 4;
      const pinkColors = ['#ff69b4', '#ff1493', '#ffc0cb', '#ff44ff'];
      const heartColor = pinkColors[Math.floor(Math.random() * pinkColors.length)];
      return {
        size,
        color: heartColor,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `candyFloat ${Math.random() * 5 + 4}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 8}s`,
        opacity: Math.random() * 0.6 + 0.4,
        textShadow: `0 0 ${size/2}px ${heartColor}`,
      };
    }),
    []
  );
  const starData = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => {
      const size = Math.random() * 7 + 5;
      const candyColors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#ff8844'];
      const starColor = candyColors[Math.floor(Math.random() * candyColors.length)];
      return {
        size,
        color: starColor,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `candyTwinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 7}s`,
        opacity: Math.random() * 0.8 + 0.2,
        textShadow: `0 0 ${size/2}px ${starColor}`,
      };
    }),
    []
  );
  const bubbleData = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const size = Math.random() * 10 + 6;
      const bubbleColors = ['#ff69b4', '#ffc0cb', '#ffffff', '#f0f8ff'];
      const bubbleColor = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
      return {
        size,
        color: bubbleColor,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `candyBubble ${Math.random() * 6 + 5}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 10}s`,
        opacity: Math.random() * 0.4 + 0.2,
        textShadow: `0 0 ${size/3}px ${bubbleColor}`,
      };
    }),
    []
  );
  const candyFloatData = useMemo(() =>
    Array.from({ length: 4 }, (_, i) => {
      const size = Math.random() * 6 + 8;
      const candyEmojis = ['🍭', '🍬', '🍫', '🧁'];
      const candyEmoji = candyEmojis[Math.floor(Math.random() * candyEmojis.length)];
      return {
        size,
        emoji: candyEmoji,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `candyDrift ${Math.random() * 8 + 6}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 12}s`,
        opacity: Math.random() * 0.6 + 0.3,
      };
    }),
    []
  );

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: gameInitialized ? 'radial-gradient(circle at center, #ff69b4 0%, #ffffff 100%)' : 'linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #f8b500 100%)'
    }}>
      {/* Candy Wonderland Animated Background */}
      {gameInitialized && (
        <div
          className={gameOver ? 'candy-bg-paused' : ''}
          style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
            zIndex: '1',
          pointerEvents: 'none'
          }}
        >
          {/* Sparkles ✨ */}
          {sparkleData.map((sparkle, i) => (
              <div
                key={`sparkle-${i}`}
                className="sparkle"
                style={{
                  position: 'absolute',
                left: sparkle.left,
                top: sparkle.top,
                width: `${sparkle.size}px`,
                height: `${sparkle.size}px`,
                color: sparkle.color,
                fontSize: `${sparkle.size}px`,
                  lineHeight: '1',
                animation: sparkle.animation,
                animationDelay: sparkle.animationDelay,
                opacity: sparkle.opacity,
                textShadow: sparkle.textShadow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                ✨
              </div>
          ))}
          {/* Hearts ♥ */}
          {heartData.map((heart, i) => (
              <div
                key={`heart-${i}`}
                className="heart"
                style={{
                  position: 'absolute',
                left: heart.left,
                top: heart.top,
                width: `${heart.size}px`,
                height: `${heart.size}px`,
                color: heart.color,
                fontSize: `${heart.size}px`,
                  lineHeight: '1',
                animation: heart.animation,
                animationDelay: heart.animationDelay,
                opacity: heart.opacity,
                textShadow: heart.textShadow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                ♥
              </div>
          ))}
          {/* Stars ★ */}
          {starData.map((star, i) => (
              <div
                key={`star-${i}`}
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
          {/* Bubbles ○ */}
          {bubbleData.map((bubble, i) => (
              <div
                key={`bubble-${i}`}
                className="bubble"
                style={{
                  position: 'absolute',
                left: bubble.left,
                top: bubble.top,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                color: bubble.color,
                fontSize: `${bubble.size}px`,
                  lineHeight: '1',
                animation: bubble.animation,
                animationDelay: bubble.animationDelay,
                opacity: bubble.opacity,
                textShadow: bubble.textShadow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                ○
              </div>
          ))}
          {/* Floating Candy Emojis */}
          {candyFloatData.map((candy, i) => (
              <div
                key={`candy-${i}`}
                className="candy-float"
                style={{
                  position: 'absolute',
                left: candy.left,
                top: candy.top,
                width: `${candy.size}px`,
                height: `${candy.size}px`,
                fontSize: `${candy.size}px`,
                  lineHeight: '1',
                animation: candy.animation,
                animationDelay: candy.animationDelay,
                opacity: candy.opacity,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
              {candy.emoji}
              </div>
          ))}
        </div>
      )}
      
      {/* Candy background during initialization */}
      {!gameInitialized && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, #ff69b4 0%, #ffffff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <img
            src="/candy/molandakita.png"
            alt="Moland"
            style={{
              width: '80px',
              height: '80px',
              animation: 'spin 2s linear infinite'
            }}
          />
        </div>
      )}
      
      <div ref={gameRef} style={{ 
        width: '100%', 
        height: '100%',
        opacity: gameInitialized ? 1 : 0,
        filter: gameOverState ? 'blur(5px)' : 'none',
        transition: 'opacity 0.3s ease, filter 0.5s ease',
        position: 'relative'
      }} />
      


      {gameOver && (
        <>
          {/* Back to Games Button - Top Left */}
          <button
            style={{
              position: 'fixed',
              top: '30px',
              left: '0px',
              zIndex: 2100,
              padding: '8px 16px',
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'black',
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
            onClick={handleBackToMenu}
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
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              GAME OVER
            </h1>
            
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
                const improvementText = score > previousBestScore && previousBestScore > 0 
                  ? `\n\n🔥 That's +${Math.round(((score - previousBestScore) / previousBestScore) * 100)}% improvement from my Highest Score!`
                  : '';
                
                const shareText = `🍭 Just scored ${score} and reached level ${level} in Mona Crush! 💥\n\nCan you beat my score?${improvementText}`;
                
                const playerData = getPlayerData(context);
                
                // Create dynamic share URL with score data
                const shareParams = new URLSearchParams({
                  score: score.toString(),
                  level: level.toString(),
                  moves: moves.toString(),
                  gameType: 'candy-crush',
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
              {score > previousBestScore && previousBestScore > 0 && (
                <div style={{
                  fontSize: '11px',
                  color: '#00ff00',
                  fontWeight: 'bold',
                  marginTop: '3px'
                }}>
                  +{Math.round(((score - previousBestScore) / previousBestScore) * 100)}% from best
                </div>
              )}
              <div style={{
                width: '100%',
                height: '1px',
                backgroundColor: '#ffffff',
                margin: '8px 0'
              }}></div>
              <div style={{fontSize: '12px'}}>
                Level {level}
              </div>
            </button>
            
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
              Best
              <p style={{ fontSize: '29px', fontWeight: 'bold', color: '#ffff00' }}>{Math.max(score, previousBestScore)}</p>
            </div>
            
           
          </div>
          
          {/* Play Again Button - Bottom Center */}
          <button
            style={{ 
              position: 'fixed', 
              bottom: '80px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              zIndex: 2000,
              padding: '10px 20px',
              fontSize: '24px',
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
        </>
      )}
      
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes candySparkle {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(0.8) rotate(0deg);
          }
          25% { 
            opacity: 0.8;
            transform: scale(1.2) rotate(90deg);
          }
          50% { 
            opacity: 1;
            transform: scale(1.5) rotate(180deg);
          }
          75% { 
            opacity: 0.8;
            transform: scale(1.2) rotate(270deg);
          }
        }
        
        @keyframes candyFloat {
          0%, 100% { 
            opacity: 0.4;
            transform: translateY(0px) scale(1);
          }
          25% { 
            opacity: 0.7;
            transform: translateY(-8px) scale(1.1);
          }
          50% { 
            opacity: 1;
            transform: translateY(-12px) scale(1.2);
          }
          75% { 
            opacity: 0.7;
            transform: translateY(-8px) scale(1.1);
          }
        }
        
        @keyframes candyTwinkle {
          0%, 100% { 
            opacity: 0.2;
            transform: scale(1) rotate(0deg);
          }
          50% { 
            opacity: 1;
            transform: scale(1.3) rotate(180deg);
          }
        }
        
        @keyframes candyBubble {
          0%, 100% { 
            opacity: 0.2;
            transform: translateY(0px) scale(1);
          }
          33% { 
            opacity: 0.4;
            transform: translateY(-15px) scale(1.1);
          }
          66% { 
            opacity: 0.6;
            transform: translateY(-25px) scale(1.2);
          }
        }
        
        @keyframes candyDrift {
          0%, 100% { 
            opacity: 0.3;
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
          25% { 
            opacity: 0.6;
            transform: translateX(10px) translateY(-5px) rotate(90deg);
          }
          50% { 
            opacity: 0.8;
            transform: translateX(15px) translateY(-10px) rotate(180deg);
          }
          75% { 
            opacity: 0.6;
            transform: translateX(10px) translateY(-5px) rotate(270deg);
          }
        }
        .candy-bg-paused .sparkle,
        .candy-bg-paused .heart,
        .candy-bg-paused .star,
        .candy-bg-paused .bubble,
        .candy-bg-paused .candy-float {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
} 