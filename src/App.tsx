/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameState, HeroId, Direction, Difficulty } from './game/types';
import { ProcessedCharacter, processCharacterAsset, processDarkBackgroundAsset } from './game/imageProcessor';
import { VILLIAN_ASSET_PATH, MILK_DOT_ASSET_PATH } from './game/constants';
import { TitleScreen } from './components/TitleScreen';
import { CharacterSelect } from './components/CharacterSelect';
import { GameHUD } from './components/GameHUD';
import { GameCanvas } from './components/GameCanvas';
import { PauseModal, GameOverModal, VictoryModal, LevelClearModal } from './components/Modals';
import { sounds } from './game/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [selectedHero, setSelectedHero] = useState<HeroId>('hero_1');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [remainingDots, setRemainingDots] = useState(0);
  const [totalDots, setTotalDots] = useState(0);
  const [dangerProximity, setDangerProximity] = useState(0);
  const [invulnerabilityTime, setInvulnerabilityTime] = useState(0);
  const [maxSessionPowerUps, setMaxSessionPowerUps] = useState<number>(() => Math.floor(Math.random() * 3) + 1);
  const [sessionPowerUpsSpawned, setSessionPowerUpsSpawned] = useState<number>(0);
  const [muted, setMuted] = useState(false);
  const [touchDir, setTouchDir] = useState<Direction | null>(null);

  // Pre-processed assets stored for character previews and gameplay
  const [processedAssets, setProcessedAssets] = useState<Record<string, ProcessedCharacter> | null>(null);

  // Sync document.body.dataset.state for testability and headless automation
  useEffect(() => {
    let bodyState = gameState;
    if (gameState === 'select') {
      bodyState = 'title';
    } else if (gameState === 'victory') {
      bodyState = 'gameover';
    }
    document.body.dataset.state = bodyState;
  }, [gameState]);

  // Load and pre-process assets immediately on mount
  useEffect(() => {
    let mounted = true;
    async function loadAssets() {
      try {
        const [hero1, hero2, villian, milk] = await Promise.all([
          processCharacterAsset('/assets/aistudio/hero_1_666a4b89.png'),
          processCharacterAsset('/assets/aistudio/hero_2_0414096b.png'),
          processCharacterAsset(VILLIAN_ASSET_PATH),
          processDarkBackgroundAsset(MILK_DOT_ASSET_PATH),
        ]);
        if (mounted) {
          setProcessedAssets({
            hero_1: hero1,
            hero_2: hero2,
            villian,
            milk,
          });
        }
      } catch (e) {
        console.error('Failed to pre-process character assets:', e);
      }
    }
    loadAssets();
    return () => {
      mounted = false;
    };
  }, []);

  // Support ?autostart=1 query parameter for instant test runner execution
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setGameState('playing');
    }
  }, []);

  // Global keyboard listener for Pause (Escape or P)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') {
          e.preventDefault();
          sounds.playMenuClick();
          setGameState('paused');
        } else if (gameState === 'paused') {
          e.preventDefault();
          sounds.playMenuClick();
          setGameState('playing');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState]);

  const handleStartGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    setDangerProximity(0);
    // Randomly select 1, 2, or 3 appearances for the new game session
    setMaxSessionPowerUps(Math.floor(Math.random() * 3) + 1);
    setSessionPowerUpsSpawned(0);
    setGameState('playing');
  }, []);

  const handleOpenCharacterSelect = useCallback(() => {
    setGameState('select');
  }, []);

  const handlePause = useCallback(() => {
    setGameState('paused');
  }, []);

  const handleResume = useCallback(() => {
    setGameState('playing');
  }, []);

  const handleRestart = useCallback(() => {
    // Restart current level without resetting overall difficulty
    setDangerProximity(0);
    setMaxSessionPowerUps(Math.floor(Math.random() * 3) + 1);
    setSessionPowerUpsSpawned(0);
    setGameState('playing');
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
  }, []);

  const handleLevelComplete = useCallback((clearedLevel: number) => {
    setGameState('level_clear');
  }, []);

  const handleNextLevel = useCallback(() => {
    setLevel((prev) => Math.min(10, prev + 1));
    setDangerProximity(0);
    setMaxSessionPowerUps(Math.floor(Math.random() * 3) + 1);
    setSessionPowerUpsSpawned(0);
    setGameState('playing');
  }, []);

  const handleVictory = useCallback(() => {
    setGameState('victory');
  }, []);

  const handleToggleMute = useCallback(() => {
    const isMuted = sounds.toggleMute();
    setMuted(isMuted);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenSelect={handleOpenCharacterSelect}
          selectedHero={selectedHero}
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          muted={muted}
          onToggleMute={handleToggleMute}
          processedAssets={processedAssets}
        />
      )}

      {/* 2. Dedicated Character Selection Screen */}
      {gameState === 'select' && (
        <CharacterSelect
          selectedHero={selectedHero}
          onSelectHero={(id) => setSelectedHero(id)}
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          onStartGame={handleStartGame}
          onBackToTitle={() => setGameState('title')}
          processedAssets={processedAssets}
        />
      )}

      {/* 3. In-Game Playfield and HUD */}
      {(gameState === 'playing' ||
        gameState === 'paused' ||
        gameState === 'gameover' ||
        gameState === 'level_clear' ||
        gameState === 'victory') && (
        <div className="relative h-full w-full">
          {/* Top-down Canvas Maze */}
          <GameCanvas
            selectedHero={selectedHero}
            gameState={gameState}
            level={level}
            difficulty={difficulty}
            maxSessionPowerUps={maxSessionPowerUps}
            sessionPowerUpsSpawned={sessionPowerUpsSpawned}
            onPowerUpSpawned={() => setSessionPowerUpsSpawned((prev) => prev + 1)}
            onScoreChange={setScore}
            onRemainingDotsChange={(rem, tot) => {
              setRemainingDots(rem);
              setTotalDots(tot);
            }}
            onDangerProximityChange={setDangerProximity}
            onInvulnerabilityChange={setInvulnerabilityTime}
            onGameOver={handleGameOver}
            onLevelComplete={handleLevelComplete}
            onVictory={handleVictory}
            touchDirection={touchDir}
            onClearTouchDirection={() => setTouchDir(null)}
          />

          {/* World-Matched Minimal HUD */}
          <GameHUD
            score={score}
            level={level}
            difficulty={difficulty}
            remainingDots={remainingDots}
            totalDots={totalDots}
            selectedHero={selectedHero}
            dangerProximity={dangerProximity}
            invulnerabilityTime={invulnerabilityTime}
            muted={muted}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
            onRestart={handleRestart}
            onDirectionInput={setTouchDir}
          />
        </div>
      )}

      {/* 4. Status Modals */}
      {gameState === 'paused' && (
        <PauseModal
          score={score}
          level={level}
          remainingDots={remainingDots}
          totalDots={totalDots}
          onResume={handleResume}
          onRestart={handleRestart}
          onSelectHero={() => setGameState('select')}
          onReturnTitle={() => setGameState('title')}
        />
      )}

      {gameState === 'gameover' && (
        <GameOverModal
          score={score}
          level={level}
          remainingDots={remainingDots}
          totalDots={totalDots}
          onRestart={handleRestart}
          onSelectHero={() => setGameState('select')}
          onReturnTitle={() => setGameState('title')}
        />
      )}

      {gameState === 'level_clear' && (
        <LevelClearModal
          score={score}
          level={level}
          remainingDots={0}
          totalDots={totalDots}
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
          onSelectHero={() => setGameState('select')}
          onReturnTitle={() => setGameState('title')}
        />
      )}

      {gameState === 'victory' && (
        <VictoryModal
          score={score}
          level={10}
          remainingDots={0}
          totalDots={totalDots}
          onRestart={handleStartGame}
          onSelectHero={() => setGameState('select')}
          onReturnTitle={() => setGameState('title')}
        />
      )}
    </div>
  );
}
