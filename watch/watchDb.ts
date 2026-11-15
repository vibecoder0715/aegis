import {
  buildInitialCrew,
  computeBoneMetricsFromSoundWave,
  DEFAULT_SENSOR_INPUTS,
  LiveSensorInputs,
  SituationId,
} from '../src/utils/metricsEngine';
import {
  DEFAULT_EXTRA_ENV_CONTROLS,
  ExtraEnvironmentControls,
  generateDynamicEnvironmentJson,
} from './environmentDetectors';
import {
  BACKEND_WATCH_HEALTH_AND_RISKS_CATALOG,
  evaluateWatchSystemRisks,
  grepNasaCsaBibliography,
  NasaCsaBibEntry,
} from './nasaCsaKnowledge';
import type { WatchAppId } from './WatchAppIcons';
export type { WatchAppId };

export type SystemShortcutId =
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

export type ShortcutActionId = SystemShortcutId | `app:${WatchAppId}`;

export const ALL_SHORTCUT_META: Record<
  SystemShortcutId,
  { shortLabel: string; description: string }
> = {
  flashlight: { shortLabel: 'Torch', description: 'Bright white screen torch' },
  settings: { shortLabel: 'Settings', description: 'Watch settings' },
  find_suit: { shortLabel: 'Ping Suit', description: 'Send suit signal' },
  alarms: { shortLabel: 'Alarms', description: 'Open alarms' },
  dnd: { shortLabel: 'Quiet', description: 'Silence warnings' },
  auto_brightness: { shortLabel: 'Auto Sun', description: 'Auto screen light' },
  mute_audio: { shortLabel: 'Mute', description: 'Mute watch sound' },
  aegis_ai: { shortLabel: 'AegisAI', description: 'Ask AegisAI' },
  spo2_quick: { shortLabel: 'SpO2', description: 'Blood oxygen' },
  env_quick: { shortLabel: 'Air', description: 'Room air check' },
  games_quick: { shortLabel: 'Games', description: 'Mini games' },
};

export type NotificationFilterMode = 'all' | 'health' | 'environment' | 'peer';

export interface WatchSettings {
  brightness: number; // 40..100
  muted: boolean;
  dnd: boolean;
  doNotDisturb: boolean;
  torchOn: boolean;
  flashlightOn: boolean;
  autoBrightness: boolean;
  offlineSimulated: boolean;
  beautifyCamera: boolean;
  smartDetectorMode: boolean;
  batteryPct: number;
  notificationFilter: NotificationFilterMode;
  appsPerPage: number; // 0 = All apps on 1 page, or 6 / 4 per page
}

export interface SleepStageBlock {
  stage: 'Deep' | 'Core' | 'REM' | 'Awake';
  startUtc: string;
  endUtc: string;
  minutes: number;
  color: string;
}

export interface SleepSummary {
  totalHours: number;
  sleepScore: number;
  bedtimeUtc: string;
  wakeUtc: string;
  stages: SleepStageBlock[];
  guidance: string[];
}

export interface MealLogItem {
  id: string;
  name: string;
  calories: number;
  calciumMg: number;
  sodiumMg: number;
  waterMl: number;
  loggedAtUtc: string;
}

export interface WorkoutLogItem {
  id: string;
  type: 'ARED Squats' | 'Indoor Treadmill' | 'Cycle Ergometer';
  durationMin: number;
  calories: number;
  stepsAdded: number;
  completedAtUtc: string;
}

export interface WatchNoteItem {
  id: string;
  title: string;
  body: string;
  updatedAtUtc: string;
}

export interface CalendarEventItem {
  id: string;
  timeUtc: string;
  title: string;
  category: 'EVA' | 'Exercise' | 'Medical' | 'Meal' | 'Rest';
  done: boolean;
}

export interface WatchAlarmItem {
  id: string;
  timeUtc: string;
  label: string;
  enabled: boolean;
}

