import {
  computeBoneMetricsFromSoundWave,
  DEFAULT_SENSOR_INPUTS,
  generateAllMetrics,
  LiveSensorInputs,
  MetricDomain,
  MetricItem,
  MetricStatus,
  SituationId,
  situationToSensorInputs,
  evaluateWatchAlert,
  WatchAlert,
} from '../src/utils/metricsEngine';
import {
  DEFAULT_EXTRA_ENV_CONTROLS,
  ExtraEnvironmentControls,
} from './environmentDetectors';

export type TogglerOverrides = Record<string, number | boolean>;

const SEARCH_STOPWORDS = new Set([
  'of',
  'the',
  'a',
  'an',
  'for',
  'to',
  'in',
  'on',
  'with',
  'and',
  'or',
  'by',
  'is',
  'at',
]);

/**
 * Stopword-aware multi-token search matcher so natural queries like
 * "spike of blood", "walking steps", or "sleep time" match regardless of word order.
 */
export function matchesSearchTokens(query: string, fields: string[]): boolean {
  const rawTokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (rawTokens.length === 0) return true;

  const meaningful = rawTokens.filter((tok) => !SEARCH_STOPWORDS.has(tok));
  const tokens = meaningful.length > 0 ? meaningful : rawTokens;
  const haystack = fields.join(' ').toLowerCase();
  return tokens.every((tok) => haystack.includes(tok));
}

export interface UnifiedTogglerState {
  situation: SituationId;
  inputs: LiveSensorInputs;
  extraEnv: ExtraEnvironmentControls;
  watchBatteryPct: number;
  overrides: TogglerOverrides;
}

export function createInitialTogglerState(): UnifiedTogglerState {
  return {
    situation: 'nominal',
    inputs: { ...DEFAULT_SENSOR_INPUTS },
    extraEnv: { ...DEFAULT_EXTRA_ENV_CONTROLS },
    watchBatteryPct: 86,
    overrides: {},
  };
}

export interface WatchQuickAction {
  id: string;
  title: string;
  simpleDescription: string;
  keywords: string;
  tone: 'danger' | 'warning' | 'info' | 'healthy';
  isActive: (state: UnifiedTogglerState) => boolean;
  apply: (state: UnifiedTogglerState) => UnifiedTogglerState;
}

export interface DetailedTogglerItem {
  key: string;
  label: string;
  simpleHint: string;
  category: string;
  domain: MetricDomain | 'watch';
  kind: 'numeric' | 'boolean';
  value: number | boolean;
  unit: string;
  min: number;
  max: number;
  step: number;
  minSafe: number;
  maxSafe: number;
  nominalValue: number | boolean;
  triggerValue: number | boolean;
  status: MetricStatus;
  isTriggered: boolean;
  relatedMetrics: string;
}

