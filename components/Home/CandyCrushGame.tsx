'use client'

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

export default function CandyCrushGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(30);

  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setMoves(30);
    
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

  useEffect(() => {
    if (gameRef.current) {
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
    let gameLevel = 1;
    let gameMoves = 30;
    let targetScore = 1000;

    const GRID_COLS = 6;
    const GRID_ROWS = 8;
    const CANDY_SIZE = 50; // Smaller candy size to create padding
    const CANDY_SPACING = 55; // Space between candy centers
    const CELL_PADDING = 7; // Padding inside each grid cell
    const GRID_PADDING = 0; // Padding around the entire grid
    const GRID_X = GRID_PADDING + 25;
    const GRID_Y = 180;
    const CANDY_TYPES = ['1', '2', '3', '4', '5', '6'];

    class Candy extends Phaser.GameObjects.Sprite {
      gridX: number;
      gridY: number;
      candyType: string;

      constructor(scene: Phaser.Scene, x: number, y: number, gridX: number, gridY: number, type: string) {
        super(scene, x, y, 'candy-' + type);
        this.gridX = gridX;
        this.gridY = gridY;
        this.candyType = type;
        this.setDisplaySize(CANDY_SIZE, CANDY_SIZE);
        this.setInteractive();
        scene.add.existing(this);
      }
    }

    function preload(this: Phaser.Scene) {
      // Load all the meme images from candy folder
      CANDY_TYPES.forEach(type => {
        this.load.image('candy-' + type, `/candy/${type}.png`);
      });
      
      // Log successful loads
      this.load.on('filecomplete', (key: string) => {
        console.log('✅ Loaded meme image:', key);
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
    let scoreText: Phaser.GameObjects.Text;
    let levelText: Phaser.GameObjects.Text;
    let movesText: Phaser.GameObjects.Text;
    let targetText: Phaser.GameObjects.Text;

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
      
      // Create UI text objects and store references
      scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '18px', color: '#333' });
      levelText = this.add.text(20, 45, 'Level: 1', { fontSize: '16px', color: '#333' });
      movesText = this.add.text(20, 70, 'Moves: 30', { fontSize: '16px', color: '#333' });
      targetText = this.add.text(20, 95, 'Target: 1000', { fontSize: '14px', color: '#666' });
     
      
      // Initialize UI
      updateUI();
    }

    // Function to update both React state and Phaser UI
    function updateUI() {
      // Update React state
      setScore(gameScore);
      setLevel(gameLevel);
      setMoves(gameMoves);
      
      // Update Phaser text objects
      if (scoreText) scoreText.setText(`${gameScore}`);
      if (levelText) levelText.setText(`Level: ${gameLevel}`);
      if (movesText) movesText.setText(`Moves: ${gameMoves}`);
      if (targetText) targetText.setText(`Target: ${targetScore}`);
      
      // Check for level progression
      if (gameScore >= targetScore) {
        gameLevel++;
        targetScore = gameLevel * 1000; // Increase target each level
        gameMoves += 5; // Give bonus moves for new level
        updateUI(); // Update again with new values
      }
    }

    function initializeGrid() {
      grid = [];
      for (let row = 0; row < GRID_ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_COLS; col++) {
          const candyType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
          const x = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
          const y = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
          
          const candy = new Candy(scene, x, y, col, row, candyType);
          
          grid[row][col] = candy;
        }
      }
    }

    // Touch/drag variables
    let isDragging = false;
    let dragStartCandy: Candy | null = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let isProcessingSwap = false; // Prevent multiple simultaneous swaps

    function setupDragInput() {
      scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
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

    function swapCandies(candy1: Candy, candy2: Candy) {
      if (isProcessingSwap) return; // Prevent simultaneous swaps
      isProcessingSwap = true;
      
      // Store original positions for potential revert
      const originalCandy1 = { gridX: candy1.gridX, gridY: candy1.gridY, x: candy1.x, y: candy1.y };
      const originalCandy2 = { gridX: candy2.gridX, gridY: candy2.gridY, x: candy2.x, y: candy2.y };
      
      // Perform the swap
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
          // Check if the swap created any matches
          if (checkForMatchesAfterSwap()) {
            // Valid swap - proceed with match removal
            triggerVibration([100]); // Short vibration for successful swap
            gameMoves--;
            updateUI();
            checkForMatches();
            isProcessingSwap = false; // Clear flag after successful swap
          } else {
            // Invalid swap - revert back to original positions
            triggerVibration([50, 50]); // Double short vibration for invalid swap
            revertSwap(candy1, candy2, originalCandy1, originalCandy2);
          }
        }
      });
    }

    function revertSwap(candy1: Candy, candy2: Candy, originalCandy1: any, originalCandy2: any) {
      // Revert grid positions
      grid[candy1.gridY][candy1.gridX] = candy1;
      grid[candy2.gridY][candy2.gridX] = candy2;
      
      candy1.gridX = originalCandy1.gridX;
      candy1.gridY = originalCandy1.gridY;
      candy2.gridX = originalCandy2.gridX;
      candy2.gridY = originalCandy2.gridY;
      
      // Animate back to original positions
      scene.tweens.add({
        targets: candy1,
        x: originalCandy1.x,
        y: originalCandy1.y,
        duration: 200,
        ease: 'Back.out'
      });
      
      scene.tweens.add({
        targets: candy2,
        x: originalCandy2.x,
        y: originalCandy2.y,
        duration: 200,
        ease: 'Back.out',
        onComplete: () => {
          isProcessingSwap = false; // Clear flag after revert complete
        }
      });
      
      // Show invalid move feedback (optional) - removed per user request
      // showInvalidMoveEffect();
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
      } else if (gameMoves <= 0) {
        setGameOver(true);
      }
    }

    function removeMatches(matches: Candy[]) {
      gameScore += matches.length * 100;
      updateUI();
      
      // Vibrate based on match size - bigger matches = longer vibration
      const vibrationIntensity = Math.min(matches.length * 30, 200);
      triggerVibration([vibrationIntensity]);
      
      // Clear grid positions immediately
      matches.forEach(candy => {
        grid[candy.gridY][candy.gridX] = null;
      });
      
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
              fillEmptySpaces();
            }
          }
        });
      });
    }

    function fillEmptySpaces() {
      let totalAnimations = 0;
      let completedAnimations = 0;
      
      // Process each column separately
      for (let col = 0; col < GRID_COLS; col++) {
        // Collect all existing candies in this column
        const existingCandies: Candy[] = [];
        for (let row = 0; row < GRID_ROWS; row++) {
          if (grid[row][col]) {
            existingCandies.push(grid[row][col]);
          }
          grid[row][col] = null; // Clear the column
        }
        
        // Place existing candies at the bottom
        for (let i = 0; i < existingCandies.length; i++) {
          const newRow = GRID_ROWS - 1 - i;
          const candy = existingCandies[existingCandies.length - 1 - i];
          
          grid[newRow][col] = candy;
          candy.gridY = newRow;
          candy.gridX = col; // Ensure gridX is correct
          
          const newY = GRID_Y + newRow * CANDY_SPACING + CANDY_SPACING / 2;
          
          // Only animate if position changed
          if (Math.abs(candy.y - newY) > 5) {
            totalAnimations++;
            scene.tweens.add({
              targets: candy,
              y: newY,
              duration: 250,
              ease: 'Power2.out',
              onComplete: () => {
                completedAnimations++;
                checkAllAnimationsComplete();
              }
            });
          }
        }
        
        // Fill remaining empty spaces with new candies
        const emptySpaces = GRID_ROWS - existingCandies.length;
        for (let i = 0; i < emptySpaces; i++) {
          const row = i;
          const candyType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
          const x = GRID_X + col * CANDY_SPACING + CANDY_SPACING / 2;
          const y = GRID_Y + row * CANDY_SPACING + CANDY_SPACING / 2;
          
          // Start candies above the grid
          const candy = new Candy(scene, x, y - CANDY_SPACING * (emptySpaces + 1), col, row, candyType);
          grid[row][col] = candy;
          
          totalAnimations++;
          scene.tweens.add({
            targets: candy,
            y: y,
            duration: 300 + i * 50, // Stagger new candy drops
            ease: 'Bounce.out',
            onComplete: () => {
              completedAnimations++;
              checkAllAnimationsComplete();
            }
          });
        }
      }
      
      // If no animations, check for matches immediately
      if (totalAnimations === 0) {
        scene.time.delayedCall(100, () => checkForMatches());
      }
      
      function checkAllAnimationsComplete() {
        if (completedAnimations >= totalAnimations) {
          // All animations complete, now check for new matches
          scene.time.delayedCall(200, () => checkForMatches());
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 400,
      height: 800,
      parent: gameRef.current,
      scene: {
        preload: preload,
        create: create
      }
    };

    new Phaser.Game(config);
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f8ff'
    }}>
      <div ref={gameRef} style={{ 
        width: '400px', 
        height: '800px',
        maxWidth: '100vw',
        maxHeight: '100vh'
      }} />
      
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            textAlign: 'center',
            maxWidth: '90vw',
            margin: '0 1rem'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>🍭 Game Over!</h2>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>Final Score: {score}</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>Level: {level}</p>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={handleRestart} 
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  fontSize: '1rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🔄 Play Again
              </button>
              <button 
                onClick={handleBackToMenu} 
                style={{ 
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 