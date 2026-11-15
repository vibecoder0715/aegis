import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  LayoutDashboard,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Watch,
} from 'lucide-react';
import astrosuitImg from '../assets/images/astrosuit_detectors_concept_1794751497634.jpg';
import suitDetectorsImg from '../assets/images/suit_detector_sensor_nodes_1794565672115.jpg';
import watchHardwareImg from '../assets/images/astronaut_wrist_wearable_hardware_1794565670683.jpg';
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
    part: 'Right Hand Band',
    simpleRole: 'Reads your heartbeat, blood pressure, and oxygen.',
    topPct: 45,
    leftPct: 36,
  },
  {
    id: 'det-02',
    code: 'Detector 02',
    part: 'Belly Band',
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
    leftPct: 44,
  },
  {
    id: 'det-04',
    code: 'Detector 04',
    part: 'Left Leg Band',
    simpleRole: 'Counts daily steps and leg exercise.',
    topPct: 78,
    leftPct: 55,
  },
  {
    id: 'aegis-watch',
    code: 'Aegis Watch',
    part: 'Left Wrist',
    simpleRole: 'Shows your health, fun games, and SOS alerts.',
    topPct: 45,
    leftPct: 62,
    isWatch: true,
  },
];

const VISUAL_SUMMARY_CARDS = [
  {
    step: '01',
    title: 'Suit Sensors',
    caption: 'Soft bands read your heart, water, bones, and steps.',
    img: suitDetectorsImg,
    alt: 'Space suit sensor bands',
  },
  {
    step: '02',
    title: 'Aegis Watch',
    caption: 'Your watch shows live health even without Wi-Fi.',
    img: watchHardwareImg,
    alt: 'Aegis smart watch on wrist',
  },
  {
    step: '03',
    title: 'Aegis Board',
    caption: 'The team board warns doctors on Earth right away.',
    img: peerMeshImg,
    alt: 'Aegis Board mission telemetry mesh',
  },
];

const SCENE_CAPTIONS: Record<1 | 2 | 3, string> = {
  1: '1. Aegis Watch reads your suit and keeps you healthy.',
  2: '2. When Carlos gets dizzy, his watch sends SOS straight to Elena.',
  3: '3. Aegis Board alerts commanders so the rescue pod launches fast.',
};