export const WATCH_QUICK_ACTIONS: WatchQuickAction[] = [
  {
    id: 'qa_bp_spike',
    title: 'Blood Pressure Spike',
    simpleDescription: 'Raises blood pressure and heart rate to trigger a heart warning on the watch.',
    keywords: 'spike blood pressure bp hypertension heart stroke pulse danger red 168 106',
    tone: 'danger',
    isActive: (s) => s.situation === 'bp_spike' || (!s.inputs.exerciseActive && s.inputs.systolicBp >= 140),
    apply: (s) => ({
      ...s,
      situation: 'bp_spike',
      inputs: {
        ...s.inputs,
        exerciseActive: false,
        systolicBp: 168,
        diastolicBp: 106,
        heartRate: 134,
      },
      overrides: {
        ...s.overrides,
        blood_pressure_systolic: 168,
        blood_pressure_diastolic: 106,
        heart_rate: 134,
        exercise_active: false,
      },
    }),
  },
  {
    id: 'qa_solar_storm',
    title: 'Solar Radiation Storm',
    simpleDescription: 'Spikes space radiation so the watch warns the astronaut to take shelter.',
    keywords: 'radiation solar storm flare neutron csa cans cancer shield berth danger',
    tone: 'danger',
    isActive: (s) => s.situation === 'high_radiation' || s.inputs.radiationRate > 45,
    apply: (s) => ({
      ...s,
      situation: 'high_radiation',
      inputs: { ...s.inputs, radiationRate: 142 },
      overrides: { ...s.overrides, radiation_dose_rate: 142 },
    }),
  },
  {
    id: 'qa_bone_loss',
    title: 'Bone Density Drop',
    simpleDescription: 'Simulates weaker shin bone density and prompts workout and calcium advice.',
    keywords: 'bone density osteopenia calcium tibia shin sound speed workout squat weak',
    tone: 'warning',
    isActive: (s) =>
      s.situation === 'bone_loss_scan' ||
      computeBoneMetricsFromSoundWave(s.inputs.tibialSoundSpeed).boneMass < 1.02,
    apply: (s) => ({
      ...s,
      situation: 'bone_loss_scan',
      inputs: { ...s.inputs, tibialSoundSpeed: 3640 },
      overrides: { ...s.overrides, ultrasonic_sos: 3640 },
    }),
  },
  {
    id: 'qa_high_co2',
    title: 'High Carbon Dioxide (CO2)',
    simpleDescription: 'Simulates stale air inside the helmet and prompts turning up the fan.',
    keywords: 'co2 carbon dioxide air breathing headache scrubber fan atmosphere helmet',
    tone: 'warning',
    isActive: (s) => s.situation === 'high_co2' || s.inputs.cabinCo2 > 4.0,
    apply: (s) => ({
      ...s,
      situation: 'high_co2',
      inputs: { ...s.inputs, cabinCo2: 6.4 },
      overrides: { ...s.overrides, cabin_co2_mmhg: 6.4 },
    }),
  },
  {
    id: 'qa_low_spo2',
    title: 'Low Blood Oxygen',
    simpleDescription: 'Drops blood oxygen to 91% so the watch warns to check oxygen supply.',
    keywords: 'spo2 oxygen hypoxia breath lungs low air suit pressure',
    tone: 'danger',
    isActive: (s) => s.inputs.spo2 < 94,
    apply: (s) => ({
      ...s,
      inputs: { ...s.inputs, spo2: 91.2 },
      overrides: { ...s.overrides, spo2_pct: 91.2 },
    }),
  },
  {
    id: 'qa_peer_maya',
    title: 'Crewmate Maya Fainting',
    simpleDescription: 'Sends an alert that teammate Maya fainted nearby and needs oxygen.',
    keywords: 'maya peer crew faint uwb emergency airlock help teammate sos',
    tone: 'danger',
    isActive: (s) => s.situation === 'peer_faint',
    apply: (s) => ({
      ...s,
      situation: 'peer_faint',
      overrides: { ...s.overrides, peer_faint_uwb: true, peer_leak_uwb: false },
    }),
  },
  {
    id: 'qa_peer_carlos',
    title: 'Crewmate Carlos Suit Leak',
    simpleDescription: 'Sends an alert that teammate Carlos has a spacesuit air leak nearby.',
    keywords: 'carlos peer crew leak suit eva hatch uwb emergency help teammate sos',
    tone: 'danger',
    isActive: (s) => s.situation === 'peer_radiation',
    apply: (s) => ({
      ...s,
      situation: 'peer_radiation',
      overrides: { ...s.overrides, peer_leak_uwb: true, peer_faint_uwb: false },
    }),
  },
  {
    id: 'qa_workout_active',
    title: 'Workout Mode',
    simpleDescription: 'Tells the watch you are exercising so high heart rate does not trigger an alarm.',
    keywords: 'workout exercise ared gym heart rate pulse steps running fitness',
    tone: 'info',
    isActive: (s) => s.inputs.exerciseActive || s.situation === 'exercise_mode',
    apply: (s) => ({
      ...s,
      situation: 'exercise_mode',
      inputs: {
        ...s.inputs,
        exerciseActive: true,
        systolicBp: 146,
        diastolicBp: 86,
        heartRate: 148,
      },
      overrides: {
        ...s.overrides,
        exercise_active: true,
        systolicBp: 146,
        heart_rate: 148,
      },
    }),
  },
  {
    id: 'qa_wet_shin',
    title: 'Wet Shin Sensor',
    simpleDescription: 'Simulates sweat under the shin sensor so the watch asks you to wipe it dry.',
    keywords: 'wet shin sensor pad sweat loose ultrasound fault maintenance',
    tone: 'warning',
    isActive: (s) => s.inputs.shinPatchWet || s.situation === 'sensor_fault',
    apply: (s) => ({
      ...s,
      situation: 'sensor_fault',
      inputs: { ...s.inputs, shinPatchWet: true },
      overrides: { ...s.overrides, shin_patch_wet: true },
    }),
  },
  {
    id: 'qa_add_steps',
    title: 'Add +500 Walking Steps',
    simpleDescription: 'Adds 500 steps and 28 calories to the watch activity rings.',
    keywords: 'steps walk walking treadmill movement calories goal ring exercise activity',
    tone: 'healthy',
    isActive: () => false,
    apply: (s) => {
      const nextSteps = s.inputs.steps + 500;
      const nextCal = s.inputs.calories + 28;
      return {
        ...s,
        inputs: { ...s.inputs, steps: nextSteps, calories: nextCal },
        overrides: {
          ...s.overrides,
          daily_steps_equiv: nextSteps,
          active_calories_kcal: nextCal,
        },
      };
    },
  },
  {
    id: 'qa_add_sleep',
    title: 'Add +0.5 Hours Sleep Time',
    simpleDescription: 'Adds 30 minutes of sleep time to the watch sleep tracker.',
    keywords: 'sleep time rest fatigue rem deep circadian night nap hours',
    tone: 'healthy',
    isActive: () => false,
    apply: (s) => {
      const nextSleep = Number(Math.min(10.5, s.inputs.sleepHours + 0.5).toFixed(1));
      return {
        ...s,
        inputs: { ...s.inputs, sleepHours: nextSleep },
        overrides: { ...s.overrides, sleep_duration_hr: nextSleep },
      };
    },
  },
  {
    id: 'qa_dehydration_sweat',
    title: 'Dehydration & High Sweat Salt',
    simpleDescription: 'Raises body temperature and sweat salt so the watch reminds you to drink water.',
    keywords: 'sweat dehydration water sodium salt fever core temp temperature drink hydration',
    tone: 'warning',
    isActive: (s) => s.inputs.sweatSodium > 68 || s.inputs.coreTemp > 37.7,
    apply: (s) => ({
      ...s,
      inputs: { ...s.inputs, sweatSodium: 78, coreTemp: 37.9 },
      overrides: { ...s.overrides, sweat_sodium: 78, core_temperature: 37.9 },
    }),
  },
  {
    id: 'qa_suit_depress',
    title: 'Spacesuit Pressure Drop',
    simpleDescription: 'Lowers suit air pressure to test an emergency airlock warning.',
    keywords: 'suit pressure leak eva kpa barometer airlock drop vacuum',
    tone: 'danger',
    isActive: (s) => s.extraEnv.suitDeltaPKpa < 26,
    apply: (s) => ({
      ...s,
      extraEnv: { ...s.extraEnv, suitDeltaPKpa: 24.4 },
      overrides: { ...s.overrides, suit_delta_p_kpa: 24.4 },
    }),
  },
];

