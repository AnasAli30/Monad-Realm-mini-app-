'use client'

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { APP_URL } from '@/lib/constants';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';

export default function CandyCrushGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [gameOverState, setGameOverState] = useState(false); // Track game over for blur effect
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(10);
  
  // Challenge system state
  const [challengeCandyType, setChallengeCandyType] = useState('1');
  const [challengeTarget, setChallengeTarget] = useState(10);
  const [challengeProgress, setChallengeProgress] = useState(0);

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
    
    if (gameRef.current) {
      const existingGame = gameRef.current.querySelector('canvas');
      if (existingGame) {
        existingGame.remove();
      }
      initGame();
    }
  };

  const handleBackToMenu = () => {
    window.location.reload();
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
    const CANDY_SPACING = 60; // Space between candy centers
    const CELL_PADDING = 7; // Padding inside each grid cell
    const GRID_PADDING = 0; // Padding around the entire grid
    const GRID_X = GRID_PADDING + 25;
    const GRID_Y = 180;
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
    let statusText: Phaser.GameObjects.Text | null = null;

    function create(this: Phaser.Scene) {
      scene = this;
      
      this.add.rectangle(200, 400, 400, 800, 0xf0f8ff);
      
      // Create grid background with proper padding
      const gridBg = this.add.graphics();
      gridBg.fillStyle(0x333333, 0.1);
      gridBg.fillRect(
        GRID_X - GRID_PADDING, 
        GRID_Y - GRID_PADDING, 
        GRID_COLS * CANDY_SPACING + (GRID_PADDING * 2), 
        GRID_ROWS * CANDY_SPACING + (GRID_PADDING * 2)
      );
      
      // Create grid table lines
      const gridLines = this.add.graphics();
      gridLines.lineStyle(2, 0x666666, 0.5); // Gray lines, semi-transparent
      
      // Draw vertical grid lines
      for (let col = 0; col <= GRID_COLS; col++) {
        const x = GRID_X + col * CANDY_SPACING;
        gridLines.moveTo(x, GRID_Y);
        gridLines.lineTo(x, GRID_Y + GRID_ROWS * CANDY_SPACING);
      }
      
      // Draw horizontal grid lines  
      for (let row = 0; row <= GRID_ROWS; row++) {
        const y = GRID_Y + row * CANDY_SPACING;
        gridLines.moveTo(GRID_X, y);
        gridLines.lineTo(GRID_X + GRID_COLS * CANDY_SPACING, y);
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
      
      // Create UI text objects and store references
      scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '16px', color: '#333' });
      levelText = this.add.text(20, 40, 'Level: 1', { fontSize: '16px', color: '#333' });
      movesText = this.add.text(20, 60, 'Moves: 10', { fontSize: '16px', color: '#333' });
      // Challenge display with candy icon  
      // challengeLabelText = this.add.text(20, 80, '', { fontSize: '14px', color: '#666' });
      challengeIcon = this.add.sprite(30, 90, 'candy-' + gameChallengeCandy);
      challengeIcon.setDisplaySize(30,30); // Small icon size
      challengeText = this.add.text(40, 83, '(0/10)', { fontSize: '14px', color: '#666' });
      
    
      
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
          challengeText.setColor('#00aa00'); // Green when complete
        } else if (gameChallengeProgress >= gameChallengeTarget * 0.7) {
          challengeText.setColor('#ff8800'); // Orange when close
        } else {
          challengeText.setColor('#666'); // Gray otherwise
        }
      }
      
      // Update challenge icon when candy type changes
      if (challengeIcon) {
        challengeIcon.setTexture('candy-' + gameChallengeCandy);
      }
      
      // Update status based on game state
      if (statusText) {
        if (!isGameStable) {
          statusText.setText('⏳ Processing...');
          statusText.setColor('#ff6600');
        } else {
          statusText.setText('✅ Ready to play');
          statusText.setColor('#666');
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
      const invalidText = scene.add.text(200, 400, '❌', {
        fontSize: '48px',
        color: '#ff0000'
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
          setGameOver(true);
          setGameOverState(true); // Set blur state
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
      width: 400,
      height: 800,
      parent: gameRef.current,
      scale: {
        mode: Phaser.Scale.FIT,
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
  const { context, actions } = useMiniAppContext();

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: gameInitialized ? '#f0f8ff' : 'linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #f8b500 100%)'
    }}>
      {/* Candy background during initialization */}
      {!gameInitialized && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #f8b500 100%)',
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
        height: '800px',
        maxWidth: '100vw',
        maxHeight: '100vh',
        opacity: gameInitialized ? 1 : 0,
        filter: gameOverState ? 'blur(5px)' : 'none',
        transition: 'opacity 0.3s ease, filter 0.5s ease'
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
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              border: '1px solid #ffffff',
              padding: '10px 18px',
              borderRadius: '10px',
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              margin: '0 0 10px 0',
              backgroundColor: 'transparent',
              textAlign: 'center',
              cursor: 'pointer',
              zIndex: 2001,
              pointerEvents: 'auto'
            }} onClick={async () => {
              try {
                // Create share text with embed link
                const shareText = `🎮 Just scored ${score} and level ${level} in Monad Realm! 🚀\n\nCan you beat my score? Play now`;
                
                console.log('Actions available:', !!actions);
                console.log('Context available:', !!context);
                
                if (actions && actions.composeCast) {
                  await actions.composeCast({
                    text: shareText,
                    embeds: [`${APP_URL}`],
                  });
                  console.log('Cast composed successfully');
                } 
              } catch (error) {
                console.error('Error sharing score:', error);
               
               
              }}}>
              <p style={{color: 'white',fontSize: '14px',fontWeight: 'bold',marginBottom: '6px'}}>Cast Score</p>
              {score}
              <div style={{
                width: '100%',
                height: '2px',
                backgroundColor: '#ffffff',
                opacity: '0.7',
                margin: '10px 0'
              }}></div>
              <p style={{color: 'white',fontSize: '14px',fontWeight: 'bold',marginBottom: '1px'}}>Level {level}</p>
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
              padding: '10px 40px',
              fontSize: '18px',
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
      `}</style>
    </div>
  );
} 