export interface DailyBuffTask {
  id: string;
  title: string;
  category: 'Bone' | 'Cardio' | 'Sleep' | 'Nutrition' | 'Radiation' | 'Mind';
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  pointsReward: number;
  completed: boolean;
  nasaRef: string;
}

export interface PlanetDecoratorItem {
  id: string;
  name: string;
  costPoints: number;
  svgType:
    | 'solar_tree'
    | 'hydro_dome'
    | 'aurora_ring'
    | 'mini_rover'
    | 'crystal_spire'
    | 'starlight_pond'
    | 'saturn_arch'
    | 'beacon_tower';
  description: string;
}

export interface PlacedPlanetDecoration {
  instanceId: string;
  itemId: string;
  x: number; // 15..85 %
  y: number; // 15..85 %
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestampUtc: string;
  mode: 'ai' | 'gemini' | 'offline-db';
}

export interface PlanetSkinOption {
  id: string;
  name: string;
  costPoints: number;
  baseColor: string;
  continentColor: string;
  oceanColor: string;
  atmosphereColor: string;
  hasRing?: boolean;
  ringColor?: string;
  textureStyle: 'terra' | 'mars' | 'gas' | 'ice' | 'nebula' | 'coral';
}

export const PLANET_SKINS: PlanetSkinOption[] = [
  {
    id: 'terra_prime',
    name: 'Lush Terra',
    costPoints: 0,
    baseColor: '#0EA5E9',
    continentColor: '#10B981',
    oceanColor: '#0369A1',
    atmosphereColor: '#38BDF8',
    textureStyle: 'terra',
  },
  {
    id: 'crimson_mars',
    name: 'Red Mars',
    costPoints: 50,
    baseColor: '#DC2626',
    continentColor: '#F97316',
    oceanColor: '#991B1B',
    atmosphereColor: '#FB923C',
    textureStyle: 'mars',
  },
  {
    id: 'golden_saturn',
    name: 'Gold Ring',
    costPoints: 75,
    baseColor: '#F59E0B',
    continentColor: '#FDE047',
    oceanColor: '#B45309',
    atmosphereColor: '#FBBF24',
    hasRing: true,
    ringColor: '#FDE68A',
    textureStyle: 'gas',
  },
  {
    id: 'crystal_neptune',
    name: 'Ice World',
    costPoints: 90,
    baseColor: '#06B6D4',
    continentColor: '#E0F2FE',
    oceanColor: '#155E75',
    atmosphereColor: '#67E8F9',
    textureStyle: 'ice',
  },
  {
    id: 'amethyst_nebula',
    name: 'Star Purple',
    costPoints: 110,
    baseColor: '#8B5CF6',
    continentColor: '#EC4899',
    oceanColor: '#4C1D95',
    atmosphereColor: '#C084FC',
    hasRing: true,
    ringColor: '#F472B6',
    textureStyle: 'nebula',
  },
  {
    id: 'rose_sakura',
    name: 'Coral World',
    costPoints: 130,
    baseColor: '#F43F5E',
    continentColor: '#2DD4BF',
    oceanColor: '#BE123C',
    atmosphereColor: '#FDA4AF',
    textureStyle: 'coral',
  },
];

export interface VisitorWatchDatabase {
  visitorId: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  settings: WatchSettings;
  extraEnv: ExtraEnvironmentControls;
  xp: number;
  aegisPoints: number;
  dailyTasks: DailyBuffTask[];
  placedPlanetItems: PlacedPlanetDecoration[];
  activePlanetId?: string;
  unlockedPlanets?: string[];
  sleep: SleepSummary;
  meals: MealLogItem[];
  waterIntakeMl: number;
  workouts: WorkoutLogItem[];
  notes: WatchNoteItem[];
  calendar: CalendarEventItem[];
  alarms: WatchAlarmItem[];
  highScores: Record<string, number>;
  aiHistory: AiChatMessage[];
  shortcuts: ShortcutActionId[];
  selectedMood?: string;
}

