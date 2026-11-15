import {
  DEFAULT_SENSOR_INPUTS,
  LiveSensorInputs,
  computeBoneMetricsFromSoundWave,
  getAstronautEmotionFromState,
  SituationId,
} from '../src/utils/metricsEngine';
import {
  DEFAULT_EXTRA_ENV_CONTROLS,
  ExtraEnvironmentControls,
  buildEnvironmentDetectors,
} from './environmentDetectors';
import { NASA_CSA_KNOWLEDGE } from './nasaCsaKnowledge';

export type WatchAppId =
  | 'sleep'
  | 'nutritions'
  | 'emotions'
  | 'clock'
  | 'music'
  | 'camera'
  | 'gallery'
  | 'calculator'
  | 'environment'
  | 'health_insights'
  | 'workout'
  | 'aegis_buff'
  | 'notepad'
  | 'recorder'
  | 'aegis_ai'
  | 'calendar'
  | 'pulse_wave'
  | 'spo2'
  | 'radiomeasure'
  | 'viability'
  | 'mini_games';

export type ShortcutActionId =
  | 'flashlight'
  | 'settings'
  | 'find_suit'
  | 'alarms'
  | 'dnd'
  | 'auto_brightness'
  | 'mute_audio'
  | 'aegis_ai'
  | 'spo2_quick'
  | 'env_quick'
  | 'games_quick';

export interface SleepStagesSummary {
  utcDate: string;
  bedtimeUtc: string;
  wakeUtc: string;
  remMinutes: number;
  deepMinutes: number;
  lightMinutes: number;
  awakeMinutes: number;
  score: number;
  segments: Array<{
    stage: 'Awake' | 'REM' | 'Light' | 'Deep';
    startUtc: string;
    endUtc: string;
    minutes: number;
  }>;
  recommendation: string;
}

export interface MealEntry {
  id: string;
  slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories: number;
  proteinG: number;
  calciumMg: number;
  sodiumMg: number;
  potassiumMg: number;
  vitDIu: number;
  loggedAtUtc: string;
}

export interface WatchAlarm {
  id: string;
  timeUtc: string;
  label: string;
  enabled: boolean;
}

export interface WorkoutRecord {
  id: string;
  type: 'ARED Squats' | 'Indoor Treadmill' | 'Cycle Ergometer' | 'EVA Mobility';
  durationMin: number;
  calories: number;
  stepsAdded: number;
  completedAtUtc: string;
}

export interface WatchNote {
  id: string;
  title: string;
  body: string;
  updatedAtUtc: string;
}

export interface MissionCalendarEvent {
  id: string;
  timeUtc: string;
  title: string;
  category: 'Exercise' | 'Science' | 'Medical' | 'EVA';
  done: boolean;
}

export type TaskDifficulty = 'easy' | 'medium' | 'hard';

export interface DailyBuffTask {
  id: string;
  title: string;
  difficulty: TaskDifficulty;
  xpReward: number;
  pointsReward: number;
  completed: boolean;
  nasaRef: string;
}

export interface PlanetDecoratorCatalogItem {
  id: string;
  name: string;
  costPoints: number;
  description: string;
  defaultX: number;
  defaultY: number;
}

export interface PlacedPlanetItem {
  instanceId: string;
  itemId: string;
  x: number; // 0..100 percentage inside planet dome
  y: number; // 0..100 percentage
}

export interface WatchSettings {
  brightness: number; // 30..100
  autoBrightness: boolean;
  doNotDisturb: boolean;
  muted: boolean;
  flashlightOn: boolean;
  batteryPct: number;
  beautifyCamera: boolean;
  smartDetectorMode: boolean;
  offlineSimulated: boolean;
}

export interface WatchMediaItem {
  id: string;
  visitorId: string;
  kind: 'photo' | 'video' | 'audio';
  title: string;
  createdAtUtc: string;
  dataUrl: string; // image/* data URL or audio/video data URL
  smartTag?: string;
  durationSec?: number;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestampUtc: string;
  mode: 'gemini' | 'offline-db';
}

export interface VisitorWatchDatabase {
  visitorId: string;
  schemaVersion: number;
  lastUpdatedUtc: string;
  cumulativeRadiationMSv: number;
  hourlySteps: Array<{ hourUtc: string; steps: number }>;
  sleep: SleepStagesSummary;
  meals: MealEntry[];
  alarms: WatchAlarm[];
  workouts: WorkoutRecord[];
  notes: WatchNote[];
  calendar: MissionCalendarEvent[];
  shortcuts: ShortcutActionId[];
  settings: WatchSettings;
  extraEnv: ExtraEnvironmentControls;
  buffDateUtc: string;
  xp: number;
  level: number;
  aegisPoints: number;
  dailyTasks: DailyBuffTask[];
  unlockedPlanetItems: string[];
  placedPlanetItems: PlacedPlanetItem[];
  highScores: Record<string, number>;
  aiHistory: AiChatMessage[];
}

const VISITOR_ID_KEY = 'aegis_visitor_id_v1';
const memoryFallbackStore = new Map<string, string>();

