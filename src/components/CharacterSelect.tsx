import React, { useEffect } from 'react';
import { HEROES } from '../game/constants';
import { Difficulty, HeroId } from '../game/types';
import {
  Check,
  Play,
  ArrowLeft,
  Target,
  Swords,
  Flame,
} from 'lucide-react';
import { sounds } from '../game/audio';

import { ProcessedCharacter } from '../game/imageProcessor';

interface CharacterSelectProps {
  selectedHero: HeroId;
  onSelectHero: (id: HeroId) => void;
  difficulty: Difficulty;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onStartGame: () => void;
  onBackToTitle: () => void;
  processedAssets?: Record<string, ProcessedCharacter> | null;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  selectedHero,
  onSelectHero,
  difficulty,
  onSelectDifficulty,
  onStartGame,
  onBackToTitle,
  processedAssets,
}) => {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))
      ) {
        return;
      }

      if (e.key === 'Escape') {
        sounds.playMenuClick();
        onBackToTitle();
      } else if (e.key === 'Enter') {
        // Avoid starting the game when Enter is used on a focused control.
        if (
          e.target instanceof HTMLElement &&
          e.target.closest('[role="button"], button')
        ) {
          return;
        }

        e.preventDefault();
        sounds.playMenuClick();
        onStartGame();
      } else if (e.key === ' ') {
        if (
          e.target instanceof HTMLElement &&
          e.target.closest('[role="button"], button')
        ) {
          return;
        }

        e.preventDefault();
        sounds.playMenuClick();
        onStartGame();
      } else if (e.key === 'ArrowLeft') {
        sounds.playMenuClick();
        onSelectHero('hero_1');
      } else if (e.key === 'ArrowRight') {
        sounds.playMenuClick();
        onSelectHero('hero_2');
      } else if (e.key === '1') {
        sounds.playMenuClick();
        onSelectDifficulty('easy');
      } else if (e.key === '2') {
        sounds.playMenuClick();
        onSelectDifficulty('medium');
      } else if (e.key === '3') {
        sounds.playMenuClick();
        onSelectDifficulty('hard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onBackToTitle,
    onStartGame,
    onSelectHero,
    onSelectDifficulty,
  ]);

  const difficultyOptions: {
    id: Difficulty;
    label: string;
    enemies: string;
    icon: React.ReactNode;
    selectedStyle: string;
    idleStyle: string;
  }[] = [
    {
      id: 'easy',
      label: 'Дневная смена',
      enemies: '1 пятнистый',
      icon: (
        <span className="flex h-3 w-3 items-center justify-center rounded-full border border-sky-700 bg-sky-200">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-700" />
        </span>
      ),
      selectedStyle:
        'border-2 border-[#1c64f2] bg-[#c3e0f9] text-[#09223a] shadow-sm font-black ring-1 ring-[#1c64f2]',
      idleStyle:
        'border border-[#7ca2c5]/50 bg-[#e4eff8]/80 hover:bg-[#eef5fa] text-[#1a3856] font-bold opacity-90',
    },
    {
      id: 'medium',
      label: 'Ночная смена',
      enemies: '2 пятнистых',
      icon: <Swords className="h-3.5 w-3.5 text-[#73512a]" />,
      selectedStyle:
        'border-2 border-[#785328] bg-[#faebd7] text-[#2c1c0e] shadow-sm font-black ring-1 ring-[#785328]',
      idleStyle:
        'border border-[#7ca2c5]/50 bg-[#faefe3]/80 hover:bg-[#faf4ed] text-[#3d2714] font-bold opacity-90',
    },
    {
      id: 'hard',
      label: 'Двойная смена',
      enemies: '3 пятнистых',
      icon: <Flame className="h-3.5 w-3.5 text-[#991b1b]" />,
      selectedStyle:
        'border-2 border-[#822a2a] bg-[#fae2e2] text-[#3e1111] shadow-sm font-black ring-1 ring-[#822a2a]',
      idleStyle:
        'border border-[#7ca2c5]/50 bg-[#fae9e9]/80 hover:bg-[#faf0f0] text-[#421616] font-bold opacity-90',
    },
  ];

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#071322] select-none">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center opacity-40 blur-2xl"
        style={{
          backgroundImage: "url('/assets/aistudio/menu_a187855e.jpg')",
        }}
      />

      {/* Main 16:9 stage */}
      <div className="relative flex aspect-[16/9] h-full w-full max-h-[56.25vw] max-w-[177.78vh] items-center justify-center overflow-hidden shadow-2xl">
        {/* Background artwork */}
        <img
          src="/assets/aistudio/menu_a187855e.jpg"
          alt="WBD Runs Corridor"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
        />

        {/* Main panel */}
        <div
          className="absolute z-20 flex flex-col overflow-hidden rounded-3xl border-2 border-white bg-[#dbebf6] px-3 py-2 text-center shadow-2xl sm:px-5 sm:py-3 md:px-7 md:py-4"
          style={{
            left: '17%',
            width: '66%',
            top: '3%',
            height: '94%',
          }}
        >
          {/* Header */}
          <div className="flex shrink-0 flex-col items-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#7ca2c5]/70 bg-[#c5ddf0] px-3.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#123658] sm:text-[11px]">
              <Target className="h-3.5 w-3.5 text-[#1c64f2]" />
              <span>ПЛАНЁРКА</span>
            </div>

            <h2 className="mt-0.5 text-lg font-black tracking-tight text-[#0b243b] sm:text-2xl md:text-3xl">
              Выберите своего персонажа
            </h2>

            <p className="max-w-lg text-[10px] leading-tight text-[#224568] sm:text-xs md:text-sm">
              Оба персонажа обладают равной маневренностью и скоростью.
              Любой ценой избегайте пятнистых!
            </p>
          </div>

          {/* Character cards */}
          <div className="mt-2 mb-2 grid min-h-0 flex-1 grid-cols-2 gap-2 sm:gap-4 md:gap-5">
            {HEROES.map((hero) => {
              const isSelected = selectedHero === hero.id;
              const heroSrc = processedAssets?.[hero.id]?.dataUrl || hero.assetPath;

              return (
                <div
                  key={hero.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Выбрать: ${hero.name}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    sounds.playMenuClick();
                    onSelectHero(hero.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      sounds.playMenuClick();
                      onSelectHero(hero.id);
                    }
                  }}
                  className={`relative flex min-h-0 min-w-0 cursor-pointer flex-col justify-between rounded-2xl p-1.5 text-center transition-colors duration-150 sm:p-2 md:p-3 ${
                    isSelected
                      ? 'border-2 border-[#1c64f2] bg-[#f2f8fd] shadow-lg ring-2 ring-[#3b82f6]/30'
                      : 'border border-[#8eb2d2]/70 bg-[#e7f1f9] shadow-sm hover:bg-[#edf5fb]'
                  }`}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#1c64f2] text-white shadow-md sm:h-7 sm:w-7">
                      <Check className="h-3.5 w-3.5 stroke-[3] sm:h-4 sm:w-4" />
                    </div>
                  )}

                  {/* Original image: preserve aspect ratio and stay inside the frame */}
                  <div className="relative mb-1 flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#9cc2e4]/70 bg-[#f4f9fd] p-1 shadow-inner sm:p-2">
                    <img
                      src={heroSrc}
                      alt={hero.name}
                      draggable={false}
                      decoding="async"
                      className="block h-auto w-auto max-h-full max-w-full object-contain object-center drop-shadow-md"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                      }}
                    />
                  </div>

                  {/* Hero information */}
                  <div className="w-full shrink-0">
                    <h3 className="truncate text-xs font-black text-[#0c233c] sm:text-base md:text-lg">
                      {hero.name}
                    </h3>

                    <p className="mt-0.5 line-clamp-2 px-1 text-center text-[9px] leading-tight text-[#345270] sm:text-xs md:text-[13px]">
                      {hero.tagline}
                    </p>
                  </div>

                  {/* Hero stats */}
                  <div className="mt-1 flex w-full shrink-0 items-center justify-between gap-1 border-t border-[#9bc0e0]/60 pt-1 text-[7px] font-bold text-[#1e3c5c] sm:text-[10px] md:text-[11px]">
                    <span>СКОРОСТЬ: 100%</span>
                    <span>СКРЫТНОСТЬ: МАКС</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Difficulty selection */}
          <div className="my-1 shrink-0 rounded-2xl border border-[#8eb2d2]/70 bg-[#cbe2f3] p-1.5 text-left sm:p-2">
            <div className="mb-1 text-[8px] font-black uppercase tracking-wider text-[#0e2c4a] sm:text-xs">
              СЛОЖНОСТЬ МИССИИ (10 УРОВНЕЙ):
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {difficultyOptions.map((opt) => {
                const isSelected = difficulty === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      sounds.playMenuClick();
                      onSelectDifficulty(opt.id);
                    }}
                    className={`flex min-w-0 cursor-pointer flex-col items-center justify-center rounded-xl px-1.5 py-1 text-center transition sm:py-1.5 ${
                      isSelected ? opt.selectedStyle : opt.idleStyle
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {opt.icon}
                      <span className="text-[11px] leading-tight sm:text-xs md:text-sm">
                        {opt.label}
                      </span>
                    </span>

                    <span className="mt-0.5 text-[8px] font-medium opacity-85 sm:text-[10px] md:text-[11px]">
                      {opt.enemies}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom action controls */}
          <div className="flex shrink-0 items-center justify-between gap-2 pt-1 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                sounds.playMenuClick();
                onBackToTitle();
              }}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[#1d4ed8] bg-[#2563eb] px-2.5 py-2 text-[10px] font-bold text-white shadow-md transition hover:bg-[#1d4ed8] active:scale-[0.98] sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-xs md:px-6 md:text-base"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span>В главное меню</span>
            </button>

            <button
              type="button"
              data-start="true"
              onClick={() => {
                sounds.playMenuClick();
                onStartGame();
              }}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border-2 border-white bg-white px-3 py-2 text-[10px] font-black text-[#0b243b] shadow-xl transition hover:bg-slate-50 active:scale-[0.98] sm:gap-2 sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-xs md:px-8 md:text-base"
            >
              <Play className="h-4 w-4 shrink-0 fill-current text-[#1d4ed8]" />
              <span className="uppercase tracking-wide">ИГРАТЬ МИССИЮ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
