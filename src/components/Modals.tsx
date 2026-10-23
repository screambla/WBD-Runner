import React, { useEffect } from 'react';
import { Play, RotateCcw, UserCheck, Home, Trophy, CameraOff, Sparkles, ArrowRight } from 'lucide-react';
import { sounds } from '../game/audio';

interface ModalProps {
  score: number;
  level: number;
  remainingDots: number;
  totalDots: number;
  onResume?: () => void;
  onRestart: () => void;
  onNextLevel?: () => void;
  onSelectHero: () => void;
  onReturnTitle: () => void;
}

export const PauseModal: React.FC<ModalProps> = ({
  score,
  level,
  remainingDots,
  totalDots,
  onResume,
  onRestart,
  onSelectHero,
  onReturnTitle,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onResume?.();
      } else if (e.key === 'r' || e.key === 'R') {
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume, onRestart]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4 select-none">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center">
        <h2 className="text-2xl font-black tracking-tight text-white uppercase">
          ИГРА НА ПАУЗЕ
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Наблюдение камер временно приостановлено.
        </p>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-3 gap-2 border-y border-slate-800 py-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">СЧЁТ</span>
            <span className="text-xl font-black text-white tabular-nums">{score}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">УРОВЕНЬ</span>
            <span className="text-xl font-black text-blue-400 tabular-nums">{level} / 10</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">ТОЧКИ</span>
            <span className="text-xl font-black text-yellow-300 tabular-nums">
              {remainingDots} / {totalDots}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={() => {
              sounds.playMenuClick();
              onResume?.();
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-500 transition cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" /> ПРОДОЛЖИТЬ [Esc]
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playMenuClick();
              onRestart();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-750 hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Начать уровень заново [R]
          </button>

          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playMenuClick();
                onSelectHero();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" /> Сменить героя
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playMenuClick();
                onReturnTitle();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" /> В главное меню
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GameOverModal: React.FC<ModalProps> = ({
  score,
  level,
  remainingDots,
  totalDots,
  onRestart,
  onSelectHero,
  onReturnTitle,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        sounds.playMenuClick();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-red-950/70 p-4 select-none">
      <div className="w-full max-w-md rounded-2xl border-2 border-red-600/80 bg-slate-950 p-6 shadow-2xl text-center">
        {/* Flash alarm icon */}
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-500 border border-red-500/40 animate-bounce">
          <CameraOff className="h-8 w-8 stroke-[2.5]" />
        </div>

        <h2 className="text-3xl font-black tracking-tight text-red-500 uppercase">
          ЛИШЕНИЕ ПРЕМИИ!
        </h2>
        <p className="mt-1 text-xs text-red-300/80">
          Почему нарушаем? Представьтесь пожалуйста!.
        </p>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-3 gap-2 border-y border-red-900/50 bg-red-950/20 py-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">ИТОГОВЫЙ СЧЁТ</span>
            <span className="text-xl font-black text-white tabular-nums">{score}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">УРОВЕНЬ</span>
            <span className="text-xl font-black text-red-300 tabular-nums">{level} / 10</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">ОСТАЛОСЬ ТОЧЕК</span>
            <span className="text-xl font-black text-yellow-300 tabular-nums">
              {remainingDots} / {totalDots}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={() => {
              sounds.playMenuClick();
              onRestart();
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-base font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition cursor-pointer"
          >
            <RotateCcw className="h-5 w-5" /> НАПИСАТЬ ОБЬЯСНИТЕЛЬНУЮ
          </button>

          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playMenuClick();
                onSelectHero();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" /> Сменить героя
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playMenuClick();
                onReturnTitle();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" /> В главное меню
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LevelClearModal: React.FC<ModalProps> = ({
  score,
  level,
  onNextLevel,
  onReturnTitle,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sounds.playMenuClick();
        onNextLevel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextLevel]);

  const nextLevel = Math.min(10, level + 1);
  const nextSpeedBonus = 100 + level; // e.g. Level 2 -> 101%, Level 3 -> 102%

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-blue-950/80 p-4 select-none">
      <div className="w-full max-w-md rounded-2xl border-2 border-emerald-500/80 bg-slate-950 p-6 shadow-2xl text-center">
        {/* Level Complete Badge */}
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          <Sparkles className="h-8 w-8 stroke-[2.5]" />
        </div>

        <h2 className="text-3xl font-black tracking-tight text-emerald-400 uppercase">
          УРОВЕНЬ {level} ПРОЙДЕН!
        </h2>
        <p className="mt-1 text-xs text-slate-300">
          Все точки собраны! Враги на следующем уровне ускоряются на 1% (до {nextSpeedBonus}% базовой скорости).
        </p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-y border-emerald-500/30 bg-emerald-500/10 py-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">ТЕКУЩИЙ СЧЁТ</span>
            <span className="text-2xl font-black text-white tabular-nums">{score}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">СЛЕДУЮЩИЙ ЭТАП</span>
            <span className="text-2xl font-black text-emerald-400">{nextLevel} / 10</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={() => {
              sounds.playMenuClick();
              onNextLevel?.();
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition cursor-pointer"
          >
            СЛЕДУЮЩИЙ УРОВЕНЬ [Enter] <ArrowRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playMenuClick();
              onReturnTitle();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" /> В главное меню
          </button>
        </div>
      </div>
    </div>
  );
};

export const VictoryModal: React.FC<ModalProps> = ({
  score,
  onRestart,
  onSelectHero,
  onReturnTitle,
}) => {
  useEffect(() => {
    sounds.playVictory();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        sounds.playMenuClick();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-blue-950/85 p-4 select-none">
      <div className="w-full max-w-lg rounded-2xl border-2 border-yellow-500/80 bg-slate-950 p-6 shadow-2xl text-center">
        {/* Victory Trophy */}
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
          <Trophy className="h-9 w-9 stroke-[2.5]" />
        </div>

        <h2 className="text-3xl font-black tracking-tight text-yellow-400 uppercase sm:text-4xl">
          Поздравляем! Вы прошли все 10 уровней!
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-300 max-w-md mx-auto">
          Блестящее прохождение игры WBD Runs. Все 10 уникальных лабиринтов полностью зачищены без попадания в конусы фотокамер!
        </p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-y border-yellow-500/30 bg-yellow-500/10 py-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">ИТОГОВЫЙ СЧЁТ</span>
            <span className="text-3xl font-black text-yellow-300 tabular-nums">{score}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase">РЕЗУЛЬТАТ</span>
            <span className="text-2xl font-black text-emerald-400">10 / 10 ПРОЙДЕНО</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={() => {
              sounds.playMenuClick();
              onRestart();
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition cursor-pointer"
          >
            <Play className="h-5 w-5 fill-current" /> ИГРАТЬ СНОВА [Enter]
          </button>

          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playMenuClick();
                onSelectHero();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" /> Сменить героя
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playMenuClick();
                onReturnTitle();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" /> В главное меню
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