export const PLANET_DECORATORS: PlanetDecoratorItem[] = [
  {
    id: 'solar_tree',
    name: 'Pine Tree',
    costPoints: 40,
    svgType: 'solar_tree',
    description: 'Green tree for your planet.',
  },
  {
    id: 'hydro_dome',
    name: 'Water Dome',
    costPoints: 65,
    svgType: 'hydro_dome',
    description: 'Clean water dome.',
  },
  {
    id: 'aurora_ring',
    name: 'Glow Ring',
    costPoints: 90,
    svgType: 'aurora_ring',
    description: 'Bright sky ring.',
  },
  {
    id: 'mini_rover',
    name: 'Mini Rover',
    costPoints: 110,
    svgType: 'mini_rover',
    description: 'Cute space buggy.',
  },
  {
    id: 'crystal_spire',
    name: 'Pink Crystal',
    costPoints: 80,
    svgType: 'crystal_spire',
    description: 'Shiny crystal rock.',
  },
  {
    id: 'starlight_pond',
    name: 'Star Pond',
    costPoints: 75,
    svgType: 'starlight_pond',
    description: 'Calm blue pond.',
  },
  {
    id: 'beacon_tower',
    name: 'Light Tower',
    costPoints: 95,
    svgType: 'beacon_tower',
    description: 'Guides friends home.',
  },
];

export const INITIAL_DAILY_BUFF_TASKS: DailyBuffTask[] = [
  {
    id: 'task-1',
    title: 'Drink 500mL water morning',
    category: 'Nutrition',
    difficulty: 'easy',
    xpReward: 30,
    pointsReward: 20,
    completed: true,
    nasaRef: 'Keeps body water full',
  },
  {
    id: 'task-2',
    title: 'Do 45m squat workout',
    category: 'Bone',
    difficulty: 'hard',
    xpReward: 85,
    pointsReward: 55,
    completed: false,
    nasaRef: 'Keeps leg bones strong',
  },
  {
    id: 'task-3',
    title: 'Take Vitamin D3 & Calcium',
    category: 'Nutrition',
    difficulty: 'easy',
    xpReward: 35,
    pointsReward: 25,
    completed: true,
    nasaRef: 'Helps bone health',
  },
  {
    id: 'task-4',
    title: 'Check shin bone sensor',
    category: 'Bone',
    difficulty: 'medium',
    xpReward: 55,
    pointsReward: 35,
    completed: false,
    nasaRef: 'Quick bone wave check',
  },
  {
    id: 'task-5',
    title: 'Walk 30m on treadmill',
    category: 'Cardio',
    difficulty: 'medium',
    xpReward: 60,
    pointsReward: 40,
    completed: false,
    nasaRef: 'Good for your heart',
  },
  {
    id: 'task-6',
    title: 'Breathe slowly for 5m',
    category: 'Cardio',
    difficulty: 'easy',
    xpReward: 30,
    pointsReward: 20,
    completed: false,
    nasaRef: 'Lowers blood pressure',
  },
  {
    id: 'task-7',
    title: 'Use bright light 20m',
    category: 'Sleep',
    difficulty: 'easy',
    xpReward: 35,
    pointsReward: 25,
    completed: false,
    nasaRef: 'Wakes up your body',
  },
  {
    id: 'task-8',
    title: 'Check radiation badge',
    category: 'Radiation',
    difficulty: 'medium',
    xpReward: 50,
    pointsReward: 35,
    completed: false,
    nasaRef: 'Checks space safety',
  },
  {
    id: 'task-9',
    title: 'Keep salt under 2000mg',
    category: 'Nutrition',
    difficulty: 'medium',
    xpReward: 55,
    pointsReward: 35,
    completed: false,
    nasaRef: 'Protects your eyes',
  },
  {
    id: 'task-10',
    title: 'Write a short happy note',
    category: 'Mind',
    difficulty: 'easy',
    xpReward: 30,
    pointsReward: 20,
    completed: false,
    nasaRef: 'Boosts your daily mood',
  },
  {
    id: 'task-11',
    title: 'Check air filter fan',
    category: 'Cardio',
    difficulty: 'medium',
    xpReward: 45,
    pointsReward: 30,
    completed: false,
    nasaRef: 'Keeps room air fresh',
  },
  {
    id: 'task-12',
    title: 'Play a brain mini game',
    category: 'Mind',
    difficulty: 'easy',
    xpReward: 35,
    pointsReward: 25,
    completed: false,
    nasaRef: 'Sharpens focus and speed',
  },
  {
    id: 'task-13',
    title: 'Drink 2,400mL water today',
    category: 'Nutrition',
    difficulty: 'medium',
    xpReward: 60,
    pointsReward: 40,
    completed: false,
    nasaRef: 'Prevents kidney stones',
  },
  {
    id: 'task-14',
    title: 'Dim lights before sleep',
    category: 'Sleep',
    difficulty: 'easy',
    xpReward: 40,
    pointsReward: 25,
    completed: false,
    nasaRef: 'Helps deep night sleep',
  },
];

