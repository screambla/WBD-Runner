import React from 'react';
import { HeroId, Direction, Difficulty } from '../game/types';
import { HEROES } from '../game/constants';
import { Pause, RotateCcw, Volume2, VolumeX, ShieldAlert, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { sounds } from '../game/audio';

interface GameHUDProps {
  score: number;
  level: number;
  difficulty: Difficulty;
  remainingDots: number;
  totalDots: number;
  selectedHero: HeroId;
  dangerProximity: number; // 0.0 to 1.0
  invulnerabilityTime?: number; // 0 to 10s
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
  onDirectionInput: (dir: Direction) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  level,
  difficulty,
  remainingDots,
  totalDots,
  selectedHero,
  dangerProximity,
  invulnerabilityTime = 0,
  muted,
  onToggleMute,
  onPause,
  onRestart,
  onDirectionInput,
}) => {
  const currentHeroMeta = HEROES.find((h) => h.id === selectedHero) || HEROES[0];
  const isInvulnerable = invulnerabilityTime > 0;
  const isDanger = dangerProximity > 0.05;
  const isSpotted = dangerProximity >= 1.0;

  const difficultyLabels: Record<Difficulty, string> = {
    easy: 'Легко',
    medium: 'Средне',
    hard: 'Сложно',
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2 select-none sm:p-3 md:p-4">
      {/* Top Perimeter Cluster */}
      <div className="flex w-full items-start justify-between gap-2 sm:gap-3">
        {/* Left: Score & Level & Dots */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-800/90 bg-slate-950/80 px-2.5 py-1.5 shadow-xl backdrop-blur-md sm:gap-3 sm:px-3.5 sm:py-2">
          {/* Active Hero Icon */}
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/40 bg-slate-900/90 p-0.5 sm:h-9 sm:w-9">
            <img
              src={currentHeroMeta.assetPath}
              alt={currentHeroMeta.name}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              СЧЁТ
            </span>
            <span className="text-lg font-black tabular-nums tracking-tight text-white sm:text-xl">
              {score}
            </span>
          </div>

          <div className="mx-0.5 h-6 w-px bg-slate-800 sm:mx-1 sm:h-7" />

          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              УРОВЕНЬ
            </span>
            <span className="text-lg font-black tabular-nums tracking-tight text-blue-400 sm:text-xl">
              {level} <span className="text-xs font-normal text-slate-400">/ 10</span>
            </span>
          </div>

          <div className="mx-0.5 h-6 w-px bg-slate-800 sm:mx-1 sm:h-7" />

          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              ТОЧКИ
            </span>
            <span className="text-lg font-black tabular-nums tracking-tight text-yellow-300 sm:text-xl">
              {remainingDots}{' '}
              <span className="text-xs font-normal text-slate-400">/ {totalDots}</span>
            </span>
          </div>

          <div className="hidden md:flex flex-col pl-1">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              СЛОЖНОСТЬ
            </span>
            <span className="text-xs font-bold text-slate-300">
              {difficultyLabels[difficulty]}
            </span>
          </div>
        </div>

        {/* Cap Invulnerability Special Badge */}
        {isInvulnerable && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-lime-400 bg-lime-950/90 px-3 py-1.5 shadow-lg shadow-lime-500/30 animate-pulse">
            <span className="text-xl">🧢</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-wider text-lime-300 uppercase font-bold">
                СВЕРХСКРЫТНОСТЬ
              </span>
              <span className="text-sm font-mono font-black tabular-nums text-lime-200">
                {invulnerabilityTime.toFixed(1)}s
              </span>
            </div>
          </div>
        )}

        {/* Center Proximity Alert Indicator (when hero approaches camera cone) */}
        {!isInvulnerable && (
          <div
            className={`pointer-events-auto transition-all duration-200 hidden sm:flex items-center gap-2 rounded-xl border px-3 py-2 ${
              isSpotted
                ? 'border-red-500 bg-red-950/90 text-red-300 animate-pulse'
                : isDanger
                ? 'border-orange-500 bg-orange-950/80 text-orange-300'
                : 'border-slate-800 bg-slate-950/60 text-slate-400'
            }`}
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <div className="text-xs font-mono">
              {isSpotted ? (
                <span className="font-bold">В КОНУСЕ КАМЕРЫ!</span>
              ) : isDanger ? (
                <span>ВНИМАНИЕ: КАМЕРА НАПРАВЛЕНА НА ВАС</span>
              ) : (
                <span>ЗОНА БЕЗОПАСНА</span>
              )}
            </div>
          </div>
        )}

        {/* Right Utility Buttons (Pause, Restart, Mute) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:text-white transition cursor-pointer"
          >
            {muted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Начать уровень заново"
            onClick={(e) => {
              e.currentTarget.blur();
              sounds.playMenuClick();
              onRestart();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Пауза"
            onClick={(e) => {
              e.currentTarget.blur();
              sounds.playMenuClick();
              onPause();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:text-white transition cursor-pointer"
          >
            <Pause className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom Controls: Virtual D-Pad for Touch/Mobile (visible on touch screens / small screens) */}
      <div className="pointer-events-auto flex w-full items-end justify-between">
        <div className="hidden sm:block text-[11px] font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          Стрелки / WASD — движение · Радиус наблюдения камер 3x
        </div>

        {/* Mobile On-Screen D-Pad */}
        <div className="sm:hidden flex flex-col items-center gap-1 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 ml-auto">
          <button
            type="button"
            aria-label="Вверх"
            onTouchStart={(e) => {
              e.preventDefault();
              onDirectionInput('UP');
            }}
            onClick={() => onDirectionInput('UP')}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 active:bg-blue-600 text-white cursor-pointer"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Влево"
              onTouchStart={(e) => {
                e.preventDefault();
                onDirectionInput('LEFT');
              }}
              onClick={() => onDirectionInput('LEFT')}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 active:bg-blue-600 text-white cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Вниз"
              onTouchStart={(e) => {
                e.preventDefault();
                onDirectionInput('DOWN');
              }}
              onClick={() => onDirectionInput('DOWN')}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 active:bg-blue-600 text-white cursor-pointer"
            >
              <ArrowDown className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Вправо"
              onTouchStart={(e) => {
                e.preventDefault();
                onDirectionInput('RIGHT');
              }}
              onClick={() => onDirectionInput('RIGHT')}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 active:bg-blue-600 text-white cursor-pointer"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
