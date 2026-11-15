import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  SlidersHorizontal,
  Flashlight,
  Settings,
  Radio,
  Bell,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Plus,
  AlertTriangle,
  Footprints,
  Heart,
  BatteryCharging,
  CheckCircle2,
  WifiOff,
  X,
} from 'lucide-react';
import {
  evaluateWatchAlert,
  LiveSensorInputs,
  SituationId,
  WatchAlert,
} from '../src/utils/metricsEngine';
import { AegisEmblemSvg } from '../src/components/AegisBrandLogo';
import { WATCH_APPS_CATALOG, WatchAppIconSvg } from './WatchAppIcons';
import {
  ALL_SHORTCUT_META,
  computeLevelFromXp,
  ShortcutActionId,
  VisitorWatchDatabase,
  WatchAppId,
} from './watchDb';
import {
  playCriticalKlaxon,
  playPeerEmergencyAlert,
  playTapClick,
  playWarningChime,
} from './watchAudio';
import {
  EmotionsAppView,
  HealthInsightsAppView,
  HeartRateMeasuringAppView,
  NutritionsAppView,
  PulseWaveAppView,
  RadiomeasureAppView,
  SleepAppView,
  Spo2AppView,
  StepsDetailAppView,
  ViabilityAppView,
} from './apps/CoreBiometricApps';
import {
  CalculatorAppView,
  CalendarAppView,
  ClockAppView,
  EnvironmentAppView,
  MusicAppView,
  NotepadAppView,
  WorkoutAppView,
} from './apps/EnvironmentAndToolApps';
import {
  AegisAiAppView,
  CameraAppView,
  GalleryAppView,
  RecorderAppView,
} from './apps/MediaAndAiApps';
import { AegisBuffAppView } from './apps/AegisBuffApp';
import { MiniGamesAppView } from './apps/MiniGamesApp';

type WatchRoute =
  | { view: 'home' }
  | { view: 'shortcuts' }
  | { view: 'apps'; page: number }
  | { view: 'settings' }
  | { view: 'steps' }
  | { view: 'heart_measure' }
  | { view: 'app'; appId: WatchAppId };

interface WatchOSProps {
  db: VisitorWatchDatabase;
  inputs: LiveSensorInputs;
  situation: SituationId;
  alertOverride?: WatchAlert;
  onUpdateDb: (updater: (prev: VisitorWatchDatabase) => VisitorWatchDatabase) => void;
  onUpdateInputs: (partial: Partial<LiveSensorInputs>) => void;
  expanded?: boolean;
}