export const PLANET_DECORATORS: PlanetDecoratorCatalogItem[] = [
  { id: 'bio_dome', name: 'Bio-Dome', costPoints: 30, description: 'Greenhouse glass pod', defaultX: 34, defaultY: 42 },
  { id: 'lunar_tree', name: 'Moon Sprout', costPoints: 20, description: 'Hydroponic blossom tree', defaultX: 64, defaultY: 40 },
  { id: 'mini_rover', name: 'Scout Rover', costPoints: 40, description: 'Cute surface explorer', defaultX: 50, defaultY: 64 },
  { id: 'solar_wing', name: 'Solar Wing', costPoints: 25, description: 'Clean orbit power array', defaultX: 24, defaultY: 58 },
  { id: 'comms_dish', name: 'UWB Beacon', costPoints: 35, description: 'Crew mesh relay tower', defaultX: 74, defaultY: 56 },
  { id: 'astro_buddy', name: 'Astro Buddy', costPoints: 50, description: 'Mini waving crew figure', defaultX: 48, defaultY: 46 },
  { id: 'campfire', name: 'Warm Camp', costPoints: 25, description: 'Cozy morale beacon', defaultX: 60, defaultY: 68 },
  { id: 'observatory', name: 'Star Lens', costPoints: 45, description: 'Deep-space star dome', defaultX: 36, defaultY: 68 },
  { id: 'water_pod', name: 'Shield Tank', costPoints: 35, description: 'Hydrogen radiation shield', defaultX: 70, defaultY: 32 },
  { id: 'star_flag', name: 'Aegis Flag', costPoints: 15, description: 'Orbital checkpoint banner', defaultX: 44, defaultY: 28 },
];

export const ALL_SHORTCUT_META: Record<
  ShortcutActionId,
  { label: string; shortLabel: string; description: string }
> = {
  flashlight: { label: 'Torch Light', shortLabel: 'Torch', description: 'Bright white screen flashlight' },
  settings: { label: 'Watch Settings', shortLabel: 'Settings', description: 'Brightness, audio & offline mode' },
  find_suit: { label: 'Ping Suit / Crew', shortLabel: 'Ping', description: 'Emit 6.5 GHz UWB locate chime' },
  alarms: { label: 'Alarms & Timer', shortLabel: 'Alarms', description: 'Open Clock UTC-0 alarms' },
  dnd: { label: 'Do Not Disturb', shortLabel: 'DND', description: 'Silence non-critical notifications' },
  auto_brightness: { label: 'Auto Brightness', shortLabel: 'Auto', description: 'Adapt watch OLED brightness' },
  mute_audio: { label: 'Mute Watch', shortLabel: 'Mute', description: 'Toggle chime sound effects' },
  aegis_ai: { label: 'AegisAI Check', shortLabel: 'AegisAI', description: 'Open isolated AI triage' },
  spo2_quick: { label: 'Quick SpO2', shortLabel: 'SpO2', description: 'Run optical oxygen scan' },
  env_quick: { label: '12 Env Sensors', shortLabel: 'Env 12', description: 'Inspect cabin & CANS neutron sensor' },
  games_quick: { label: '10 Mini Games', shortLabel: 'Games', description: 'Play cognitive reflex games' },
};

export function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Generates all 14 daily Aegis Buff! tasks for a specific UTC date across Easy, Medium & Hard difficulty.
 */
export function generate14DailyTasks(dateStr = todayUtcDate()): DailyBuffTask[] {
  const templates: Array<Omit<DailyBuffTask, 'id' | 'completed'>> = [
    { title: 'Check Morning UTC-0 Vitals', difficulty: 'easy', xpReward: 20, pointsReward: 15, nasaRef: 'NASA Standard Measures' },
    { title: 'Drink 500mL Isotonic Water', difficulty: 'easy', xpReward: 20, pointsReward: 15, nasaRef: 'Plasma Hydration Rule' },
    { title: 'Run 15s SpO2 Finger Scan', difficulty: 'easy', xpReward: 25, pointsReward: 15, nasaRef: 'Hypobaric Hypoxia Check' },
    { title: 'Wipe & Inspect Tibial Shin Pad', difficulty: 'easy', xpReward: 25, pointsReward: 18, nasaRef: 'Acoustic Sonometry' },
    { title: 'Inspect CSA CANS Neutron Dose', difficulty: 'easy', xpReward: 25, pointsReward: 18, nasaRef: 'CSA CANS (~30% ISS Dose)' },
    { title: 'Log All 3 Balanced Meals', difficulty: 'medium', xpReward: 40, pointsReward: 30, nasaRef: 'Negative Energy Balance' },
    { title: 'Reach 8,000+ Active Steps Equiv.', difficulty: 'medium', xpReward: 45, pointsReward: 32, nasaRef: 'Bone & Muscle Loading' },
    { title: 'Run Pulse Wave Rhythm Sweep', difficulty: 'medium', xpReward: 40, pointsReward: 28, nasaRef: 'Atrial Remodeling Check' },
    { title: 'Achieve >= 7.0h Quality Sleep', difficulty: 'medium', xpReward: 50, pointsReward: 35, nasaRef: 'Circadian UTC-0 Hygiene' },
    { title: 'Play 1 Cognitive Reflex Game', difficulty: 'medium', xpReward: 35, pointsReward: 25, nasaRef: 'HRP Piloting Vigilance' },
    { title: 'Complete 45m ARED Squat Block', difficulty: 'hard', xpReward: 75, pointsReward: 55, nasaRef: 'Prevent 1%/mo Bone Loss' },
    { title: 'Keep Sodium < 2,000mg + Ca > 1,100mg', difficulty: 'hard', xpReward: 70, pointsReward: 50, nasaRef: 'SANS & Calcium Protection' },
    { title: 'Full 6-Region Viability Body Scan', difficulty: 'hard', xpReward: 65, pointsReward: 45, nasaRef: 'NASA CIPHER Multi-System' },
    { title: 'Tend Hydroponic Microgreens / Note', difficulty: 'hard', xpReward: 60, pointsReward: 45, nasaRef: 'Isolation Morale Boost' },
  ];

  return templates.map((t, idx) => ({
    ...t,
    id: `task-${dateStr}-${idx + 1}`,
    completed: false,
  }));
}

