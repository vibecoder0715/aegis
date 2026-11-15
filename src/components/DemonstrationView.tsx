import React, { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Radio,
  Watch,
  CheckCircle2,
  X,
} from 'lucide-react';
import astrosuitImg from '../assets/images/astrosuit_detectors_concept_1794751497634.jpg';
import { AegisWordmarkSvg } from './AegisBrandLogo';
import { CanvaIconSvg } from './PWAInstallButton';

interface DetectorLabelItem {
  id: string;
  code: string;
  part: string;
  simpleRole: string;
  topPct: number;
  leftPct: number;
  isWatch?: boolean;
}

const SUIT_DETECTORS: DetectorLabelItem[] = [
  {
    id: 'det-01',
    code: 'Detector 01',
    part: 'Right Hand Wristband',
    simpleRole: 'Checks heart rate, blood pressure, and blood oxygen.',
    topPct: 45,
    leftPct: 36,
  },
  {
    id: 'det-02',
    code: 'Detector 02',
    part: 'Belly Band',
    simpleRole: 'Checks body heat, water level, and stomach comfort.',
    topPct: 47,
    leftPct: 50,
  },
  {
    id: 'det-03',
    code: 'Detector 03',
    part: 'Right Leg Wristband',
    simpleRole: 'Checks shin bone strength with safe sound waves.',
    topPct: 78,
    leftPct: 44,
  },
  {
    id: 'det-04',
    code: 'Detector 04',
    part: 'Left Leg Wristband',
    simpleRole: 'Counts daily steps and leg muscle workouts.',
    topPct: 78,
    leftPct: 55,
  },
  {
    id: 'aegis-watch',
    code: 'Aegis Watch',
    part: 'Left Hand',
    simpleRole: 'Shows all health data, water intake, and peer alerts on your wrist.',
    topPct: 45,
    leftPct: 62,
    isWatch: true,
  },
];

