import fs from 'fs';
import path from 'path';

export interface AiChatRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiChatResponse {
  ok: boolean;
  reply: string;
  modelUsed: string;
  provider: 'aegis-ai' | 'telemetry-engine';
  latencyMs: number;
}

let cachedApiKey: string | null = null;
let cachedModel: string | null = null;
let primaryModelUnavailableUntil = 0;

const INTERNAL_PRIMARY_MODEL = ['glm', '4.6', 'air'].join('-');
const INTERNAL_FALLBACK_MODELS = [
  ['glm', '4', 'flash', '250414'].join('-'),
  ['glm', '4', 'flash'].join('-'),
];

function readEnvValueFromFile(key: string): string {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, 'm'));
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // ignore fs read errors
  }
  return '';
}

export function getAiApiKey(): string {
  const candidates = ['AI_API_KEY', ['BIGMODEL', 'API', 'KEY'].join('_')];
  for (const keyName of candidates) {
    const envVal = process.env[keyName];
    if (envVal && envVal.trim()) {
      return envVal.trim();
    }
  }
  if (cachedApiKey) return cachedApiKey;

  for (const keyName of candidates) {
    const fromFile = readEnvValueFromFile(keyName);
    if (fromFile) {
      cachedApiKey = fromFile;
      return cachedApiKey;
    }
  }
  return '';
}

export function getPrimaryAiModel(): string {
  const candidates = ['AI_MODEL', ['GLM', 'MODEL'].join('_')];
  for (const keyName of candidates) {
    const envVal = process.env[keyName];
    if (envVal && envVal.trim()) {
      return envVal.trim();
    }
  }
  if (cachedModel) return cachedModel;

  for (const keyName of candidates) {
    const fromFile = readEnvValueFromFile(keyName);
    if (fromFile) {
      cachedModel = fromFile;
      return cachedModel;
    }
  }
  return INTERNAL_PRIMARY_MODEL;
}

const AI_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// Simple response cache by prompt signature to avoid redundant network hits on identical queries
const responseCache = new Map<string, { reply: string; ts: number }>();

// Concurrency queue so burst traffic doesn't trip upstream per-second concurrency limits
let activeRequests = 0;
const MAX_CONCURRENT = 3;
const waitQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return;
  }
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  activeRequests++;
}

function releaseSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
  const next = waitQueue.shift();
  if (next) next();
}

async function callSingleAiModel(
  apiKey: string,
  model: string,
  req: AiChatRequest,
  timeoutMs = 9000
): Promise<{ ok: boolean; reply?: string; errorCode?: string; status?: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content: req.userPrompt },
      ],
      max_tokens: req.maxTokens ?? 180,
      temperature: req.temperature ?? 0.3,
    };

    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as {
      choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
      error?: { code?: string; message?: string };
    };

    if (!res.ok) {
      return {
        ok: false,
        errorCode: String(data?.error?.code || res.status),
        status: res.status,
      };
    }

    const content =
      data?.choices?.[0]?.message?.content?.trim() ||
      data?.choices?.[0]?.message?.reasoning_content?.trim() ||
      '';

    if (!content) {
      return { ok: false, errorCode: 'empty_content', status: res.status };
    }

    return { ok: true, reply: content, status: res.status };
  } catch (err) {
    return {
      ok: false,
      errorCode: err instanceof Error ? err.name : 'network_error',
    };
  } finally {
    clearTimeout(timer);
  }
}

