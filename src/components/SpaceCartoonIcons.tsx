import React, { useEffect, useState } from 'react';

export type AstronautPoseId =
  | 'idle'
  | 'calm'
  | 'happy'
  | 'wink'
  | 'thinking'
  | 'surprised'
  | 'mischievous'
  | 'laughing'
  | 'sleepy'
  | 'cheering'
  | 'greeting'
  | 'sad'
  | 'angry'
  | 'worried';

export type AstronautEmotion =
  | AstronautPoseId
  | 'alert'
  | 'radiation'
  | 'workout';

export interface AstronautPoseMeta {
  id: AstronautPoseId;
  number: number;
  label: string;
  shortTitle: string;
  telemetryTrigger: string;
}

export const ASTRONAUT_10_POSES: AstronautPoseMeta[] = [
  {
    id: 'happy',
    number: 1,
    label: 'Happy',
    shortTitle: 'Happy',
    telemetryTrigger: 'Feeling great today!',
  },
  {
    id: 'idle',
    number: 2,
    label: 'Calm',
    shortTitle: 'Calm',
    telemetryTrigger: 'Steady heart and breath.',
  },
  {
    id: 'worried',
    number: 3,
    label: 'Worried',
    shortTitle: 'Worried',
    telemetryTrigger: 'Take a slow breath.',
  },
  {
    id: 'sad',
    number: 4,
    label: 'Sad',
    shortTitle: 'Sad',
    telemetryTrigger: 'Talk with a friend.',
  },
  {
    id: 'angry',
    number: 5,
    label: 'Angry',
    shortTitle: 'Angry',
    telemetryTrigger: 'Drink water and rest.',
  },
  {
    id: 'sleepy',
    number: 6,
    label: 'Sleepy',
    shortTitle: 'Sleepy',
    telemetryTrigger: 'Time for a good nap.',
  },
  {
    id: 'surprised',
    number: 7,
    label: 'Surprised',
    shortTitle: 'Surprised',
    telemetryTrigger: 'Check your watch alert!',
  },
  {
    id: 'cheering',
    number: 8,
    label: 'Cheering',
    shortTitle: 'Cheering',
    telemetryTrigger: 'Workout goal complete!',
  },
  {
    id: 'wink',
    number: 9,
    label: 'Wink',
    shortTitle: 'Wink',
    telemetryTrigger: 'Great job today!',
  },
  {
    id: 'greeting',
    number: 10,
    label: 'Wave',
    shortTitle: 'Wave',
    telemetryTrigger: 'Say hi to your crew!',
  },
];

export interface ContinuousEmotionParams {
  /** 0..100 continuum across all 10 emotions */
  moodContinuum?: number;
  heartRate?: number;
  radiationRate?: number;
  sleepHours?: number;
  continuousAutoCycle?: boolean;
}

interface AstronautCharacterProps {
  emotion?: AstronautEmotion;
  continuous?: ContinuousEmotionParams;
  className?: string;
  size?: number;
  showCaptionPill?: boolean;
}

export function normalizeToPoseId(
  emotion: AstronautEmotion = 'idle',
  continuum?: number
): AstronautPoseId {
  if (typeof continuum === 'number') {
    const idx = Math.max(0, Math.min(9, Math.floor((continuum / 100.01) * 10)));
    return ASTRONAUT_10_POSES[idx].id;
  }
  switch (emotion) {
    case 'calm':
      return 'idle';
    case 'alert':
      return 'worried';
    case 'radiation':
      return 'surprised';
    case 'workout':
      return 'cheering';
    default:
      return emotion;
  }
}

interface PoseRigTarget {
  headTilt: number;
  headY: number;
  torsoTilt: number;
  blushOpacity: number;
  browLiftY: number;
  browTiltDeg: number;
  gazeX: number;
  gazeY: number;
  openEyeOpacityL: number;
  openEyeOpacityR: number;
  happyArchOpacityL: number;
  happyArchOpacityR: number;
  sleepArchOpacity: number;
  shockEyeOpacity: number;
  smugLidOpacity: number;
  mouthPath: string;
  tongueOpacity: number;
  mischiefTongueOpacity: number;
}

