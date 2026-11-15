export type MetricHorizon = 'short_term' | 'long_term';
export type MetricDomain = 'body' | 'environment';
export type MetricStatus = 'nominal' | 'warning' | 'critical';

export type DetectorId =
  | 'wrist_core'
  | 'thoracic_ecg'
  | 'tibial_ultrasonic'
  | 'chest_dosimeter'
  | 'helmet_gas'
  | 'sweat_patch'
  | 'thigh_nirs';

export interface MetricItem {
  id: number;
  key: string;
  label: string;
  category: string;
  value: number;
  unit: string;
  minSafe: number;
  maxSafe: number;
  horizon: MetricHorizon;
  domain: MetricDomain;
  detectorId: DetectorId;
  status: MetricStatus;
}

export type SituationId =
  | 'nominal'
  | 'bp_spike'
  | 'high_radiation'
  | 'bone_loss_scan'
  | 'high_co2'
  | 'exercise_mode'
  | 'sensor_fault'
  | 'peer_faint'
  | 'peer_radiation';

export interface LiveSensorInputs {
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  spo2: number;
  tibialSoundSpeed: number; // m/s (3500 - 4150)
  radiationRate: number; // uSv/h
  cabinCo2: number; // mmHg
  sweatSodium: number; // mmol/L
  coreTemp: number; // C
  steps: number;
  calories: number;
  sleepHours: number;
  exerciseActive: boolean;
  shinPatchWet: boolean;
}

export interface WatchAlert {
  active: boolean;
  severity: 'nominal' | 'warning' | 'critical' | 'peer' | 'info';
  iconType: 'heart' | 'radiation' | 'bone' | 'wind' | 'activity' | 'wrench' | 'peer' | 'check';
  headline: string;
  subline: string;
  actionText: string;
  metricSnapshot: string;
  isPeerAlert: boolean;
  peerName?: string;
  peerDistanceMeters?: number;
  peerLocation?: string;
  vibrating: boolean;
}

export interface DetectorNodeSpec {
  id: DetectorId;
  name: string;
  bodyLocation: string;
  shortRole: string;
  hardwareSensor: string;
  materials: string;
  keyMetricsCount: number;
  status: MetricStatus;
  liveReading: string;
}

export interface CrewThresholds {
  maxSystolicBp: number;
  maxHeartRate: number;
  maxRadiationRate: number;
  minBoneMass: number;
  maxCo2Mmhg: number;
  minSpo2: number;
}

export interface LongTermPoint {
  day: number;
  boneMass: number;
  ultrasonicSos: number;
  moodScore: number;
  sleepHours: number;
  radiationCumulative: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  callsign: string;
  distanceMeters: number;
  moduleLocation: string;
  uwbSignalPct: number;
  status: MetricStatus;
  conditionSummary: string;
  actionRequired: string;
  vitals: {
    heartRate: number;
    systolicBp: number;
    diastolicBp: number;
    spo2: number;
    coreTemp: number;
    radiationRate: number;
    boneMass: number;
    ultrasonicSos: number;
    cabinCo2: number;
    sleepScore: number;
    moodScore: number;
    steps: number;
    calories: number;
  };
  thresholds: CrewThresholds;
  mealPlan: string;
  exerciseProtocol: string;
  commanderNote: string;
  history: LongTermPoint[];
}

export const DEFAULT_SENSOR_INPUTS: LiveSensorInputs = {
  systolicBp: 118,
  diastolicBp: 76,
  heartRate: 68,
  spo2: 98.4,
  tibialSoundSpeed: 3915,
  radiationRate: 14.2,
  cabinCo2: 2.4,
  sweatSodium: 41.0,
  coreTemp: 36.9,
  steps: 8420,
  calories: 2640,
  sleepHours: 7.4,
  exerciseActive: false,
  shinPatchWet: false,
};

/**
 * Computes Bone Mineral Density (g/cm²) and T-Score from Ultrasonic Speed of Sound (m/s).
 */
export function computeBoneMetricsFromSoundWave(sosMs: number): {
  boneMass: number;
  tScore: number;
  transitTimeUs: number;
} {
  const transitTimeUs = Number(((0.15 / sosMs) * 1_000_000).toFixed(2));
  const boneMass = Number(Math.max(0.65, Math.min(1.45, 0.9 + ((sosMs - 3600) / 315) * 0.28)).toFixed(2));
  const tScore = Number(((boneMass - 1.2) / 0.12).toFixed(2));
  return { boneMass, tScore, transitTimeUs };
}

export function situationToSensorInputs(
  situation: SituationId,
  current: LiveSensorInputs = DEFAULT_SENSOR_INPUTS
): LiveSensorInputs {
  const base = {
    ...DEFAULT_SENSOR_INPUTS,
    steps: current.steps,
    calories: current.calories,
    sleepHours: current.sleepHours,
  };
  switch (situation) {
    case 'bp_spike':
      return { ...base, systolicBp: 168, diastolicBp: 106, heartRate: 134 };
    case 'high_radiation':
      return { ...base, radiationRate: 142.0 };
    case 'bone_loss_scan':
      return { ...base, tibialSoundSpeed: 3640 };
    case 'high_co2':
      return { ...base, cabinCo2: 6.4 };
    case 'exercise_mode':
      return { ...base, systolicBp: 146, diastolicBp: 86, heartRate: 148, exerciseActive: true };
    case 'sensor_fault':
      return { ...base, shinPatchWet: true };
    default:
      return base;
  }
}

export const DETECTOR_SPECS: DetectorNodeSpec[] = [
  {
    id: 'wrist_core',
    name: 'Wrist Watch',
    bodyLocation: 'Left Wrist',
    shortRole: 'Checks heart, steps, sleep, and alerts.',
    hardwareSensor: 'Optical pulse and motion sensors',
    materials: 'Titanium case and sapphire glass',
    keyMetricsCount: 95,
    status: 'nominal',
    liveReading: '118/76 mmHg · 68 bpm',
  },
  {
    id: 'tibial_ultrasonic',
    name: 'Shin Bone Sensor',
    bodyLocation: 'Mid-Shin',
    shortRole: 'Checks bone strength using gentle sound.',
    hardwareSensor: 'Ultrasonic bone wave sensor',
    materials: 'Soft medical pad',
    keyMetricsCount: 75,
    status: 'nominal',
    liveReading: '1.18 g/cm² bone score',
  },
  {
    id: 'chest_dosimeter',
    name: 'Radiation Badge',
    bodyLocation: 'Upper Chest',
    shortRole: 'Watches for space radiation spikes.',
    hardwareSensor: 'Space radiation detector',
    materials: 'Shielded aluminum shell',
    keyMetricsCount: 55,
    status: 'nominal',
    liveReading: '14.2 uSv/h safe level',
  },
  {
    id: 'thoracic_ecg',
    name: 'Chest Heart Patch',
    bodyLocation: 'Chest',
    shortRole: 'Tracks heart beat and breathing.',
    hardwareSensor: 'Soft chest heart sensor',
    materials: 'Breathable fabric patch',
    keyMetricsCount: 90,
    status: 'nominal',
    liveReading: '14 breaths/min',
  },
  {
    id: 'sweat_patch',
    name: 'Sweat & Water Patch',
    bodyLocation: 'Inner Arm',
    shortRole: 'Checks body water, salt, and heat.',
    hardwareSensor: 'Sweat salt and heat sensor',
    materials: 'Soft skin band',
    keyMetricsCount: 80,
    status: 'nominal',
    liveReading: '36.9 °C body temp',
  },
  {
    id: 'helmet_gas',
    name: 'Collar Air Sensor',
    bodyLocation: 'Suit Collar',
    shortRole: 'Checks fresh air, oxygen, and CO2.',
    hardwareSensor: 'Air quality and oxygen sensor',
    materials: 'Titanium collar clip',
    keyMetricsCount: 65,
    status: 'nominal',
    liveReading: 'CO2 2.4 · O2 20.9%',
  },
  {
    id: 'thigh_nirs',
    name: 'Leg Muscle Band',
    bodyLocation: 'Right Leg',
    shortRole: 'Checks muscle strength during workouts.',
    hardwareSensor: 'Muscle oxygen band',
    materials: 'Stretch fabric band',
    keyMetricsCount: 65,
    status: 'nominal',
    liveReading: '74% muscle power',
  },
];

