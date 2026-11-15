# Aegis — Offline-First Astronaut Smartwatch OS & Health Monitor

**Aegis** is a NASA Space Apps Challenge clinical companion pairing an autonomous **Aegis Watch OS** (21 offline-capable wrist apps, 10 offline mini-games, 12 environmental detectors, and NASA HRP / CSA physiological models) with a crew-wide **Monitoring Dashboard** and an interactive hardware **Control Panel**.

---

## Core Architecture & Key Features

1. **Clean 2-View Workspace + Isolated Visitor Database**:
   - **Aegis Watch Showcase Box & Separate Control Panel**: Interactive titanium smartwatch simulator with low-alpha hardware backdrop, **Expand / Magnify** zoom button, mousewheel scroll locking, top-to-bottom **Quick Shortcuts** (Flashlight, Settings, Alarms, Do Not Disturb, Ping Suit, **+ Add Shortcut**), and right-to-left **Paginated 2×3 App Launcher**.
   - **Per-Visitor Isolated Database**: Every browser visitor runs inside their own isolated `visitorId` storage partition (`localStorage` + `IndexedDB` media store).
   - **Scoped Visual Emergencies**: Threshold breaches flash **only inside the watch screen** with a clear action and **Acknowledge** button, while Web Audio alarms and `navigator.vibrate` haptic pulses alert globally.
2. **21 Full Watch Apps + 10 Playable Offline Mini-Games**:
   - `Sleep` (UTC-0 REM/Deep/Light/Awake exact stages & guidance), `Nutritions` (Breakfast/Lunch/Dinner + Ca/D3/Na+ guidance), `Emotions` (continuous smooth vector astronaut), `Clock` (Timer, Alarms, Stopwatch), `Music` (4 Web Audio synthesized offline tracks), `Camera` (Beautify filter + **Smart Detector** offline equipment & food ID + Video/Photo to IndexedDB), `Gallery`, `Calculator`, `Environment` (**12 dynamic spacecraft detectors + live JSON**), `Health Insights`, `Workout` (`3, 2, 1, GO!` session launcher), `Aegis Buff!` (**14 daily tasks**, XP/Leveling synced to Monitoring Dashboard, + cute **Planet Builder** shop), `Notepad`, `Recorder` (voice memos in IndexedDB), `AegisAI` (strictly greps current visitor's local DB; powered by Gemini 4 Hydrogen when online + instant offline medical engine), `Calendar`, `Pulse Wave` (live ECG/PPG trace), `SpO2`, `Radiomeasure` (**CSA CANS neutron vs. proton tracking**), `Viability` (clickable astronaut anatomy map), and `Mini Games` (`2048`, `Piano Tiles`, `Space Snake`, `Asteroid Dodge`, `Memory Match`, `Reaction Reflex`, `Tic-Tac-Toe`, `Simon Sound`, `Slide Puzzle`, `Brick Breaker`).
3. **Offline PWA & One-Click Offline Competition Bundle**:
   - Install directly as a **Progressive Web App (PWA)** using Service Worker caching, or click **Download Offline Watch OS Bundle** inside the Control Panel to download a self-contained runnable offline HTML Watch OS + visitor DB export.

---

## 100+ Integrated NASA HRP & CSA Metrics & Conditions (Summary)

Our application embeds **105 verified research findings** (21+ details per source) across these 5 resources:
- **NASA HRP 5 Hazards** (`https://www.nasa.gov/hrp/hazards/`): Space Radiation (GCR/SPE, water-wall shielding), Altered Gravity (headward fluid shift, 1%/mo bone loss, orthostatic dizziness), Isolation & Confinement (circadian desynchrony from 90-min orbital dawns), Distance from Earth (20-min comms lag autonomous triage), Hostile Closed Environments (zero-G CO₂ pockets, microbe shifts, acoustic fatigue).
- **NASA HRP Risks** (`https://www.nasa.gov/hrp/risks/`): SANS globe flattening, EVA decompression sickness, hypobaric hypoxia, immune reactivation, atrial arrhythmias, muscle atrophy, inadequate nutrition/high sodium bone loss, lens cataracts, arterial stiffness.
- **NASA Ongoing Research** (`https://www.nasa.gov/hrp/ongoing-hrp-research/`): CIPHER 14-study protocol, B-Complex SANS prevention, Brassard thigh cuffs, Standard Measures, manual piloting simulations, CHAPEA & HERA analogs, LBNP, non-invasive sweat biomarkers.
- **CSA Radiation Monitoring** (`https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp`): Secondary neutrons (~30% of ISS astronaut dose), **CANS (Canadian Active Neutron Spectrometer)** real-time spectral tracking, Radi-N heritage, marrow/eye lens budgets, Earth proton-therapy spin-offs.
- **CSA Space Science** (`https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp`): Accelerated aging & osteoporosis models, insulin resistance, Vascular arterial echo, TBone trabecular beams, Bio-Analyzer, MARROW fat shifts, Astroskin garment, autonomous Moon/Mars readiness.

See **`AI.md`** for Llama 3.2 1B edge fine-tuning/quantization details and **`Solution.md`** for full metric edge-case engineering.

---

## Running Locally

```bash
npm install
npm run dev
# Runs Express + Vite SPA on http://localhost:3000
```

Run verification & fuzz tests:
```bash
npx --yes tsx --test src/utils/metricsEngine.test.ts watch/watchEngine.test.ts
```
