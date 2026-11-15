import { buildInitialCrew, CrewMember } from '../src/utils/metricsEngine.ts';
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
  const query = String(
    body.query ||
    body.question ||
    'Summarize all 10 crewmates health status and top actions.'
  ).trim();
  const crewList = Array.isArray(body.crew)
    ? body.crew
    : Array.isArray(body.crewSnapshot)
      ? body.crewSnapshot
      : buildInitialCrew();
  const activeEmergencies = Array.isArray(body.emergencies) ? body.emergencies : [];

  const compactCrew = (crewList as Array<Partial<CrewMember> & Record<string, unknown>>).map((c) => ({
    name: c.name,
    role: c.role,
    location: c.moduleLocation ?? c.location,
    status: c.status,
    summary: c.conditionSummary ?? c.summary,
    suggestion: c.actionRequired ?? c.action,
    bp: c.vitals ? `${c.vitals.systolicBp}/${c.vitals.diastolicBp}` : undefined,
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

  res.status(200).json({
    ok: true,
    reply: result.reply,
    model: result.modelUsed,
    provider: result.provider,
    latencyMs: result.latencyMs,
  });
}