export function computeLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
  title: string;
} {
  const step = 150;
  const level = Math.max(1, Math.floor(xp / step) + 1);
  const currentLevelXp = xp % step;
  const progressPct = Math.min(100, Math.round((currentLevelXp / step) * 100));
  const titles = [
    'Space Rookie',
    'Star Walker',
    'Health Ranger',
    'Orbit Guardian',
    'Solar Champion',
    'Aegis Hero',
  ];
  const title = titles[Math.min(titles.length - 1, level - 1)];
  return { level, currentLevelXp, nextLevelXp: step, progressPct, title };
}

export function buildSleepSummary(sleepHours: number): SleepSummary {
  const totalMin = Math.round(sleepHours * 60);
  const deepMin = Math.round(totalMin * 0.21);
  const remMin = Math.round(totalMin * 0.24);
  const awakeMin = Math.max(12, Math.round(totalMin * 0.06));
  const coreMin = Math.max(60, totalMin - deepMin - remMin - awakeMin);
  const sleepScore = Math.max(55, Math.min(98, Math.round((sleepHours / 8.0) * 90)));

  return {
    totalHours: Number(sleepHours.toFixed(1)),
    sleepScore,
    bedtimeUtc: '22:00',
    wakeUtc: '05:25',
    stages: [
      { stage: 'Core', startUtc: '22:00', endUtc: '23:15', minutes: Math.round(coreMin * 0.4), color: '#38BDF8' },
      { stage: 'Deep', startUtc: '23:15', endUtc: '00:50', minutes: deepMin, color: '#6366F1' },
      { stage: 'Core', startUtc: '00:50', endUtc: '03:10', minutes: Math.round(coreMin * 0.6), color: '#38BDF8' },
      { stage: 'REM', startUtc: '03:10', endUtc: '05:05', minutes: remMin, color: '#A855F7' },
      { stage: 'Awake', startUtc: '05:05', endUtc: '05:25', minutes: awakeMin, color: '#F59E0B' },
    ],
    guidance: [
      'Dim room lights before bed.',
      'Use bright light each morning.',
      'Keep room cool and quiet.',
    ],
  };
}

const VISITOR_ID_KEY = 'aegis_visitor_watch_id_v1';
const VISITOR_DB_PREFIX = 'aegis_visitor_watch_db_v1_';

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'visitor-server-test';
  }
  let id = window.localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    const rand = Math.random().toString(36).slice(2, 10);
    id = `astronaut-${Date.now().toString(36)}-${rand}`;
    window.localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