function computeMetricStatus(val: number, minSafe: number, maxSafe: number): MetricStatus {
  if (val > maxSafe * 1.15 || val < minSafe * 0.85) return 'critical';
  if (val > maxSafe || val < minSafe) return 'warning';
  return 'nominal';
}

function getBoundsForMetric(m: MetricItem): {
  min: number;
  max: number;
  step: number;
  triggerValue: number;
} {
  const span = Math.max(1, Math.abs(m.maxSafe - m.minSafe));
  const min = Number((m.minSafe - span * 0.6).toFixed(2));
  const max = Number((m.maxSafe + span * 0.6).toFixed(2));
  const step = m.unit === 'steps' || m.unit === 'kcal' ? 25 : span >= 50 ? 1 : span >= 10 ? 0.5 : 0.1;

  // Pick a clear, intuitive alert trigger value outside safe corridor
  let triggerValue = Number((m.maxSafe + Math.max(step, span * 0.28)).toFixed(2));
  if (
    m.key.includes('spo2') ||
    m.key.includes('bone_mass') ||
    m.key.includes('ultrasonic_sos') ||
    m.key.includes('sleep_duration') ||
    m.key.includes('hrv_rmssd') ||
    m.key.includes('mood_stability') ||
    m.key.includes('fracture_resilience') ||
    m.key.includes('total_body_water') ||
    m.key.includes('baroreflex') ||
    m.key.includes('lean_mass')
  ) {
    triggerValue = Number((m.minSafe - Math.max(step, span * 0.25)).toFixed(2));
  }
  return { min, max, step, triggerValue };
}

function friendlyHintForCategory(
  key: string,
  category: string,
  label: string
): string {
  if (key.startsWith('daily_steps_equiv')) {
    return 'Daily walking steps counted on the watch.';
  }
  if (key.startsWith('sleep_duration_hr')) {
    return 'Hours of sleep time tracked overnight.';
  }
  if (key.startsWith('blood_pressure_systolic') || key.startsWith('blood_pressure_diastolic')) {
    return 'Blood pressure reading from the wrist cuff.';
  }
  if (key.startsWith('heart_rate')) {
    return 'Heart beats per minute measured on the wrist.';
  }
  if (key.startsWith('spo2_pct')) {
    return 'Blood oxygen level in the body.';
  }
  if (key.startsWith('sans_intraocular')) {
    return 'Eye pressure changes in zero gravity.';
  }
  return `Measures ${label.toLowerCase()} (${category.toLowerCase()}).`;
}

