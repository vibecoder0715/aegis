import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import astrosuitImg from '../assets/images/astrosuit_detectors_concept_1794751497634.jpg';
import demoPersonalWatchImg from '../assets/images/demo_personal_watch.jpg';
import watchHeaderImg from '../assets/images/aegis_watch_header_1794735901058.jpg';
import peerMeshImg from '../assets/images/peer_mesh_cloud_architecture_1794565673082.jpg';
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
    part: 'Right Forearm Band',
    simpleRole: 'Reads your heartbeat, blood pressure, and oxygen.',
    topPct: 45,
    leftPct: 39,
  },
  {
    id: 'det-02',
    code: 'Detector 02',
    part: 'Waist Band',
    simpleRole: 'Checks your body heat and water level.',
    topPct: 47,
    leftPct: 50,
  },
  {
    id: 'det-03',
    code: 'Detector 03',
    part: 'Right Leg Band',
    simpleRole: 'Checks leg bone strength using gentle sound waves.',
    topPct: 78,
    leftPct: 45,
  },
  {
    id: 'det-04',
    code: 'Detector 04',
    part: 'Left Leg Band',
    simpleRole: 'Counts daily steps and leg exercise.',
    topPct: 78,
    leftPct: 54,
  },
  {
    id: 'aegis-watch',
    code: 'Aegis Watch',
    part: 'Left Wrist',
    simpleRole: 'Shows your health, fun games, and SOS alerts.',
    topPct: 45,
    leftPct: 60,
    isWatch: true,
  },
];

const VISUAL_SUMMARY_CARDS = [
  {
    step: 'Step 01',
    title: 'Suit Sensors',
    caption: 'Smart bands read your heart, water, bones, steps and so on.',
    img: demoPersonalWatchImg,
    alt: 'Astronaut wearing smart suit sensor bands',
    imgClass: 'w-full h-full object-cover object-[50%_72%]',
  },
  {
    step: 'Step 02',
    title: 'Aegis Watch',
    caption: 'Your watch shows live health and tell you what to do, even without Wi-Fi.',
    img: watchHeaderImg,
    alt: 'Aegis smart watch on wrist',
    imgClass: 'w-full h-full object-cover object-center',
  },
  {
    step: 'Step 03',
    title: 'Aegis Board',
    caption: 'The team board warns headquarters right away.',
    img: peerMeshImg,
    alt: 'Aegis Board mission telemetry mesh',
    imgClass: 'w-full h-full object-cover object-center',
  },
];

export const DemonstrationView: React.FC = () => {
  const [selectedDetector, setSelectedDetector] = useState<DetectorLabelItem>(SUIT_DETECTORS[4]);

  return (
    <div className="space-y-8 pb-28">
      {/* 1. VISUAL SUMMARY + SLIDE DECK */}
      <section
        aria-label="Demonstration Summary"
        className="rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6"
      >
        <h1 className="flex flex-wrap items-center gap-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#07152E]">
          <AegisWordmarkSvg height={48} className="h-9 sm:h-12 w-auto" />
          <span>Demonstration</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VISUAL_SUMMARY_CARDS.map((card) => (
            <div
              key={card.step}
              className="rounded-3xl bg-slate-50 border border-slate-200 overflow-hidden flex flex-col shadow-xs"
            >
                <div className="h-44 bg-slate-900 overflow-hidden">
                  <img
                    src={card.img}
                    alt={card.alt}
                    className={card.imgClass}
                  />
                </div>
                <div className="p-4 space-y-1">
                  <div className="font-mono text-xs font-extrabold text-cyan-700">{card.step}</div>
                  <div className="text-lg font-extrabold text-[#07152E]">{card.title}</div>
                  <p className="text-sm font-semibold text-slate-600 leading-snug">
                    {card.caption}
                  </p>
                </div>
              </div>
          ))}
            </div>

        {/* Slide Deck Presentation Callout */ }
            < div className = "rounded-3xl bg-slate-50 border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" >
              <div className="text-lg sm:text-xl font-extrabold text-[#07152E]">
                Wanna know more? Click here!
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

      {/* 2. FROM CONCEPT TO THE REAL WORLD: INTERACTIVE SUIT VISUAL */}
      <section
        aria-label="From concept to the real world"
        className="rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6"
      >
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#07152E]">
          From concept to the real world
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-100">
            <img
              src={astrosuitImg}
              alt="Astrosuit with Detector 01 on forearm, Detector 02 on waist, Detector 03 and 04 on legs, and Aegis Watch"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover block"
            />

            {SUIT_DETECTORS.map((det) => {
              const active = selectedDetector.id === det.id;
              return (
                <button
                  key={det.id}
                  type="button"
                  style={{ top: `${det.topPct}%`, left: `${det.leftPct}%` }}
                  onClick={() => setSelectedDetector(det)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg cursor-pointer transition transform hover:scale-105 ${det.isWatch
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

          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-3xl bg-[#07152E] text-white p-5 space-y-1.5 shadow-md">
              <div className="text-2xl font-black">{selectedDetector.code}</div>
              <div className="text-sm font-bold text-amber-300">{selectedDetector.part}</div>
              <p className="text-sm font-semibold text-slate-200 pt-1">
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
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition ${active
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

      {/* 3. HOW IT WORKS IN REAL LIFE: EMBEDDED VIDEO */}
      <section
        aria-label="How it works in real life?"
        className="rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-6 sm:p-10 space-y-5"
      >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#07152E]">
            How it works in real life?
          </h2>

          <div className="rounded-3xl overflow-hidden border border-slate-200 bg-black shadow-lg">
            <video
              src="/videos/banner_video.mp4"
              controls
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label="How Aegis works in real life video"
              className="w-full h-auto max-h-[620px] block object-cover"
            >
              Your browser does not support video playback.
            </video>
          </div>
      </section>
    </div>
  );
};
