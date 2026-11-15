import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildInitialCrew,
  computeBoneMetricsFromSoundWave,
  DEFAULT_SENSOR_INPUTS,
  evaluateCrewMemberStatus,
  generateAllMetrics,
  LiveSensorInputs,
} from './src/utils/metricsEngine.ts';
import { queryAi } from './src/utils/aiClient.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  let serverSensorInputs: LiveSensorInputs = { ...DEFAULT_SENSOR_INPUTS };
  let serverCrew = buildInitialCrew();
  let cloudSyncCount = 1;
  let lastCloudAnalysis = {
    syncedAt: new Date().toISOString().slice(11, 19),
    packetsProcessed: 10,
    boneDensityStatus: 'Normal (1.18 g/cm²)',
    recommendedMeal: 'Balanced Meal + Vitamin D3',
    recommendedWorkout: 'Squats 45m + Walk 30m',
    alertsCount: 0,
  };

  // GET /api/state — live backend state including all 10 crewmates
  app.get('/api/state', (_req, res) => {
    const metrics = generateAllMetrics(serverSensorInputs);
    res.json({
      sensorInputs: serverSensorInputs,
      crew: serverCrew,
      metricsCount: metrics.length,
      lastCloudAnalysis,
      cloudSyncCount,
    });
  });

  // POST /api/aegis-ai — Watch & Board AI endpoint
  app.post('/api/aegis-ai', async (req, res) => {
    const visitorId = String(req.body?.visitorId || 'watch-user');
    const query = String(req.body?.query || '').trim();
    const watchDbSnapshot = req.body?.watchDbSnapshot || {};
    const crewSnapshot = Array.isArray(req.body?.crewSnapshot)
      ? req.body.crewSnapshot
      : serverCrew.map((c) => ({
          name: c.name,
          role: c.role,
          location: c.moduleLocation,
          status: c.status,
          summary: c.conditionSummary,
          action: c.actionRequired,
          bp: `${c.vitals.systolicBp}/${c.vitals.diastolicBp}`,
          hr: c.vitals.heartRate,
          spo2: c.vitals.spo2,
          bone: c.vitals.boneMass,
          rad: c.vitals.radiationRate,
          co2: c.vitals.cabinCo2,
        }));

    if (!query) {
      res.status(400).json({ error: 'Query is required.' });
      return;
    }

    const systemPrompt = [
      'You are AegisAI, a cheerful and helpful health assistant on the Aegis Watch and Aegis Board.',
      'Use simple, easy words (CEFR B2 level or below). Keep sentences short and clear (max 60 words total).',
      'Use the watch telemetry and the 10 crewmates status data provided below to answer accurately.',
    ].join(' ');

    const userPrompt = [
      `WATCH_TELEMETRY: ${JSON.stringify(watchDbSnapshot)}`,
      `CREWMATES_10: ${JSON.stringify(crewSnapshot)}`,
      `USER_QUESTION: ${query}`,
    ].join('\n');

    const result = await queryAi({
      systemPrompt,
      userPrompt,
      maxTokens: 160,
      temperature: 0.3,
    });

    res.json({
      reply: result.reply,
      mode: 'ai',
      model: result.modelUsed,
      provider: result.provider,
      latencyMs: result.latencyMs,
      visitorId,
    });
  });

  // POST /api/board-ai — Dedicated Commander Aegis Board AI Assistance endpoint
  app.post('/api/board-ai', async (req, res) => {
    const query = String(
      req.body?.query ||
        req.body?.question ||
        'Summarize all 10 crewmates health status and top actions.'
    ).trim();
    const crewList = Array.isArray(req.body?.crew)
      ? req.body.crew
      : Array.isArray(req.body?.crewSnapshot)
      ? req.body.crewSnapshot
      : serverCrew;
    const activeEmergencies = Array.isArray(req.body?.emergencies) ? req.body.emergencies : [];

    const compactCrew = crewList.map((c: typeof serverCrew[number]) => ({
      name: c.name,
      role: c.role,
      location: c.moduleLocation,
      status: c.status,
      summary: c.conditionSummary,
      suggestion: c.actionRequired,
      bp: `${c.vitals?.systolicBp}/${c.vitals?.diastolicBp}`,
      hr: c.vitals?.heartRate,
      spo2: c.vitals?.spo2,
      boneMass: c.vitals?.boneMass,
      radiation: c.vitals?.radiationRate,
      co2: c.vitals?.cabinCo2,
      steps: c.vitals?.steps,
    }));

    const systemPrompt = [
      'You are Aegis Board AI, helping the mission commander monitor 10 crewmates.',
      'Use simple, clear words (CEFR B2 or below). Keep sentences concise and actionable.',
      'Summarize who is healthy, who has a warning or emergency, and what simple actions to take.',
    ].join(' ');

    const userPrompt = [
      `ACTIVE_EMERGENCIES: ${JSON.stringify(activeEmergencies)}`,
      `ALL_10_CREWMATES: ${JSON.stringify(compactCrew)}`,
      `COMMANDER_REQUEST: ${query}`,
    ].join('\n');

    const result = await queryAi({
      systemPrompt,
      userPrompt,
      maxTokens: 220,
      temperature: 0.3,
    });

    res.json({
      ok: true,
      reply: result.reply,
      model: result.modelUsed,
      provider: result.provider,
      latencyMs: result.latencyMs,
    });
  });

  // POST /api/sync — sync detector packets & update crewmate 1
  app.post('/api/sync', (req, res) => {
    const incomingInputs: LiveSensorInputs = {
      ...serverSensorInputs,
      ...(req.body?.sensorInputs || {}),
    };
    serverSensorInputs = incomingInputs;
    const packets = Number(req.body?.queuedPackets || 10);

    const { boneMass, tScore } = computeBoneMetricsFromSoundWave(
      serverSensorInputs.tibialSoundSpeed
    );
    const metrics = generateAllMetrics(serverSensorInputs);
    const criticalOrWarn = metrics.filter((m) => m.status !== 'nominal').length;

    let recommendedMeal = 'Balanced Meal + Vitamin D3';
    let recommendedWorkout = 'Squats 45m + Walk 30m';

    if (boneMass < 1.02) {
      recommendedMeal = 'High-calcium salmon & greens';
      recommendedWorkout = 'Heel raises & squats 60m';
    } else if (serverSensorInputs.systolicBp >= 140) {
      recommendedMeal = 'Low-salt meal & water';
      recommendedWorkout = 'Light bike 25m + Slow breathing';
    } else if (serverSensorInputs.radiationRate > 45) {
      recommendedMeal = 'Berry & antioxidant meal';
      recommendedWorkout = 'Stay inside safe room';
    }

    cloudSyncCount += 1;
    lastCloudAnalysis = {
      syncedAt: new Date().toISOString().slice(11, 19),
      packetsProcessed: packets,
      boneDensityStatus: `${boneMass} g/cm² (T ${tScore})`,
      recommendedMeal,
      recommendedWorkout,
      alertsCount: criticalOrWarn,
    };

    serverCrew[0] = {
      ...serverCrew[0],
      vitals: {
        ...serverCrew[0].vitals,
        systolicBp: serverSensorInputs.systolicBp,
        diastolicBp: serverSensorInputs.diastolicBp,
        heartRate: serverSensorInputs.heartRate,
        spo2: serverSensorInputs.spo2,
        radiationRate: serverSensorInputs.radiationRate,
        boneMass,
        ultrasonicSos: serverSensorInputs.tibialSoundSpeed,
        cabinCo2: serverSensorInputs.cabinCo2,
        steps: serverSensorInputs.steps,
        calories: serverSensorInputs.calories,
      },
      mealPlan: recommendedMeal,
      exerciseProtocol: recommendedWorkout,
    };

    res.json({
      ok: true,
      lastCloudAnalysis,
      crew: serverCrew,
    });
  });

  // POST /api/crew/update — save crewmate threshold or meal/workout plan
  app.post('/api/crew/update', (req, res) => {
    const incoming = req.body?.member || req.body;
    if (incoming && incoming.id) {
      serverCrew = serverCrew.map((c) => {
        if (c.id !== incoming.id) return c;
        const merged = { ...c, ...incoming };
        const evalRes = evaluateCrewMemberStatus(merged);
        return {
          ...merged,
          status: evalRes.status,
          conditionSummary:
            evalRes.reasons.length > 0 ? evalRes.reasons[0] : merged.conditionSummary,
        };
      });
    }
    res.json({ ok: true, crew: serverCrew });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Aegis server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
