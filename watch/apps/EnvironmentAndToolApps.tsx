import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  CheckCircle2,
  Timer,
  Bell,
  Info,
  X,
} from 'lucide-react';
import type { LiveSensorInputs } from '../../src/utils/metricsEngine';
import { buildEnvironmentDetectors } from '../environmentDetectors';
import {
  OFFLINE_MUSIC_TRACKS,
  playAlarmRing,
  playCountdownTick,
  playTapClick,
  startOfflineMusic,
  stopOfflineMusic,
} from '../watchAudio';
import type { VisitorWatchDatabase } from '../watchDb';

interface EnvToolAppProps {
  db: VisitorWatchDatabase;
  inputs: LiveSensorInputs;
  onUpdateDb: (updater: (prev: VisitorWatchDatabase) => VisitorWatchDatabase) => void;
  onUpdateInputs: (partial: Partial<LiveSensorInputs>) => void;
}

export const EnvironmentAppView: React.FC<EnvToolAppProps> = ({ db, inputs }) => {
  const [selectedDetector, setSelectedDetector] = useState<string | null>(null);
  const detectors = buildEnvironmentDetectors(inputs, db.extraEnv);
  const activeCount = detectors.filter((d) => d.status !== 'nominal').length;
  const activeItem = detectors.find((d) => d.id === selectedDetector);

  return (
    <div className="space-y-2.5 text-white">
      <div className="flex items-center justify-between bg-teal-950/75 border border-teal-500/40 rounded-2xl p-2.5">
        <div>
          <div className="text-[10px] font-bold uppercase text-teal-300">
            Room & Suit Air
          </div>
          <div className="text-xs font-extrabold text-white">
            {activeCount === 0 ? 'All 12 checks are safe' : `${activeCount} room alert(s) now`}
          </div>
        </div>
        <Info className="w-4 h-4 text-teal-300 shrink-0" />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {detectors.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              playTapClick(db.settings.muted);
              setSelectedDetector(d.id);
            }}
            className={`text-left rounded-xl p-2 border text-[11px] cursor-pointer transition ${
              d.status === 'critical'
                ? 'bg-red-950/90 border-red-400'
                : d.status === 'warning'
                ? 'bg-amber-950/80 border-amber-400'
                : 'bg-slate-900 border-slate-700 hover:border-teal-400'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-300 truncate">{d.shortLabel}</div>
            <div className="font-mono text-sm font-extrabold text-white tabular-nums">
              {d.value} <span className="text-[10px] font-normal text-slate-400">{d.unit}</span>
            </div>
          </button>
        ))}
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-3">
          <div className="w-full max-w-[230px] rounded-2xl bg-slate-900 border-2 border-teal-400 p-3 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-teal-300">{activeItem.shortLabel}</span>
              <button
                type="button"
                onClick={() => setSelectedDetector(null)}
                className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="font-mono text-base font-black">
              {activeItem.value} {activeItem.unit}
            </div>
            <div className="text-[11px] font-bold text-slate-300">
              Safe range: {activeItem.safeRange}
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetector(null)}
              className="w-full py-1.5 rounded-xl bg-teal-400 text-slate-950 font-black text-xs cursor-pointer"
            >
              Quit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ClockAppView: React.FC<EnvToolAppProps> = ({ db, onUpdateDb }) => {
  const [tab, setTab] = useState<'timer' | 'alarms' | 'stopwatch'>('timer');
  const [timerSec, setTimerSec] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [swMs, setSwMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimerSec((s) => {
        if (s <= 1) {
          setTimerRunning(false);
          playAlarmRing(db.settings.muted);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, db.settings.muted]);

  useEffect(() => {
    if (!swRunning) return;
    const start = Date.now() - swMs;
    const id = setInterval(() => setSwMs(Date.now() - start), 80);
    return () => clearInterval(id);
  }, [swRunning]);

  const fmtTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-3 text-white">
      <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl">
        {(['timer', 'alarms', 'stopwatch'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`py-1 rounded-lg text-[11px] font-bold capitalize cursor-pointer ${
              tab === t ? 'bg-sky-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'timer' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-700 p-3 text-center space-y-2.5">
          <Timer className="w-6 h-6 mx-auto text-sky-400" />
          <div className="font-mono text-3xl font-extrabold tabular-nums">{fmtTimer(timerSec)}</div>
          <div className="flex justify-center gap-1.5">
            {[30, 60, 180].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSec(sec);
                }}
                className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] font-mono font-bold cursor-pointer"
              >
                {sec}s
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="flex-1 py-2 rounded-xl bg-sky-500 text-slate-950 font-black text-xs cursor-pointer"
            >
              {timerRunning ? 'Pause' : 'Start'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setTimerSec(60);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {tab === 'alarms' && (
        <div className="space-y-1.5">
          {db.alarms.map((al) => (
            <div key={al.id} className="rounded-xl bg-slate-900 border border-slate-700 p-2.5 flex items-center justify-between">
              <div>
                <div className="font-mono text-base font-extrabold">{al.timeUtc}</div>
                <div className="text-[11px] text-slate-300">{al.label}</div>
              </div>
              <button
                type="button"
                aria-label={`Toggle ${al.label}`}
                onClick={() =>
                  onUpdateDb((prev) => ({
                    ...prev,
                    alarms: prev.alarms.map((x) =>
                      x.id === al.id ? { ...x, enabled: !x.enabled } : x
                    ),
                  }))
                }
                className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer ${
                  al.enabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {al.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onUpdateDb((prev) => ({
                ...prev,
                alarms: [
                  ...prev.alarms,
                  {
                    id: `al-${Date.now().toString(36)}`,
                    timeUtc: '18:00',
                    label: 'Drink Water Reminder',
                    enabled: true,
                  },
                ],
              }))
            }
            className="w-full py-2 rounded-xl bg-sky-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" /> Add 18:00 Alarm
          </button>
        </div>
      )}

      {tab === 'stopwatch' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-700 p-3 text-center space-y-3">
          <div className="font-mono text-3xl font-extrabold tabular-nums">
            {(swMs / 1000).toFixed(1)}s
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSwRunning((r) => !r)}
              className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
            >
              {swRunning ? 'Stop' : 'Start'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSwRunning(false);
                setSwMs(0);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold cursor-pointer"
            >
              Zero
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const MusicAppView: React.FC<EnvToolAppProps> = ({ db }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    return () => stopOfflineMusic();
  }, []);

  const toggleTrack = (id: string) => {
    if (playingId === id) {
      stopOfflineMusic();
      setPlayingId(null);
      return;
    }
    const track = OFFLINE_MUSIC_TRACKS.find((t) => t.id === id);
    if (!track) return;
    setPlayingId(id);
    if (!db.settings.muted) {
      startOfflineMusic(track, (idx) => setStepIdx(idx));
    }
  };

  return (
    <div className="space-y-2.5 text-white">
      <div className="rounded-2xl bg-rose-950/75 border border-rose-500/40 p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-rose-300">Space Music</div>
          <div className="text-[11px] text-slate-200">Tap a song to relax</div>
        </div>
        {playingId && (
          <div className="flex gap-0.5 items-end h-4">
            {[0, 1, 2, 3].map((b) => (
              <span
                key={b}
                className="w-1 bg-rose-400 rounded-full transition-all"
                style={{ height: `${((stepIdx + b) % 4) * 4 + 4}px` }}
              />
            ))}
          </div>
        )}
      </div>

      {OFFLINE_MUSIC_TRACKS.map((track) => {
        const active = playingId === track.id;
        return (
          <div
            key={track.id}
            className="rounded-xl bg-slate-900 border border-slate-700 p-2.5 flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <div className="text-xs font-extrabold truncate">{track.title}</div>
              <div className="text-[10px] text-slate-400 truncate">
                {track.bpm} bpm
              </div>
            </div>
            <button
              type="button"
              aria-label={active ? `Pause ${track.title}` : `Play ${track.title}`}
              onClick={() => toggleTrack(track.id)}
              className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 cursor-pointer"
            >
              {active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const CalculatorAppView: React.FC = () => {
  const [expr, setExpr] = useState('0');

  const handlePress = (key: string) => {
    if (key === 'C') {
      setExpr('0');
      return;
    }
    if (key === 'DEL') {
      setExpr((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
      return;
    }
    if (key === '=') {
      try {
        const clean = expr.replace(/[^0-9+\-*/.%()]/g, '');
        if (!clean) {
          setExpr('0');
          return;
        }
        const normalized = clean.replace(/\b0+(?=\d)/g, '');
        const result = Function(`"use strict"; return (${normalized});`)();
        setExpr(Number.isFinite(result) ? String(Number(result.toFixed(4))) : 'Err');
      } catch {
        setExpr('Err');
      }
      return;
    }
    setExpr((prev) => (prev === '0' || prev === 'Err' ? key : prev + key));
  };

  const keys = ['C', 'DEL', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '(', ')'];

  return (
    <div className="space-y-2 text-white">
      <div className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-right font-mono text-xl font-extrabold truncate">
        {expr}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handlePress(k)}
            className={`py-2 rounded-xl font-mono text-xs font-extrabold cursor-pointer ${
              ['/', '*', '-', '+', 'C', 'DEL', '%'].includes(k)
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handlePress('=')}
          className="col-span-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-mono text-sm font-extrabold cursor-pointer"
        >
          =
        </button>
      </div>
    </div>
  );
};

export const NotepadAppView: React.FC<EnvToolAppProps> = ({ db, onUpdateDb }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !body.trim()) return;
    playTapClick(db.settings.muted);
    onUpdateDb((prev) => ({
      ...prev,
      notes: [
        {
          id: `note-${Date.now().toString(36)}`,
          title: title.trim() || 'Daily Note',
          body: body.trim() || 'Saved on watch.',
          updatedAtUtc: new Date().toISOString(),
        },
        ...prev.notes,
      ],
    }));
    setTitle('');
    setBody('');
  };

  return (
    <div className="space-y-2.5 text-white">
      <form onSubmit={addNote} className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-1.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title..."
          className="w-full bg-slate-800 text-white text-xs rounded-lg px-2 py-1.5 border border-slate-600"
        />
        <textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a quick note..."
          className="w-full bg-slate-800 text-white text-xs rounded-lg px-2 py-1.5 border border-slate-600"
        />
        <button
          type="submit"
          className="w-full py-1.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
        >
          Save Note
        </button>
      </form>

      <div className="space-y-1.5">
        {db.notes.map((n) => (
          <div key={n.id} className="rounded-xl bg-slate-900 border border-slate-800 p-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">{n.title}</span>
              <button
                type="button"
                aria-label={`Delete ${n.title}`}
                onClick={() =>
                  onUpdateDb((prev) => ({
                    ...prev,
                    notes: prev.notes.filter((x) => x.id !== n.id),
                  }))
                }
                className="text-slate-400 hover:text-red-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-slate-300 mt-0.5 leading-snug">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CalendarAppView: React.FC<EnvToolAppProps> = ({ db, onUpdateDb }) => {
  const [title, setTitle] = useState('');

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    playTapClick(db.settings.muted);
    onUpdateDb((prev) => ({
      ...prev,
      calendar: [
        ...prev.calendar,
        {
          id: `cal-${Date.now().toString(36)}`,
          timeUtc: '19:30',
          title: title.trim(),
          category: 'Medical',
          done: false,
        },
      ],
    }));
    setTitle('');
  };

  return (
    <div className="space-y-2.5 text-white">
      <div className="rounded-2xl bg-blue-950/75 border border-blue-500/40 p-2.5 text-[11px] font-bold text-blue-200">
        Today&apos;s Plan ({db.calendar.filter((c) => c.done).length}/{db.calendar.length} Done)
      </div>

      <form onSubmit={addEvent} className="flex gap-1.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add plan..."
          className="flex-1 min-w-0 bg-slate-800 text-white text-xs rounded-lg px-2 py-1.5 border border-slate-600"
        />
        <button
          type="submit"
          aria-label="Add schedule item"
          className="px-2.5 py-1.5 rounded-lg bg-blue-500 text-white font-bold text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      <div className="space-y-1.5">
        {db.calendar.map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={() =>
              onUpdateDb((prev) => ({
                ...prev,
                calendar: prev.calendar.map((c) => (c.id === ev.id ? { ...c, done: !c.done } : c)),
              }))
            }
            className="w-full text-left rounded-xl bg-slate-900 border border-slate-700 p-2 flex items-center justify-between gap-2 cursor-pointer"
          >
            <div>
              <div className="font-mono text-[10px] text-blue-300">
                {ev.timeUtc} · {ev.category}
              </div>
              <div className={`text-xs font-bold ${ev.done ? 'line-through text-slate-500' : 'text-white'}`}>
                {ev.title}
              </div>
            </div>
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${ev.done ? 'text-emerald-400' : 'text-slate-600'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export const WorkoutAppView: React.FC<EnvToolAppProps> = ({
  db,
  inputs,
  onUpdateDb,
  onUpdateInputs,
}) => {
  const [selectedType, setSelectedType] = useState<'ARED Squats' | 'Indoor Treadmill' | 'Cycle Ergometer'>('ARED Squats');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeSec, setActiveSec] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      playCountdownTick(true, db.settings.muted);
      setCountdown(null);
      setIsRunning(true);
      onUpdateInputs({ exerciseActive: true });
      return;
    }
    playCountdownTick(false, db.settings.muted);
    const id = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 900);
    return () => clearTimeout(id);
  }, [countdown, db.settings.muted]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setActiveSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const finishWorkout = () => {
    setIsRunning(false);
    const minutes = activeSec > 0 ? Math.max(1, Math.round(activeSec / 60)) : 25;
    const stepsAdded = selectedType === 'Indoor Treadmill' ? 2400 : 1200;
    const calories = minutes * 7;
    onUpdateInputs({
      exerciseActive: false,
      steps: inputs.steps + stepsAdded,
      calories: inputs.calories + calories,
    });
    onUpdateDb((prev) => ({
      ...prev,
      workouts: [
        {
          id: `wo-${Date.now().toString(36)}`,
          type: selectedType,
          durationMin: minutes,
          calories,
          stepsAdded,
          completedAtUtc: new Date().toISOString().slice(11, 16),
        },
        ...prev.workouts,
      ],
    }));
    setActiveSec(0);
  };

  return (
    <div className="space-y-2.5 text-white">
      {countdown !== null ? (
        <div className="rounded-2xl bg-orange-600 p-6 text-center space-y-2">
          <div className="text-xs font-bold uppercase">Get Ready</div>
          <div className="font-mono text-5xl font-black">{countdown === 0 ? 'GO!' : countdown}</div>
        </div>
      ) : isRunning ? (
        <div className="rounded-2xl bg-orange-950 border border-orange-400 p-3 text-center space-y-2">
          <div className="text-xs font-bold text-orange-300">{selectedType}</div>
          <div className="font-mono text-3xl font-extrabold tabular-nums">
            {String(Math.floor(activeSec / 60)).padStart(2, '0')}:{String(activeSec % 60).padStart(2, '0')}
          </div>
          <div className="text-[11px] font-bold text-emerald-300">
            Heart {inputs.heartRate} bpm · Alarm paused
          </div>
          <button
            type="button"
            onClick={finishWorkout}
            className="w-full py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
          >
            Finish Workout
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-2">
          <div className="text-[11px] font-bold text-orange-300 uppercase">Pick Workout</div>
          {(['ARED Squats', 'Indoor Treadmill', 'Cycle Ergometer'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                selectedType === t ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCountdown(3)}
            className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs cursor-pointer"
          >
            Start Workout
          </button>
        </div>
      )}

      <div className="space-y-1">
        <div className="text-[10px] font-bold uppercase text-slate-400">Recent Workouts</div>
        {db.workouts.slice(0, 3).map((w) => (
          <div key={w.id} className="rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 flex justify-between text-[11px]">
            <span className="font-bold text-slate-200">{w.type}</span>
            <span className="font-mono text-orange-300">+{w.stepsAdded} st · {w.durationMin}m</span>
          </div>
        ))}
      </div>
    </div>
  );
};