/**
 * Generates ALL 539+ live interactive togglers (all 525 aerospace metrics + 14 core Watch & Suit status controls).
 */
export function buildDetailedTogglers(state: UnifiedTogglerState): DetailedTogglerItem[] {
  const metrics = generateAllMetrics(state.inputs);

  // Override values cleanly onto every generated metric when state.overrides has an explicit entry
  const hydratedMetrics = metrics.map((m): DetailedTogglerItem => {
    const rawOverride = state.overrides[m.key];
    const value = typeof rawOverride === 'number' ? rawOverride : m.value;
    const { min, max, step, triggerValue } = getBoundsForMetric(m);

    let status: MetricStatus = 'nominal';
    if (
      state.inputs.exerciseActive &&
      (m.key.startsWith('heart_rate') || m.key.includes('blood_pressure'))
    ) {
      status = 'nominal';
    } else {
      status = computeMetricStatus(value, m.minSafe, m.maxSafe);
    }

    const isTriggered =
      status !== 'nominal' ||
      (typeof rawOverride === 'number' && Math.abs(rawOverride - m.value) > 0.001);

    return {
      key: m.key,
      label: m.label,
      simpleHint: friendlyHintForCategory(m.key, m.category, m.label),
      category: m.category,
      domain: m.domain,
      kind: 'numeric',
      value,
      unit: m.unit,
      min: Math.min(min, value),
      max: Math.max(max, value),
      step,
      minSafe: m.minSafe,
      maxSafe: m.maxSafe,
      nominalValue: m.value,
      triggerValue,
      status,
      isTriggered,
      relatedMetrics: `${m.key} ${m.detectorId} ${m.category} ${m.label}`,
    };
  });

  // 14 Explicit Watch-State, Habit & Habitat Controls with clean, simple descriptions
  const extraWatchTogglers: DetailedTogglerItem[] = [
    {
      key: 'exercise_active',
      label: 'Workout Mode',
      simpleHint: 'Working out now, so a high heart rate will not trigger a false alarm.',
      category: 'Watch Mode',
      domain: 'watch',
      kind: 'boolean',
      value: state.inputs.exerciseActive,
      unit: 'mode',
      min: 0,
      max: 1,
      step: 1,
      minSafe: 0,
      maxSafe: 1,
      nominalValue: false,
      triggerValue: true,
      status: 'nominal',
      isTriggered: state.inputs.exerciseActive,
      relatedMetrics: 'exerciseActive ARED workout gym',
    },
    {
      key: 'shin_patch_wet',
      label: 'Wet Shin Sensor',
      simpleHint: 'Sweat under the shin bone sensor pad that needs wiping.',
      category: 'Watch Mode',
      domain: 'watch',
      kind: 'boolean',
      value: state.inputs.shinPatchWet,
      unit: 'fault',
      min: 0,
      max: 1,
      step: 1,
      minSafe: 0,
      maxSafe: 0,
      nominalValue: false,
      triggerValue: true,
      status: state.inputs.shinPatchWet ? 'warning' : 'nominal',
      isTriggered: state.inputs.shinPatchWet,
      relatedMetrics: 'shinPatchWet moisture sweat pad',
    },
    {
      key: 'peer_faint_uwb',
      label: 'Teammate Fainting Alert (Maya)',
      simpleHint: 'Maya fainted nearby and needs oxygen.',
      category: 'Watch Mode',
      domain: 'watch',
      kind: 'boolean',
      value: state.situation === 'peer_faint',
      unit: 'UWB',
      min: 0,
      max: 1,
      step: 1,
      minSafe: 0,
      maxSafe: 0,
      nominalValue: false,
      triggerValue: true,
      status: state.situation === 'peer_faint' ? 'critical' : 'nominal',
      isTriggered: state.situation === 'peer_faint',
      relatedMetrics: 'UWB Maya Lin faint sos peer',
    },
    {
      key: 'peer_leak_uwb',
      label: 'Teammate Suit Leak (Carlos)',
      simpleHint: 'Carlos has a spacesuit air leak nearby and needs help.',
      category: 'Watch Mode',
      domain: 'watch',
      kind: 'boolean',
      value: state.situation === 'peer_radiation',
      unit: 'UWB',
      min: 0,
      max: 1,
      step: 1,
      minSafe: 0,
      maxSafe: 0,
      nominalValue: false,
      triggerValue: true,
      status: state.situation === 'peer_radiation' ? 'critical' : 'nominal',
      isTriggered: state.situation === 'peer_radiation',
      relatedMetrics: 'UWB Carlos Vega suit leak sos peer',
    },
    {
      key: 'watch_battery_pct',
      label: 'Watch Battery',
      simpleHint: 'Battery charge remaining on the watch.',
      category: 'Watch Mode',
      domain: 'watch',
      kind: 'numeric',
      value: state.watchBatteryPct,
      unit: '%',
      min: 5,
      max: 100,
      step: 1,
      minSafe: 20,
      maxSafe: 100,
      nominalValue: 86,
      triggerValue: 12,
      status: computeMetricStatus(state.watchBatteryPct, 20, 100),
      isTriggered: state.watchBatteryPct < 20,
      relatedMetrics: 'batteryPct power charge',
    },
    {
      key: 'barometer_kpa',
      label: 'Cabin Air Pressure',
      simpleHint: 'Air pressure inside the space station cabin.',
      category: 'Environment 12',
      domain: 'environment',
      kind: 'numeric',
      value: state.extraEnv.barometerKpa,
      unit: 'kPa',
      min: 88,
      max: 110,
      step: 0.2,
      minSafe: 96,
      maxSafe: 104,
      nominalValue: DEFAULT_EXTRA_ENV_CONTROLS.barometerKpa,
      triggerValue: 91.5,
      status: computeMetricStatus(state.extraEnv.barometerKpa, 96, 104),
      isTriggered: state.extraEnv.barometerKpa < 96 || state.extraEnv.barometerKpa > 104,
      relatedMetrics: 'barometer hPa pressure',
    },
    {
      key: 'cabin_o2_pct',
      label: 'Cabin Oxygen Level',
      simpleHint: 'Percentage of breathable oxygen in the room.',
      category: 'Environment 12',
      domain: 'environment',
      kind: 'numeric',
      value: state.extraEnv.cabinO2Pct,
      unit: '%',
      min: 16,
      max: 26,
      step: 0.1,
      minSafe: 19.5,
      maxSafe: 23.5,
      nominalValue: DEFAULT_EXTRA_ENV_CONTROLS.cabinO2Pct,
      triggerValue: 18.2,
      status: computeMetricStatus(state.extraEnv.cabinO2Pct, 19.5, 23.5),
      isTriggered: state.extraEnv.cabinO2Pct < 19.5 || state.extraEnv.cabinO2Pct > 23.5,
      relatedMetrics: 'cabin_o2 oxygen',
    },
    {
      key: 'suit_delta_p_kpa',
      label: 'Spacesuit Air Pressure',
      simpleHint: 'Air pressure keeping the spacesuit inflated.',
      category: 'Environment 12',
      domain: 'environment',
      kind: 'numeric',
      value: state.extraEnv.suitDeltaPKpa,
      unit: 'kPa',
      min: 22,
      max: 34,
      step: 0.2,
      minSafe: 26,
      maxSafe: 32,
      nominalValue: DEFAULT_EXTRA_ENV_CONTROLS.suitDeltaPKpa,
      triggerValue: 24.4,
      status: computeMetricStatus(state.extraEnv.suitDeltaPKpa, 26, 32),
      isTriggered: state.extraEnv.suitDeltaPKpa < 26 || state.extraEnv.suitDeltaPKpa > 32,
      relatedMetrics: 'suit_delta_p EVA leak',
    },
    {
      key: 'heatwave_temp_c',
      label: 'Cabin Temperature',
      simpleHint: 'Room and suit cooling temperature.',
      category: 'Environment 12',
      domain: 'environment',
      kind: 'numeric',
      value: state.extraEnv.heatwaveIndexC,
      unit: '°C',
      min: 14,
      max: 36,
      step: 0.2,
      minSafe: 18,
      maxSafe: 27,
      nominalValue: DEFAULT_EXTRA_ENV_CONTROLS.heatwaveIndexC,
      triggerValue: 31.4,
      status: computeMetricStatus(state.extraEnv.heatwaveIndexC, 18, 27),
      isTriggered: state.extraEnv.heatwaveIndexC < 18 || state.extraEnv.heatwaveIndexC > 27,
      relatedMetrics: 'heatwaves cabin temperature',
    },
    {
      key: 'osmometer_mosm',
      label: 'Sweat Salt Concentration',
      simpleHint: 'Shows if the astronaut is getting dehydrated.',
      category: 'Environment 12',
      domain: 'environment',
      kind: 'numeric',
      value: state.extraEnv.osmometerMosm,
      unit: 'mOsm/kg',
      min: 255,
      max: 335,
      step: 1,
      minSafe: 275,
      maxSafe: 298,
      nominalValue: DEFAULT_EXTRA_ENV_CONTROLS.osmometerMosm,
      triggerValue: 314,
      status: computeMetricStatus(state.extraEnv.osmometerMosm, 275, 298),
      isTriggered: state.extraEnv.osmometerMosm < 275 || state.extraEnv.osmometerMosm > 298,
      relatedMetrics: 'osmometer hydration salt',
    },
    {
      key: 'air_quality_aqi',
      label: 'Cabin Dust & Air Quality',
      simpleHint: 'Checks for floating dust particles in the air.',
      category: 'Environment 12',
      domain: 'environment',
      kind: 'numeric',
      value: state.extraEnv.airQualityAqi,
      unit: 'AQI',
      min: 0,
      max: 160,
      step: 2,
      minSafe: 0,
      maxSafe: 45,
      nominalValue: DEFAULT_EXTRA_ENV_CONTROLS.airQualityAqi,
      triggerValue: 105,
      status: computeMetricStatus(state.extraEnv.airQualityAqi, 0, 45),
      isTriggered: state.extraEnv.airQualityAqi > 45,
      relatedMetrics: 'air_quality dust PM2.5',
    },
    {
      key: 'water_purity_ppm',
      label: 'Drinking Water Cleanliness',
      simpleHint: 'Checks if recycled drinking water is clean and safe.',
      category: 'Environment 12',
      domain: 'environment',
      kind: 'numeric',
      value: state.extraEnv.waterPurityPpm,
      unit: 'ppm',
      min: 10,
      max: 250,
      step: 2,
      minSafe: 0,
      maxSafe: 120,
      nominalValue: DEFAULT_EXTRA_ENV_CONTROLS.waterPurityPpm,
      triggerValue: 175,
      status: computeMetricStatus(state.extraEnv.waterPurityPpm, 0, 120),
      isTriggered: state.extraEnv.waterPurityPpm > 120,
      relatedMetrics: 'water_purity drinking loop',
    },
    {
      key: 'acoustic_db',
      label: 'Cabin Noise Level',
      simpleHint: 'Measures how loud fans and equipment are near sleeping quarters.',
      category: 'Environment 12',
      domain: 'environment',
      kind: 'numeric',
      value: state.extraEnv.acousticDb,
      unit: 'dBA',
      min: 30,
      max: 95,
      step: 1,
      minSafe: 30,
      maxSafe: 68,
      nominalValue: DEFAULT_EXTRA_ENV_CONTROLS.acousticDb,
      triggerValue: 82,
      status: computeMetricStatus(state.extraEnv.acousticDb, 30, 68),
      isTriggered: state.extraEnv.acousticDb > 68,
      relatedMetrics: 'acoustic_noise sleep decibel',
    },
    {
      key: 'microgravity_g',
      label: 'Gravity Level',
      simpleHint: 'Current gravity pull (0g space, 0.16g Moon, or 0.38g Mars).',
      category: 'Environment 12',
      domain: 'environment',
      kind: 'numeric',
      value: state.extraEnv.microgravityG,
      unit: 'g',
      min: 0,
      max: 1.0,
      step: 0.01,
      minSafe: 0,
      maxSafe: 1.0,
      nominalValue: DEFAULT_EXTRA_ENV_CONTROLS.microgravityG,
      triggerValue: 0.38,
      status: 'nominal',
      isTriggered: Math.abs(state.extraEnv.microgravityG - DEFAULT_EXTRA_ENV_CONTROLS.microgravityG) > 0.05,
      relatedMetrics: 'microgravity_accel gravity',
    },
  ];

  // Put most-recognizable primary watch & habit togglers right at the top for intuitive browsing!
  return [...extraWatchTogglers, ...hydratedMetrics];
}

