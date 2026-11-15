import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SENSOR_INPUTS,
  SituationId,
  situationToSensorInputs,
} from '../src/utils/metricsEngine';
import { NASA_CSA_KNOWLEDGE, SMART_DETECTOR_CATALOG } from './nasaCsaKnowledge';
import {
  buildEnvironmentDetectors,
  DEFAULT_EXTRA_ENV_CONTROLS,
  generateDynamicEnvironmentJson,
} from './environmentDetectors';
import {
  completeDailyBuffTask,
  computeBodyViability,
  computeLevelFromXp,
  computeNutritionTotals,
  createInitialVisitorDb,
  evaluateOfflineAiQuery,
  grepVisitorWatchDb,
  loadVisitorWatchDb,
  purchasePlanetDecorator,
} from './watchDb';
import {
  applyDetailedTogglerChange,
  buildDetailedTogglers,
  createInitialTogglerState,
  evaluateWatchAlertFromState,
  matchesSearchTokens,
  WATCH_QUICK_ACTIONS,
} from './togglerEngine';

test('NASA & CSA knowledge includes >=20 verified details for each of the 5 sites (105 total)', () => {
  assert.equal(NASA_CSA_KNOWLEDGE.length, 105);
  const sources = [
    'nasa_hazards',
    'nasa_risks',
    'nasa_ongoing',
    'csa_radiation',
    'csa_science',
  ] as const;

  for (const s of sources) {
    const items = NASA_CSA_KNOWLEDGE.filter((i) => i.sourceId === s);
    assert.ok(items.length >= 20, `Expected >=20 items for ${s}, got ${items.length}`);
  }
  assert.ok(SMART_DETECTOR_CATALOG.length >= 6);
});

test('buildEnvironmentDetectors returns 12 sensors including CSA CANS neutron (~31%) & valid JSON stream', () => {
  const detectors = buildEnvironmentDetectors(DEFAULT_SENSOR_INPUTS, DEFAULT_EXTRA_ENV_CONTROLS);
  assert.equal(detectors.length, 12);

  const cans = detectors.find((d) => d.id === 'csa_cans_neutron');
  const co2 = detectors.find((d) => d.id === 'inspired_co2');
  assert.ok(cans);
  assert.ok(co2);
  assert.ok(cans.value > 3 && cans.value < 6);
  assert.equal(co2.status, 'nominal');

  const packet = generateDynamicEnvironmentJson(
    'visitor-test-1',
    { ...DEFAULT_SENSOR_INPUTS, radiationRate: 142, cabinCo2: 6.4 },
    DEFAULT_EXTRA_ENV_CONTROLS,
    true
  );
  assert.equal(packet.detectorsCount, 12);
  assert.equal(packet.offlineAutonomous, true);
  assert.ok(packet.activeAlertsCount >= 3);
});

test('Aegis Buff! supports 14 daily tasks, XP leveling, and Planet Builder purchases', () => {
  const db = createInitialVisitorDb('visitor-buff-1');
  assert.equal(db.dailyTasks.length, 14);
  const initialPoints = db.aegisPoints;
  const firstTask = db.dailyTasks[0];

  const afterTask = completeDailyBuffTask(db, firstTask.id);
  assert.equal(afterTask.xp, db.xp + firstTask.xpReward);
  assert.equal(afterTask.aegisPoints, initialPoints + firstTask.pointsReward);
  assert.equal(afterTask.dailyTasks[0].completed, true);

  // Repeating same task is idempotent
  const duplicate = completeDailyBuffTask(afterTask, firstTask.id);
  assert.equal(duplicate.xp, afterTask.xp);

  const bought = purchasePlanetDecorator(afterTask, 'lunar_tree');
  assert.equal(bought.ok, true);
  assert.equal(bought.db.aegisPoints, afterTask.aegisPoints - 20);
  assert.equal(bought.db.placedPlanetItems.length, afterTask.placedPlanetItems.length + 1);

  const levelUp = computeLevelFromXp(475);
  assert.equal(levelUp.level, 4);
});

test('AegisAI strictly isolates per-visitor databases with zero leakage', () => {
  const dbA = loadVisitorWatchDb('visitor-alpha');
  dbA.meals.push({
    id: 'm-alpha',
    slot: 'Snack',
    name: 'Alpha Kale Ration',
    calories: 320,
    proteinG: 12,
    calciumMg: 400,
    sodiumMg: 200,
    potassiumMg: 500,
    vitDIu: 600,
    loggedAtUtc: new Date().toISOString(),
  });

  const dbB = loadVisitorWatchDb('visitor-beta');
  const grepA = grepVisitorWatchDb(dbA, DEFAULT_SENSOR_INPUTS, 'food meal check');
  const grepB = grepVisitorWatchDb(dbB, DEFAULT_SENSOR_INPUTS, 'food meal check');

  assert.equal(grepA.visitorId, 'visitor-alpha');
  assert.equal(grepB.visitorId, 'visitor-beta');
  assert.ok(JSON.stringify(grepA.snapshot).includes('Alpha Kale Ration'));
  assert.ok(!JSON.stringify(grepB.snapshot).includes('Alpha Kale Ration'));

  const nutritionA = computeNutritionTotals(dbA.meals);
  const nutritionB = computeNutritionTotals(dbB.meals);
  assert.ok(nutritionA.calories > nutritionB.calories);

  const offlineReply = evaluateOfflineAiQuery(
    'check CSA neutron radiation & storm risk',
    dbA,
    { ...DEFAULT_SENSOR_INPUTS, radiationRate: 140 }
  );
  assert.ok(offlineReply.includes('CSA CANS'));
  assert.ok(offlineReply.includes('storm shelter'));
});