const POSE_RIG_TABLE: Record<AstronautPoseId, PoseRigTarget> = {
  idle: {
    headTilt: 0,
    headY: 0,
    torsoTilt: 0,
    blushOpacity: 0.58,
    browLiftY: 0,
    browTiltDeg: 0,
    gazeX: 0,
    gazeY: 0,
    openEyeOpacityL: 1,
    openEyeOpacityR: 1,
    happyArchOpacityL: 0,
    happyArchOpacityR: 0,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 130 116 Q 136 121 142 116 Q 136 119 130 116 Z',
    tongueOpacity: 0,
    mischiefTongueOpacity: 0,
  },
  calm: {
    headTilt: 0,
    headY: 0,
    torsoTilt: 0,
    blushOpacity: 0.58,
    browLiftY: 0,
    browTiltDeg: 0,
    gazeX: 0,
    gazeY: 0,
    openEyeOpacityL: 1,
    openEyeOpacityR: 1,
    happyArchOpacityL: 0,
    happyArchOpacityR: 0,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 130 116 Q 136 121 142 116 Q 136 119 130 116 Z',
    tongueOpacity: 0,
    mischiefTongueOpacity: 0,
  },
  happy: {
    headTilt: -2,
    headY: -2,
    torsoTilt: -1.5,
    blushOpacity: 0.82,
    browLiftY: -3,
    browTiltDeg: 3,
    gazeX: 0,
    gazeY: 0,
    openEyeOpacityL: 0,
    openEyeOpacityR: 0,
    happyArchOpacityL: 1,
    happyArchOpacityR: 1,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 124 112 Q 136 113 148 112 Q 148 128 136 128 Q 124 128 124 112 Z',
    tongueOpacity: 1,
    mischiefTongueOpacity: 0,
  },
  wink: {
    headTilt: 2.5,
    headY: 0,
    torsoTilt: 1,
    blushOpacity: 0.72,
    browLiftY: -1.5,
    browTiltDeg: 2,
    gazeX: 0,
    gazeY: 0,
    openEyeOpacityL: 1,
    openEyeOpacityR: 0,
    happyArchOpacityL: 0,
    happyArchOpacityR: 1,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 126 113 Q 136 114 146 113 Q 146 126 136 126 Q 126 126 126 113 Z',
    tongueOpacity: 0.9,
    mischiefTongueOpacity: 0,
  },
  thinking: {
    headTilt: 4.5,
    headY: 1,
    torsoTilt: 1.5,
    blushOpacity: 0.5,
    browLiftY: -2,
    browTiltDeg: -4,
    gazeX: 3.5,
    gazeY: -2.5,
    openEyeOpacityL: 1,
    openEyeOpacityR: 1,
    happyArchOpacityL: 0,
    happyArchOpacityR: 0,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 134 116 Q 137 114 140 116 Q 137 119 134 116 Z',
    tongueOpacity: 0,
    mischiefTongueOpacity: 0,
  },
  surprised: {
    headTilt: -1,
    headY: -2,
    torsoTilt: 0,
    blushOpacity: 0.45,
    browLiftY: -5,
    browTiltDeg: -10,
    gazeX: 0,
    gazeY: 0,
    openEyeOpacityL: 0,
    openEyeOpacityR: 0,
    happyArchOpacityL: 0,
    happyArchOpacityR: 0,
    sleepArchOpacity: 0,
    shockEyeOpacity: 1,
    smugLidOpacity: 0,
    mouthPath: 'M 130 113 Q 136 110 142 113 Q 143 125 136 125 Q 129 125 130 113 Z',
    tongueOpacity: 0.4,
    mischiefTongueOpacity: 0,
  },
  mischievous: {
    headTilt: -3.5,
    headY: 1,
    torsoTilt: -2,
    blushOpacity: 0.75,
    browLiftY: 1.5,
    browTiltDeg: 5,
    gazeX: 2,
    gazeY: 1,
    openEyeOpacityL: 1,
    openEyeOpacityR: 1,
    happyArchOpacityL: 0,
    happyArchOpacityR: 0,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 1,
    mouthPath: 'M 128 114 Q 136 116 144 114 Q 136 116 128 114 Z',
    tongueOpacity: 0,
    mischiefTongueOpacity: 1,
  },
  laughing: {
    headTilt: -6.5,
    headY: -2,
    torsoTilt: -2,
    blushOpacity: 0.88,
    browLiftY: -3.5,
    browTiltDeg: 4,
    gazeX: 0,
    gazeY: 0,
    openEyeOpacityL: 0,
    openEyeOpacityR: 0,
    happyArchOpacityL: 1,
    happyArchOpacityR: 1,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 123 111 Q 136 112 149 111 Q 149 129 136 129 Q 123 129 123 111 Z',
    tongueOpacity: 1,
    mischiefTongueOpacity: 0,
  },
  sleepy: {
    headTilt: 13,
    headY: 24,
    torsoTilt: 4,
    blushOpacity: 0.68,
    browLiftY: 2,
    browTiltDeg: -3,
    gazeX: 0,
    gazeY: 2,
    openEyeOpacityL: 0,
    openEyeOpacityR: 0,
    happyArchOpacityL: 0,
    happyArchOpacityR: 0,
    sleepArchOpacity: 1,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 132 116 Q 136 118 140 116 Q 136 118 132 116 Z',
    tongueOpacity: 0,
    mischiefTongueOpacity: 0,
  },
  cheering: {
    headTilt: -3,
    headY: -2,
    torsoTilt: -1,
    blushOpacity: 0.85,
    browLiftY: -3,
    browTiltDeg: 3,
    gazeX: 0,
    gazeY: -1,
    openEyeOpacityL: 1,
    openEyeOpacityR: 1,
    happyArchOpacityL: 0,
    happyArchOpacityR: 0,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 125 112 Q 136 113 147 112 Q 147 128 136 128 Q 125 128 125 112 Z',
    tongueOpacity: 1,
    mischiefTongueOpacity: 0,
  },
  greeting: {
    headTilt: 3,
    headY: -1,
    torsoTilt: 1.5,
    blushOpacity: 0.8,
    browLiftY: -2.5,
    browTiltDeg: 3,
    gazeX: 0,
    gazeY: 0,
    openEyeOpacityL: 0,
    openEyeOpacityR: 0,
    happyArchOpacityL: 1,
    happyArchOpacityR: 1,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 125 112 Q 136 113 147 112 Q 147 127 136 127 Q 125 127 125 112 Z',
    tongueOpacity: 1,
    mischiefTongueOpacity: 0,
  },
  sad: {
    headTilt: -4,
    headY: 3,
    torsoTilt: -2,
    blushOpacity: 0.4,
    browLiftY: -1,
    browTiltDeg: -8,
    gazeX: 0,
    gazeY: 2.5,
    openEyeOpacityL: 1,
    openEyeOpacityR: 1,
    happyArchOpacityL: 0,
    happyArchOpacityR: 0,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 128 122 Q 136 114 144 122 Q 136 117 128 122 Z',
    tongueOpacity: 0,
    mischiefTongueOpacity: 0,
  },
  angry: {
    headTilt: 2,
    headY: 1,
    torsoTilt: 1,
    blushOpacity: 0.9,
    browLiftY: 2.5,
    browTiltDeg: 12,
    gazeX: 0,
    gazeY: 0,
    openEyeOpacityL: 1,
    openEyeOpacityR: 1,
    happyArchOpacityL: 0,
    happyArchOpacityR: 0,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0.6,
    mouthPath: 'M 127 121 Q 136 115 145 121 Z',
    tongueOpacity: 0,
    mischiefTongueOpacity: 0,
  },
  worried: {
    headTilt: -2.5,
    headY: 1.5,
    torsoTilt: -1,
    blushOpacity: 0.5,
    browLiftY: -3,
    browTiltDeg: -9,
    gazeX: -1.5,
    gazeY: 1,
    openEyeOpacityL: 1,
    openEyeOpacityR: 1,
    happyArchOpacityL: 0,
    happyArchOpacityR: 0,
    sleepArchOpacity: 0,
    shockEyeOpacity: 0,
    smugLidOpacity: 0,
    mouthPath: 'M 129 120 Q 133 116 136 120 Q 139 123 143 119',
    tongueOpacity: 0,
    mischiefTongueOpacity: 0,
  },
};

/**
 * 10× Fine-Tuned Pure-SVG Vector Astronaut with 60fps CSS Keyframe Animations
 * and Smooth Cubic-Bezier Spring Morphing Across All 10 Reference Emotions.
 */
