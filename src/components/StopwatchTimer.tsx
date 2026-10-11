import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { soundService } from '../services/sound';

interface StopwatchTimerProps {
  initialSeconds?: number;
  targetSeconds?: number;
  maxMinutes?: number;
  onTimeChange: (seconds: number) => void;
  label?: string;
}

export const StopwatchTimer: React.FC<StopwatchTimerProps> = ({
  initialSeconds = 0,
  targetSeconds = 420,
  maxMinutes = 10,
  onTimeChange,
  label = 'Pencatat Waktu Penyelesaian Lomba',
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(Math.floor(initialSeconds / 60));
  const [manualSecondsInput, setManualSecondsInput] = useState(initialSeconds % 60);
  const [mode, setMode] = useState<'stopwatch' | 'manual'>('stopwatch');
  const [appliedNotice, setAppliedNotice] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const onTimeChangeRef = useRef(onTimeChange);

  useEffect(() => {
    onTimeChangeRef.current = onTimeChange;
  }, [onTimeChange]);

  useEffect(() => {
    setSeconds(initialSeconds);
    setManualMinutes(Math.floor(initialSeconds / 60));
    setManualSecondsInput(initialSeconds % 60);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          onTimeChangeRef.current(next);
          if (next % 60 === 0) {
            soundService.playTimerTick();
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    soundService.playClick();
    setIsRunning(true);
  };

  const handlePause = () => {
    soundService.playClick();
    setIsRunning(false);
    onTimeChangeRef.current(seconds);
    triggerAppliedNotice();
  };

  const handleReset = () => {
    soundService.playClick();
    setIsRunning(false);
    setSeconds(0);
    setManualMinutes(0);
    setManualSecondsInput(0);
    onTimeChangeRef.current(0);
  };

  const triggerAppliedNotice = () => {
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2500);
  };

  const handleManualApply = () => {
    const total = Math.max(0, Number(manualMinutes) * 60 + Number(manualSecondsInput));
    setSeconds(total);
    onTimeChangeRef.current(total);
    soundService.playClick();
    triggerAppliedNotice();
  };

  const handleApplyCurrentLive = () => {
    soundService.playClick();
    onTimeChangeRef.current(seconds);
    triggerAppliedNotice();
  };

  const formatDisplay = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isOverTarget = targetSeconds > 0 && seconds > targetSeconds;
  const isOverMax = maxMinutes > 0 && seconds > maxMinutes * 60;

  return (
    <div className="bg-stone-900 border border-amber-500/40 rounded-xl p-4 text-white shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {appliedNotice && (
            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px] animate-pulse mr-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Waktu Tersimpan!
            </span>
          )}
          <button
            type="button"
            onClick={() => setMode('stopwatch')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              mode === 'stopwatch'
                ? 'bg-amber-600 text-white font-semibold shadow'
                : 'text-stone-400 hover:text-white bg-stone-800'
            }`}
          >
            Live Timer
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
              mode === 'manual'
                ? 'bg-amber-600 text-white font-semibold shadow'
                : 'text-stone-400 hover:text-white bg-stone-800'
            }`}
          >
            Input Manual
          </button>
        </div>
      </div>

      {mode === 'stopwatch' ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-950/80 p-3.5 rounded-xl border border-stone-800">
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-wider ${
              isOverMax ? 'text-red-500 animate-pulse' : isOverTarget ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {formatDisplay(seconds)}
            </span>
            <span className="text-xs text-stone-400">
              ({seconds} detik)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                type="button"
                onClick={handleStart}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Mulai
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                Jeda / Catat
              </button>
            )}

            <button
              type="button"
              onClick={handleApplyCurrentLive}
              className="flex items-center gap-1 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-xs font-semibold border border-stone-700 cursor-pointer"
              title="Terapkan hasil waktu ini ke formulir"
            >
              <Check className="w-3.5 h-3.5" />
              Terapkan
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 text-stone-400 hover:text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-lg text-xs transition-colors cursor-pointer"
              title="Reset Waktu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-300">Menit:</label>
            <input
              type="number"
              min="0"
              max="180"
              value={manualMinutes}
              onChange={e => setManualMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 px-2.5 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-center text-sm font-mono text-amber-300 outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-300">Detik:</label>
            <input
              type="number"
              min="0"
              max="59"
              value={manualSecondsInput}
              onChange={e => setManualSecondsInput(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-16 px-2.5 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-center text-sm font-mono text-amber-300 outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="button"
            onClick={handleManualApply}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold rounded-lg text-xs shadow cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            Terapkan Waktu
          </button>
          <span className="text-xs text-stone-400 font-mono">
            = {Number(manualMinutes) * 60 + Number(manualSecondsInput)} detik ({formatDisplay(Number(manualMinutes) * 60 + Number(manualSecondsInput))})
          </span>
        </div>
      )}

      {/* Tie-Breaker Information */}
      <div className="flex flex-wrap items-center justify-end text-[11px] text-stone-400 pt-1 border-t border-stone-800/80">
        <div className="flex items-center gap-1.5 text-amber-300/90">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Waktu lebih cepat = Peringkat lebih tinggi jika nilai sama (Tie-Breaker Resmi).</span>
        </div>
      </div>
    </div>
  );
};
