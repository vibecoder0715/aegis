import React, { useEffect, useRef, useState } from 'react';
import { Plus, Info, X, RotateCw, Droplets } from 'lucide-react';
import {
  computeBoneMetricsFromSoundWave,
  LiveSensorInputs,
  SituationId,
} from '../../src/utils/metricsEngine';
import {
  AstronautCharacterSvg,
  AstronautPoseId,
} from '../../src/components/SpaceCartoonIcons';
import { VisitorWatchDatabase } from '../watchDb';
import { playTapClick } from '../watchAudio';

interface WatchAppCommonProps {
  db: VisitorWatchDatabase;
  inputs: LiveSensorInputs;
  situation: SituationId;
  onUpdateDb: (updater: (prev: VisitorWatchDatabase) => VisitorWatchDatabase) => void;
  onUpdateInputs: (partial: Partial<LiveSensorInputs>) => void;
}

/**
 * Reusable Card Modal Popup so users can tap a button to read short, friendly descriptions and close/quit!
 */
const CardDetailModal: React.FC<{
  title: string;
  lines: string[];
  onClose: () => void;
}> = ({ title, lines, onClose }) => (
  <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3">
    <div className="w-full max-w-[230px] rounded-2xl bg-slate-900 border-2 border-sky-400/60 p-3 text-white space-y-2.5 shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
        <span className="text-xs font-black text-sky-300">{title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Quit description"
          className="w-6 h-6 rounded-full bg-slate-800 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <ul className="space-y-1.5 text-[11px] font-bold text-slate-200">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-1.5 leading-snug">
            <span className="text-amber-300">★</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClose}
        className="w-full py-1.5 rounded-xl bg-sky-400 text-slate-950 font-black text-xs cursor-pointer"
      >
        Quit
      </button>
    </div>
  </div>
);

