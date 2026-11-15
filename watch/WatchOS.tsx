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
  CheckCircle2,
  X,
  Sparkles,
  Info,
  RefreshCw,
  LayoutGrid,
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
  ShortcutActionId,
  SystemShortcutId,
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
  H2oIntakeAppView,
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
  | { view: 'settings'; sub?: 'main' | 'shortcuts' | 'notifications' | 'viewport' | 'updates' | 'about' }
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

function getAlertTheme(alert: WatchAlert) {
  const h = alert.headline.toLowerCase();
  if (alert.isPeerAlert || alert.severity === 'peer') {
    return {
      overlayBg: 'bg-purple-700 text-white',
      bannerBg: 'bg-purple-600/30 border-purple-400 text-purple-100',
      badge: 'CREW SOS ALERT',
    };
  }
  if (h.includes('radiation') || h.includes('storm') || h.includes('solar')) {
    return {
      overlayBg: 'bg-amber-400 text-slate-950',
      bannerBg: 'bg-amber-500/30 border-amber-300 text-amber-100',
      badge: 'SOLAR RADIATION',
    };
  }
  if (h.includes('co2') || h.includes('air') || h.includes('cabin')) {
    return {
      overlayBg: 'bg-cyan-500 text-slate-950',
      bannerBg: 'bg-cyan-500/30 border-cyan-300 text-cyan-100',
      badge: 'CABIN AIR ALERT',
    };
  }
  if (h.includes('bone') || h.includes('sweat') || h.includes('water') || h.includes('sleep') || h.includes('sensor')) {
    return {
      overlayBg: 'bg-orange-500 text-slate-950',
      bannerBg: 'bg-orange-500/30 border-orange-300 text-orange-100',
      badge: 'HEALTH NOTICE',
    };
  }
  if (h.includes('workout') || alert.severity === 'info') {
    return {
      overlayBg: 'bg-emerald-500 text-slate-950',
      bannerBg: 'bg-emerald-500/30 border-emerald-300 text-emerald-100',
      badge: 'WORKOUT ACTIVE',
    };
  }
  if (alert.severity === 'warning') {
    return {
      overlayBg: 'bg-yellow-400 text-slate-950',
      bannerBg: 'bg-yellow-500/30 border-yellow-300 text-yellow-100',
      badge: 'WATCH WARNING',
    };
  }
  return {
    overlayBg: 'bg-red-600 text-white',
    bannerBg: 'bg-red-600/30 border-red-400 text-red-100',
    badge: 'EMERGENCY ALERT',
  };
}

