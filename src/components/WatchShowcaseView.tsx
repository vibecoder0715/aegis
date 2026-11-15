import React, { useMemo, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Info,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import watchHeaderImg from '../assets/images/real_watch_display_bg.png';
import { AegisWordmarkSvg } from './AegisBrandLogo';
import { WatchOS } from '../../watch/WatchOS';
import type { VisitorWatchDatabase } from '../../watch/watchDb';
import type { LiveSensorInputs } from '../utils/metricsEngine';
import { playTapClick } from '../../watch/watchAudio';
import {
  buildDetailedTogglers,
  DetailedTogglerItem,
  evaluateWatchAlertFromState,
  matchesSearchTokens,
  UnifiedTogglerState,
  WATCH_QUICK_ACTIONS,
  WatchQuickAction,
} from '../../watch/togglerEngine';

interface WatchShowcaseViewProps {
  db: VisitorWatchDatabase;
  togglerState: UnifiedTogglerState;
  onUpdateDb: (updater: (prev: VisitorWatchDatabase) => VisitorWatchDatabase) => void;
  onApplyQuickAction: (action: WatchQuickAction) => void;
  onToggleDetail: (key: string, nextValue: number | boolean) => void;
  onUpdateSensorInputs: (partial: Partial<LiveSensorInputs>) => void;
  onResetNominal: () => void;
}

const ITEMS_PER_PAGE = 16;

type UnifiedControlItem =
  | { type: 'quick'; action: WatchQuickAction }
  | { type: 'detail'; toggler: DetailedTogglerItem };

export const WatchShowcaseView: React.FC<WatchShowcaseViewProps> = ({
  db,
  togglerState,
  onUpdateDb,
  onApplyQuickAction,
  onToggleDetail,
  onUpdateSensorInputs,
  onResetNominal,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const dynamicAlert = useMemo(() => evaluateWatchAlertFromState(togglerState), [togglerState]);
  const allTogglers = useMemo(() => buildDetailedTogglers(togglerState), [togglerState]);

  const hasSearch = searchQuery.trim().length > 0;

  // Merge Quick Actions + all 539+ Detailed Situations Togglers into one unified searchable list
  const unifiedMatches = useMemo<UnifiedControlItem[]>(() => {
    if (!searchQuery.trim()) return [];

    const matchedQuick: UnifiedControlItem[] = WATCH_QUICK_ACTIONS.filter((a) =>
      matchesSearchTokens(searchQuery, [a.title, a.simpleDescription, a.keywords])
    ).map((action) => ({ type: 'quick', action }));

    const matchedDetails: UnifiedControlItem[] = allTogglers
      .filter((t) =>
        matchesSearchTokens(searchQuery, [
          t.label,
          t.simpleHint,
          t.category,
          t.key,
          t.relatedMetrics,
        ])
      )
      .map((toggler) => ({ type: 'detail', toggler }));

    return [...matchedQuick, ...matchedDetails];
  }, [searchQuery, allTogglers]);

  const totalPages = Math.max(1, Math.ceil(unifiedMatches.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedItems = unifiedMatches.slice(
    safePage * ITEMS_PER_PAGE,
    (safePage + 1) * ITEMS_PER_PAGE
  );

  const renderQuickActionItem = (action: WatchQuickAction) => {
    const active = action.isActive(togglerState);
    const borderCls = active
      ? action.tone === 'danger'
        ? 'border-red-300 bg-red-50/70'
        : action.tone === 'warning'
        ? 'border-amber-300 bg-amber-50/70'
        : 'border-blue-300 bg-blue-50/60'
      : 'border-slate-200 bg-slate-50';

    return (
      <div
        key={action.id}
        className={`rounded-2xl border p-3.5 flex items-start justify-between gap-3 transition-colors ${borderCls}`}
      >
        <div className="min-w-0 space-y-0.5">
          <div className="text-sm font-extrabold text-[#07152E] leading-snug">
            {action.title}
          </div>
          <p className="text-xs font-semibold text-slate-600 leading-snug">
            {action.simpleDescription}
          </p>
        </div>

        <button
          type="button"
          aria-label={action.title}
          onClick={() => {
            playTapClick(db.settings.muted);
            if (active) {
              onResetNominal();
            } else {
              onApplyQuickAction(action);
            }
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition min-h-[36px] shrink-0 ${
            active
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
              : 'bg-[#07152E] hover:bg-slate-800 text-white'
          }`}
        >
          {active ? 'Active · Reset' : 'Trigger'}
        </button>
      </div>
    );
  };

  const renderTogglerRow = (t: DetailedTogglerItem) => {
    const statusBorder =
      t.status === 'critical'
        ? 'border-red-300 bg-red-50/70'
        : t.status === 'warning'
        ? 'border-amber-300 bg-amber-50/70'
        : t.isTriggered
        ? 'border-blue-300 bg-blue-50/60'
        : 'border-slate-200 bg-slate-50';

    const statusTextCls =
      t.status === 'critical'
        ? 'text-red-700'
        : t.status === 'warning'
        ? 'text-amber-700'
        : t.isTriggered
        ? 'text-blue-700'
        : 'text-emerald-700';

    return (
      <div
        key={t.key}
        className={`rounded-2xl border p-3.5 space-y-2 transition-colors ${statusBorder}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="text-sm font-extrabold text-[#07152E] leading-snug">
              {t.label}
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-snug">
              {t.simpleHint}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`font-mono text-xs font-extrabold tabular-nums ${statusTextCls}`}>
              {t.kind === 'boolean'
                ? t.value
                  ? 'ON'
                  : 'OFF'
                : `${t.value} ${t.unit}`}
            </span>
            <button
              type="button"
              aria-label={`Toggle ${t.label}`}
              onClick={() => {
                playTapClick(db.settings.muted);
                if (t.kind === 'boolean') {
                  onToggleDetail(t.key, !t.value);
                } else {
                  onToggleDetail(t.key, t.isTriggered ? t.nominalValue : t.triggerValue);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition min-h-[36px] ${
                t.isTriggered
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                  : 'bg-[#07152E] hover:bg-slate-800 text-white'
              }`}
            >
              {t.isTriggered ? 'Reset Normal' : 'Trigger'}
            </button>
          </div>
        </div>

        {t.kind === 'numeric' && (
          <div className="pt-0.5">
            <input
              type="range"
              aria-label={`Adjust ${t.label}`}
              min={t.min}
              max={t.max}
              step={t.step}
              value={Number(t.value)}
              onChange={(e) => onToggleDetail(t.key, Number(e.target.value))}
              className="w-full accent-[#07152E] cursor-pointer"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-28">
      {/* 1. HEADER SECTION: AEGIS LOGO + WATCH WITH REAL WATCH DISPLAY SCREENSHOT BACKGROUND */}
      <section
        aria-label="Aegis Watch Header"
        className="relative rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm overflow-hidden min-h-[240px] sm:min-h-[270px] flex items-center"
      >
        <img
          src={watchHeaderImg}
          alt="Aegis Watch hardware display"
          referrerPolicy="no-referrer"
          className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 h-[90%] w-auto object-contain pointer-events-none select-none opacity-25 sm:opacity-95"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-white from-55% via-white/90 via-68% to-transparent pointer-events-none"
        />

        <div className="relative z-10 w-full p-6 sm:p-10 sm:max-w-[60%] lg:max-w-[58%]">
          <h1
            aria-label="Aegis Watch"
            className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#07152E] mb-5 sm:mb-6"
          >
            <AegisWordmarkSvg height={44} className="h-8 sm:h-11 w-auto" />
            <span>Watch</span>
          </h1>

          <div className="space-y-3 text-sm sm:text-base font-semibold text-slate-700 leading-relaxed">
            <p>
              Aegis Watch allow astronauts to{' '}
              <strong className="font-extrabold text-slate-950">
                track and manage daily habits
              </strong>
              , and show{' '}
              <strong className="font-extrabold text-slate-950">
                current statuses, including emergencies!
              </strong>
            </p>
            <p>
              In real life, Aegis Watch will collect data from the detectors that built inside
              spacesuits and have a local database inside the watch, without a network!
            </p>
            <p>
              You can see the watch works by manipulating the statuses on the command pane!{' '}
              <strong className="font-extrabold text-slate-950">
                In real life, every statuses will be detected by the detectors.
              </strong>
            </p>
          </div>
        </div>
      </section>

      {/* 2. REAL WATCH DISPLAY + CONTROL PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* REAL WATCH DISPLAY SECTION */}
        <section
          aria-label="Real watch display"
          className={`${
            expanded ? 'lg:col-span-12' : 'lg:col-span-5'
          } rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-5 sm:p-7 flex flex-col justify-between space-y-5 transition-all`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#07152E]">
              Real watch display
            </h2>

            {/* SVG-only Expand / Minimize Button */}
            <button
              type="button"
              onClick={() => {
                playTapClick(db.settings.muted);
                setExpanded((v) => !v);
              }}
              aria-label={expanded ? 'Minimize watch size' : 'Expand watch size'}
              title={expanded ? 'Minimize watch' : 'Expand watch +200%'}
              className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-[#07152E] text-slate-800 hover:text-white border border-slate-200 inline-flex items-center justify-center shrink-0 transition cursor-pointer shadow-xs"
            >
              {expanded ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Interactive Scoped Watch Hardware */}
          <div className="flex justify-center py-2 overflow-visible">
            <WatchOS
              db={db}
              inputs={togglerState.inputs}
              situation={togglerState.situation}
              alertOverride={dynamicAlert}
              onUpdateDb={onUpdateDb}
              onUpdateInputs={onUpdateSensorInputs}
              expanded={expanded}
            />
          </div>

          {/* Bottom Gesture Info Lines */}
          <div className="border-t border-slate-200/80 pt-3.5 space-y-1.5 text-slate-700">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <Info className="w-4 h-4 text-[#07152E] shrink-0" />
              <span className="italic">Swipe from top to bottom to see shortcuts</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <Info className="w-4 h-4 text-[#07152E] shrink-0" />
              <span className="italic">Swipe from right to left to see apps</span>
            </div>
          </div>
        </section>

        {/* CONTROL PANEL SECTION (UNIFIED SEARCH + TOGGLERS, NO SUB-HEADINGS) */}
        <section
          aria-label="Control panel"
          className={`${
            expanded ? 'lg:col-span-12' : 'lg:col-span-7'
          } rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5`}
        >
          {/* Control Panel Header */}
          <div className="border-b border-slate-200 pb-4 space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#07152E]">
              Control panel
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
              Simulate the collected data to the watch.{' '}
              <strong className="font-extrabold text-slate-950">
                In real life, the detectors will collect the data and send to the watch automatically!
              </strong>
            </p>
          </div>

          {/* Unified Search Bar + Results + Reset to normal */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search actions and situations"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search actions (e.g. spike of blood, radiation, sleep, steps, CO2...)"
                className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#07152E]"
              />
            </div>

            {!hasSearch || unifiedMatches.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center text-sm font-bold text-slate-500">
                Search some actions to trigger the watch!
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {pagedItems.map((item) =>
                    item.type === 'quick'
                      ? renderQuickActionItem(item.action)
                      : renderTogglerRow(item.toggler)
                  )}
                </div>

                {unifiedMatches.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      disabled={safePage === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer min-h-[40px]"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <span className="font-mono text-xs font-bold text-slate-600 tabular-nums">
                      Page {safePage + 1} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer min-h-[40px]"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                aria-label="Reset to normal"
                onClick={() => {
                  playTapClick(db.settings.muted);
                  onResetNominal();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to normal</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