/* ---------------- 1. SLEEP APP ---------------- */
export const SleepAppView: React.FC<WatchAppCommonProps> = ({
  db,
  inputs,
}) => {
  const [showTips, setShowTips] = useState(false);
  const sleep = db.sleep;
  const totalStageMin = sleep.stages.reduce((s, b) => s + b.minutes, 0) || 1;

  return (
    <div className="space-y-2.5 text-white">
      {/* Top Summary Card with Cute Crescent Moon SVG */}
      <div className="rounded-2xl bg-indigo-950/80 border border-indigo-400/35 p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-indigo-300 uppercase">Last Night</div>
          <div className="font-mono text-xl font-black text-white">
            {inputs.sleepHours.toFixed(1)} hrs
          </div>
          <div className="text-[10px] font-bold text-emerald-300">
            Rest score: {sleep.sleepScore}%
          </div>
        </div>
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill="#1E1B4B" stroke="#818CF8" strokeWidth="2" />
          <path
            d="M29 12C21 13 16 20 17.5 28C19 35.5 26.5 39.5 34 36.5C27.5 35.5 23 29.5 24 22.5C24.6 17 27.8 13.5 32 12.2C31 11.9 30 11.8 29 12Z"
            fill="#FACC15"
          />
        </svg>
      </div>

      {/* Visual Chart for Timeline (No wordy stage rows) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase text-indigo-300">
            Timeline
          </span>
          <span className="text-[9px] font-mono text-slate-400">
            {sleep.bedtimeUtc} – {sleep.wakeUtc}
          </span>
        </div>

        {/* Stacked Horizontal Ribbon Chart */}
        <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-950 border border-slate-800">
          {sleep.stages.map((st, idx) => (
            <div
              key={idx}
              style={{
                width: `${Math.max(8, Math.round((st.minutes / totalStageMin) * 100))}%`,
                backgroundColor: st.color,
              }}
              title={`${st.stage}: ${st.minutes}m`}
            />
          ))}
        </div>

        {/* Visual Bar Chart of Sleep Stages */}
        <div className="grid grid-cols-5 gap-1.5 items-end h-16 pt-2 px-1">
          {sleep.stages.map((st, idx) => {
            const hPct = Math.max(22, Math.min(100, Math.round((st.minutes / 150) * 100)));
            return (
              <div key={idx} className="flex flex-col items-center justify-end h-full gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    style={{ height: `${hPct}%`, backgroundColor: st.color }}
                    className="w-full rounded-t-md transition-all"
                  />
                </div>
                <span className="text-[9px] font-extrabold text-slate-300">{st.stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guidance with Cute SVG Icons */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase text-amber-300">
            Guidance
          </span>
          <button
            type="button"
            onClick={() => setShowTips(true)}
            className="px-2 py-0.5 rounded-lg bg-indigo-500/30 border border-indigo-400/50 text-[9px] font-black text-indigo-200 flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-2.5 h-2.5" /> More
          </button>
        </div>

        <div className="space-y-1.5 text-[11px] font-bold text-slate-200">
          <div className="flex items-center gap-2 bg-slate-950/70 rounded-xl px-2 py-1.5">
            {/* Cute Moon SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M18 15.5A7.5 7.5 0 0 1 9.5 7a7.5 7.5 0 1 0 8.5 8.5Z" fill="#FACC15" />
            </svg>
            <span>Dim room lights early.</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/70 rounded-xl px-2 py-1.5">
            {/* Cute Sun SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <circle cx="12" cy="12" r="5" fill="#38BDF8" />
              <path d="M12 3V5M12 19V21M3 12H5M19 12H21" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Use bright morning light.</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/70 rounded-xl px-2 py-1.5">
            {/* Cute Pillow Cloud SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M7 17H17A4 4 0 0 0 17 9A5 5 0 0 0 7.5 8A3.5 3.5 0 0 0 7 17Z" fill="#A855F7" />
            </svg>
            <span>Keep bedroom cool tonight.</span>
          </div>
        </div>
      </div>

      {showTips && (
        <CardDetailModal
          title="Sleep Guide"
          lines={[
            'Sleep 7.5 hours every night.',
            'Turn off bright screens early.',
            'Relax and breathe before bed.',
          ]}
          onClose={() => setShowTips(false)}
        />
      )}
    </div>
  );
};

/* ---------------- 2. NUTRITIONS APP ---------------- */
const QUICK_MEALS = [
  { name: 'Salmon & Greens', calories: 580, calciumMg: 620, sodiumMg: 410, waterMl: 450 },
  { name: 'Broccoli & Egg Bowl', calories: 520, calciumMg: 440, sodiumMg: 320, waterMl: 500 },
  { name: 'Berry Yogurt Cup', calories: 410, calciumMg: 480, sodiumMg: 260, waterMl: 400 },
];

export const NutritionsAppView: React.FC<WatchAppCommonProps> = ({
  db,
  inputs,
  onUpdateDb,
  onUpdateInputs,
}) => {
  const [showTips, setShowTips] = useState(false);
  const totalCa = db.meals.reduce((s, m) => s + m.calciumMg, 0);
  const caPct = Math.min(100, Math.round((totalCa / 1200) * 100));
  const waterPct = Math.min(100, Math.round((db.waterIntakeMl / 2400) * 100));

  const handleLogMeal = (preset: (typeof QUICK_MEALS)[number]) => {
    playTapClick(db.settings.muted);
    onUpdateDb((prev) => ({
      ...prev,
      waterIntakeMl: prev.waterIntakeMl + preset.waterMl,
      meals: [
        {
          id: `meal-${Date.now().toString(36)}`,
          name: preset.name,
          calories: preset.calories,
          calciumMg: preset.calciumMg,
          sodiumMg: preset.sodiumMg,
          waterMl: preset.waterMl,
          loggedAtUtc: new Date().toISOString().slice(11, 16),
        },
        ...prev.meals,
      ],
    }));
    onUpdateInputs({ calories: inputs.calories + Math.round(preset.calories * 0.25) });
  };

  return (
    <div className="space-y-2.5 text-white">
      {/* Visual Progress Bars for Calcium & Water */}
      <div className="rounded-2xl bg-emerald-950/80 border border-emerald-400/35 p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase text-emerald-300">
            Daily Food & Water
          </span>
          <button
            type="button"
            onClick={() => setShowTips(true)}
            className="px-2 py-0.5 rounded-lg bg-emerald-500/30 text-[9px] font-black text-emerald-200 flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-2.5 h-2.5" /> Tips
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold">
            <span>Bone Calcium</span>
            <span className="font-mono text-emerald-300">{totalCa}/1200 mg</span>
          </div>
          <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
            <div style={{ width: `${caPct}%` }} className="h-full bg-emerald-400 rounded-full" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold">
            <span>Water Drunk</span>
            <span className="font-mono text-sky-300">{db.waterIntakeMl}/2400 mL</span>
          </div>
          <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
            <div style={{ width: `${waterPct}%` }} className="h-full bg-sky-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* One-Tap Healthy Meals */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-extrabold uppercase text-slate-400">
          Tap to Add Meal
        </div>
        {QUICK_MEALS.map((m) => (
          <button
            key={m.name}
            type="button"
            onClick={() => handleLogMeal(m)}
            className="w-full text-left rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 p-2 flex items-center justify-between gap-2 cursor-pointer"
          >
            <div>
              <div className="text-xs font-extrabold text-white">{m.name}</div>
              <div className="text-[10px] font-mono text-emerald-300">
                +{m.calciumMg}mg Ca · +{m.waterMl}mL
              </div>
            </div>
            <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
          </button>
        ))}
      </div>

      {showTips && (
        <CardDetailModal
          title="Food & Water Tips"
          lines={[
            'Eat broccoli, fish, and eggs.',
            'Drink 6 water pouches daily.',
            'Keep salt low for eyes.',
          ]}
          onClose={() => setShowTips(false)}
        />
      )}
    </div>
  );
};

/* ---------------- 3. EMOTIONS APP (NO GRADING, PURE MOODS) ---------------- */
const MOOD_CHOICES: Array<{ id: AstronautPoseId; label: string; color: string; message: string }> = [
  { id: 'happy', label: 'Happy', color: 'bg-amber-400 text-slate-950', message: 'You feel bright and happy!' },
  { id: 'idle', label: 'Calm', color: 'bg-emerald-400 text-slate-950', message: 'Steady heart and peaceful mind.' },
  { id: 'worried', label: 'Worried', color: 'bg-sky-400 text-slate-950', message: 'Take 3 slow deep breaths.' },
  { id: 'sad', label: 'Sad', color: 'bg-indigo-400 text-slate-950', message: 'Call a friend or family.' },
  { id: 'angry', label: 'Angry', color: 'bg-rose-500 text-white', message: 'Drink cool water and rest.' },
  { id: 'sleepy', label: 'Sleepy', color: 'bg-purple-400 text-slate-950', message: 'Time for a cozy rest.' },
];

export const EmotionsAppView: React.FC<WatchAppCommonProps> = ({
  db,
  inputs,
  situation,
  onUpdateDb,
}) => {
  const [showTips, setShowTips] = useState(false);

  const defaultMood: AstronautPoseId =
    situation === 'bp_spike' || inputs.systolicBp >= 140
      ? 'worried'
      : situation === 'high_radiation' || inputs.radiationRate > 45
      ? 'surprised'
      : inputs.sleepHours < 6.2
      ? 'sleepy'
      : (db.selectedMood as AstronautPoseId) || 'happy';

  const [selectedPose, setSelectedPose] = useState<AstronautPoseId>(defaultMood);
  const currentMeta =
    MOOD_CHOICES.find((m) => m.id === selectedPose) || MOOD_CHOICES[0];

  const handleSelectMood = (pose: AstronautPoseId) => {
    playTapClick(db.settings.muted);
    setSelectedPose(pose);
    onUpdateDb((prev) => ({ ...prev, selectedMood: pose }));
  };

  return (
    <div className="space-y-2.5 text-white">
      {/* Expressive Hu Tao Astronaut Character */}
      <div className="rounded-2xl bg-[#211B2D] border border-orange-400/35 p-2.5 flex flex-col items-center text-center">
        <AstronautCharacterSvg emotion={selectedPose} size={118} />
        <div className="mt-1 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
          {currentMeta.label}
        </div>
        <div className="text-[11px] font-bold text-slate-200 mt-1">
          {currentMeta.message}
        </div>
      </div>

      {/* Simple Mood Selector Grid (No 88/100 score grading) */}
      <div className="grid grid-cols-3 gap-1.5">
        {MOOD_CHOICES.map((m) => {
          const active = selectedPose === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelectMood(m.id)}
              className={`py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition ${
                active ? m.color : 'bg-slate-900 text-slate-300 border border-slate-700'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowTips(true)}
        className="w-full py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1 cursor-pointer"
      >
        <Info className="w-3.5 h-3.5" /> Mood Care Tips
      </button>

      {showTips && (
        <CardDetailModal
          title="Mood Care"
          lines={[
            'Breathe slowly for 1 minute.',
            'Listen to calm space music.',
            'Chat with crewmates during meals.',
          ]}
          onClose={() => setShowTips(false)}
        />
      )}
    </div>
  );
};

/* ---------------- 4. DAILY STEPS & BONE APP ---------------- */
export const HealthInsightsAppView: React.FC<WatchAppCommonProps> = ({
  inputs,
}) => {
  const [showTips, setShowTips] = useState(false);
  const { boneMass } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);
  const stepPct = Math.min(100, Math.round((inputs.steps / 10000) * 100));

  const hourlyBars = [35, 62, 85, 48, 92, 74, Math.min(100, stepPct)];

  return (
    <div className="space-y-2.5 text-white">
      <div className="rounded-2xl bg-emerald-950/75 border border-emerald-500/40 p-2.5 space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] font-bold uppercase text-emerald-300">
              Daily steps
            </div>
            <div className="font-mono text-xl font-black">
              {inputs.steps.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-amber-300">Energy</div>
            <div className="font-mono text-base font-extrabold text-amber-300">
              {inputs.calories} kcal
            </div>
          </div>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
          <div style={{ width: `${stepPct}%` }} className="h-full bg-emerald-400 rounded-full" />
        </div>
      </div>

      {/* Hourly steps taken chart */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-2">
        <div className="text-[10px] font-bold uppercase text-slate-300">
          Hourly steps taken
        </div>
        <div className="grid grid-cols-7 gap-1.5 items-end h-14 pt-1">
          {hourlyBars.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full flex-1 flex items-end">
                <div
                  style={{ height: `${h}%` }}
                  className="w-full rounded-t bg-emerald-400"
                />
              </div>
              <span className="text-[8px] font-mono text-slate-400">{i * 3 + 6}h</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bone Strength Gauge Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase text-cyan-300">Bone Strength</div>
          <div className="font-mono text-base font-black text-white">{boneMass} g/cm²</div>
        </div>
        <button
          type="button"
          onClick={() => setShowTips(true)}
          className="px-2.5 py-1.5 rounded-xl bg-cyan-400 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer"
        >
          <Info className="w-3 h-3" /> Bone Tips
        </button>
      </div>

      {showTips && (
        <CardDetailModal
          title="Steps & Bone Tips"
          lines={[
            'Walk 10,000 steps every day.',
            'Do squats for leg bones.',
            'Eat calcium food at lunch.',
          ]}
          onClose={() => setShowTips(false)}
        />
      )}
    </div>
  );
};

/* ---------------- 5. PULSE WAVE & HEART APP ---------------- */
export const PulseWaveAppView: React.FC<WatchAppCommonProps> = ({ inputs }) => {
  const [showTips, setShowTips] = useState(false);
  const highBp = !inputs.exerciseActive && inputs.systolicBp >= 140;

  return (
    <div className="space-y-2.5 text-white">
      <div
        className={`rounded-2xl p-2.5 border ${
          highBp ? 'bg-red-950/90 border-red-400' : 'bg-rose-950/75 border-rose-500/40'
        }`}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] font-bold uppercase text-rose-300">Heart Rate</div>
            <div className="font-mono text-2xl font-black">
              {inputs.heartRate} <span className="text-xs">bpm</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-rose-300">Blood Pressure</div>
            <div className="font-mono text-lg font-extrabold">
              {inputs.systolicBp}/{inputs.diastolicBp}
            </div>
          </div>
        </div>

        {/* Live Pulse Wave SVG Chart */}
        <svg viewBox="0 0 220 46" className="w-full h-11 mt-1.5">
          <path
            d="M 0 28 L 28 28 L 38 10 L 48 40 L 58 18 L 68 28 L 110 28 L 122 8 L 132 40 L 142 18 L 152 28 L 220 28"
            fill="none"
            stroke="#FB7185"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <button
        type="button"
        onClick={() => setShowTips(true)}
        className="w-full py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-extrabold text-rose-300 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Info className="w-3.5 h-3.5" />
        <span>{highBp ? 'High BP Action Guide' : 'Heart Care Tips'}</span>
      </button>

      {showTips && (
        <CardDetailModal
          title="Heart & BP Guide"
          lines={
            highBp
              ? [
                  'Stop heavy work right now.',
                  'Sit down and breathe slowly.',
                  'Drink water and rest 15m.',
                ]
              : [
                  'Heart rate is healthy now.',
                  'Walk 30 minutes each day.',
                  'Keep salt low at dinner.',
                ]
          }
          onClose={() => setShowTips(false)}
        />
      )}
    </div>
  );
};

/* ---------------- 6. SPO2 OXYGEN APP ---------------- */
export const Spo2AppView: React.FC<WatchAppCommonProps> = ({ inputs }) => {
  const [showTips, setShowTips] = useState(false);
  const lowO2 = inputs.spo2 < 94;
  const highCo2 = inputs.cabinCo2 > 4.0;

  return (
    <div className="space-y-2.5 text-white">
      <div className="rounded-2xl bg-sky-950/80 border border-sky-400/40 p-3 text-center space-y-1.5">
        <div className="text-[10px] font-bold uppercase text-sky-300">Blood Oxygen</div>
        <div className="font-mono text-3xl font-black">{inputs.spo2.toFixed(1)}%</div>
        <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
          <div
            style={{ width: `${Math.max(40, Math.min(100, inputs.spo2))}%` }}
            className={`h-full rounded-full ${lowO2 ? 'bg-red-500' : 'bg-sky-400'}`}
          />
        </div>
      </div>

      {/* Room CO2 Mini Gauge */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-slate-400">Air CO2</div>
          <div className={`font-mono text-sm font-black ${highCo2 ? 'text-amber-300' : 'text-emerald-300'}`}>
            {inputs.cabinCo2} mmHg
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowTips(true)}
          className="px-2.5 py-1.5 rounded-xl bg-sky-400 text-slate-950 text-[10px] font-black flex items-center gap-1 cursor-pointer"
        >
          <Info className="w-3 h-3" /> Air Tips
        </button>
      </div>

      {showTips && (
        <CardDetailModal
          title="Oxygen & Air Tips"
          lines={[
            'Keep blood oxygen above 95%.',
            'Turn air fan on high.',
            'Take slow deep breaths.',
          ]}
          onClose={() => setShowTips(false)}
        />
      )}
    </div>
  );
};

/* ---------------- 7. RADIOMEASURE APP ---------------- */
export const RadiomeasureAppView: React.FC<WatchAppCommonProps> = ({ inputs }) => {
  const [showTips, setShowTips] = useState(false);
  const neutronDose = Number((inputs.radiationRate * 0.3).toFixed(1));
  const chargedDose = Number((inputs.radiationRate * 0.7).toFixed(1));
  const critical = inputs.radiationRate > 45;

  return (
    <div className="space-y-2.5 text-white">
      <div
        className={`rounded-2xl p-2.5 border flex items-center justify-between ${
          critical
            ? 'bg-red-950/90 border-red-400'
            : 'bg-amber-950/80 border-amber-400/50'
        }`}
      >
        <div>
          <div className="text-[10px] font-bold uppercase text-amber-300">
            Space Radiation
          </div>
          <div className="font-mono text-2xl font-black">
            {inputs.radiationRate} <span className="text-xs">uSv/h</span>
          </div>
          <div className="text-[10px] font-bold text-amber-200">
            {critical ? 'Go to safe room!' : 'Safe level right now'}
          </div>
        </div>
        {/* 3-Fan Radiation Trefoil Icon */}
        <svg width="38" height="38" viewBox="0 0 48 48" fill="none" className="shrink-0">
          <circle cx="24" cy="24" r="21" fill="#FACC15" stroke="#111827" strokeWidth="3" />
          <path d="M20.2 21.8L11.2 16.6A14.8 14.8 0 0 1 21.4 9.3L22.6 19.6A4.5 4.5 0 0 0 20.2 21.8Z" fill="#111827" />
          <path d="M27.8 21.8L36.8 16.6A14.8 14.8 0 0 0 26.6 9.3L25.4 19.6A4.5 4.5 0 0 1 27.8 21.8Z" fill="#111827" />
          <path d="M21.5 27.8L16.3 36.8A14.8 14.8 0 0 0 31.7 36.8L26.5 27.8A4.5 4.5 0 0 1 21.5 27.8Z" fill="#111827" />
          <circle cx="24" cy="24" r="3.6" fill="#111827" />
        </svg>
      </div>

      {/* Visual Split Bar Chart */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-2">
        <div className="text-[10px] font-extrabold uppercase text-slate-300">
          Radiation Breakdown
        </div>
        <div className="h-3.5 rounded-full overflow-hidden flex bg-slate-950">
          <div style={{ width: '70%' }} className="bg-amber-400" title="Solar Rays 70%" />
          <div style={{ width: '30%' }} className="bg-purple-500" title="Neutron Rays 30%" />
        </div>
        <div className="flex justify-between text-[10px] font-bold">
          <span className="text-amber-300">Solar: {chargedDose}</span>
          <span className="text-purple-300">Neutron: {neutronDose}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowTips(true)}
        className="w-full py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1 cursor-pointer"
      >
        <Info className="w-3.5 h-3.5" /> Radiation Safety Tips
      </button>

      {showTips && (
        <CardDetailModal
          title="Radiation Safety"
          lines={[
            'Stay under 45 uSv/h level.',
            'Move to shielded sleep room.',
            'Eat berries for cell health.',
          ]}
          onClose={() => setShowTips(false)}
        />
      )}
    </div>
  );
};

/* ---------------- 8. VIABILITY 3D WIREFRAME HUMAN BODY APP ---------------- */
type BodyPartId = 'head' | 'heart' | 'lungs' | 'arms' | 'core' | 'legs';

export const ViabilityAppView: React.FC<WatchAppCommonProps> = ({ inputs }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yawDeg, setYawDeg] = useState(24);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedPart, setSelectedPart] = useState<BodyPartId | null>(null);

  const { boneMass } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);

  const partStatuses: Record<
    BodyPartId,
    { label: string; status: 'Good' | 'Check'; value: string; tips: string[] }
  > = {
    head: {
      label: 'Head & Air',
      status: inputs.cabinCo2 > 4.0 ? 'Check' : 'Good',
      value: `CO2 ${inputs.cabinCo2} mmHg`,
      tips: [
        `Air CO2 is ${inputs.cabinCo2} mmHg.`,
        inputs.cabinCo2 > 4.0 ? 'Turn helmet fan to high.' : 'Helmet air is fresh.',
        'Rest eyes every 2 hours.',
      ],
    },
    heart: {
      label: 'Heart & BP',
      status: !inputs.exerciseActive && inputs.systolicBp >= 140 ? 'Check' : 'Good',
      value: `${inputs.systolicBp}/${inputs.diastolicBp} · ${inputs.heartRate} bpm`,
      tips: [
        `Heart beats ${inputs.heartRate} times/min.`,
        `Blood pressure is ${inputs.systolicBp}/${inputs.diastolicBp}.`,
        !inputs.exerciseActive && inputs.systolicBp >= 140
          ? 'Sit and breathe slowly.'
          : 'Heart rhythm is steady.',
      ],
    },
    lungs: {
      label: 'Lungs & Oxygen',
      status: inputs.spo2 < 94 ? 'Check' : 'Good',
      value: `SpO2 ${inputs.spo2.toFixed(1)}%`,
      tips: [
        `Blood oxygen is ${inputs.spo2.toFixed(1)}%.`,
        `Radiation badge: ${inputs.radiationRate} uSv/h.`,
        inputs.spo2 < 94 ? 'Check suit oxygen valve.' : 'Breathing is normal.',
      ],
    },
    arms: {
      label: 'Arms & Sweat',
      status: inputs.sweatSodium > 68 ? 'Check' : 'Good',
      value: `Salt ${inputs.sweatSodium} mmol/L`,
      tips: [
        `Sweat salt: ${inputs.sweatSodium} mmol/L.`,
        inputs.sweatSodium > 68 ? 'Drink water pouch now.' : 'Water balance is good.',
        'Wrist watch sensors active.',
      ],
    },
    core: {
      label: 'Core & Heat',
      status: inputs.coreTemp > 37.7 ? 'Check' : 'Good',
      value: `${inputs.coreTemp.toFixed(1)} °C`,
      tips: [
        `Body heat is ${inputs.coreTemp.toFixed(1)} °C.`,
        `Burned ${inputs.calories} kcal today.`,
        'Core muscles stay active.',
      ],
    },
    legs: {
      label: 'Legs & Bones',
      status: boneMass < 1.02 || inputs.shinPatchWet ? 'Check' : 'Good',
      value: `Bone ${boneMass} g/cm²`,
      tips: [
        `Shin bone score: ${boneMass} g/cm².`,
        `Walked ${inputs.steps.toLocaleString()} steps today.`,
        boneMass < 1.02 ? 'Do 45m squats today.' : 'Leg bones are strong.',
      ],
    },
  };

  useEffect(() => {
    if (!autoRotate) return;
    const id = window.setInterval(() => {
      setYawDeg((d) => (d + 3) % 360);
    }, 80);
    return () => window.clearInterval(id);
  }, [autoRotate]);

  // Render real 3D wireframe human mesh on black canvas (matching image_6e13a93a.png)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#030509';
    ctx.fillRect(0, 0, W, H);

    const rad = (yawDeg * Math.PI) / 180;
    const cosY = Math.cos(rad);
    const sinY = Math.sin(rad);

    const project = (x: number, y: number, z: number) => {
      const rx = x * cosY - z * sinY;
      const rz = x * sinY + z * cosY;
      const scale = 210 / (220 + rz);
      return {
        px: W / 2 + rx * scale,
        py: H / 2 + y * scale,
        rz,
      };
    };

    // Helper to draw a 3D wireframe cylinder/limb segment with latitude rings & longitude ribs
    const drawWireframeSegment = (
      p1: [number, number, number],
      p2: [number, number, number],
      r1: [number, number],
      r2: [number, number],
      rings: number,
      ribs: number,
      highlight: boolean
    ) => {
      ctx.strokeStyle = highlight ? '#FBBF24' : 'rgba(226, 232, 240, 0.78)';
      ctx.lineWidth = highlight ? 1.4 : 0.85;

      const ringPts: Array<Array<{ px: number; py: number }>> = [];

      for (let i = 0; i <= rings; i++) {
        const t = i / rings;
        const cx = p1[0] + (p2[0] - p1[0]) * t;
        const cy = p1[1] + (p2[1] - p1[1]) * t;
        const cz = p1[2] + (p2[2] - p1[2]) * t;
        const rx = r1[0] + (r2[0] - r1[0]) * t;
        const rz = r1[1] + (r2[1] - r1[1]) * t;

        const pts: Array<{ px: number; py: number }> = [];
        ctx.beginPath();
        for (let j = 0; j <= ribs; j++) {
          const a = (j / ribs) * Math.PI * 2;
          const vx = cx + Math.cos(a) * rx;
          const vz = cz + Math.sin(a) * rz;
          const pr = project(vx, cy, vz);
          if (j < ribs) pts.push(pr);
          if (j === 0) ctx.moveTo(pr.px, pr.py);
          else ctx.lineTo(pr.px, pr.py);
        }
        ctx.stroke();
        ringPts.push(pts);
      }

      // Draw longitudinal wireframe lines connecting rings
      for (let j = 0; j < ribs; j++) {
        ctx.beginPath();
        for (let i = 0; i <= rings; i++) {
          const pt = ringPts[i][j];
          if (i === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();
      }
    };

    // 1. Head Ellipsoid
    drawWireframeSegment([0, -76, 0], [0, -56, 0], [5, 5], [10, 10], 3, 10, partStatuses.head.status === 'Check');
    drawWireframeSegment([0, -56, 0], [0, -48, 0], [10, 10], [6, 6], 2, 10, partStatuses.head.status === 'Check');

    // 2. Neck & Upper Chest (Heart / Lungs)
    drawWireframeSegment(
      [0, -48, 0],
      [0, -24, 0],
      [7, 6],
      [19, 11],
      4,
      12,
      partStatuses.heart.status === 'Check' || partStatuses.lungs.status === 'Check'
    );

    // 3. Mid Torso & Pelvis (Core)
    drawWireframeSegment(
      [0, -24, 0],
      [0, 10, 0],
      [19, 11],
      [15, 9],
      5,
      12,
      partStatuses.core.status === 'Check'
    );

    // 4. Left & Right Arms (A-Pose matching reference image_6e13a93a.png)
    drawWireframeSegment([-19, -38, 0], [-42, 4, 2], [5.5, 5.5], [4, 4], 6, 8, partStatuses.arms.status === 'Check');
    drawWireframeSegment([19, -38, 0], [42, 4, 2], [5.5, 5.5], [4, 4], 6, 8, partStatuses.arms.status === 'Check');

    // 5. Left & Right Legs + Shins
    drawWireframeSegment([-9, 10, 0], [-14, 76, 0], [7.5, 7.5], [4.5, 4.5], 8, 8, partStatuses.legs.status === 'Check');
    drawWireframeSegment([9, 10, 0], [14, 76, 0], [7.5, 7.5], [4.5, 4.5], 8, 8, partStatuses.legs.status === 'Check');
  }, [yawDeg, inputs]);

  const handleCanvasTap = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (y < 0.24) setSelectedPart('head');
    else if (y < 0.52) {
      if (x < 0.28 || x > 0.72) setSelectedPart('arms');
      else if (x < 0.5) setSelectedPart('heart');
      else setSelectedPart('lungs');
    } else if (y < 0.64) setSelectedPart('core');
    else setSelectedPart('legs');
  };

  return (
    <div className="space-y-2 text-white">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 px-0.5">
        <span>Tap 3D body to check</span>
        <button
          type="button"
          onClick={() => setAutoRotate((r) => !r)}
          className="px-2 py-0.5 rounded-lg bg-slate-800 text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
        >
          <RotateCw className="w-2.5 h-2.5" /> {autoRotate ? '3D Spin ON' : 'Paused'}
        </button>
      </div>

      {/* Real 3D Wireframe Canvas on Black Background */}
      <div className="relative rounded-2xl overflow-hidden bg-[#030509] border border-slate-700 flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={210}
          height={185}
          onClick={handleCanvasTap}
          className="w-full h-[175px] object-contain cursor-pointer"
          aria-label="3D Wireframe Human Viability Model"
        />

        {/* Quick Body Part Pills */}
        <div className="w-full grid grid-cols-3 gap-1 p-1.5 bg-slate-950/90 border-t border-slate-800">
          {(['head', 'heart', 'lungs', 'arms', 'core', 'legs'] as BodyPartId[]).map((pid) => {
            const p = partStatuses[pid];
            const warn = p.status === 'Check';
            return (
              <button
                key={pid}
                type="button"
                onClick={() => setSelectedPart(pid)}
                className={`py-1 px-1.5 rounded-lg text-[9px] font-black truncate cursor-pointer ${
                  warn
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-900 text-slate-200 border border-slate-700'
                }`}
              >
                {p.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {selectedPart && (
        <CardDetailModal
          title={`${partStatuses[selectedPart].label} (${partStatuses[selectedPart].status})`}
          lines={partStatuses[selectedPart].tips}
          onClose={() => setSelectedPart(null)}
        />
      )}
    </div>
  );
};

/* ---------------- 9. H2O INTAKE DASHBOARD APP ---------------- */
export const H2oIntakeAppView: React.FC<WatchAppCommonProps> = ({
  db,
  onUpdateDb,
}) => {
  const [showTips, setShowTips] = useState(false);
  const goalMl = 2400;
  const currentMl = db.waterIntakeMl || 1650;
  const pct = Math.min(100, Math.round((currentMl / goalMl) * 100));
  const cupsCount = Math.round(currentMl / 250);

  const addWater = (amountMl: number) => {
    playTapClick(db.settings.muted);
    onUpdateDb((prev) => ({
      ...prev,
      waterIntakeMl: Math.max(0, Math.min(4000, (prev.waterIntakeMl || 0) + amountMl)),
    }));
  };

  const slots = [
    { label: '08:00', ml: Math.min(500, Math.round(currentMl * 0.25)) },
    { label: '12:00', ml: Math.min(600, Math.round(currentMl * 0.3)) },
    { label: '16:00', ml: Math.min(600, Math.round(currentMl * 0.25)) },
    { label: '20:00', ml: Math.max(0, currentMl - Math.round(currentMl * 0.8)) },
  ];

  return (
    <div className="space-y-2.5 text-white relative">
      {/* Main Water Dashboard Card */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-900 to-cyan-950 border border-sky-400/40 p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-sky-200">H2O Intake</div>
            <div className="font-mono text-2xl font-black">
              {currentMl} <span className="text-xs font-normal text-sky-200">/ {goalMl} mL</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm font-black text-cyan-300">{cupsCount} Cups</div>
            <div className="text-[10px] font-bold text-sky-200">{pct}% Goal</div>
          </div>
        </div>

        {/* Hydration Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-900/90 overflow-hidden">
          <div
            style={{ width: `${pct}%` }}
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all"
          />
        </div>
      </div>

      {/* Quick Drink Buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => addWater(250)}
          className="py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
        >
          <Droplets className="w-3.5 h-3.5" /> +1 Cup (250mL)
        </button>
        <button
          type="button"
          onClick={() => addWater(500)}
          className="py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
        >
          <Droplets className="w-3.5 h-3.5" /> +Bottle (500mL)
        </button>
      </div>

      {/* Daily Water Timeline Chart */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
          <span>Water Chart Today</span>
          <button
            type="button"
            onClick={() => setShowTips(true)}
            className="text-sky-300 flex items-center gap-0.5 cursor-pointer"
          >
            <Info className="w-3 h-3" /> Tips
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5 items-end h-14 pt-1">
          {slots.map((s) => {
            const barH = Math.min(100, Math.max(18, Math.round((s.ml / 600) * 100)));
            return (
              <div key={s.label} className="flex flex-col items-center gap-1 h-full justify-end">
                <div
                  style={{ height: `${barH}%` }}
                  className="w-full rounded-t-md bg-sky-400"
                />
                <span className="font-mono text-[9px] text-slate-400">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {showTips && (
        <CardDetailModal
          title="Water Tips"
          lines={[
            'Drink 8 cups of water daily.',
            'Drink extra water after workouts.',
            'Water keeps kidneys healthy in space.',
          ]}
          onClose={() => setShowTips(false)}
        />
      )}
    </div>
  );
};

export const StepsDetailAppView = HealthInsightsAppView;
export const HeartRateMeasuringAppView = PulseWaveAppView;


