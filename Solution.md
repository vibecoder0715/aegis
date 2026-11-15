# Solution Architecture: Metric-to-Condition-to-Action Matrix & Edge Cases

## 1. Design Philosophy: Uncrowded, Offline-First Wrist Triage

Astronauts cannot read cramped tables during solar storms, depressurization alarms, or high-CO₂ headaches. **Aegis Watch** uses a calm, uncrowded smartwatch architecture:
- **Home Watchface (UTC-0)**: Corner barometer + radiation rate, high-contrast tabular UTC-0 clock, 3 quick dials (`Steps`, `Heart Rate Measuring`, `Sleep`), and quick launchers (`AegisAI`, `Aegis Buff!`).
- **Swipe Top → Bottom**: 3-column customizable Quick Shortcuts (Torch, Settings, Ping Suit, Alarms, DND, Auto-Brightness, `+ Add`).
- **Swipe Right → Left**: Clean **2×3 Paginated App Launcher** across 4 pages (21 full apps, zero text collisions).
- **Scoped Emergency Discipline**: Only the watch OLED viewport shifts to full-screen crimson/purple/amber during active critical/peer alerts with one primary `Acknowledge` button, while audible alerts & haptics trigger across hardware.

---

## 2. Core Metrics vs. Conditions vs. Immediate Watch Actions

| Vital / Detector | Trigger Threshold | Physiological Hazard (NASA HRP / CSA) | Automatic Watch Response & Action |
| :--- | :--- | :--- | :--- |
| **Systolic BP / HR** | `>= 140 mmHg` resting | Headward fluid shift & adrenergic surge / arterial remodeling | Critical Crimson Screen + Klaxon -> Stop work, anchor tether, paced breathing |
| **Radiation (PIN + CSA CANS)** | `> 45 uSv/h` (CANS Neutrons ~31%) | Acute SPE proton burst & secondary bulkhead neutron dose | Critical Crimson Screen -> Enter water-wall / polyethylene storm shelter |
| **Tibial Sound Speed (SOS)** | `< 3,750 m/s` (`BMD < 1.02`) | Microgravity osteopenia (1–1.5%/mo loss) | Warning Screen + **Nutritions** boost -> 45m ARED squats + 1,200mg Ca/Vit D3 |
| **Inspired CO₂ Pocket** | `> 4.0 mmHg` | Zero-G stagnant exhaled CO₂ bubble formation | Warning Screen -> Turn cabin/berth fan HIGH & inspect amine scrubber |
| **Blood Oxygen (SpO₂)** | `< 94%` | Exploration habitat hypobaric hypoxia or EVA leak | Critical Viability drop -> Verify O₂ regulator & reserve mask |
| **Sleep Duration / REM** | `< 6.2 hrs` UTC-0 | 90-minute orbital dawns suppressing melatonin | Emotions `sleepy` + Sleep prompt -> 30m 480nm morning blue light |
| **Sweat Na⁺ & Osmometer** | `> 68 mmol/L` / `> 308 mOsm/kg` | Plasma volume contraction & kidney-stone risk | Hydration tip -> Drink 450mL isotonic electrolyte ration |
| **EVA Suit ΔP** | `< 26.0 kPa` | Decompression Sickness (DCS) / pressure seal leak | Environment critical alert -> Abort EVA & re-enter airlock |

---

## 3. Solved Edge Cases

1. **False Alarm Suppression During Workouts**: During **Workout (`3, 2, 1, GO!`)** or `ARED Workout Active`, elevated Heart Rate (`148 bpm`) and Systolic BP (`146 mmHg`) remain marked `nominal` so alarms never interrupt resistive loading.
2. **Sweat / Loose Ultrasonic Shin Pad Fault**: If tibial acoustic impedance drops (`shinPatchWet`), the watch alerts `"Shin Sensor Loose"` so dropped ultrasound waves are never mistaken for sudden catastrophic bone loss.
3. **Scroll Hijacking Prevention**: Inside scrollable watch apps (`Environment` 12 sensors, `Aegis Buff!` 14 tasks, `Nutritions`), wheel and touch gestures stay scoped cleanly inside the watch bezel (`overscroll-contain` + wheel boundary propagation control).
4. **Hardwareless Camera & Microphone Reliability**: When panelists test `Camera`, `Smart Detector`, or `Recorder` on VMs or browsers without physical webcam/mic permissions, the OS gracefully synthesizes deterministic orbital frame captures and metadata memos directly into per-visitor `IndexedDB`.
5. **Zero Cross-Visitor AI Data Leakage**: Each visitor gets an isolated storage namespace (`aegis_watch_db_v2::<visitorId>`). **AegisAI** always greps *only* that namespace, forwarding only that snapshot to `/api/aegis-ai` or executing the embedded offline medical triage engine locally.
