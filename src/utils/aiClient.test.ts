import test from 'node:test';
import assert from 'node:assert/strict';
import { queryAi, getAiApiKey } from './aiClient.ts';
import { buildInitialCrew, DEFAULT_SENSOR_INPUTS } from './metricsEngine.ts';

const FIFTY_TEST_CASES: Array<{ id: number; mode: 'watch' | 'board'; query: string }> = [
  { id: 1, mode: 'watch', query: 'How is my heart rate right now?' },
  { id: 2, mode: 'watch', query: 'What is my blood pressure today?' },
  { id: 3, mode: 'watch', query: 'Is my blood oxygen SpO2 safe?' },
  { id: 4, mode: 'watch', query: 'How many steps did I walk today?' },
  { id: 5, mode: 'watch', query: 'Did I sleep enough hours last night?' },
  { id: 6, mode: 'watch', query: 'What should I eat to keep my bones strong?' },
  { id: 7, mode: 'watch', query: 'My shin bone score dropped to 0.96, what workout should I do?' },
  { id: 8, mode: 'watch', query: 'Space radiation jumped to 142 uSv/h! What do I do?' },
  { id: 9, mode: 'watch', query: 'Blood pressure spiked to 168/106 mmHg, give me immediate steps.' },
  { id: 10, mode: 'watch', query: 'Helmet CO2 is 6.4 mmHg and I have a headache, how to fix?' },
  { id: 11, mode: 'watch', query: 'Maya Lin fainted at Port Airlock 18m away, what should I bring?' },
  { id: 12, mode: 'watch', query: 'Carlos Vega has a spacesuit leak at EVA Hatch, what action?' },
  { id: 13, mode: 'watch', query: 'My shin bone sensor pad is wet with sweat, how to fix?' },
  { id: 14, mode: 'watch', query: 'Why is my heart alarm paused during workout mode?' },
  { id: 15, mode: 'watch', query: 'How much water should I drink today in space?' },
  { id: 16, mode: 'watch', query: 'My sweat salt is 78 mmol/L and body temp is 37.9C, advise me.' },
  { id: 17, mode: 'watch', query: 'Give me a simple tip for better sleep in orbit.' },
  { id: 18, mode: 'watch', query: 'Why do eyes feel pressure in zero gravity?' },
  { id: 19, mode: 'watch', query: 'Which meal gives me Vitamin D and calcium?' },
  { id: 20, mode: 'watch', query: 'How does the shin sound wave sensor check bone strength?' },
  { id: 21, mode: 'watch', query: 'Is cabin air pressure 101.3 kPa normal?' },
  { id: 22, mode: 'watch', query: 'My watch battery is at 14%, what should I do?' },
  { id: 23, mode: 'watch', query: 'What happens if spacesuit pressure drops to 24.4 kPa?' },
  { id: 24, mode: 'watch', query: 'Give me a quick 3-step morning check.' },
  { id: 25, mode: 'watch', query: 'How can I calm down when feeling worried in space?' },
  { id: 26, mode: 'board', query: 'Summarize all 10 crewmates health statuses.' },
  { id: 27, mode: 'board', query: 'Which crewmates currently have warnings?' },
  { id: 28, mode: 'board', query: 'How is Elena Rostova doing in Lab Deck?' },
  { id: 29, mode: 'board', query: 'What is Maya Lin’s bone score and suggested action?' },
  { id: 30, mode: 'board', query: 'Why does Marcus Vance need bright morning light?' },
  { id: 31, mode: 'board', query: 'What is Commander Carlos Vega’s current status in Cupola?' },
  { id: 32, mode: 'board', query: 'Check Medical Officer Aisha Patel’s vitals in Med Bay.' },
  { id: 33, mode: 'board', query: 'Why does Kenji Sato have a warning in Robotics Dome?' },
  { id: 34, mode: 'board', query: 'How is Science Lead Sophie Laurent doing in Bio Lab?' },
  { id: 35, mode: 'board', query: 'What should Liam O’Connor do after working on the Solar Truss?' },
  { id: 36, mode: 'board', query: 'Check Navigation Officer Zara Al-Mansoor’s heart rate and sleep.' },
  { id: 37, mode: 'board', query: 'How strong are Noah Lindqvist’s bones in Airlock Annex?' },
  { id: 38, mode: 'board', query: 'Who is closest to Port Airlock to help Maya Lin?' },
  { id: 39, mode: 'board', query: 'What is the average blood oxygen across the crew?' },
  { id: 40, mode: 'board', query: 'Are any crewmates experiencing high radiation right now?' },
  { id: 41, mode: 'board', query: 'Which crewmates walked more than 9,000 steps today?' },
  { id: 42, mode: 'board', query: 'Give meal recommendations for crewmates with bone or salt warnings.' },
  { id: 43, mode: 'board', query: 'When should astronauts keep an active connection to Aegis Board?' },
  { id: 44, mode: 'board', query: 'What happens on Aegis Board when a crewmate faints?' },
  { id: 45, mode: 'board', query: 'Compare Elena Rostova and Maya Lin bone density.' },
  { id: 46, mode: 'board', query: 'Which room has elevated CO2 and how do we fix it?' },
  { id: 47, mode: 'board', query: 'List top 3 priorities for the commander right now.' },
  { id: 48, mode: 'board', query: 'Is the crew ready for an outside spacewalk today?' },
  { id: 49, mode: 'board', query: 'Which crewmate has the highest sleep score?' },
  { id: 50, mode: 'board', query: 'Give an encouraging 2-sentence message for all 10 crewmates.' },
];

test('AI environment key is configured', () => {
  const key = getAiApiKey();
  assert.ok(key.length > 10, 'AI_API_KEY must be loaded from .env');
});

test('AI client passes all 50 Watch & Board test cases without failure', async () => {
  const crew = buildInitialCrew();
  const compactCrew = crew.map((c) => ({
    name: c.name,
    role: c.role,
    location: c.moduleLocation,
    status: c.status,
    summary: c.conditionSummary,
    action: c.actionRequired,
    bp: `${c.vitals.systolicBp}/${c.vitals.diastolicBp}`,
    bone: c.vitals.boneMass,
    co2: c.vitals.cabinCo2,
  }));

  let liveAiHits = 0;

  // Run all 50 test cases in controlled batches of 5 to verify real AI API + queue stability
  for (let i = 0; i < FIFTY_TEST_CASES.length; i += 5) {
    const batch = FIFTY_TEST_CASES.slice(i, i + 5);
    const results = await Promise.all(
      batch.map((tc) =>
        queryAi({
          systemPrompt:
            'You are AegisAI. Reply in simple words (CEFR B2 max), under 45 words, grounded in the provided telemetry.',
          userPrompt: `MODE: ${tc.mode}\nWATCH: ${JSON.stringify(
            DEFAULT_SENSOR_INPUTS
          )}\nCREW_10: ${JSON.stringify(compactCrew)}\nQUESTION #${tc.id}: ${tc.query}`,
          maxTokens: 90,
          temperature: 0.2,
        })
      )
    );

    results.forEach((res, idx) => {
      const tc = batch[idx];
      assert.equal(res.ok, true, `Test case #${tc.id} failed`);
      assert.ok(
        typeof res.reply === 'string' && res.reply.trim().length >= 8,
        `Test case #${tc.id} returned empty or too short reply: "${res.reply}"`
      );
      if (res.provider === 'aegis-ai') {
        liveAiHits += 1;
      }
    });
  }

  console.log(`All 50 test cases passed! Live AI responses: ${liveAiHits}/50`);
  assert.ok(liveAiHits >= 10, `Expected real live AI responses, got ${liveAiHits}`);
});