export function computeLevelFromXp(xp: number): {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelTargetXp: number;
  progressPct: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  const perLevel = 150;
  const level = Math.floor(safeXp / perLevel) + 1;
  const currentLevelXp = safeXp % perLevel;
  const progressPct = Math.round((currentLevelXp / perLevel) * 100);
  const titles = [
    'Cadet',
    'Orbital Specialist',
    'Lunar Pioneer',
    'Deep-Space Surgeon',
    'Mars Vanguard',
    'Aegis Commander',
  ];
  const title = titles[Math.min(titles.length - 1, level - 1)];
  return {
    level,
    title,
    currentLevelXp,
    nextLevelTargetXp: perLevel,
    progressPct,
  };
}

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'node-test-visitor';
  }
  let existing = window.localStorage.getItem(VISITOR_ID_KEY);
  if (!existing) {
    const rand = Math.random().toString(36).slice(2, 10);
    existing = `crew-${Date.now().toString(36)}-${rand}`;
    window.localStorage.setItem(VISITOR_ID_KEY, existing);
  }
  return existing;
}

export function buildSleepSummary(sleepHours: number): SleepStagesSummary {
  const clamped = Math.max(3.5, Math.min(10.5, sleepHours));
  const totalMin = Math.round(clamped * 60);
  const remMinutes = Math.round(totalMin * 0.23);
  const deepMinutes = Math.round(totalMin * 0.21);
  const awakeMinutes = Math.max(8, Math.round(totalMin * 0.04));
  const lightMinutes = Math.max(40, totalMin - remMinutes - deepMinutes - awakeMinutes);

  const score = Math.max(
    42,
    Math.min(98, Math.round(55 + (clamped / 8) * 32 + (deepMinutes > 85 ? 8 : 0)))
  );

  let recommendation =
    'Sleep stages balanced. Keep berth fan aimed across pillow to prevent stagnant CO2 pockets.';
  if (clamped < 6.3) {
    recommendation =
      'Sleep deficit (<6.3h). Schedule 30m 480nm morning light, switch cabin to 2700K at 20:30 UTC, and log 20m power rest.';
  } else if (deepMinutes < 75) {
    recommendation =
      'Deep sleep low. Check cabin noise dBA and complete ARED squats at least 4h before lights out.';
  }

  return {
    utcDate: todayUtcDate(),
    bedtimeUtc: '22:15',
    wakeUtc: clamped >= 7 ? '05:39' : '04:05',
    remMinutes,
    deepMinutes,
    lightMinutes,
    awakeMinutes,
    score,
    segments: [
      { stage: 'Light', startUtc: '22:15', endUtc: '23:10', minutes: Math.round(lightMinutes * 0.3) },
      { stage: 'Deep', startUtc: '23:10', endUtc: '00:45', minutes: deepMinutes },
      { stage: 'REM', startUtc: '00:45', endUtc: '02:05', minutes: remMinutes },
      { stage: 'Awake', startUtc: '02:05', endUtc: '02:22', minutes: awakeMinutes },
      { stage: 'Light', startUtc: '02:22', endUtc: clamped >= 7 ? '05:39' : '04:05', minutes: Math.round(lightMinutes * 0.7) },
    ],
    recommendation,
  };
}