interface CategoryBlueprint {
  category: string;
  domain: MetricDomain;
  horizon: MetricHorizon;
  detectorId: DetectorId;
  seeds: Array<{
    baseKey: string;
    baseLabel: string;
    unit: string;
    nominal: number;
    minSafe: number;
    maxSafe: number;
    step: number;
  }>;
  variants: string[];
}

const BLUEPRINTS: CategoryBlueprint[] = [
  {
    category: 'Cardiovascular',
    domain: 'body',
    horizon: 'short_term',
    detectorId: 'wrist_core',
    seeds: [
      { baseKey: 'blood_pressure_systolic', baseLabel: 'Systolic BP', unit: 'mmHg', nominal: 118, minSafe: 90, maxSafe: 138, step: 0.5 },
      { baseKey: 'blood_pressure_diastolic', baseLabel: 'Diastolic BP', unit: 'mmHg', nominal: 76, minSafe: 58, maxSafe: 88, step: 0.4 },
      { baseKey: 'heart_rate', baseLabel: 'Heart Rate', unit: 'bpm', nominal: 68, minSafe: 48, maxSafe: 105, step: 0.5 },
      { baseKey: 'pulse_wave_velocity', baseLabel: 'Pulse Wave Speed', unit: 'm/s', nominal: 6.4, minSafe: 4.5, maxSafe: 8.8, step: 0.05 },
      { baseKey: 'stroke_volume', baseLabel: 'Stroke Volume', unit: 'mL', nominal: 74, minSafe: 52, maxSafe: 98, step: 0.5 },
      { baseKey: 'cardiac_output', baseLabel: 'Cardiac Output', unit: 'L/min', nominal: 5.1, minSafe: 3.8, maxSafe: 7.5, step: 0.05 },
      { baseKey: 'mean_arterial_pressure', baseLabel: 'Mean Arterial Pressure', unit: 'mmHg', nominal: 90, minSafe: 70, maxSafe: 105, step: 0.3 },
      { baseKey: 'baroreflex_sensitivity', baseLabel: 'Baroreflex Index', unit: 'ms/mmHg', nominal: 14.2, minSafe: 7.5, maxSafe: 24.0, step: 0.1 },
      { baseKey: 'cephalad_fluid_index', baseLabel: 'Head Fluid Shift', unit: 'idx', nominal: 1.12, minSafe: 0.85, maxSafe: 1.45, step: 0.01 },
      { baseKey: 'vascular_resistance', baseLabel: 'Vascular Resistance', unit: 'dyn·s/cm5', nominal: 1120, minSafe: 850, maxSafe: 1450, step: 5 },
    ],
    variants: ['resting', 'active', 'orthostatic', 'supine_equiv', 'peak_window', 'rolling_5m', 'beat_to_beat'],
  },
  {
    category: 'Bone Density',
    domain: 'body',
    horizon: 'long_term',
    detectorId: 'tibial_ultrasonic',
    seeds: [
      { baseKey: 'bone_mass', baseLabel: 'Bone Mineral Density', unit: 'g/cm²', nominal: 1.18, minSafe: 1.02, maxSafe: 1.40, step: 0.005 },
      { baseKey: 'ultrasonic_sos', baseLabel: 'Bone Sound Speed', unit: 'm/s', nominal: 3915, minSafe: 3750, maxSafe: 4150, step: 4 },
      { baseKey: 'bone_t_score', baseLabel: 'Bone T-Score', unit: 'SD', nominal: -0.2, minSafe: -1.0, maxSafe: 1.5, step: 0.05 },
      { baseKey: 'ultrasound_attenuation', baseLabel: 'Ultrasound Attenuation', unit: 'dB/MHz', nominal: 114, minSafe: 96, maxSafe: 138, step: 0.4 },
      { baseKey: 'cortical_thickness', baseLabel: 'Cortical Bone Thickness', unit: 'mm', nominal: 4.15, minSafe: 3.55, maxSafe: 5.10, step: 0.02 },
      { baseKey: 'trabecular_stiffness', baseLabel: 'Trabecular Stiffness', unit: 'GPa', nominal: 16.8, minSafe: 13.5, maxSafe: 21.0, step: 0.08 },
      { baseKey: 'acoustic_impedance', baseLabel: 'Bone Acoustic Impedance', unit: 'MRayl', nominal: 7.45, minSafe: 6.20, maxSafe: 8.80, step: 0.03 },
      { baseKey: 'calcium_flux_proxy', baseLabel: 'Calcium Balance', unit: 'mg/d', nominal: -45, minSafe: -160, maxSafe: 80, step: 2 },
      { baseKey: 'osteoclast_strain_idx', baseLabel: 'Bone Loss Risk Index', unit: 'idx', nominal: 0.88, minSafe: 0.40, maxSafe: 1.35, step: 0.01 },
      { baseKey: 'fracture_resilience', baseLabel: 'Bone Strength Score', unit: '%', nominal: 96.2, minSafe: 85.0, maxSafe: 100.0, step: 0.1 },
    ],
    variants: ['tibia_proximal', 'tibia_midshaft', 'tibia_distal', 'calcaneus', 'radius_distal', 'femoral_neck_est', 'lumbar_est'],
  },
  {
    category: 'Radiation',
    domain: 'environment',
    horizon: 'short_term',
    detectorId: 'chest_dosimeter',
    seeds: [
      { baseKey: 'radiation_dose_rate', baseLabel: 'Radiation Dose Rate', unit: 'uSv/h', nominal: 14.2, minSafe: 0, maxSafe: 45.0, step: 0.2 },
      { baseKey: 'solar_proton_flux', baseLabel: 'Solar Proton Flux', unit: 'pfu', nominal: 1.8, minSafe: 0, maxSafe: 12.0, step: 0.1 },
      { baseKey: 'gcr_heavy_ion_rate', baseLabel: 'Cosmic Ray Count', unit: 'hits/cm²/m', nominal: 0.42, minSafe: 0, maxSafe: 1.60, step: 0.02 },
      { baseKey: 'neutron_albedo_dose', baseLabel: 'Neutron Scatter Dose', unit: 'uSv/h', nominal: 3.1, minSafe: 0, maxSafe: 10.0, step: 0.08 },
      { baseKey: 'linear_energy_transfer', baseLabel: 'Linear Energy Transfer', unit: 'keV/um', nominal: 2.4, minSafe: 0, maxSafe: 8.5, step: 0.05 },
      { baseKey: 'cumulative_mission_dose', baseLabel: 'Total Mission Dose', unit: 'mSv', nominal: 28.4, minSafe: 0, maxSafe: 150.0, step: 0.1 },
      { baseKey: 'marrow_dose_equiv', baseLabel: 'Marrow Dose', unit: 'mSv', nominal: 24.1, minSafe: 0, maxSafe: 120.0, step: 0.1 },
      { baseKey: 'ocular_lens_dose', baseLabel: 'Eye Lens Dose', unit: 'mSv', nominal: 31.0, minSafe: 0, maxSafe: 180.0, step: 0.1 },
    ],
    variants: ['chest_badge', 'helmet_shell', 'wrist_silicon', 'berth_shielded', 'airlock_ambient', 'eva_translation', 'cupola_window'],
  },
  {
    category: 'Atmosphere',
    domain: 'environment',
    horizon: 'short_term',
    detectorId: 'helmet_gas',
    seeds: [
      { baseKey: 'cabin_co2_mmhg', baseLabel: 'Inspired CO2', unit: 'mmHg', nominal: 2.4, minSafe: 0.2, maxSafe: 4.0, step: 0.05 },
      { baseKey: 'cabin_o2_kpa', baseLabel: 'Oxygen Pressure', unit: 'kPa', nominal: 21.2, minSafe: 19.5, maxSafe: 23.5, step: 0.04 },
      { baseKey: 'suit_pressure_kpa', baseLabel: 'Suit Pressure', unit: 'kPa', nominal: 101.3, minSafe: 96.0, maxSafe: 104.0, step: 0.1 },
      { baseKey: 'trace_ammonia_ppm', baseLabel: 'Ammonia Level', unit: 'ppm', nominal: 0.12, minSafe: 0, maxSafe: 1.50, step: 0.01 },
      { baseKey: 'carbon_monoxide_ppm', baseLabel: 'Carbon Monoxide', unit: 'ppm', nominal: 0.4, minSafe: 0, maxSafe: 5.0, step: 0.05 },
      { baseKey: 'relative_humidity_pct', baseLabel: 'Suit Humidity', unit: '%', nominal: 46.0, minSafe: 30.0, maxSafe: 65.0, step: 0.3 },
      { baseKey: 'ambient_acoustic_db', baseLabel: 'Cabin Noise', unit: 'dBA', nominal: 54.0, minSafe: 30.0, maxSafe: 72.0, step: 0.4 },
      { baseKey: 'voc_total_ppb', baseLabel: 'Organic Vapors', unit: 'ppb', nominal: 85, minSafe: 0, maxSafe: 350, step: 2 },
    ],
    variants: ['helmet_inlet', 'suit_exhaust', 'crew_quarters', 'lab_deck', 'exercise_bay', 'airlock_node', 'scrubber_out'],
  },
  {
    category: 'Respiration',
    domain: 'body',
    horizon: 'short_term',
    detectorId: 'thoracic_ecg',
    seeds: [
      { baseKey: 'spo2_pct', baseLabel: 'Blood Oxygen (SpO2)', unit: '%', nominal: 98.4, minSafe: 94.0, maxSafe: 100.0, step: 0.1 },
      { baseKey: 'respiration_rate', baseLabel: 'Breathing Rate', unit: 'br/min', nominal: 14.2, minSafe: 9.0, maxSafe: 22.0, step: 0.2 },
      { baseKey: 'tidal_volume_ml', baseLabel: 'Breath Volume', unit: 'mL', nominal: 520, minSafe: 360, maxSafe: 780, step: 4 },
      { baseKey: 'minute_ventilation', baseLabel: 'Minute Ventilation', unit: 'L/min', nominal: 7.4, minSafe: 4.8, maxSafe: 13.5, step: 0.1 },
      { baseKey: 'end_tidal_co2', baseLabel: 'Exhaled CO2', unit: 'mmHg', nominal: 38.2, minSafe: 32.0, maxSafe: 44.0, step: 0.2 },
      { baseKey: 'thoracic_impedance', baseLabel: 'Chest Fluid Impedance', unit: 'Ohm', nominal: 34.8, minSafe: 28.0, maxSafe: 42.0, step: 0.1 },
      { baseKey: 'inspiratory_duty_cycle', baseLabel: 'Breath Duty Cycle', unit: 'ratio', nominal: 0.41, minSafe: 0.32, maxSafe: 0.50, step: 0.01 },
    ],
    variants: ['instant', 'avg_1m', 'avg_15m', 'sleep_baseline', 'eva_exertion', 'post_workout'],
  },
  {
    category: 'Sweat & Hydration',
    domain: 'body',
    horizon: 'short_term',
    detectorId: 'sweat_patch',
    seeds: [
      { baseKey: 'sweat_sodium', baseLabel: 'Sweat Sodium', unit: 'mmol/L', nominal: 41.0, minSafe: 20.0, maxSafe: 68.0, step: 0.3 },
      { baseKey: 'sweat_potassium', baseLabel: 'Sweat Potassium', unit: 'mmol/L', nominal: 4.8, minSafe: 3.0, maxSafe: 7.5, step: 0.05 },
      { baseKey: 'sweat_lactate', baseLabel: 'Sweat Lactate', unit: 'mmol/L', nominal: 8.2, minSafe: 2.0, maxSafe: 18.0, step: 0.1 },
      { baseKey: 'sweat_cortisol', baseLabel: 'Stress Cortisol', unit: 'ng/mL', nominal: 3.4, minSafe: 1.0, maxSafe: 7.8, step: 0.05 },
      { baseKey: 'sweat_ph', baseLabel: 'Sweat pH', unit: 'pH', nominal: 5.8, minSafe: 4.8, maxSafe: 6.8, step: 0.02 },
      { baseKey: 'total_body_water', baseLabel: 'Body Water', unit: '%', nominal: 61.4, minSafe: 56.0, maxSafe: 66.0, step: 0.1 },
      { baseKey: 'core_temperature', baseLabel: 'Core Temperature', unit: '°C', nominal: 36.9, minSafe: 36.1, maxSafe: 37.7, step: 0.02 },
      { baseKey: 'skin_temperature', baseLabel: 'Skin Temperature', unit: '°C', nominal: 33.4, minSafe: 30.5, maxSafe: 35.8, step: 0.05 },
    ],
    variants: ['forearm_patch', 'chest_node', 'wrist_therm', 'hydration_delta', 'electrolyte_ratio', 'osmolarity_est'],
  },
  {
    category: 'Muscle Conditioning',
    domain: 'body',
    horizon: 'long_term',
    detectorId: 'thigh_nirs',
    seeds: [
      { baseKey: 'muscle_oxygen_smo2', baseLabel: 'Muscle Oxygen', unit: '%', nominal: 74.0, minSafe: 55.0, maxSafe: 88.0, step: 0.3 },
      { baseKey: 'emg_rms_amplitude', baseLabel: 'Muscle EMG Power', unit: 'uV', nominal: 92.0, minSafe: 45.0, maxSafe: 180.0, step: 1.0 },
      { baseKey: 'muscle_fiber_velocity', baseLabel: 'Fiber Speed', unit: 'm/s', nominal: 4.25, minSafe: 3.50, maxSafe: 5.20, step: 0.02 },
      { baseKey: 'lean_mass_index', baseLabel: 'Muscle Mass Retention', unit: '%', nominal: 97.4, minSafe: 90.0, maxSafe: 103.0, step: 0.1 },
      { baseKey: 'ared_resistive_load', baseLabel: 'Workout Load', unit: '%', nominal: 96.0, minSafe: 80.0, maxSafe: 110.0, step: 0.5 },
      { baseKey: 'myoglobin_saturation', baseLabel: 'Myoglobin Index', unit: 'idx', nominal: 1.04, minSafe: 0.82, maxSafe: 1.25, step: 0.01 },
      { baseKey: 'fatigue_median_freq', baseLabel: 'Muscle Fatigue Freq', unit: 'Hz', nominal: 84.0, minSafe: 64.0, maxSafe: 108.0, step: 0.4 },
    ],
    variants: ['quadriceps_r', 'quadriceps_l', 'gastrocnemius_r', 'gastrocnemius_l', 'soleus', 'paraspinal', 'deltoid'],
  },
  {
    category: 'Sleep & Mood',
    domain: 'body',
    horizon: 'long_term',
    detectorId: 'wrist_core',
    seeds: [
      { baseKey: 'sleep_duration_hr', baseLabel: 'Sleep Duration', unit: 'hrs', nominal: 7.4, minSafe: 6.0, maxSafe: 9.0, step: 0.05 },
      { baseKey: 'rem_sleep_pct', baseLabel: 'REM Sleep', unit: '%', nominal: 22.5, minSafe: 16.0, maxSafe: 30.0, step: 0.2 },
      { baseKey: 'deep_sleep_pct', baseLabel: 'Deep Sleep', unit: '%', nominal: 19.8, minSafe: 13.0, maxSafe: 28.0, step: 0.2 },
      { baseKey: 'circadian_drift_min', baseLabel: 'Circadian Drift', unit: 'min', nominal: 14.0, minSafe: -45.0, maxSafe: 45.0, step: 1.0 },
      { baseKey: 'hrv_rmssd_ms', baseLabel: 'Heart Rate Variability', unit: 'ms', nominal: 54.0, minSafe: 30.0, maxSafe: 95.0, step: 0.5 },
      { baseKey: 'mood_stability_score', baseLabel: 'Mood Score', unit: 'pts', nominal: 88.0, minSafe: 68.0, maxSafe: 100.0, step: 0.3 },
      { baseKey: 'cognitive_reaction_ms', baseLabel: 'Reaction Speed', unit: 'ms', nominal: 238, minSafe: 180, maxSafe: 320, step: 2 },
      { baseKey: 'crew_cohesion_prox_min', baseLabel: 'Team Time', unit: 'min/d', nominal: 195, minSafe: 90, maxSafe: 420, step: 3 },
    ],
    variants: ['daily', 'rolling_7d', 'rolling_30d', 'pre_eva', 'post_eva', 'shift_alpha', 'melanopic_sync'],
  },
  {
    category: 'Neurological',
    domain: 'body',
    horizon: 'short_term',
    detectorId: 'wrist_core',
    seeds: [
      { baseKey: 'presyncope_autonomic_idx', baseLabel: 'Faint Risk Index', unit: 'idx', nominal: 0.18, minSafe: 0, maxSafe: 0.65, step: 0.01 },
      { baseKey: 'sans_intraocular_mmhg', baseLabel: 'Eye Pressure', unit: 'mmHg', nominal: 15.6, minSafe: 10.0, maxSafe: 21.0, step: 0.1 },
      { baseKey: 'optic_sheath_proxy_mm', baseLabel: 'Optic Nerve Width', unit: 'mm', nominal: 5.1, minSafe: 4.2, maxSafe: 5.8, step: 0.02 },
      { baseKey: 'vestibular_sway_deg', baseLabel: 'Balance Drift', unit: 'deg/s', nominal: 0.9, minSafe: 0, maxSafe: 2.8, step: 0.04 },
      { baseKey: 'galvanic_skin_us', baseLabel: 'Skin Conductance', unit: 'uS', nominal: 2.8, minSafe: 0.5, maxSafe: 8.5, step: 0.08 },
      { baseKey: 'tremor_spectral_hz', baseLabel: 'Hand Tremor', unit: 'dB', nominal: 1.2, minSafe: 0, maxSafe: 4.5, step: 0.05 },
    ],
    variants: ['standing_sim', 'head_tilt', 'micro_g_steady', 'docking_task', 'eva_tether', 'recovery', 'sleep_onset'],
  },
  {
    category: 'Metabolic & Activity',
    domain: 'body',
    horizon: 'long_term',
    detectorId: 'sweat_patch',
    seeds: [
      { baseKey: 'daily_steps_equiv', baseLabel: 'Daily Steps', unit: 'steps', nominal: 8420, minSafe: 4500, maxSafe: 16000, step: 50 },
      { baseKey: 'active_calories_kcal', baseLabel: 'Calories Burned', unit: 'kcal', nominal: 2640, minSafe: 2100, maxSafe: 3600, step: 15 },
      { baseKey: 'crp_inflammation_mg_l', baseLabel: 'Inflammation Index', unit: 'mg/L', nominal: 0.9, minSafe: 0, maxSafe: 3.0, step: 0.04 },
      { baseKey: 'il6_cytokine_pg_ml', baseLabel: 'Immune Marker IL-6', unit: 'pg/mL', nominal: 1.6, minSafe: 0.2, maxSafe: 4.5, step: 0.05 },
      { baseKey: 'vitamin_d_ng_ml', baseLabel: 'Vitamin D Level', unit: 'ng/mL', nominal: 44.0, minSafe: 30.0, maxSafe: 80.0, step: 0.3 },
      { baseKey: 'protein_balance_g_d', baseLabel: 'Protein Balance', unit: 'g/d', nominal: 4.2, minSafe: -5.0, maxSafe: 18.0, step: 0.2 },
    ],
    variants: ['current', 'day_mean', 'week_mean', 'month_mean', 'fasting_window', 'fed_window'],
  },
];

