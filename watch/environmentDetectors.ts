import type { LiveSensorInputs } from '../src/utils/metricsEngine';

export type EnvSeverity = 'nominal' | 'warning' | 'critical';

export interface EnvDetectorReading {
  id: string;
  name: string;
  shortLabel: string;
  agencyRef: string;
  value: number;
  unit: string;
  safeRange: string;
  status: EnvSeverity;
  summary: string;
}

export interface EnvironmentTelemetryPacket {
  schema: 'aegis.watch.env.v2';
  timestampUtc: string;
  visitorId: string;
  offlineAutonomous: boolean;
  detectorsCount: number;
  activeAlertsCount: number;
  readings: EnvDetectorReading[];
}

export interface ExtraEnvironmentControls {
  barometerKpa: number;
  osmometerMosm: number;
  heatwaveIndexC: number;
  airQualityAqi: number;
  cabinO2Pct: number;
  acousticDb: number;
  microgravityG: number;
  waterPurityPpm: number;
  suitDeltaPKpa: number;
}

export const DEFAULT_EXTRA_ENV_CONTROLS: ExtraEnvironmentControls = {
  barometerKpa: 101.2,
  osmometerMosm: 288,
  heatwaveIndexC: 22.8,
  airQualityAqi: 14,
  cabinO2Pct: 21.1,
  acousticDb: 54.0,
  microgravityG: 0.0002,
  waterPurityPpm: 42,
  suitDeltaPKpa: 29.6,
};

/**
 * Computes all 12 dynamic spacecraft & EVA environmental detectors from live suit/cabin inputs.
 */