export function createInitialVisitorWatchDb(visitorId: string): VisitorWatchDatabase {
  const now = new Date().toISOString();
  return {
    visitorId,
    createdAtUtc: now,
    updatedAtUtc: now,
    settings: {
      brightness: 95,
      muted: false,
      dnd: false,
      doNotDisturb: false,
      torchOn: false,
      flashlightOn: false,
      autoBrightness: true,
      offlineSimulated: false,
      beautifyCamera: true,
      smartDetectorMode: true,
      batteryPct: 86,
      notificationFilter: 'all',
      appsPerPage: 0,
    },
    shortcuts: ['flashlight', 'settings', 'find_suit', 'alarms', 'dnd', 'mute_audio'],
    extraEnv: { ...DEFAULT_EXTRA_ENV_CONTROLS },
    xp: 215,
    aegisPoints: 240,
    dailyTasks: INITIAL_DAILY_BUFF_TASKS,
    placedPlanetItems: [],
    activePlanetId: 'terra_prime',
    unlockedPlanets: ['terra_prime'],
    sleep: buildSleepSummary(DEFAULT_SENSOR_INPUTS.sleepHours),
    meals: [
      {
        id: 'meal-1',
        name: 'Salmon, Broccoli & Egg',
        calories: 640,
        calciumMg: 580,
        sodiumMg: 490,
        waterMl: 450,
        loggedAtUtc: '07:30',
      },
      {
        id: 'meal-2',
        name: 'Chicken Wrap & Fruit',
        calories: 710,
        calciumMg: 420,
        sodiumMg: 540,
        waterMl: 500,
        loggedAtUtc: '12:45',
      },
    ],
    waterIntakeMl: 1650,
    workouts: [
      {
        id: 'wo-1',
        type: 'ARED Squats',
        durationMin: 45,
        calories: 340,
        stepsAdded: 1850,
        completedAtUtc: '10:15',
      },
    ],
    notes: [
      {
        id: 'note-1',
        title: 'Bone & Food Reminder',
        body: 'Eat broccoli and egg today.',
        updatedAtUtc: now,
      },
      {
        id: 'note-2',
        title: 'Morning Walk',
        body: 'Walk 30 minutes after breakfast.',
        updatedAtUtc: now,
      },
    ],
    calendar: [
      { id: 'cal-1', timeUtc: '08:00', title: 'Morning Health Check', category: 'Medical', done: true },
      { id: 'cal-2', timeUtc: '10:00', title: 'Squat & Walk Workout', category: 'Exercise', done: true },
      { id: 'cal-3', timeUtc: '13:00', title: 'Healthy Lunch & Water', category: 'Meal', done: true },
      { id: 'cal-4', timeUtc: '15:30', title: 'Airlock Safety Check', category: 'EVA', done: false },
      { id: 'cal-5', timeUtc: '21:30', title: 'Dim Lights for Sleep', category: 'Rest', done: false },
    ],
    alarms: [
      { id: 'alm-1', timeUtc: '06:00', label: 'Morning Wake Up', enabled: true },
      { id: 'alm-2', timeUtc: '10:00', label: 'Workout Time', enabled: true },
      { id: 'alm-3', timeUtc: '21:30', label: 'Bedtime Reminder', enabled: false },
    ],
    highScores: {
      '2048': 512,
      piano: 28,
      snake: 19,
      asteroid: 340,
      memory: 100,
      reflex: 224,
      tictactoe: 3,
      simon: 7,
      puzzle15: 42,
      brick: 260,
    },
    aiHistory: [],
    selectedMood: 'happy',
  };
}

export function loadVisitorWatchDb(customVisitorId?: string): VisitorWatchDatabase {
  const visitorId = customVisitorId || getOrCreateVisitorId();
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialVisitorWatchDb(visitorId);
  }
  const raw = window.localStorage.getItem(VISITOR_DB_PREFIX + visitorId);
  if (!raw) {
    const fresh = createInitialVisitorWatchDb(visitorId);
    saveVisitorWatchDb(fresh);
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw) as VisitorWatchDatabase;
    return {
      ...createInitialVisitorWatchDb(visitorId),
      ...parsed,
      visitorId,
      settings: {
        ...createInitialVisitorWatchDb(visitorId).settings,
        ...(parsed.settings || {}),
      },
    };
  } catch {
    return createInitialVisitorWatchDb(visitorId);
  }
}