export function generateAllMetrics(
  situationOrInputs: SituationId | LiveSensorInputs = 'nominal'
): MetricItem[] {
  const inputs: LiveSensorInputs =
    typeof situationOrInputs === 'string'
      ? situationToSensorInputs(situationOrInputs)
      : situationOrInputs;

  const { boneMass, tScore } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);
  const mapMmhg = Number(
    (inputs.diastolicBp + (inputs.systolicBp - inputs.diastolicBp) / 3).toFixed(1)
  );

  const list: MetricItem[] = [];
  let idCounter = 1;

  for (const bp of BLUEPRINTS) {
    for (let sIdx = 0; sIdx < bp.seeds.length; sIdx++) {
      const seed = bp.seeds[sIdx];
      for (let vIdx = 0; vIdx < bp.variants.length; vIdx++) {
        const variant = bp.variants[vIdx];
        const key = vIdx === 0 ? seed.baseKey : `${seed.baseKey}_${variant}`;
        const label =
          vIdx === 0 ? seed.baseLabel : `${seed.baseLabel} (${variant.replace(/_/g, ' ')})`;

        const offset = (((sIdx * 3 + vIdx * 5) % 7) - 3) * seed.step;
        let value = Number((seed.nominal + offset).toFixed(2));

        if (seed.baseKey === 'blood_pressure_systolic') {
          value = Number((inputs.systolicBp + vIdx * 0.8).toFixed(1));
        } else if (seed.baseKey === 'blood_pressure_diastolic') {
          value = Number((inputs.diastolicBp + vIdx * 0.5).toFixed(1));
        } else if (seed.baseKey === 'mean_arterial_pressure') {
          value = Number((mapMmhg + vIdx * 0.4).toFixed(1));
        } else if (seed.baseKey === 'heart_rate') {
          value = Number((inputs.heartRate + vIdx * 0.5).toFixed(0));
        } else if (seed.baseKey === 'spo2_pct') {
          value = Number(Math.min(100, inputs.spo2 - vIdx * 0.1).toFixed(1));
        } else if (seed.baseKey === 'bone_mass') {
          value = Number((boneMass - vIdx * 0.005).toFixed(2));
        } else if (seed.baseKey === 'ultrasonic_sos') {
          value = Number((inputs.tibialSoundSpeed - vIdx * 4).toFixed(0));
        } else if (seed.baseKey === 'bone_t_score') {
          value = Number((tScore - vIdx * 0.04).toFixed(2));
        } else if (seed.baseKey === 'radiation_dose_rate') {
          value = Number((inputs.radiationRate + vIdx * 0.4).toFixed(1));
        } else if (seed.baseKey === 'cabin_co2_mmhg') {
          value = Number((inputs.cabinCo2 + vIdx * 0.05).toFixed(2));
        } else if (seed.baseKey === 'sweat_sodium') {
          value = Number((inputs.sweatSodium + vIdx * 0.2).toFixed(1));
        } else if (seed.baseKey === 'core_temperature') {
          value = Number((inputs.coreTemp + vIdx * 0.02).toFixed(2));
        } else if (seed.baseKey === 'daily_steps_equiv') {
          value = Math.round(inputs.steps + vIdx * 30);
        } else if (seed.baseKey === 'active_calories_kcal') {
          value = Math.round(inputs.calories + vIdx * 10);
        } else if (seed.baseKey === 'sleep_duration_hr') {
          value = Number((inputs.sleepHours + vIdx * 0.05).toFixed(1));
        } else if (seed.baseKey === 'acoustic_impedance' && inputs.shinPatchWet) {
          value = Number((2.1 + vIdx * 0.05).toFixed(2));
        }

        let status: MetricStatus = 'nominal';
        if (
          inputs.exerciseActive &&
          (seed.baseKey === 'heart_rate' || seed.baseKey.includes('blood_pressure'))
        ) {
          status = 'nominal';
        } else if (value > seed.maxSafe * 1.15 || value < seed.minSafe * 0.85) {
          status = 'critical';
        } else if (value > seed.maxSafe || value < seed.minSafe) {
          status = 'warning';
        }

        list.push({
          id: idCounter++,
          key,
          label,
          category: bp.category,
          value,
          unit: seed.unit,
          minSafe: seed.minSafe,
          maxSafe: seed.maxSafe,
          horizon: bp.horizon,
          domain: bp.domain,
          detectorId: bp.detectorId,
          status,
        });
      }
    }
  }

  return list;
}

