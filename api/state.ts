import {
  buildInitialCrew,
  DEFAULT_SENSOR_INPUTS,
  generateAllMetrics,
} from '../src/utils/metricsEngine.ts';

interface ApiReq {
  method?: string;
}

interface ApiRes {
  status: (code: number) => ApiRes;
  json: (data: unknown) => void;
}

export default function handler(_req: ApiReq, res: ApiRes) {
  const crew = buildInitialCrew();
  const metrics = generateAllMetrics(DEFAULT_SENSOR_INPUTS);
  res.status(200).json({
    sensorInputs: DEFAULT_SENSOR_INPUTS,
    crew,
    metricsCount: metrics.length,
    lastCloudAnalysis: {
      syncedAt: new Date().toISOString().slice(11, 19),
      packetsProcessed: 10,
      boneDensityStatus: 'Normal (1.18 g/cm²)',
      recommendedMeal: 'Balanced Meal + Vitamin D3',
      recommendedWorkout: 'Squats 45m + Walk 30m',
      alertsCount: 0,
    },
    cloudSyncCount: 1,
  });
}