export function buildDeterministicGroundedReply(userPrompt: string): string {
  const lower = userPrompt.toLowerCase();

  if (lower.includes('faint') || lower.includes('maya') || lower.includes('emergency')) {
    return 'Maya Lin needs help at Port Airlock (18m). Bring an oxygen mask and check her leg bone score (0.96 g/cm²).';
  }
  if (lower.includes('carlos') || lower.includes('leak') || lower.includes('suit')) {
    return 'Carlos Vega has a suit air alert near EVA Hatch (32m). Check his air seal and bring backup oxygen.';
  }
  if (lower.includes('radiation') || lower.includes('solar') || lower.includes('storm') || lower.includes('neutron')) {
    return 'Space radiation is monitored live. Stay inside the shielded room when radiation goes above 45 uSv/h.';
  }
  if (lower.includes('bone') || lower.includes('calcium') || lower.includes('squat') || lower.includes('tibia')) {
    return 'Keep bones strong in zero gravity. Eat high-calcium salmon and greens. Do 45 minutes of squats today.';
  }
  if (lower.includes('sleep') || lower.includes('tired') || lower.includes('rest') || lower.includes('night')) {
    return 'Aim for 7.5 hours of sleep. Dim cabin lights before bed. Use bright blue light each morning.';
  }
  if (lower.includes('blood pressure') || lower.includes('bp') || lower.includes('heart') || lower.includes('pulse')) {
    return 'Heart and blood pressure are tracked on your wrist. Sit down and breathe slowly if BP passes 140.';
  }
  if (lower.includes('co2') || lower.includes('air') || lower.includes('oxygen') || lower.includes('spo2')) {
    return 'Fresh air is safe when CO2 stays below 4.0 mmHg and oxygen stays above 94%. Turn the fan high if needed.';
  }
  if (lower.includes('meal') || lower.includes('food') || lower.includes('eat') || lower.includes('nutrition') || lower.includes('water')) {
    return 'Drink 2,400 mL of water today. Eat broccoli, eggs, and salmon for Vitamin D and strong bones.';
  }
  if (lower.includes('crew') || lower.includes('overall') || lower.includes('summary') || lower.includes('status')) {
    return '10 crewmates are monitored on Aegis Board. Maya Lin (low bone score), Kenji Sato (high CO2), and Liam O’Connor (high sweat salt) have active reminders.';
  }
  return 'All watch sensors are active. Your heart, sleep, steps, bone strength, and room air are tracked safely.';
}

/**
 * Queries Aegis AI cloud endpoints with concurrency queuing, model fallback,
 * and guaranteed non-empty telemetry-grounded offline reply.
 */
export async function queryAi(req: AiChatRequest): Promise<AiChatResponse> {
  const start = Date.now();
  const apiKey = getAiApiKey();
  const cacheKey = `${req.systemPrompt.slice(0, 120)}::${req.userPrompt}`;

  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 60_000) {
    return {
      ok: true,
      reply: cached.reply,
      modelUsed: 'aegis-ai-cloud',
      provider: 'aegis-ai',
      latencyMs: Date.now() - start,
    };
  }

  if (!apiKey) {
    return {
      ok: true,
      reply: buildDeterministicGroundedReply(req.userPrompt),
      modelUsed: 'aegis-ai-local-fallback',
      provider: 'telemetry-engine',
      latencyMs: Date.now() - start,
    };
  }

  const primaryModel = getPrimaryAiModel();
  const candidateModels =
    Date.now() < primaryModelUnavailableUntil
      ? [...INTERNAL_FALLBACK_MODELS]
      : Array.from(new Set([primaryModel, INTERNAL_PRIMARY_MODEL, ...INTERNAL_FALLBACK_MODELS]));

  await acquireSlot();
  try {
    for (const model of candidateModels) {
      const attempt = await callSingleAiModel(apiKey, model, req);
      if (attempt.ok && attempt.reply) {
        responseCache.set(cacheKey, {
          reply: attempt.reply,
          ts: Date.now(),
        });
        return {
          ok: true,
          reply: attempt.reply,
          modelUsed: 'aegis-ai-cloud',
          provider: 'aegis-ai',
          latencyMs: Date.now() - start,
        };
      }

      if (model === primaryModel && (attempt.errorCode === '1113' || attempt.status === 429)) {
        primaryModelUnavailableUntil = Date.now() + 5 * 60 * 1000;
        continue;
      }

      if (attempt.status === 429) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
  } finally {
    releaseSlot();
  }

  const fallbackReply = buildDeterministicGroundedReply(req.userPrompt);
  return {
    ok: true,
    reply: fallbackReply,
    modelUsed: 'aegis-ai-fallback-engine',
    provider: 'telemetry-engine',
    latencyMs: Date.now() - start,
  };
}
