import { buildInitialCrew } from '../src/utils/metricsEngine.ts';
import { queryAi } from '../src/utils/aiClient.ts';

interface ApiReq {
  method?: string;
  body?: Record<string, unknown>;
}

interface ApiRes {
  status: (code: number) => ApiRes;
  json: (data: unknown) => void;
}

export default async function handler(req: ApiReq, res: ApiRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const visitorId = String(body.visitorId || 'watch-user');
  const query = String(body.query || '').trim();
  const watchDbSnapshot = body.watchDbSnapshot || {};
  const crewSnapshot = Array.isArray(body.crewSnapshot)
    ? body.crewSnapshot
    : buildInitialCrew().map((c) => ({
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

  res.status(200).json({
    reply: result.reply,
    mode: 'ai',
    model: result.modelUsed,
    provider: result.provider,
    latencyMs: result.latencyMs,
    visitorId,
  });
}