test('300-iteration fuzz sweep across watch telemetry, viability, 12 env sensors & offline AI', () => {
  const situations: SituationId[] = [
    'nominal',
    'bp_spike',
    'high_radiation',
    'bone_loss_scan',
    'high_co2',
    'exercise_mode',
    'sensor_fault',
    'peer_faint',
    'peer_radiation',
  ];
  const db = createInitialVisitorDb('visitor-fuzz-300');

  for (let i = 0; i < 300; i++) {
    const sit = situations[i % situations.length];
    const base = situationToSensorInputs(sit, DEFAULT_SENSOR_INPUTS);
    const inputs = {
      ...base,
      systolicBp: 95 + ((i * 7) % 85),
      heartRate: 52 + ((i * 5) % 105),
      radiationRate: 8 + ((i * 11) % 160),
      tibialSoundSpeed: 3560 + ((i * 13) % 520),
      cabinCo2: Number((1.2 + ((i * 3) % 60) * 0.1).toFixed(1)),
      sleepHours: Number((4.5 + ((i * 2) % 50) * 0.1).toFixed(1)),
      steps: 1500 + ((i * 137) % 14000),
    };

    const viability = computeBodyViability(inputs, db);
    assert.ok(!Number.isNaN(viability.overallScore));
    assert.ok(viability.overallScore >= 0 && viability.overallScore <= 100);
    assert.equal(viability.regions.length, 6);

    const env = buildEnvironmentDetectors(inputs, DEFAULT_EXTRA_ENV_CONTROLS);
    assert.equal(env.length, 12);
    for (const r of env) {
      assert.ok(!Number.isNaN(r.value), `NaN encountered at iter ${i} for ${r.id}`);
    }

    const aiReply = evaluateOfflineAiQuery('vitals sleep bone radiation meal check', db, inputs, sit);
    assert.ok(aiReply.length > 30);
  }
});

test('Unified Toggler Engine exposes 539+ interactive togglers and reacts dynamically on Watch', () => {
  const init = createInitialTogglerState();
  const togglers = buildDetailedTogglers(init);
  assert.ok(togglers.length >= 535, `Expected >=535 togglers, got ${togglers.length}`);

  // Nominal alert should be inactive
  const nomAlert = evaluateWatchAlertFromState(init);
  assert.equal(nomAlert.active, false);

  // Quick Action: Blood Pressure Spike manipulates togglers -> Watch reacts critical
  const bpAction = WATCH_QUICK_ACTIONS.find((a) => a.id === 'qa_bp_spike');
  assert.ok(bpAction);
  const afterBp = bpAction.apply(init);
  const bpAlert = evaluateWatchAlertFromState(afterBp);
  assert.equal(bpAlert.active, true);
  assert.equal(bpAlert.severity, 'critical');
  assert.ok(bpAlert.headline.includes('Blood Pressure'));

  // Non-core detailed metric toggler (e.g. SANS intraocular pressure) triggers Watch dynamically
  const afterSans = applyDetailedTogglerChange(init, 'sans_intraocular_mmhg', 26.5);
  const sansAlert = evaluateWatchAlertFromState(afterSans);
  assert.equal(sansAlert.active, true);
  assert.ok(sansAlert.headline.includes('Eye Pressure'));

  // Steps & Sleep togglers update underlying inputs
  const afterSteps = applyDetailedTogglerChange(init, 'daily_steps_equiv', 11200);
  assert.equal(afterSteps.inputs.steps, 11200);
  const afterSleep = applyDetailedTogglerChange(afterSteps, 'sleep_duration_hr', 5.2);
  assert.equal(afterSleep.inputs.sleepHours, 5.2);
  assert.equal(evaluateWatchAlertFromState(afterSleep).active, true);

  // Stopword-aware natural search matching
  const qaMatches = WATCH_QUICK_ACTIONS.filter((a) =>
    matchesSearchTokens('spike of blood', [a.title, a.simpleDescription, a.keywords])
  );
  assert.ok(qaMatches.some((a) => a.id === 'qa_bp_spike'));

  const walkingMatches = togglers.filter((t) =>
    matchesSearchTokens('walking steps', [t.label, t.simpleHint, t.category, t.key, t.relatedMetrics])
  );
  assert.ok(walkingMatches.some((t) => t.key === 'daily_steps_equiv'));

  const sleepMatches = togglers.filter((t) =>
    matchesSearchTokens('sleep time', [t.label, t.simpleHint, t.category, t.key, t.relatedMetrics])
  );
  assert.ok(sleepMatches.some((t) => t.key === 'sleep_duration_hr'));
});