export const AstronautCharacterSvg: React.FC<AstronautCharacterProps> = ({
  emotion = 'idle',
  continuous,
  className = '',
  size = 240,
  showCaptionPill = false,
}) => {
  const [autoIndex, setAutoIndex] = useState(0);

  useEffect(() => {
    if (!continuous?.continuousAutoCycle) return;
    const id = window.setInterval(() => {
      setAutoIndex((prev) => (prev + 1) % ASTRONAUT_10_POSES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [continuous?.continuousAutoCycle]);

  const activePose: AstronautPoseId = (() => {
    if (continuous?.continuousAutoCycle) {
      return ASTRONAUT_10_POSES[autoIndex].id;
    }
    if (typeof continuous?.moodContinuum === 'number') {
      return normalizeToPoseId(emotion, continuous.moodContinuum);
    }
    return normalizeToPoseId(emotion);
  })();

  const poseMeta =
    ASTRONAUT_10_POSES.find((p) => p.id === activePose) || ASTRONAUT_10_POSES[0];
  const rig = POSE_RIG_TABLE[activePose];

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 300 310"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-full h-auto overflow-visible"
        role="img"
        aria-label={`Astronaut character ${poseMeta.label}`}
      >
        <defs>
          {/* Multi-stop Hu Tao Crimson Iris Gradient */}
          <linearGradient id="crimsonEyeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E090E" />
            <stop offset="42%" stopColor="#9A1C25" />
            <stop offset="82%" stopColor="#E84A43" />
            <stop offset="100%" stopColor="#FF857A" />
          </linearGradient>

          {/* Multi-stop Rich Dark-Auburn Anime Hair Gradient */}
          <linearGradient id="auburnHairGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#542628" />
            <stop offset="48%" stopColor="#3F1B1D" />
            <stop offset="85%" stopColor="#5C2526" />
            <stop offset="100%" stopColor="#853330" />
          </linearGradient>

          {/* Cel-Shaded Off-White Spacesuit Gradient */}
          <linearGradient id="spacesuitGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F5F0FC" />
            <stop offset="100%" stopColor="#DBD2EA" />
          </linearGradient>

          {/* Warm Peach Skin Gradient with Subtle Chin Shading */}
          <linearGradient id="peachSkinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF0E5" />
            <stop offset="78%" stopColor="#FFE6D6" />
            <stop offset="100%" stopColor="#F7CEBA" />
          </linearGradient>

          {/* Warm Yellow Moon Pillow Gradient for Pose 8 (Sleepy) */}
          <radialGradient id="moonPillowGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FFF08A" />
            <stop offset="65%" stopColor="#F7B733" />
            <stop offset="100%" stopColor="#D98218" />
          </radialGradient>

          {/* Crisp White Die-Cut Sticker Border around the entire character */}
          <filter id="chibiStickerOutline" x="-16%" y="-16%" width="132%" height="132%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="dilated" />
            <feFlood floodColor="#FFFFFF" result="whiteStroke" />
            <feComposite in="whiteStroke" in2="dilated" operator="in" result="outline" />
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#120B1D" floodOpacity="0.45" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="outline" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Twinkling 4-Point Stars from Reference Sheet */}
        <g className="astro-badge-bob">
          <path d="M26 38L30 46L38 50L30 54L26 62L22 54L14 50L22 46Z" fill="#F5A623" opacity="0.9" />
          <path d="M274 268L277 275L284 278L277 281L274 288L271 281L264 278L271 275Z" fill="#F5A623" opacity="0.9" />
        </g>

        {/* ===================================================================== */}
        {/* MAIN DIE-CUT STICKER CHARACTER GROUP WITH 60FPS BREATHING FLOAT       */}
        {/* ===================================================================== */}
        <g filter="url(#chibiStickerOutline)" className="astro-rig-breathe">
          {/* 1. LONG FLOWING BACK HAIR (With Gentle 60fps Sway & Wispy Curls) */}
          <g
            className="astro-smooth-part"
            style={{ transform: `translateY(${rig.headY}px)` }}
          >
            <g className="astro-hair-left">
              <path
                d="M68 128C30 146 18 182 30 214C20 204 15 190 17 176C9 198 20 226 45 235C39 224 39 212 45 202C43 218 51 233 68 239L92 178Z"
                fill="url(#auburnHairGrad)"
                stroke="#231115"
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </g>
            <g className="astro-hair-right">
              <path
                d="M196 130C228 150 236 186 222 218C232 208 237 194 235 180C241 202 230 228 207 237C213 224 211 210 205 200C205 216 197 231 182 237L172 176Z"
                fill="url(#auburnHairGrad)"
                stroke="#231115"
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </g>
          </g>

          {/* 2. PLSS BACKPACK (Left-Side Behind Torso with Cel-Shaded Panel) */}
          <g
            className="astro-smooth-part"
            style={{ transform: `translateY(${rig.headY * 0.75}px)` }}
          >
            <rect
              x="53"
              y="147"
              width="49"
              height="71"
              rx="13"
              fill="#E5DFEE"
              stroke="#231115"
              strokeWidth="5"
            />
            <rect
              x="56"
              y="186"
              width="43"
              height="29"
              rx="9"
              fill="#CFC7E0"
            />
            <rect
              x="44"
              y="164"
              width="12"
              height="33"
              rx="5.5"
              fill="#F07E2E"
              stroke="#231115"
              strokeWidth="4.5"
            />
            <path d="M55 185H89" stroke="#231115" strokeWidth="4.5" />
          </g>

          {/* 3. STANDING LEGS & TORSO (Smoothly fades out only when sitting in Pose 8 Sleepy) */}
          <g
            className="astro-smooth-part"
            style={{
              opacity: activePose === 'sleepy' ? 0 : 1,
              transform:
                activePose === 'sleepy'
                  ? 'translateY(14px) scale(0.95)'
                  : `rotate(${rig.torsoTilt}deg)`,
              transformOrigin: '135px 210px',
              pointerEvents: activePose === 'sleepy' ? 'none' : 'auto',
            }}
          >
            {/* Left Leg */}
            <path
              d={
                activePose === 'happy' || activePose === 'laughing' || activePose === 'greeting'
                  ? 'M88 212L74 260C70 272 80 284 96 286L118 282L132 222H88Z'
                  : activePose === 'mischievous'
                  ? 'M88 212L70 268C66 280 76 288 94 288H116L132 222H88Z'
                  : 'M88 212L80 268C78 280 86 288 104 288H128V222H88Z'
              }
              fill="url(#spacesuitGrad)"
              stroke="#231115"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* Right Leg */}
            <path
              d={
                activePose === 'cheering'
                  ? 'M134 222L144 258C148 270 164 272 178 264L184 212H134Z'
                  : 'M134 222L138 268C138 280 146 288 164 288H186C196 288 200 278 196 266L184 212H134Z'
              }
              fill="url(#spacesuitGrad)"
              stroke="#231115"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* Inner Leg Cel-Shadow */}
            <path d="M124 224V268" stroke="#CFC7E0" strokeWidth="5" strokeLinecap="round" />
            {/* Orange Thigh Stripes */}
            <path d="M82 244L129 250" stroke="#F07E2E" strokeWidth="9.5" strokeLinecap="round" />
            <path d="M136 250L188 244" stroke="#F07E2E" strokeWidth="9.5" strokeLinecap="round" />

            {/* Left & Right Space Boots with Sole Treads */}
            <ellipse
              cx={activePose === 'happy' || activePose === 'laughing' ? 96 : 104}
              cy={activePose === 'happy' || activePose === 'laughing' ? 276 : 280}
              rx="27"
              ry="13.5"
              transform={
                activePose === 'happy' || activePose === 'laughing'
                  ? 'rotate(-16 96 276)'
                  : undefined
              }
              fill="#D9D3E6"
              stroke="#231115"
              strokeWidth="5"
            />
            <ellipse
              cx={activePose === 'cheering' ? 164 : 166}
              cy={activePose === 'cheering' ? 262 : 280}
              rx="26"
              ry="13.5"
              transform={activePose === 'cheering' ? 'rotate(14 164 262)' : undefined}
              fill="#D9D3E6"
              stroke="#231115"
              strokeWidth="5"
            />

            {/* Spacesuit Torso */}
            <path
              d="M86 148C88 136 102 130 136 130C168 130 180 136 182 148L186 218H84L86 148Z"
              fill="url(#spacesuitGrad)"
              stroke="#231115"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* Subtle Torso Cel-Shade Fold */}
            <path d="M90 152C92 178 92 198 88 214" stroke="#DDD5EC" strokeWidth="6" strokeLinecap="round" />
            {/* Ribbed Neck Collar Ring */}
            <path
              d="M102 135C118 143 152 143 168 135"
              stroke="#68617A"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Navy Saturn Chest Emblem Patch */}
            <rect
              x="119"
              y="153"
              width="39"
              height="26"
              rx="5.5"
              fill="#1C2B4B"
              stroke="#231115"
              strokeWidth="4.2"
            />
            <circle cx="138.5" cy="166" r="6.8" fill="#F9C23C" />
            <ellipse
              cx="138.5"
              cy="166"
              rx="14"
              ry="3.9"
              transform="rotate(-18 138.5 166)"
              stroke="#FFE885"
              strokeWidth="2.3"
            />
            <circle cx="125" cy="159" r="1.3" fill="#FFF3B0" />
            <circle cx="152" cy="173" r="1.3" fill="#FFF3B0" />

            {/* Segmented Utility Belt & Pouches */}
            <rect
              x="84"
              y="194"
              width="102"
              height="11"
              rx="4"
              fill="#DFDAE8"
              stroke="#231115"
              strokeWidth="4.2"
            />
            <rect
              x="128"
              y="193"
              width="15"
              height="13"
              rx="3"
              fill="#FFFFFF"
              stroke="#231115"
              strokeWidth="3.5"
            />
            <rect
              x="99"
              y="189"
              width="18"
              height="20"
              rx="4.5"
              fill="#464159"
              stroke="#231115"
              strokeWidth="4"
            />
            <polygon points="108,195 111.5,199 108,203 104.5,199" fill="#F9C23C" />
            <rect
              x="153"
              y="189"
              width="18"
              height="20"
              rx="4.5"
              fill="#464159"
              stroke="#231115"
              strokeWidth="4"
            />
            <polygon points="162,195 165.5,199 162,203 158.5,199" fill="#F9C23C" />
          </g>

          {/* 3B. SITTING SLEEPY BODY & SMILING MOON PILLOW (Smoothly Cross-Fades In for Pose 8) */}
          <g
            className="astro-smooth-part"
            style={{
              opacity: activePose === 'sleepy' ? 1 : 0,
              transform: activePose === 'sleepy' ? 'translateY(0px) scale(1)' : 'translateY(-10px) scale(0.92)',
              transformOrigin: '150px 230px',
              pointerEvents: activePose === 'sleepy' ? 'auto' : 'none',
            }}
          >
            <path
              d="M86 174C88 162 104 156 136 156C164 156 176 164 178 178L180 242H82L86 174Z"
              fill="url(#spacesuitGrad)"
              stroke="#231115"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* Smiling Yellow Moon Pillow */}
            <circle
              cx="196"
              cy="236"
              r="44"
              fill="url(#moonPillowGrad)"
              stroke="#231115"
              strokeWidth="5"
            />
            <circle cx="218" cy="210" r="4.5" fill="#D98218" opacity="0.45" />
            <circle cx="226" cy="248" r="6.5" fill="#D98218" opacity="0.4" />
            <circle cx="178" cy="230" r="3.6" fill="#231115" />
            <circle cx="204" cy="238" r="3.6" fill="#231115" />
            <ellipse cx="173" cy="235" rx="4" ry="2.2" fill="#F46B6B" opacity="0.55" />
            <ellipse cx="208" cy="243" rx="4" ry="2.2" fill="#F46B6B" opacity="0.55" />
            <path
              d="M187 236C189 240 193 240 195 237"
              stroke="#231115"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Sitting Legs & Boots */}
            <path
              d="M84 234C84 220 118 220 138 232L146 268H78L84 234Z"
              fill="url(#spacesuitGrad)"
              stroke="#231115"
              strokeWidth="5"
            />
            <path d="M92 246L136 242" stroke="#F07E2E" strokeWidth="9" strokeLinecap="round" />
            <ellipse cx="116" cy="264" rx="20" ry="24" fill="#59546C" stroke="#231115" strokeWidth="5" />
            <ellipse cx="154" cy="266" rx="20" ry="24" fill="#59546C" stroke="#231115" strokeWidth="5" />
            {/* Arms Hugging Pillow */}
            <path
              d="M94 184C104 206 134 218 168 214"
              stroke="#FFFFFF"
              strokeWidth="22"
              strokeLinecap="round"
            />
            <path
              d="M94 184C104 206 134 218 168 214"
              stroke="#231115"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path d="M114 196L122 212" stroke="#F07E2E" strokeWidth="8" strokeLinecap="round" />
            <circle cx="172" cy="212" r="12" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            <circle cx="196" cy="192" r="11" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
          </g>

          {/* 4. SMOOTH CROSS-FADING POSE ARMS & PROPS (Never snaps abruptly!) */}
          {/* Pose 1: Idle / Calm / Sad / Worried Arms */}
          <g
            className="astro-smooth-part"
            style={{
              opacity:
                activePose === 'idle' || activePose === 'sad' || activePose === 'worried' ? 1 : 0,
              transform:
                activePose === 'idle' || activePose === 'sad' || activePose === 'worried'
                  ? 'scale(1)'
                  : 'scale(0.94)',
              transformOrigin: '135px 175px',
            }}
          >
            <path
              d="M88 150C72 164 68 186 74 206L94 202L96 166"
              fill="url(#spacesuitGrad)"
              stroke="#231115"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path d="M72 178L92 176" stroke="#F07E2E" strokeWidth="8" strokeLinecap="round" />
            <circle cx="84" cy="208" r="12" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            <path
              d="M180 150C194 164 198 186 192 206L174 202L172 166"
              fill="url(#spacesuitGrad)"
              stroke="#231115"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path d="M175 176L194 178" stroke="#F07E2E" strokeWidth="8" strokeLinecap="round" />
            <circle cx="184" cy="208" r="12" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
          </g>

          {/* Pose 2: Happy Celebration Arms */}
          <g
            className="astro-smooth-part"
            style={{
              opacity: activePose === 'happy' ? 1 : 0,
              transform: activePose === 'happy' ? 'translateY(0px) scale(1)' : 'translateY(8px) scale(0.92)',
              transformOrigin: '135px 150px',
            }}
          >
            <path d="M88 154L42 132" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round" />
            <path d="M88 154L42 132" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <path d="M68 134L60 152" stroke="#F07E2E" strokeWidth="8" strokeLinecap="round" />
            <circle cx="36" cy="128" r="13" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            <path d="M180 154L228 132" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round" />
            <path d="M180 154L228 132" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <path d="M202 134L210 152" stroke="#F07E2E" strokeWidth="8" strokeLinecap="round" />
            <circle cx="234" cy="128" r="13" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
          </g>

          {/* Pose 3: Wink Friendly Wave + Golden 4-Point Star (Clean Round Glove, No Finger Protrusion) */}
          <g
            className="astro-smooth-part"
            style={{
              opacity: activePose === 'wink' ? 1 : 0,
              transform: activePose === 'wink' ? 'scale(1)' : 'scale(0.92)',
              transformOrigin: '150px 155px',
            }}
          >
            <path
              d="M86 152C68 166 68 188 88 198L106 188"
              fill="url(#spacesuitGrad)"
              stroke="#231115"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M72 174L92 168" stroke="#F07E2E" strokeWidth="8" strokeLinecap="round" />
            <circle cx="98" cy="192" r="13" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            <path d="M180 156L214 142" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round" />
            <path d="M180 156L214 142" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <circle cx="218" cy="138" r="13" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            <path
              d="M252 96L257 110L271 115L257 120L252 134L247 120L233 115L247 110Z"
              fill="#F5A623"
              stroke="#FFFFFF"
              strokeWidth="3"
              className="astro-badge-bob"
            />
          </g>

          {/* Pose 4: Thinking & Angry Arms on Hips */}
          <g
            className="astro-smooth-part"
            style={{ opacity: activePose === 'thinking' || activePose === 'angry' ? 1 : 0 }}
          >
            <path d="M86 154C74 170 82 188 106 188" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
            <path d="M86 154C74 170 82 188 106 188" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <circle cx="106" cy="188" r="11.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            <path d="M180 154C194 170 186 188 164 188" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
            <path d="M180 154C194 170 186 188 164 188" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <circle cx="164" cy="188" r="11.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
          </g>

          {/* Pose 5: Surprised Lower Sleeves */}
          <g
            className="astro-smooth-part"
            style={{ opacity: activePose === 'surprised' ? 1 : 0 }}
          >
            <path d="M90 162L114 138" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
            <path d="M90 162L114 138" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <path d="M178 162L156 138" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
            <path d="M178 162L156 138" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
          </g>

          {/* Pose 6: Mischievous Arms & Golden Sparks */}
          <g
            className="astro-smooth-part"
            style={{ opacity: activePose === 'mischievous' ? 1 : 0 }}
          >
            <path d="M86 154C68 168 68 188 86 198" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
            <path d="M86 154C68 168 68 188 86 198" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <circle cx="90" cy="198" r="11.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            <path d="M178 162L164 136" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
            <path d="M178 162L164 136" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <path d="M222 154L236 148" stroke="#F5A623" strokeWidth="6" strokeLinecap="round" />
            <path d="M222 168L236 170" stroke="#F5A623" strokeWidth="6" strokeLinecap="round" />
          </g>

          {/* Pose 7: Laughing Belly-Hold Arms */}
          <g
            className="astro-smooth-part"
            style={{ opacity: activePose === 'laughing' ? 1 : 0 }}
          >
            <path d="M86 154C68 172 78 192 108 190" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
            <path d="M86 154C68 172 78 192 108 190" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <circle cx="110" cy="188" r="11.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            <path d="M180 154C196 172 188 192 162 190" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
            <path d="M180 154C196 172 188 192 162 190" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <circle cx="160" cy="188" r="11.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
          </g>

          {/* Pose 9: Cheering Dual Lightsticks (Blue & Orange Glowing Batons) */}
          <g
            className="astro-smooth-part"
            style={{
              opacity: activePose === 'cheering' ? 1 : 0,
              transform: activePose === 'cheering' ? 'scale(1)' : 'scale(0.9)',
              transformOrigin: '135px 150px',
            }}
          >
            <g className="astro-wave-motion">
              <path d="M88 158L64 144" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
              <path d="M88 158L64 144" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
              <g transform="translate(46, 114) rotate(-36)">
                <rect x="-7" y="-28" width="14" height="48" rx="7" fill="#38BDF8" stroke="#231115" strokeWidth="4" />
                <rect x="-3" y="-22" width="6" height="36" rx="3" fill="#E0F2FE" />
                <rect x="-5" y="18" width="10" height="12" rx="3" fill="#475569" stroke="#231115" strokeWidth="3.5" />
              </g>
              <circle cx="62" cy="144" r="11.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />

              <path d="M180 152L220 124" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
              <path d="M180 152L220 124" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
              <g transform="translate(232, 96) rotate(22)">
                <rect x="-7" y="-32" width="14" height="50" rx="7" fill="#F97316" stroke="#231115" strokeWidth="4" />
                <rect x="-3" y="-26" width="6" height="38" rx="3" fill="#FFEDD5" />
                <rect x="-5" y="16" width="10" height="12" rx="3" fill="#475569" stroke="#231115" strokeWidth="3.5" />
              </g>
              <circle cx="222" cy="122" r="11.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            </g>
          </g>

          {/* Pose 10: Greeting Waving Hand */}
          <g
            className="astro-smooth-part"
            style={{
              opacity: activePose === 'greeting' ? 1 : 0,
              transform: activePose === 'greeting' ? 'scale(1)' : 'scale(0.92)',
              transformOrigin: '150px 150px',
            }}
          >
            <path d="M86 152C70 168 68 188 74 206" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" />
            <path d="M86 152C70 168 68 188 74 206" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            <circle cx="74" cy="208" r="11.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            <g className="astro-wave-motion">
              <path d="M180 152L226 116" stroke="#FFFFFF" strokeWidth="21" strokeLinecap="round" />
              <path d="M180 152L226 116" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
              <path d="M198 128L210 142" stroke="#F07E2E" strokeWidth="8" strokeLinecap="round" />
              <circle cx="232" cy="110" r="13.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
              <path d="M254 92C260 98 260 108 254 114" stroke="#F5A623" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M264 88C272 96 272 110 264 118" stroke="#F5A623" strokeWidth="4.5" strokeLinecap="round" />
            </g>
          </g>

          {/* ===================================================================== */}
          {/* 5. PERSISTENT OVERSIZED HELMET, HAIR, BLOSSOM CLIP & SMOOTH FACE RIG  */}
          {/* ===================================================================== */}
          <g
            className="astro-smooth-part"
            style={{
              transform: `translateY(${rig.headY}px) rotate(${rig.headTilt}deg)`,
              transformOrigin: '135px 92px',
            }}
          >
            {/* Outer Tilted Space Helmet Dome */}
            <circle
              cx="126"
              cy="84"
              r="72"
              fill="url(#spacesuitGrad)"
              stroke="#231115"
              strokeWidth="5.5"
            />
            {/* Soft Lavender-Grey Crescent Shadow on Left Helmet Dome */}
            <path
              d="M62 66C54 96 68 128 96 144C74 126 66 96 72 68Z"
              fill="#D9D1E8"
              opacity="0.7"
            />
            {/* Two Warm Orange Stripe Blocks on Upper-Left Helmet Rim */}
            <path
              d="M62 48C72 34 86 24 104 18L112 28C96 34 82 43 72 56Z"
              fill="#F07E2E"
              stroke="#231115"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path
              d="M122 14C138 13 154 17 168 24L160 34C148 28 135 25 120 25Z"
              fill="#F07E2E"
              stroke="#231115"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Dark Inner Helmet Visor Rim on Upper Right */}
            <path
              d="M124 24C162 24 190 50 192 86"
              stroke="#2A2238"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Glossy White Oval Highlight on Upper-Right Helmet Rim */}
            <ellipse
              cx="168"
              cy="44"
              rx="15"
              ry="6"
              transform="rotate(30 168 44)"
              fill="#FFFFFF"
            />

            {/* Left Helmet Ear-Cup with Golden 5-Point Star */}
            <ellipse
              cx="52"
              cy="102"
              rx="19"
              ry="25"
              transform="rotate(-12 52 102)"
              fill="#FFFFFF"
              stroke="#231115"
              strokeWidth="5"
            />
            <ellipse
              cx="49"
              cy="103"
              rx="13"
              ry="18"
              transform="rotate(-12 49 103)"
              fill="#5A5670"
              stroke="#231115"
              strokeWidth="4.2"
            />
            <path
              d="M49 91L52 97.5L59 98.5L54 103.5L55.2 110.5L49 107L42.8 110.5L44 103.5L39 98.5L46 97.5Z"
              fill="#F9C23C"
            />

            {/* Chibi Face Base */}
            <circle
              cx="136"
              cy="92"
              r="55"
              fill="url(#peachSkinGrad)"
              stroke="#231115"
              strokeWidth="5"
            />

            {/* Soft Rosy Blush Cheeks + Anime Blush Slash Marks */}
            <g className="astro-smooth-part" style={{ opacity: rig.blushOpacity }}>
              <ellipse cx="99" cy="112" rx="11.5" ry="6.2" fill="#FF8B8B" />
              <ellipse cx="171" cy="112" rx="11.5" ry="6.2" fill="#FF8B8B" />
              <line x1="95" y1="110" x2="98" y2="114" stroke="#E05252" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="101" y1="110" x2="104" y2="114" stroke="#E05252" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="167" y1="110" x2="170" y2="114" stroke="#E05252" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="173" y1="110" x2="176" y2="114" stroke="#E05252" strokeWidth="1.8" strokeLinecap="round" />
            </g>

            {/* ================================================================= */}
            {/* 6. PERSISTENT SMOOTH-MORPHING EYES, EYEBROWS & MOUTH              */}
            {/* ================================================================= */}
            {/* LAYER A: Sparkling Open Crimson Blossom Eyes (Smoothly fades & shifts gaze) */}
            <g className="astro-eye-blink">
              {/* Left Open Crimson Eye */}
              <g
                className="astro-smooth-part"
                style={{
                  opacity: rig.openEyeOpacityL,
                  transform: `translate(${106 + rig.gazeX}px, ${98 + rig.gazeY}px) scaleY(${
                    rig.smugLidOpacity > 0.5 ? 0.78 : 1
                  })`,
                }}
              >
                {/* Eyelid Crease */}
                <path d="M-12 -15C-4 -18 6 -18 12 -14" stroke="#9E6258" strokeWidth="2.2" strokeLinecap="round" />
                {/* Thick Winged Upper Eyelash */}
                <path d="M-16.5 -7.5C-10 -16.5 10 -16.5 16.5 -7.5" stroke="#231115" strokeWidth="5.8" strokeLinecap="round" />
                <ellipse cx="0" cy="2" rx="13.5" ry="15" fill="url(#crimsonEyeGrad)" stroke="#231115" strokeWidth="4.2" />
                {/* Signature 5-Petal Blossom Pupil */}
                <circle cx="0" cy="-1.5" r="2.5" fill="#FFE8E5" />
                <circle cx="3.3" cy="1" r="2.5" fill="#FFE8E5" />
                <circle cx="2" cy="4.6" r="2.5" fill="#FFE8E5" />
                <circle cx="-2" cy="4.6" r="2.5" fill="#FFE8E5" />
                <circle cx="-3.3" cy="1" r="2.5" fill="#FFE8E5" />
                <circle cx="-5.5" cy="-5.5" r="4" fill="#FFFFFF" />
                <circle cx="5.2" cy="7.2" r="2.2" fill="#FFFFFF" />
              </g>

              {/* Right Open Crimson Eye */}
              <g
                className="astro-smooth-part"
                style={{
                  opacity: rig.openEyeOpacityR,
                  transform: `translate(${164 + rig.gazeX}px, ${98 + rig.gazeY}px) scaleY(${
                    rig.smugLidOpacity > 0.5 ? 0.78 : 1
                  })`,
                }}
              >
                <path d="M-12 -15C-4 -18 6 -18 12 -14" stroke="#9E6258" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M-16.5 -7.5C-10 -16.5 10 -16.5 16.5 -7.5" stroke="#231115" strokeWidth="5.8" strokeLinecap="round" />
                <ellipse cx="0" cy="2" rx="13.5" ry="15" fill="url(#crimsonEyeGrad)" stroke="#231115" strokeWidth="4.2" />
                <circle cx="0" cy="-1.5" r="2.5" fill="#FFE8E5" />
                <circle cx="3.3" cy="1" r="2.5" fill="#FFE8E5" />
                <circle cx="2" cy="4.6" r="2.5" fill="#FFE8E5" />
                <circle cx="-2" cy="4.6" r="2.5" fill="#FFE8E5" />
                <circle cx="-3.3" cy="1" r="2.5" fill="#FFE8E5" />
                <circle cx="-5.5" cy="-5.5" r="4" fill="#FFFFFF" />
                <circle cx="5.2" cy="7.2" r="2.2" fill="#FFFFFF" />
              </g>
            </g>

            {/* LAYER B: Smug Flat Eyelid Bars for Pose 6 (Mischievous) */}
            <g className="astro-smooth-part" style={{ opacity: rig.smugLidOpacity }}>
              <path d="M90 91H122" stroke="#231115" strokeWidth="5.5" strokeLinecap="round" />
              <path d="M148 91H180" stroke="#231115" strokeWidth="5.5" strokeLinecap="round" />
            </g>

            {/* LAYER C: Happy Arched Closed Eyes (^ ^) */}
            <path
              d="M94 98C100 85 114 85 120 98"
              stroke="#231115"
              strokeWidth="5.5"
              strokeLinecap="round"
              className="astro-smooth-part"
              style={{ opacity: rig.happyArchOpacityL }}
            />
            <path
              d="M150 98C156 85 170 85 176 98"
              stroke="#231115"
              strokeWidth="5.5"
              strokeLinecap="round"
              className="astro-smooth-part"
              style={{ opacity: rig.happyArchOpacityR }}
            />

            {/* LAYER D: Peaceful Downward Sleeping Eyelids (Pose 8 Sleepy) */}
            <g className="astro-smooth-part" style={{ opacity: rig.sleepArchOpacity }}>
              <path d="M95 98C101 106 113 106 120 98" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
              <path d="M150 98C157 106 169 106 175 98" stroke="#231115" strokeWidth="5" strokeLinecap="round" />
            </g>

            {/* LAYER E: Wide Shocked Eyes (Pose 5 Surprised) */}
            <g className="astro-smooth-part" style={{ opacity: rig.shockEyeOpacity }}>
              <ellipse cx="106" cy="98" rx="13" ry="15" fill="#781C24" stroke="#231115" strokeWidth="4.5" />
              <ellipse cx="106" cy="99" rx="8.5" ry="10" fill="#FFF5F5" stroke="#231115" strokeWidth="3" />
              <ellipse cx="164" cy="98" rx="13" ry="15" fill="#781C24" stroke="#231115" strokeWidth="4.5" />
              <ellipse cx="164" cy="99" rx="8.5" ry="10" fill="#FFF5F5" stroke="#231115" strokeWidth="3" />
            </g>

            {/* Smoothly Animated Eyebrows */}
            <path
              d="M92 78C100 73 112 73 118 78"
              stroke="#3B1A1E"
              strokeWidth="3.8"
              strokeLinecap="round"
              className="astro-smooth-part"
              style={{
                transform: `translateY(${rig.browLiftY}px) rotate(${rig.browTiltDeg}deg)`,
                transformOrigin: '105px 76px',
              }}
            />
            <path
              d="M152 78C158 73 170 73 178 78"
              stroke="#3B1A1E"
              strokeWidth="3.8"
              strokeLinecap="round"
              className="astro-smooth-part"
              style={{
                transform: `translateY(${rig.browLiftY}px) rotate(${-rig.browTiltDeg}deg)`,
                transformOrigin: '165px 76px',
              }}
            />

            {/* Tiny Anime Nose Dot */}
            <circle cx="136" cy="106" r="1.7" fill="#C98A78" />

            {/* Smoothly Morphing Mouth */}
            <path
              d={rig.mouthPath}
              fill="#D64545"
              stroke="#231115"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="astro-smooth-part"
            />
            {/* Inner Pink Tongue Highlight */}
            <ellipse
              cx="136"
              cy="122"
              rx="6.5"
              ry="3.8"
              fill="#FF8FA3"
              className="astro-smooth-part"
              style={{ opacity: rig.tongueOpacity }}
            />
            {/* Playful Tongue Sticking Out for Pose 6 (Mischievous) */}
            <path
              d="M131 114V123C131 127 141 127 141 123V114Z"
              fill="#FF758F"
              stroke="#231115"
              strokeWidth="3.5"
              className="astro-smooth-part"
              style={{ opacity: rig.mischiefTongueOpacity }}
            />

            {/* 7. VOLUMINOUS FEATHERY ANIME BANGS, CROWN HIGHLIGHTS & WISPY SIDE CURLS */}
            <path
              d="M76 92C74 48 106 30 140 32C174 34 198 56 196 92C190 72 178 60 166 76C160 56 144 50 136 82C128 52 112 56 104 76C94 62 82 72 76 92Z"
              fill="url(#auburnHairGrad)"
              stroke="#231115"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* Warm Rose-Amber Hair Crown Highlight Arcs */}
            <path
              d="M114 48C128 42 148 42 162 49"
              stroke="#8F4442"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.75"
            />
            {/* Wispy Left & Right Outer Hair Curls Framing Helmet */}
            <path
              d="M78 88C68 102 72 126 90 142C80 124 80 104 88 90Z"
              fill="url(#auburnHairGrad)"
              stroke="#231115"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <path
              d="M192 86C208 96 212 112 200 126C202 112 196 100 186 92Z"
              fill="url(#auburnHairGrad)"
              stroke="#231115"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />

            {/* 8. ICONIC 5-PETAL CORAL PLUM BLOSSOM HAIR CLIP & SWAYING RED SILK TASSELS */}
            <g transform="translate(92, 56)">
              {/* Dark Twig Stem & Coral Bud */}
              <path d="M-14 7L8 -11" stroke="#231115" strokeWidth="4" strokeLinecap="round" />
              <circle cx="10" cy="-13" r="3.6" fill="#E84A3C" stroke="#231115" strokeWidth="2.4" />
              {/* Swaying Red Silk Tassels with Gold Beads */}
              <g className="astro-tassel-sway">
                <path
                  d="M-6 12L-16 34L-6 36L-1 14Z"
                  fill="#D83A2E"
                  stroke="#231115"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 14L0 32L8 32L6 14Z"
                  fill="#D83A2E"
                  stroke="#231115"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                />
                <circle cx="-5" cy="14" r="3.5" fill="#F9C23C" stroke="#231115" strokeWidth="2" />
                <circle cx="4" cy="15" r="3" fill="#F9C23C" stroke="#231115" strokeWidth="2" />
              </g>
              {/* 5 Coral Petals with Soft Inner Highlights */}
              <circle cx="0" cy="-10" r="8.2" fill="#E84A3C" stroke="#231115" strokeWidth="3.2" />
              <circle cx="10.2" cy="-3" r="8.2" fill="#E84A3C" stroke="#231115" strokeWidth="3.2" />
              <circle cx="6.2" cy="8.5" r="8.2" fill="#E84A3C" stroke="#231115" strokeWidth="3.2" />
              <circle cx="-6.2" cy="8.5" r="8.2" fill="#E84A3C" stroke="#231115" strokeWidth="3.2" />
              <circle cx="-10.2" cy="-3" r="8.2" fill="#E84A3C" stroke="#231115" strokeWidth="3.2" />
              <circle cx="0" cy="-6" r="2.2" fill="#FF8577" />
              <circle cx="6" cy="-1.5" r="2.2" fill="#FF8577" />
              <circle cx="-6" cy="-1.5" r="2.2" fill="#FF8577" />
              {/* Golden Stamen Center */}
              <circle cx="0" cy="0" r="4.5" fill="#F9C23C" stroke="#231115" strokeWidth="1.5" />
            </g>
          </g>

          {/* ================================================================= */}
          {/* 8.5 FOREGROUND HANDS OVERLAPPING CHIN / CHEEKS (Smooth Cross-Fade)*/}
          {/* ================================================================= */}
          {/* Pose 5: Surprised Cupped Hands on Cheeks */}
          <g
            className="astro-smooth-part"
            style={{
              opacity: activePose === 'surprised' ? 1 : 0,
              transform: activePose === 'surprised' ? 'scale(1)' : 'scale(0.85)',
              transformOrigin: '135px 128px',
            }}
          >
            <circle cx="114" cy="128" r="11.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
            <circle cx="156" cy="128" r="11.5" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
          </g>

          {/* Pose 6: Mischievous Hand on Cheek */}
          <g
            className="astro-smooth-part"
            style={{
              opacity: activePose === 'mischievous' ? 1 : 0,
              transform: activePose === 'mischievous' ? 'scale(1)' : 'scale(0.85)',
              transformOrigin: '158px 126px',
            }}
          >
            <circle cx="158" cy="126" r="11" fill="#FFFFFF" stroke="#231115" strokeWidth="4.8" />
          </g>

          {/* ================================================================= */}
          {/* 9. SMOOTH FLOATING TOP-RIGHT EMOTE BADGES                         */}
          {/* ================================================================= */}
          <g
            className="astro-smooth-part astro-badge-bob"
            style={{
              opacity: activePose === 'happy' || activePose === 'cheering' ? 1 : 0,
            }}
          >
            <path d="M222 34L232 16" stroke="#F5A623" strokeWidth="7" strokeLinecap="round" />
            <path d="M238 46L256 34" stroke="#F5A623" strokeWidth="7" strokeLinecap="round" />
            <path d="M244 64L264 60" stroke="#F5A623" strokeWidth="7" strokeLinecap="round" />
          </g>

          {/* Sad Tear Drop Badge */}
          <g
            aria-hidden="true"
            className="astro-smooth-part astro-badge-bob"
            style={{
              opacity: activePose === 'sad' ? 1 : 0,
            }}
          >
            <path
              d="M226 42C226 42 214 58 214 66C214 73 219.5 78 226 78C232.5 78 238 73 238 66C238 58 226 42 226 42Z"
              fill="#38BDF8"
              stroke="#231115"
              strokeWidth="4"
            />
          </g>

          {/* Worried Sweat Drop Badge */}
          <g
            aria-hidden="true"
            className="astro-smooth-part astro-badge-bob"
            style={{
              opacity: activePose === 'worried' ? 1 : 0,
            }}
          >
            <path
              d="M232 34C232 34 221 48 221 56C221 62 226 67 232 67C238 67 243 62 243 56C243 48 232 34 232 34Z"
              fill="#7DD3FC"
              stroke="#231115"
              strokeWidth="4"
            />
          </g>

          {/* Angry Puff Symbol Badge */}
          <g
            aria-hidden="true"
            className="astro-smooth-part astro-badge-bob"
            style={{
              opacity: activePose === 'angry' ? 1 : 0,
            }}
          >
            <path
              d="M220 34C226 40 226 46 220 52M238 34C232 40 232 46 238 52M220 34C226 40 232 40 238 34M220 52C226 46 232 46 238 52"
              stroke="#EF4444"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>

          <g
            aria-hidden="true"
            className="astro-smooth-part"
            style={{
              opacity: activePose === 'thinking' ? 1 : 0,
              transform: activePose === 'thinking' ? 'translate(212px, 14px) scale(1)' : 'translate(212px, 22px) scale(0.8)',
            }}
          >
            <circle cx="30" cy="28" r="24" fill="#FFF8F0" stroke="#231115" strokeWidth="4.5" />
            <path d="M14 44L4 56L22 49" fill="#FFF8F0" stroke="#231115" strokeWidth="4.5" strokeLinejoin="round" />
            <text x="30" y="39" textAnchor="middle" fill="#4A2C2A" fontSize="32" fontWeight="900">
              ?
            </text>
          </g>

          <g
            aria-hidden="true"
            className="astro-smooth-part"
            style={{
              opacity: activePose === 'surprised' ? 1 : 0,
              transform: activePose === 'surprised' ? 'translate(238px, 18px) rotate(18deg) scale(1)' : 'translate(238px, 26px) rotate(18deg) scale(0.8)',
            }}
          >
            <rect x="0" y="0" width="14" height="36" rx="7" fill="#F07E2E" stroke="#231115" strokeWidth="4" />
            <circle cx="7" cy="48" r="7" fill="#F07E2E" stroke="#231115" strokeWidth="4" />
          </g>

          <g
            aria-hidden="true"
            className="astro-smooth-part astro-badge-bob"
            style={{ opacity: activePose === 'laughing' ? 1 : 0 }}
          >
            <path d="M216 20C236 28 248 46 250 68" stroke="#F5A623" strokeWidth="6" strokeLinecap="round" />
            <path d="M218 36L238 24" stroke="#F5A623" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M230 56L252 46" stroke="#F5A623" strokeWidth="5.5" strokeLinecap="round" />
          </g>
        </g>

        {/* Crisp Floating z Z Z and Dream Bubbles for Pose 8 (Outside Dilate Filter) */}
        <g
          aria-hidden="true"
          className="astro-smooth-part astro-badge-bob"
          style={{
            opacity: activePose === 'sleepy' ? 1 : 0,
            pointerEvents: 'none',
          }}
        >
          <circle cx="226" cy="166" r="4.5" fill="#FFFFFF" stroke="#231115" strokeWidth="2.5" />
          <circle cx="240" cy="146" r="7.5" fill="#FFFFFF" stroke="#231115" strokeWidth="2.5" />
          <text
            x="194"
            y="76"
            fill="#FFFFFF"
            stroke="#231115"
            strokeWidth="4"
            paintOrder="stroke"
            fontSize="22"
            fontWeight="900"
          >
            z
          </text>
          <text
            x="214"
            y="56"
            fill="#FFFFFF"
            stroke="#231115"
            strokeWidth="4.5"
            paintOrder="stroke"
            fontSize="27"
            fontWeight="900"
          >
            Z
          </text>
          <text
            x="238"
            y="36"
            fill="#FFFFFF"
            stroke="#231115"
            strokeWidth="5"
            paintOrder="stroke"
            fontSize="32"
            fontWeight="900"
          >
            Z
          </text>
        </g>
      </svg>

      {/* Rounded Brown Caption Pill Matching the Reference Sheet */}
      {showCaptionPill && (
        <div className="mt-1 px-4 sm:px-5 py-1 sm:py-1.5 rounded-full bg-[#593A38] border-2 border-[#9E6B62] text-white font-extrabold text-xs sm:text-base tracking-tight shadow-md whitespace-nowrap transition-all duration-300">
          {poseMeta.label}
        </div>
      )}
    </div>
  );
};

