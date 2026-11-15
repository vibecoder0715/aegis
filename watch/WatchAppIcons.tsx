import React from 'react';
import { AegisEmblemSvg } from '../src/components/AegisBrandLogo';
import type { WatchAppId } from './watchDb';

export interface WatchAppMeta {
  id: WatchAppId;
  label: string;
  page: number; // 0..3 (2x3 per page = 6 per page, 21 total)
}

export const WATCH_APPS_CATALOG: WatchAppMeta[] = [
  // Page 1 (6 apps)
  { id: 'sleep', label: 'Sleep', page: 0 },
  { id: 'nutritions', label: 'Nutritions', page: 0 },
  { id: 'emotions', label: 'Emotions', page: 0 },
  { id: 'clock', label: 'Clock', page: 0 },
  { id: 'music', label: 'Music', page: 0 },
  { id: 'camera', label: 'Camera', page: 0 },
  // Page 2 (6 apps)
  { id: 'gallery', label: 'Gallery', page: 1 },
  { id: 'calculator', label: 'Calculator', page: 1 },
  { id: 'environment', label: 'Environment', page: 1 },
  { id: 'health_insights', label: 'Health Insights', page: 1 },
  { id: 'workout', label: 'Workout', page: 1 },
  { id: 'aegis_buff', label: 'Aegis Buff!', page: 1 },
  // Page 3 (6 apps)
  { id: 'notepad', label: 'Notepad', page: 2 },
  { id: 'recorder', label: 'Recorder', page: 2 },
  { id: 'aegis_ai', label: 'AegisAI', page: 2 },
  { id: 'calendar', label: 'Calendar', page: 2 },
  { id: 'pulse_wave', label: 'Pulse Wave', page: 2 },
  { id: 'spo2', label: 'SpO2', page: 2 },
  // Page 4 (3 apps)
  { id: 'radiomeasure', label: 'Radiomeasure', page: 3 },
  { id: 'viability', label: 'Viability', page: 3 },
  { id: 'mini_games', label: 'Mini Games', page: 3 },
];