export function createInitialVisitorDb(visitorId = getOrCreateVisitorId()): VisitorWatchDatabase {
  const dateStr = todayUtcDate();
  return {
    visitorId,
    schemaVersion: 2,
    lastUpdatedUtc: new Date().toISOString(),
    cumulativeRadiationMSv: 28.4,
    hourlySteps: [
      { hourUtc: '06:00', steps: 640 },
      { hourUtc: '08:00', steps: 1420 },
      { hourUtc: '10:00', steps: 1980 },
      { hourUtc: '12:00', steps: 1120 },
      { hourUtc: '14:00', steps: 2150 },
      { hourUtc: '16:00', steps: 1110 },
    ],
    sleep: buildSleepSummary(DEFAULT_SENSOR_INPUTS.sleepHours),
    meals: [
      {
        id: 'meal-1',
        slot: 'Breakfast',
        name: 'Fortified Berry Oats + D3',
        calories: 560,
        proteinG: 24,
        calciumMg: 410,
        sodiumMg: 380,
        potassiumMg: 620,
        vitDIu: 800,
        loggedAtUtc: `${dateStr}T06:45:00Z`,
      },
      {
        id: 'meal-2',
        slot: 'Lunch',
        name: 'Salmon, Kale & Quinoa Pouch',
        calories: 780,
        proteinG: 46,
        calciumMg: 480,
        sodiumMg: 640,
        potassiumMg: 980,
        vitDIu: 900,
        loggedAtUtc: `${dateStr}T12:20:00Z`,
      },
      {
        id: 'meal-3',
        slot: 'Dinner',
        name: 'Herb Tofu & Greens Ration',
        calories: 690,
        proteinG: 34,
        calciumMg: 360,
        sodiumMg: 520,
        potassiumMg: 840,
        vitDIu: 400,
        loggedAtUtc: `${dateStr}T18:30:00Z`,
      },
    ],
    alarms: [
      { id: 'al-1', timeUtc: '06:00', label: 'Wake & Shin Bone Scan', enabled: true },
      { id: 'al-2', timeUtc: '14:30', label: 'ARED Squats Countermeasure', enabled: true },
      { id: 'al-3', timeUtc: '21:30', label: 'Warm Light Sleep Cue', enabled: false },
    ],
    workouts: [
      {
        id: 'wo-1',
        type: 'ARED Squats',
        durationMin: 45,
        calories: 340,
        stepsAdded: 1850,
        completedAtUtc: `${dateStr}T14:30:00Z`,
      },
    ],
    notes: [
      {
        id: 'note-1',
        title: 'Tibial Pad Dry Check',
        body: 'Keep ultrasonic acoustic pad dry before scanning mid-shin bone sound speed.',
        updatedAtUtc: `${dateStr}T07:10:00Z`,
      },
      {
        id: 'note-2',
        title: 'CSA CANS Berth Map',
        body: 'Sleeping next to potable water bags lowers secondary neutron scatter by ~18%.',
        updatedAtUtc: `${dateStr}T09:40:00Z`,
      },
    ],
    calendar: [
      { id: 'cal-1', timeUtc: '07:00', title: 'Standard Measures Vitals', category: 'Medical', done: true },
      { id: 'cal-2', timeUtc: '10:30', title: 'CANS Neutron Dose Check', category: 'Science', done: false },
      { id: 'cal-3', timeUtc: '14:30', title: 'ARED Resistance 45m', category: 'Exercise', done: false },
      { id: 'cal-4', timeUtc: '17:00', title: 'EVA Suit Seal ΔP Check', category: 'EVA', done: false },
    ],
    shortcuts: ['flashlight', 'settings', 'find_suit', 'alarms', 'dnd', 'auto_brightness'],
    settings: {
      brightness: 92,
      autoBrightness: true,
      doNotDisturb: false,
      muted: false,
      flashlightOn: false,
      batteryPct: 86,
      beautifyCamera: true,
      smartDetectorMode: true,
      offlineSimulated: false,
    },
    extraEnv: { ...DEFAULT_EXTRA_ENV_CONTROLS },
    buffDateUtc: dateStr,
    xp: 95,
    level: 1,
    aegisPoints: 65,
    dailyTasks: generate14DailyTasks(dateStr),
    unlockedPlanetItems: ['bio_dome', 'star_flag'],
    placedPlanetItems: [
      { instanceId: 'p-1', itemId: 'bio_dome', x: 36, y: 42 },
      { instanceId: 'p-2', itemId: 'star_flag', x: 60, y: 34 },
    ],
    highScores: { '2048': 512, snake: 8, memory: 12 },
    aiHistory: [
      {
        id: 'ai-welcome',
        role: 'assistant',
        text: 'Hello Explorer! I only read your personal isolated watch database. Ask me about sleep, meals, bone mass, CSA neutrons, or any symptoms!',
        timestampUtc: new Date().toISOString(),
        mode: 'offline-db',
      },
    ],
  };
}

function getStorageKey(visitorId: string): string {
  return `aegis_watch_db_v2::${visitorId}`;
}