export function evaluateWatchAlert(
  situation: SituationId,
  customInputs?: LiveSensorInputs
): WatchAlert {
  const inputs = customInputs || situationToSensorInputs(situation);
  const { boneMass } = computeBoneMetricsFromSoundWave(inputs.tibialSoundSpeed);

  if (situation === 'peer_faint') {
    return {
      active: true,
      severity: 'peer',
      iconType: 'peer',
      headline: 'Maya Fainted!',
      subline: 'Airlock · 18m away',
      actionText: 'Bring oxygen mask now.',
      metricSnapshot: 'Maya · 18m',
      isPeerAlert: true,
      peerName: 'Maya Lin',
      peerDistanceMeters: 18,
      peerLocation: 'Port Airlock',
      vibrating: true,
    };
  }

  if (situation === 'peer_radiation') {
    return {
      active: true,
      severity: 'peer',
      iconType: 'peer',
      headline: 'Carlos Suit Leak!',
      subline: 'Hatch · 32m away',
      actionText: 'Help Carlos at hatch.',
      metricSnapshot: 'Carlos · 32m',
      isPeerAlert: true,
      peerName: 'Carlos Vega',
      peerDistanceMeters: 32,
      peerLocation: 'EVA Hatch',
      vibrating: true,
    };
  }

  if (inputs.shinPatchWet || situation === 'sensor_fault') {
    return {
      active: true,
      severity: 'warning',
      iconType: 'wrench',
      headline: 'Wet Shin Sensor',
      subline: 'Sweat under leg pad',
      actionText: 'Wipe leg pad dry.',
      metricSnapshot: 'Pad wet',
      isPeerAlert: false,
      vibrating: true,
    };
  }

  if (inputs.exerciseActive || situation === 'exercise_mode') {
    return {
      active: true,
      severity: 'info',
      iconType: 'activity',
      headline: 'Workout Active',
      subline: `Heart ${inputs.heartRate} bpm`,
      actionText: 'High heart alarm paused.',
      metricSnapshot: 'Workout ON',
      isPeerAlert: false,
      vibrating: false,
    };
  }

  if (inputs.radiationRate > 45 || situation === 'high_radiation') {
    return {
      active: true,
      severity: 'critical',
      iconType: 'radiation',
      headline: 'High Radiation',
      subline: `${inputs.radiationRate} uSv/h now`,
      actionText: 'Go to safe room now.',
      metricSnapshot: `${inputs.radiationRate} uSv/h`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  if (inputs.systolicBp >= 140 || situation === 'bp_spike') {
    return {
      active: true,
      severity: 'critical',
      iconType: 'heart',
      headline: 'High Blood Pressure',
      subline: `${inputs.systolicBp}/${inputs.diastolicBp} · ${inputs.heartRate} bpm`,
      actionText: 'Sit down and breathe slow.',
      metricSnapshot: `BP ${inputs.systolicBp}/${inputs.diastolicBp}`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  if (inputs.cabinCo2 > 4.0 || situation === 'high_co2') {
    return {
      active: true,
      severity: 'warning',
      iconType: 'wind',
      headline: 'High CO2 Air',
      subline: `CO2 is ${inputs.cabinCo2} mmHg`,
      actionText: 'Turn air fan high.',
      metricSnapshot: `CO2 ${inputs.cabinCo2}`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  if (boneMass < 1.02 || situation === 'bone_loss_scan') {
    return {
      active: true,
      severity: 'warning',
      iconType: 'bone',
      headline: 'Low Bone Strength',
      subline: `Score ${boneMass} g/cm²`,
      actionText: 'Eat calcium food and squat.',
      metricSnapshot: `Bone ${boneMass}`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  return {
    active: false,
    severity: 'nominal',
    iconType: 'check',
    headline: 'All Safe',
    subline: 'Body and air are good',
    actionText: 'Enjoy your day.',
    metricSnapshot: 'Normal',
    isPeerAlert: false,
    vibrating: false,
  };
}

/**
 * Builds all 10 crewmates for the Aegis Board & Watch crew roster.
 */
export function buildInitialCrew(): CrewMember[] {
  const makeHistory = (baseBone: number, slope: number, baseMood: number): LongTermPoint[] =>
    [1, 30, 60, 90, 120, 150, 180].map((day, idx) => ({
      day,
      boneMass: Number((baseBone - idx * slope).toFixed(3)),
      ultrasonicSos: Math.round(3940 - idx * (slope * 950)),
      moodScore: Math.max(60, Math.min(98, Math.round(baseMood - idx * 1.5 + (idx % 2 === 0 ? 2 : -1)))),
      sleepHours: Number((7.5 - idx * 0.08).toFixed(1)),
      radiationCumulative: Number((4.2 + idx * 4.1).toFixed(1)),
    }));

  return [
    {
      id: 'astronaut-1',
      name: 'Elena Rostova',
      role: 'Mission Specialist',
      callsign: 'EV-01',
      distanceMeters: 0,
      moduleLocation: 'Lab Deck',
      uwbSignalPct: 100,
      status: 'nominal',
      conditionSummary: 'Heart and air are normal.',
      actionRequired: 'Keep daily workout and water.',
      vitals: {
        heartRate: 68,
        systolicBp: 118,
        diastolicBp: 76,
        spo2: 98.4,
        coreTemp: 36.9,
        radiationRate: 14.2,
        boneMass: 1.18,
        ultrasonicSos: 3915,
        cabinCo2: 2.4,
        sleepScore: 89,
        moodScore: 88,
        steps: 8420,
        calories: 2640,
      },
      thresholds: {
        maxSystolicBp: 140,
        maxHeartRate: 115,
        maxRadiationRate: 45,
        minBoneMass: 1.02,
        maxCo2Mmhg: 4.0,
        minSpo2: 94,
      },
      mealPlan: 'Salmon, kale, and Vitamin D',
      exerciseProtocol: 'Squats 45m + Walk 30m',
      commanderNote: 'Synced with active watch.',
      history: makeHistory(1.22, 0.007, 91),
    },
    {
      id: 'astronaut-2',
      name: 'Maya Lin',
      role: 'Flight Engineer',
      callsign: 'EV-02',
      distanceMeters: 18,
      moduleLocation: 'Port Airlock',
      uwbSignalPct: 96,
      status: 'warning',
      conditionSummary: 'Leg bone strength is low.',
      actionRequired: 'Eat calcium food and squat.',
      vitals: {
        heartRate: 76,
        systolicBp: 124,
        diastolicBp: 80,
        spo2: 97.8,
        coreTemp: 37.0,
        radiationRate: 16.8,
        boneMass: 0.96,
        ultrasonicSos: 3680,
        cabinCo2: 2.9,
        sleepScore: 78,
        moodScore: 82,
        steps: 9140,
        calories: 2810,
      },
      thresholds: {
        maxSystolicBp: 140,
        maxHeartRate: 115,
        maxRadiationRate: 45,
        minBoneMass: 1.0,
        maxCo2Mmhg: 4.0,
        minSpo2: 94,
      },
      mealPlan: 'High-calcium fish and greens',
      exerciseProtocol: 'Heel raises and squats 60m',
      commanderNote: 'Added extra calcium meal.',
      history: makeHistory(1.16, 0.033, 86),
    },
    {
      id: 'astronaut-3',
      name: 'Marcus Vance',
      role: 'Bio Officer',
      callsign: 'EV-03',
      distanceMeters: 42,
      moduleLocation: 'Greenhouse Bay',
      uwbSignalPct: 88,
      status: 'nominal',
      conditionSummary: 'Needs a bit more sleep.',
      actionRequired: 'Use bright morning light.',
      vitals: {
        heartRate: 64,
        systolicBp: 115,
        diastolicBp: 74,
        spo2: 98.9,
        coreTemp: 36.7,
        radiationRate: 12.6,
        boneMass: 1.14,
        ultrasonicSos: 3880,
        cabinCo2: 2.1,
        sleepScore: 74,
        moodScore: 76,
        steps: 6890,
        calories: 2420,
      },
      thresholds: {
        maxSystolicBp: 138,
        maxHeartRate: 110,
        maxRadiationRate: 45,
        minBoneMass: 1.02,
        maxCo2Mmhg: 4.0,
        minSpo2: 94,
      },
      mealPlan: 'Warm turkey and oat dinner',
      exerciseProtocol: 'Bike ride 40m + Stretching',
      commanderNote: 'Set calm night lights.',
      history: makeHistory(1.19, 0.008, 84),
    },
    {
      id: 'astronaut-4',
      name: 'Carlos Vega',
      role: 'EVA Specialist',
      callsign: 'EV-04',
      distanceMeters: 32,
      moduleLocation: 'Airlock EVA-2',
      uwbSignalPct: 99,
      status: 'critical',
      conditionSummary: 'Fainted in Airlock EVA-2!',
      actionRequired: 'Send rescue team with O2 now.',
      vitals: {
        heartRate: 124,
        systolicBp: 158,
        diastolicBp: 96,
        spo2: 89.2,
        coreTemp: 37.9,
        radiationRate: 48.5,
        boneMass: 1.01,
        ultrasonicSos: 3740,
        cabinCo2: 4.4,
        sleepScore: 68,
        moodScore: 72,
        steps: 7950,
        calories: 2590,
      },
      thresholds: {
        maxSystolicBp: 142,
        maxHeartRate: 115,
        maxRadiationRate: 45,
        minBoneMass: 1.02,
        maxCo2Mmhg: 4.0,
        minSpo2: 94,
      },
      mealPlan: 'Electrolyte pouch and oxygen rest',
      exerciseProtocol: 'Rest in medical bay today',
      commanderNote: 'Peer alert triggered in airlock.',
      history: makeHistory(1.18, 0.01, 92),
    },
    {
      id: 'astronaut-5',
      name: 'Aisha Patel',
      role: 'Medical Officer',
      callsign: 'MED-01',
      distanceMeters: 15,
      moduleLocation: 'Med Bay',
      uwbSignalPct: 98,
      status: 'nominal',
      conditionSummary: 'Healthy and well rested.',
      actionRequired: 'Check crew water pouches.',
      vitals: {
        heartRate: 66,
        systolicBp: 114,
        diastolicBp: 72,
        spo2: 99.0,
        coreTemp: 36.8,
        radiationRate: 11.8,
        boneMass: 1.21,
        ultrasonicSos: 3932,
        cabinCo2: 2.0,
        sleepScore: 92,
        moodScore: 94,
        steps: 8810,
        calories: 2520,
      },
      thresholds: {
        maxSystolicBp: 140,
        maxHeartRate: 115,
        maxRadiationRate: 45,
        minBoneMass: 1.02,
        maxCo2Mmhg: 4.0,
        minSpo2: 94,
      },
      mealPlan: 'Egg, broccoli, and berries',
      exerciseProtocol: 'Treadmill run 35m',
      commanderNote: 'Leading medical checks.',
      history: makeHistory(1.23, 0.005, 94),
    },
    {
      id: 'astronaut-6',
      name: 'Kenji Sato',
      role: 'Robotics Pilot',
      callsign: 'ROB-01',
      distanceMeters: 27,
      moduleLocation: 'Robotics Dome',
      uwbSignalPct: 93,
      status: 'warning',
      conditionSummary: 'Room CO2 is slightly high.',
      actionRequired: 'Turn on air fan.',
      vitals: {
        heartRate: 78,
        systolicBp: 128,
        diastolicBp: 82,
        spo2: 97.2,
        coreTemp: 37.1,
        radiationRate: 18.4,
        boneMass: 1.09,
        ultrasonicSos: 3825,
        cabinCo2: 4.3,
        sleepScore: 80,
        moodScore: 81,
        steps: 7340,
        calories: 2480,
      },
      thresholds: {
        maxSystolicBp: 140,
        maxHeartRate: 115,
        maxRadiationRate: 45,
        minBoneMass: 1.02,
        maxCo2Mmhg: 4.0,
        minSpo2: 94,
      },
      mealPlan: 'Fresh greens and citrus water',
      exerciseProtocol: 'Light bike 30m + Breath work',
      commanderNote: 'Checking air filter in dome.',
      history: makeHistory(1.15, 0.011, 83),
    },
    {
      id: 'astronaut-7',
      name: 'Sophie Laurent',
      role: 'Science Lead',
      callsign: 'SCI-01',
      distanceMeters: 34,
      moduleLocation: 'Bio Lab',
      uwbSignalPct: 91,
      status: 'nominal',
      conditionSummary: 'All body signs are great.',
      actionRequired: 'Drink 500mL water after lab.',
      vitals: {
        heartRate: 69,
        systolicBp: 117,
        diastolicBp: 75,
        spo2: 98.6,
        coreTemp: 36.8,
        radiationRate: 13.5,
        boneMass: 1.16,
        ultrasonicSos: 3895,
        cabinCo2: 2.3,
        sleepScore: 87,
        moodScore: 90,
        steps: 8120,
        calories: 2560,
      },
      thresholds: {
        maxSystolicBp: 140,
        maxHeartRate: 115,
        maxRadiationRate: 45,
        minBoneMass: 1.02,
        maxCo2Mmhg: 4.0,
        minSpo2: 94,
      },
      mealPlan: 'Yogurt, nuts, and Vitamin D',
      exerciseProtocol: 'Squats 40m + Core 20m',
      commanderNote: 'Science tasks on schedule.',
      history: makeHistory(1.2, 0.006, 90),
    },
    {
      id: 'astronaut-8',
      name: 'Liam O’Connor',
      role: 'Hull Engineer',
      callsign: 'ENG-02',
      distanceMeters: 52,
      moduleLocation: 'Solar Truss',
      uwbSignalPct: 84,
      status: 'warning',
      conditionSummary: 'Sweat salt high after work.',
      actionRequired: 'Drink salt water pouch now.',
      vitals: {
        heartRate: 88,
        systolicBp: 135,
        diastolicBp: 85,
        spo2: 97.5,
        coreTemp: 37.4,
        radiationRate: 26.2,
        boneMass: 1.11,
        ultrasonicSos: 3850,
        cabinCo2: 2.8,
        sleepScore: 79,
        moodScore: 84,
        steps: 10450,
        calories: 3120,
      },
      thresholds: {
        maxSystolicBp: 132,
        maxHeartRate: 115,
        maxRadiationRate: 45,
        minBoneMass: 1.02,
        maxCo2Mmhg: 4.0,
        minSpo2: 94,
      },
      mealPlan: 'Electrolyte soup and chicken',
      exerciseProtocol: 'Cool down stretch 25m',
      commanderNote: 'Returning from outer truss.',
      history: makeHistory(1.17, 0.009, 85),
    },
    {
      id: 'astronaut-9',
      name: 'Zara Al-Mansoor',
      role: 'Navigation Officer',
      callsign: 'NAV-01',
      distanceMeters: 21,
      moduleLocation: 'Bridge Deck',
      uwbSignalPct: 95,
      status: 'nominal',
      conditionSummary: 'Calm focus and steady heart.',
      actionRequired: 'Take 10m eye rest break.',
      vitals: {
        heartRate: 65,
        systolicBp: 116,
        diastolicBp: 74,
        spo2: 98.8,
        coreTemp: 36.7,
        radiationRate: 13.0,
        boneMass: 1.19,
        ultrasonicSos: 3920,
        cabinCo2: 2.2,
        sleepScore: 91,
        moodScore: 93,
        steps: 7650,
        calories: 2450,
      },
      thresholds: {
        maxSystolicBp: 140,
        maxHeartRate: 115,
        maxRadiationRate: 45,
        minBoneMass: 1.02,
        maxCo2Mmhg: 4.0,
        minSpo2: 94,
      },
      mealPlan: 'Berry smoothie and egg wrap',
      exerciseProtocol: 'Treadmill walk 40m',
      commanderNote: 'Orbit path locked.',
      history: makeHistory(1.21, 0.005, 92),
    },
    {
      id: 'astronaut-10',
      name: 'Noah Lindqvist',
      role: 'Geology Specialist',
      callsign: 'GEO-01',
      distanceMeters: 48,
      moduleLocation: 'Airlock Annex',
      uwbSignalPct: 86,
      status: 'nominal',
      conditionSummary: 'Strong bones and good energy.',
      actionRequired: 'Log evening leg workout.',
      vitals: {
        heartRate: 70,
        systolicBp: 120,
        diastolicBp: 77,
        spo2: 98.5,
        coreTemp: 36.9,
        radiationRate: 15.8,
        boneMass: 1.22,
        ultrasonicSos: 3945,
        cabinCo2: 2.5,
        sleepScore: 86,
        moodScore: 89,
        steps: 9320,
        calories: 2790,
      },
      thresholds: {
        maxSystolicBp: 140,
        maxHeartRate: 115,
        maxRadiationRate: 45,
        minBoneMass: 1.02,
        maxCo2Mmhg: 4.0,
        minSpo2: 94,
      },
      mealPlan: 'Beef stew, broccoli, and milk',
      exerciseProtocol: 'Heavy squats 45m',
      commanderNote: 'Rock samples stored safely.',
      history: makeHistory(1.24, 0.004, 89),
    },
  ];
}

export function evaluateCrewMemberStatus(member: CrewMember): {
  status: MetricStatus;
  reasons: string[];
} {
  const reasons: string[] = [];
  let status: MetricStatus = 'nominal';

  if (member.vitals.systolicBp >= member.thresholds.maxSystolicBp + 15) {
    status = 'critical';
    reasons.push(`Blood pressure ${member.vitals.systolicBp} is very high`);
  } else if (member.vitals.systolicBp > member.thresholds.maxSystolicBp) {
    status = 'warning';
    reasons.push(`Blood pressure ${member.vitals.systolicBp} is high`);
  }

  if (member.vitals.radiationRate >= member.thresholds.maxRadiationRate * 1.5) {
    status = 'critical';
    reasons.push(`Radiation ${member.vitals.radiationRate} uSv/h is critical`);
  } else if (member.vitals.radiationRate > member.thresholds.maxRadiationRate) {
    if (status !== 'critical') status = 'warning';
    reasons.push(`Radiation ${member.vitals.radiationRate} uSv/h is high`);
  }

  if (member.vitals.boneMass < member.thresholds.minBoneMass) {
    if (status !== 'critical') status = 'warning';
    reasons.push(`Bone score ${member.vitals.boneMass} is low`);
  }

  if (member.vitals.cabinCo2 > member.thresholds.maxCo2Mmhg) {
    if (status !== 'critical') status = 'warning';
    reasons.push(`Air CO2 ${member.vitals.cabinCo2} is high`);
  }

  if (member.vitals.spo2 < member.thresholds.minSpo2) {
    status = 'critical';
    reasons.push(`Oxygen ${member.vitals.spo2}% is low`);
  }

  return { status, reasons };
}

export type AstronautEmotionState = 'happy' | 'alert' | 'radiation' | 'sleepy' | 'workout';

export interface ClinicalConditionRule {
  id: string;
  conditionName: string;
  category: string;
  detectorNode: string;
  primaryMetricKey: string;
  triggerThreshold: string;
  physiologicalMechanism: string;
  watchImmediateAction: string;
  dashboardLongTermProtocol: string;
  severity: MetricStatus;
  emotion: AstronautEmotionState;
  presetSituation: SituationId;
}

export const CLINICAL_CONDITIONS_MATRIX: ClinicalConditionRule[] = [
  {
    id: 'cond-osteopenia',
    conditionName: 'Weakening Leg Bones',
    category: 'Bone Density',
    detectorNode: 'Shin Bone Sensor',
    primaryMetricKey: 'bone_mass < 1.02 g/cm²',
    triggerThreshold: 'Bone score drops below 1.02',
    physiologicalMechanism: 'Floating in space makes bones weaker.',
    watchImmediateAction: 'Do 45m squats and heel raises.',
    dashboardLongTermProtocol: 'Eat high-calcium food and Vitamin D.',
    severity: 'warning',
    emotion: 'workout',
    presetSituation: 'bone_loss_scan',
  },
  {
    id: 'cond-cardio-spike',
    conditionName: 'High Blood Pressure Spike',
    category: 'Cardiovascular',
    detectorNode: 'Wrist Watch + Chest Patch',
    primaryMetricKey: 'blood_pressure_systolic >= 140 mmHg',
    triggerThreshold: 'Blood pressure above 140 at rest',
    physiologicalMechanism: 'Body fluid shifts toward the head.',
    watchImmediateAction: 'Stop work and breathe slowly.',
    dashboardLongTermProtocol: 'Eat low-salt meals and rest.',
    severity: 'critical',
    emotion: 'alert',
    presetSituation: 'bp_spike',
  },
  {
    id: 'cond-spe-radiation',
    conditionName: 'Space Radiation Storm',
    category: 'Radiation',
    detectorNode: 'Radiation Badge',
    primaryMetricKey: 'radiation_dose_rate > 45.0 uSv/h',
    triggerThreshold: 'Radiation above 45 uSv/h',
    physiologicalMechanism: 'Solar storm sends fast space particles.',
    watchImmediateAction: 'Go inside the shielded room now.',
    dashboardLongTermProtocol: 'Stay in shelter and eat berries.',
    severity: 'critical',
    emotion: 'radiation',
    presetSituation: 'high_radiation',
  },
  {
    id: 'cond-hypercapnia',
    conditionName: 'Stale CO2 Air Pocket',
    category: 'Atmosphere',
    detectorNode: 'Collar Air Sensor',
    primaryMetricKey: 'cabin_co2_mmhg > 4.0 mmHg',
    triggerThreshold: 'CO2 above 4.0 mmHg',
    physiologicalMechanism: 'Used air stays around the helmet.',
    watchImmediateAction: 'Turn air fan to high speed.',
    dashboardLongTermProtocol: 'Check air filter cartridge.',
    severity: 'warning',
    emotion: 'alert',
    presetSituation: 'high_co2',
  },
  {
    id: 'cond-sans-ocular',
    conditionName: 'High Eye Pressure',
    category: 'Neurological',
    detectorNode: 'Wrist Watch + Chest Patch',
    primaryMetricKey: 'sans_intraocular_mmhg > 21.0 mmHg',
    triggerThreshold: 'Eye pressure above 21 mmHg',
    physiologicalMechanism: 'Zero gravity pushes fluid to eyes.',
    watchImmediateAction: 'Wear leg cuffs for 45 minutes.',
    dashboardLongTermProtocol: 'Check eyes and lower salt intake.',
    severity: 'warning',
    emotion: 'sleepy',
    presetSituation: 'nominal',
  },
  {
    id: 'cond-circadian-drift',
    conditionName: 'Poor Sleep & Tiredness',
    category: 'Sleep & Mood',
    detectorNode: 'Wrist Watch',
    primaryMetricKey: 'sleep_duration_hr < 6.0 hrs',
    triggerThreshold: 'Sleep under 6 hours',
    physiologicalMechanism: '16 sunrises daily confuse body clock.',
    watchImmediateAction: 'Use bright blue light for 30m.',
    dashboardLongTermProtocol: 'Dim evening lights and rest early.',
    severity: 'warning',
    emotion: 'sleepy',
    presetSituation: 'nominal',
  },
  {
    id: 'cond-dehydration',
    conditionName: 'Low Water & High Sweat',
    category: 'Sweat & Hydration',
    detectorNode: 'Sweat & Water Patch',
    primaryMetricKey: 'sweat_sodium > 68.0 mmol/L',
    triggerThreshold: 'Sweat salt above 68 mmol/L',
    physiologicalMechanism: 'Hard work in suit uses water.',
    watchImmediateAction: 'Drink a 400mL water pouch now.',
    dashboardLongTermProtocol: 'Add electrolytes to daily meals.',
    severity: 'warning',
    emotion: 'workout',
    presetSituation: 'exercise_mode',
  },
];

export function getAstronautEmotionFromState(
  situation: SituationId,
  inputs: LiveSensorInputs
): AstronautEmotionState {
  if (situation === 'high_radiation' || inputs.radiationRate > 45) {
    return 'radiation';
  }
  if (situation === 'exercise_mode' || inputs.exerciseActive) {
    return 'workout';
  }
  if (
    situation === 'bp_spike' ||
    situation === 'high_co2' ||
    situation === 'peer_faint' ||
    situation === 'peer_radiation' ||
    inputs.systolicBp >= 140 ||
    inputs.cabinCo2 > 4.0
  ) {
    return 'alert';
  }
  if (inputs.sleepHours < 6.2) {
    return 'sleepy';
  }
  return 'happy';
}