export const DemonstrationView: React.FC = () => {
  const [selectedDetector, setSelectedDetector] = useState<DetectorLabelItem>(SUIT_DETECTORS[4]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [scene, setScene] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0); // 0..99
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setProgress((prev) => {
        const next = (prev + 1) % 100;
        if (next < 34) setScene(1);
        else if (next < 67) setScene(2);
        else setScene(3);
        return next;
      });
    }, 150);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Super-3D volumetric canvas renderer for Real-Life Spacewalk + Watch + Peer SOS + Aegis Board
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let t = 0;

    // Helper: draw 3D shaded capsule limb
    const draw3DLimb = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      thickness: number,
      highlight = '#FFFFFF',
      mid = '#CBD5E1',
      shadow = '#475569'
    ) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const g = ctx.createLinearGradient(
        (x1 + x2) / 2 + nx * (thickness * 0.6),
        (y1 + y2) / 2 + ny * (thickness * 0.6),
        (x1 + x2) / 2 - nx * (thickness * 0.6),
        (y1 + y2) / 2 - ny * (thickness * 0.6)
      );
      g.addColorStop(0, highlight);
      g.addColorStop(0.55, mid);
      g.addColorStop(1, shadow);
      ctx.strokeStyle = g;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    // Helper: draw high-detail volumetric 3D Astronaut
    const draw3DAstronaut = (
      x: number,
      y: number,
      scale: number,
      options: {
        lookingAtWatch?: boolean;
        distressed?: boolean;
        tilt?: number;
        label: string;
        watchAlert?: boolean;
      }
    ) => {
      const { lookingAtWatch = false, distressed = false, tilt = 0, label, watchAlert = false } = options;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.rotate(tilt);

      // Soft ambient rim glow behind astronaut
      const aura = ctx.createRadialGradient(0, -10, 15, 0, -10, 120);
      aura.addColorStop(0, distressed ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.22)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, -10, 120, 0, Math.PI * 2);
      ctx.fill();

      // 3D PLSS Backpack with beveled metallic shading
      const packGrad = ctx.createLinearGradient(-46, -64, 46, 36);
      packGrad.addColorStop(0, '#F1F5F9');
      packGrad.addColorStop(0.5, '#94A3B8');
      packGrad.addColorStop(1, '#1E293B');
      ctx.fillStyle = packGrad;
      ctx.beginPath();
      ctx.roundRect(-44, -64, 88, 96, 16);
      ctx.fill();

      // Backpack beacon antenna + blinking telemetry LED + gentle ion thruster bubbles
      for (let b = 0; b < 3; b++) {
        const bubbleAge = (t * 1.4 + b * 0.33) % 1;
        const bx = -22 + b * 22 + Math.sin(t * 3 + b) * 3;
        const by = 36 + bubbleAge * 26;
        ctx.fillStyle = `rgba(56, 189, 248, ${(1 - bubbleAge) * 0.45})`;
        ctx.beginPath();
        ctx.arc(bx, by, 4 - bubbleAge * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-28, -64);
      ctx.lineTo(-28, -94);
      ctx.stroke();
      const beaconPulse = 0.55 + 0.45 * Math.sin(t * 5);
      ctx.fillStyle = distressed
        ? `rgba(239, 68, 68, ${beaconPulse})`
        : `rgba(52, 211, 153, ${beaconPulse})`;
      ctx.beginPath();
      ctx.arc(-28, -96, 5, 0, Math.PI * 2);
      ctx.fill();

      // 3D Legs + Knee joints + Detector 03 & Detector 04 glowing bands
      draw3DLimb(-17, 30, -24, 98, 22);
      draw3DLimb(17, 30, 24, 98, 22);
      // 3D Boots
      const bootGrad = ctx.createLinearGradient(-34, 92, -10, 114);
      bootGrad.addColorStop(0, '#94A3B8');
      bootGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = bootGrad;
      ctx.beginPath();
      ctx.roundRect(-36, 92, 26, 18, 8);
      ctx.roundRect(10, 92, 26, 18, 8);
      ctx.fill();

      // Detector 03 & 04 Cyan Sensor Rings on Legs
      ctx.fillStyle = '#22D3EE';
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(-32, 66, 20, 6, 3);
      ctx.roundRect(12, 66, 20, 6, 3);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3D Sculpted Torso Suit
      const torsoGrad = ctx.createRadialGradient(-16, -32, 8, 4, -4, 72);
      torsoGrad.addColorStop(0, '#FFFFFF');
      torsoGrad.addColorStop(0.55, '#E2E8F0');
      torsoGrad.addColorStop(1, '#475569');
      ctx.fillStyle = torsoGrad;
      ctx.beginPath();
      ctx.roundRect(-34, -48, 68, 84, 22);
      ctx.fill();

      // Chest DCM Control Module (3D bevel)
      const chestGrad = ctx.createLinearGradient(-18, -32, 18, 6);
      chestGrad.addColorStop(0, '#334155');
      chestGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = chestGrad;
      ctx.beginPath();
      ctx.roundRect(-19, -32, 38, 30, 7);
      ctx.fill();
      ctx.fillStyle = distressed ? '#EF4444' : '#10B981';
      ctx.fillRect(-13, -25, 10, 5);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(1, -25, 12, 5);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-13, -15, 26, 4);

      // Detector 02 Belly Band (3D curved glowing cyan strip)
      ctx.fillStyle = '#06B6D4';
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(-31, 10, 62, 8, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Right Arm + Detector 01 Wristband
      draw3DLimb(-32, -30, -56, 12, 17);
      ctx.fillStyle = '#22D3EE';
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(-62, 2, 14, 6, 3);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Left Arm + Aegis Watch
      let watchX = 56;
      let watchY = 6;
      if (lookingAtWatch) {
        draw3DLimb(32, -30, 56, -6, 17);
        draw3DLimb(56, -6, 26, -34, 15);
        watchX = 28;
        watchY = -34;
      } else {
        draw3DLimb(32, -30, 58, 12, 17);
      }

      // 3D Aegis Watch on Left Wrist
      ctx.save();
      ctx.translate(watchX, watchY);
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(-11, -11, 22, 22, 6);
      ctx.fill();
      const watchColor = watchAlert ? '#EF4444' : '#10B981';
      ctx.fillStyle = watchColor;
      ctx.shadowColor = watchColor;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(-8, -8, 16, 16, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-4, -3, 8, 2);
      ctx.fillRect(-4, 1, 5, 2);
      ctx.restore();

      // 3D Spherical EVA Helmet Shell
      const helmetGrad = ctx.createRadialGradient(-12, -88, 6, 0, -76, 38);
      helmetGrad.addColorStop(0, '#FFFFFF');
      helmetGrad.addColorStop(0.65, '#CBD5E1');
      helmetGrad.addColorStop(1, '#334155');
      ctx.fillStyle = helmetGrad;
      ctx.beginPath();
      ctx.arc(0, -76, 32, 0, Math.PI * 2);
      ctx.fill();

      // Neck Locking Ring
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.ellipse(0, -48, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gold/Reflective 3D Curved Visor with Earth Sky Reflection
      const visorGrad = ctx.createRadialGradient(-7, -83, 3, 2, -74, 24);
      if (distressed) {
        visorGrad.addColorStop(0, '#FCA5A5');
        visorGrad.addColorStop(0.45, '#B91C1C');
        visorGrad.addColorStop(1, '#450A0A');
      } else {
        visorGrad.addColorStop(0, '#FEF08A');
        visorGrad.addColorStop(0.35, '#D97706');
        visorGrad.addColorStop(0.75, '#1E293B');
        visorGrad.addColorStop(1, '#020617');
      }
      ctx.fillStyle = visorGrad;
      ctx.beginPath();
      ctx.ellipse(0, -75, 23, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular glass reflection streak on visor
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(-4, -77, 15, Math.PI * 1.12, Math.PI * 1.55);
      ctx.stroke();

      // Playful glowing face expression inside 3D visor
      if (distressed) {
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 2.6;
        // Left & right dizzy >< eyes
        ctx.beginPath();
        ctx.moveTo(-11, -81);
        ctx.lineTo(-5, -77);
        ctx.lineTo(-11, -73);
        ctx.moveTo(11, -81);
        ctx.lineTo(5, -77);
        ctx.lineTo(11, -73);
        ctx.stroke();
        // Open worried O mouth
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, -66, 3.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const eyeShiftX = lookingAtWatch ? 3 : 0;
        const blink = Math.sin(t * 2.1) > 0.96;
        ctx.fillStyle = '#E0F2FE';
        if (blink) {
          ctx.fillRect(-10 + eyeShiftX, -78, 6, 2);
          ctx.fillRect(4 + eyeShiftX, -78, 6, 2);
        } else {
          ctx.beginPath();
          ctx.arc(-7 + eyeShiftX, -78, 2.8, 0, Math.PI * 2);
          ctx.arc(7 + eyeShiftX, -78, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
        // Happy smile arc
        ctx.strokeStyle = '#BAE6FD';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(eyeShiftX * 0.6, -72, 5.5, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }

      ctx.restore();

      // Crisp pill label under astronaut
      ctx.save();
      ctx.font = 'bold 18px sans-serif';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(7, 21, 46, 0.85)';
      ctx.strokeStyle = distressed ? 'rgba(248, 113, 113, 0.8)' : 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - tw / 2 - 16, y + 124 * scale, tw + 32, 32, 16);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 124 * scale + 22);
      ctx.restore();
    };

    // Helper: draw 3D orbital Earth + Sun flare + Starfield
    const draw3DSpaceBackdrop = (w: number, h: number) => {
      // Deep space nebula gradient
      const bg = ctx.createRadialGradient(w * 0.2, h * 0.15, 20, w * 0.5, h * 0.5, w);
      bg.addColorStop(0, '#172554');
      bg.addColorStop(0.45, '#070D1F');
      bg.addColorStop(1, '#02040A');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Multi-layer twinkling starfield + playful shooting comet + distant ringed planet
      for (let i = 0; i < 65; i++) {
        const sx = (i * 173 + 41) % w;
        const sy = (i * 89 + 23) % (h - 90);
        const alpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + i));
        const r = i % 7 === 0 ? 2.2 : i % 3 === 0 ? 1.4 : 0.9;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Playful ringed mini planet top-right
      const mpX = w - 115;
      const mpY = 66 + Math.sin(t * 0.8) * 3;
      const mpGrad = ctx.createRadialGradient(mpX - 6, mpY - 6, 3, mpX, mpY, 22);
      mpGrad.addColorStop(0, '#C4B5FD');
      mpGrad.addColorStop(0.6, '#7C3AED');
      mpGrad.addColorStop(1, '#312E81');
      ctx.fillStyle = mpGrad;
      ctx.beginPath();
      ctx.arc(mpX, mpY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(196, 181, 253, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(mpX, mpY, 34, 8, -0.25, 0, Math.PI * 2);
      ctx.stroke();

      // Occasional playful shooting star across background
      const starProg = (t * 0.25) % 1;
      const starX = 240 + starProg * 760;
      const starY = 38 + starProg * 145;
      const starTail = ctx.createLinearGradient(starX - 60, starY - 12, starX, starY);
      starTail.addColorStop(0, 'rgba(56, 189, 248, 0)');
      starTail.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
      ctx.strokeStyle = starTail;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(starX - 60, starY - 12);
      ctx.lineTo(starX, starY);
      ctx.stroke();

      // Golden orbital Sun lens flare (upper left)
      const sunGrad = ctx.createRadialGradient(90, 64, 4, 90, 64, 150);
      sunGrad.addColorStop(0, 'rgba(254, 249, 195, 0.95)');
      sunGrad.addColorStop(0.18, 'rgba(250, 204, 21, 0.45)');
      sunGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.12)');
      sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(90, 64, 150, 0, Math.PI * 2);
      ctx.fill();

      // 3D Curved Planet Earth below with atmospheric Rayleigh glow
      const earthCx = w * 0.5;
      const earthCy = h + 690;
      const earthR = 820;

      const atmoGrad = ctx.createRadialGradient(earthCx, earthCy, earthR - 10, earthCx, earthCy, earthR + 55);
      atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
      atmoGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.32)');
      atmoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(earthCx, earthCy, earthR + 55, 0, Math.PI * 2);
      ctx.fill();

      const oceanGrad = ctx.createRadialGradient(earthCx - 220, earthCy - 740, 60, earthCx, earthCy, earthR);
      oceanGrad.addColorStop(0, '#38BDF8');
      oceanGrad.addColorStop(0.35, '#0284C7');
      oceanGrad.addColorStop(0.8, '#0C4A6E');
      oceanGrad.addColorStop(1, '#020617');
      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.arc(earthCx, earthCy, earthR, 0, Math.PI * 2);
      ctx.fill();

      // Drifting volumetric Earth clouds
      ctx.save();
      ctx.beginPath();
      ctx.arc(earthCx, earthCy, earthR, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let c = 0; c < 6; c++) {
        const cx = ((w * 0.15 + c * 220 + t * 18) % (w + 260)) - 130;
        const cy = h - 42 + Math.sin(c * 1.7) * 24;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 135, 16, -0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const renderFrame = () => {
      if (isPlayingRef.current) {
        t += 0.035;
      }
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      draw3DSpaceBackdrop(w, h);

      if (scene === 1) {
        // SCENE 1: Astronaut checking Aegis Watch with 3D holographic telemetry HUD
        const bob = Math.sin(t * 1.6) * 8;
        draw3DAstronaut(330, 265 + bob, 1.28, {
          lookingAtWatch: true,
          label: 'Elena (All Sensors Safe)',
          watchAlert: false,
        });

        // 3D glowing pulse beams from suit detectors to wrist watch
        const wx = 330 + 28 * 1.28;
        const wy = 265 + bob - 34 * 1.28;

        // Playful sensor data droplets flowing from belly & leg detectors straight into wrist watch
        const suitPoints = [
          { sx: 330 - 52, sy: 265 + bob + 4 }, // Hand Det 01
          { sx: 330, sy: 265 + bob + 14 }, // Belly Det 02
          { sx: 330 - 24, sy: 265 + bob + 84 }, // Leg Det 03
        ];
        suitPoints.forEach((pt, idx) => {
          const flow = (t * 0.8 + idx * 0.33) % 1;
          const fx = pt.sx + (wx - pt.sx) * flow;
          const fy = pt.sy + (wy - pt.sy) * flow;
          ctx.fillStyle = idx === 1 ? '#38BDF8' : idx === 2 ? '#A78BFA' : '#34D399';
          ctx.beginPath();
          ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
          ctx.fill();
        });
        for (let rIdx = 0; rIdx < 3; rIdx++) {
          const r = ((t * 42 + rIdx * 24) % 72) + 8;
          ctx.strokeStyle = `rgba(34, 211, 238, ${Math.max(0, 0.85 - r / 85)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(wx, wy, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Beam line connecting watch to 3D Glass HUD
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(wx + 12, wy);
        ctx.lineTo(640, 120);
        ctx.moveTo(wx + 12, wy);
        ctx.lineTo(640, 405);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3D Glassmorphic Hologram Watch HUD on Right
        ctx.save();
        const hudGrad = ctx.createLinearGradient(640, 72, 1185, 445);
        hudGrad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
        hudGrad.addColorStop(1, 'rgba(7, 21, 46, 0.86)');
        ctx.fillStyle = hudGrad;
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.roundRect(640, 72, 545, 372, 30);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('AEGIS WATCH · LIVE SUIT HUD', 680, 118);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('All Sensors Safe', 680, 162);

        // Live scrolling ECG heartbeat trace in top-right of HUD
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let ex = 0; ex <= 150; ex += 3) {
          const phase = ((ex + t * 80) % 50) / 50;
          const spike =
            phase > 0.42 && phase < 0.48
              ? -16
              : phase >= 0.48 && phase < 0.54
              ? 12
              : phase >= 0.54 && phase < 0.62
              ? -5
              : 0;
          const px = 985 + ex;
          const py = 152 + spike;
          if (ex === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Travelling glowing light dot along the Watch-to-HUD beam
        const beamU = (t * 0.9) % 1;
        const beamDotX = wx + 12 + beamU * (640 - (wx + 12));
        const beamDotY = wy + beamU * (240 - wy);
        ctx.fillStyle = '#67E8F9';
        ctx.beginPath();
        ctx.arc(beamDotX, beamDotY, 5, 0, Math.PI * 2);
        ctx.fill();

        const rows = [
          { label: 'Heart Rate (Detector 01)', val: '72 bpm', color: '#34D399' },
          { label: 'Body Water (Detector 02)', val: '1,650 mL', color: '#38BDF8' },
          { label: 'Bone Score (Detector 03)', val: '1.10 g/cm²', color: '#A78BFA' },
          { label: 'Daily Steps (Detector 04)', val: '6,840', color: '#FACC15' },
        ];
        rows.forEach((row, idx) => {
          const ry = 205 + idx * 54;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.beginPath();
          ctx.roundRect(680, ry, 465, 42, 12);
          ctx.fill();

          ctx.fillStyle = '#CBD5E1';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(row.label, 698, ry + 27);

          ctx.fillStyle = row.color;
          ctx.font = 'bold 20px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(row.val, 1126, ry + 28);
          ctx.textAlign = 'left';
        });
        ctx.restore();
      } else if (scene === 2) {
        // SCENE 2: Teammate gets dizzy -> Direct 3D SOS wave travels to Elena's Aegis Watch + playful rescue glide
        const bobA = Math.sin(t * 1.4) * 7;
        const bobB = Math.cos(t * 1.6) * 7;
        const elenaX = 1020 - Math.abs(Math.sin(t * 0.9)) * 42;
        draw3DAstronaut(250, 295 + bobA, 1.15, {
          distressed: true,
          tilt: -0.38,
          label: 'Carlos (Needs Help!)',
          watchAlert: true,
        });
        draw3DAstronaut(elenaX, 275 + bobB, 1.15, {
          lookingAtWatch: true,
          label: 'Elena (Watch Gets SOS)',
          watchAlert: true,
        });

        // Orbiting playful dizzy stars above Carlos's helmet
        for (let s = 0; s < 3; s++) {
          const ang = t * 3 + (s * Math.PI * 2) / 3;
          const sx = 225 + Math.cos(ang) * 34;
          const sy = 152 + bobA + Math.sin(ang) * 9;
          ctx.fillStyle = '#FDE047';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('✦', sx, sy);
        }

        // Playful action bubble above Elena's helmet
        ctx.save();
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.roundRect(elenaX - 68, 124 + bobB, 136, 32, 16);
        ctx.fill();
        ctx.fillStyle = '#022C22';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('On my way, Carlos!', elenaX, 145 + bobB);
        ctx.restore();

        // 3D Glowing SOS Arc & Travelling Data Packets targeting Elena's moving watch
        for (let p = 0; p < 4; p++) {
          const prog = (t * 0.45 + p * 0.25) % 1;
          const px = 290 + prog * (elenaX - 24 - 290);
          const py = 250 - Math.sin(prog * Math.PI) * 115;

          const pktGlow = ctx.createRadialGradient(px, py, 2, px, py, 28);
          pktGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
          pktGlow.addColorStop(0.35, 'rgba(244, 63, 94, 0.9)');
          pktGlow.addColorStop(1, 'rgba(244, 63, 94, 0)');
          ctx.fillStyle = pktGlow;
          ctx.beginPath();
          ctx.arc(px, py, 28, 0, Math.PI * 2);
          ctx.fill();
        }

        // Center-Top 3D Alert Hologram
        ctx.save();
        ctx.fillStyle = 'rgba(69, 10, 10, 0.92)';
        ctx.strokeStyle = '#F87171';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.roundRect(410, 48, 460, 155, 24);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FCA5A5';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('DIRECT WATCH-TO-WATCH SOS', 640, 84);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('Carlos Needs Help!', 640, 122);

        ctx.fillStyle = '#FDE047';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('BP 158/98 · O2 89% · 38m Away', 640, 156);

        ctx.fillStyle = '#34D399';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Rescue signal sent straight to nearby watches', 640, 184);
        ctx.restore();
      } else {
        // SCENE 3: Live telemetry beams up to the 3D Mission Control Aegis Board!
        const bob = Math.sin(t * 1.5) * 6;
        draw3DAstronaut(215, 315 + bob, 0.98, {
          distressed: true,
          tilt: -0.28,
          label: 'Carlos (Airlock)',
          watchAlert: true,
        });

        // 3D Orbital Relay Beam from Suit to Aegis Board
        const beamGrad = ctx.createLinearGradient(255, 210, 455, 240);
        beamGrad.addColorStop(0, 'rgba(244, 63, 94, 0.85)');
        beamGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.85)');
        beamGrad.addColorStop(1, 'rgba(16, 185, 129, 0.9)');
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(235, 225 + bob);
        ctx.quadraticCurveTo(340, 120, 465, 200);
        ctx.stroke();

        // Travelling packet dot along relay arc
        const u = (t * 0.7) % 1;
        const bx = (1 - u) * (1 - u) * 235 + 2 * (1 - u) * u * 340 + u * u * 465;
        const by = (1 - u) * (1 - u) * (225 + bob) + 2 * (1 - u) * u * 120 + u * u * 200;
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Playful 3D Mini Rescue Pod flying smoothly toward Carlos at Airlock
        const podProg = (t * 0.35) % 1;
        const podX = 65 + podProg * 145;
        const podY = 128 + Math.sin(podProg * Math.PI) * -22;
        ctx.save();
        ctx.translate(podX, podY);
        // Ion flame tail
        ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.beginPath();
        ctx.moveTo(-22, -4);
        ctx.lineTo(-42 - Math.sin(t * 16) * 6, 0);
        ctx.lineTo(-22, 4);
        ctx.closePath();
        ctx.fill();
        // Shuttle capsule body
        const podGrad = ctx.createLinearGradient(-22, -12, 22, 12);
        podGrad.addColorStop(0, '#FFFFFF');
        podGrad.addColorStop(1, '#64748B');
        ctx.fillStyle = podGrad;
        ctx.beginPath();
        ctx.roundRect(-22, -10, 44, 20, 10);
        ctx.fill();
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(10, -2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#E0F2FE';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('RESCUE POD', -28, -16);
        ctx.restore();

        // 3D Mission Control Aegis Board Holographic Console (Right 60%)
        ctx.save();
        ctx.fillStyle = 'rgba(7, 21, 46, 0.94)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
        ctx.shadowBlur = 28;
        ctx.beginPath();
        ctx.roundRect(455, 42, 775, 465, 28);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Board Top Header Strip
        ctx.fillStyle = '#0F254E';
        ctx.beginPath();
        ctx.roundRect(458, 45, 769, 64, [25, 25, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('AEGIS BOARD · MISSION CONTROL', 490, 86);

        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.roundRect(985, 61, 215, 34, 17);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('1 EMERGENCY!', 1092, 83);
        ctx.textAlign = 'left';

        // Left Sub-Card: First-Hand Emergency Alert Card inside Aegis Board
        ctx.fillStyle = '#450A0A';
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(488, 130, 355, 225, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FCA5A5';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('FIRST-HAND ALERT', 512, 162);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('Carlos Vega', 512, 198);

        ctx.fillStyle = '#FDE047';
        ctx.font = 'bold 17px monospace';
        ctx.fillText('Airlock · 38m away', 512, 230);
        ctx.fillText('BP 158/98 · O2 89%', 512, 258);

        // Action Pill
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.roundRect(512, 286, 305, 44, 12);
        ctx.fill();
        ctx.fillStyle = '#022C22';
        ctx.font = 'bold 17px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Rescue Team Sent!', 664, 314);
        ctx.textAlign = 'left';

        // Right Sub-Card: 10 Crewmates Live Status Grid
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(865, 130, 335, 345, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('ALL 10 CREW LIVE', 888, 162);

        const crewNames = [
          { n: 'Elena R.', s: 'Safe', c: '#10B981' },
          { n: 'Carlos V.', s: 'ALERT', c: '#EF4444' },
          { n: 'Maya L.', s: 'Check', c: '#F59E0B' },
          { n: 'Marcus V.', s: 'Safe', c: '#10B981' },
          { n: 'Aisha P.', s: 'Safe', c: '#10B981' },
          { n: 'Kenji S.', s: 'Check', c: '#F59E0B' },
          { n: 'Sophie L.', s: 'Safe', c: '#10B981' },
          { n: 'Liam O.', s: 'Safe', c: '#10B981' },
          { n: 'Zara A.', s: 'Safe', c: '#10B981' },
          { n: 'Noah L.', s: 'Safe', c: '#10B981' },
        ];
        crewNames.forEach((member, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const bx = 886 + col * 150;
          const by = 180 + row * 56;
          ctx.fillStyle = member.s === 'ALERT' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)';
          ctx.beginPath();
          ctx.roundRect(bx, by, 140, 44, 10);
          ctx.fill();

          ctx.fillStyle = member.c;
          ctx.beginPath();
          ctx.arc(bx + 16, by + 22, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#F8FAFC';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(member.n, bx + 28, by + 27);
        });

        // Bottom Bar on Board: AI Summary Strip + mini live heartbeat line
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.beginPath();
        ctx.roundRect(488, 375, 355, 100, 18);
        ctx.fill();
        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('AEGIS BOARD AI', 510, 405);
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let lx = 0; lx <= 120; lx += 3) {
          const ph = ((lx + t * 75) % 45) / 45;
          const sy = ph > 0.45 && ph < 0.52 ? -10 : ph >= 0.52 && ph < 0.58 ? 8 : 0;
          if (lx === 0) ctx.moveTo(695 + lx, 400 + sy);
          else ctx.lineTo(695 + lx, 400 + sy);
        }
        ctx.stroke();
        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Elena is 38m away to help Carlos.', 510, 434);
        ctx.fillText('8 crewmates are safe.', 510, 458);

        ctx.restore();
      }

      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => cancelAnimationFrame(animId);
  }, [scene]);

  return (
    <div className="space-y-8 pb-28">
      {/* 1. VISUAL SUMMARY + SLIDE DECK */}
      <section
        aria-label="Demonstration Summary"
        className="rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6"
      >
        <div className="space-y-2 max-w-2xl">
          <h1 className="flex flex-wrap items-center gap-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-[#07152E]">
            <AegisWordmarkSvg height={48} className="h-9 sm:h-12 w-auto" />
            <span>Demonstration</span>
          </h1>
          <p className="text-base sm:text-lg font-semibold text-slate-600">
            Three visual steps showing how Aegis protects every astronaut.
          </p>
        </div>

        {/* Visual 3-Image Story Cards with Super Simple 1-Sentence Captions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VISUAL_SUMMARY_CARDS.map((card) => (
            <div
              key={card.step}
              className="rounded-3xl bg-slate-50 border border-slate-200 overflow-hidden flex flex-col shadow-xs"
            >
              <div className="relative h-44 bg-slate-900 overflow-hidden">
                <img
                  src={card.img}
                  alt={card.alt}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#07152E]/90 text-cyan-300 font-mono text-xs font-black">
                  Step {card.step}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <div className="text-lg font-extrabold text-[#07152E]">{card.title}</div>
                <p className="text-sm font-semibold text-slate-600 leading-snug">
                  {card.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Slide Deck Presentation Callout */}
        <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-extrabold text-[#07152E]">
              Wanna know more? Click here!
            </div>
            <p className="text-sm font-semibold text-slate-600">
              Open our picture slide deck to see the whole story.
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

      {/* 2. FROM CONCEPT TO THE REAL WORLD: INTERACTIVE SUIT VISUAL */}
      <section
        aria-label="From concept to the real world"
        className="rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6"
      >
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#07152E]">
            From concept to the real world
          </h2>
          <p className="text-sm sm:text-base font-semibold text-slate-600">
            Tap any pin on the suit to see its simple job.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-100">
            <img
              src={astrosuitImg}
              alt="Astrosuit with Detector 01 on hand, Detector 02 on belly, Detector 03 and 04 on legs, and Aegis Watch"
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
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg cursor-pointer transition transform hover:scale-105 ${
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

          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-3xl bg-[#07152E] text-white p-5 space-y-1.5 shadow-md">
              <div className="text-xs font-black uppercase text-cyan-300">Selected Sensor</div>
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

      {/* 3. HOW IT WORKS IN REAL LIFE: SUPER-3D SPACEWALK + WATCH + PEER SOS + AEGIS BOARD */}
      <section
        aria-label="How it works in real life?"
        className="rounded-[28px] sm:rounded-[34px] bg-white border border-slate-200 shadow-sm p-6 sm:p-10 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#07152E]">
              How it works in real life?
            </h2>
            <p className="text-sm sm:text-base font-semibold text-slate-600">
              {SCENE_CAPTIONS[scene]}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setScene(1);
                setProgress(10);
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer flex items-center gap-1.5 transition ${
                scene === 1
                  ? 'bg-[#07152E] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Watch className="w-4 h-4" />
              <span>1. Aegis Watch</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScene(2);
                setProgress(45);
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer flex items-center gap-1.5 transition ${
                scene === 2
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>2. Peer SOS</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScene(3);
                setProgress(80);
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer flex items-center gap-1.5 transition ${
                scene === 3
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>3. Aegis Board</span>
            </button>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden border-2 border-slate-800 bg-[#02040A] shadow-xl">
          <canvas
            ref={canvasRef}
            width={1280}
            height={560}
            onClick={() => setIsPlaying((p) => !p)}
            className="w-full h-auto block cursor-pointer"
            aria-label="3D video showing Aegis Watch, Peer SOS, and Aegis Board in real life"
          />

          <div className="bg-slate-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 text-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScene(1);
                  setProgress(0);
                  setIsPlaying(true);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                aria-label="Restart 3D video"
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
                  if (val < 34) setScene(1);
                  else if (val < 67) setScene(2);
                  else setScene(3);
                }}
                aria-label="Video timeline"
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-slate-300 whitespace-nowrap">
                {`00:${String(Math.round((progress / 100) * 30)).padStart(2, '0')} / 00:30`}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
