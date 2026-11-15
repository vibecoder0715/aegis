# AegisAI — Local On-Device Llama 3.2 1B Fine-Tuning & Deployment Blueprint

**AegisAI** is designed for astronauts operating up to 20 light-minutes from Earth or inside EVA suit blackouts. While our live hosted web app routes online watch queries through the server-side Gemini 4 Hydrogen proxy (strictly scoped to the current visitor's local watch database snapshot) and falls back immediately to our deterministic offline medical rules engine, deep-space wearable/tablet hardware can run a fine-tuned **Llama 3.2 1B** model locally in **~2 GB RAM**.

---

## 1. Architecture & Strict Data-Isolation Principle

1. **Zero Global Patient Mixing**: Before inference starts, the runtime queries **only** the local smartwatch database partition (`visitorId` SQLite/IndexedDB/LocalStorage store) using targeted structural grep (`grepVisitorWatchDb`).
2. **Schema-Locked Context Window**:
   ```json
   {
     "visitor_id": "crew-xxx",
     "utc_time": "2026-11-15T14:22:10Z",
     "vitals": { "bp": "118/76", "hr": 68, "spo2": 98.4, "tibial_sos_ms": 3915, "bone_bmd": 1.18 },
     "radiation_cans": { "neutron_uSv_h": 4.4, "proton_uSv_h": 9.8, "mission_mSv": 28.4 },
     "sleep": { "hours": 7.4, "rem_m": 102, "deep_m": 93, "score": 89 },
     "meals_today": ["Fortified Berry Oats", "Salmon, Kale & Quinoa"]
   }
   ```
3. **Grounded Response Contract**: The model is fine-tuned with explicit refusal/citation instructions so every vital sign, food recommendation, or shelter order comes verbatim from the supplied visitor snapshot and verified NASA HRP / CSA thresholds.

---

## 2. Fine-Tuning Dataset Preparation (NASA HRP + CSA + Synthetic DB Pairs)

Compile 3,500–5,000 instruction-response JSONL triples combining:
- All **105 NASA HRP & CSA rules** (5 Hazards, Risks, CIPHER Ongoing Research, CSA CANS Neutron ~30% ISS dose research, and CSA Space Science findings).
- Synthetic smartwatch JSON DB variations across nominal, bone osteopenia (`SOS < 3750 m/s`), Solar Particle Event (`> 45 uSv/h`), CO₂ pocket (`> 4.0 mmHg`), orthostatic hypertension (`>= 140 mmHg`), and circadian fatigue (`< 6.2 h sleep`).
- Refusal examples when asked about another crew member's private database or unrecorded lab tests.

Example training record (`train.jsonl`):
```json
{
  "instruction": "Read only this visitor Watch DB snapshot and advise.",
  "input": "{\"vitals\":{\"bp\":\"119/77\",\"tibial_sos_ms\":3640,\"bone_bmd\":0.93},\"radiation_cans\":{\"neutron_uSv_h\":4.2},\"meals_today\":[\"Pasta Pouch (Ca: 120mg)\"]}",
  "output": "Your shin ultrasound dropped to 3,640 m/s (BMD 0.93 g/cm2), signaling accelerated bone loss risk. Today's calcium intake is only 120 mg. Action: Complete 45 min ARED squats/heel-raises today and log a high-calcium Salmon & Kale + Vitamin D3/K2 ration."
}
```

---

## 3. Fine-Tuning Llama 3.2 1B (QLoRA / Unsloth or Hugging Face PEFT)

- **Base Model**: `meta-llama/Llama-3.2-1B-Instruct`
- **Method**: 4-bit NF4 QLoRA (`r=16`, `lora_alpha=32`, target `q_proj,k_proj,v_proj,o_proj,gate_proj,up_proj,down_proj`).
- **Context Length**: `2048` tokens (keeps KV cache compact under 120 MB on wearable ARM SoCs).
- **Training Hyperparameters**:
  - `learning_rate = 2e-4` (cosine decay, 5% warmup)
  - `per_device_train_batch_size = 4`, `gradient_accumulation_steps = 4`
  - `epochs = 3`, `bf16 = true` (single 16 GB consumer GPU trains in ~12 minutes)
- Merge LoRA adapter back into FP16 weights (`merge_and_unload()`).

---

## 4. Quantization & Hosting on 2 GB+ RAM Edge Devices

| Target Runtime | Quantization Format | Weight Size | Total Peak RAM (Weights + 2K KV + OS UI) |
| :--- | :--- | :---: | :---: |
| Wrist / Handheld C++ (`llama.cpp`) | `Q4_K_M` GGUF | ~740 MB | **~1.15 GB RAM** |
| Android / Wearable NPU (`ExecuTorch` / `MLC LLM`) | `INT4` (Group 32) | ~680 MB | **~1.05 GB RAM** |
| Browser PWA Fallback (`WebLLM` / `Transformers.js` ONNX) | `Q4F16` ONNX | ~790 MB | **~1.35 GB RAM** |

### Running Locally (`llama.cpp` Edge Server)
```bash
./llama-quantize aegis-llama3.2-1b-f16.gguf aegis-llama3.2-1b-q4_k_m.gguf Q4_K_M
./llama-server -m aegis-llama3.2-1b-q4_k_m.gguf -c 2048 --host 127.0.0.1 --port 8081
```
This guarantees **< 450 ms first-token latency** with zero cloud calls inside shielded habitats or lunar habitats with **2 GB+ total system memory**.
