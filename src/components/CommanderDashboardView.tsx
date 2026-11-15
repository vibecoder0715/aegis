import React, { useState } from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import {
  CrewMember,
  evaluateCrewMemberStatus,
} from '../utils/metricsEngine';
import {
  AstronautCharacterSvg,
  AstronautPoseId,
  WinkingMarsSvg,
  CuteSatelliteSvg,
  RedCircleArrowBadge,
} from './SpaceCartoonIcons';

export interface AegisBuffAppraisal {
  visitorId: string;
  level: number;
  title: string;
  xp: number;
  aegisPoints: number;
  completedTasks: number;
  totalTasks: number;
  planetDecorCount: number;
}

interface CommanderDashboardViewProps {
  crew: CrewMember[];
  onUpdateCrewMember: (updated: CrewMember) => void;
  buffAppraisal?: AegisBuffAppraisal;
}

const MEAL_PRESETS = [
  'High-Calcium Salmon & Kale + Vit D3/K2',
  'Balanced Meal + Vitamin D3',
  'Low-Sodium Potassium Meal + Electrolyte Pouch',
  'Tryptophan Evening Meal + Omega-3',
  'Antioxidant Berry & Iron Radioprotective Ration',
];

const EXERCISE_PRESETS = [
  'Heavy Heel Raises & Deadlifts 60m',
  'Resistive Squat 45m + Treadmill 30m',
  'Cycle Ergometer 40m + Core 40m',
  'Light Recovery Stretching & Paced Breathing',
];