export function saveVisitorWatchDb(db: VisitorWatchDatabase): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const updated: VisitorWatchDatabase = {
    ...db,
    updatedAtUtc: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(VISITOR_DB_PREFIX + db.visitorId, JSON.stringify(updated));
  } catch {
    // Quota fallback
  }
}

export function completeDailyBuffTask(
  db: VisitorWatchDatabase,
  taskId: string
): VisitorWatchDatabase {
  let addedXp = 0;
  let addedPoints = 0;
  const nextTasks = db.dailyTasks.map((t) => {
    if (t.id === taskId && !t.completed) {
      addedXp = t.xpReward;
      addedPoints = t.pointsReward;
      return { ...t, completed: true };
    }
    return t;
  });

  if (addedXp === 0) return db;
  return {
    ...db,
    xp: db.xp + addedXp,
    aegisPoints: db.aegisPoints + addedPoints,
    dailyTasks: nextTasks,
  };
}

export function purchasePlanetDecorator(
  db: VisitorWatchDatabase,
  itemId: string,
  customCoords?: { x: number; y: number }
): { db: VisitorWatchDatabase; ok: boolean; message: string } {
  const item = PLANET_DECORATORS.find((i) => i.id === itemId);
  if (!item) return { db, ok: false, message: 'Item not found.' };
  if (db.aegisPoints < item.costPoints) {
    return {
      db,
      ok: false,
      message: `Need ${item.costPoints} pts! Finish daily tasks first.`,
    };
  }

  const idx = db.placedPlanetItems.length;
  const angle = (idx * 137.5 * Math.PI) / 180;
  const radius = Math.min(32, 12 + idx * 4.5);
  const x = customCoords
    ? Math.max(18, Math.min(82, Math.round(customCoords.x)))
    : Math.round(50 + Math.cos(angle) * radius);
  const y = customCoords
    ? Math.max(18, Math.min(82, Math.round(customCoords.y)))
    : Math.round(50 + Math.sin(angle) * radius);

  const nextDb: VisitorWatchDatabase = {
    ...db,
    aegisPoints: db.aegisPoints - item.costPoints,
    placedPlanetItems: [
      ...db.placedPlanetItems,
      {
        instanceId: `decor-${Date.now().toString(36)}-${idx}`,
        itemId: item.id,
        x,
        y,
      },
    ],
  };

  return {
    db: nextDb,
    ok: true,
    message: `Placed ${item.name} on your planet!`,
  };
}

export function movePlacedPlanetDecoration(
  db: VisitorWatchDatabase,
  instanceId: string,
  x: number,
  y: number
): VisitorWatchDatabase {
  const clampedX = Math.max(18, Math.min(82, Math.round(x)));
  const clampedY = Math.max(18, Math.min(82, Math.round(y)));
  return {
    ...db,
    placedPlanetItems: db.placedPlanetItems.map((it) =>
      it.instanceId === instanceId ? { ...it, x: clampedX, y: clampedY } : it
    ),
  };
}

export function purchaseOrSelectPlanetSkin(
  db: VisitorWatchDatabase,
  skinId: string
): { db: VisitorWatchDatabase; ok: boolean; message: string } {
  const skin = PLANET_SKINS.find((s) => s.id === skinId);
  if (!skin) return { db, ok: false, message: 'Planet not found.' };
  const unlocked = db.unlockedPlanets ?? ['terra_prime'];
  if (unlocked.includes(skinId)) {
    return {
      db: { ...db, activePlanetId: skinId },
      ok: true,
      message: `Switched to ${skin.name}!`,
    };
  }
  if (db.aegisPoints < skin.costPoints) {
    return {
      db,
      ok: false,
      message: `Need ${skin.costPoints} pts for ${skin.name}!`,
    };
  }
  return {
    db: {
      ...db,
      aegisPoints: db.aegisPoints - skin.costPoints,
      activePlanetId: skinId,
      unlockedPlanets: [...unlocked, skinId],
    },
    ok: true,
    message: `Unlocked ${skin.name}!`,
  };
}

