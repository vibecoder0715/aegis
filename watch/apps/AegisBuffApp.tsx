import React, { useState } from 'react';
import { Award, CheckCircle2, Sparkles, ShoppingBag } from 'lucide-react';
import {
  completeDailyBuffTask,
  computeLevelFromXp,
  PLANET_DECORATORS,
  purchasePlanetDecorator,
  VisitorWatchDatabase,
} from '../watchDb';
import { PlanetDecoratorSvg } from '../WatchAppIcons';
import { playBuffVictory, playTapClick } from '../watchAudio';

interface AegisBuffProps {
  db: VisitorWatchDatabase;
  onUpdateDb: (updater: (prev: VisitorWatchDatabase) => VisitorWatchDatabase) => void;
}

export const AegisBuffAppView: React.FC<AegisBuffProps> = ({ db, onUpdateDb }) => {
  const [tab, setTab] = useState<'tasks' | 'planet'>('tasks');
  const [toast, setToast] = useState<string | null>(null);
  const lvl = computeLevelFromXp(db.xp);
  const completedCount = db.dailyTasks.filter((t) => t.completed).length;

  const handleCompleteTask = (taskId: string) => {
    const next = completeDailyBuffTask(db, taskId);
    if (next !== db) {
      playBuffVictory(db.settings.muted);
      onUpdateDb(() => next);
      setToast('Task complete! XP & AegisPoints added!');
      setTimeout(() => setToast(null), 2200);
    }
  };

  const handleBuyItem = (itemId: string) => {
    playTapClick(db.settings.muted);
    const res = purchasePlanetDecorator(db, itemId);
    onUpdateDb(() => res.db);
    if (res.ok) playBuffVictory(db.settings.muted);
    setToast(res.message);
    setTimeout(() => setToast(null), 2400);
  };

  return (
    <div className="space-y-2.5 text-white">
      {/* Level + XP + Points Card */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-900 to-indigo-950 border border-violet-400/40 p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-extrabold">
              Lv.{lvl.level} {lvl.title}
            </span>
          </div>
          <span className="font-mono text-xs font-black text-amber-300">
            {db.aegisPoints} pts
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
          <div style={{ width: `${lvl.progressPct}%` }} className="h-full bg-amber-400 rounded-full" />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-violet-200">
          <span>{db.xp} Total XP</span>
          <span>{completedCount}/14 Daily Tasks</span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setTab('tasks')}
          className={`py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
            tab === 'tasks' ? 'bg-violet-500 text-white' : 'text-slate-300'
          }`}
        >
          14 Daily Tasks
        </button>
        <button
          type="button"
          onClick={() => setTab('planet')}
          className={`py-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
            tab === 'planet' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
          }`}
        >
          <Sparkles className="w-3 h-3" /> My Planet
        </button>
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-500 text-slate-950 px-2.5 py-1.5 text-[11px] font-black text-center">
          {toast}
        </div>
      )}

      {tab === 'tasks' ? (
        <div className="space-y-1.5">
          {db.dailyTasks.map((t) => {
            const tierCls =
              t.difficulty === 'hard'
                ? 'text-rose-300 bg-rose-950/60 border-rose-500/30'
                : t.difficulty === 'medium'
                ? 'text-amber-300 bg-amber-950/50 border-amber-500/30'
                : 'text-emerald-300 bg-emerald-950/50 border-emerald-500/30';

            return (
              <button
                key={t.id}
                type="button"
                disabled={t.completed}
                onClick={() => handleCompleteTask(t.id)}
                className={`w-full text-left rounded-xl p-2 border flex items-center justify-between gap-2 transition cursor-pointer ${
                  t.completed
                    ? 'bg-slate-900/50 border-slate-800 opacity-65'
                    : 'bg-slate-900 border-slate-700 hover:border-violet-400'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${tierCls}`}>
                      {t.difficulty}
                    </span>
                    <span className="font-mono text-[10px] text-amber-300">
                      +{t.xpReward}XP · +{t.pointsReward}pts
                    </span>
                  </div>
                  <div className={`text-[11px] font-bold mt-0.5 ${t.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                    {t.title}
                  </div>
                  <div className="text-[9px] text-slate-400">{t.nasaRef}</div>
                </div>
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 ${
                    t.completed ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Interactive Cute Orbital Planet Stage */}
          <div className="relative h-40 rounded-2xl bg-[#070B19] border border-violet-500/40 overflow-hidden flex items-center justify-center">
            {/* Twinkling stars */}
            <div className="absolute top-3 left-5 w-1.5 h-1.5 rounded-full bg-amber-200" />
            <div className="absolute top-6 right-7 w-1.5 h-1.5 rounded-full bg-cyan-200" />
            <div className="absolute bottom-5 left-8 w-1 h-1 rounded-full bg-white" />

            {/* Cute planet sphere */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-b from-indigo-400 via-sky-500 to-emerald-500 border-2 border-cyan-200/60 shadow-[0_0_25px_rgba(56,189,248,0.3)] relative">
              {db.placedPlanetItems.map((placed) => (
                <div
                  key={placed.instanceId}
                  style={{ left: `${placed.x}%`, top: `${placed.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-md"
                  title={placed.itemId}
                >
                  <PlanetDecoratorSvg itemId={placed.itemId} size={22} />
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" /> Planet Shop ({db.placedPlanetItems.length} placed)
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {PLANET_DECORATORS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleBuyItem(item.id)}
                className="rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 p-2 text-left flex items-center gap-2 cursor-pointer"
              >
                <PlanetDecoratorSvg itemId={item.id} size={22} />
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold truncate">{item.name}</div>
                  <div className="font-mono text-[10px] text-amber-300 font-bold">
                    {item.costPoints} pts
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
