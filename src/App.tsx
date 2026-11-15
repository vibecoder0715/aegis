import { useState, useEffect } from 'react';
import { Watch, Users, PlayCircle } from 'lucide-react';
import {
  buildInitialCrew,
  CrewMember,
  DEFAULT_SENSOR_INPUTS,
  LiveSensorInputs,
  computeBoneMetricsFromSoundWave,
} from './utils/metricsEngine';
import { CommanderDashboardView } from './components/CommanderDashboardView';
import { WatchShowcaseView } from './components/WatchShowcaseView';
import { DemonstrationView } from './components/DemonstrationView';
import { AegisWordmarkSvg } from './components/AegisBrandLogo';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import {
  buildSleepSummary,
  computeLevelFromXp,
  loadVisitorWatchDb,
  saveVisitorWatchDb,
  VisitorWatchDatabase,
} from '../watch/watchDb';
import {
  applyDetailedTogglerChange,
  createInitialTogglerState,
  evaluateWatchAlertFromState,
  UnifiedTogglerState,
  WatchQuickAction,
} from '../watch/togglerEngine';

type ActiveTab = 'watch' | 'demonstration' | 'commander';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('watch');
  const [watchDb, setWatchDb] = useState<VisitorWatchDatabase>(() => loadVisitorWatchDb());
  const [togglerState, setTogglerState] = useState<UnifiedTogglerState>(() => ({
    ...createInitialTogglerState(),
    extraEnv: loadVisitorWatchDb().extraEnv,
    watchBatteryPct: loadVisitorWatchDb().settings.batteryPct,
  }));
  const [crew, setCrew] = useState<CrewMember[]>(() => buildInitialCrew());

  useEffect(() => {
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.crew) setCrew(data.crew);
        if (data?.sensorInputs) {
          setTogglerState((prev) => ({
            ...prev,
            inputs: data.sensorInputs,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateWatchDb = (updater: (prev: VisitorWatchDatabase) => VisitorWatchDatabase) => {
    setWatchDb((prev) => {
      const next = updater(prev);
      saveVisitorWatchDb(next);
      return next;
    });
  };

  const syncAllFromTogglerState = (nextState: UnifiedTogglerState) => {
    setTogglerState(nextState);

    handleUpdateWatchDb((prev) => ({
      ...prev,
      extraEnv: nextState.extraEnv,
      sleep: buildSleepSummary(nextState.inputs.sleepHours),
      settings: {
        ...prev.settings,
        batteryPct: nextState.watchBatteryPct,
      },
    }));

    const { boneMass } = computeBoneMetricsFromSoundWave(nextState.inputs.tibialSoundSpeed);
    const activeAlert = evaluateWatchAlertFromState(nextState);
    setCrew((prev) =>
      prev.map((member, idx) => {
        if (idx !== 0) return member;
        const derivedStatus =
          activeAlert.severity === 'critical' || activeAlert.severity === 'peer'
            ? 'critical'
            : activeAlert.severity === 'warning'
            ? 'warning'
            : 'nominal';

        return {
          ...member,
          status: derivedStatus,
          conditionSummary: activeAlert.active
            ? `${activeAlert.headline} (${activeAlert.subline})`
            : 'Vitals and suit air normal',
          vitals: {
            ...member.vitals,
            systolicBp: nextState.inputs.systolicBp,
            diastolicBp: nextState.inputs.diastolicBp,
            heartRate: nextState.inputs.heartRate,
            spo2: nextState.inputs.spo2,
            radiationRate: nextState.inputs.radiationRate,
            boneMass,
            ultrasonicSos: nextState.inputs.tibialSoundSpeed,
            cabinCo2: nextState.inputs.cabinCo2,
            steps: nextState.inputs.steps,
            calories: nextState.inputs.calories,
          },
        };
      })
    );
  };

  const handleApplyQuickAction = (action: WatchQuickAction) => {
    const nextState = action.apply(togglerState);
    syncAllFromTogglerState(nextState);
  };

  const handleToggleDetail = (key: string, nextValue: number | boolean) => {
    const nextState = applyDetailedTogglerChange(togglerState, key, nextValue);
    syncAllFromTogglerState(nextState);
  };

  const handleUpdateSensorInputs = (partial: Partial<LiveSensorInputs>) => {
    let nextState: UnifiedTogglerState = {
      ...togglerState,
      inputs: { ...togglerState.inputs, ...partial },
    };
    if (typeof partial.exerciseActive === 'boolean') {
      nextState = applyDetailedTogglerChange(nextState, 'exercise_active', partial.exerciseActive);
    }
    syncAllFromTogglerState(nextState);
  };

  const handleResetNominal = () => {
    const base = createInitialTogglerState();
    const nextState: UnifiedTogglerState = {
      ...base,
      inputs: {
        ...DEFAULT_SENSOR_INPUTS,
        steps: togglerState.inputs.steps,
        calories: togglerState.inputs.calories,
        sleepHours: togglerState.inputs.sleepHours,
      },
    };
    syncAllFromTogglerState(nextState);
  };

  const handleUpdateCrewMember = (updated: CrewMember) => {
    setCrew((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const lvlInfo = computeLevelFromXp(watchDb.xp);
  const buffAppraisal = {
    visitorId: watchDb.visitorId,
    level: lvlInfo.level,
    title: lvlInfo.title,
    xp: watchDb.xp,
    aegisPoints: watchDb.aegisPoints,
    completedTasks: watchDb.dailyTasks.filter((t) => t.completed).length,
    totalTasks: watchDb.dailyTasks.length,
    planetDecorCount: watchDb.placedPlanetItems.length,
  };

  const NAV_ITEMS: Array<{ id: ActiveTab; label: string; mobileLabel: string; icon: typeof Watch }> = [
    { id: 'watch', label: 'Aegis Watch', mobileLabel: 'Watch', icon: Watch },
    { id: 'demonstration', label: 'Demonstration', mobileLabel: 'Demo', icon: PlayCircle },
    { id: 'commander', label: 'Aegis Board', mobileLabel: 'Board', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col overflow-x-hidden">
      {/* Clean 3-Zone Header: Brand Wordmark · Desktop Nav · Slide Deck + Github */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 lg:px-10 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('watch');
            }}
            className="inline-flex items-center shrink-0"
            aria-label="Aegis Home"
          >
            <AegisWordmarkSvg height={32} />
          </a>

          {/* Desktop Navigation Tabs */}
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-extrabold transition cursor-pointer min-h-[44px] whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#07152E] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-amber-300' : 'text-slate-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <PWAInstallButton />
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 lg:px-10 pt-5 sm:pt-7">
        {activeTab === 'watch' && (
          <WatchShowcaseView
            db={watchDb}
            togglerState={togglerState}
            onUpdateDb={handleUpdateWatchDb}
            onApplyQuickAction={handleApplyQuickAction}
            onToggleDetail={handleToggleDetail}
            onUpdateSensorInputs={handleUpdateSensorInputs}
            onResetNominal={handleResetNominal}
          />
        )}
        {activeTab === 'demonstration' && <DemonstrationView />}
        {activeTab === 'commander' && (
          <CommanderDashboardView
            crew={crew}
            onUpdateCrewMember={handleUpdateCrewMember}
            buffAppraisal={buffAppraisal}
          />
        )}
      </main>

      <OfflineIndicator simulatedOffline={watchDb.settings.offlineSimulated} />

      {/* Mobile Compact Bottom Navigation Bar (<=15% viewport height) */}
      <nav
        aria-label="Mobile Page Selector"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl px-3 py-2"
      >
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-2xl font-extrabold text-xs transition cursor-pointer min-h-[44px] whitespace-nowrap ${
                  active
                    ? 'bg-[#07152E] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-300' : 'text-slate-600'}`} />
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