export function buildEnvironmentDetectors(
  inputs: LiveSensorInputs,
  extra: ExtraEnvironmentControls = DEFAULT_EXTRA_ENV_CONTROLS
): EnvDetectorReading[] {
  // CSA CANS: Neutrons constitute ~30% of space orbital dose
  const neutronDose = Number((inputs.radiationRate * 0.31).toFixed(2));
  const protonDose = Number((inputs.radiationRate * 0.69).toFixed(2));

  // Osmometer couples dehydration / sweat Na+ loss with extra sensor value
  const derivedOsm = Number(
    Math.max(260, Math.min(340, extra.osmometerMosm + (inputs.sweatSodium - 41) * 0.55)).toFixed(0)
  );
  const derivedHeatwave = Number(
    (extra.heatwaveIndexC + Math.max(0, inputs.coreTemp - 36.9) * 3.8).toFixed(1)
  );

  return [
    {
      id: 'csa_cans_neutron',
      name: 'CSA CANS Neutron Flux',
      shortLabel: 'Neutrons',
      agencyRef: 'CSA CANS Spectrometer (~30% of ISS dose)',
      value: neutronDose,
      unit: 'uSv/h',
      safeRange: '0–14 uSv/h',
      status: neutronDose > 18 ? 'critical' : neutronDose > 11 ? 'warning' : 'nominal',
      summary: 'Active hydrogen-recoil neutron spectrum crossing bulkhead walls.',
    },
    {
      id: 'proton_gcr',
      name: 'Proton / GCR Radiation',
      shortLabel: 'Protons',
      agencyRef: 'NASA Silicon PIN Dosimeter',
      value: protonDose,
      unit: 'uSv/h',
      safeRange: '0–32 uSv/h',
      status: protonDose > 35 ? 'critical' : protonDose > 24 ? 'warning' : 'nominal',
      summary: 'Charged solar particle bursts and galactic cosmic ray heavy ions.',
    },
    {
      id: 'barometer',
      name: 'Habitat Barometer',
      shortLabel: 'Barometer',
      agencyRef: 'ISS / Exploration Module Pressure',
      value: Number(extra.barometerKpa.toFixed(1)),
      unit: 'kPa',
      safeRange: '96–104 kPa',
      status:
        extra.barometerKpa < 93 || extra.barometerKpa > 106
          ? 'critical'
          : extra.barometerKpa < 96
          ? 'warning'
          : 'nominal',
      summary: 'Ambient module total atmospheric pressure (Earth 101.3 kPa baseline).',
    },
    {
      id: 'osmometer',
      name: 'Sweat / Fluid Osmometer',
      shortLabel: 'Osmometer',
      agencyRef: 'CSA Bio-Analyzer Microfluidic Osmolality',
      value: derivedOsm,
      unit: 'mOsm/kg',
      safeRange: '275–298 mOsm/kg',
      status: derivedOsm > 308 || derivedOsm < 268 ? 'critical' : derivedOsm > 298 ? 'warning' : 'nominal',
      summary: 'Tracks plasma hydration concentration and kidney-stone fluid risk.',
    },
    {
      id: 'heatwaves',
      name: 'Thermal / Heatwave Load',
      shortLabel: 'Heatwaves',
      agencyRef: 'LCVG Thermal Loop & Cabin Comfort',
      value: derivedHeatwave,
      unit: '°C',
      safeRange: '18.0–27.0 °C',
      status: derivedHeatwave > 30 ? 'critical' : derivedHeatwave > 27 ? 'warning' : 'nominal',
      summary: 'Detects closed-rack heatwaves & microgravity thermal pocket buildup.',
    },
    {
      id: 'air_quality',
      name: 'Air Quality & Particulates',
      shortLabel: 'Air Quality',
      agencyRef: 'NASA VOC & Regolith PM2.5 Sensor',
      value: Math.round(extra.airQualityAqi + Math.max(0, inputs.cabinCo2 - 2.4) * 12),
      unit: 'AQI',
      safeRange: '0–45 AQI',
      status:
        extra.airQualityAqi + Math.max(0, inputs.cabinCo2 - 2.4) * 12 > 95
          ? 'critical'
          : extra.airQualityAqi + Math.max(0, inputs.cabinCo2 - 2.4) * 12 > 50
          ? 'warning'
          : 'nominal',
      summary: 'Volatile organics, dust suspended in 0G, and trace off-gassing.',
    },
    {
      id: 'inspired_co2',
      name: 'Inspired CO2 Pocket',
      shortLabel: 'CO2',
      agencyRef: 'NASA NDIR Collar Gas Node',
      value: Number(inputs.cabinCo2.toFixed(2)),
      unit: 'mmHg',
      safeRange: '0.2–4.0 mmHg',
      status: inputs.cabinCo2 > 5.5 ? 'critical' : inputs.cabinCo2 > 4.0 ? 'warning' : 'nominal',
      summary: 'Catches zero-G unventilated exhaled CO2 pockets causing headaches.',
    },
    {
      id: 'cabin_o2',
      name: 'Oxygen Concentration',
      shortLabel: 'O2 %',
      agencyRef: 'NASA HRP Hypoxia / Fire Limit',
      value: Number(extra.cabinO2Pct.toFixed(1)),
      unit: '%',
      safeRange: '19.5–23.5%',
      status:
        extra.cabinO2Pct < 18.8 || extra.cabinO2Pct > 24.5
          ? 'critical'
          : extra.cabinO2Pct < 19.5 || extra.cabinO2Pct > 23.5
          ? 'warning'
          : 'nominal',
      summary: 'Prevents both hypobaric hypoxia and elevated-oxygen flammability.',
    },
    {
      id: 'acoustic_db',
      name: 'Cabin Acoustic Noise',
      shortLabel: 'Acoustics',
      agencyRef: 'NASA Habitability Fan/Pump Meter',
      value: Number(extra.acousticDb.toFixed(1)),
      unit: 'dBA',
      safeRange: '30–68 dBA',
      status: extra.acousticDb > 76 ? 'critical' : extra.acousticDb > 68 ? 'warning' : 'nominal',
      summary: 'Continuous equipment hum threatening sleep quality and hearing.',
    },
    {
      id: 'microgravity_g',
      name: 'Microgravity Vibration',
      shortLabel: 'Micro-G',
      agencyRef: 'CSA 3-Axis IMU Crystal Accelerometer',
      value: Number(extra.microgravityG.toFixed(4)),
      unit: 'g',
      safeRange: '0.0000–0.0020 g',
      status: extra.microgravityG > 0.01 ? 'warning' : 'nominal',
      summary: 'Measures ARED treadmill isolation and delicate 0G protein experiment jitter.',
    },
    {
      id: 'water_purity',
      name: 'Closed-Loop Water Purity',
      shortLabel: 'Water TDS',
      agencyRef: 'NASA ECLSS Potable Condensate Loop',
      value: Math.round(extra.waterPurityPpm),
      unit: 'ppm',
      safeRange: '10–120 ppm',
      status: extra.waterPurityPpm > 180 ? 'critical' : extra.waterPurityPpm > 120 ? 'warning' : 'nominal',
      summary: 'Monitors dissolved solids in recycled spacecraft potable water.',
    },
    {
      id: 'eva_suit_delta_p',
      name: 'EVA Suit ΔP Integrity',
      shortLabel: 'Suit ΔP',
      agencyRef: 'NASA DCS Airlock Pressure Delta',
      value: Number(extra.suitDeltaPKpa.toFixed(1)),
      unit: 'kPa',
      safeRange: '28.0–31.0 kPa',
      status:
        extra.suitDeltaPKpa < 26.0
          ? 'critical'
          : extra.suitDeltaPKpa < 28.0 || extra.suitDeltaPKpa > 31.5
          ? 'warning'
          : 'nominal',
      summary: 'Protects pressurized EVA glove/helmet seal against leaks & DCS bubbles.',
    },
  ];
}

export function generateDynamicEnvironmentJson(
  visitorId: string,
  inputs: LiveSensorInputs,
  extra: ExtraEnvironmentControls,
  offlineAutonomous: boolean
): EnvironmentTelemetryPacket {
  const readings = buildEnvironmentDetectors(inputs, extra);
  return {
    schema: 'aegis.watch.env.v2',
    timestampUtc: new Date().toISOString(),
    visitorId,
    offlineAutonomous,
    detectorsCount: readings.length,
    activeAlertsCount: readings.filter((r) => r.status !== 'nominal').length,
    readings,
  };
}