function passesNotificationFilter(
  alert: WatchAlert,
  filter: 'all' | 'health' | 'environment' | 'peer' | undefined
): boolean {
  if (!filter || filter === 'all') return true;
  const h = alert.headline.toLowerCase();
  const isEnv = h.includes('radiation') || h.includes('co2') || h.includes('air') || h.includes('solar');
  if (filter === 'peer') return Boolean(alert.isPeerAlert || alert.severity === 'peer');
  if (filter === 'environment') return isEnv;
  if (filter === 'health') return !alert.isPeerAlert && !isEnv;
  return true;
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
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'up_to_date'>('idle');
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastSoundAlertKey = useRef<string>('');
  const pingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const filterAllowsAlert = passesNotificationFilter(alert, db.settings.notificationFilter);

  // Alerts ONLY live inside the Home Page
  const showEmergencyOverlay =
    route.view === 'home' &&
    filterAllowsAlert &&
    alert.active &&
    (alert.severity === 'critical' || alert.severity === 'peer' || alert.severity === 'warning') &&
    acknowledgedKey !== currentAlertSignature;

  const alertTheme = getAlertTheme(alert);

  useEffect(() => {
    if (!alert.active || alert.severity === 'nominal' || alert.severity === 'info' || !filterAllowsAlert) {
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
  }, [alert.active, alert.severity, currentAlertSignature, db.settings.muted, db.settings.doNotDisturb, filterAllowsAlert]);

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

  const appsPerPage = db.settings.appsPerPage ?? 0; // 0 = All on one page
  const totalAppPages =
    appsPerPage === 0 ? 1 : Math.max(1, Math.ceil(WATCH_APPS_CATALOG.length / appsPerPage));

  const onPointerStart = (x: number, y: number) => {
    swipeStartRef.current = { x, y };
  };

  const onPointerEnd = (x: number, y: number) => {
    if (!swipeStartRef.current) return;
    const dx = x - swipeStartRef.current.x;
    const dy = y - swipeStartRef.current.y;
    swipeStartRef.current = null;

    if (Math.abs(dy) > 44 && Math.abs(dy) > Math.abs(dx)) {
      if (dy > 0 && route.view === 'home') {
        playTapClick(db.settings.muted);
        setRoute({ view: 'shortcuts' });
      } else if (dy < 0 && route.view === 'shortcuts') {
        playTapClick(db.settings.muted);
        setRoute({ view: 'home' });
      }
    } else if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        if (route.view === 'home') {
          playTapClick(db.settings.muted);
          setRoute({ view: 'apps', page: 0 });
        } else if (route.view === 'apps' && route.page < totalAppPages - 1) {
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
    if (id.startsWith('app:')) {
      const appId = id.replace('app:', '') as WatchAppId;
      setRoute({ view: 'app', appId });
      return;
    }
    switch (id) {
      case 'flashlight':
        onUpdateDb((p) => ({
          ...p,
          settings: { ...p.settings, flashlightOn: !p.settings.flashlightOn },
        }));
        break;
      case 'settings':
        setRoute({ view: 'settings', sub: 'main' });
        break;
      case 'find_suit':
        playPeerEmergencyAlert(db.settings.muted);
        setPingMessage('Suit Signal Sent!');
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

  const timeFormatted = utcNow.toISOString().slice(11, 16);
  const currentAppMeta =
    route.view === 'app' ? WATCH_APPS_CATALOG.find((a) => a.id === route.appId) : null;

  const isMobile = viewportWidth < 640;
  const baseW = isMobile ? 276 : 308;
  const baseH = isMobile ? 354 : 388;
  const strapH = 34;
  const totalBaseH = baseH + strapH * 2;

  const expandScale = !expanded
    ? 1
    : viewportWidth >= 1024
    ? 1.85
    : viewportWidth >= 640
    ? Number(Math.min(1.65, (viewportWidth - 96) / baseW).toFixed(2))
    : Number(Math.min(1.2, (viewportWidth - 64) / baseW).toFixed(2));

  const scaledW = Math.round(baseW * expandScale);
  const scaledH = Math.round(totalBaseH * expandScale);

  const renderShortcutIcon = (id: ShortcutActionId) => {
    if (id.startsWith('app:')) {
      const appId = id.replace('app:', '') as WatchAppId;
      return <WatchAppIconSvg id={appId} size={22} />;
    }
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
      case 'aegis_ai':
        return <WatchAppIconSvg id="aegis_ai" size={20} />;
      case 'spo2_quick':
        return <WatchAppIconSvg id="spo2" size={20} />;
      case 'env_quick':
        return <WatchAppIconSvg id="environment" size={20} />;
      case 'games_quick':
        return <WatchAppIconSvg id="mini_games" size={20} />;
      default:
        return <SlidersHorizontal className={cls} />;
    }
  };

  const getShortcutLabel = (id: ShortcutActionId) => {
    if (id.startsWith('app:')) {
      const appId = id.replace('app:', '') as WatchAppId;
      return WATCH_APPS_CATALOG.find((a) => a.id === appId)?.label ?? 'App';
    }
    return ALL_SHORTCUT_META[id as SystemShortcutId]?.shortLabel ?? 'Shortcut';
  };

  const visibleApps =
    route.view === 'apps'
      ? appsPerPage === 0
        ? WATCH_APPS_CATALOG
        : WATCH_APPS_CATALOG.slice(route.page * appsPerPage, (route.page + 1) * appsPerPage)
      : [];

  return (
    <div
      style={{ width: `${scaledW}px`, height: `${scaledH}px` }}
      className="relative inline-block select-none transition-all duration-300 mx-auto shrink-0"
    >
      <div
        style={{
          width: `${baseW}px`,
          height: `${totalBaseH}px`,
          transform: `scale(${expandScale})`,
          transformOrigin: 'top left',
        }}
        className="relative flex flex-col items-center"
      >
        {/* TOP WATCH STRAP / BAND ("Hand for the watch") */}
        <div className="w-36 h-[34px] rounded-t-3xl bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 border-x-2 border-t-2 border-slate-600 shadow-inner flex flex-col items-center justify-evenly py-1">
          <div className="w-24 h-1 rounded-full bg-slate-900/70" />
          <div className="w-28 h-1 rounded-full bg-slate-900/70" />
          <div className="w-4 h-2 rounded-sm bg-slate-950/80 border border-slate-600/50" />
        </div>

        {/* Titanium Watch Outer Hardware Bezel + Side Crown Button */}
        <div
          style={{
            width: `${baseW}px`,
            height: `${baseH}px`,
          }}
          className="relative rounded-[50px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_24px_60px_rgba(7,21,46,0.35)] border-[3px] border-slate-600/80 transition-transform duration-300"
        >
          {/* Physical Right Watch Crown Button (Click = Home / Apps toggle) */}
          <button
            type="button"
            onClick={() => {
              playTapClick(db.settings.muted);
              if (route.view === 'home') {
                setRoute({ view: 'apps', page: 0 });
              } else {
                setRoute({ view: 'home' });
              }
            }}
            title="Watch Crown Button"
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
            {/* PURE BRIGHT WHITE TORCH SCREEN (Nothing else except "Turn off torch" on bottommost) */}
            {db.settings.flashlightOn && (
              <div className="absolute inset-0 z-50 bg-[#FFFFFF] flex flex-col justify-end items-center p-4">
                <button
                  type="button"
                  onClick={() => triggerShortcut('flashlight')}
                  className="w-full py-2.5 rounded-full bg-slate-900 text-white font-black text-xs cursor-pointer shadow-md"
                >
                  Turn off torch
                </button>
              </div>
            )}

            {/* HOME-PAGE-ONLY MULTI-COLOR ALERT OVERLAY */}
            {showEmergencyOverlay && (
              <div
                role="alertdialog"
                aria-label={`Watch alert: ${alert.headline}`}
                className={`absolute inset-0 z-40 p-4 flex flex-col items-center justify-between text-center ${alertTheme.overlayBg}`}
              >
                <div className="text-[10px] font-mono font-black uppercase tracking-widest opacity-90">
                  {alertTheme.badge}
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
                  Got It
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
                    if (route.view === 'settings' && route.sub && route.sub !== 'main') {
                      setRoute({ view: 'settings', sub: 'main' });
                    } else if (route.view === 'app') {
                      setRoute({ view: 'apps', page: 0 });
                    } else {
                      setRoute({ view: 'home' });
                    }
                  }}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-xs font-extrabold truncate text-slate-100">
                  {route.view === 'shortcuts' && 'Quick Shortcuts'}
                  {route.view === 'apps' &&
                    (appsPerPage === 0 ? 'All Apps' : `Apps (${route.page + 1}/${totalAppPages})`)}
                  {route.view === 'settings' && 'Settings'}
                  {route.view === 'steps' && 'Daily steps'}
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

            {/* MAIN SCROLLABLE WATCH BODY (Scrollbar completely hidden) */}
            <div
              ref={scrollContainerRef}
              data-testid="watch-scroll-body"
              className="flex-1 overflow-y-auto px-3 py-2 space-y-2 overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {/* 1. CLEAN HOME WATCHFACE: Time at very top + Multi-color alert banner + ONLY 5 ICONS */}
              {route.view === 'home' && (
                <div className="h-full flex flex-col justify-between py-1">
                  {/* Top Time + Home-Only Multi-Color Alert Banner */}
                  <div className="space-y-1.5 text-center">
                    <div className="font-mono text-[42px] sm:text-[46px] font-black tracking-tight leading-none tabular-nums text-white drop-shadow">
                      {timeFormatted}
                    </div>

                    {filterAllowsAlert &&
                      alert.active &&
                      alert.severity !== 'nominal' &&
                      acknowledgedKey === currentAlertSignature && (
                        <button
                          type="button"
                          onClick={() => setAcknowledgedKey('')}
                          className={`w-full rounded-xl border px-2.5 py-1 flex items-center justify-between text-[10px] font-extrabold cursor-pointer ${alertTheme.bannerBg}`}
                        >
                          <span className="truncate">{alert.headline}</span>
                          <span className="underline shrink-0 ml-1">Open</span>
                        </button>
                      )}
                  </div>

                  {/* Center 2 Featured Icons: AegisAI Logo + Aegis Buff! Icon */}
                  <div className="grid grid-cols-2 gap-3 px-2 my-auto">
                    <button
                      type="button"
                      onClick={() => {
                        playTapClick(db.settings.muted);
                        setRoute({ view: 'app', appId: 'aegis_ai' });
                      }}
                      aria-label="Open AegisAI"
                      className="rounded-3xl bg-slate-900/95 border border-slate-700/80 hover:border-cyan-400 p-3 flex flex-col items-center justify-center gap-1.5 shadow-lg hover:scale-105 transition cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow">
                        <AegisEmblemSvg size={30} />
                      </div>
                      <span className="text-[11px] font-extrabold text-white">AegisAI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playTapClick(db.settings.muted);
                        setRoute({ view: 'app', appId: 'aegis_buff' });
                      }}
                      aria-label="Open Aegis Buff!"
                      className="rounded-3xl bg-slate-900/95 border border-slate-700/80 hover:border-amber-400 p-3 flex flex-col items-center justify-center gap-1.5 shadow-lg hover:scale-105 transition cursor-pointer"
                    >
                      <WatchAppIconSvg id="aegis_buff" size={48} />
                      <span className="text-[11px] font-extrabold text-amber-300">Aegis Buff!</span>
                    </button>
                  </div>

                  {/* Bottom 3 Circular Health Icons: Steps · Heart · Sleep Time */}
                  <div className="grid grid-cols-3 gap-2.5 pb-1">
                    <button
                      type="button"
                      aria-label="Open Steps timeline"
                      onClick={() => {
                        playTapClick(db.settings.muted);
                        setRoute({ view: 'steps' });
                      }}
                      className="aspect-square rounded-full border-[3px] border-emerald-400 bg-slate-900/90 flex flex-col items-center justify-center hover:scale-105 transition cursor-pointer shadow"
                    >
                      <Footprints className="w-4 h-4 text-emerald-400" />
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
                      className="aspect-square rounded-full border-[3px] border-rose-500 bg-slate-900/90 flex flex-col items-center justify-center hover:scale-105 transition cursor-pointer shadow"
                    >
                      <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
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
                      className="aspect-square rounded-full border-[3px] border-violet-400 bg-slate-900/90 flex flex-col items-center justify-center hover:scale-105 transition cursor-pointer shadow"
                    >
                      <Moon className="w-4 h-4 text-violet-300 fill-violet-300" />
                      <span className="font-mono text-xs font-extrabold tabular-nums mt-0.5">
                        {inputs.sleepHours.toFixed(1)}h
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. TOP-DOWN QUICK SHORTCUTS DRAWER */}
              {route.view === 'shortcuts' && (
                <div className="space-y-2.5">
                  {pingMessage && (
                    <div className="rounded-xl bg-cyan-400 text-slate-950 px-2 py-1 text-[10px] font-black text-center">
                      {pingMessage}
                    </div>
                  )}

                  <div className="flex items-center justify-between px-1">
                    <span className="font-mono text-[11px] font-extrabold text-emerald-300">
                      Battery {db.settings.batteryPct}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        playTapClick(db.settings.muted);
                        setRoute({ view: 'apps', page: 0 });
                      }}
                      className="px-2.5 py-1 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black cursor-pointer"
                    >
                      All Apps
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {db.shortcuts.map((scId) => {
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
                            {getShortcutLabel(scId)}
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
                    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-2 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                        <span>Add or Remove Shortcuts</span>
                        <button
                          type="button"
                          onClick={() => setShowAddShortcut(false)}
                          className="text-slate-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {(Object.keys(ALL_SHORTCUT_META) as Array<keyof typeof ALL_SHORTCUT_META>).map((key) => {
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
                        {WATCH_APPS_CATALOG.map((app) => {
                          const key: ShortcutActionId = `app:${app.id}`;
                          const included = db.shortcuts.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleShortcutMembership(key)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer ${
                                included
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="truncate">{app.label}</span>
                              {included && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. APPS VIEW (Health apps first, configurable viewport: All default, or 6 / 4 per page) */}
              {route.view === 'apps' && (
                <div className="h-full flex flex-col justify-between space-y-2">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-3 pt-1">
                    {visibleApps.map((app) => (
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

                  {appsPerPage > 0 && totalAppPages > 1 && (
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
                        {Array.from({ length: totalAppPages }).map((_, p) => (
                          <button
                            key={p}
                            type="button"
                            aria-label={`App page ${p + 1}`}
                            onClick={() => setRoute({ view: 'apps', page: p })}
                            className={`h-2 rounded-full transition-all cursor-pointer ${
                              route.page === p ? 'w-4 bg-cyan-400' : 'w-2 bg-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        aria-label="Next app page"
                        disabled={route.page >= totalAppPages - 1}
                        onClick={() =>
                          setRoute({ view: 'apps', page: Math.min(totalAppPages - 1, route.page + 1) })
                        }
                        className="p-1.5 rounded-full bg-slate-800 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 4. WATCH SETTINGS (Brightness, Shortcut Manager, Notifications, Viewport, System & Updates, About) */}
              {route.view === 'settings' && (
                <div className="space-y-2 text-xs">
                  {(!route.sub || route.sub === 'main') && (
                    <>
                      <div className="rounded-xl bg-slate-900 border border-slate-700 p-2.5 space-y-1.5">
                        <div className="flex justify-between font-bold">
                          <span>Brightness</span>
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
                        onClick={() => setRoute({ view: 'settings', sub: 'shortcuts' })}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 p-2.5 flex items-center justify-between font-bold cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" /> Shortcut Manager
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoute({ view: 'settings', sub: 'notifications' })}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 p-2.5 flex items-center justify-between font-bold cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-400" /> Notifications
                        </span>
                        <span className="text-[10px] font-mono uppercase text-amber-300">
                          {db.settings.notificationFilter ?? 'all'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoute({ view: 'settings', sub: 'viewport' })}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 p-2.5 flex items-center justify-between font-bold cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <LayoutGrid className="w-4 h-4 text-emerald-400" /> Viewport
                        </span>
                        <span className="text-[10px] font-mono text-emerald-300">
                          {appsPerPage === 0 ? 'All Icons' : `${appsPerPage} / page`}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoute({ view: 'settings', sub: 'updates' })}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 p-2.5 flex items-center justify-between font-bold cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-sky-400" /> System & Updates
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoute({ view: 'settings', sub: 'about' })}
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 p-2.5 flex items-center justify-between font-bold cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-violet-400" /> About Watch
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </>
                  )}

                  {route.sub === 'shortcuts' && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-cyan-300">
                        Tap any icon to add to Quick Shortcuts:
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(ALL_SHORTCUT_META) as Array<keyof typeof ALL_SHORTCUT_META>).map((key) => {
                          const included = db.shortcuts.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleShortcutMembership(key)}
                              className={`p-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer border ${
                                included
                                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400'
                                  : 'bg-slate-900 text-slate-300 border-slate-800'
                              }`}
                            >
                              {renderShortcutIcon(key)}
                              <span className="truncate">{ALL_SHORTCUT_META[key].shortLabel}</span>
                            </button>
                          );
                        })}
                        {WATCH_APPS_CATALOG.map((app) => {
                          const key: ShortcutActionId = `app:${app.id}`;
                          const included = db.shortcuts.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleShortcutMembership(key)}
                              className={`p-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer border ${
                                included
                                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400'
                                  : 'bg-slate-900 text-slate-300 border-slate-800'
                              }`}
                            >
                              <WatchAppIconSvg id={app.id} size={20} />
                              <span className="truncate">{app.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {route.sub === 'notifications' && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-amber-300">Filter Watch Alerts:</div>
                      {(
                        [
                          { id: 'all', label: 'All Alerts' },
                          { id: 'health', label: 'Health Only' },
                          { id: 'environment', label: 'Air & Radiation Only' },
                          { id: 'peer', label: 'Crewmate SOS Only' },
                        ] as const
                      ).map((opt) => {
                        const active = (db.settings.notificationFilter ?? 'all') === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              onUpdateDb((p) => ({
                                ...p,
                                settings: { ...p.settings, notificationFilter: opt.id },
                              }))
                            }
                            className={`w-full p-2.5 rounded-xl font-bold flex items-center justify-between cursor-pointer border ${
                              active
                                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {active && <CheckCircle2 className="w-4 h-4 text-amber-300" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {route.sub === 'viewport' && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-300">Apps Per Page:</div>
                      {(
                        [
                          { count: 0, label: 'All Apps (Default)' },
                          { count: 6, label: '6 Icons Per Page' },
                          { count: 4, label: '4 Icons Per Page' },
                        ] as const
                      ).map((opt) => {
                        const active = (db.settings.appsPerPage ?? 0) === opt.count;
                        return (
                          <button
                            key={opt.count}
                            type="button"
                            onClick={() =>
                              onUpdateDb((p) => ({
                                ...p,
                                settings: { ...p.settings, appsPerPage: opt.count },
                              }))
                            }
                            className={`w-full p-2.5 rounded-xl font-bold flex items-center justify-between cursor-pointer border ${
                              active
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {active && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {route.sub === 'updates' && (
                    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-3 text-center space-y-2">
                      <RefreshCw
                        className={`w-8 h-8 text-sky-400 mx-auto ${
                          updateStatus === 'checking' ? 'animate-spin' : ''
                        }`}
                      />
                      <div className="font-extrabold text-sm">Aegis Watch OS 4.6</div>
                      <div className="text-[11px] text-slate-300">
                        {updateStatus === 'checking'
                          ? 'Checking for updates...'
                          : 'Your watch is up to date!'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUpdateStatus('checking');
                          setTimeout(() => setUpdateStatus('up_to_date'), 900);
                        }}
                        className="w-full py-2 rounded-xl bg-sky-500 text-slate-950 font-black text-xs cursor-pointer"
                      >
                        Check Updates
                      </button>
                    </div>
                  )}

                  {route.sub === 'about' && (
                    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-3 space-y-1.5 text-[11px]">
                      <div className="font-extrabold text-violet-300 text-xs">Aegis Smart Watch</div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Model</span>
                        <span className="font-bold">Aegis EVA Titanium</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Battery</span>
                        <span className="font-bold text-emerald-300">{db.settings.batteryPct}% Healthy</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sensors</span>
                        <span className="font-bold">Heart, SpO2, Air, Rad</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Waterproof</span>
                        <span className="font-bold">Space Suit Sealed</span>
                      </div>
                    </div>
                  )}
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

              {/* 6. ALL 22 WATCH APPS */}
              {route.view === 'app' && route.appId === 'sleep' && (
                <SleepAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
              )}
              {route.view === 'app' && route.appId === 'nutritions' && (
                <NutritionsAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
              )}
              {route.view === 'app' && route.appId === 'h2o_intake' && (
                <H2oIntakeAppView db={db} inputs={inputs} situation={situation} onUpdateDb={onUpdateDb} onUpdateInputs={onUpdateInputs} />
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

        {/* BOTTOM WATCH STRAP / BAND ("Hand for the watch") */}
        <div className="w-36 h-[34px] rounded-b-3xl bg-gradient-to-t from-slate-800 via-slate-700 to-slate-800 border-x-2 border-b-2 border-slate-600 shadow-inner flex flex-col items-center justify-evenly py-1">
          <div className="w-4 h-2 rounded-sm bg-slate-950/80 border border-slate-600/50" />
          <div className="w-28 h-1 rounded-full bg-slate-900/70" />
          <div className="w-24 h-1 rounded-full bg-slate-900/70" />
        </div>
      </div>
    </div>
  );
};
