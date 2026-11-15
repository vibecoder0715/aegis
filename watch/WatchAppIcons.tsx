import React from 'react';
import { AegisEmblemSvg } from '../src/components/AegisBrandLogo';

export type WatchAppId =
  | 'sleep'
  | 'nutritions'
  | 'h2o_intake'
  | 'emotions'
  | 'health_insights'
  | 'workout'
  | 'pulse_wave'
  | 'spo2'
  | 'radiomeasure'
  | 'viability'
  | 'aegis_buff'
  | 'aegis_ai'
  | 'environment'
  | 'clock'
  | 'calendar'
  | 'notepad'
  | 'recorder'
  | 'music'
  | 'camera'
  | 'gallery'
  | 'calculator'
  | 'mini_games';

export interface WatchAppDefinition {
  id: WatchAppId;
  name: string;
  label: string;
  shortName: string;
  accentBg: string;
  category: 'biometric' | 'environment' | 'utility' | 'gamification';
  page: number;
}

/**
 * Health & Wellbeing apps are placed right at the beginning of the Watch Apps catalog!
 */
export const WATCH_APPS_CATALOG: WatchAppDefinition[] = [
  { id: 'sleep', name: 'Sleep', label: 'Sleep', shortName: 'Sleep', accentBg: '#312E81', category: 'biometric', page: 0 },
  { id: 'nutritions', name: 'Nutritions', label: 'Nutritions', shortName: 'Food', accentBg: '#065F46', category: 'biometric', page: 0 },
  { id: 'h2o_intake', name: 'H2O Intake', label: 'H2O Intake', shortName: 'H2O', accentBg: '#0284C7', category: 'biometric', page: 0 },
  { id: 'emotions', name: 'Emotions', label: 'Emotions', shortName: 'Mood', accentBg: '#7C2D12', category: 'biometric', page: 0 },
  { id: 'health_insights', name: 'Daily Steps', label: 'Daily Steps', shortName: 'Steps', accentBg: '#14532D', category: 'biometric', page: 0 },
  { id: 'workout', name: 'Workout', label: 'Workout', shortName: 'Workout', accentBg: '#9A3412', category: 'biometric', page: 0 },
  { id: 'pulse_wave', name: 'Pulse Wave', label: 'Pulse Wave', shortName: 'Heart', accentBg: '#881337', category: 'biometric', page: 1 },
  { id: 'spo2', name: 'SpO2 Oxygen', label: 'SpO2 Oxygen', shortName: 'SpO2', accentBg: '#0C4A6E', category: 'biometric', page: 1 },
  { id: 'radiomeasure', name: 'Radiomeasure', label: 'Radiomeasure', shortName: 'Rad', accentBg: '#FACC15', category: 'biometric', page: 1 },
  { id: 'viability', name: 'Viability 3D', label: 'Viability 3D', shortName: 'Body 3D', accentBg: '#0F172A', category: 'biometric', page: 1 },
  { id: 'aegis_buff', name: 'Aegis Buff!', label: 'Aegis Buff!', shortName: 'Buff!', accentBg: '#4C1D95', category: 'gamification', page: 1 },
  { id: 'aegis_ai', name: 'AegisAI', label: 'AegisAI', shortName: 'AegisAI', accentBg: '#0F172A', category: 'utility', page: 1 },
  { id: 'environment', name: 'Air & Room', label: 'Air & Room', shortName: 'Room', accentBg: '#115E59', category: 'environment', page: 2 },
  { id: 'clock', name: 'Clock', label: 'Clock', shortName: 'Clock', accentBg: '#1E293B', category: 'utility', page: 2 },
  { id: 'calendar', name: 'Calendar', label: 'Calendar', shortName: 'Plan', accentBg: '#1E3A8A', category: 'utility', page: 2 },
  { id: 'notepad', name: 'Notepad', label: 'Notepad', shortName: 'Notes', accentBg: '#78350F', category: 'utility', page: 2 },
  { id: 'recorder', name: 'Recorder', label: 'Recorder', shortName: 'Voice', accentBg: '#7F1D1D', category: 'utility', page: 2 },
  { id: 'music', name: 'Music', label: 'Music', shortName: 'Music', accentBg: '#831843', category: 'utility', page: 2 },
  { id: 'camera', name: 'Camera', label: 'Camera', shortName: 'Cam', accentBg: '#334155', category: 'utility', page: 3 },
  { id: 'gallery', name: 'Gallery', label: 'Gallery', shortName: 'Photos', accentBg: '#0369A1', category: 'utility', page: 3 },
  { id: 'calculator', name: 'Calculator', label: 'Calculator', shortName: 'Math', accentBg: '#3F3F46', category: 'utility', page: 3 },
  { id: 'mini_games', name: 'Mini Games', label: 'Mini Games', shortName: 'Games', accentBg: '#3730A3', category: 'gamification', page: 3 },
];

