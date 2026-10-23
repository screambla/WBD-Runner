import React, { useEffect, useState } from 'react';
import { Play, Volume2, VolumeX, Shield, Swords, Flame, UserCheck, HelpCircle, X } from 'lucide-react';
import { sounds } from '../game/audio';
import { Difficulty, HeroId } from '../game/types';
import { HEROES } from '../game/constants';
import { ProcessedCharacter } from '../game/imageProcessor';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenSelect: () => void;
  selectedHero: HeroId;
  difficulty: Difficulty;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  muted: boolean;
  onToggleMute: () => void;
  processedAssets?: Record<string, ProcessedCharacter> | null;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenSelect,
  selectedHero,
  difficulty,
  onSelectDifficulty,
  muted,
  onToggleMute,
  processedAssets,
}) => {
  const [showRules, setShowRules] = useState(false);
  const currentHeroMeta = HEROES.find((h) => h.id === selectedHero) || HEROES[0];
  const activeHeroImg = processedAssets?.[selectedHero]?.dataUrl || currentHeroMeta.assetPath;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showRules && (e.key === 'Escape' || e.key === 'Enter')) {
        setShowRules(false);
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sounds.playMenuClick();
        onStartGame();
      } else if (e.key === 'c' || e.key === 'C') {
        sounds.playMenuClick();
        onOpenSelect();
      } else if (e.key === 'm' || e.key === 'M') {
        onToggleMute();
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, onOpenSelect, onToggleMute, onSelectDifficulty, showRules]);

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
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-sky-700 bg-sky-200">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-700" />
        </span>
      ),
      selectedStyle:
        'border-2 border-[#1c4b75] bg-[#c3e2f8] text-[#09223a] shadow-md ring-2 ring-[#38bdf8]/60 font-black',
      idleStyle:
        'border border-[#2b5478]/40 bg-[#dbeefc]/80 hover:bg-[#cde5f7] text-[#1e3c5a] font-bold opacity-90',
    },
    {
      id: 'medium',
      label: 'Ночная смена',
      enemies: '2 пятнистых',
      icon: <Swords className="h-3.5 w-3.5 text-[#73512a]" />,
      selectedStyle:
        'border-2 border-[#785328] bg-[#faebd7] text-[#2c1c0e] shadow-md ring-2 ring-[#f59e0b]/60 font-black',
      idleStyle:
        'border border-[#755938]/40 bg-[#faefe3]/80 hover:bg-[#f5e4cf] text-[#4a321b] font-bold opacity-90',
    },
    {
      id: 'hard',
      label: 'Двойная смена',
      enemies: '3 пятнистых',
      icon: <Flame className="h-3.5 w-3.5 text-[#991b1b]" />,
      selectedStyle:
        'border-2 border-[#822a2a] bg-[#fae2e2] text-[#3e1111] shadow-md ring-2 ring-[#ef4444]/60 font-black',
      idleStyle:
        'border border-[#753c3c]/40 bg-[#fae9e9]/80 hover:bg-[#f6dcdc] text-[#4d2020] font-bold opacity-90',
    },
  ];

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#071322] select-none">
      {/* Blurred ambient background for non-16:9 monitors */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-105"
        style={{
          backgroundImage: `url('/assets/aistudio/Gemini_Generated_Image_ppe47fppe47fppe4_2d22d743.jpg')`,
        }}
      />

      {/* Main 16:9 Stage matched to the reference illustration */}
      <div className="relative h-full w-full max-h-[56.25vw] max-w-[177.78vh] aspect-[16/9] overflow-hidden shadow-2xl flex items-center justify-center">
        {/* Full-bleed Reference Art (Characters, Hallway, Logo) */}
        <img
          src="/assets/aistudio/Gemini_Generated_Image_ppe47fppe47fppe4_2d22d743.jpg"
          alt="WBD Runs"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
        />

        {/* Top Utility Icons (Sound & Rules) */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-6 z-30 flex items-center gap-2">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Инструктаж и правила"
            onClick={(e) => {
              e.currentTarget.blur();
              sounds.playMenuClick();
              setShowRules(true);
            }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-sky-400/40 bg-[#0c223a]/80 text-sky-200 backdrop-blur-md hover:bg-[#123052] hover:text-white transition shadow-lg cursor-pointer"
            title="Правила игры"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-sky-400/40 bg-[#0c223a]/80 text-sky-200 backdrop-blur-md hover:bg-[#123052] hover:text-white transition shadow-lg cursor-pointer"
            title={muted ? 'Включить звук (M)' : 'Выключить звук (M)'}
          >
            {muted ? <VolumeX className="h-5 w-5 text-red-400" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>

        {/* Interactive UI Card exactly mapped over the mock card */}
        <div
          className="absolute z-20 flex flex-col justify-between rounded-2xl sm:rounded-3xl border-2 border-[#5484ad]/60 bg-[#dcedf9]/95 px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-2xl backdrop-blur-md text-left"
          style={{
            left: '35.1%',
            width: '34.8%',
            top: '62.2%',
            height: '22.8%',
          }}
        >
          {/* Card Title */}
          <div className="text-[9px] sm:text-[11px] md:text-xs font-black tracking-wider text-[#0e2c48] uppercase truncate">
            ВЫБОР СЛОЖНОСТИ (СОХРАНЯЕТСЯ НА ВСЕ 10 УРОВНЕЙ)
          </div>

          {/* 3 Difficulty Pill Buttons */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {difficultyOptions.map((opt) => {
              const isSelected = difficulty === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    sounds.playMenuClick();
                    onSelectDifficulty(opt.id);
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl py-1 px-1 sm:py-1.5 sm:px-2 transition cursor-pointer text-center ${
                    isSelected ? opt.selectedStyle : opt.idleStyle
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {opt.icon}
                    <span className="text-[11px] sm:text-xs md:text-sm leading-tight">
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] opacity-80 font-medium">
                    {opt.enemies}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Operative Badge */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              sounds.playMenuClick();
              onOpenSelect();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sounds.playMenuClick();
                onOpenSelect();
              }
            }}
            className="flex items-center justify-between rounded-xl border border-[#3b597c] bg-[#1a2838] px-2.5 py-1 sm:py-1.5 text-white hover:border-sky-400/80 transition cursor-pointer shadow-sm group"
            title="Нажмите, чтобы сменить персонажа"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-[#0f1924] p-0.5">
                <img
                  src={activeHeroImg}
                  alt={currentHeroMeta.name}
                  className="h-full w-full object-contain drop-shadow-sm"
                />
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-sky-300 uppercase tracking-wider truncate">
                  АКТИВНЫЙ ОПЕРАТИВНИК
                </span>
                <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-white truncate group-hover:text-sky-200">
                  {currentHeroMeta.name}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[10px] text-sky-300/80 group-hover:text-sky-200 pl-2">
              <UserCheck className="h-3 w-3" />
              <span>[C]</span>
            </div>
          </div>
        </div>

        {/* Interactive Action Buttons directly mapped below the card */}
        <div
          className="absolute z-20 flex items-center gap-2"
          style={{
            left: '35.1%',
            width: '34.8%',
            top: '86.2%',
            height: '7.0%',
          }}
        >
          {/* Main Launch Button */}
          <button
            type="button"
            data-start="true"
            onClick={() => {
              sounds.playMenuClick();
              onStartGame();
            }}
            className="flex-[2.5] h-full inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border-2 border-[#1c3e5e] bg-[#c2e4fe] hover:bg-[#aee0ff] active:scale-[0.98] px-3 text-[#0a233b] font-black tracking-wide shadow-md hover:shadow-cyan-400/20 transition cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm uppercase tracking-wide truncate">
              НАЧАТЬ МИССИЮ <span className="font-medium opacity-75 hidden sm:inline">[Пробел / Enter]</span>
            </span>
          </button>

          {/* Character Selection Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playMenuClick();
              onOpenSelect();
            }}
            className="flex-1 h-full inline-flex items-center justify-center px-2 sm:px-3 rounded-xl sm:rounded-2xl border-2 border-[#4b3824] bg-[#fbf0df] hover:bg-[#f6e2c3] active:scale-[0.98] text-[#2c1d0e] font-extrabold shadow-md transition cursor-pointer"
          >
            <span className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
              Выбор персонажа
            </span>
          </button>
        </div>
      </div>

      {/* Rules & Mechanics Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-sky-400/40 bg-[#0f2338] p-6 text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl">📷</span>
              <h3 className="text-lg font-black text-sky-300 uppercase tracking-wide">
                ИНСТРУКТАЖ И ПРАВИЛА
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-300">
              <p>
                • <strong className="text-white">Направленный обзор 70°:</strong> Патрульные фотографы сканируют коридоры направленными вспышками на дистанцию до 3x своего роста.
              </p>
              <p>
                • <strong className="text-white">Блокировка стенами:</strong> Прячьтесь за углами и стенами лабиринта — камеры не просвечивают твердые препятствия.
              </p>
              <p>
                • <strong className="text-white">10 Уровней прогресса:</strong> Соберите все светящиеся точки в каждом лабиринте. С каждым новым уровнем патрульные ускоряются на 1%.
              </p>
              <p>
                • <strong className="text-white">Управление:</strong> Стрелки или WASD — перемещение; Esc или P — пауза.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="mt-6 w-full rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-sky-400 transition"
            >
              Понятно, в бой!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

