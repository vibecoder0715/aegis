import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  buildInitialCrew,
  computeBoneMetricsFromSoundWave,
  DEFAULT_SENSOR_INPUTS,
  evaluateCrewMemberStatus,
  generateAllMetrics,
  LiveSensorInputs,
} from './src/utils/metricsEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  let serverSensorInputs: LiveSensorInputs = { ...DEFAULT_SENSOR_INPUTS };
  let serverCrew = buildInitialCrew();
  let cloudSyncCount = 1;
  let lastCloudAnalysis = {
    syncedAt: new Date().toISOString().slice(11, 19) + ' UTC',
    packetsProcessed: 7,
    boneDensityStatus: 'Normal (1.18 g/cm²)',
    recommendedMeal: 'Balanced Meal + Vitamin D3',
    recommendedWorkout: 'Resistive Squat 45m + Treadmill 30m',
    alertsCount: 0,
  };

  // GET /api/state — live backend state
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

  // POST /api/aegis-ai — Global Gemini endpoint reading strictly the visitor's own local DB snapshot
  app.post('/api/aegis-ai', async (req, res) => {
    const visitorId = String(req.body?.visitorId || 'unknown');
    const query = String(req.body?.query || '').trim();
    const watchDbSnapshot = req.body?.watchDbSnapshot || {};
    const matchedNasaCsaRefs = Array.isArray(req.body?.matchedNasaCsaRefs)
      ? req.body.matchedNasaCsaRefs
      : [];
    const imageBase64 = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';

    if (!query) {
      res.status(400).json({ error: 'Query is required.' });
      return;
    }

    if (!aiClient) {
      res.status(503).json({
        error: 'Server Gemini key unavailable; use client offline DB responder.',
        mode: 'offline-db',
      });
      return;
    }

    try {
      const systemInstruction = [
        'You are AegisAI, an aerospace smartwatch assistant inside Aegis Watch.',
        `Strictly ground EVERY factual number, meal, workout, note, radiation reading, sleep stage, or vital sign ONLY inside visitorId="${visitorId}"'s isolated watch database snapshot provided below.`,
        'Never invent metrics not present in the snapshot, never reference any other visitor, and keep replies concise, clear, bold and wrist-readable (max 90 words).',
        'Cite relevant NASA HRP or CSA guidance when appropriate.',
      ].join(' ');

      const contextText = `VISITOR_ID: ${visitorId}\nWATCH_DATABASE_SNAPSHOT:\n${JSON.stringify(
        watchDbSnapshot
      )}\nMATCHED_NASA_CSA_REFS:\n${JSON.stringify(matchedNasaCsaRefs)}\n\nUSER_QUERY: ${query}`;

      const contents = imageBase64
        ? {
            parts: [
              { inlineData: { mimeType: 'image/png', data: imageBase64 } },
              { text: contextText },
            ],
          }
        : contextText;

      const response = await aiClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const text = response.text?.trim();
      if (!text) {
        res.status(502).json({ error: 'Empty AI response', mode: 'offline-db' });
        return;
      }

      res.json({ reply: text, mode: 'gemini', visitorId });
    } catch (err) {
      console.error('AegisAI error:', err instanceof Error ? err.message : err);
      res.status(502).json({ error: 'Upstream AI error', mode: 'offline-db' });
    }
  });

  // POST /api/sync — grep buffered detector packets & run analysis
  app.post('/api/sync', (req, res) => {
    const incomingInputs: LiveSensorInputs = {
      ...serverSensorInputs,
      ...(req.body?.sensorInputs || {}),
    };
    serverSensorInputs = incomingInputs;
    const packets = Number(req.body?.queuedPackets || 7);

    const { boneMass, tScore } = computeBoneMetricsFromSoundWave(
      serverSensorInputs.tibialSoundSpeed
    );
    const metrics = generateAllMetrics(serverSensorInputs);
    const criticalOrWarn = metrics.filter((m) => m.status !== 'nominal').length;

    let recommendedMeal = 'Balanced Meal + 1,000 IU Vitamin D3';
    let recommendedWorkout = 'Resistive Squat 45m + Treadmill 30m';

    if (boneMass < 1.02) {
      recommendedMeal = 'High-Calcium (1,500 mg) Salmon & Kale + Vit D3/K2';
      recommendedWorkout = 'Heavy Heel Raises & Deadlifts 60m';
    } else if (serverSensorInputs.systolicBp >= 140) {
      recommendedMeal = 'Low-Sodium Potassium Meal + Electrolyte Water';
      recommendedWorkout = 'Light Cycle 25m + Slow Breathing';
    } else if (serverSensorInputs.radiationRate > 45) {
      recommendedMeal = 'Antioxidant Berry & Astaxanthin Ration';
      recommendedWorkout = 'Stay inside shielded berth';
    }

    cloudSyncCount += 1;
    lastCloudAnalysis = {
      syncedAt: new Date().toISOString().slice(11, 19) + ' UTC',
      packetsProcessed: packets,
      boneDensityStatus: `${boneMass} g/cm² (T-score ${tScore})`,
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

  // POST /api/crew/update — save monitoring threshold or meal plan changes
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
