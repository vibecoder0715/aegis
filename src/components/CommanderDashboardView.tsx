import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Heart,
  MapPin,
  Mic,
  Moon,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
  Wind,
} from 'lucide-react';
import {
  CrewMember,
  evaluateCrewMemberStatus,
} from '../utils/metricsEngine';
import { AegisWordmarkSvg } from './AegisBrandLogo';
import {
  AstronautCharacterSvg,
  AstronautPoseId,
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

type BoardViewId = 'crew' | 'analytics' | 'ai' | 'emergencies';
type StatusFilter = 'all' | 'nominal' | 'warning' | 'critical';

interface EmergencyEventItem {
  id: string;
  crewId: string;
  crewName: string;
  role: string;
  location: string;
  distanceMeters: number;
  heartRate: number;
  spo2: number;
  bp: string;
  headline: string;
  suggestion: string;
  acknowledged: boolean;
}

export const CommanderDashboardView: React.FC<CommanderDashboardViewProps> = ({
  crew,
}) => {
  const [activeView, setActiveView] = useState<BoardViewId>('crew');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedCrewId, setExpandedCrewId] = useState<string | null>(crew[0]?.id ?? null);
  const [acknowledgedEmergencyIds, setAcknowledgedEmergencyIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [aiFeedback, setAiFeedback] = useState<Record<number, 'up' | 'down' | null>>({});

  const analyzeCrewFactors = (member: CrewMember) => {
    const highWork = member.vitals.steps >= 9000 || member.vitals.calories >= 2800;
    const isolationSignal =
      (member.vitals.moodScore < 78 || member.vitals.sleepScore < 76) && !highWork;
    const stressLabel = highWork
      ? 'Heavy Physical Work'
      : isolationSignal
      ? 'Loneliness / Mental Stress'
      : 'Balanced Workload';

    const first = member.history[0];
    const last = member.history[member.history.length - 1];
    const boneDelta = first && last ? Number((last.boneMass - first.boneMass).toFixed(2)) : 0;
    const sleepDelta = first && last ? Number((last.sleepHours - first.sleepHours).toFixed(1)) : 0;
    const earlyWarning =
      boneDelta <= -0.05 || sleepDelta <= -0.5 || member.vitals.sleepScore < 74;

    return {
      stressLabel,
      highWork,
      isolationSignal,
      boneDelta,
      sleepDelta,
      earlyWarning,
    };
  };

  const getMemberPose = (member: CrewMember): AstronautPoseId => {
    const ev = evaluateCrewMemberStatus(member);
    if (ev.status === 'critical') return 'surprised';
    if (ev.status === 'warning') return 'worried';
    if (member.vitals.sleepScore < 76) return 'sleepy';
    if (member.id === 'astronaut-1' || member.id === 'astronaut-7') return 'wink';
    if (member.id === 'astronaut-5') return 'calm';
    return 'happy';
  };

  const getSimpleSuggestions = (member: CrewMember): string[] => {
    const ev = evaluateCrewMemberStatus(member);
    if (ev.status === 'critical') {
      return [
        `Send nearby crewmates to ${member.moduleLocation} right away.`,
        'Turn on suit oxygen boost and check air seal.',
        'Bring astronaut inside and rest flat.',
      ];
    }
    if (ev.status === 'warning') {
      return [
        `Follow ${member.exerciseProtocol} today.`,
        `Eat ${member.mealPlan} and drink water.`,
        'Move to a shielded room if radiation rises.',
      ];
    }
    return [
      `Keep doing ${member.exerciseProtocol}.`,
      `Continue ${member.mealPlan}.`,
      'All vitals look healthy and steady.',
    ];
  };

  const emergencies = useMemo<EmergencyEventItem[]>(() => {
    return crew
      .filter((m) => evaluateCrewMemberStatus(m).status === 'critical')
      .map((m) => ({
        id: `emg-${m.id}-${m.vitals.systolicBp}-${m.vitals.spo2}`,
        crewId: m.id,
        crewName: m.name,
        role: m.role,
        location: m.moduleLocation,
        distanceMeters: m.distanceMeters,
        heartRate: m.vitals.heartRate,
        spo2: m.vitals.spo2,
        bp: `${m.vitals.systolicBp}/${m.vitals.diastolicBp}`,
        headline: m.conditionSummary,
        suggestion: `Send rescue to ${m.moduleLocation} (${m.distanceMeters}m away) and boost suit O2.`,
        acknowledged: acknowledgedEmergencyIds.includes(
          `emg-${m.id}-${m.vitals.systolicBp}-${m.vitals.spo2}`
        ),
      }));
  }, [crew, acknowledgedEmergencyIds]);

  const unacknowledgedEmergency = emergencies.find((e) => !e.acknowledged) ?? null;

  const handleAcknowledgeEmergency = (emgId: string) => {
    setAcknowledgedEmergencyIds((prev) => (prev.includes(emgId) ? prev : [...prev, emgId]));
    setActiveView('emergencies');
  };

  const askBoardAi = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || aiLoading) return;
    setAiLoading(true);
    setAiQuestion('');

    let reply = '';
    try {
      const res = await fetch('/api/board-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          question: trimmed,
          crew,
          emergencies,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.reply) reply = data.reply;
      }
    } catch {
      // Fallback below
    }

    if (!reply) {
      const qLower = trimmed.toLowerCase();
      const crit = crew.filter((c) => evaluateCrewMemberStatus(c).status === 'critical');
      const warn = crew.filter((c) => evaluateCrewMemberStatus(c).status === 'warning');
      if (qLower.includes('lonel') || qLower.includes('stress') || qLower.includes('mood')) {
        const lonely = crew.filter((c) => analyzeCrewFactors(c).isolationSignal);
        reply =
          lonely.length > 0
            ? `${lonely.map((c) => c.name).join(', ')} show lower mood/sleep without heavy steps — indicating isolation stress rather than physical fatigue. Recommend peer check-in and light therapy.`
            : 'Crew mood and sleep scores align well with daily workloads; no hidden loneliness stress flags today.';
      } else if (qLower.includes('radiation') || qLower.includes('co2') || qLower.includes('air') || qLower.includes('danger')) {
        const maxCo2 = Math.max(...crew.map((c) => c.vitals.cabinCo2));
        const maxRad = Math.max(...crew.map((c) => c.vitals.radiationRate));
        reply = `Peak cabin CO2 is ${maxCo2.toFixed(2)}% and max radiation is ${maxRad} uSv/h. ${crit.length > 0 ? `${crit[0].name} needs immediate oxygen & airlock support.` : 'Spaceship sensors are within safe operating bounds.'}`;
      } else {
        reply =
          crit.length > 0
            ? `${crit.map((c) => c.name).join(', ')} needs immediate rescue in ${crit[0].moduleLocation}. ${warn.length} crewmate(s) have early sleep/bone warnings, and the rest are safe.`
            : `All ${crew.length} crewmates are stable. ${warn.length} crewmate(s) have early sleep, bone, or air reminders.`;
      }
    }

    setAiHistory((prev) => [...prev, { q: trimmed, a: reply }]);
    setAiLoading(false);
  };

  const filteredCrew = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return crew.filter((m) => {
      const ev = evaluateCrewMemberStatus(m);
      if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.moduleLocation.toLowerCase().includes(q)
      );
    });
  }, [crew, searchQuery, statusFilter]);

  const safeCount = crew.filter((m) => evaluateCrewMemberStatus(m).status === 'nominal').length;
  const warnCount = crew.filter((m) => evaluateCrewMemberStatus(m).status === 'warning').length;
  const critCount = crew.filter((m) => evaluateCrewMemberStatus(m).status === 'critical').length;
  const avgHeart = Math.round(crew.reduce((s, m) => s + m.vitals.heartRate, 0) / crew.length);
  const avgSpo2 = Number(
    (crew.reduce((s, m) => s + m.vitals.spo2, 0) / crew.length).toFixed(1)
  );
  const avgSleep = Math.round(crew.reduce((s, m) => s + m.vitals.sleepScore, 0) / crew.length);
  const avgBone = Number(
    (crew.reduce((s, m) => s + m.vitals.boneMass, 0) / crew.length).toFixed(2)
  );
  const avgRad = Number(
    (crew.reduce((s, m) => s + m.vitals.radiationRate, 0) / crew.length).toFixed(1)
  );
  const maxCo2 = Number(Math.max(...crew.map((m) => m.vitals.cabinCo2)).toFixed(2));
  const heavyWorkCount = crew.filter((m) => analyzeCrewFactors(m).highWork).length;
  const isolationCount = crew.filter((m) => analyzeCrewFactors(m).isolationSignal).length;

  // 180-day fleet trend averages across Day 1..180 for health changes over time
  const fleetHistory = useMemo(() => {
    const baseDays = crew[0]?.history?.map((h) => h.day) ?? [1, 30, 60, 90, 120, 150, 180];
    return baseDays.map((day, idx) => {
      let boneSum = 0;
      let moodSum = 0;
      let sleepSum = 0;
      crew.forEach((m) => {
        const pt = m.history[idx];
        if (pt) {
          boneSum += pt.boneMass;
          moodSum += pt.moodScore;
          sleepSum += pt.sleepHours;
        }
      });
      const n = Math.max(1, crew.length);
      return {
        day,
        avgBone: Number((boneSum / n).toFixed(2)),
        avgMood: Math.round(moodSum / n),
        avgSleepHours: Number((sleepSum / n).toFixed(1)),
      };
    });
  }, [crew]);

  // Donut chart segments (circumference = 2 * PI * 42 ≈ 263.89)
  const totalCrew = Math.max(1, crew.length);
  const circ = 263.89;
  const safeArc = (safeCount / totalCrew) * circ;
  const warnArc = (warnCount / totalCrew) * circ;
  const critArc = (critCount / totalCrew) * circ;

  const DASHBOARD_TABS: Array<{
    id: BoardViewId;
    label: string;
    subtitle: string;
    icon: typeof Users;
    badge?: number;
  }> = [
    {
      id: 'crew',
      label: 'Crew Overview',
      subtitle: 'Live health cards and simple action tips for every astronaut.',
      icon: Users,
      badge: crew.length,
    },
    {
      id: 'analytics',
      label: 'Fleet Analytics',
      subtitle: 'Team health charts, heart rates, bone strength, and air safety.',
      icon: BarChart3,
    },
    {
      id: 'ai',
      label: 'AI Commander',
      subtitle: 'Ask simple questions about crew health or rescue steps.',
      icon: Sparkles,
    },
    {
      id: 'emergencies',
      label: 'Emergency Alerts',
      subtitle: 'First-hand emergency alerts and active rescue actions.',
      icon: ShieldAlert,
      badge: emergencies.length,
    },
  ];

  const AI_SUGGESTIONS = [
    { icon: Users, label: 'Who needs help right now?' },
    { icon: Heart, label: 'Summarize crew heart and oxygen' },
    { icon: BookOpen, label: 'Give simple meal and workout tips' },
  ];

  const activeMeta = DASHBOARD_TABS.find((t) => t.id === activeView) ?? DASHBOARD_TABS[0];

  return (
    <div className="space-y-6 pb-28">
      {/* FIRST-TIME EMERGENCY POPUP MODAL (Static warning icon, no bounce!) */}
      {unacknowledgedEmergency && (
        <div
          role="alertdialog"
          aria-label="Crew Emergency Alert"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border-4 border-red-600 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 text-slate-900">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                FIRST-HAND EMERGENCY ALERT
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">
                {unacknowledgedEmergency.location}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <AstronautCharacterSvg emotion="surprised" size={90} />
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-red-700">
                  {unacknowledgedEmergency.crewName}
                </h3>
                <p className="text-base font-extrabold text-slate-900">
                  {unacknowledgedEmergency.headline}
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {unacknowledgedEmergency.suggestion}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAcknowledgeEmergency(unacknowledgedEmergency.id)}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-base shadow-lg cursor-pointer transition"
            >
              Acknowledge &amp; Open Emergency Alerts
            </button>
          </div>
        </div>
      )}

      {/* 1. MODERN MISSION TELEMETRY HERO HEADER */}
      <section
        aria-label="Aegis Board Header"
        className="relative rounded-[28px] sm:rounded-[34px] bg-gradient-to-br from-[#07152E] via-[#0D2147] to-[#112A58] text-white shadow-lg overflow-hidden p-6 sm:p-9"
      >
        <img
          src="/images/peer_mesh.jpg"
          alt="Aegis Crew Telemetry Mesh"
          className="absolute right-0 top-0 h-full w-full sm:w-[48%] object-cover opacity-20 mix-blend-screen pointer-events-none select-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#07152E] via-[#07152E]/90 to-transparent pointer-events-none"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-200 text-xs font-extrabold">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mission Command Telemetry Dashboard</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-200 text-xs font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>20m+ Signal Delay Resilient · Watch Autonomous</span>
              </div>
            </div>

            <h1
              aria-label="Aegis Board"
              className="flex flex-wrap items-center gap-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white"
            >
              <span className="inline-flex items-center bg-white rounded-2xl px-3 py-1.5 shadow-sm">
                <AegisWordmarkSvg height={40} className="h-8 sm:h-10 w-auto" />
              </span>
              <span>Board</span>
            </h1>

            <p className="text-sm sm:text-base font-medium text-slate-200 leading-relaxed">
              Monitor all 10 crewmates live, review fleet health charts, and act on first-hand emergency alerts right away.
            </p>
          </div>

          {/* Live Telemetry Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Safe Crew
              </div>
              <div className="text-2xl font-black text-white mt-0.5">
                {safeCount}/{crew.length}
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Check Soon
              </div>
              <div className="text-2xl font-black text-white mt-0.5">{warnCount}</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Emergencies
              </div>
              <div className="text-2xl font-black text-white mt-0.5">{critCount}</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-300" />
                Avg Heart
              </div>
              <div className="text-2xl font-black text-white mt-0.5">{avgHeart} bpm</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CLEAN DASHBOARD SHELL (No Slack Channels, No # Prefixes) */}
      <div className="rounded-[28px] sm:rounded-[32px] bg-white border border-slate-200 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        {/* LEFT COMMAND SIDEBAR */}
        <aside
          aria-label="Dashboard Navigation"
          className="lg:col-span-3 bg-slate-900 text-slate-200 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800"
        >
          <div className="p-4 sm:p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div>
                <div className="text-sm font-extrabold text-white tracking-tight">
                  Command Views
                </div>
                <div className="text-[11px] font-semibold text-slate-400">
                  Station Orbit Sync Active
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-[11px] font-extrabold text-cyan-300">
                {crew.length} Crew
              </span>
            </div>

            {/* Navigation Cards */}
            <div className="space-y-1.5">
              {DASHBOARD_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeView === tab.id;
                const isEmergency = tab.id === 'emergencies';
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveView(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-bold transition cursor-pointer ${
                      active
                        ? isEmergency
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-cyan-400 text-slate-950 font-extrabold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </span>
                    {typeof tab.badge === 'number' && (
                      <span
                        className={`text-xs font-mono font-black px-2 py-0.5 rounded-full ${
                          active
                            ? isEmergency
                              ? 'bg-white text-red-700'
                              : 'bg-slate-950/20 text-slate-950'
                            : isEmergency && tab.badge > 0
                            ? 'bg-red-500 text-white'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Crew Quick Search & Roster */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search astronaut or room..."
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-700/80 pl-8 pr-3 py-2 text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                Quick Jump Roster
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {crew
                  .filter((m) => {
                    const q = searchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      m.name.toLowerCase().includes(q) ||
                      m.role.toLowerCase().includes(q) ||
                      m.moduleLocation.toLowerCase().includes(q)
                    );
                  })
                  .map((member) => {
                    const ev = evaluateCrewMemberStatus(member);
                    const dotColor =
                      ev.status === 'critical'
                        ? 'bg-red-500'
                        : ev.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400';
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setActiveView('crew');
                          setStatusFilter('all');
                          setExpandedCrewId(member.id);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          expandedCrewId === member.id && activeView === 'crew'
                            ? 'bg-white/15 text-white'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                          <span className="truncate">{member.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {member.vitals.heartRate} bpm
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{safeCount} Safe</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{warnCount} Warn</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{critCount} Alert</span>
            </span>
          </div>
        </aside>

        {/* RIGHT MAIN DASHBOARD WORKSPACE */}
        <div className="lg:col-span-9 flex flex-col bg-[#F8FAFC]">
          {/* Clean Dashboard Header Bar */}
          <div className="bg-white border-b border-slate-200 px-5 sm:px-7 py-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#07152E] flex items-center gap-2">
                  <activeMeta.icon className="w-5 h-5 text-cyan-600" />
                  <span>{activeMeta.label}</span>
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                  {activeMeta.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Avg SpO2 {avgSpo2}%</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-700">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Sleep {avgSleep}/100</span>
                </span>
              </div>
            </div>

            {/* Clean Pill Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-extrabold pt-0.5">
              {DASHBOARD_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeView === tab.id;
                const isEmg = tab.id === 'emergencies';
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveView(tab.id)}
                    className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap ${
                      active
                        ? isEmg
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-[#07152E] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>
                      {tab.label}
                      {isEmg ? ` (${emergencies.length})` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dashboard Body */}
          <div className="flex-1 p-5 sm:p-7 flex flex-col">
            {/* VIEW 1: CREW OVERVIEW */}
            {activeView === 'crew' && (
              <div className="space-y-4">
                {/* Status Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        { id: 'all', label: `All (${crew.length})` },
                        { id: 'nominal', label: `Safe (${safeCount})` },
                        { id: 'warning', label: `Check Soon (${warnCount})` },
                        { id: 'critical', label: `Emergencies (${critCount})` },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setStatusFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition border ${
                          statusFilter === f.id
                            ? 'bg-[#07152E] text-white border-[#07152E]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crew Cards */}
                <div className="space-y-3">
                  {filteredCrew.map((member) => {
                    const ev = evaluateCrewMemberStatus(member);
                    const isExpanded = expandedCrewId === member.id;
                    const pose = getMemberPose(member);
                    const suggestions = getSimpleSuggestions(member);

                    const accentBar =
                      ev.status === 'critical'
                        ? 'bg-red-600'
                        : ev.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-emerald-500';

                    const badgeCls =
                      ev.status === 'critical'
                        ? 'bg-red-600 text-white'
                        : ev.status === 'warning'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-emerald-500 text-slate-950';

                    const statusWord =
                      ev.status === 'critical'
                        ? 'Emergency'
                        : ev.status === 'warning'
                        ? 'Check Soon'
                        : 'Safe';

                    return (
                      <div
                        key={member.id}
                        className={`relative rounded-2xl bg-white border transition overflow-hidden shadow-xs ${
                          ev.status === 'critical'
                            ? 'border-red-400'
                            : isExpanded
                            ? 'border-[#07152E]'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentBar}`} />
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCrewId((prev) => (prev === member.id ? null : member.id))
                          }
                          className="w-full p-4 pl-5 flex flex-wrap items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/80 transition"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                              <AstronautCharacterSvg emotion={pose} size={46} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base sm:text-lg font-extrabold text-[#07152E]">
                                  {member.name}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${badgeCls}`}
                                >
                                  {statusWord}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                                  <MapPin className="w-3 h-3" />
                                  {member.moduleLocation}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm font-semibold text-slate-600 truncate mt-0.5">
                                {member.role} · {member.conditionSummary}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                                HR {member.vitals.heartRate}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800">
                                SpO2 {member.vitals.spo2}%
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                                BP {member.vitals.systolicBp}/{member.vitals.diastolicBp}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-500" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (() => {
                          const factors = analyzeCrewFactors(member);
                          const pts = member.history;
                          const moodPolyline = pts
                            .map((p, i) => {
                              const x = pts.length > 1 ? (i / (pts.length - 1)) * 220 + 10 : 120;
                              const y = 52 - ((Math.max(40, Math.min(100, p.moodScore)) - 40) / 60) * 40;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(' ');
                          const sleepPolyline = pts
                            .map((p, i) => {
                              const x = pts.length > 1 ? (i / (pts.length - 1)) * 220 + 10 : 120;
                              const y = 52 - ((Math.max(4, Math.min(9, p.sleepHours)) - 4) / 5) * 40;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(' ');
                          return (
                          <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 pl-6 space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                              <div className="lg:col-span-7 space-y-3">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                  Live Watch Telemetry &amp; Spaceship Environment
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                                    <div className="text-xs font-semibold text-slate-500">Heart Rate</div>
                                    <div className="text-lg font-extrabold text-[#07152E]">
                                      {member.vitals.heartRate} bpm
                                    </div>
                                  </div>
                                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                                    <div className="text-xs font-semibold text-slate-500">Blood Pressure</div>
                                    <div className="text-lg font-extrabold text-[#07152E]">
                                      {member.vitals.systolicBp}/{member.vitals.diastolicBp}
                                    </div>
                                  </div>
                                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                                    <div className="text-xs font-semibold text-slate-500">Blood Oxygen</div>
                                    <div className="text-lg font-extrabold text-[#07152E]">
                                      {member.vitals.spo2}%
                                    </div>
                                  </div>
                                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                                    <div className="text-xs font-semibold text-slate-500">Bone Score</div>
                                    <div className="text-lg font-extrabold text-[#07152E]">
                                      {member.vitals.boneMass} g/cm²
                                    </div>
                                  </div>
                                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                                    <div className="text-xs font-semibold text-slate-500">Radiation / CO2</div>
                                    <div className="text-sm sm:text-base font-extrabold text-[#07152E]">
                                      {member.vitals.radiationRate} uSv · {member.vitals.cabinCo2}%
                                    </div>
                                  </div>
                                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                                    <div className="text-xs font-semibold text-slate-500">Sleep / Mood</div>
                                    <div className="text-base font-extrabold text-[#07152E]">
                                      {member.vitals.sleepScore} · {member.vitals.moodScore}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-4 space-y-2.5">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                                  <Sparkles className="w-4 h-4" />
                                  <span>Actions to Take</span>
                                </div>
                                <ul className="space-y-2 text-sm font-semibold text-slate-700">
                                  {suggestions.map((sug, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                      <span>{sug}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* 180-Day Trend + Workload vs Loneliness & Zero-G Adaptation Strip */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              <div className="md:col-span-6 rounded-2xl bg-white border border-slate-200 p-3.5 space-y-2">
                                <div className="flex items-center justify-between text-xs font-extrabold">
                                  <span className="text-[#07152E]">180-Day Sleep &amp; Mood Trend</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                                      factors.earlyWarning
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {factors.earlyWarning
                                      ? 'Early Drop Spotted'
                                      : 'Steady 180d Curve'}
                                  </span>
                                </div>
                                <svg viewBox="0 0 240 60" className="w-full h-14 overflow-visible">
                                  <polyline
                                    fill="none"
                                    stroke="#38BDF8"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={moodPolyline}
                                  />
                                  <polyline
                                    fill="none"
                                    stroke="#8B5CF6"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={sleepPolyline}
                                  />
                                </svg>
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                                    Mood (d1–d180)
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                                    Sleep Δ {factors.sleepDelta >= 0 ? `+${factors.sleepDelta}` : factors.sleepDelta}h · Bone {factors.boneDelta >= 0 ? `+${factors.boneDelta}` : factors.boneDelta}
                                  </span>
                                </div>
                              </div>

                              <div className="md:col-span-6 rounded-2xl bg-white border border-slate-200 p-3.5 grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <div className="text-[10px] font-extrabold uppercase text-slate-400">
                                    Work vs. Loneliness
                                  </div>
                                  <div className="font-extrabold text-[#07152E] mt-1">
                                    {factors.stressLabel}
                                  </div>
                                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                    {member.vitals.steps.toLocaleString()} steps · {member.vitals.calories} kcal
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-extrabold uppercase text-slate-400">
                                    Zero-G &amp; Water Plan
                                  </div>
                                  <div className="font-extrabold text-sky-700 mt-1">
                                    Fluid Shift Adjusted
                                  </div>
                                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                    {member.exerciseProtocol} · 2,400 mL goal
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 2: FLEET ANALYTICS */}
            {activeView === 'analytics' && (
              <div className="space-y-5">
                {/* Visual Donut Summary + KPI Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-5 flex items-center gap-5 shadow-xs">
                    <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0">
                      <circle
                        cx="56"
                        cy="56"
                        r="42"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="14"
                      />
                      {/* Safe Arc */}
                      <circle
                        cx="56"
                        cy="56"
                        r="42"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="14"
                        strokeDasharray={`${safeArc} ${circ}`}
                        transform="rotate(-90 56 56)"
                      />
                      {/* Warning Arc */}
                      <circle
                        cx="56"
                        cy="56"
                        r="42"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="14"
                        strokeDasharray={`${warnArc} ${circ}`}
                        strokeDashoffset={-safeArc}
                        transform="rotate(-90 56 56)"
                      />
                      {/* Critical Arc */}
                      <circle
                        cx="56"
                        cy="56"
                        r="42"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="14"
                        strokeDasharray={`${critArc} ${circ}`}
                        strokeDashoffset={-(safeArc + warnArc)}
                        transform="rotate(-90 56 56)"
                      />
                      <text
                        x="56"
                        y="53"
                        textAnchor="middle"
                        className="fill-[#07152E] text-xl font-black"
                      >
                        {crew.length}
                      </text>
                      <text
                        x="56"
                        y="69"
                        textAnchor="middle"
                        className="fill-slate-500 text-[10px] font-bold"
                      >
                        CREW
                      </text>
                    </svg>

                    <div className="space-y-2 flex-1">
                      <div className="text-sm font-extrabold text-[#07152E]">
                        Crew Health Split
                      </div>
                      <div className="space-y-1.5 text-xs font-bold">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            Safe
                          </span>
                          <span className="font-mono text-emerald-700">{safeCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            Check Soon
                          </span>
                          <span className="font-mono text-amber-700">{warnCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            Emergency
                          </span>
                          <span className="font-mono text-red-600">{critCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-3xl bg-white border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
                      <Heart className="w-5 h-5 text-rose-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-500">Avg Heart</div>
                        <div className="text-2xl font-black text-[#07152E]">{avgHeart}</div>
                        <div className="text-[11px] font-semibold text-slate-400">bpm</div>
                      </div>
                    </div>
                    <div className="rounded-3xl bg-white border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
                      <Wind className="w-5 h-5 text-sky-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-500">Avg Oxygen</div>
                        <div className="text-2xl font-black text-[#07152E]">{avgSpo2}%</div>
                        <div className="text-[11px] font-semibold text-emerald-600">Safe &ge; 94%</div>
                      </div>
                    </div>
                    <div className="rounded-3xl bg-white border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-500">Avg Bone</div>
                        <div className="text-2xl font-black text-[#07152E]">{avgBone}</div>
                        <div className="text-[11px] font-semibold text-slate-400">g/cm²</div>
                      </div>
                    </div>
                    <div className="rounded-3xl bg-white border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
                      <Moon className="w-5 h-5 text-indigo-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-500">Avg Sleep</div>
                        <div className="text-2xl font-black text-[#07152E]">{avgSleep}</div>
                        <div className="text-[11px] font-semibold text-slate-400">out of 100</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Bar Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-[#07152E] flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Blood Pressure &amp; Heart Rate</span>
                      </h3>
                      <span className="text-xs font-bold text-slate-500">Normal &lt; 140</span>
                    </div>
                    <div className="space-y-2.5">
                      {crew.map((m) => {
                        const pct = Math.min(100, Math.round((m.vitals.systolicBp / 170) * 100));
                        const barColor =
                          m.vitals.systolicBp >= 145
                            ? 'bg-gradient-to-r from-red-500 to-rose-600'
                            : m.vitals.systolicBp >= 132
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-sky-400 to-blue-600';
                        return (
                          <div key={m.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>{m.name}</span>
                              <span className="font-mono">
                                {m.vitals.systolicBp}/{m.vitals.diastolicBp} · {m.vitals.heartRate} bpm
                              </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full ${barColor}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-[#07152E]">
                        Bone Strength &amp; Sleep Score
                      </h3>
                      <span className="text-xs font-bold text-slate-500">Safe &ge; 1.02</span>
                    </div>
                    <div className="space-y-2.5">
                      {crew.map((m) => {
                        const pct = Math.min(100, Math.round((m.vitals.boneMass / 1.35) * 100));
                        const barColor =
                          m.vitals.boneMass < 1.02
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-400 to-teal-600';
                        return (
                          <div key={m.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>{m.name}</span>
                              <span className="font-mono">
                                Bone {m.vitals.boneMass} · Sleep {m.vitals.sleepScore}
                              </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full ${barColor}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 180-Day Health Trends & Deep-Space Factors Considered */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold text-[#07152E]">
                        180-Day Health Changes Over Time
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        Early Risk Detection
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      Tracks crew bone strength, mood, and sleep across 6 months in space to spot small drops before emergencies happen.
                    </p>
                    <svg viewBox="0 0 360 110" className="w-full h-28">
                      {[25, 55, 85].map((yLine) => (
                        <line
                          key={yLine}
                          x1="20"
                          y1={yLine}
                          x2="345"
                          y2={yLine}
                          stroke="#E2E8F0"
                          strokeDasharray="4 4"
                        />
                      ))}
                      <polyline
                        fill="none"
                        stroke="#0EA5E9"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={fleetHistory
                          .map((pt, i) => {
                            const x = 25 + (i / Math.max(1, fleetHistory.length - 1)) * 315;
                            const y = 95 - ((Math.max(50, Math.min(100, pt.avgMood)) - 50) / 50) * 75;
                            return `${x.toFixed(1)},${y.toFixed(1)}`;
                          })
                          .join(' ')}
                      />
                      <polyline
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={fleetHistory
                          .map((pt, i) => {
                            const x = 25 + (i / Math.max(1, fleetHistory.length - 1)) * 315;
                            const y = 95 - ((Math.max(0.85, Math.min(1.25, pt.avgBone)) - 0.85) / 0.4) * 75;
                            return `${x.toFixed(1)},${y.toFixed(1)}`;
                          })
                          .join(' ')}
                      />
                      {fleetHistory.map((pt, i) => {
                        const x = 25 + (i / Math.max(1, fleetHistory.length - 1)) * 315;
                        return (
                          <text
                            key={pt.day}
                            x={x}
                            y="108"
                            textAnchor="middle"
                            className="fill-slate-400 text-[9px] font-bold"
                          >
                            D{pt.day}
                          </text>
                        );
                      })}
                    </svg>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        Avg Mood Trend
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Avg Bone Strength (g/cm²)
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
                    <h3 className="text-base font-extrabold text-[#07152E]">
                      Space Factors Considered by Aegis
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                        <div className="font-extrabold text-[#07152E]">Heavy Work vs. Loneliness</div>
                        <p className="text-slate-600 font-semibold leading-snug">
                          {heavyWorkCount} heavy physical load · {isolationCount} isolation stress signal(s). Separates body fatigue from mental stress.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                        <div className="font-extrabold text-[#07152E]">Zero-G &amp; Sleep Cycles</div>
                        <p className="text-slate-600 font-semibold leading-snug">
                          No day/night cycle and zero-G fluid shift tracked. Auto-adjusts sleep, water (2,400 mL), and ARED workouts.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                        <div className="font-extrabold text-[#07152E]">Live Spaceship Dangers</div>
                        <p className="text-slate-600 font-semibold leading-snug">
                          Avg Radiation {avgRad} uSv/h · Max CO2 {maxCo2}% · Avg O2 {avgSpo2}%. Warns crew the second air turns unsafe.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                        <div className="font-extrabold text-[#07152E]">20m+ Signal Delay Offline AI</div>
                        <p className="text-slate-600 font-semibold leading-snug">
                          Runs 100% on-watch medical logic and direct Peer SOS with zero Earth internet needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: AI COMMANDER */}
            {activeView === 'ai' && (
              <div className="flex-1 flex flex-col rounded-3xl bg-[#0B0F1A] text-white p-6 sm:p-10 shadow-inner min-h-[480px] justify-between">
                {aiHistory.length === 0 ? (
                  <div className="my-auto max-w-xl w-full mx-auto space-y-6">
                    <h3 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
                      Where should we start?
                    </h3>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        askBoardAi(aiQuestion);
                      }}
                      className="flex items-center gap-3 rounded-full bg-[#1E1F23] border border-white/10 px-5 py-3.5 shadow-lg"
                    >
                      <Plus className="w-5 h-5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        placeholder="Ask Aegis Commander AI"
                        className="flex-1 min-w-0 bg-transparent text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={aiLoading}
                        aria-label="Send question"
                        className="text-slate-300 hover:text-white cursor-pointer"
                      >
                        {aiQuestion.trim() ? (
                          <Send className="w-5 h-5" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </button>
                    </form>

                    <div className="space-y-2 pt-2 pl-2">
                      {AI_SUGGESTIONS.map((s) => {
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => askBoardAi(s.label)}
                            className="w-full text-left flex items-center gap-3.5 py-2.5 px-4 rounded-2xl hover:bg-white/5 text-sm sm:text-base font-medium text-slate-200 transition cursor-pointer"
                          >
                            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between max-w-2xl w-full mx-auto space-y-6">
                    <div className="space-y-6 overflow-y-auto pr-1 max-h-[380px]">
                      {aiHistory.map((item, idx) => (
                        <div key={idx} className="space-y-4">
                          <div className="flex justify-end">
                            <div className="max-w-[80%] rounded-3xl bg-[#1E1F23] border border-white/10 px-5 py-3.5 text-sm sm:text-base text-slate-100 leading-relaxed">
                              {item.q}
                            </div>
                          </div>

                          <div className="space-y-3 text-slate-100">
                            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line">
                              {item.a}
                            </p>

                            <div className="flex items-center gap-4 text-slate-400 pt-1">
                              <button
                                type="button"
                                aria-label="Helpful response"
                                onClick={() =>
                                  setAiFeedback((prev) => ({
                                    ...prev,
                                    [idx]: prev[idx] === 'up' ? null : 'up',
                                  }))
                                }
                                className={`cursor-pointer ${
                                  aiFeedback[idx] === 'up' ? 'text-emerald-400' : 'hover:text-white'
                                }`}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Needs improvement"
                                onClick={() =>
                                  setAiFeedback((prev) => ({
                                    ...prev,
                                    [idx]: prev[idx] === 'down' ? null : 'down',
                                  }))
                                }
                                className={`cursor-pointer ${
                                  aiFeedback[idx] === 'down' ? 'text-rose-400' : 'hover:text-white'
                                }`}
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => askBoardAi(item.q)}
                                aria-label="Retry response"
                                className="hover:text-white cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(item.a);
                                  setCopiedIdx(idx);
                                  setTimeout(() => setCopiedIdx(null), 1500);
                                }}
                                aria-label="Copy response"
                                className="hover:text-white cursor-pointer flex items-center gap-1 text-xs"
                              >
                                <Copy className="w-4 h-4" />
                                {copiedIdx === idx && <span>Copied</span>}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {aiLoading && (
                        <div className="text-sm font-medium text-slate-400">
                          Thinking...
                        </div>
                      )}
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        askBoardAi(aiQuestion);
                      }}
                      className="flex items-center gap-3 rounded-full bg-[#1E1F23] border border-white/10 px-5 py-3.5 shadow-lg"
                    >
                      <Plus className="w-5 h-5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        placeholder="Ask Aegis Commander AI"
                        className="flex-1 min-w-0 bg-transparent text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={aiLoading}
                        aria-label="Send question"
                        className="text-slate-300 hover:text-white cursor-pointer"
                      >
                        {aiQuestion.trim() ? (
                          <Send className="w-5 h-5" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 4: EMERGENCY ALERTS */}
            {activeView === 'emergencies' && (
              <div className="space-y-4">
                {emergencies.length === 0 ? (
                  <div className="rounded-3xl bg-white border border-slate-200 p-10 text-center space-y-2.5">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <div className="text-lg font-extrabold text-[#07152E]">
                      No Active Emergencies
                    </div>
                    <p className="text-sm font-semibold text-slate-500">
                      All 10 crewmates are safe right now.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emergencies.map((emg) => (
                      <div
                        key={emg.id}
                        className="rounded-3xl bg-red-50/80 border-2 border-red-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="flex items-center gap-4">
                          <AstronautCharacterSvg emotion="surprised" size={76} />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg font-black text-red-700">
                                {emg.crewName}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-black">
                                {emg.acknowledged ? 'Acknowledged' : 'New Emergency'}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-600">
                                {emg.location} · {emg.distanceMeters}m away
                              </span>
                            </div>
                            <div className="text-sm sm:text-base font-extrabold text-slate-900">
                              {emg.headline}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs font-mono font-bold text-red-800">
                              <span className="px-2 py-0.5 rounded-lg bg-white border border-red-200">
                                BP {emg.bp}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-white border border-red-200">
                                HR {emg.heartRate} bpm
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-white border border-red-200">
                                SpO2 {emg.spo2}%
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-700">
                              Action: {emg.suggestion}
                            </div>
                          </div>
                        </div>

                        {!emg.acknowledged && (
                          <button
                            type="button"
                            onClick={() => handleAcknowledgeEmergency(emg.id)}
                            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-extrabold cursor-pointer shrink-0 shadow-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