export const WatchAppIconSvg: React.FC<{ id: WatchAppId; size?: number }> = ({
  id,
  size = 52,
}) => {
  const s = size;
  switch (id) {
    case 'sleep':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#4C1D95" />
          <path d="M37 18C28 19 22 27 24 36C26 45 35 50 44 47C36 49 30 43 30 34C30 26 33 21 37 18Z" fill="#C4B5FD" />
          <text x="41" y="25" fill="#EDE9FE" fontSize="10" fontWeight="800">z</text>
          <text x="47" y="19" fill="#DDD6FE" fontSize="8" fontWeight="800">z</text>
        </svg>
      );
    case 'nutritions':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#16A34A" />
          <path d="M32 22C24 22 19 29 19 36C19 44 25 49 32 49C39 49 45 44 45 36C45 29 40 22 32 22Z" fill="#DCFCE7" />
          <path d="M32 22C33 16 38 14 42 15C41 19 37 22 32 22Z" fill="#BBF7D0" />
        </svg>
      );
    case 'emotions':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#F8FAFC" />
          <ellipse cx="32" cy="32" rx="18" ry="12" transform="rotate(-25 32 32)" fill="#F59E0B" fillOpacity="0.85" />
          <ellipse cx="32" cy="32" rx="18" ry="11" transform="rotate(30 32 32)" fill="#06B6D4" fillOpacity="0.65" />
          <circle cx="32" cy="32" r="7" fill="#3B82F6" fillOpacity="0.55" />
        </svg>
      );
    case 'clock':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#1E293B" />
          <circle cx="32" cy="32" r="20" stroke="#E2E8F0" strokeWidth="3" />
          <path d="M32 20V32L40 37" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'music':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#E11D48" />
          <path d="M27 42V22L44 19V38" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="23" cy="43" r="5" fill="#FFFFFF" />
          <circle cx="40" cy="39" r="5" fill="#FFFFFF" />
        </svg>
      );
    case 'camera':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#334155" />
          <rect x="16" y="22" width="32" height="23" rx="6" fill="#E2E8F0" />
          <path d="M25 22L28 17H36L39 22" fill="#E2E8F0" />
          <circle cx="32" cy="34" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
        </svg>
      );
    case 'gallery':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#0284C7" />
          <rect x="17" y="19" width="30" height="26" rx="5" fill="#FFFFFF" />
          <circle cx="25" cy="27" r="3.5" fill="#F59E0B" />
          <path d="M20 41L29 31L36 37L40 33L45 41H20Z" fill="#0EA5E9" />
        </svg>
      );
    case 'calculator':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#D97706" />
          <rect x="20" y="16" width="24" height="32" rx="4" fill="#FFFBEB" />
          <rect x="23" y="20" width="18" height="6" rx="2" fill="#1E293B" />
          <circle cx="26" cy="32" r="2.2" fill="#475569" />
          <circle cx="32" cy="32" r="2.2" fill="#475569" />
          <circle cx="38" cy="32" r="2.2" fill="#D97706" />
          <circle cx="26" cy="40" r="2.2" fill="#475569" />
          <circle cx="32" cy="40" r="2.2" fill="#475569" />
          <circle cx="38" cy="40" r="2.2" fill="#D97706" />
        </svg>
      );
    case 'environment':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#0D9488" />
          <circle cx="32" cy="33" r="14" stroke="#CCFBF1" strokeWidth="3" fill="#14B8A6" />
          <ellipse cx="32" cy="33" rx="21" ry="7" transform="rotate(-20 32 33)" stroke="#FFFFFF" strokeWidth="2.8" />
        </svg>
      );
    case 'health_insights':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#06B6D4" />
          <circle cx="32" cy="34" r="9" fill="#FFFFFF" />
          <circle cx="32" cy="19" r="3.5" fill="#FFFFFF" />
          <circle cx="19" cy="41" r="3.5" fill="#FFFFFF" />
          <circle cx="45" cy="41" r="3.5" fill="#FFFFFF" />
          <path d="M32 22V28M22 39L27 36M42 39L37 36" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'workout':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#EA580C" />
          <circle cx="36" cy="18" r="4" fill="#FFFFFF" />
          <path d="M23 30L31 25L39 29L45 25M31 25L29 37L20 45M29 37L38 42L41 49" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'aegis_buff':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#7C3AED" />
          <path d="M32 15L36.5 25.5L48 27L39.5 34.5L41.5 46L32 40L22.5 46L24.5 34.5L16 27L27.5 25.5L32 15Z" fill="#FDE047" />
        </svg>
      );
    case 'notepad':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#EAB308" />
          <rect x="20" y="16" width="24" height="32" rx="4" fill="#FFFFFF" />
          <path d="M25 25H39M25 32H39M25 39H34" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'recorder':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#DC2626" />
          <rect x="27" y="16" width="10" height="18" rx="5" fill="#FFFFFF" />
          <path d="M21 30C21 36.1 25.9 41 32 41C38.1 41 43 36.1 43 30M32 41V48M25 48H39" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      );
    case 'aegis_ai':
      return (
        <div
          style={{ width: s, height: s }}
          className="rounded-full bg-white flex items-center justify-center shadow-md border border-slate-200"
        >
          <AegisEmblemSvg size={Math.round(s * 0.62)} />
        </div>
      );
    case 'calendar':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#2563EB" />
          <rect x="17" y="19" width="30" height="27" rx="5" fill="#FFFFFF" />
          <path d="M17 27H47" stroke="#EF4444" strokeWidth="5" />
          <text x="32" y="42" textAnchor="middle" fill="#1E293B" fontSize="13" fontWeight="900">U0</text>
        </svg>
      );
    case 'pulse_wave':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#E11D48" />
          <path d="M13 33H21L26 21L32 44L38 25L42 33H51" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'spo2':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#0EA5E9" />
          <path d="M32 15C24 26 20 33 20 39C20 45.6 25.4 51 32 51C38.6 51 44 45.6 44 39C44 33 40 26 32 15Z" fill="#FFFFFF" />
          <text x="32" y="42" textAnchor="middle" fill="#0284C7" fontSize="12" fontWeight="900">O₂</text>
        </svg>
      );
    case 'radiomeasure':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#FACC15" />
          <circle cx="32" cy="32" r="4.5" fill="#0F172A" />
          <path d="M32 16A16 16 0 0 1 45.8 24L37 29A6 6 0 0 0 32 26V16Z" fill="#0F172A" />
          <path d="M18.2 24A16 16 0 0 1 32 16V26A6 6 0 0 0 27 29L18.2 24Z" fill="#0F172A" />
          <path d="M32 48A16 16 0 0 1 18.2 40L27 35A6 6 0 0 0 37 35L45.8 40A16 16 0 0 1 32 48Z" fill="#0F172A" />
        </svg>
      );
    case 'viability':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#059669" />
          <circle cx="32" cy="20" r="5" fill="#FFFFFF" />
          <path d="M22 30H42M32 26V40M26 50L32 40L38 50" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'mini_games':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#4F46E5" />
          <rect x="16" y="23" width="32" height="19" rx="9" fill="#FFFFFF" />
          <path d="M24 29V36M20.5 32.5H27.5" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
          <circle cx="39" cy="30" r="2.2" fill="#EF4444" />
          <circle cx="42.5" cy="34.5" r="2.2" fill="#10B981" />
        </svg>
      );
  }
};