export function loadVisitorWatchDb(visitorId = getOrCreateVisitorId()): VisitorWatchDatabase {
  const key = getStorageKey(visitorId);
  let raw: string | null = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    raw = window.localStorage.getItem(key);
  } else {
    raw = memoryFallbackStore.get(key) ?? null;
  }

  if (!raw) {
    const fresh = createInitialVisitorDb(visitorId);
    saveVisitorWatchDb(fresh);
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw) as VisitorWatchDatabase;
    const today = todayUtcDate();
    if (parsed.buffDateUtc !== today || !Array.isArray(parsed.dailyTasks) || parsed.dailyTasks.length !== 14) {
      parsed.buffDateUtc = today;
      parsed.dailyTasks = generate14DailyTasks(today);
    }
    if (!parsed.extraEnv) parsed.extraEnv = { ...DEFAULT_EXTRA_ENV_CONTROLS };
    if (!parsed.shortcuts) parsed.shortcuts = ['flashlight', 'settings', 'find_suit', 'alarms', 'dnd', 'auto_brightness'];
    if (!parsed.highScores) parsed.highScores = {};
    if (parsed.settings) parsed.settings.offlineSimulated = false;
    return parsed;
  } catch {
    const fresh = createInitialVisitorDb(visitorId);
    saveVisitorWatchDb(fresh);
    return fresh;
  }
}

export function saveVisitorWatchDb(db: VisitorWatchDatabase): void {
  const updated: VisitorWatchDatabase = {
    ...db,
    lastUpdatedUtc: new Date().toISOString(),
    level: computeLevelFromXp(db.xp).level,
  };
  const key = getStorageKey(db.visitorId);
  const serialized = JSON.stringify(updated);
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, serialized);
  } else {
    memoryFallbackStore.set(key, serialized);
  }
}

/**
 * Pure state helpers for Aegis Buff! (14 daily tasks, XP leveling, planet shop)
 */
export function completeDailyBuffTask(
  db: VisitorWatchDatabase,
  taskId: string
): VisitorWatchDatabase {
  const target = db.dailyTasks.find((t) => t.id === taskId);
  if (!target || target.completed) return db;
  const nextXp = db.xp + target.xpReward;
  const nextPoints = db.aegisPoints + target.pointsReward;
  const nextLevel = computeLevelFromXp(nextXp).level;
  const nextDb: VisitorWatchDatabase = {
    ...db,
    xp: nextXp,
    level: nextLevel,
    aegisPoints: nextPoints,
    dailyTasks: db.dailyTasks.map((t) =>
      t.id === taskId ? { ...t, completed: true } : t
    ),
  };
  saveVisitorWatchDb(nextDb);
  return nextDb;
}

export function purchasePlanetDecorator(
  db: VisitorWatchDatabase,
  itemId: string
): { db: VisitorWatchDatabase; ok: boolean; message: string } {
  const item = PLANET_DECORATORS.find((p) => p.id === itemId);
  if (!item) return { db, ok: false, message: 'Decorator not found.' };
  if (db.aegisPoints < item.costPoints) {
    return {
      db,
      ok: false,
      message: `Need ${item.costPoints} AegisPoints (have ${db.aegisPoints}).`,
    };
  }

  const nextUnlocked = db.unlockedPlanetItems.includes(itemId)
    ? db.unlockedPlanetItems
    : [...db.unlockedPlanetItems, itemId];

  const offset = ((db.placedPlanetItems.length * 13) % 24) - 12;
  const newPlaced: PlacedPlanetItem = {
    instanceId: `p-${Date.now().toString(36)}-${db.placedPlanetItems.length}`,
    itemId,
    x: Math.max(18, Math.min(82, item.defaultX + offset)),
    y: Math.max(24, Math.min(76, item.defaultY + (offset % 9))),
  };

  const nextDb: VisitorWatchDatabase = {
    ...db,
    aegisPoints: db.aegisPoints - item.costPoints,
    unlockedPlanetItems: nextUnlocked,
    placedPlanetItems: [...db.placedPlanetItems, newPlaced],
  };
  saveVisitorWatchDb(nextDb);
  return { db: nextDb, ok: true, message: `Placed ${item.name} on your planet!` };
}

/**
 * Nutrition & Body Viability summary calculators grounded in NASA HRP & CSA telemetry rules
 */
export function computeNutritionTotals(meals: MealEntry[]) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteinG: acc.proteinG + m.proteinG,
      calciumMg: acc.calciumMg + m.calciumMg,
      sodiumMg: acc.sodiumMg + m.sodiumMg,
      potassiumMg: acc.potassiumMg + m.potassiumMg,
      vitDIu: acc.vitDIu + m.vitDIu,
    }),
    { calories: 0, proteinG: 0, calciumMg: 0, sodiumMg: 0, potassiumMg: 0, vitDIu: 0 }
  );
}

export function getSuggestedNutritionGuidance(
  inputs: LiveSensorInputs,
  meals: MealEntry[]
): string[] {
  const totals = computeNutritionTotals(meals);
  const { boneMass } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);
  const tips: string[] = [];
  if (boneMass < 1.05 || totals.calciumMg < 1100) {
    tips.push('Bone protection low: Add high-Calcium Salmon/Kale + 1,000 IU Vitamin D3/K2.');
  }
  if (totals.sodiumMg > 2100 || inputs.systolicBp >= 135) {
    tips.push('Reduce dietary Na+ (<2,000mg) and boost K+ greens to protect eyes & BP.');
  }
  if (inputs.sweatSodium > 58) {
    tips.push('Elevated sweat sodium loss: Take 450mL isotonic electrolyte ration now.');
  }
  if (inputs.radiationRate > 35) {
    tips.push('Higher radiation flux: Consume antioxidant berries / B-Complex ration.');
  }
  if (totals.calories < 2200) {
    tips.push('Caloric deficit risks muscle atrophy: Add +400 kcal high-protein pack.');
  }
  if (tips.length === 0) {
    tips.push('Nutrition & electrolyte balance optimal for zero-G bone & immunity!');
  }
  return tips;
}

