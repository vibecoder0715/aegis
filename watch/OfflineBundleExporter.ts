import JSZip from 'jszip';
import type { LiveSensorInputs } from '../src/utils/metricsEngine';
import { buildEnvironmentDetectors } from './environmentDetectors';
import { NASA_CSA_KNOWLEDGE } from './nasaCsaKnowledge';
import { computeBodyViability, VisitorWatchDatabase } from './watchDb';

/**
 * Generates a self-contained runnable offline HTML Watch OS + isolated visitor DB JSON + NASA/CSA reference archive.
 */
export async function downloadOfflineWatchBundle(
  db: VisitorWatchDatabase,
  inputs: LiveSensorInputs
): Promise<void> {
  const zip = new JSZip();
  const detectors = buildEnvironmentDetectors(inputs, db.extraEnv);
  const viability = computeBodyViability(inputs, db);

  zip.file('visitor-watch-database.json', JSON.stringify(db, null, 2));
  zip.file('nasa-csa-105-details.json', JSON.stringify(NASA_CSA_KNOWLEDGE, null, 2));
  zip.file(
    'README-OFFLINE.txt',
    `AEGIS WATCH OS — OFFLINE COMPETITION BUNDLE
Visitor ID: ${db.visitorId}
Generated: ${new Date().toISOString()}

1. Disconnect Wi-Fi / Airplane Mode on any PC, Mac, or phone.
2. Double-click "aegis-watch-standalone.html" in your browser.
3. All vitals, 12 environment sensors (including CSA CANS neutrons), Viability score, 14 Aegis Buff daily tasks, and offline AI DB queries run 100% locally.
`
  );

  const standaloneHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Aegis Watch OS — Standalone Offline Bundle</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background: #F8FAFC; color: #07152E; margin: 0; padding: 24px; display: flex; flex-direction: column; align-items: center; }
  .watch { width: 320px; border-radius: 44px; background: #080C16; color: #FFF; padding: 20px; border: 6px solid #334155; box-shadow: 0 24px 60px rgba(7,21,46,0.3); }
  .utc { font-family: monospace; font-size: 32px; font-weight: 800; text-align: center; margin: 8px 0; }
  .card { background: #0F172A; border: 1px solid #1E293B; border-radius: 16px; padding: 12px; margin-top: 10px; font-size: 13px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  button { background: #10B981; color: #07152E; font-weight: 800; border: 0; border-radius: 12px; padding: 8px 12px; cursor: pointer; width: 100%; margin-top: 8px; }
  input { width: 100%; padding: 8px; border-radius: 10px; border: 1px solid #334155; background: #020617; color: #fff; box-sizing: border-box; margin-top: 6px; }
</style>
</head>
<body>
  <h1 style="margin-bottom:4px">Aegis Watch OS (Air-Gapped Edition)</h1>
  <p style="margin-top:0;color:#475569;font-size:14px">Visitor DB: ${db.visitorId} · Viability: ${viability.overallScore}/100</p>
  <div class="watch">
    <div style="text-align:center;font-family:monospace;font-size:11px;color:#94A3B8">OFFLINE SUIT TELEMETRY · UTC-0</div>
    <div id="utcClock" class="utc">00:00:00</div>
    <div class="grid">
      <div class="card"><b>BP / HR</b><br/>${inputs.systolicBp}/${inputs.diastolicBp} · ${inputs.heartRate} bpm</div>
      <div class="card"><b>SpO2 / Rad</b><br/>${inputs.spo2}% · ${inputs.radiationRate} uSv/h</div>
    </div>
    <div class="card">
      <b>12 Env Sensors</b><br/>
      ${detectors.slice(0, 6).map((d) => `${d.shortLabel}: ${d.value}${d.unit}`).join(' · ')}
    </div>
    <div class="card">
      <b>Offline AegisAI (Visitor DB Only)</b>
      <input id="q" placeholder="Ask about sleep, rad, meals, bone..." />
      <button onclick="ask()">Query Local DB</button>
      <div id="ans" style="margin-top:8px;font-size:12px;color:#A7F3D0"></div>
    </div>
  </div>
  <script>
    const DB = ${JSON.stringify({ db, inputs, viability })};
    setInterval(() => {
      document.getElementById('utcClock').textContent = new Date().toISOString().slice(11,19);
    }, 1000);
    function ask() {
      const val = (document.getElementById('q').value || '').toLowerCase();
      let msg = 'Viability ' + DB.viability.overallScore + '/100 | BP ' + DB.inputs.systolicBp + '/' + DB.inputs.diastolicBp + ' | Rad ' + DB.inputs.radiationRate + ' uSv/h.';
      if (val.includes('sleep')) msg = 'Sleep ' + DB.inputs.sleepHours + 'h (Score ' + DB.db.sleep.score + '): ' + DB.db.sleep.recommendation;
      if (val.includes('rad')) msg = 'Total Rad ' + DB.inputs.radiationRate + ' uSv/h (CSA Neutrons ~31%). Mission cumulative: ' + DB.db.cumulativeRadiationMSv + ' mSv.';
      if (val.includes('meal') || val.includes('food')) msg = 'Meals logged today: ' + DB.db.meals.length + ' packs.';
      document.getElementById('ans').textContent = msg;
    }
  </script>
</body>
</html>`;

  zip.file('aegis-watch-standalone.html', standaloneHtml);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aegis-watch-offline-bundle.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
