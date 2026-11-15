import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Hash,
  Heart,
  Mic,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
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

type BoardPageId = 'crewmates' | 'overall' | 'ai' | 'emergencies';

interface EmergencyEventItem {
  id: string;
  crewId: string;
  crewName: string;
  role: string;
  location: string;
  headline: string;
  suggestion: string;
  acknowledged: boolean;
}

export const CommanderDashboardView: React.FC<CommanderDashboardViewProps> = ({
  crew,
}) => {
  const [activeSubpage, setActiveSubpage] = useState<BoardPageId>('crewmates');
  const [expandedCrewId, setExpandedCrewId] = useState<string | null>(crew[0]?.id ?? null);
  const [acknowledgedEmergencyIds, setAcknowledgedEmergencyIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Clean AI Assistance state (empty initially so it shows "Where should we start?" + bottom suggestions, then expands when there is chat history)
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<Array<{ q: string; a: string }>>([]);

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
        'Turn on suit oxygen boost and check air filter.',
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
      'Everything looks healthy and normal!',
    ];
  };

  // Build emergency list from crewmates in critical state
  const emergencies = useMemo<EmergencyEventItem[]>(() => {
    return crew
      .filter((m) => evaluateCrewMemberStatus(m).status === 'critical')
      .map((m) => ({
        id: `emg-${m.id}-${m.vitals.systolicBp}-${m.vitals.spo2}`,
        crewId: m.id,
        crewName: m.name,
        role: m.role,
        location: m.moduleLocation,
        headline: m.conditionSummary,
        suggestion: `Send rescue to ${m.moduleLocation} (${m.distanceMeters}m away) and boost suit O2.`,
        acknowledged: acknowledgedEmergencyIds.includes(
          `emg-${m.id}-${m.vitals.systolicBp}-${m.vitals.spo2}`
        ),
      }));
  }, [crew, acknowledgedEmergencyIds]);

  // First-time popup when an unacknowledged emergency exists
  const unacknowledgedEmergency = emergencies.find((e) => !e.acknowledged) ?? null;

  const handleAcknowledgeEmergency = (emgId: string) => {
    setAcknowledgedEmergencyIds((prev) => (prev.includes(emgId) ? prev : [...prev, emgId]));
    setActiveSubpage('emergencies');
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
          question: trimmed,
          crewSnapshot: crew.map((c) => ({
            name: c.name,
            role: c.role,
            location: c.moduleLocation,
            status: evaluateCrewMemberStatus(c).status,
            summary: c.conditionSummary,
            action: c.actionRequired,
            vitals: c.vitals,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.reply) reply = data.reply;
      }
    } catch {
      // Fallback
    }

    if (!reply) {
      const crit = crew.filter((c) => evaluateCrewMemberStatus(c).status === 'critical');
      const warn = crew.filter((c) => evaluateCrewMemberStatus(c).status === 'warning');
      reply =
        crit.length > 0
          ? `${crit.map((c) => c.name).join(', ')} needs immediate rescue in ${crit[0].moduleLocation}. ${warn.length} crewmate(s) have mild warnings, and the rest are safe.`
          : `All ${crew.length} crewmates are stable. ${warn.length} crewmate(s) have mild reminders for calcium or air fan speed.`;
    }

    setAiHistory((prev) => [...prev, { q: trimmed, a: reply }]);
    setAiLoading(false);
  };

  // Filtered crewmates by sidebar search
  const filteredCrew = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return crew;
    return crew.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.moduleLocation.toLowerCase().includes(q)
    );
  }, [crew, searchQuery]);

  // Overall stats
  const safeCount = crew.filter((m) => evaluateCrewMemberStatus(m).status === 'nominal').length;
  const warnCount = crew.filter((m) => evaluateCrewMemberStatus(m).status === 'warning').length;
  const critCount = crew.filter((m) => evaluateCrewMemberStatus(m).status === 'critical').length;
  const avgHeart = Math.round(crew.reduce((s, m) => s + m.vitals.heartRate, 0) / crew.length);
  const avgSpo2 = Number(
    (crew.reduce((s, m) => s + m.vitals.spo2, 0) / crew.length).toFixed(1)
  );
  const avgSleep = Math.round(crew.reduce((s, m) => s + m.vitals.sleepScore, 0) / crew.length);

  const CHANNEL_META: Record<
    BoardPageId,
    { name: string; topic: string }
  > = {
    crewmates: {
      name: 'crewmates',
      topic: 'Click any crewmate bar to view their health details and action suggestions.',
    },
    overall: {
      name: 'overall',
      topic: 'Whole-crew health charts, status indicators, and summary metrics.',
    },
    ai: {
      name: 'ai_assistance',
      topic: 'Ask simple questions about crew health, tasks, or safety steps.',
    },
    emergencies: {
      name: 'emergencies',
      topic: 'First-hand crew emergency alerts and rescue actions.',
    },
  };

  const AI_SUGGESTIONS = [
    { icon: Users, label: 'Who needs help right now?' },
    { icon: Heart, label: 'Summarize crew heart and oxygen' },
    { icon: BookOpen, label: 'Reset crew focus and rest plan' },
  ];

  return (
    <div className="space-y-6 pb-28">
      {/* FIRST-TIME EMERGENCY POPUP MODAL */}
      {unacknowledgedEmergency && (
        <div
          role="alertdialog"
          aria-label="Crew Emergency Alert"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border-4 border-red-600 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 text-slate-900">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
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
              Acknowledge &amp; Move to Emergencies
            </button>
          </div>
        </div>
      )}

      {/* 1. CLEAN HEADER SECTION: [AEGIS LOGO] BOARD (Removed Active Connection ON widget) */}
      <section
        aria-label="Aegis Board Header"
        className="relative rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm overflow-hidden min-h-[200px] flex items-center"
      >
        <img
          src="/images/peer_mesh.jpg"
          alt="Clean Commander Dashboard Background"
          className="absolute right-0 top-0 h-full w-full sm:w-[50%] object-cover opacity-20 sm:opacity-35 pointer-events-none select-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 pointer-events-none"
        />

        <div className="relative z-10 w-full p-6 sm:p-10">
          <div className="max-w-2xl space-y-3.5">
            <h1
              aria-label="Aegis Board"
              className="flex flex-wrap items-center gap-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#07152E]"
            >
              <AegisWordmarkSvg height={50} className="h-10 sm:h-12 w-auto" />
              <span>Board</span>
            </h1>

            <div className="space-y-2 text-sm sm:text-base font-semibold text-slate-700 leading-relaxed">
              <p>
                A global dashboard for commanders to{' '}
                <strong className="font-extrabold text-slate-950">
                  monitor overall statuses of crewmates
                </strong>
                , data is collected when there is an{' '}
                <strong className="font-extrabold text-slate-950">active connection.</strong>
              </p>
              <p>
                Connection is recommended when astronauts are in dangerous tasks, so the headquarters can get the first hand emergency alert.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SLACK-STYLE WORKSPACE LAYOUT (Matches Screenshot 3 with Google Font & App Style) */}
      <div className="rounded-[28px] sm:rounded-[32px] bg-white border border-slate-200 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        {/* LEFT SLACK-STYLE SIDEBAR */}
        <aside
          aria-label="Board Sidebar"
          className="lg:col-span-3 bg-[#07152E] text-slate-200 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800"
        >
          <div className="p-4 sm:p-5 space-y-5">
            {/* Workspace Title Row */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white tracking-tight">
                  Aegis Crew Hub
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-bold text-slate-300">
                10 Crew
              </span>
            </div>

            {/* Search Input ("Find a conversation...") */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a crewmate..."
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-8 pr-3 py-2 text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Channels Section */}
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Channels
              </div>

              <button
                type="button"
                onClick={() => setActiveSubpage('crewmates')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  activeSubpage === 'crewmates'
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-xs'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Hash className="w-4 h-4 shrink-0" />
                  <span>crewmates</span>
                </span>
                <span
                  className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    activeSubpage === 'crewmates'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {crew.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubpage('overall')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  activeSubpage === 'overall'
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-xs'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Hash className="w-4 h-4 shrink-0" />
                  <span>overall</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubpage('ai')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  activeSubpage === 'ai'
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-xs'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Hash className="w-4 h-4 shrink-0" />
                  <span>ai_assistance</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubpage('emergencies')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  activeSubpage === 'emergencies'
                    ? 'bg-red-600 text-white font-extrabold shadow-xs'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Hash className="w-4 h-4 shrink-0" />
                  <span>emergencies</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-black">
                  {emergencies.length}
                </span>
              </button>
            </div>

            {/* Direct Crewmate Roster Links (Slack Direct Messages style) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Crew Members
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {filteredCrew.map((member) => {
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
                        setActiveSubpage('crewmates');
                        setExpandedCrewId(member.id);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
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

          {/* Bottom Summary Footer */}
          <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
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

        {/* RIGHT MAIN SLACK-STYLE WORKSPACE PANE */}
        <div className="lg:col-span-9 flex flex-col bg-[#F8FAFC]">
          {/* Top Channel Header Bar + Sub-Navigation Tabs */}
          <div className="bg-white border-b border-slate-200 px-5 sm:px-7 pt-4 pb-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#07152E] flex items-center gap-1.5">
                  <Hash className="w-5 h-5 text-slate-400" />
                  <span>{CHANNEL_META[activeSubpage].name}</span>
                </h2>
                <span className="hidden sm:inline text-slate-300">|</span>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 truncate">
                  {CHANNEL_META[activeSubpage].topic}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-700">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{crew.length}</span>
                </span>
              </div>
            </div>

            {/* Slack-style Horizontal Sub-tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-extrabold pt-1">
              <button
                type="button"
                onClick={() => setActiveSubpage('crewmates')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                  activeSubpage === 'crewmates'
                    ? 'bg-[#07152E] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Crewmates</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubpage('overall')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                  activeSubpage === 'overall'
                    ? 'bg-[#07152E] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Overall Charts</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubpage('ai')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                  activeSubpage === 'ai'
                    ? 'bg-[#07152E] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Assistance</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubpage('emergencies')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                  activeSubpage === 'emergencies'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Emergencies ({emergencies.length})</span>
              </button>
            </div>
          </div>

          {/* Main Workspace Body */}
          <div className="flex-1 p-5 sm:p-7 flex flex-col">
            {/* SUBPAGE 1: CREWMATES */}
            {activeSubpage === 'crewmates' && (
              <div className="space-y-3">
                {filteredCrew.map((member) => {
                  const ev = evaluateCrewMemberStatus(member);
                  const isExpanded = expandedCrewId === member.id;
                  const pose = getMemberPose(member);
                  const suggestions = getSimpleSuggestions(member);

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
                      className={`rounded-2xl bg-white border transition overflow-hidden ${
                        ev.status === 'critical'
                          ? 'border-red-400 shadow-sm'
                          : isExpanded
                          ? 'border-[#07152E] shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCrewId((prev) => (prev === member.id ? null : member.id))
                        }
                        className="w-full p-4 flex flex-wrap items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/70 transition"
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
                            </div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-600 truncate">
                              {member.role} · {member.moduleLocation} · {member.conditionSummary}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="hidden sm:flex items-center gap-3 text-xs font-mono font-bold text-slate-700">
                            <span>HR {member.vitals.heartRate}</span>
                            <span>SpO2 {member.vitals.spo2}%</span>
                            <span>
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

                      {isExpanded && (
                        <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                          <div className="lg:col-span-7 space-y-3">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                              Live Watch Health Status
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
                                <div className="text-xs font-semibold text-slate-500">Radiation</div>
                                <div className="text-lg font-extrabold text-[#07152E]">
                                  {member.vitals.radiationRate} uSv/h
                                </div>
                              </div>
                              <div className="rounded-xl bg-white border border-slate-200 p-3">
                                <div className="text-xs font-semibold text-slate-500">Sleep Score</div>
                                <div className="text-lg font-extrabold text-[#07152E]">
                                  {member.vitals.sleepScore}/100
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-4 space-y-2.5">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4" />
                              <span>Suggestions to Take</span>
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
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* SUBPAGE 2: OVERALL */}
            {activeSubpage === 'overall' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                    <div className="text-xs font-bold text-emerald-800">Safe Crew</div>
                    <div className="text-2xl font-black text-emerald-700">{safeCount}</div>
                  </div>
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                    <div className="text-xs font-bold text-amber-800">Check Soon</div>
                    <div className="text-2xl font-black text-amber-700">{warnCount}</div>
                  </div>
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                    <div className="text-xs font-bold text-red-800">Emergencies</div>
                    <div className="text-2xl font-black text-red-600">{critCount}</div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="text-xs font-bold text-slate-500">Avg Heart</div>
                    <div className="text-2xl font-black text-[#07152E]">{avgHeart} bpm</div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="text-xs font-bold text-slate-500">Avg Oxygen</div>
                    <div className="text-2xl font-black text-[#07152E]">{avgSpo2}%</div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="text-xs font-bold text-slate-500">Avg Sleep</div>
                    <div className="text-2xl font-black text-[#07152E]">{avgSleep}/100</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-[#07152E] flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Heart Rate &amp; Blood Pressure</span>
                      </h3>
                      <span className="text-xs font-bold text-slate-500">Normal &lt; 140</span>
                    </div>
                    <div className="space-y-2">
                      {crew.map((m) => {
                        const pct = Math.min(100, Math.round((m.vitals.systolicBp / 170) * 100));
                        const barColor =
                          m.vitals.systolicBp >= 145
                            ? 'bg-red-500'
                            : m.vitals.systolicBp >= 132
                            ? 'bg-amber-400'
                            : 'bg-sky-500';
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

                  <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-[#07152E]">
                        Bone Strength &amp; Sleep Score
                      </h3>
                      <span className="text-xs font-bold text-slate-500">Safe &ge; 1.02</span>
                    </div>
                    <div className="space-y-2">
                      {crew.map((m) => {
                        const pct = Math.min(100, Math.round((m.vitals.boneMass / 1.35) * 100));
                        const barColor =
                          m.vitals.boneMass < 1.02 ? 'bg-amber-400' : 'bg-emerald-500';
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
              </div>
            )}

            {/* SUBPAGE 3: AI ASSISTANCE (Matches Screenshot 1 & 2: Clean dark/modern card, "Where should we start?", suggestions on bottom, expands when there is chat history) */}
            {activeSubpage === 'ai' && (
              <div className="flex-1 flex flex-col rounded-3xl bg-[#0B0F1A] text-white p-6 sm:p-10 shadow-inner min-h-[480px] justify-between">
                {aiHistory.length === 0 ? (
                  /* EMPTY STATE (Matches Screenshot 1) */
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
                        placeholder="Ask Aegis"
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
                  /* EXPANDED CONVERSATION STATE (Matches Screenshot 2) */
                  <div className="flex-1 flex flex-col justify-between max-w-2xl w-full mx-auto space-y-6">
                    <div className="space-y-6 overflow-y-auto pr-1 max-h-[380px]">
                      {aiHistory.map((item, idx) => (
                        <div key={idx} className="space-y-4">
                          {/* User Prompt Bubble on Right */}
                          <div className="flex justify-end">
                            <div className="max-w-[80%] rounded-3xl bg-[#1E1F23] border border-white/10 px-5 py-3.5 text-sm sm:text-base text-slate-100 leading-relaxed">
                              {item.q}
                            </div>
                          </div>

                          {/* Assistant Response Below */}
                          <div className="space-y-3 text-slate-100">
                            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line">
                              {item.a}
                            </p>

                            {/* Subtle Action Row Below Response */}
                            <div className="flex items-center gap-4 text-slate-400 pt-1">
                              <ThumbsUp className="w-4 h-4 hover:text-white cursor-pointer" />
                              <ThumbsDown className="w-4 h-4 hover:text-white cursor-pointer" />
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

                    {/* Bottom Docked Input Bar */}
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
                        placeholder="Ask Aegis"
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

            {/* SUBPAGE 4: EMERGENCIES */}
            {activeSubpage === 'emergencies' && (
              <div className="space-y-4">
                {emergencies.length === 0 ? (
                  <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
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
                        className="rounded-3xl bg-red-50/70 border-2 border-red-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <AstronautCharacterSvg emotion="surprised" size={72} />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg font-black text-red-700">
                                {emg.crewName}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-black">
                                {emg.acknowledged ? 'Acknowledged' : 'New Emergency'}
                              </span>
                            </div>
                            <div className="text-sm sm:text-base font-extrabold text-slate-900">
                              {emg.headline} ({emg.location})
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
                            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-extrabold cursor-pointer shrink-0"
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