export interface ViabilityRegionReport {
  id: 'head' | 'heart' | 'lungs' | 'tibia' | 'muscle' | 'sweat';
  label: string;
  score: number;
  status: 'nominal' | 'warning' | 'critical';
  metricsText: string;
  actionTip: string;
}

export function computeBodyViability(
  inputs: LiveSensorInputs,
  db: VisitorWatchDatabase
): { overallScore: number; regions: ViabilityRegionReport[] } {
  const { boneMass } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);

  const headScore = Math.max(
    40,
    Math.min(100, Math.round(98 - Math.max(0, 7.0 - inputs.sleepHours) * 8 - Math.max(0, inputs.systolicBp - 130) * 0.7))
  );
  const heartScore = Math.max(
    30,
    Math.min(
      100,
      Math.round(
        98 -
          (inputs.exerciseActive ? 0 : Math.max(0, inputs.systolicBp - 128) * 1.1) -
          (inputs.exerciseActive ? 0 : Math.max(0, inputs.heartRate - 98) * 0.8)
      )
    )
  );
  const lungsScore = Math.max(
    35,
    Math.min(
      100,
      Math.round(99 - Math.max(0, 96.5 - inputs.spo2) * 8 - Math.max(0, inputs.cabinCo2 - 3.2) * 11)
    )
  );
  const tibiaScore = Math.max(
    35,
    Math.min(100, Math.round(62 + (boneMass - 0.85) * 82 - (inputs.shinPatchWet ? 15 : 0)))
  );
  const muscleScore = Math.max(
    45,
    Math.min(100, Math.round(78 + Math.min(20, (inputs.steps / 10000) * 20)))
  );
  const sweatScore = Math.max(
    40,
    Math.min(
      100,
      Math.round(96 - Math.max(0, inputs.sweatSodium - 52) * 1.1 - Math.max(0, inputs.radiationRate - 25) * 0.45)
    )
  );

  const toStatus = (s: number): 'nominal' | 'warning' | 'critical' =>
    s < 65 ? 'critical' : s < 82 ? 'warning' : 'nominal';

  const regions: ViabilityRegionReport[] = [
    {
      id: 'head',
      label: 'Head · SANS & Sleep',
      score: headScore,
      status: toStatus(headScore),
      metricsText: `Sleep ${inputs.sleepHours}h (Score ${db.sleep.score}) · Head fluid nominal`,
      actionTip: headScore < 82 ? 'Use 480nm blue wake light & check thigh cuffs for SANS pressure.' : 'Circadian alignment steady.',
    },
    {
      id: 'heart',
      label: 'Heart · Vascular',
      score: heartScore,
      status: toStatus(heartScore),
      metricsText: `BP ${inputs.systolicBp}/${inputs.diastolicBp} · HR ${inputs.heartRate} bpm`,
      actionTip: heartScore < 82 ? 'Stop heavy deck task, breathe 6/min, hydrate isotonic pouch.' : 'Pulse wave velocity & BP healthy.',
    },
    {
      id: 'lungs',
      label: 'Lungs · O2 & CO2',
      score: lungsScore,
      status: toStatus(lungsScore),
      metricsText: `SpO2 ${inputs.spo2}% · CO2 ${inputs.cabinCo2} mmHg`,
      actionTip: lungsScore < 82 ? 'Switch cabin fan HIGH & verify amine CO2 scrubber.' : 'Gas exchange & O2% optimal.',
    },
    {
      id: 'tibia',
      label: 'Shin · Ultrasonic Bone',
      score: tibiaScore,
      status: toStatus(tibiaScore),
      metricsText: `BMD ${boneMass} g/cm² · ${inputs.tibialSoundSpeed} m/s`,
      actionTip: inputs.shinPatchWet
        ? 'Dry shin pad moisture and press 3s for reliable ultrasonic readout.'
        : tibiaScore < 82
        ? 'Perform 45m ARED squats + 1,200mg Calcium & Vit D3 ration.'
        : 'Bone structural density strong.',
    },
    {
      id: 'muscle',
      label: 'Legs · ARED Muscle',
      score: muscleScore,
      status: toStatus(muscleScore),
      metricsText: `${inputs.steps.toLocaleString()} steps · ${db.workouts.length} ARED logs`,
      actionTip: muscleScore < 82 ? 'Log Treadmill or ARED Squat session inside Workout app.' : 'Antigravity muscle retention high.',
    },
    {
      id: 'sweat',
      label: 'Immune & Radiation',
      score: sweatScore,
      status: toStatus(sweatScore),
      metricsText: `Sweat Na+ ${inputs.sweatSodium} · Rad ${inputs.radiationRate} uSv/h`,
      actionTip: sweatScore < 82 ? 'Enter storm berth if rad >45 or replenish electrolytes.' : 'Marrow dose & immune hydration clear.',
    },
  ];

  const overallScore = Math.round(regions.reduce((s, r) => s + r.score, 0) / regions.length);
  return { overallScore, regions };
}