export const DemonstrationView: React.FC = () => {
  const [selectedDetector, setSelectedDetector] = useState<DetectorLabelItem>(SUIT_DETECTORS[4]);
  const [showSlidePopup, setShowSlidePopup] = useState(false);

  // Interactive Real-Life Video Player State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [scene, setScene] = useState<1 | 2>(1);
  const [progress, setProgress] = useState(0); // 0..100

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setProgress((prev) => {
        const next = (prev + 1) % 100;
        if (next === 50) setScene(2);
        if (next === 0) setScene(1);
        return next;
      });
    }, 120);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Render animated spacewalk scenes onto the HTML5 video canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let tick = 0;

    const drawAstronaut = (
      x: number,
      y: number,
      lookingAtWatch: boolean,
      fainted: boolean,
      label: string
    ) => {
      ctx.save();
      ctx.translate(x, y);
      if (fainted) {
        ctx.rotate(-0.45);
      }

      // Backpack PLSS
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.roundRect(-34, -45, 68, 76, 12);
      ctx.fill();

      // Torso Suit
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-26, -38, 52, 68, 16);
      ctx.fill();
      ctx.stroke();

      // Belly Detector 02 (Cyan glowing band)
      ctx.fillStyle = '#06B6D4';
      ctx.beginPath();
      ctx.roundRect(-24, 4, 48, 8, 4);
      ctx.fill();

      // Helmet
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, -58, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Gold/Dark Visor
      ctx.fillStyle = fainted ? '#7F1D1D' : '#0F172A';
      ctx.beginPath();
      ctx.arc(0, -58, 17, 0, Math.PI * 2);
      ctx.fill();

      // Visor eyes
      ctx.fillStyle = fainted ? '#FCA5A5' : '#38BDF8';
      ctx.fillRect(-8, -60, 5, 3);
      ctx.fillRect(3, -60, 5, 3);

      // Right Arm + Detector 01 wristband
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 13;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-26, -26);
      ctx.lineTo(-46, 4);
      ctx.stroke();
      ctx.fillStyle = '#22D3EE';
      ctx.fillRect(-48, -4, 10, 5);

      // Left Arm + Aegis Watch
      ctx.beginPath();
      if (lookingAtWatch) {
        ctx.moveTo(26, -26);
        ctx.lineTo(44, -12);
        ctx.lineTo(18, -28);
      } else {
        ctx.moveTo(26, -26);
        ctx.lineTo(46, 4);
      }
      ctx.stroke();

      // Aegis Watch on Left Wrist
      const wx = lookingAtWatch ? 22 : 44;
      const wy = lookingAtWatch ? -28 : -2;
      ctx.fillStyle = scene === 2 && !fainted ? '#EF4444' : '#10B981';
      ctx.beginPath();
      ctx.roundRect(wx - 7, wy - 7, 14, 14, 4);
      ctx.fill();

      // Legs + Detector 03 & Detector 04 wristbands
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(-13, 30);
      ctx.lineTo(-15, 74);
      ctx.moveTo(13, 30);
      ctx.lineTo(15, 74);
      ctx.stroke();

      // Cyan leg wristbands
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(-22, 54, 14, 5);
      ctx.fillRect(8, 54, 14, 5);

      ctx.restore();

      // Name label below astronaut
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 105);
    };

    const renderFrame = () => {
      tick += 0.05;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep Space Starfield Background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#040814');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 28; i++) {
        const sx = (i * 97) % w;
        const sy = (i * 53) % (h - 60);
        const r = (i % 2) + 1;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Earth Horizon Curve
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.ellipse(w / 2, h + 170, w * 0.75, 210, 0, 0, Math.PI * 2);
      ctx.fill();

      if (scene === 1) {
        // SCENE 1: Astronaut wearing space suit looks at their Aegis Watch
        drawAstronaut(230, 175, true, false, 'Astronaut Elena (Suit Sensors Active)');

        // Animated pulses from Detector 01, 02, 03, 04 to Aegis Watch
        const pulseR = 12 + ((tick * 25) % 45);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(252, 147, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Zoomed Watch HUD Popup on Right Side
        ctx.fillStyle = '#0B1325';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(410, 48, 290, 225, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SCENE 1: LOOKING AT AEGIS WATCH', 432, 78);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('All Suit Sensors Safe', 432, 108);

        ctx.fillStyle = '#34D399';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('• Heart Rate:  72 bpm (Det 01)', 432, 142);
        ctx.fillText('• H2O Intake:  1,650 mL (Det 02)', 432, 170);
        ctx.fillText('• Bone Score:  1.10 (Det 03)', 432, 198);
        ctx.fillText('• Daily Steps: 6,840 (Det 04)', 432, 226);
        ctx.fillStyle = '#FACC15';
        ctx.fillText('• Radiation:   14 uSv (Safe)', 432, 252);
      } else {
        // SCENE 2: Teammate is not viable -> signal reaches astronaut's watch to see peer viability
        drawAstronaut(155, 180, false, true, 'Teammate Carlos (Not Viable / Fainted)');
        drawAstronaut(555, 180, true, false, 'Astronaut Elena (Receives SOS)');

        // Expanding Peer Signal Waves from Carlos to Elena's Watch
        for (let wIdx = 0; wIdx < 3; wIdx++) {
          const prog = ((tick * 0.55 + wIdx * 0.33) % 1);
          const curX = 155 + prog * (555 - 155);
          const curY = 150 - Math.sin(prog * Math.PI) * 45;
          ctx.fillStyle = '#F43F5E';
          ctx.beginPath();
          ctx.arc(curX, curY, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(curX, curY, 16, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Peer Viability Alert Card in Center-Top
        ctx.fillStyle = '#450A0A';
        ctx.strokeStyle = '#F87171';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(215, 22, 330, 118, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FCA5A5';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SCENE 2: PEER VIABILITY SOS SIGNAL', 380, 46);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('Carlos Vega Not Viable!', 380, 74);

        ctx.fillStyle = '#FDE047';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('BP 158/98 · O2 89% · 38m Away', 380, 100);
        ctx.fillStyle = '#34D399';
        ctx.fillText('Signal Reached Watch → Rescue Now', 380, 122);
      }

      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => cancelAnimationFrame(animId);
  }, [scene]);

  return (
    <div className="space-y-8 pb-28">
      {/* 1. SUMMARY SECTION (200 WORDS MAX) + WANNA KNOW MORE + VIEW SLIDE DECK */}
      <section
        aria-label="Demonstration Summary"
        className="rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6"
      >
        <div className="space-y-4 max-w-3xl">
          <h1 className="flex flex-wrap items-center gap-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#07152E]">
            <AegisWordmarkSvg height={48} className="h-9 sm:h-12 w-auto" />
            <span>Demonstration</span>
          </h1>

          {/* Concise ~175-word summary of how the app works */}
          <div className="space-y-3 text-base sm:text-lg font-semibold text-slate-700 leading-relaxed">
            <p>
              <strong className="font-extrabold text-slate-950">Aegis</strong> is a smart health system made for astronauts working in space. Inside the space suit, four soft wristband detectors sit on both legs, one hand, and the belly. These detectors automatically read heart rate, blood pressure, blood oxygen, water intake, bone strength, daily steps, and space radiation.
            </p>
            <p>
              All detector data goes straight to the{' '}
              <strong className="font-extrabold text-slate-950">Aegis Watch</strong> on the astronaut&apos;s other wrist without needing Wi-Fi. On the watch, astronauts can check their 3D body viability, log water and food, track sleep charts, pick their mood, complete daily <strong className="font-extrabold text-slate-950">Aegis Buff!</strong> tasks, or ask <strong className="font-extrabold text-slate-950">AegisAI</strong> for quick health advice.
            </p>
            <p>
              If a teammate faints or becomes non-viable during a spacewalk, their suit automatically sends a direct rescue signal to nearby watches. On the{' '}
              <strong className="font-extrabold text-slate-950">Aegis Board</strong>, commanders can monitor all 10 crewmates, view simple graphs, ask AI Assistance for team summaries, and receive instant first-hand emergency alerts.
            </p>
          </div>
        </div>

        {/* "Wanna know more? Click here!" + View slide deck direct link */}
        <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-extrabold text-[#07152E]">
              Wanna know more? Click here!
            </div>
            <p className="text-sm font-semibold text-slate-600">
              View our full Canva slide deck with visual diagrams and mission slides.
            </p>
          </div>

          <a
            href="https://canva.link/ddh7tcyekbmjkw0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] hover:brightness-110 px-5 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-md transition cursor-pointer shrink-0"
          >
            <CanvaIconSvg className="w-5 h-5" />
            <span>View slide deck</span>
          </a>
        </div>
      </section>

      {/* 2. FROM CONCEPT TO THE REAL WORLD: ASTROSUIT IMAGE WITH SIMPLE DETECTOR LABELS */}
      <section
        aria-label="From concept to the real world"
        className="rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6"
      >
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#07152E]">
            From concept to the real world
          </h2>
          <p className="text-sm sm:text-base font-semibold text-slate-600">
            Click any label on the space suit to see how the 4 wristband detectors and the Aegis Watch work together.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Interactive Suit Image with Simple Labels (Detector 01..04 + Aegis Watch) */}
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-100">
            <img
              src={astrosuitImg}
              alt="Astrosuit with Detector 01 on hand, Detector 02 on belly, Detector 03 and 04 on legs, and Aegis Watch"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover block"
            />

            {/* Simple Interactive Hotspot Labels */}
            {SUIT_DETECTORS.map((det) => {
              const active = selectedDetector.id === det.id;
              return (
                <button
                  key={det.id}
                  type="button"
                  style={{ top: `${det.topPct}%`, left: `${det.leftPct}%` }}
                  onClick={() => setSelectedDetector(det)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-xs font-black shadow-lg cursor-pointer transition transform hover:scale-105 ${
                    det.isWatch
                      ? active
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-white'
                        : 'bg-[#07152E] text-emerald-300 border border-emerald-400'
                      : active
                      ? 'bg-cyan-400 text-slate-950 ring-4 ring-white'
                      : 'bg-[#07152E]/90 text-white border border-cyan-400'
                  }`}
                >
                  {det.code}
                </button>
              );
            })}
          </div>

          {/* Simple Detector Inspector List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-3xl bg-[#07152E] text-white p-5 space-y-2 shadow-md">
              <div className="text-xs font-black uppercase text-cyan-300">
                Selected Part
              </div>
              <div className="text-2xl font-black">{selectedDetector.code}</div>
              <div className="text-sm font-bold text-amber-300">{selectedDetector.part}</div>
              <p className="text-sm font-semibold text-slate-200 leading-relaxed pt-1">
                {selectedDetector.simpleRole}
              </p>
            </div>

            <div className="space-y-2">
              {SUIT_DETECTORS.map((det) => {
                const active = selectedDetector.id === det.id;
                return (
                  <button
                    key={det.id}
                    type="button"
                    onClick={() => setSelectedDetector(det)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition ${
                      active
                        ? 'border-[#07152E] bg-slate-100 font-extrabold'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-extrabold text-[#07152E]">{det.code}</div>
                      <div className="text-xs font-semibold text-slate-500">{det.part}</div>
                    </div>
                    <CheckCircle2
                      className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-300'}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS IN REAL LIFE: INTERACTIVE ANIMATED VIDEO PLAYER */}
      <section
        aria-label="How it works in real life?"
        className="rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#07152E]">
              How it works in real life?
            </h2>
            <p className="text-sm sm:text-base font-semibold text-slate-600">
              Watch Scene 1 (checking the watch in a space suit) and Scene 2 (receiving a peer SOS signal when a teammate is not viable).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setScene(1);
                setProgress(10);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer flex items-center gap-1.5 transition ${
                scene === 1
                  ? 'bg-[#07152E] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Watch className="w-4 h-4" />
              <span>Scene 1: Check Watch</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScene(2);
                setProgress(60);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer flex items-center gap-1.5 transition ${
                scene === 2
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Scene 2: Peer Viability Signal</span>
            </button>
          </div>
        </div>

        {/* Video Canvas Stage + Video Controls */}
        <div className="rounded-3xl overflow-hidden border-2 border-slate-800 bg-[#040814] shadow-lg">
          <canvas
            ref={canvasRef}
            width={760}
            height={330}
            onClick={() => setIsPlaying((p) => !p)}
            className="w-full h-auto block cursor-pointer"
            aria-label="How Aegis Watch works in real life video"
          />

          {/* Interactive Video Control Bar */}
          <div className="bg-slate-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 text-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause Video' : 'Play Video'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScene(1);
                  setProgress(0);
                  setIsPlaying(true);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                aria-label="Restart video"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 max-w-md flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={99}
                value={progress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setProgress(val);
                  setScene(val < 50 ? 1 : 2);
                }}
                aria-label="Video timeline"
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-slate-300 whitespace-nowrap">
                {scene === 1 ? '00:05 / 00:20' : '00:14 / 00:20'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