export const WatchOS: React.FC<WatchOSProps> = ({
  db,
  inputs,
  situation,
  alertOverride,
  onUpdateDb,
  onUpdateInputs,
  expanded = false,
}) => {
  const [route, setRoute] = useState<WatchRoute>({ view: 'home' });
  const [utcNow, setUtcNow] = useState(() => new Date());
  const [acknowledgedKey, setAcknowledgedKey] = useState<string>('');
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [pingMessage, setPingMessage] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastSoundAlertKey = useRef<string>('');
  const pingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live UTC-0 clock + viewport width listener for crisp +200% scaling
  useEffect(() => {
    const id = setInterval(() => setUtcNow(new Date()), 1000);
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', onResize);
      if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
    };
  }, []);

  const alert = alertOverride ?? evaluateWatchAlert(situation, inputs);
  const currentAlertSignature = `${alert.severity}:${alert.headline}:${alert.metricSnapshot}`;
  const showEmergencyOverlay =
    alert.active &&
    (alert.severity === 'critical' || alert.severity === 'peer' || alert.severity === 'warning') &&
    acknowledgedKey !== currentAlertSignature;

  // Trigger global sound & haptic vibration when new alert activates
  useEffect(() => {
    if (!alert.active || alert.severity === 'nominal' || alert.severity === 'info') {
      lastSoundAlertKey.current = '';
      return;
    }
    if (lastSoundAlertKey.current === currentAlertSignature) return;
    lastSoundAlertKey.current = currentAlertSignature;

    const muted = db.settings.muted || (db.settings.doNotDisturb && alert.severity === 'warning');
    if (alert.severity === 'critical') {
      playCriticalKlaxon(muted);
    } else if (alert.severity === 'peer') {
      playPeerEmergencyAlert(muted);
    } else if (alert.severity === 'warning') {
      playWarningChime(muted);
    }
  }, [alert.active, alert.severity, currentAlertSignature, db.settings.muted, db.settings.doNotDisturb]);

  // Mousewheel lock inside watch viewport so outer webpage never hijacks scroll
  const handleWheelLock = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atTop = scrollTop <= 0 && e.deltaY < 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
    if (!atTop && !atBottom) {
      e.stopPropagation();
    }
  };

  // Unified pointer/touch swipe detection
  const onPointerStart = (x: number, y: number) => {
    swipeStartRef.current = { x, y };
  };

  const onPointerEnd = (x: number, y: number) => {
    if (!swipeStartRef.current) return;
    const dx = x - swipeStartRef.current.x;
    const dy = y - swipeStartRef.current.y;
    swipeStartRef.current = null;

    if (Math.abs(dy) > 48 && Math.abs(dy) > Math.abs(dx)) {
      if (dy > 0 && route.view === 'home') {
        playTapClick(db.settings.muted);
        setRoute({ view: 'shortcuts' });
      } else if (dy < 0 && route.view === 'shortcuts') {
        playTapClick(db.settings.muted);
        setRoute({ view: 'home' });
      }
    } else if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        if (route.view === 'home') {
          playTapClick(db.settings.muted);
          setRoute({ view: 'apps', page: 0 });
        } else if (route.view === 'apps' && route.page < 3) {
          playTapClick(db.settings.muted);
          setRoute({ view: 'apps', page: route.page + 1 });
        }
      } else if (dx > 0) {
        if (route.view === 'apps') {
          playTapClick(db.settings.muted);
          if (route.page > 0) setRoute({ view: 'apps', page: route.page - 1 });
          else setRoute({ view: 'home' });
        }
      }
    }
  };

  const triggerShortcut = (id: ShortcutActionId) => {
    playTapClick(db.settings.muted);
    switch (id) {
      case 'flashlight':
        onUpdateDb((p) => ({
          ...p,
          settings: { ...p.settings, flashlightOn: !p.settings.flashlightOn },
        }));
        break;
      case 'settings':
        setRoute({ view: 'settings' });
        break;
      case 'find_suit':
        playPeerEmergencyAlert(db.settings.muted);
        setPingMessage('6.5 GHz UWB Ping Broadcast Sent');
        if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = setTimeout(() => setPingMessage(null), 2200);
        break;
      case 'alarms':
        setRoute({ view: 'app', appId: 'clock' });
        break;
      case 'dnd':
        onUpdateDb((p) => ({
          ...p,
          settings: { ...p.settings, doNotDisturb: !p.settings.doNotDisturb },
        }));
        break;
      case 'auto_brightness':
        onUpdateDb((p) => ({
          ...p,
          settings: { ...p.settings, autoBrightness: !p.settings.autoBrightness },
        }));
        break;
      case 'mute_audio':
        onUpdateDb((p) => ({
          ...p,
          settings: { ...p.settings, muted: !p.settings.muted },
        }));
        break;
      case 'aegis_ai':
        setRoute({ view: 'app', appId: 'aegis_ai' });
        break;
      case 'spo2_quick':
        setRoute({ view: 'app', appId: 'spo2' });
        break;
      case 'env_quick':
        setRoute({ view: 'app', appId: 'environment' });
        break;
      case 'games_quick':
        setRoute({ view: 'app', appId: 'mini_games' });
        break;
    }
  };

  const toggleShortcutMembership = (id: ShortcutActionId) => {
    playTapClick(db.settings.muted);
    onUpdateDb((prev) => {
      const exists = prev.shortcuts.includes(id);
      const nextList = exists
        ? prev.shortcuts.filter((x) => x !== id)
        : [...prev.shortcuts, id];
      return { ...prev, shortcuts: nextList };
    });
  };

  const utcHours = utcNow.toISOString().slice(11, 19);
  const utcDayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const utcDayLabel = `${utcDayNames[utcNow.getUTCDay()]} ${String(
    utcNow.getUTCMonth() + 1
  ).padStart(2, '0')}/${String(utcNow.getUTCDate()).padStart(2, '0')} UTC-0`;
  const barometerHpa = Math.round(db.extraEnv.barometerKpa * 10);
  const lvlInfo = computeLevelFromXp(db.xp);
  const currentAppMeta =
    route.view === 'app' ? WATCH_APPS_CATALOG.find((a) => a.id === route.appId) : null;

  const isMobile = viewportWidth < 640;
  const baseW = isMobile ? 276 : 308;
  const baseH = isMobile ? 354 : 388;
  const expandScale = !expanded
    ? 1
    : viewportWidth >= 1024
    ? 2.0
    : viewportWidth >= 640
    ? Number(Math.min(1.85, (viewportWidth - 96) / baseW).toFixed(2))
    : Number(Math.min(1.25, (viewportWidth - 64) / baseW).toFixed(2));

  const scaledW = Math.round(baseW * expandScale);
  const scaledH = Math.round(baseH * expandScale);

  const renderShortcutIcon = (id: ShortcutActionId) => {
    const cls = 'w-4 h-4';
    switch (id) {
      case 'flashlight':
        return <Flashlight className={cls} />;
      case 'settings':
        return <Settings className={cls} />;
      case 'find_suit':
        return <Radio className={cls} />;
      case 'alarms':
        return <Bell className={cls} />;
      case 'dnd':
        return <Moon className={cls} />;
      case 'auto_brightness':
        return <Sun className={cls} />;
      case 'mute_audio':
        return db.settings.muted ? <VolumeX className={cls} /> : <Volume2 className={cls} />;
      default:
        return <SlidersHorizontal className={cls} />;
    }
  };

  return (
    <div
      style={{ width: `${scaledW}px`, height: `${scaledH}px` }}
      className="relative inline-block select-none transition-all duration-300 mx-auto shrink-0"
    >
      {/* Titanium Watch Outer Hardware Bezel + Side Crown Button */}
      <div
        style={{
          width: `${baseW}px`,
          height: `${baseH}px`,
          transform: `scale(${expandScale})`,
          transformOrigin: 'top left',
        }}
        className="relative rounded-[50px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_24px_60px_rgba(7,21,46,0.35)] border-[3px] border-slate-600/80 transition-transform duration-300"
      >
        {/* Physical Right Watch Crown Button (Click = Home) */}
        <button
          type="button"
          onClick={() => {
            playTapClick(db.settings.muted);
            setRoute({ view: 'home' });
          }}
          title="Watch Home Button"
          aria-label="Watch Home Button"
          className="absolute -right-[11px] top-1/2 -translate-y-1/2 w-[10px] h-14 rounded-r-lg bg-slate-500 hover:bg-amber-400 border-y border-r border-slate-400 shadow cursor-pointer transition-colors"
        />

        {/* OLED Inner Screen */}
        <div
          className="relative w-full h-full rounded-[40px] bg-[#080C16] text-white overflow-hidden flex flex-col border border-slate-700/60"
          style={{ filter: `brightness(${Math.max(55, db.settings.brightness)}%)` }}
          onMouseDown={(e) => onPointerStart(e.clientX, e.clientY)}
          onMouseUp={(e) => onPointerEnd(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            if (e.touches[0]) onPointerStart(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={(e) => {
            if (e.changedTouches[0]) onPointerEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
          }}
          onWheel={handleWheelLock}
        >
          {/* Flashlight Screen Torch Mode */}
          {db.settings.flashlightOn && (
            <div className="absolute inset-0 z-50 bg-white text-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <Flashlight className="w-12 h-12 text-amber-500" />
              <div className="text-lg font-extrabold">Wrist Torch Active</div>
              <button
                type="button"
                onClick={() => triggerShortcut('flashlight')}
                className="px-5 py-2.5 rounded-full bg-slate-950 text-white font-black text-xs cursor-pointer"
              >
                Turn Off Torch
              </button>
            </div>
          )}

          {/* SCOPED FULL-WATCH EMERGENCY / ALERT OVERLAY */}
          {showEmergencyOverlay && (
            <div
              role="alertdialog"
              aria-label={`Watch alert: ${alert.headline}`}
              className={`absolute inset-0 z-40 p-4 flex flex-col items-center justify-between text-center ${
                alert.severity === 'critical'
                  ? 'bg-red-600 text-white'
                  : alert.severity === 'peer'
                  ? 'bg-purple-700 text-white'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              <div className="text-[10px] font-mono font-black uppercase tracking-widest opacity-90">
                {alert.isPeerAlert ? '6.5 GHz UWB PEER SOS' : 'AEGIS SUIT DETECTOR ALERT'}
              </div>

              <div className="space-y-1.5 px-1">
                <AlertTriangle className="w-10 h-10 mx-auto animate-pulse" />
                <div className="text-lg font-black leading-tight">{alert.headline}</div>
                <div className="font-mono text-xs font-bold opacity-90">{alert.subline}</div>
                <div className="rounded-xl bg-black/20 px-2.5 py-2 text-xs font-extrabold leading-snug">
                  {alert.actionText}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playTapClick(db.settings.muted);
                  setAcknowledgedKey(currentAlertSignature);
                }}
                className="w-full py-2.5 rounded-2xl bg-white text-slate-950 font-black text-xs shadow-lg cursor-pointer hover:bg-slate-100"
              >
                Acknowledge
              </button>
            </div>
          )}

          {/* Top Navigation Strip (Inside Apps / Drawer) */}
          {route.view !== 'home' ? (
            <div className="shrink-0 px-3.5 pt-2.5 pb-1.5 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-[#0B101E]">
              <button
                type="button"
                aria-label="Back to watch face"
                onClick={() => {
                  playTapClick(db.settings.muted);
                  if (route.view === 'app') setRoute({ view: 'apps', page: currentAppMeta?.page ?? 0 });
                  else setRoute({ view: 'home' });
                }}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-xs font-extrabold truncate text-slate-100">
                {route.view === 'shortcuts' && 'Quick Shortcuts'}
                {route.view === 'apps' && `Apps (${route.page + 1}/4)`}
                {route.view === 'settings' && 'Watch Settings'}
                {route.view === 'steps' && 'Daily Steps'}
                {route.view === 'heart_measure' && 'Heart Rate'}
                {route.view === 'app' && (currentAppMeta?.label || 'Aegis App')}
              </div>

              <button
                type="button"
                aria-label="Home watchface"
                onClick={() => {
                  playTapClick(db.settings.muted);
                  setRoute({ view: 'home' });
                }}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Home Watchface Top Pill Handle for Shortcuts (Swipe Down Trigger) */
            <button
              type="button"
              aria-label="Open Quick Shortcuts"
              onClick={() => {
                playTapClick(db.settings.muted);
                setRoute({ view: 'shortcuts' });
              }}
              className="shrink-0 mx-auto mt-1.5 w-12 h-1.5 rounded-full bg-slate-600 hover:bg-cyan-400 transition-colors cursor-pointer"
            />
          )}

          {/* MAIN SCROLLABLE WATCH BODY */}
          <div
            ref={scrollContainerRef}
            data-testid="watch-scroll-body"
            className="flex-1 overflow-y-auto px-3 py-2 space-y-2 overscroll-contain scrollbar-thin"
          >
            {/* Alert Status Minimized Banner (after Acknowledge) */}
            {alert.active && alert.severity !== 'nominal' && acknowledgedKey === currentAlertSignature && (
              <button
                type="button"
                onClick={() => setAcknowledgedKey('')}
                className="w-full rounded-xl bg-red-600/25 border border-red-400/50 px-2.5 py-1 flex items-center justify-between text-[10px] font-bold text-red-200 cursor-pointer"
              >
                <span className="truncate">Active: {alert.headline}</span>
                <span className="underline shrink-0 ml-1">View</span>
              </button>
            )}

            {/* 1. HOME WATCHFACE (Mimics Clean Reference Layout + UTC-0) */}
            {route.view === 'home' && (
              <div className="h-full flex flex-col justify-between space-y-2">
                {/* Corner Barometer & Radiation UV Index + UTC-0 Date/Time */}
                <div>
                  <div className="flex items-center justify-between px-1 font-mono text-[10px] text-slate-400 font-bold">
                    <span>{barometerHpa} hPa</span>
                    <span>{utcDayLabel}</span>
                    <span>{Math.round(inputs.radiationRate)} uSv</span>
                  </div>
                  <div className="font-mono text-[32px] sm:text-[36px] font-extrabold text-center tracking-tight leading-none mt-1 tabular-nums text-white">
                    {utcHours}
                  </div>
                </div>

                {/* Middle Twin Cards: Activity/AI Rings (Left) + Cabin/Env Preview (Right) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          playTapClick(db.settings.muted);
                          setRoute({ view: 'app', appId: 'aegis_ai' });
                        }}
                        aria-label="Open AegisAI"
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow hover:scale-105 transition cursor-pointer"
                      >
                        <AegisEmblemSvg size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playTapClick(db.settings.muted);
                          setRoute({ view: 'app', appId: 'aegis_buff' });
                        }}
                        className="px-2 py-0.5 rounded-full bg-violet-600 text-[10px] font-black text-white cursor-pointer"
                      >
                        Lv.{lvlInfo.level}
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-300 font-bold">Move {Math.min(100, Math.round((inputs.steps / 10000) * 100))}%</span>
                      <span className="text-amber-300 font-bold">{db.aegisPoints}p</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playTapClick(db.settings.muted);
                      setRoute({ view: 'app', appId: 'environment' });
                    }}
                    className="rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 p-2 text-left flex flex-col justify-between cursor-pointer hover:brightness-110 transition"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-blue-100">
                      <span>Cabin 12</span>
                      <span className="font-mono">{db.extraEnv.heatwaveIndexC.toFixed(0)}°C</span>
                    </div>
                    <div className="font-mono text-[9.5px] leading-tight whitespace-nowrap tracking-tight text-white/95">
                      O₂ {db.extraEnv.cabinO2Pct}% · CO₂ {inputs.cabinCo2}
                    </div>
                    <div className="text-[9px] font-bold text-cyan-200 whitespace-nowrap">
                      CANS {(inputs.radiationRate * 0.31).toFixed(1)} uSv/h
                    </div>
                  </button>
                </div>

                {/* 3 Clickable Circular Bottom Dials: Steps · Heart Rate · Sleep */}
                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <button
                    type="button"
                    aria-label="Open Steps timeline"
                    onClick={() => {
                      playTapClick(db.settings.muted);
                      setRoute({ view: 'steps' });
                    }}
                    className="aspect-square rounded-full border-[3px] border-emerald-500/80 bg-slate-900/90 flex flex-col items-center justify-center hover:scale-105 transition cursor-pointer"
                  >
                    <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-xs font-extrabold tabular-nums mt-0.5">
                      {inputs.steps > 999 ? `${(inputs.steps / 1000).toFixed(1)}k` : inputs.steps}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label="Measure Heart Rate"
                    onClick={() => {
                      playTapClick(db.settings.muted);
                      setRoute({ view: 'heart_measure' });
                    }}
                    className="aspect-square rounded-full border-[3px] border-rose-500 bg-slate-900/90 flex flex-col items-center justify-center hover:scale-105 transition cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span className="font-mono text-xs font-extrabold tabular-nums mt-0.5">
                      {inputs.heartRate}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label="Open Sleep stages"
                    onClick={() => {
                      playTapClick(db.settings.muted);
                      setRoute({ view: 'app', appId: 'sleep' });
                    }}
                    className="aspect-square rounded-full border-[3px] border-violet-500/85 bg-slate-900/90 flex flex-col items-center justify-center hover:scale-105 transition cursor-pointer"
                  >
                    <Moon className="w-3.5 h-3.5 text-violet-400" />
                    <span className="font-mono text-xs font-extrabold tabular-nums mt-0.5">
                      {inputs.sleepHours.toFixed(1)}h
                    </span>
                  </button>
                </div>

                {/* Bottom Quick Bar: Battery & Swipe Right->Left Apps Launcher Button */}
                <div className="flex items-center justify-between px-1 pt-0.5">
                  <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                    {db.settings.batteryPct}%
                  </span>
                  {db.settings.offlineSimulated && (
                    <span className="text-[9px] font-mono text-amber-300 flex items-center gap-0.5">
                      <WifiOff className="w-3 h-3" /> OFFLINE
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      playTapClick(db.settings.muted);
                      setRoute({ view: 'apps', page: 0 });
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-[10px] font-black text-cyan-300 flex items-center gap-0.5 cursor-pointer transition-colors"
                  >
                    Apps <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. TOP-DOWN QUICK SHORTCUTS DRAWER */}
            {route.view === 'shortcuts' && (
              <div className="space-y-2.5">
                {pingMessage && (
                  <div className="rounded-xl bg-cyan-500 text-slate-950 px-2 py-1 text-[10px] font-black text-center">
                    {pingMessage}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {db.shortcuts.map((scId) => {
                    const meta = ALL_SHORTCUT_META[scId];
                    const isActive =
                      (scId === 'dnd' && db.settings.doNotDisturb) ||
                      (scId === 'auto_brightness' && db.settings.autoBrightness) ||
                      (scId === 'flashlight' && db.settings.flashlightOn) ||
                      (scId === 'mute_audio' && db.settings.muted);

                    return (
                      <button
                        key={scId}
                        type="button"
                        onClick={() => triggerShortcut(scId)}
                        className={`rounded-2xl p-2 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {renderShortcutIcon(scId)}
                        <span className="text-[10px] font-bold truncate max-w-full">
                          {meta.shortLabel}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowAddShortcut((s) => !s)}
                    className="rounded-2xl p-2 bg-slate-900 border border-dashed border-slate-600 hover:border-cyan-400 flex flex-col items-center justify-center gap-1 text-cyan-300 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Add</span>
                  </button>
                </div>

                {showAddShortcut && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                      <span>Customize Shortcuts</span>
                      <button
                        type="button"
                        onClick={() => setShowAddShortcut(false)}
                        className="text-slate-400 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {(Object.keys(ALL_SHORTCUT_META) as ShortcutActionId[]).map((key) => {
                        const included = db.shortcuts.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleShortcutMembership(key)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer ${
                              included
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="truncate">{ALL_SHORTCUT_META[key].shortLabel}</span>
                            {included && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mx-auto w-20 rounded-full bg-slate-800 py-1 text-center font-mono text-[11px] font-bold text-slate-200">
                  Bat {db.settings.batteryPct}%
                </div>
              </div>
            )}

            {/* 3. PAGINATED 2x3 APP GRID (21 APPS · 4 CLEAN PAGES) */}
            {route.view === 'apps' && (
              <div className="h-full flex flex-col justify-between space-y-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-3 pt-1">
                  {WATCH_APPS_CATALOG.filter((a) => a.page === route.page).map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        playTapClick(db.settings.muted);
                        setRoute({ view: 'app', appId: app.id });
                      }}
                      className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className="group-hover:scale-105 transition-transform">
                        <WatchAppIconSvg id={app.id} size={46} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-100 leading-tight text-center truncate max-w-full">
                        {app.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Pagination Bar */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    aria-label="Previous app page"
                    disabled={route.page === 0}
                    onClick={() => setRoute({ view: 'apps', page: Math.max(0, route.page - 1) })}
                    className="p-1.5 rounded-full bg-slate-800 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((p) => (
                      <button
                        key={p}
                        type="button"
                        aria-label={`App page ${p + 1}`}
                        onClick={() => setRoute({ view: 'apps', page: p })}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          route.page === p ? 'w-5 bg-cyan-400' : 'w-2 bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label="Next app page"
                    disabled={route.page === 3}
                    onClick={() => setRoute({ view: 'apps', page: Math.min(3, route.page + 1) })}
                    className="p-1.5 rounded-full bg-slate-800 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 4. WATCH SETTINGS */}
            {route.view === 'settings' && (
              <div className="space-y-2.5 text-xs">
                <div className="rounded-xl bg-slate-900 border border-slate-700 p-2.5 space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>OLED Brightness</span>
                    <span className="font-mono text-amber-300">{db.settings.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={db.settings.brightness}
                    onChange={(e) =>
                      onUpdateDb((p) => ({
                        ...p,
                        settings: { ...p.settings, brightness: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateDb((p) => ({
                      ...p,
                      settings: { ...p.settings, offlineSimulated: !p.settings.offlineSimulated },
                    }))
                  }
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 flex items-center justify-between font-bold cursor-pointer"
                >
                  <span>Flight Offline Mode</span>
                  <span className={db.settings.offlineSimulated ? 'text-amber-300' : 'text-emerald-400'}>
                    {db.settings.offlineSimulated ? 'ON' : 'AUTO'}
                  </span>
                </button>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5 font-mono text-[10px] text-slate-400">
                  Visitor DB Partition: {db.visitorId}
                </div>
              </div>
            )}

            {/* 5. STEPS & HEART RATE MEASURING DIRECT ROUTES */}
            {route.view === 'steps' && (
              <StepsDetailAppView
                db={db}
                inputs={inputs}
                situation={situation}
                onUpdateDb={onUpdateDb}
                onUpdateInputs={onUpdateInputs}
              />
            )}
            {route.view === 'heart_measure' && (
              <HeartRateMeasuringAppView
                db={db}
                inputs={inputs}
                situation={situation}
                onUpdateDb={onUpdateDb}
                onUpdateInputs={onUpdateInputs}
              />
            )}

            {/* 6. ALL 21 WATCH APPS */}
            {route.view === 'app' && route.appId === 'sleep' && (
              <SleepAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'nutritions' && (
              <NutritionsAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'emotions' && (
              <EmotionsAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'clock' && (
              <ClockAppView db={db} inputs={inputs} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'music' && (
              <MusicAppView db={db} inputs={inputs} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'camera' && (
              <CameraAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} />
            )}
            {route.view === 'app' && route.appId === 'gallery' && (
              <GalleryAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} />
            )}
            {route.view === 'app' && route.appId === 'calculator' && <CalculatorAppView />}
            {route.view === 'app' && route.appId === 'environment' && (
              <EnvironmentAppView db={db} inputs={inputs} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'health_insights' && (
              <HealthInsightsAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'workout' && (
              <WorkoutAppView db={db} inputs={inputs} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'aegis_buff' && (
              <AegisBuffAppView db={db} onUpdateDb={onUpdateDb} />
            )}
            {route.view === 'app' && route.appId === 'notepad' && (
              <NotepadAppView db={db} inputs={inputs} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'recorder' && (
              <RecorderAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} />
            )}
            {route.view === 'app' && route.appId === 'aegis_ai' && (
              <AegisAiAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} />
            )}
            {route.view === 'app' && route.appId === 'calendar' && (
              <CalendarAppView db={db} inputs={inputs} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'pulse_wave' && (
              <PulseWaveAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'spo2' && (
              <Spo2AppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'radiomeasure' && (
              <RadiomeasureAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'viability' && (
              <ViabilityAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
            )}
            {route.view === 'app' && route.appId === 'mini_games' && (
              <MiniGamesAppView db={db} onUpdateDb={onUpdateDb} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
