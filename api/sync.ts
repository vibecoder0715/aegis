import {
  buildInitialCrew,
  computeBoneMetricsFromSoundWave,
  DEFAULT_SENSOR_INPUTS,
  generateAllMetrics,
  LiveSensorInputs,
} from '../src/utils/metricsEngine.ts';

interface ApiReq {
  method?: string;
  body?: Record<string, unknown>;
}

interface ApiRes {
  status: (code: number) => ApiRes;
  json: (data: unknown) => void;
}

export default function handler(req: ApiReq, res: ApiRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const incomingInputs: LiveSensorInputs = {
    ...DEFAULT_SENSOR_INPUTS,
    ...((body.sensorInputs as Partial<LiveSensorInputs>) || {}),
  };
  const packets = Number(body.queuedPackets || 10);
  const { boneMass, tScore } = computeBoneMetricsFromSoundWave(incomingInputs.tibialSoundSpeed);
  const metrics = generateAllMetrics(incomingInputs);
  const criticalOrWarn = metrics.filter((m) => m.status !== 'nominal').length;

  let recommendedMeal = 'Balanced Meal + Vitamin D3';
  let recommendedWorkout = 'Squats 45m + Walk 30m';

  if (boneMass < 1.02) {
    recommendedMeal = 'High-calcium salmon & greens';
    recommendedWorkout = 'Heel raises & squats 60m';
  } else if (incomingInputs.systolicBp >= 140) {
    recommendedMeal = 'Low-salt meal & water';
    recommendedWorkout = 'Light bike 25m + Slow breathing';
  } else if (incomingInputs.radiationRate > 45) {
    recommendedMeal = 'Berry & antioxidant meal';
    recommendedWorkout = 'Stay inside safe room';
  }

  const crew = buildInitialCrew();
  crew[0] = {
    ...crew[0],
    vitals: {
      ...crew[0].vitals,
      systolicBp: incomingInputs.systolicBp,
      diastolicBp: incomingInputs.diastolicBp,
      heartRate: incomingInputs.heartRate,
      spo2: incomingInputs.spo2,
      radiationRate: incomingInputs.radiationRate,
      boneMass,
      ultrasonicSos: incomingInputs.tibialSoundSpeed,
      cabinCo2: incomingInputs.cabinCo2,
      steps: incomingInputs.steps,
      calories: incomingInputs.calories,
    },
    mealPlan: recommendedMeal,
    exerciseProtocol: recommendedWorkout,
  };

  res.status(200).json({
    ok: true,
    lastCloudAnalysis: {
      syncedAt: new Date().toISOString().slice(11, 19),
      packetsProcessed: packets,
      boneDensityStatus: `${boneMass} g/cm² (T ${tScore})`,
      recommendedMeal,
      recommendedWorkout,
      alertsCount: criticalOrWarn,
    },
    crew,
  });
}
