import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAllMetrics,
  evaluateWatchAlert,
  buildInitialCrew,
  evaluateCrewMemberStatus,
  computeBoneMetricsFromSoundWave,
  DETECTOR_SPECS,
  DEFAULT_SENSOR_INPUTS,
  CLINICAL_CONDITIONS_MATRIX,
  getAstronautEmotionFromState,
  situationToSensorInputs,
} from './metricsEngine';

test('generateAllMetrics produces 525 measurable metrics with live sensor inputs', () => {
  const metrics = generateAllMetrics('nominal');
  assert.equal(metrics.length, 525);

  const boneMass = metrics.find((m) => m.key === 'bone_mass');
  const systolicBp = metrics.find((m) => m.key === 'blood_pressure_systolic');
  const radiationRate = metrics.find((m) => m.key === 'radiation_dose_rate');

  assert.ok(boneMass);
  assert.ok(systolicBp);
  assert.ok(radiationRate);
  assert.equal(boneMass.status, 'nominal');
});

test('computeBoneMetricsFromSoundWave calculates real BMD and transit time', () => {
  const normal = computeBoneMetricsFromSoundWave(3915);
  assert.equal(normal.boneMass, 1.18);
  assert.ok(normal.transitTimeUs > 35 && normal.transitTimeUs < 40);

  const low = computeBoneMetricsFromSoundWave(3640);
  assert.ok(low.boneMass < 1.0);
  assert.ok(low.tScore < -1.5);
});

test('situation triggers and custom sensor sliders update watch alerts accurately', () => {
  const bpMetrics = generateAllMetrics({ ...DEFAULT_SENSOR_INPUTS, systolicBp: 168 });
  const systolic = bpMetrics.find((m) => m.key === 'blood_pressure_systolic');
  assert.ok(systolic);
  assert.equal(systolic.status, 'critical');
  assert.equal(systolic.value, 168);

  const alert = evaluateWatchAlert('bp_spike');
  assert.equal(alert.active, true);
  assert.equal(alert.severity, 'critical');
  assert.equal(alert.vibrating, true);

  const peerAlert = evaluateWatchAlert('peer_faint');
  assert.equal(peerAlert.isPeerAlert, true);
  assert.equal(peerAlert.peerName, 'Maya Lin');
  assert.equal(peerAlert.peerDistanceMeters, 18);
});

test('exercise mode suppresses false cardiovascular alarm', () => {
  const workoutMetrics = generateAllMetrics('exercise_mode');
  const hr = workoutMetrics.find((m) => m.key === 'heart_rate');
  assert.ok(hr);
  assert.equal(hr.value, 148);
  assert.equal(hr.status, 'nominal');
});

test('evaluateCrewMemberStatus detects bone loss and custom threshold breaches', () => {
  const crew = buildInitialCrew();
  assert.equal(crew.length, 4);
  assert.equal(DETECTOR_SPECS.length, 7);

  const maya = crew[1];
  const mayaEval = evaluateCrewMemberStatus(maya);
  assert.equal(mayaEval.status, 'warning');
  assert.ok(mayaEval.reasons.some((r) => r.includes('Bone mass')));
});

test('CLINICAL_CONDITIONS_MATRIX and getAstronautEmotionFromState map metrics to emotions and actions', () => {
  assert.equal(CLINICAL_CONDITIONS_MATRIX.length, 7);
  assert.equal(getAstronautEmotionFromState('nominal', DEFAULT_SENSOR_INPUTS), 'happy');
  assert.equal(
    getAstronautEmotionFromState('high_radiation', situationToSensorInputs('high_radiation')),
    'radiation'
  );
  assert.equal(
    getAstronautEmotionFromState('bp_spike', situationToSensorInputs('bp_spike')),
    'alert'
  );
  assert.equal(
    getAstronautEmotionFromState('exercise_mode', situationToSensorInputs('exercise_mode')),
    'workout'
  );
  assert.equal(
    getAstronautEmotionFromState('nominal', { ...DEFAULT_SENSOR_INPUTS, sleepHours: 5.2 }),
    'sleepy'
  );
});