/**
 * STRICT PER-VISITOR DB GREP ENGINE FOR AegisAI
 * Reads ONLY the current visitor's local watch database & live telemetry snapshot.
 */
export function grepVisitorWatchDb(
  db: VisitorWatchDatabase,
  inputs: LiveSensorInputs,
  query: string,
  situation: SituationId = 'nominal'
): {
  visitorId: string;
  timestampUtc: string;
  matchedSections: string[];
  snapshot: Record<string, unknown>;
  matchedNasaCsaRefs: Array<{ title: string; source: string; action: string }>;
} {
  const q = query.toLowerCase();
  const { boneMass, tScore } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);
  const envReadings = buildEnvironmentDetectors(inputs, db.extraEnv);
  const nutritionTotals = computeNutritionTotals(db.meals);
  const viability = computeBodyViability(inputs, db);
  const levelInfo = computeLevelFromXp(db.xp);
  const emotion = getAstronautEmotionFromState(situation, inputs);

  const matchedSections: string[] = ['vitals', 'viability'];
  if (/sleep|rem|deep|tired|bed|dream|circadian/.test(q)) matchedSections.push('sleep');
  if (/food|meal|eat|calc|sodium|potassium|diet|nutri|vit|calorie|water/.test(q)) matchedSections.push('meals');
  if (/rad|neutron|proton|cans|storm|dose|msv|shield/.test(q)) matchedSections.push('radiation_cans');
  if (/bone|tibia|sos|ared|squat|step|workout|muscle|exercise/.test(q)) matchedSections.push('bone_workout');
  if (/co2|air|o2|temp|heat|baro|osm|noise|water|suit|env/.test(q)) matchedSections.push('environment_12');
  if (/note|calendar|alarm|buff|xp|level|planet|task/.test(q)) matchedSections.push('tasks_notes_calendar');

  const matchedNasaCsaRefs = NASA_CSA_KNOWLEDGE.filter((item) => {
    const hay = `${item.title} ${item.metricKey} ${item.conditionTriggered} ${item.plainSummary}`.toLowerCase();
    return q
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .some((word) => hay.includes(word));
  })
    .slice(0, 4)
    .map((item) => ({
      title: item.title,
      source: item.sourceName,
      action: item.watchAction,
    }));

  const snapshot = {
    visitorId: db.visitorId,
    utcTime: new Date().toISOString(),
    emotionState: emotion,
    vitals: {
      bp: `${inputs.systolicBp}/${inputs.diastolicBp} mmHg`,
      heartRateBpm: inputs.heartRate,
      spo2Pct: inputs.spo2,
      coreTempC: inputs.coreTemp,
      tibialSoundSpeedMs: inputs.tibialSoundSpeed,
      boneMassGcm2: boneMass,
      boneTScore: tScore,
      radiationRateUSvH: inputs.radiationRate,
      cumulativeMissionMSv: db.cumulativeRadiationMSv,
      cabinCo2Mmhg: inputs.cabinCo2,
      sweatSodiumMmol: inputs.sweatSodium,
      stepsToday: inputs.steps,
      caloriesBurned: inputs.calories,
    },
    sleepSummary: db.sleep,
    nutritionTotals,
    mealsLogged: db.meals.map((m) => `${m.slot}: ${m.name} (${m.calories} kcal)`),
    environment12Detectors: envReadings.map((e) => ({
      id: e.id,
      value: `${e.value} ${e.unit}`,
      status: e.status,
    })),
    viabilityOverall: viability.overallScore,
    viabilityRegions: viability.regions.map((r) => `${r.label}: ${r.score}/100 (${r.status})`),
    aegisBuffProgress: {
      level: levelInfo.level,
      title: levelInfo.title,
      xp: db.xp,
      aegisPoints: db.aegisPoints,
      completedTasksToday: db.dailyTasks.filter((t) => t.completed).length,
      totalDailyTasks: db.dailyTasks.length,
    },
    notesCount: db.notes.length,
    recentNotes: db.notes.slice(-3).map((n) => `${n.title}: ${n.body}`),
    upcomingCalendar: db.calendar.filter((c) => !c.done).slice(0, 3),
  };

  return {
    visitorId: db.visitorId,
    timestampUtc: new Date().toISOString(),
    matchedSections,
    snapshot,
    matchedNasaCsaRefs,
  };
}

/**
 * 100% OFFLINE deterministic AegisAI fallback responder — strictly reads visitor DB snapshot!
 */