export const CommanderDashboardView: React.FC<CommanderDashboardViewProps> = ({
  crew,
  onUpdateCrewMember,
  buffAppraisal,
}) => {
  const [selectedId, setSelectedId] = useState<string>(crew[1]?.id || crew[0].id);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const selectedMember = crew.find((c) => c.id === selectedId) || crew[0];
  const evaluation = evaluateCrewMemberStatus(selectedMember);

  const getMemberPose = (member: CrewMember): AstronautPoseId => {
    const ev = evaluateCrewMemberStatus(member);
    if (ev.status === 'critical') return 'surprised';
    if (member.vitals.boneMass < member.thresholds.minBoneMass) return 'thinking';
    if (member.vitals.sleepScore < 76) return 'sleepy';
    if (member.id === 'astronaut-1') return 'wink';
    if (member.id === 'astronaut-4') return 'greeting';
    return 'happy';
  };

  const handleThresholdChange = (
    field: keyof CrewMember['thresholds'],
    value: number
  ) => {
    const updated: CrewMember = {
      ...selectedMember,
      thresholds: {
        ...selectedMember.thresholds,
        [field]: value,
      },
    };
    const nextEval = evaluateCrewMemberStatus(updated);
    updated.status = nextEval.status;
    onUpdateCrewMember(updated);
  };

  const handleSaveProtocol = async (mealPlan: string, exerciseProtocol: string) => {
    const updated: CrewMember = {
      ...selectedMember,
      mealPlan,
      exerciseProtocol,
    };
    onUpdateCrewMember(updated);

    try {
      await fetch('/api/crew/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updated.id,
          thresholds: updated.thresholds,
          mealPlan: updated.mealPlan,
          exerciseProtocol: updated.exerciseProtocol,
        }),
      });
    } catch {
      // Local state already updated
    }
    setSaveBanner(`Transmitted updated meal & workout countermeasure plan to ${updated.name}'s watch.`);
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-28">
      {/* SECTION 1: FULL-BLEED BACKGROUND IMAGE BANNER (Real Operational Telemetry) */}
      <section className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden p-5 sm:p-10 lg:p-12 text-white shadow-xl border border-slate-200">
        <img
          src="/images/peer_mesh.jpg"
          alt="Commander Multi-Crew Telemetry & UWB Mesh"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-slate-950/92 via-slate-950/78 to-slate-900/50" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          <div className="max-w-2xl space-y-2.5 sm:space-y-3">
            <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-rose-300">
              COMMANDER FLIGHT SURGEON CONSOLE · ALL 4 ASTRONAUTS
            </div>
            <h1 className="text-2xl sm:text-5xl font-black tracking-tight">
              Crew Monitoring & Peer Rescue Mesh
            </h1>
            <p className="text-base sm:text-xl font-bold text-slate-200">
              Monitor every astronaut individually, configure critical warning limits, and prescribe nutritional and resistive bone-loss countermeasures.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 sm:p-6 text-left lg:text-right space-y-1">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-300">
              6.5 GHz UWB PEER MESH ACTIVE
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-white">
              4 / 4 Crew Linked
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-300">
              Range: 150m Autonomous Relay
            </div>
          </div>
        </div>
      </section>

      {/* AEGIS BUFF! CREW APPRAISAL SUMMARY */}
      {buffAppraisal && (
        <section
          aria-label="Aegis Buff Appraisal"
          className="rounded-[24px] sm:rounded-[30px] bg-white border-2 border-violet-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-violet-700">
                AEGIS BUFF! DAILY SELF-CARE APPRAISAL
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                Lv.{buffAppraisal.level} {buffAppraisal.title} · {buffAppraisal.xp} XP
              </div>
              <div className="text-xs font-bold text-slate-500">
                Visitor Watch DB: {buffAppraisal.visitorId}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 font-mono text-center">
            <div className="px-3 py-2 rounded-2xl bg-violet-50 border border-violet-200">
              <div className="text-[11px] font-bold text-slate-500">Daily Tasks</div>
              <div className="text-base sm:text-lg font-black text-violet-900">
                {buffAppraisal.completedTasks}/{buffAppraisal.totalTasks}
              </div>
            </div>
            <div className="px-3 py-2 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-[11px] font-bold text-slate-500">AegisPoints</div>
              <div className="text-base sm:text-lg font-black text-amber-700">
                {buffAppraisal.aegisPoints}
              </div>
            </div>
            <div className="px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-[11px] font-bold text-slate-500">Planet Props</div>
              <div className="text-base sm:text-lg font-black text-emerald-700">
                {buffAppraisal.planetDecorCount}
              </div>
            </div>
          </div>
        </section>
      )}

      {saveBanner && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-black text-base sm:text-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <span>{saveBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveBanner(null)}
            className="text-sm font-black underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 2: 4 CREW ROSTER CARDS WITH CONTINUOUS EMOTION ASTRONAUT AVATARS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {crew.map((member) => {
          const ev = evaluateCrewMemberStatus(member);
          const isSelected = member.id === selectedMember.id;
          const pose = getMemberPose(member);

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedId(member.id)}
              className={`p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                    ev.status === 'critical'
                      ? 'bg-red-600 text-white'
                      : ev.status === 'warning'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  {ev.status}
                </span>
                <span className="font-mono text-xs font-bold opacity-75">
                  {member.moduleLocation} · {member.distanceMeters}m
                </span>
              </div>

              <div className="flex items-center gap-3">
                <AstronautCharacterSvg
                  emotion={pose}
                  size={84}
                />
                <div>
                  <h3 className="text-xl sm:text-2xl font-black leading-tight">{member.name}</h3>
                  <div className="text-xs sm:text-sm font-bold opacity-80">{member.role}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/25 grid grid-cols-2 gap-2 font-mono text-xs sm:text-sm font-black">
                <div>BP: {member.vitals.systolicBp}/{member.vitals.diastolicBp}</div>
                <div>Bone: {member.vitals.boneMass}</div>
                <div>Rad: {member.vitals.radiationRate}</div>
                <div>CO2: {member.vitals.cabinCo2}</div>
              </div>
            </button>
          );
        })}
      </section>

      {/* SECTION 3: SELECTED ASTRONAUT THRESHOLD & COUNTERMEASURE INSPECTOR */}
      <section className="bg-white rounded-[28px] sm:rounded-[36px] p-5 sm:p-10 border-2 border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-4 bg-[#211B2D] text-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border-2 border-slate-800 flex flex-col items-center text-center justify-between">
          <div className="w-full flex items-center justify-between">
            <WinkingMarsSvg size={44} />
            <CuteSatelliteSvg size={44} />
          </div>

          <AstronautCharacterSvg
            emotion={getMemberPose(selectedMember)}
            size={200}
            showCaptionPill={true}
          />

          <div className="space-y-2 mt-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedMember.name}</h2>
            <p className="text-sm sm:text-base font-extrabold text-slate-300">
              {selectedMember.conditionSummary}
            </p>
            {evaluation.reasons.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-400 text-slate-950 text-xs sm:text-sm font-black">
                {evaluation.reasons.join(' · ')}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              1. Per-Astronaut Warning Thresholds ({selectedMember.name})
            </h3>
            <p className="text-lg font-bold text-slate-600">
              Adjust critical limits below; when live telemetry crosses a limit, the astronaut&apos;s watch and continuous emotion avatar update automatically.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-base font-black">
                  <span>Max Systolic BP</span>
                  <span className="font-mono text-blue-700">
                    {selectedMember.thresholds.maxSystolicBp} mmHg
                  </span>
                </div>
                <input
                  type="range"
                  min={115}
                  max={160}
                  value={selectedMember.thresholds.maxSystolicBp}
                  onChange={(e) =>
                    handleThresholdChange('maxSystolicBp', Number(e.target.value))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="text-xs font-bold text-slate-500">
                  Current: {selectedMember.vitals.systolicBp} mmHg
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-base font-black">
                  <span>Min Bone Mass</span>
                  <span className="font-mono text-blue-700">
                    {selectedMember.thresholds.minBoneMass} g/cm²
                  </span>
                </div>
                <input
                  type="range"
                  min={0.85}
                  max={1.2}
                  step={0.02}
                  value={selectedMember.thresholds.minBoneMass}
                  onChange={(e) =>
                    handleThresholdChange('minBoneMass', Number(e.target.value))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="text-xs font-bold text-slate-500">
                  Current: {selectedMember.vitals.boneMass} g/cm²
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-base font-black">
                  <span>Max Radiation</span>
                  <span className="font-mono text-blue-700">
                    {selectedMember.thresholds.maxRadiationRate} uSv/h
                  </span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={80}
                  value={selectedMember.thresholds.maxRadiationRate}
                  onChange={(e) =>
                    handleThresholdChange('maxRadiationRate', Number(e.target.value))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="text-xs font-bold text-slate-500">
                  Current: {selectedMember.vitals.radiationRate} uSv/h
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              2. Long-Term Bone & Mood Countermeasure Prescription
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black uppercase text-slate-500 mb-2">
                  Nutritional Meal Ration
                </label>
                <select
                  value={selectedMember.mealPlan}
                  onChange={(e) =>
                    handleSaveProtocol(e.target.value, selectedMember.exerciseProtocol)
                  }
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-300 text-base font-extrabold text-slate-900 bg-white"
                >
                  {MEAL_PRESETS.map((meal) => (
                    <option key={meal} value={meal}>
                      {meal}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-slate-500 mb-2">
                  ARED Resistive Workout Protocol
                </label>
                <select
                  value={selectedMember.exerciseProtocol}
                  onChange={(e) =>
                    handleSaveProtocol(selectedMember.mealPlan, e.target.value)
                  }
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-300 text-base font-extrabold text-slate-900 bg-white"
                >
                  {EXERCISE_PRESETS.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleSaveProtocol(selectedMember.mealPlan, selectedMember.exerciseProtocol)
              }
              className="group inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg cursor-pointer"
            >
              <span>Transmit Countermeasure Plan to {selectedMember.name}</span>
              <RedCircleArrowBadge size={30} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