export const WatchAppIconSvg: React.FC<{ appId?: WatchAppId; id?: WatchAppId; size?: number }> = ({
  appId,
  id,
  size = 36,
}) => {
  const resolvedId = appId ?? id ?? 'sleep';
  switch (resolvedId) {
    case 'h2o_intake':
      // Cute Water Droplet & Hydration Glass SVG
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="2.5" />
          <path
            d="M24 10C24 10 34 21.5 34 28.5C34 34.2 29.5 38.5 24 38.5C18.5 38.5 14 34.2 14 28.5C14 21.5 24 10 24 10Z"
            fill="#38BDF8"
            stroke="#BAE6FD"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M19.5 28C19.5 31 21.5 33.5 24.5 33.5"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="28" cy="24" r="1.8" fill="#E0F2FE" />
        </svg>
      );

    case 'sleep':
      // Crescent moon ONLY (clean golden crescent moon on deep night circle)
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#1E1B4B" stroke="#818CF8" strokeWidth="2.5" />
          <path
            d="M29.5 11.5C21.2 12.6 15.5 20.3 17.2 28.5C18.9 36.2 26.8 40.5 34.5 37.2C27.8 36.4 23.2 30.2 24.1 22.8C24.8 17.2 28.1 13.4 32.5 12C31.5 11.6 30.5 11.4 29.5 11.5Z"
            fill="#FACC15"
            stroke="#FEF08A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'nutritions':
      // Cute Broccoli and Egg vector icon
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#064E3B" stroke="#34D399" strokeWidth="2.5" />
          {/* Broccoli Stalk & Fluffy Green Crown (Left) */}
          <path
            d="M17 26V35C17 36.5 21 36.5 21 35V26H17Z"
            fill="#86EFAC"
            stroke="#064E3B"
            strokeWidth="1.5"
          />
          <circle cx="15" cy="21" r="5.2" fill="#22C55E" />
          <circle cx="20" cy="18.5" r="5.8" fill="#16A34A" />
          <circle cx="23.5" cy="22.5" r="4.8" fill="#4ADE80" />
          {/* Sunny-Side-Up Egg (Right) */}
          <path
            d="M28 22C33.5 21.5 38 25.5 37.5 30.8C37 35.8 32 38.5 26.8 37.5C22.2 36.6 20.5 32.5 22.2 28.2C23.5 24.5 25 22.3 28 22Z"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1.5"
          />
          <circle cx="30" cy="30.2" r="4.5" fill="#F59E0B" />
          <circle cx="28.8" cy="28.8" r="1.3" fill="#FEF08A" />
        </svg>
      );

    case 'emotions':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#7C2D12" stroke="#FB923C" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="13.5" fill="#FDE047" stroke="#431407" strokeWidth="2" />
          <path d="M17.5 21.5C18.5 19.5 20.5 19.5 21.5 21.5" stroke="#431407" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M26.5 21.5C27.5 19.5 29.5 19.5 30.5 21.5" stroke="#431407" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="16.8" cy="25" rx="2.2" ry="1.3" fill="#FB7185" />
          <ellipse cx="31.2" cy="25" rx="2.2" ry="1.3" fill="#FB7185" />
          <path d="M18.5 27C20.5 31 27.5 31 29.5 27" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'health_insights':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#14532D" stroke="#4ADE80" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="13" stroke="#22C55E" strokeWidth="3.5" strokeDasharray="62 20" strokeLinecap="round" />
          <circle cx="24" cy="24" r="8" stroke="#38BDF8" strokeWidth="3.5" strokeDasharray="38 14" strokeLinecap="round" />
          <circle cx="24" cy="24" r="3" fill="#FACC15" />
        </svg>
      );

    case 'workout':
      // Refined dynamic running man icon with motion speed lines
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#9A3412" stroke="#FB923C" strokeWidth="2.5" />
          {/* Speed lines */}
          <path d="M9 19H14" stroke="#FDBA74" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M7 25H13" stroke="#FDBA74" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M10 31H15" stroke="#FDBA74" strokeWidth="2.2" strokeLinecap="round" />
          {/* Runner Head */}
          <circle cx="30" cy="13.5" r="3.8" fill="#FDE047" />
          {/* Runner Torso & Arms */}
          <path
            d="M20 18.5L26.5 18L31.5 21.5L36 18.5"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M27.5 18.5L23.5 26.5L16.5 29"
            stroke="#FDE047"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Forward stride leg */}
          <path
            d="M24 26L31 28.5L34.5 36"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'pulse_wave':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#881337" stroke="#FB7185" strokeWidth="2.5" />
          <path
            d="M24 35.5C24 35.5 12 27.8 12 19.5C12 15.5 15.2 12.5 19 12.5C21.4 12.5 23.2 13.8 24 15.4C24.8 13.8 26.6 12.5 29 12.5C32.8 12.5 36 15.5 36 19.5C36 27.8 24 35.5 24 35.5Z"
            fill="#F43F5E"
          />
          <path
            d="M11 24.5H18.5L21.5 18.5L25.5 30L28.5 22.5L30.5 24.5H37"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'spo2':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="2.5" />
          <path
            d="M24 10C24 10 35 22 35 29.5C35 35.5 30 39 24 39C18 39 13 35.5 13 29.5C13 22 24 10 24 10Z"
            fill="#0284C7"
            stroke="#BAE6FD"
            strokeWidth="2"
          />
          <text x="24" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900">
            O2
          </text>
        </svg>
      );

    case 'radiomeasure':
      // Classic 3-fan radiation trefoil symbol on bright yellow circle matching screenshot image_cf2fd55f.png
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21.5" fill="#FACC15" stroke="#111827" strokeWidth="3" />
          {/* Top-Left Fan Blade */}
          <path
            d="M20.2 21.8L11.2 16.6A14.8 14.8 0 0 1 21.4 9.3L22.6 19.6A4.5 4.5 0 0 0 20.2 21.8Z"
            fill="#111827"
          />
          {/* Top-Right Fan Blade */}
          <path
            d="M27.8 21.8L36.8 16.6A14.8 14.8 0 0 0 26.6 9.3L25.4 19.6A4.5 4.5 0 0 1 27.8 21.8Z"
            fill="#111827"
          />
          {/* Bottom Fan Blade */}
          <path
            d="M21.5 27.8L16.3 36.8A14.8 14.8 0 0 0 31.7 36.8L26.5 27.8A4.5 4.5 0 0 1 21.5 27.8Z"
            fill="#111827"
          />
          {/* Center Core Dot */}
          <circle cx="24" cy="24" r="3.6" fill="#111827" />
        </svg>
      );

    case 'viability':
      // Refined 3D Wireframe Human Body Icon
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#090D16" stroke="#38BDF8" strokeWidth="2.5" />
          {/* Wireframe Head */}
          <ellipse cx="24" cy="11.5" rx="3.6" ry="4.2" stroke="#E2E8F0" strokeWidth="1.6" />
          <path d="M20.5 11.5H27.5M24 7.5V15.5" stroke="#38BDF8" strokeWidth="1" />
          {/* Wireframe Torso Mesh */}
          <path
            d="M18.5 16.5H29.5L28 27.5H20L18.5 16.5Z"
            stroke="#E2E8F0"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M19 20H29M19.5 23.5H28.5M24 16.5V27.5" stroke="#38BDF8" strokeWidth="1.1" />
          {/* Wireframe Arms */}
          <path d="M18.5 17L12.5 25.5M29.5 17L35.5 25.5" stroke="#E2E8F0" strokeWidth="1.8" strokeLinecap="round" />
          {/* Wireframe Legs */}
          <path d="M20.5 27.5L18.5 39M27.5 27.5L29.5 39" stroke="#E2E8F0" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M19.5 33H21.5M26.5 33H28.5" stroke="#38BDF8" strokeWidth="1.2" />
        </svg>
      );

    case 'aegis_buff':
      // Super handsome Golden Star + Muscular Flexing Arm icon!
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="buffBgGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4C1D95" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>
            <linearGradient id="goldStarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="21" fill="url(#buffBgGrad)" stroke="#FBBF24" strokeWidth="2.5" />
          {/* Radiant Handsome Star (Upper Right) */}
          <path
            d="M32 8.5L34.2 13.2L39.3 13.9L35.6 17.4L36.5 22.5L32 20L27.5 22.5L28.4 17.4L24.7 13.9L29.8 13.2L32 8.5Z"
            fill="url(#goldStarGrad)"
            stroke="#FFFFFF"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          {/* Handsome Muscular Flexing Bicep & Fist (Foreground) */}
          <path
            d="M14 21C12.2 21 11 19.5 11.5 17.5C12 15.2 14.8 14.5 16.8 16C17.8 16.8 18.2 18.5 17.5 20L15.8 25.5C18.5 23.2 22.8 23.2 25.6 25.6C27.8 27.5 28.2 30.5 26.5 32.8C29.5 32.5 32.5 30.8 34.5 28.5C36 31.8 33.8 36.2 29.2 37.5C23.5 39 15.8 38.2 12.2 34.2C9.8 31.5 10.5 26.5 14 21Z"
            fill="#FBBF24"
            stroke="#FEF08A"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Bicep Peak Definition Curve */}
          <path
            d="M19.5 27.5C21.5 26.2 24 26.8 25 28.8"
            stroke="#78350F"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'aegis_ai':
      return (
        <div
          style={{ width: size, height: size }}
          className="rounded-full bg-white flex items-center justify-center shadow-inner border-2 border-amber-400"
        >
          <AegisEmblemSvg size={Math.round(size * 0.72)} />
        </div>
      );

    case 'environment':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#115E59" stroke="#2DD4BF" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="11" stroke="#99F6E4" strokeWidth="2.2" />
          <path d="M13 24H35M24 13C27 16.5 27 31.5 24 35C21 31.5 21 16.5 24 13Z" stroke="#5EEAD4" strokeWidth="2" />
        </svg>
      );

    case 'clock':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="12" stroke="#F8FAFC" strokeWidth="2.4" />
          <path d="M24 17V24L29 27" stroke="#38BDF8" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );

    case 'calendar':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="2.5" />
          <rect x="13" y="14" width="22" height="20" rx="4" fill="#EFF6FF" />
          <rect x="13" y="14" width="22" height="6" rx="2" fill="#EF4444" />
          <text x="24" y="30" textAnchor="middle" fill="#1E3A8A" fontSize="10" fontWeight="900">
            15
          </text>
        </svg>
      );

    case 'notepad':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#78350F" stroke="#FBBF24" strokeWidth="2.5" />
          <rect x="15" y="12" width="18" height="24" rx="3" fill="#FEF3C7" />
          <path d="M19 19H29M19 24H29M19 29H25" stroke="#92400E" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'recorder':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#7F1D1D" stroke="#F87171" strokeWidth="2.5" />
          <rect x="20" y="13" width="8" height="14" rx="4" fill="#FCA5A5" />
          <path d="M16 24C16 28.4 19.6 32 24 32C28.4 32 32 28.4 32 24M24 32V36" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'music':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#831843" stroke="#F472B6" strokeWidth="2.5" />
          <path d="M20 31V16L32 13V28" stroke="#FBCFE8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="17.5" cy="31.5" r="3.5" fill="#F472B6" />
          <circle cx="29.5" cy="28.5" r="3.5" fill="#F472B6" />
        </svg>
      );

    case 'camera':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#334155" stroke="#CBD5E1" strokeWidth="2.5" />
          <rect x="12" y="17" width="24" height="17" rx="4" fill="#0F172A" stroke="#E2E8F0" strokeWidth="2" />
          <circle cx="24" cy="25.5" r="5" stroke="#38BDF8" strokeWidth="2.5" />
          <circle cx="31" cy="20.5" r="1.5" fill="#F43F5E" />
        </svg>
      );

    case 'gallery':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#0369A1" stroke="#7DD3FC" strokeWidth="2.5" />
          <rect x="13" y="15" width="22" height="18" rx="3" fill="#E0F2FE" />
          <circle cx="19" cy="20.5" r="2.2" fill="#F59E0B" />
          <path d="M14 31L21 24L26 28L30 25L34 31H14Z" fill="#0284C7" />
        </svg>
      );

    case 'calculator':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#3F3F46" stroke="#D4D4D8" strokeWidth="2.5" />
          <rect x="15" y="12" width="18" height="24" rx="3" fill="#18181B" stroke="#A1A1AA" strokeWidth="2" />
          <rect x="18" y="15" width="12" height="5" rx="1" fill="#34D399" />
          <circle cx="19.5" cy="24.5" r="1.6" fill="#F4F4F5" />
          <circle cx="24" cy="24.5" r="1.6" fill="#F4F4F5" />
          <circle cx="28.5" cy="24.5" r="1.6" fill="#F59E0B" />
          <circle cx="19.5" cy="29.5" r="1.6" fill="#F4F4F5" />
          <circle cx="24" cy="29.5" r="1.6" fill="#F4F4F5" />
          <circle cx="28.5" cy="29.5" r="1.6" fill="#F59E0B" />
        </svg>
      );

    case 'mini_games':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="#3730A3" stroke="#A5B4FC" strokeWidth="2.5" />
          <rect x="12" y="18" width="24" height="13" rx="6.5" fill="#EEF2FF" />
          <path d="M18 22V27M15.5 24.5H20.5" stroke="#3730A3" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="29" cy="23" r="1.8" fill="#EF4444" />
          <circle cx="32.5" cy="26" r="1.8" fill="#10B981" />
        </svg>
      );
  }
};