/**
 * Greps the visitor's watch database + all 10 crewmates + NASA/CSA knowledge for AI & search.
 */
export function grepVisitorWatchDb(
  db: VisitorWatchDatabase,
  inputs: LiveSensorInputs,
  query: string,
  situation: SituationId = 'nominal'
): {
  visitorId: string;
  matchedNasaCsaRefs: NasaCsaBibEntry[];
  snapshot: Record<string, unknown>;
} {
  const { boneMass, tScore } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);
  const envPacket = generateDynamicEnvironmentJson(
    db.visitorId,
    inputs,
    db.extraEnv,
    db.settings.offlineSimulated
  );
  const matchedNasaCsaRefs = grepNasaCsaBibliography(query, 6);
  const systemRisks = evaluateWatchSystemRisks(inputs);
  const crew10 = buildInitialCrew().map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    location: c.moduleLocation,
    status: c.status,
    summary: c.conditionSummary,
    action: c.actionRequired,
    vitals: c.vitals,
  }));

  const totalMealCalcium = db.meals.reduce((acc, m) => acc + m.calciumMg, 0);
  const totalMealCalories = db.meals.reduce((acc, m) => acc + m.calories, 0);

  return {
    visitorId: db.visitorId,
    matchedNasaCsaRefs,
    snapshot: {
      visitorId: db.visitorId,
      situation,
      vitals: {
        heartRateBpm: inputs.heartRate,
        bloodPressureMmhg: `${inputs.systolicBp}/${inputs.diastolicBp}`,
        spo2Pct: inputs.spo2,
        boneMassGcm2: boneMass,
        boneTScore: tScore,
        tibialSoundSpeedMs: inputs.tibialSoundSpeed,
        radiationRateUsvh: inputs.radiationRate,
        cabinCo2Mmhg: inputs.cabinCo2,
        sweatSodiumMmol: inputs.sweatSodium,
        coreTempC: inputs.coreTemp,
        stepsToday: inputs.steps,
        caloriesBurned: inputs.calories,
        sleepHours: inputs.sleepHours,
        exerciseActive: inputs.exerciseActive,
      },
      crewmates10: crew10,
      nutritionSummary: {
        mealsLogged: db.meals.length,
        meals: db.meals,
        totalMealCalories,
        totalMealCalciumMg: totalMealCalcium,
        waterIntakeMl: db.waterIntakeMl,
      },
      sleepSummary: {
        score: db.sleep.sleepScore,
        totalHours: db.sleep.totalHours,
      },
      aegisBuff: {
        xp: db.xp,
        level: computeLevelFromXp(db.xp).level,
        aegisPoints: db.aegisPoints,
        completedTasks: db.dailyTasks.filter((t) => t.completed).length,
        totalTasks: db.dailyTasks.length,
        activePlanetId: db.activePlanetId ?? 'terra_prime',
      },
      environmentAlerts: envPacket.activeAlertsCount,
      systemRisks,
      backendRiskCatalogCount: BACKEND_WATCH_HEALTH_AND_RISKS_CATALOG.length,
      notesCount: db.notes.length,
      workoutsCount: db.workouts.length,
    },
  };
}

export const createInitialVisitorDb = createInitialVisitorWatchDb;

export function computeNutritionTotals(meals: MealLogItem[]) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      calciumMg: acc.calciumMg + (m.calciumMg || 0),
      sodiumMg: acc.sodiumMg + (m.sodiumMg || 0),
      waterMl: acc.waterMl + (m.waterMl || 0),
    }),
    { calories: 0, calciumMg: 0, sodiumMg: 0, waterMl: 0 }
  );
}