/**
 * Pure updater: flips or adjusts ANY of the 539+ togglers and synchronizes core suit telemetry in real time.
 */
export function applyDetailedTogglerChange(
  state: UnifiedTogglerState,
  key: string,
  nextVal: number | boolean
): UnifiedTogglerState {
  const nextInputs = { ...state.inputs };
  const nextExtra = { ...state.extraEnv };
  let nextSituation: SituationId = state.situation;
  let nextBattery = state.watchBatteryPct;
  const nextOverrides: TogglerOverrides = { ...state.overrides, [key]: nextVal };

  if (key === 'exercise_active') {
    const active = Boolean(nextVal);
    nextInputs.exerciseActive = active;
    if (active) {
      nextSituation = 'exercise_mode';
      if (nextInputs.heartRate < 115) nextInputs.heartRate = 148;
    } else if (nextSituation === 'exercise_mode') {
      nextSituation = 'nominal';
      nextInputs.heartRate = DEFAULT_SENSOR_INPUTS.heartRate;
    }
  } else if (key === 'shin_patch_wet') {
    const wet = Boolean(nextVal);
    nextInputs.shinPatchWet = wet;
    if (wet) nextSituation = 'sensor_fault';
    else if (nextSituation === 'sensor_fault') nextSituation = 'nominal';
  } else if (key === 'peer_faint_uwb') {
    const active = Boolean(nextVal);
    nextSituation = active ? 'peer_faint' : nextSituation === 'peer_faint' ? 'nominal' : nextSituation;
  } else if (key === 'peer_leak_uwb') {
    const active = Boolean(nextVal);
    nextSituation = active
      ? 'peer_radiation'
      : nextSituation === 'peer_radiation'
      ? 'nominal'
      : nextSituation;
  } else if (key === 'watch_battery_pct' && typeof nextVal === 'number') {
    nextBattery = Math.max(5, Math.min(100, Math.round(nextVal)));
  } else if (key === 'barometer_kpa' && typeof nextVal === 'number') {
    nextExtra.barometerKpa = nextVal;
  } else if (key === 'cabin_o2_pct' && typeof nextVal === 'number') {
    nextExtra.cabinO2Pct = nextVal;
  } else if (key === 'suit_delta_p_kpa' && typeof nextVal === 'number') {
    nextExtra.suitDeltaPKpa = nextVal;
  } else if (key === 'heatwave_temp_c' && typeof nextVal === 'number') {
    nextExtra.heatwaveIndexC = nextVal;
  } else if (key === 'osmometer_mosm' && typeof nextVal === 'number') {
    nextExtra.osmometerMosm = nextVal;
  } else if (key === 'air_quality_aqi' && typeof nextVal === 'number') {
    nextExtra.airQualityAqi = nextVal;
  } else if (key === 'water_purity_ppm' && typeof nextVal === 'number') {
    nextExtra.waterPurityPpm = nextVal;
  } else if (key === 'acoustic_db' && typeof nextVal === 'number') {
    nextExtra.acousticDb = nextVal;
  } else if (key === 'microgravity_g' && typeof nextVal === 'number') {
    nextExtra.microgravityG = nextVal;
  } else if (typeof nextVal === 'number') {
    // Primary biological sensor mappings across any matching variant key
    if (key.startsWith('blood_pressure_systolic')) {
      nextInputs.systolicBp = nextVal;
      if (nextSituation === 'bp_spike' && nextVal < 140) nextSituation = 'nominal';
    } else if (key.startsWith('blood_pressure_diastolic')) {
      nextInputs.diastolicBp = nextVal;
    } else if (key.startsWith('heart_rate')) {
      nextInputs.heartRate = nextVal;
    } else if (key.startsWith('spo2_pct')) {
      nextInputs.spo2 = nextVal;
    } else if (key.startsWith('radiation_dose_rate')) {
      nextInputs.radiationRate = nextVal;
      if (nextSituation === 'high_radiation' && nextVal <= 45) nextSituation = 'nominal';
    } else if (key.startsWith('ultrasonic_sos')) {
      nextInputs.tibialSoundSpeed = nextVal;
      if (nextSituation === 'bone_loss_scan' && nextVal >= 3760) nextSituation = 'nominal';
    } else if (key.startsWith('bone_mass')) {
      // Back-convert BMD (g/cm2) -> tibial ultrasonic SOS (m/s)
      const derivedSos = Math.round(3600 + ((nextVal - 0.9) / 0.28) * 315);
      nextInputs.tibialSoundSpeed = Math.max(3500, Math.min(4150, derivedSos));
      if (nextSituation === 'bone_loss_scan' && nextVal >= 1.02) nextSituation = 'nominal';
    } else if (key.startsWith('cabin_co2_mmhg')) {
      nextInputs.cabinCo2 = nextVal;
      if (nextSituation === 'high_co2' && nextVal <= 4.0) nextSituation = 'nominal';
    } else if (key.startsWith('sweat_sodium')) {
      nextInputs.sweatSodium = nextVal;
    } else if (key.startsWith('core_temperature')) {
      nextInputs.coreTemp = nextVal;
    } else if (key.startsWith('daily_steps_equiv')) {
      nextInputs.steps = Math.max(0, Math.round(nextVal));
    } else if (key.startsWith('active_calories_kcal')) {
      nextInputs.calories = Math.max(0, Math.round(nextVal));
    } else if (key.startsWith('sleep_duration_hr')) {
      nextInputs.sleepHours = Math.max(3.5, Math.min(10.5, Number(nextVal.toFixed(1))));
    }
  }

  return {
    situation: nextSituation,
    inputs: nextInputs,
    extraEnv: nextExtra,
    watchBatteryPct: nextBattery,
    overrides: nextOverrides,
  };
}

