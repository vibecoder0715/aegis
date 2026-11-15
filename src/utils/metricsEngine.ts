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
 * Computes Bone Mineral Density (g/cm²) and T-Score from Ultrasonic Speed of Sound (m/s)
 * using real axial transmission bone sonometry math.
 */
export function computeBoneMetricsFromSoundWave(sosMs: number): {
  boneMass: number;
  tScore: number;
  transitTimeUs: number;
} {
  // 150 mm transducer separation along tibial crest
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
    shortRole: 'Pulse, blood pressure, steps, sleep, alarms, peer alerts',
    hardwareSensor: 'Optical PPG, 6-axis IMU, 6.5GHz UWB radio, Haptic motor',
    materials: 'Grade-5 Titanium, Sapphire glass, Nomex-Kevlar strap',
    keyMetricsCount: 95,
    status: 'nominal',
    liveReading: '118/76 mmHg · 68 bpm',
  },
  {
    id: 'tibial_ultrasonic',
    name: 'Shin Bone Node',
    bodyLocation: 'Mid-Shin',
    shortRole: 'Measures bone loss by ultrasonic sound wave speed',
    hardwareSensor: '1.2 MHz Piezoelectric PZT-5H Ultrasonic Transducer',
    materials: 'Medical PEEK shell, dry silicone pad',
    keyMetricsCount: 75,
    status: 'nominal',
    liveReading: '3915 m/s · 1.18 g/cm²',
  },
  {
    id: 'chest_dosimeter',
    name: 'Suit Radiation Node',
    bodyLocation: 'Upper Chest',
    shortRole: 'Detects solar proton spikes and cosmic radiation',
    hardwareSensor: 'Solid-State Silicon PIN Diode + Plastic Scintillator',
    materials: 'Aluminum-Lithium alloy, Gold Kapton foil',
    keyMetricsCount: 55,
    status: 'nominal',
    liveReading: '14.2 uSv/h · 28.4 mSv',
  },
  {
    id: 'thoracic_ecg',
    name: 'Chest ECG Patch',
    bodyLocation: 'Sternum',
    shortRole: 'Heart rhythm, stroke volume, fluid shift, breathing',
    hardwareSensor: 'ECG ASIC + Bio-Impedance Spectroscopy',
    materials: 'Breathable Polyimide film, dry Silver-Nanowire electrodes',
    keyMetricsCount: 90,
    status: 'nominal',
    liveReading: 'QTc 402 ms · 14 br/m',
  },
  {
    id: 'sweat_patch',
    name: 'Forearm Sweat Patch',
    bodyLocation: 'Inner Forearm',
    shortRole: 'Hydration salts, muscle lactate, and stress cortisol',
    hardwareSensor: 'Graphene Ion-Selective Electrodes (Na+, K+, Cortisol)',
    materials: 'Flexible PDMS microfluidic channels',
    keyMetricsCount: 80,
    status: 'nominal',
    liveReading: 'Na+ 41 mmol/L · 36.9 °C',
  },
  {
    id: 'helmet_gas',
    name: 'Collar Air Node',
    bodyLocation: 'Suit Collar',
    shortRole: 'Monitors CO2 buildup, oxygen, pressure, cabin noise',
    hardwareSensor: 'NDIR CO2 sensor, Optical O2 cell, MEMS mic',
    materials: 'PTFE membrane, Titanium collar clip',
    keyMetricsCount: 65,
    status: 'nominal',
    liveReading: 'CO2 2.4 mmHg · O2 20.9%',
  },
  {
    id: 'thigh_nirs',
    name: 'Thigh Muscle Band',
    bodyLocation: 'Right Thigh',
    shortRole: 'Muscle oxygen and workout load',
    hardwareSensor: 'Near-Infrared Spectroscopy (NIRS) + Surface EMG',
    materials: 'Stretch conductive e-textile band',
    keyMetricsCount: 65,
    status: 'nominal',
    liveReading: 'SmO2 74% · 92 uV',
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

        // Real calculation binding from live sensor inputs
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
      headline: 'Maya Lin: Fainting',
      subline: 'Port Airlock · 18m away',
      actionText: 'Go to Port Airlock with O2 mask.',
      metricSnapshot: 'MAYA_LIN · 18m',
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
      headline: 'Carlos Vega: Suit Leak',
      subline: 'EVA Hatch · 32m away',
      actionText: 'Assist at EVA Hatch now.',
      metricSnapshot: 'CARLOS_VEGA · 32m',
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
      headline: 'Shin Sensor Loose',
      subline: 'Sweat under bone sensor pad',
      actionText: 'Wipe shin pad dry and press for 3s.',
      metricSnapshot: 'acoustic_impedance: 2.1 MRayl',
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
      subline: `HR ${inputs.heartRate} bpm · BP ${inputs.systolicBp}/${inputs.diastolicBp}`,
      actionText: 'High BP/HR alarm paused during workout.',
      metricSnapshot: 'workout_mode: on',
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
      subline: `${inputs.radiationRate} uSv/h detected`,
      actionText: 'Enter shielded storm berth now.',
      metricSnapshot: `radiation_dose_rate: ${inputs.radiationRate} uSv/h`,
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
      subline: `BP ${inputs.systolicBp}/${inputs.diastolicBp} · HR ${inputs.heartRate}`,
      actionText: 'Stop work. Sit and breathe slowly.',
      metricSnapshot: `blood_pressure_systolic: ${inputs.systolicBp}`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  if (inputs.cabinCo2 > 4.0 || situation === 'high_co2') {
    return {
      active: true,
      severity: 'warning',
      iconType: 'wind',
      headline: 'High Suit CO2',
      subline: `CO2 at ${inputs.cabinCo2} mmHg`,
      actionText: 'Turn air fan high. Check scrubber.',
      metricSnapshot: `cabin_co2_mmhg: ${inputs.cabinCo2}`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  if (boneMass < 1.02 || situation === 'bone_loss_scan') {
    return {
      active: true,
      severity: 'warning',
      iconType: 'bone',
      headline: 'Bone Mass Low',
      subline: `${boneMass} g/cm² (${inputs.tibialSoundSpeed} m/s)`,
      actionText: 'Take Calcium + Vit D meal & squat set.',
      metricSnapshot: `bone_mass: ${boneMass} g/cm²`,
      isPeerAlert: false,
      vibrating: true,
    };
  }

  return {
    active: false,
    severity: 'nominal',
    iconType: 'check',
    headline: 'All Systems Normal',
    subline: 'All 7 detectors normal',
    actionText: 'Continue normal schedule.',
    metricSnapshot: `bone_mass: ${boneMass} · bp: ${inputs.systolicBp}/${inputs.diastolicBp}`,
    isPeerAlert: false,
    vibrating: false,
  };
}

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
      conditionSummary: 'Vitals and suit air normal',
      actionRequired: 'Standard workout and hydration',
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
      mealPlan: 'Balanced Meal + Vitamin D3',
      exerciseProtocol: 'Resistive Squat 45m + Treadmill 30m',
      commanderNote: 'Bone wave speed stable.',
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
      conditionSummary: 'Shin bone mass down 4.8%',
      actionRequired: 'High-Calcium meal + heavy squats',
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
      mealPlan: 'High-Calcium Salmon & Kale + Vit D3/K2',
      exerciseProtocol: 'Heavy Heel Raises & Deadlifts 60m',
      commanderNote: 'Increased calcium ration.',
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
      conditionSummary: 'Mild sleep drift (+28m)',
      actionRequired: '30m morning blue light',
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
      mealPlan: 'Tryptophan Evening Meal + Omega-3',
      exerciseProtocol: 'Cycle Ergometer 40m + Core 40m',
      commanderNote: 'Adjusted cabin light schedule.',
      history: makeHistory(1.19, 0.008, 84),
    },
    {
      id: 'astronaut-4',
      name: 'Carlos Vega',
      role: 'Commander',
      callsign: 'CMDR-01',
      distanceMeters: 11,
      moduleLocation: 'Cupola',
      uwbSignalPct: 99,
      status: 'nominal',
      conditionSummary: 'All sensors normal',
      actionRequired: 'Check EVA radiation budget',
      vitals: {
        heartRate: 71,
        systolicBp: 121,
        diastolicBp: 78,
        spo2: 98.2,
        coreTemp: 36.8,
        radiationRate: 15.1,
        boneMass: 1.12,
        ultrasonicSos: 3862,
        cabinCo2: 2.5,
        sleepScore: 85,
        moodScore: 90,
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
      mealPlan: 'Low-Sodium Potassium Meal',
      exerciseProtocol: 'Full-Body Resistive 50m',
      commanderNote: 'Crew ready for EVA.',
      history: makeHistory(1.18, 0.01, 92),
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
    reasons.push(`Systolic BP ${member.vitals.systolicBp} mmHg above critical limit`);
  } else if (member.vitals.systolicBp > member.thresholds.maxSystolicBp) {
    status = 'warning';
    reasons.push(`Systolic BP ${member.vitals.systolicBp} mmHg > ${member.thresholds.maxSystolicBp}`);
  }

  if (member.vitals.radiationRate >= member.thresholds.maxRadiationRate * 1.5) {
    status = 'critical';
    reasons.push(`Radiation ${member.vitals.radiationRate} uSv/h critical`);
  } else if (member.vitals.radiationRate > member.thresholds.maxRadiationRate) {
    if (status !== 'critical') status = 'warning';
    reasons.push(`Radiation ${member.vitals.radiationRate} uSv/h > ${member.thresholds.maxRadiationRate}`);
  }

  if (member.vitals.boneMass < member.thresholds.minBoneMass) {
    if (status !== 'critical') status = 'warning';
    reasons.push(`Bone mass ${member.vitals.boneMass} g/cm² < ${member.thresholds.minBoneMass}`);
  }

  if (member.vitals.cabinCo2 > member.thresholds.maxCo2Mmhg) {
    if (status !== 'critical') status = 'warning';
    reasons.push(`CO2 ${member.vitals.cabinCo2} mmHg > ${member.thresholds.maxCo2Mmhg}`);
  }

  if (member.vitals.spo2 < member.thresholds.minSpo2) {
    status = 'critical';
    reasons.push(`SpO2 ${member.vitals.spo2}% < ${member.thresholds.minSpo2}%`);
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

/**
 * Deep aerospace medicine mapping of Measurable Metrics -> Clinical Conditions -> Immediate & Long-Term Actions
 */
export const CLINICAL_CONDITIONS_MATRIX: ClinicalConditionRule[] = [
  {
    id: 'cond-osteopenia',
    conditionName: 'Microgravity Osteopenia & Bone Loss',
    category: 'Bone Density',
    detectorNode: 'Shin Bone Node (1.2 MHz Ultrasonic)',
    primaryMetricKey: 'ultrasonic_sos < 3750 m/s · bone_mass < 1.02 g/cm²',
    triggerThreshold: 'Bone T-Score < -1.0 SD or SOS drop > 140 m/s',
    physiologicalMechanism: 'Unloading of weight-bearing tibia increases osteoclast resorption and urinary calcium excretion.',
    watchImmediateAction: 'Log 45m ARED resistive squat & heel-raise block today.',
    dashboardLongTermProtocol: 'Prescribe 1200mg Calcium + 2000 IU Vitamin D3/K2 meal ration & weekly ultrasonic tibial scan.',
    severity: 'warning',
    emotion: 'workout',
    presetSituation: 'bone_loss_scan',
  },
  {
    id: 'cond-cardio-spike',
    conditionName: 'Adrenergic Hypertension & Orthostatic Intolerance',
    category: 'Cardiovascular',
    detectorNode: 'Wrist Watch + Chest ECG Patch',
    primaryMetricKey: 'blood_pressure_systolic >= 140 mmHg · baroreflex_sensitivity < 7.5 ms/mmHg',
    triggerThreshold: 'Systolic BP >= 140 mmHg at rest or HR > 125 bpm without workout',
    physiologicalMechanism: 'Cephalad fluid shift and baroreceptor unloading trigger sympathetic surge or presyncopal drop.',
    watchImmediateAction: 'Halt EVA/deck task immediately. Anchor tether and perform 6/min paced breathing.',
    dashboardLongTermProtocol: 'Isotonic fluid loading (500mL + Na+ tablet) prior to gravity transitions and lower-body negative pressure.',
    severity: 'critical',
    emotion: 'alert',
    presetSituation: 'bp_spike',
  },
  {
    id: 'cond-spe-radiation',
    conditionName: 'Acute Solar Particle Event (SPE) Radiation Exposure',
    category: 'Radiation',
    detectorNode: 'Suit Radiation Node (Silicon PIN Diode)',
    primaryMetricKey: 'radiation_dose_rate > 45.0 uSv/h · solar_proton_flux > 12 pfu',
    triggerThreshold: 'Dose rate > 45 uSv/h or cumulative mission dose > 150 mSv',
    physiologicalMechanism: 'High-energy protons and heavy HZE ions induce DNA double-strand breaks and hematopoietic suppression.',
    watchImmediateAction: 'Abort unshielded bay or EVA. Enter Polyethylene Storm Berth immediately.',
    dashboardLongTermProtocol: 'Deploy water-wall mass shielding around sleep station and administer antioxidant countermeasure ration.',
    severity: 'critical',
    emotion: 'radiation',
    presetSituation: 'high_radiation',
  },
  {
    id: 'cond-hypercapnia',
    conditionName: 'Localized CO2 Pocket & Hypercapnic Headache',
    category: 'Atmosphere',
    detectorNode: 'Collar Air Node (NDIR Gas Sensor)',
    primaryMetricKey: 'cabin_co2_mmhg > 4.0 mmHg · end_tidal_co2 > 44.0 mmHg',
    triggerThreshold: 'Inspired ppCO2 > 4.0 mmHg inside helmet or crew berth',
    physiologicalMechanism: 'Lack of natural buoyancy convection in 0G forms stagnant exhaled CO2 bubbles around the astronaut face.',
    watchImmediateAction: 'Switch suit/cabin ventilation fan to HIGH and relocate to cross-ventilated deck.',
    dashboardLongTermProtocol: 'Inspect LiOH / Amine scrubber cartridge saturation and increase sleeping berth duct flow by 35%.',
    severity: 'warning',
    emotion: 'alert',
    presetSituation: 'high_co2',
  },
  {
    id: 'cond-sans-ocular',
    conditionName: 'Spaceflight-Associated Neuro-Ocular Syndrome (SANS)',
    category: 'Neurological',
    detectorNode: 'Wrist Watch + Chest Bio-Impedance',
    primaryMetricKey: 'sans_intraocular_mmhg > 21.0 mmHg · optic_sheath_proxy_mm > 5.8 mm',
    triggerThreshold: 'Intraocular pressure > 21 mmHg + cephalad fluid index > 1.45',
    physiologicalMechanism: 'Headward venous congestion elevates intracranial and optic nerve sheath pressure, flattening the globe.',
    watchImmediateAction: 'Don lower-body thigh occlusion cuffs for 45 minutes.',
    dashboardLongTermProtocol: 'Schedule optical coherence tomography check, reduce dietary sodium < 2000mg/d, and B-vitamin complex.',
    severity: 'warning',
    emotion: 'sleepy',
    presetSituation: 'nominal',
  },
  {
    id: 'cond-circadian-drift',
    conditionName: 'Circadian Desynchrony & Isolation Fatigue',
    category: 'Sleep & Mood',
    detectorNode: 'Wrist Watch (PPG HRV + Actigraphy)',
    primaryMetricKey: 'circadian_drift_min > 45 min · hrv_rmssd_ms < 30 ms',
    triggerThreshold: 'Sleep duration < 6.0 hrs + reaction speed > 310 ms',
    physiologicalMechanism: 'Loss of 24-hour solar cues suppresses melatonin rhythm, degrading REM sleep and prefrontal vigilance.',
    watchImmediateAction: 'Activate 480nm blue-enriched LED visor/cabin array for 30 minutes.',
    dashboardLongTermProtocol: 'Shift evening lighting to 2700K warm spectrum, schedule tryptophan-rich dinner, and reduce high-risk tasks.',
    severity: 'warning',
    emotion: 'sleepy',
    presetSituation: 'nominal',
  },
  {
    id: 'cond-dehydration',
    conditionName: 'Electrolyte Depletion & Thermal Strain',
    category: 'Sweat & Hydration',
    detectorNode: 'Forearm Sweat Patch (Graphene ISE)',
    primaryMetricKey: 'sweat_sodium > 68.0 mmol/L · total_body_water < 56.0%',
    triggerThreshold: 'Sweat Na+ > 68 mmol/L or Core Temp > 37.7 °C during EVA/workout',
    physiologicalMechanism: 'Spaceflight plasma volume contraction (~12%) compounds thermoregulatory sweat loss during suit exertion.',
    watchImmediateAction: 'Drink 400mL electrolyte pouch and increase LCVG cooling loop flow.',
    dashboardLongTermProtocol: 'Rebalance potassium-to-sodium meal ratio and monitor 24-hour fluid intake on Personal Dashboard.',
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

