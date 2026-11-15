import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Plus,
  Heart,
  Droplets,
  Radiation,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  computeBoneMetricsFromSoundWave,
  getAstronautEmotionFromState,
  LiveSensorInputs,
  SituationId,
} from '../../src/utils/metricsEngine';
import { AstronautCharacterSvg } from '../../src/components/SpaceCartoonIcons';
import {
  computeBodyViability,
  computeNutritionTotals,
  getSuggestedNutritionGuidance,
  MealEntry,
  VisitorWatchDatabase,
} from '../watchDb';
import { NASA_CSA_KNOWLEDGE } from '../nasaCsaKnowledge';
import { playTapClick } from '../watchAudio';

interface BiometricAppProps {
  db: VisitorWatchDatabase;
  inputs: LiveSensorInputs;
  situation: SituationId;
  onUpdateDb: (updater: (prev: VisitorWatchDatabase) => VisitorWatchDatabase) => void;
  onUpdateInputs: (partial: Partial<LiveSensorInputs>) => void;
}

export const SleepAppView: React.FC<BiometricAppProps> = ({ db, inputs }) => {
  const s = db.sleep;
  const totalMin = s.remMinutes + s.deepMinutes + s.lightMinutes + s.awakeMinutes;
  return (
    <div className="space-y-3 text-white">
      <div className="rounded-2xl bg-indigo-950/90 border border-indigo-400/30 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
            UTC-0 Sleep
          </span>
          <span className="font-mono text-xs font-extrabold text-emerald-300">
            Score {s.score}/100
          </span>
        </div>
        <div className="font-mono text-2xl font-extrabold mt-0.5 tabular-nums">
          {inputs.sleepHours.toFixed(1)} hrs
        </div>
        <div className="text-[11px] text-slate-300 font-mono">
          {s.bedtimeUtc} → {s.wakeUtc} UTC-0
        </div>
      </div>

      {/* Stage distribution bar */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-2">
        <div className="h-3 rounded-full overflow-hidden flex bg-slate-800">
          <div style={{ width: `${(s.deepMinutes / totalMin) * 100}%` }} className="bg-indigo-500" />
          <div style={{ width: `${(s.remMinutes / totalMin) * 100}%` }} className="bg-cyan-400" />
          <div style={{ width: `${(s.lightMinutes / totalMin) * 100}%` }} className="bg-violet-400" />
          <div style={{ width: `${(s.awakeMinutes / totalMin) * 100}%` }} className="bg-amber-400" />
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
          <div className="bg-slate-800/80 rounded-lg px-2 py-1">Deep: {s.deepMinutes}m</div>
          <div className="bg-slate-800/80 rounded-lg px-2 py-1">REM: {s.remMinutes}m</div>
          <div className="bg-slate-800/80 rounded-lg px-2 py-1">Light: {s.lightMinutes}m</div>
          <div className="bg-slate-800/80 rounded-lg px-2 py-1">Awake: {s.awakeMinutes}m</div>
        </div>
      </div>

      {/* Exact UTC-0 Timeline */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-1.5">
        <div className="text-[11px] font-bold uppercase text-slate-400">UTC-0 Stages Timeline</div>
        {s.segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-200 font-bold">{seg.stage}</span>
            <span className="text-slate-400">
              {seg.startUtc}-{seg.endUtc} ({seg.minutes}m)
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-emerald-950/60 border border-emerald-500/40 p-2.5 text-[11px] leading-snug text-emerald-100">
        <span className="font-extrabold text-emerald-300">Guidance: </span>
        {s.recommendation}
      </div>
    </div>
  );
};

export const NutritionsAppView: React.FC<BiometricAppProps> = ({ db, inputs, onUpdateDb }) => {
  const [slot, setSlot] = useState<MealEntry['slot']>('Snack');
  const [name, setName] = useState('');
  const totals = computeNutritionTotals(db.meals);
  const tips = getSuggestedNutritionGuidance(inputs, db.meals);

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim() || 'Calcium & Berry Recovery Pack';
    playTapClick(db.settings.muted);
    const entry: MealEntry = {
      id: `meal-${Date.now().toString(36)}`,
      slot,
      name: clean,
      calories: slot === 'Snack' ? 280 : 620,
      proteinG: slot === 'Snack' ? 14 : 36,
      calciumMg: 380,
      sodiumMg: 310,
      potassiumMg: 540,
      vitDIu: 500,
      loggedAtUtc: new Date().toISOString(),
    };
    onUpdateDb((prev) => ({ ...prev, meals: [entry, ...prev.meals] }));
    setName('');
  };

  return (
    <div className="space-y-3 text-white">
      <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500/40 p-2.5">
        <div className="text-[11px] font-bold uppercase text-emerald-300">Daily Nutrients Sync</div>
        <div className="grid grid-cols-3 gap-1.5 mt-1.5 font-mono text-[11px]">
          <div className="bg-slate-900/80 rounded-lg p-1.5">
            <div className="text-slate-400">kcal</div>
            <div className="font-extrabold text-white">{totals.calories}</div>
          </div>
          <div className="bg-slate-900/80 rounded-lg p-1.5">
            <div className="text-slate-400">Ca mg</div>
            <div className="font-extrabold text-emerald-300">{totals.calciumMg}</div>
          </div>
          <div className="bg-slate-900/80 rounded-lg p-1.5">
            <div className="text-slate-400">Na+ mg</div>
            <div className="font-extrabold text-amber-300">{totals.sodiumMg}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleAddMeal} className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-2">
        <div className="text-[11px] font-bold text-slate-300">Log Meal Ration</div>
        <div className="flex gap-1.5">
          <select
            aria-label="Meal slot"
            value={slot}
            onChange={(e) => setSlot(e.target.value as MealEntry['slot'])}
            className="bg-slate-800 text-white text-[11px] font-bold rounded-lg px-2 py-1.5 border border-slate-600"
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Food pouch..."
            className="flex-1 min-w-0 bg-slate-800 text-white text-[11px] rounded-lg px-2 py-1.5 border border-slate-600"
          />
          <button
            type="submit"
            aria-label="Add meal"
            className="bg-emerald-500 text-slate-950 font-black rounded-lg px-2.5 py-1.5 text-xs flex items-center"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-1.5">
        <div className="text-[11px] font-bold uppercase text-amber-300">Suit Detector Guidance</div>
        {tips.map((t, i) => (
          <p key={i} className="text-[11px] text-slate-200 leading-snug">
            • {t}
          </p>
        ))}
      </div>

      <div className="space-y-1.5">
        {db.meals.map((m) => (
          <div key={m.id} className="rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-2 flex items-center justify-between text-[11px]">
            <div>
              <div className="font-bold text-white">{m.slot}: {m.name}</div>
              <div className="text-slate-400 font-mono">
                {m.calories} kcal · Ca {m.calciumMg}mg · VitD {m.vitDIu}IU
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EmotionsAppView: React.FC<BiometricAppProps> = ({ inputs, situation }) => {
  const emotion = getAstronautEmotionFromState(situation, inputs);
  const moodIndex = Math.max(
    18,
    Math.min(
      98,
      Math.round(
        96 -
          Math.max(0, inputs.systolicBp - 125) * 0.9 -
          Math.max(0, inputs.radiationRate - 20) * 0.45 -
          Math.max(0, 7.0 - inputs.sleepHours) * 7
      )
    )
  );

  return (
    <div className="space-y-3 text-white text-center">
      <div className="rounded-2xl bg-[#211B2D] border border-purple-400/30 p-3 flex flex-col items-center">
        <AstronautCharacterSvg
          emotion={emotion}
          continuous={{
            moodContinuum: moodIndex,
            heartRate: inputs.heartRate,
            radiationRate: inputs.radiationRate,
            sleepHours: inputs.sleepHours,
          }}
          size={118}
        />
        <div className="font-mono text-lg font-extrabold text-amber-300 mt-1">
          Wellbeing: {moodIndex}/100
        </div>
        <div className="text-[11px] text-slate-200 capitalize">
          Live Suit Mood: {emotion}
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 text-left text-[11px] space-y-1">
        <div className="font-bold text-cyan-300">Isolation & Behavioral Readiness</div>
        <p className="text-slate-300 leading-snug">
          Continuous emotion derives from HRV stability, sleep hours ({inputs.sleepHours}h), CO2 pockets ({inputs.cabinCo2} mmHg), and workload.
        </p>
      </div>
    </div>
  );
};

export const HeartRateMeasuringAppView: React.FC<BiometricAppProps> = ({ inputs, db }) => {
  const [measuring, setMeasuring] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMeasuring(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMeasuring(false), 1400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputs.heartRate]);

  return (
    <div className="flex flex-col items-center justify-center text-center text-white py-2 space-y-3">
      <div className="font-mono text-2xl font-extrabold tracking-tight tabular-nums">
        {measuring ? '-- --' : inputs.heartRate}{' '}
        <span className="text-sm text-slate-400 font-bold">bpm</span>
      </div>

      {/* Recreates user reference glowing coral heart */}
      <div className="relative flex items-center justify-center w-24 h-24">
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-500 ${
            measuring ? 'bg-rose-500/45 animate-pulse' : 'bg-rose-500/20'
          }`}
        />
        <svg viewBox="0 0 100 90" className="w-20 h-20 drop-shadow-[0_0_16px_rgba(244,63,94,0.75)]">
          <defs>
            <radialGradient id="watchHeartGlow" cx="38%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="55%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#B91C1C" />
            </radialGradient>
          </defs>
          <path
            d="M50 84C50 84 10 58 10 31C10 16 22 6 35 6C43 6 48 11 50 15C52 11 57 6 65 6C78 6 90 16 90 31C90 58 50 84 50 84Z"
            fill="url(#watchHeartGlow)"
          />
        </svg>
      </div>

      <div className="text-sm font-bold text-slate-200">
        {measuring
          ? 'Measuring...'
          : `BP ${inputs.systolicBp}/${inputs.diastolicBp} mmHg · ${
              inputs.exerciseActive ? 'Workout Zone' : 'Resting'
            }`}
      </div>

      <button
        type="button"
        onClick={() => {
          playTapClick(db.settings.muted);
          setMeasuring(true);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setMeasuring(false), 1200);
        }}
        className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white cursor-pointer"
      >
        Re-Measure PPG
      </button>
    </div>
  );
};

export const StepsDetailAppView: React.FC<BiometricAppProps> = ({ db, inputs, onUpdateInputs }) => {
  const goal = 10000;
  const pct = Math.min(100, Math.round((inputs.steps / goal) * 100));
  return (
    <div className="space-y-3 text-white">
      <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500/40 p-3">
        <div className="text-[11px] font-bold uppercase text-emerald-300">Daily Step Equiv</div>
        <div className="font-mono text-2xl font-extrabold tabular-nums">
          {inputs.steps.toLocaleString()}
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-2">
          <div style={{ width: `${pct}%` }} className="h-full bg-emerald-400 rounded-full" />
        </div>
        <div className="text-[11px] font-mono text-slate-300 mt-1">
          {pct}% of {goal.toLocaleString()} target
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 space-y-1.5">
        <div className="text-[11px] font-bold text-slate-400 uppercase">Hourly UTC-0 Timeline</div>
        <div className="flex items-end gap-1.5 h-20 pt-2">
          {db.hourlySteps.map((h, idx) => {
            const delta = idx === db.hourlySteps.length - 1 ? inputs.steps - 8420 : 0;
            const barSteps = Math.max(0, h.steps + delta);
            const barH = Math.max(18, Math.min(100, Math.round((barSteps / 2400) * 100)));
            return (
              <div key={h.hourUtc} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-slate-800 rounded-t-md h-14 flex items-end overflow-hidden">
                  <div style={{ height: `${barH}%` }} className="w-full bg-emerald-400 rounded-t-md transition-all" />
                </div>
                <span className="font-mono text-[9px] text-slate-400">{h.hourUtc.slice(0, 2)}h</span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          playTapClick(db.settings.muted);
          onUpdateInputs({ steps: inputs.steps + 500, calories: inputs.calories + 28 });
        }}
        className="w-full py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
      >
        +500 Manual Resistance Steps
      </button>
    </div>
  );
};

export const PulseWaveAppView: React.FC<BiometricAppProps> = ({ inputs, db }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      ctx.strokeStyle = inputs.heartRate > 120 && !inputs.exerciseActive ? '#F59E0B' : '#F43F5E';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      const speed = Math.max(1.2, inputs.heartRate / 48);
      for (let x = 0; x < w; x++) {
        const phase = ((x + frame * speed) % 60) / 60;
        let y = h * 0.56;
        if (phase > 0.18 && phase < 0.24) y -= 8;
        else if (phase >= 0.28 && phase < 0.31) y += 10;
        else if (phase >= 0.31 && phase < 0.35) y -= 34;
        else if (phase >= 0.35 && phase < 0.39) y += 14;
        else if (phase >= 0.48 && phase < 0.62) y -= Math.sin(((phase - 0.48) / 0.14) * Math.PI) * 11;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      frame += 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [inputs.heartRate, inputs.exerciseActive]);

  const rhythmStatus =
    inputs.heartRate > 120 && !inputs.exerciseActive
      ? 'Elevated Resting Tachycardia — Rest & Breathe'
      : 'Regular Sinus Rhythm · No AFib Detected';

  return (
    <div className="space-y-3 text-white">
      <div className="rounded-2xl bg-slate-950 border border-rose-500/40 p-2.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-rose-400 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" /> Lead-I ECG/PPG
          </span>
          <span className="font-mono text-white">{inputs.heartRate} bpm</span>
        </div>
        <canvas ref={canvasRef} width={220} height={88} className="w-full h-22 rounded-xl" />
        <div className="text-[11px] font-bold text-emerald-300">{rhythmStatus}</div>
      </div>

      <button
        type="button"
        onClick={() => {
          playTapClick(db.settings.muted);
          setScanning(true);
          setTimeout(() => setScanning(false), 1800);
        }}
        className="w-full py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer"
      >
        {scanning ? 'Analyzing Pulse Morphology...' : 'Run Arrhythmia Check'}
      </button>
    </div>
  );
};

export const Spo2AppView: React.FC<BiometricAppProps> = ({ inputs, db }) => {
  const [testing, setTesting] = useState(false);
  const lowO2 = inputs.spo2 < 94;
  return (
    <div className="space-y-3 text-white text-center">
      <div className={`rounded-2xl p-3 border ${lowO2 ? 'bg-red-950 border-red-400' : 'bg-sky-950/80 border-sky-400/40'}`}>
        <Droplets className="w-7 h-7 mx-auto text-sky-400 mb-1" />
        <div className="font-mono text-3xl font-extrabold tabular-nums">
          {testing ? '--.-' : inputs.spo2.toFixed(1)}%
        </div>
        <div className="text-[11px] font-bold text-sky-200 mt-1">
          {lowO2 ? 'Hypobaric Hypoxia Alert!' : 'Blood Oxygen Optimal (>=94%)'}
        </div>
      </div>
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 text-left text-[11px] text-slate-300">
        {lowO2
          ? 'Verify EVA suit O2 supply valve & breathe 100% reserve mask.'
          : 'NASA Exploration Atmosphere safe (19.5–23.5% O2 envelope).'}
      </div>
      <button
        type="button"
        onClick={() => {
          playTapClick(db.settings.muted);
          setTesting(true);
          setTimeout(() => setTesting(false), 1200);
        }}
        className="w-full py-2 rounded-xl bg-sky-500 text-slate-950 font-black text-xs cursor-pointer"
      >
        {testing ? 'Shining Red/IR LED...' : 'Measure SpO2 Now'}
      </button>
    </div>
  );
};

export const RadiomeasureAppView: React.FC<BiometricAppProps> = ({ db, inputs }) => {
  const cansNeutron = Number((inputs.radiationRate * 0.31).toFixed(1));
  const protonFlux = Number((inputs.radiationRate * 0.69).toFixed(1));
  const storm = inputs.radiationRate > 45;
  return (
    <div className="space-y-3 text-white">
      <div className={`rounded-2xl p-3 border ${storm ? 'bg-red-950 border-red-400' : 'bg-amber-950/60 border-amber-400/40'}`}>
        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
          <span className="flex items-center gap-1"><Radiation className="w-3.5 h-3.5" /> CSA CANS + PIN</span>
          <span className="font-mono">{db.cumulativeRadiationMSv} mSv</span>
        </div>
        <div className="font-mono text-2xl font-extrabold mt-1 tabular-nums">
          {inputs.radiationRate} uSv/h
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px] font-mono">
          <div className="bg-slate-900/90 rounded-lg p-1.5">
            <div className="text-slate-400">Neutrons (~31%)</div>
            <div className="font-bold text-amber-300">{cansNeutron} uSv/h</div>
          </div>
          <div className="bg-slate-900/90 rounded-lg p-1.5">
            <div className="text-slate-400">Protons/GCR</div>
            <div className="font-bold text-cyan-300">{protonFlux} uSv/h</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 text-[11px] space-y-1">
        <div className="font-bold text-slate-200">Eye Lens & Marrow Caps</div>
        <div className="text-slate-400 font-mono">Career Cap Progress: {Math.round((db.cumulativeRadiationMSv / 600) * 100)}% of 600 mSv</div>
        <p className="text-slate-300 leading-snug">
          {storm
            ? 'STORM ALERT: Enter polyethylene/water-shielded sleeping berth now!'
            : 'Secondary wall neutrons monitored live via Canadian Active Neutron Spectrometer.'}
        </p>
      </div>
    </div>
  );
};

export const HealthInsightsAppView: React.FC<BiometricAppProps> = ({ inputs }) => {
  const [filter, setFilter] = useState<string>('all');
  const { boneMass } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);
  const filtered =
    filter === 'all'
      ? NASA_CSA_KNOWLEDGE.slice(0, 12)
      : NASA_CSA_KNOWLEDGE.filter((k) => k.sourceId === filter).slice(0, 8);

  return (
    <div className="space-y-3 text-white">
      <div className="rounded-2xl bg-cyan-950/70 border border-cyan-400/30 p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
          <Activity className="w-3.5 h-3.5" /> Multi-System Insights
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-2 font-mono text-[11px]">
          <div className="bg-slate-900/90 rounded-lg p-1.5">Bone: {boneMass} g/cm²</div>
          <div className="bg-slate-900/90 rounded-lg p-1.5">SOS: {inputs.tibialSoundSpeed} m/s</div>
          <div className="bg-slate-900/90 rounded-lg p-1.5">Na+ Sweat: {inputs.sweatSodium}</div>
          <div className="bg-slate-900/90 rounded-lg p-1.5">Core: {inputs.coreTemp} °C</div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Top' },
          { id: 'nasa_hazards', label: '5 Hazards' },
          { id: 'nasa_risks', label: 'Risks' },
          { id: 'csa_radiation', label: 'CSA CANS' },
          { id: 'nasa_ongoing', label: 'CIPHER' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer ${
              filter === tab.id ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-xl bg-slate-900 border border-slate-700 p-2 text-[11px]">
            <div className="font-bold text-cyan-300">{item.title}</div>
            <div className="text-slate-300 leading-snug mt-0.5">{item.plainSummary}</div>
            <div className="text-emerald-300 font-bold mt-1">Action: {item.watchAction}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ViabilityAppView: React.FC<BiometricAppProps> = ({ db, inputs }) => {
  const { overallScore, regions } = computeBodyViability(inputs, db);
  const [selectedId, setSelectedId] = useState<'head' | 'heart' | 'lungs' | 'tibia' | 'muscle' | 'sweat'>('heart');
  const activeRegion = regions.find((r) => r.id === selectedId) || regions[0];

  const zoneColor = (id: typeof selectedId) => {
    const r = regions.find((x) => x.id === id);
    if (!r) return '#10B981';
    return r.status === 'critical' ? '#EF4444' : r.status === 'warning' ? '#F59E0B' : '#10B981';
  };

  return (
    <div className="space-y-2.5 text-white">
      <div className="rounded-2xl bg-emerald-950/70 border border-emerald-500/40 p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Body Viability
          </div>
          <div className="font-mono text-2xl font-extrabold tabular-nums">
            {overallScore}
            <span className="text-xs text-slate-300 font-bold">/100</span>
          </div>
        </div>
        <div className="text-right text-[10px] font-mono text-slate-300">
          <div>SpO2 {inputs.spo2}%</div>
          <div>Temp {inputs.coreTemp}°C</div>
        </div>
      </div>

      {/* Clickable Cute Astronaut Body Map */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2 flex items-center gap-2">
        <svg viewBox="0 0 120 150" className="w-24 h-30 shrink-0" aria-label="Interactive astronaut body anatomy">
          {/* Helmet / Head */}
          <g onClick={() => setSelectedId('head')} className="cursor-pointer">
            <circle cx="60" cy="26" r="18" fill={zoneColor('head')} fillOpacity="0.28" stroke={zoneColor('head')} strokeWidth="3" />
            <circle cx="54" cy="25" r="2.2" fill="#FFF" />
            <circle cx="66" cy="25" r="2.2" fill="#FFF" />
            <path d="M55 31C57 34 63 34 65 31" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
          </g>
          {/* Torso Suit */}
          <rect x="38" y="48" width="44" height="44" rx="12" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />
          {/* Lungs */}
          <ellipse cx="50" cy="63" rx="6" ry="8" fill={zoneColor('lungs')} className="cursor-pointer" onClick={() => setSelectedId('lungs')} />
          {/* Heart */}
          <circle cx="68" cy="64" r="6" fill={zoneColor('heart')} className="cursor-pointer" onClick={() => setSelectedId('heart')} />
          {/* Forearm Sweat Node */}
          <g onClick={() => setSelectedId('sweat')} className="cursor-pointer">
            <rect x="20" y="54" width="15" height="28" rx="6" fill={zoneColor('sweat')} fillOpacity="0.35" stroke={zoneColor('sweat')} strokeWidth="2.5" />
            <rect x="85" y="54" width="15" height="28" rx="6" fill="#334155" stroke="#94A3B8" strokeWidth="2" />
          </g>
          {/* Thigh Muscle + Shin Bone */}
          <rect x="41" y="94" width="16" height="24" rx="6" fill={zoneColor('muscle')} fillOpacity="0.35" stroke={zoneColor('muscle')} strokeWidth="2.5" className="cursor-pointer" onClick={() => setSelectedId('muscle')} />
          <rect x="63" y="94" width="16" height="24" rx="6" fill={zoneColor('muscle')} fillOpacity="0.35" stroke={zoneColor('muscle')} strokeWidth="2.5" className="cursor-pointer" onClick={() => setSelectedId('muscle')} />
          <rect x="41" y="120" width="16" height="22" rx="6" fill={zoneColor('tibia')} fillOpacity="0.45" stroke={zoneColor('tibia')} strokeWidth="2.5" className="cursor-pointer" onClick={() => setSelectedId('tibia')} />
          <rect x="63" y="120" width="16" height="22" rx="6" fill={zoneColor('tibia')} fillOpacity="0.45" stroke={zoneColor('tibia')} strokeWidth="2.5" className="cursor-pointer" onClick={() => setSelectedId('tibia')} />
        </svg>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap gap-1">
            {regions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold cursor-pointer ${
                  selectedId === r.id
                    ? 'bg-white text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {r.id.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="text-xs font-extrabold text-white pt-1">{activeRegion.label}</div>
          <div className="font-mono text-[11px] font-bold text-emerald-300">
            Score {activeRegion.score}/100 ({activeRegion.status})
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2.5 text-[11px] space-y-1">
        <div className="font-mono text-slate-200">{activeRegion.metricsText}</div>
        <div className="text-amber-300 font-bold flex items-start gap-1">
          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{activeRegion.actionTip}</span>
        </div>
      </div>
    </div>
  );
};