export function computeBodyViability(inputs: LiveSensorInputs, db?: VisitorWatchDatabase) {
  const { boneMass } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);
  const regions = [
    { id: 'head', label: 'Head', score: inputs.cabinCo2 > 4 ? 72 : 95 },
    { id: 'heart', label: 'Heart', score: inputs.systolicBp >= 140 ? 68 : 96 },
    { id: 'lungs', label: 'Lungs', score: inputs.spo2 < 94 ? 65 : 97 },
    { id: 'arms', label: 'Arms', score: inputs.radiationRate > 45 ? 70 : 94 },
    { id: 'core', label: 'Belly', score: (db?.waterIntakeMl ?? 1650) < 1200 ? 78 : 95 },
    { id: 'legs', label: 'Legs', score: boneMass < 1.0 ? 74 : 96 },
  ];
  const overallScore = Math.round(
    regions.reduce((s, r) => s + r.score, 0) / regions.length
  );
  return { overallScore, regions };
}

/**
 * Simple, cheerful local responder when offline (CEFR B2 max, short clear sentences).
 */
export function evaluateOfflineAiQuery(
  query: string,
  db: VisitorWatchDatabase,
  inputs: LiveSensorInputs,
  situation: SituationId = 'nominal'
): string {
  const { boneMass } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);
  const q = query.toLowerCase();
  const totalCa = db.meals.reduce((s, m) => s + m.calciumMg, 0);

  if (q.includes('crew') || q.includes('maya') || q.includes('carlos') || q.includes('team')) {
    return 'All 10 crewmates are tracked. Maya Lin needs calcium food. Kenji Sato needs the air fan on.';
  }
  if (q.includes('bone') || q.includes('calcium') || q.includes('tibia') || q.includes('squat')) {
    return `Bone score is ${boneMass} g/cm². You ate ${totalCa} mg calcium. Do 45m squats today!`;
  }
  if (q.includes('rad') || q.includes('neutron') || q.includes('solar')) {
    return `Radiation is ${inputs.radiationRate} uSv/h. Go to the safe room if it passes 45.`;
  }
  if (q.includes('sleep') || q.includes('tired') || q.includes('rest')) {
    return `You slept ${inputs.sleepHours} hours. Dim lights before bed for deep rest.`;
  }
  if (q.includes('bp') || q.includes('pressure') || q.includes('heart') || q.includes('pulse')) {
    return `Blood pressure is ${inputs.systolicBp}/${inputs.diastolicBp}. Heart rate is ${inputs.heartRate} bpm.`;
  }
  return `Heart ${inputs.heartRate} bpm, Steps ${inputs.steps}, Sleep ${inputs.sleepHours}h, Bone ${boneMass}. All 10 crewmates synced!`;
}

/* ============================================================================
 * INDEXED-DB MEDIA STORE FOR CAMERA PHOTOS, VIDEOS & VOICE RECORDINGS
 * ============================================================================ */

export interface WatchMediaItem {
  id: string;
  visitorId: string;
  kind: 'photo' | 'video' | 'audio';
  title: string;
  createdAtUtc: string;
  dataUrl: string;
  smartTag?: string;
  durationSec?: number;
}

const IDB_NAME = 'aegis_watch_media_idb_v1';
const IDB_STORE = 'visitor_media';
const memoryMediaFallback: WatchMediaItem[] = [];

function openMediaIdb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveVisitorMediaItem(item: WatchMediaItem): Promise<void> {
  const idb = await openMediaIdb();
  if (!idb) {
    memoryMediaFallback.unshift(item);
    return;
  }
  return new Promise((resolve) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function listVisitorMedia(visitorId: string): Promise<WatchMediaItem[]> {
  const idb = await openMediaIdb();
  if (!idb) {
    return memoryMediaFallback.filter((m) => m.visitorId === visitorId);
  }
  return new Promise((resolve) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result || []) as WatchMediaItem[];
      resolve(
        all
          .filter((m) => m.visitorId === visitorId)
          .sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc))
      );
    };
    req.onerror = () => resolve([]);
  });
}

export async function deleteVisitorMediaItem(id: string): Promise<void> {
  const idb = await openMediaIdb();
  if (!idb) {
    const idx = memoryMediaFallback.findIndex((m) => m.id === id);
    if (idx >= 0) memoryMediaFallback.splice(idx, 1);
    return;
  }
  return new Promise((resolve) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