export function evaluateOfflineAiQuery(
  query: string,
  db: VisitorWatchDatabase,
  inputs: LiveSensorInputs,
  situation: SituationId = 'nominal'
): string {
  const grepped = grepVisitorWatchDb(db, inputs, query, situation);
  const q = query.toLowerCase();
  const { boneMass } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);
  const env = buildEnvironmentDetectors(inputs, db.extraEnv);
  const envAlerts = env.filter((e) => e.status !== 'nominal');
  const totals = computeNutritionTotals(db.meals);
  const viability = computeBodyViability(inputs, db);
  const lines: string[] = [];

  if (inputs.radiationRate > 45 || /rad|neutron|proton|cans|storm/.test(q)) {
    const cans = env.find((e) => e.id === 'csa_cans_neutron');
    lines.push(
      `[DB Grepped · Radiation] Total ${inputs.radiationRate} uSv/h (CSA CANS Neutron ~${cans?.value} uSv/h = ~31% of dose, Mission Cumulative ${db.cumulativeRadiationMSv} mSv).`
    );
    lines.push(
      inputs.radiationRate > 45
        ? 'ACTION: Enter water-wall / polyethylene storm shelter berth immediately & take antioxidant berry ration.'
        : 'Status nominal. Stay near water-shielded bunk walls during sleep.'
    );
  } else if (/sleep|tired|rem|deep|fatigue/.test(q)) {
    lines.push(
      `[DB Grepped · Sleep] You slept ${inputs.sleepHours}h (Score ${db.sleep.score}/100): REM ${db.sleep.remMinutes}m, Deep ${db.sleep.deepMinutes}m, Light ${db.sleep.lightMinutes}m, Awake ${db.sleep.awakeMinutes}m.`
    );
    lines.push(`Advice: ${db.sleep.recommendation}`);
  } else if (/bone|tibia|sos|ared|workout|step/.test(q)) {
    lines.push(
      `[DB Grepped · Bone & Workout] Shin ultrasound ${inputs.tibialSoundSpeed} m/s -> BMD ${boneMass} g/cm². Steps today: ${inputs.steps.toLocaleString()}.`
    );
    lines.push(
      boneMass < 1.02
        ? 'ACTION: Complete 45m ARED squats/heel-raises today + reach >=1,200mg Calcium.'
        : 'Bone density strong against 1%/month microgravity loss.'
    );
  } else if (/food|meal|eat|nutri|calc|sodium|diet/.test(q)) {
    lines.push(
      `[DB Grepped · Nutrition] Logged ${db.meals.length} meals (${totals.calories} kcal, Protein ${totals.proteinG}g, Calcium ${totals.calciumMg}mg, Sodium ${totals.sodiumMg}mg).`
    );
    lines.push(`Guidance: ${getSuggestedNutritionGuidance(inputs, db.meals)[0]}`);
  } else if (/bp|pressure|heart|pulse|hr|faint|dizzy/.test(q)) {
    lines.push(
      `[DB Grepped · Cardio] BP ${inputs.systolicBp}/${inputs.diastolicBp} mmHg, HR ${inputs.heartRate} bpm, SpO2 ${inputs.spo2}%.`
    );
    lines.push(
      inputs.systolicBp >= 140 && !inputs.exerciseActive
        ? 'ACTION: Halt EVA/deck work, rest & do 6/min slow paced breathing.'
        : 'Cardiovascular vitals stable.'
    );
  } else {
    lines.push(
      `[Visitor DB ${db.visitorId.slice(0, 12)}] Viability ${viability.overallScore}/100 · BP ${inputs.systolicBp}/${inputs.diastolicBp} · HR ${inputs.heartRate} bpm · SpO2 ${inputs.spo2}% · Bone ${boneMass} g/cm² · Sleep ${inputs.sleepHours}h · Rad ${inputs.radiationRate} uSv/h.`
    );
    if (envAlerts.length > 0) {
      lines.push(`Env Alerts (${envAlerts.length}): ${envAlerts.map((a) => `${a.shortLabel} ${a.value}${a.unit}`).join(', ')}.`);
    } else {
      lines.push(`All 12 environment sensors nominal. Aegis Buff Level ${db.level} (${db.dailyTasks.filter((t) => t.completed).length}/14 tasks done).`);
    }
  }

  if (grepped.matchedNasaCsaRefs.length > 0) {
    lines.push(`NASA/CSA Ref: ${grepped.matchedNasaCsaRefs[0].title} — ${grepped.matchedNasaCsaRefs[0].action}`);
  }

  return lines.join('\n');
}

// ============================================================================
// PER-VISITOR INDEXEDDB MEDIA STORAGE (Photos, Videos, Voice Recordings)
// ============================================================================
const IDB_NAME = 'aegis_watch_media_v1';
const IDB_STORE = 'media_items';

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        store.createIndex('visitorId', 'visitorId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listVisitorMedia(visitorId: string): Promise<WatchMediaItem[]> {
  try {
    const db = await openMediaDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const index = tx.objectStore(IDB_STORE).index('visitorId');
      const req = index.getAll(visitorId);
      req.onsuccess = () => {
        const items = (req.result || []) as WatchMediaItem[];
        resolve(items.sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveVisitorMediaItem(item: WatchMediaItem): Promise<void> {
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Graceful no-op in non-IDB headless tests
  }
}

export async function deleteVisitorMediaItem(id: string): Promise<void> {
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Graceful no-op
  }
}