/**
 * Evaluates full WatchAlert dynamically from ALL 539+ togglers!
 */
export function evaluateWatchAlertFromState(state: UnifiedTogglerState): WatchAlert {
  // 1. Evaluate core critical conditions & UWB peer SOS
  const coreAlert = evaluateWatchAlert(state.situation, state.inputs);
  if (coreAlert.active) {
    return coreAlert;
  }

  // 2. Check SpO2 hypoxia, EVA Suit ΔP, Heatwave, Core Temp, Battery & Dew
  if (state.inputs.spo2 < 94) {
    return {
      active: true,
      severity: 'critical',
      iconType: 'heart',
      headline: 'Low Blood Oxygen (SpO2)',
      subline: `SpO2 dropped to ${state.inputs.spo2.toFixed(1)}% (<94%)`,
      actionText: 'Open reserve O2 valve & check cabin air loop.',
      metricSnapshot: `spo2_pct: ${state.inputs.spo2}`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  if (state.extraEnv.suitDeltaPKpa < 26) {
    return {
      active: true,
      severity: 'critical',
      iconType: 'wind',
      headline: 'Suit Pressure Drop (ΔP)',
      subline: `Suit ΔP at ${state.extraEnv.suitDeltaPKpa.toFixed(1)} kPa`,
      actionText: 'Return to airlock immediately & engage backup O2 purge.',
      metricSnapshot: `suit_delta_p_kpa: ${state.extraEnv.suitDeltaPKpa}`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  if (state.inputs.sweatSodium > 68 || state.inputs.coreTemp > 37.7) {
    return {
      active: true,
      severity: 'warning',
      iconType: 'activity',
      headline: 'Dehydration & Thermal Load',
      subline: `Sweat Na+ ${state.inputs.sweatSodium} mmol/L · Core ${state.inputs.coreTemp}°C`,
      actionText: 'Drink 450mL electrolyte pouch & boost LCVG cooling.',
      metricSnapshot: `sweat_sodium: ${state.inputs.sweatSodium}`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  if (state.watchBatteryPct < 20) {
    return {
      active: true,
      severity: 'warning',
      iconType: 'wrench',
      headline: 'Watch Battery Low',
      subline: `${state.watchBatteryPct}% charge left`,
      actionText: 'Connect wrist inductive suit cuff charger.',
      metricSnapshot: `watch_battery_pct: ${state.watchBatteryPct}%`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  // 3. Check ALL remaining 525+ detailed togglers dynamically!
  const togglers = buildDetailedTogglers(state);
  const criticalToggler = togglers.find((t) => t.status === 'critical');
  const warningToggler = togglers.find((t) => t.status === 'warning');
  const hit = criticalToggler || warningToggler;

  if (hit) {
    return {
      active: true,
      severity: hit.status === 'critical' ? 'critical' : 'warning',
      iconType:
        hit.category === 'Radiation'
          ? 'radiation'
          : hit.category === 'Bone Density'
          ? 'bone'
          : hit.category === 'Atmosphere' || hit.category === 'Environment 12'
          ? 'wind'
          : hit.category === 'Cardiovascular' || hit.category === 'Respiration'
          ? 'heart'
          : 'activity',
      headline: hit.label,
      subline: `${hit.value} ${hit.unit} (Safe: ${hit.minSafe}–${hit.maxSafe})`,
      actionText: `${hit.simpleHint} Verify detector and apply protocol.`,
      metricSnapshot: `${hit.key}: ${hit.value} ${hit.unit}`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  return coreAlert;
}

export function situationToUnifiedState(
  next: SituationId,
  prev: UnifiedTogglerState
): UnifiedTogglerState {
  const mappedInputs = situationToSensorInputs(next, prev.inputs);
  return {
    situation: next,
    inputs: mappedInputs,
    extraEnv: { ...prev.extraEnv },
    watchBatteryPct: prev.watchBatteryPct,
    overrides: {},
  };
}