export const PlanetDecoratorSvg: React.FC<{ itemId: string; size?: number }> = ({
  itemId,
  size = 28,
}) => {
  const uid = React.useId().replace(/:/g, '');
  switch (itemId) {
    case 'solar_tree':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-leafTop`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="55%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#14532D" />
            </radialGradient>
            <radialGradient id={`${uid}-leafBase`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="60%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#052E16" />
            </radialGradient>
            <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="50%" stopColor="#92400E" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
          </defs>
          <ellipse cx="20" cy="35" rx="9" ry="2.5" fill="#000000" fillOpacity="0.4" />
          <path d="M17.5 23H22.5L23.5 34.5C21.2 35.4 18.8 35.4 16.5 34.5L17.5 23Z" fill={`url(#${uid}-trunk)`} />
          <ellipse cx="20" cy="21" rx="11.5" ry="7.5" fill={`url(#${uid}-leafBase)`} />
          <ellipse cx="20" cy="14.5" rx="9.5" ry="7" fill={`url(#${uid}-leafTop)`} />
          <ellipse cx="17" cy="11.5" rx="3.5" ry="2" fill="#DCFCE7" fillOpacity="0.55" />
          <circle cx="14.5" cy="18" r="1.8" fill="#FDE047" />
          <circle cx="24.5" cy="15.5" r="1.6" fill="#FACC15" />
        </svg>
      );

    case 'hydro_dome':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-glass`} cx="35%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="38%" stopColor="#38BDF8" />
              <stop offset="80%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0C4A6E" />
            </radialGradient>
            <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <ellipse cx="20" cy="33" rx="14.5" ry="3.5" fill="#000000" fillOpacity="0.45" />
          <path d="M7 27C7 16 12.5 9.5 20 9.5C27.5 9.5 33 16 33 27H7Z" fill={`url(#${uid}-glass)`} />
          <path d="M11 23C14 19 26 19 29 23" stroke="#BAE6FD" strokeWidth="1.2" strokeOpacity="0.55" />
          <path d="M13 15.5C15 12.5 18 11.5 20.5 11.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.8" />
          <ellipse cx="20" cy="28.5" rx="14.5" ry="4" fill={`url(#${uid}-rim)`} />
          <ellipse cx="20" cy="27.5" rx="13.5" ry="2.6" fill="#0EA5E9" fillOpacity="0.45" />
        </svg>
      );

    case 'aurora_ring':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-ringA`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <radialGradient id={`${uid}-core`} cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#67E8F9" />
              <stop offset="100%" stopColor="#4338CA" />
            </radialGradient>
          </defs>
          <ellipse cx="20" cy="20" rx="16" ry="6.8" transform="rotate(-22 20 20)" stroke={`url(#${uid}-ringA)`} strokeWidth="4.5" />
          <circle cx="20" cy="20" r="5.5" fill={`url(#${uid}-core)`} />
          <path d="M6.5 25.5C11 28 24 23 33.5 14.5" stroke="#F5D0FE" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.85" />
        </svg>
      );

    case 'mini_rover':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <radialGradient id={`${uid}-wheel`} cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="70%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <ellipse cx="20" cy="34" rx="14" ry="2.8" fill="#000000" fillOpacity="0.45" />
          {/* Mast & Camera Head */}
          <path d="M25 18V10.5" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="21.5" y="7" width="8.5" height="5" rx="1.8" fill="#E2E8F0" stroke="#475569" strokeWidth="1.2" />
          <circle cx="27.5" cy="9.5" r="1.4" fill="#38BDF8" />
          {/* 3D Chassis */}
          <path d="M9 19.5L13 15.5H28.5L31 20.5V26H9V19.5Z" fill={`url(#${uid}-body)`} />
          <rect x="12" y="17.5" width="13" height="2.2" rx="1" fill="#FEF9C3" fillOpacity="0.7" />
          {/* 3D Wheels */}
          <circle cx="13" cy="28.5" r="4.5" fill={`url(#${uid}-wheel)`} />
          <circle cx="13" cy="28.5" r="1.7" fill="#CBD5E1" />
          <circle cx="27" cy="28.5" r="4.5" fill={`url(#${uid}-wheel)`} />
          <circle cx="27" cy="28.5" r="1.7" fill="#CBD5E1" />
        </svg>
      );

    case 'beacon_tower':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <radialGradient id={`${uid}-beacon`} cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#FFF1F2" />
              <stop offset="40%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#9F1239" />
            </radialGradient>
          </defs>
          <ellipse cx="20" cy="35" rx="10" ry="2.6" fill="#000000" fillOpacity="0.45" />
          <circle cx="20" cy="10" r="8.5" fill="#F43F5E" fillOpacity="0.22" />
          <path d="M13.5 34L18 13.5H22L26.5 34H13.5Z" fill={`url(#${uid}-metal)`} />
          <path d="M16 27H24M17 21H23" stroke="#1E293B" strokeWidth="1.4" strokeOpacity="0.5" />
          <circle cx="20" cy="10" r="4.3" fill={`url(#${uid}-beacon)`} />
          <circle cx="18.6" cy="8.6" r="1.2" fill="#FFFFFF" fillOpacity="0.85" />
        </svg>
      );

    case 'starlight_pond':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-pond`} cx="40%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="55%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>
          </defs>
          <ellipse cx="20" cy="24" rx="15" ry="8.5" fill="#334155" />
          <ellipse cx="20" cy="23.5" rx="13.5" ry="7.2" fill={`url(#${uid}-pond)`} />
          <ellipse cx="18" cy="24" rx="8.5" ry="3.8" stroke="#BAE6FD" strokeWidth="1.2" strokeOpacity="0.55" />
          <path d="M20 12L21.7 17.5L27 19.2L21.7 21L20 26.5L18.3 21L13 19.2L18.3 17.5Z" fill="#FEF08A" />
        </svg>
      );

    default:
      // 3D Crystal Spire
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-crysL`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FBCFE8" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id={`${uid}-crysR`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#DB2777" />
              <stop offset="100%" stopColor="#701A75" />
            </linearGradient>
          </defs>
          <ellipse cx="20" cy="34.5" rx="11" ry="2.8" fill="#000000" fillOpacity="0.45" />
          {/* Side Mini Crystal */}
          <path d="M9 28L12.5 16L16.5 29L12.5 32L9 28Z" fill={`url(#${uid}-crysL)`} />
          {/* Main 3D Faceted Crystal */}
          <path d="M20 5.5L12.5 19.5L16.5 33.5L20 35V5.5Z" fill={`url(#${uid}-crysL)`} />
          <path d="M20 5.5L27.5 19.5L23.5 33.5L20 35V5.5Z" fill={`url(#${uid}-crysR)`} />
          <path d="M20 6.5L16 19L20 26" stroke="#FFFFFF" strokeWidth="1.3" strokeOpacity="0.7" />
        </svg>
      );
  }
};