/**
 * Full 10-Pose Interactive Vector Sticker Sheet
 * - Phone UI (< md): 2-column compact touch grid with swipeable/tap cards
 * - PC UI (>= lg): Exact 2-row × 5-column widescreen reference sheet
 */
export const AstronautTenEmotionsSheet: React.FC<{
  selectedPose: AstronautPoseId;
  onSelectPose: (pose: AstronautPoseId) => void;
}> = ({ selectedPose, onSelectPose }) => {
  return (
    <div className="rounded-[28px] sm:rounded-[36px] bg-[#211B2D] p-4 sm:p-8 lg:p-10 border-2 sm:border-4 border-slate-800 shadow-2xl space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 border-b border-white/15 pb-4 sm:pb-5">
        <div>
          <div className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-amber-400">
            100% VECTOR GRAPHIC RECREATION · 10 SMOOTH CONTINUOUS POSES
          </div>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white mt-0.5">
            Astronaut 10-Emotion Vector Sheet
          </h2>
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-300">
          Tap any pose below to smoothly morph & sync across Watch and Dashboards
        </div>
      </div>

      {/* Responsive Grid: 2 cols on Phone, 3 cols on Tablet, 5 cols on PC */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
        {ASTRONAUT_10_POSES.map((pose) => {
          const isSelected = selectedPose === pose.id;
          return (
            <button
              key={pose.id}
              type="button"
              onClick={() => onSelectPose(pose.id)}
              className={`group rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between ${
                isSelected
                  ? 'bg-white/15 ring-3 sm:ring-4 ring-amber-400 scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <AstronautCharacterSvg
                emotion={pose.id}
                size={156}
                showCaptionPill={true}
              />
              <div className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-slate-300 text-center line-clamp-1 px-1">
                {pose.telemetryTrigger}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** 1. Smiling Sun Cartoon Vector */
export const SmilingSunSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72,
}) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
    {Array.from({ length: 12 }).map((_, i) => (
      <g key={i} transform={`rotate(${i * 30} 60 60)`}>
        <polygon
          points="60,4 50,22 70,22"
          fill="#F59E0B"
          stroke="#1E1B2E"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </g>
    ))}
    <circle cx="60" cy="60" r="36" fill="#FACC15" stroke="#1E1B2E" strokeWidth="4.5" />
    <path d="M43 55C46 50 51 50 54 55" stroke="#1E1B2E" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M66 55C69 50 74 50 77 55" stroke="#1E1B2E" strokeWidth="4.5" strokeLinecap="round" />
    <ellipse cx="41" cy="63" rx="5" ry="3" fill="#FB7185" opacity="0.6" />
    <ellipse cx="79" cy="63" rx="5" ry="3" fill="#FB7185" opacity="0.6" />
    <path d="M52 64H68C68 74 52 74 52 64Z" fill="#F43F5E" stroke="#1E1B2E" strokeWidth="4" strokeLinejoin="round" />
  </svg>
);

/** 2. Winking Rainbow Shooting Star Vector */
export const WinkingShootingStarSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72,
}) => (
  <svg width={size} height={size} viewBox="0 0 130 100" fill="none" className={className} aria-hidden="true">
    <path d="M55 42C78 24 102 14 122 12" stroke="#A855F7" strokeWidth="10" strokeLinecap="round" />
    <path d="M58 50C82 34 104 24 124 22" stroke="#F97316" strokeWidth="10" strokeLinecap="round" />
    <path d="M60 58C84 44 106 34 124 32" stroke="#3B82F6" strokeWidth="10" strokeLinecap="round" />
    <path
      d="M44 16L53 34L73 37L58 51L62 71L44 61L26 71L30 51L15 37L35 34Z"
      fill="#FACC15"
      stroke="#1E1B2E"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    <circle cx="36" cy="46" r="3.5" fill="#1E1B2E" />
    <path d="M54 42L48 46L54 50" stroke="#1E1B2E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M41 53C43 56 46 56 48 53" stroke="#1E1B2E" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

/** 3. Sleeping Crescent Moon with Cloud & zZ Vector */
export const SleepingMoonSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72,
}) => (
  <svg width={size} height={size} viewBox="0 0 120 110" fill="none" className={className} aria-hidden="true">
    <path
      d="M68 16C42 18 26 42 32 68C38 90 62 100 84 90C66 88 54 72 56 52C58 34 70 22 84 20C78 17 73 16 68 16Z"
      fill="#FACC15"
      stroke="#1E1B2E"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    <path d="M44 54C46 58 50 58 52 54" stroke="#1E1B2E" strokeWidth="3.5" strokeLinecap="round" />
    <path
      d="M22 82C14 82 10 74 16 68C18 60 28 58 34 64C40 58 52 62 52 72C58 74 56 84 48 84H22Z"
      fill="#E2E8F0"
      stroke="#1E1B2E"
      strokeWidth="4"
    />
    <text x="78" y="46" fill="#0F172A" fontSize="18" fontWeight="900">z</text>
    <text x="92" y="34" fill="#0F172A" fontSize="22" fontWeight="900">Z</text>
  </svg>
);

/** 4. Happy Earth Globe Vector */
export const HappyEarthSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72,
}) => (
  <svg width={size} height={size} viewBox="0 0 120 110" fill="none" className={className} aria-hidden="true">
    <circle cx="60" cy="56" r="38" fill="#3B82F6" stroke="#1E1B2E" strokeWidth="4.5" />
    <path
      d="M36 32C46 28 58 36 54 48C50 58 36 62 30 52C26 44 30 36 36 32Z"
      fill="#4ADE80"
    />
    <path
      d="M72 44C82 42 92 54 86 68C80 80 66 78 64 66C62 56 66 46 72 44Z"
      fill="#4ADE80"
    />
    <circle cx="60" cy="56" r="38" stroke="#1E1B2E" strokeWidth="4.5" />
    <circle cx="48" cy="54" r="4" fill="#1E1B2E" />
    <circle cx="72" cy="54" r="4" fill="#1E1B2E" />
    <path d="M55 60C58 65 62 65 65 60" stroke="#1E1B2E" strokeWidth="4" strokeLinecap="round" />
    <rect x="12" y="60" width="24" height="12" rx="6" fill="#FFFFFF" stroke="#1E1B2E" strokeWidth="3.5" />
    <rect x="84" y="36" width="24" height="12" rx="6" fill="#FFFFFF" stroke="#1E1B2E" strokeWidth="3.5" />
  </svg>
);

/** 5. Winking Red Mars Planet Vector */
export const WinkingMarsSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 68,
}) => (
  <svg width={size} height={size} viewBox="0 0 110 110" fill="none" className={className} aria-hidden="true">
    <circle cx="55" cy="55" r="38" fill="#EF4444" stroke="#1E1B2E" strokeWidth="4.5" />
    <circle cx="38" cy="36" r="6" fill="#DC2626" />
    <circle cx="74" cy="72" r="8" fill="#DC2626" />
    <path d="M36 50L44 55L36 60" stroke="#1E1B2E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M74 50L66 55L74 60" stroke="#1E1B2E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 62C53 66 57 66 60 62" stroke="#1E1B2E" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

/** 6. Ringed Saturn Planet Vector */
export const RingedSaturnSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 76,
}) => (
  <svg width={size} height={size} viewBox="0 0 130 110" fill="none" className={className} aria-hidden="true">
    <circle cx="65" cy="55" r="32" fill="#FBBF24" stroke="#1E1B2E" strokeWidth="4.5" />
    <ellipse
      cx="65"
      cy="58"
      rx="54"
      ry="14"
      transform="rotate(-14 65 58)"
      stroke="#FDE68A"
      strokeWidth="9"
    />
    <ellipse
      cx="65"
      cy="58"
      rx="54"
      ry="14"
      transform="rotate(-14 65 58)"
      stroke="#1E1B2E"
      strokeWidth="4"
    />
    <circle cx="54" cy="52" r="3.5" fill="#1E1B2E" />
    <circle cx="76" cy="52" r="3.5" fill="#1E1B2E" />
    <path d="M60 58C63 62 67 62 70 58" stroke="#1E1B2E" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

/** 7. Cute Retro Space Rocket Vector */
export const CuteRocketSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72,
}) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
    <path
      d="M42 78L20 100L48 90Z"
      fill="#FACC15"
      stroke="#1E1B2E"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path d="M44 60L26 68L36 80Z" fill="#EF4444" stroke="#1E1B2E" strokeWidth="4" strokeLinejoin="round" />
    <path d="M64 80L56 98L44 88Z" fill="#EF4444" stroke="#1E1B2E" strokeWidth="4" strokeLinejoin="round" />
    <path
      d="M96 24C74 24 52 40 38 64L56 82C80 68 96 46 96 24Z"
      fill="#FFFFFF"
      stroke="#1E1B2E"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    <path
      d="M96 24C84 24 74 28 66 36L84 54C92 46 96 36 96 24Z"
      fill="#EF4444"
      stroke="#1E1B2E"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    <circle cx="66" cy="54" r="9" fill="#38BDF8" stroke="#1E1B2E" strokeWidth="4" />
  </svg>
);

/** 8. Cute Orbital Satellite Vector */
export const CuteSatelliteSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 68,
}) => (
  <svg width={size} height={size} viewBox="0 0 120 100" fill="none" className={className} aria-hidden="true">
    <rect
      x="10"
      y="36"
      width="32"
      height="24"
      rx="4"
      transform="rotate(-15 10 36)"
      fill="#2563EB"
      stroke="#1E1B2E"
      strokeWidth="4"
    />
    <rect
      x="76"
      y="28"
      width="32"
      height="24"
      rx="4"
      transform="rotate(-15 76 28)"
      fill="#2563EB"
      stroke="#1E1B2E"
      strokeWidth="4"
    />
    <rect
      x="44"
      y="26"
      width="28"
      height="42"
      rx="8"
      transform="rotate(-15 44 26)"
      fill="#F8FAFC"
      stroke="#1E1B2E"
      strokeWidth="4.5"
    />
    <circle cx="60" cy="46" r="5" fill="#94A3B8" stroke="#1E1B2E" strokeWidth="3" />
  </svg>
);

/** Red NASA-style Circular Arrow Icon Button Badge */
export const RedCircleArrowBadge: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <span
    style={{ width: size, height: size }}
    className="inline-flex items-center justify-center rounded-full bg-[#F43F2E] text-white shrink-0 transition-transform group-hover:translate-x-1"
    aria-hidden="true"
  >
    <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);