/**
 * Cute Planet Decorator SVG sprite rendered on Aegis Buff! Planet Builder
 */
export const PlanetDecoratorSvg: React.FC<{ itemId: string; size?: number }> = ({
  itemId,
  size = 24,
}) => {
  switch (itemId) {
    case 'bio_dome':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path d="M4 24C4 14 10 9 16 9C22 9 28 14 28 24H4Z" fill="#A7F3D0" stroke="#059669" strokeWidth="2" />
          <path d="M16 14V22M12 18C12 16 14 15 16 16M16 18C18 16 20 17 20 19" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'lunar_tree':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <rect x="14" y="19" width="4" height="9" rx="1.5" fill="#92400E" />
          <circle cx="16" cy="14" r="8" fill="#F472B6" />
          <circle cx="13" cy="12" r="2" fill="#FDE047" />
        </svg>
      );
    case 'mini_rover':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <rect x="7" y="15" width="18" height="8" rx="3" fill="#F8FAFC" stroke="#334155" strokeWidth="1.5" />
          <circle cx="11" cy="24" r="3" fill="#1E293B" />
          <circle cx="21" cy="24" r="3" fill="#1E293B" />
          <path d="M19 15V9L23 9" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'solar_wing':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <rect x="14.5" y="16" width="3" height="11" fill="#CBD5E1" />
          <rect x="5" y="10" width="22" height="9" rx="2" fill="#2563EB" stroke="#93C5FD" strokeWidth="1.5" />
          <path d="M12 10V19M20 10V19" stroke="#93C5FD" strokeWidth="1.2" />
        </svg>
      );
    case 'comms_dish':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path d="M12 26L16 17L20 26" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M8 10C11 16 19 18 24 14" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="20" cy="10" r="2" fill="#FBBF24" />
        </svg>
      );
    case 'astro_buddy':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="11" r="7" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
          <circle cx="16" cy="11" r="4.5" fill="#FDE68A" />
          <circle cx="14.5" cy="11" r="1" fill="#1E293B" />
          <circle cx="17.5" cy="11" r="1" fill="#1E293B" />
          <rect x="11" y="18" width="10" height="9" rx="4" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
          <path d="M21 19L26 14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'campfire':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path d="M16 7C12 13 11 17 11 20C11 23 13 25 16 25C19 25 21 23 21 20C21 17 19 14 16 7Z" fill="#FB923C" />
          <path d="M16 14C14 17 14 21 16 23C18 21 18 17 16 14Z" fill="#FEF08A" />
        </svg>
      );
    case 'observatory':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <rect x="8" y="17" width="16" height="10" rx="2" fill="#E2E8F0" />
          <path d="M8 17C8 11 12 8 16 8C20 8 24 11 24 17H8Z" fill="#38BDF8" />
          <path d="M19 11L26 6" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'water_pod':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <rect x="7" y="11" width="18" height="14" rx="6" fill="#0EA5E9" stroke="#BAE6FD" strokeWidth="1.5" />
          <text x="16" y="21" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="900">H₂O</text>
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path d="M10 27V7M10 7L24 11L10 16" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 7L24 11L10 16V7Z" fill="#EF4444" />
        </svg>
      );
  }
};
