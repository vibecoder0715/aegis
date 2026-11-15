import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Globe,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  completeDailyBuffTask,
  computeLevelFromXp,
  movePlacedPlanetDecoration,
  PLANET_DECORATORS,
  PLANET_SKINS,
  PlanetSkinOption,
  purchaseOrSelectPlanetSkin,
  purchasePlanetDecorator,
  VisitorWatchDatabase,
} from '../watchDb';
import { PlanetDecoratorSvg } from '../WatchAppIcons';
import { playBuffVictory, playTapClick } from '../watchAudio';

interface AegisBuffProps {
  db: VisitorWatchDatabase;
  onUpdateDb: (updater: (prev: VisitorWatchDatabase) => VisitorWatchDatabase) => void;
}

/**
 * AAA-style Cute 3D Planet Renderer on HTML5 Canvas:
 * Uses spherical 3D projection, directional Lambert + Blinn-Phong specular lighting,
 * Fresnel atmospheric rim glow, animated clouds, craters/continents, and 3D planetary rings.
 */
const Cute3DPlanetCanvas: React.FC<{
  skin: PlanetSkinOption;
  rotationOffset: number;
}> = ({ skin, rotationOffset }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let phase = rotationOffset;

    const render = () => {
      phase += 0.012;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = 60;

      ctx.clearRect(0, 0, w, h);

      // Deep space background with subtle nebula glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 12, cx, cy, 120);
      bgGrad.addColorStop(0, `${skin.atmosphereColor}33`);
      bgGrad.addColorStop(0.55, '#070D21');
      bgGrad.addColorStop(1, '#02040A');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Twinkling 3D stars
      for (let i = 0; i < 24; i++) {
        const sx = (i * 43 + 17) % w;
        const sy = (i * 29 + 11) % h;
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(phase * 1.5 + i));
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, i % 4 === 0 ? 1.5 : 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Back half of 3D planetary ring (if skin hasRing)
      if (skin.hasRing) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.28);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.55, r * 0.42, 0, Math.PI, Math.PI * 2);
        ctx.strokeStyle = `${skin.ringColor || '#FDE68A'}88`;
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();
      }

      // Outer atmospheric Fresnel halo
      const haloGrad = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.24);
      haloGrad.addColorStop(0, `${skin.atmosphereColor}88`);
      haloGrad.addColorStop(0.6, `${skin.atmosphereColor}28`);
      haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.24, 0, Math.PI * 2);
      ctx.fill();

      // Clip to 3D sphere body
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // Base ocean / core sphere gradient (lit from top-left)
      const sphereGrad = ctx.createRadialGradient(
        cx - r * 0.35,
        cy - r * 0.35,
        r * 0.1,
        cx,
        cy,
        r * 1.1
      );
      sphereGrad.addColorStop(0, skin.baseColor);
      sphereGrad.addColorStop(0.68, skin.oceanColor);
      sphereGrad.addColorStop(1, '#040711');
      ctx.fillStyle = sphereGrad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      // Procedural 3D continents / gas bands / craters projected onto sphere surface
      ctx.fillStyle = skin.continentColor;
      if (skin.textureStyle === 'gas') {
        for (let b = -3; b <= 3; b++) {
          const by = cy + b * 15 + Math.sin(phase + b) * 2.5;
          ctx.globalAlpha = b % 2 === 0 ? 0.42 : 0.22;
          ctx.beginPath();
          ctx.ellipse(cx, by, r * 1.05, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const patches = [
          { lon: 0.2, lat: -0.28, rx: 22, ry: 15 },
          { lon: 1.9, lat: 0.22, rx: 25, ry: 17 },
          { lon: 3.6, lat: -0.12, rx: 19, ry: 14 },
          { lon: 5.0, lat: 0.34, rx: 21, ry: 13 },
        ];
        patches.forEach((p, idx) => {
          const angle = p.lon + phase * 0.9;
          const z = Math.cos(angle);
          if (z > -0.2) {
            const sx = cx + Math.sin(angle) * (r * 0.72);
            const sy = cy + p.lat * r;
            const foreshorten = Math.max(0.28, (z + 0.25) / 1.25);
            ctx.globalAlpha = skin.textureStyle === 'mars' ? 0.48 : 0.68;
            ctx.beginPath();
            ctx.ellipse(
              sx,
              sy,
              p.rx * foreshorten,
              p.ry,
              Math.sin(angle) * 0.3,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Cute crater rim or highlight detail
            if (skin.textureStyle === 'mars' || skin.textureStyle === 'nebula') {
              ctx.strokeStyle = skin.atmosphereColor;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            } else if (idx % 2 === 0) {
              ctx.fillStyle = '#FFFFFF33';
              ctx.beginPath();
              ctx.arc(sx - 3, sy - 3, 4 * foreshorten, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = skin.continentColor;
            }
          }
        });
      }

      // Polar ice cap highlight
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.ellipse(cx, cy - r + 7, r * 0.52, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Drifting 3D white cloud wisps
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = '#FFFFFF';
      for (let c = 0; c < 3; c++) {
        const cAngle = c * 2.1 + phase * 1.35;
        if (Math.cos(cAngle) > 0) {
          const cloudX = cx + Math.sin(cAngle) * (r * 0.62);
          const cloudY = cy + (c - 1) * 20;
          ctx.beginPath();
          ctx.ellipse(cloudX, cloudY, 18 * Math.cos(cAngle), 4.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3D Specular Sun Highlight (top-left) + Night Terminator Shadow (bottom-right)
      ctx.globalAlpha = 1;
      const lightGrad = ctx.createRadialGradient(
        cx - r * 0.42,
        cy - r * 0.42,
        2,
        cx - r * 0.2,
        cy - r * 0.2,
        r * 1.35
      );
      lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      lightGrad.addColorStop(0.28, 'rgba(255, 255, 255, 0.05)');
      lightGrad.addColorStop(0.7, 'rgba(2, 6, 23, 0.25)');
      lightGrad.addColorStop(1, 'rgba(2, 6, 23, 0.78)');
      ctx.fillStyle = lightGrad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      // Inner Fresnel rim light
      ctx.strokeStyle = `${skin.atmosphereColor}AA`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // Front half of 3D planetary ring (if skin hasRing)
      if (skin.hasRing) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.28);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.55, r * 0.42, 0, 0, Math.PI);
        ctx.strokeStyle = `${skin.ringColor || '#FDE68A'}DD`;
        ctx.lineWidth = 8.5;
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [skin, rotationOffset]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={168}
      className="w-full h-full object-cover pointer-events-none select-none"
    />
  );
};

export const AegisBuffAppView: React.FC<AegisBuffProps> = ({ db, onUpdateDb }) => {
  const [showTasksDrawer, setShowTasksDrawer] = useState(false);
  const [shopTab, setShopTab] = useState<'decor' | 'planets'>('decor');
  const [toast, setToast] = useState<string | null>(null);
  const [draggingInstanceId, setDraggingInstanceId] = useState<string | null>(null);
  const [draggingShopItemId, setDraggingShopItemId] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);

  const lvl = computeLevelFromXp(db.xp);
  const completedCount = db.dailyTasks.filter((t) => t.completed).length;
  const activeSkin =
    PLANET_SKINS.find((s) => s.id === (db.activePlanetId ?? 'terra_prime')) ??
    PLANET_SKINS[0];
  const unlockedPlanets = db.unlockedPlanets ?? ['terra_prime'];

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleCompleteTask = (taskId: string) => {
    const next = completeDailyBuffTask(db, taskId);
    if (next !== db) {
      playBuffVictory(db.settings.muted);
      onUpdateDb(() => next);
      showToastMsg('Task done! Points added!');
    }
  };

  const handleBuyOrPlaceDecor = (itemId: string, coords?: { x: number; y: number }) => {
    playTapClick(db.settings.muted);
    const res = purchasePlanetDecorator(db, itemId, coords);
    onUpdateDb(() => res.db);
    if (res.ok) playBuffVictory(db.settings.muted);
    showToastMsg(res.message);
  };

  const handleSelectOrBuyPlanet = (skinId: string) => {
    playTapClick(db.settings.muted);
    const res = purchaseOrSelectPlanetSkin(db, skinId);
    onUpdateDb(() => res.db);
    if (res.ok) playBuffVictory(db.settings.muted);
    showToastMsg(res.message);
  };

  const getStageRelativePercent = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    const relX = ((clientX - rect.left) / rect.width) * 100;
    const relY = ((clientY - rect.top) / rect.height) * 100;
    // Constrain to the 3D planet sphere area in center
    const dx = relX - 50;
    const dy = relY - 50;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 28) {
      const scale = 28 / dist;
      return { x: Math.round(50 + dx * scale), y: Math.round(50 + dy * scale) };
    }
    return { x: Math.round(relX), y: Math.round(relY) };
  };

  const handlePointerMoveOnStage = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingInstanceId) return;
    const coords = getStageRelativePercent(e.clientX, e.clientY);
    onUpdateDb((prev) => movePlacedPlanetDecoration(prev, draggingInstanceId, coords.x, coords.y));
  };

  const handlePointerUpOnStage = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingShopItemId) {
      const coords = getStageRelativePercent(e.clientX, e.clientY);
      handleBuyOrPlaceDecor(draggingShopItemId, coords);
      setDraggingShopItemId(null);
    }
    if (draggingInstanceId) {
      setDraggingInstanceId(null);
    }
  };

  return (
    <div className="space-y-2 text-white relative select-none">
      {/* MAIN 3D PLANET VIEWPORT WITH SIDE BUTTON FOR DAILY TASKS */}
      <div
        ref={stageRef}
        onPointerMove={handlePointerMoveOnStage}
        onPointerUp={handlePointerUpOnStage}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const itemId = e.dataTransfer.getData('text/plain') || draggingShopItemId;
          if (itemId) {
            const coords = getStageRelativePercent(e.clientX, e.clientY);
            handleBuyOrPlaceDecor(itemId, coords);
            setDraggingShopItemId(null);
          }
        }}
        className="relative h-44 rounded-2xl bg-[#040814] border border-cyan-500/40 overflow-hidden shadow-inner"
      >
        {/* 3D Realistic Cute Planet Canvas */}
        <Cute3DPlanetCanvas skin={activeSkin} rotationOffset={0} />

        {/* Top-left compact level & points HUD */}
        <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-xl bg-slate-950/80 border border-slate-700/80 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span className="text-[10px] font-extrabold text-white">Lv.{lvl.level}</span>
          <span className="font-mono text-[10px] font-black text-amber-300">
            {db.aegisPoints} pts
          </span>
        </div>

        {/* SIDE BUTTON FOR DAILY TASKS (Tasks hidden until clicked!) */}
        <button
          type="button"
          onClick={() => {
            playTapClick(db.settings.muted);
            setShowTasksDrawer(true);
          }}
          aria-label="Open Daily Tasks"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 px-2 py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 font-black text-[10px] shadow-lg flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition"
        >
          <ClipboardList className="w-4 h-4" />
          <span>Tasks</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-300 font-mono text-[9px]">
            {completedCount}/14
          </span>
        </button>

        {/* Empty planet helper caption when 0 items are placed */}
        {db.placedPlanetItems.length === 0 && (
          <div className="absolute bottom-2 left-2.5 z-10 px-2 py-0.5 rounded-lg bg-slate-950/75 text-[9px] font-bold text-cyan-200 pointer-events-none">
            Drag or tap shop items onto your 3D planet!
          </div>
        )}

        {/* Clear items button when items exist */}
        {db.placedPlanetItems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              playTapClick(db.settings.muted);
              onUpdateDb((prev) => ({ ...prev, placedPlanetItems: [] }));
              showToastMsg('Cleared planet items.');
            }}
            aria-label="Clear planet items"
            className="absolute bottom-2 left-2 z-20 p-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-rose-400 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Placed 3D Planet Decorations (Draggable on the planet!) */}
        {db.placedPlanetItems.map((placed) => (
          <div
            key={placed.instanceId}
            onPointerDown={(e) => {
              e.stopPropagation();
              setDraggingInstanceId(placed.instanceId);
            }}
            style={{ left: `${placed.x}%`, top: `${placed.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing transition-transform ${
              draggingInstanceId === placed.instanceId ? 'scale-125 drop-shadow-[0_0_8px_#38BDF8]' : 'hover:scale-110'
            }`}
            title="Drag to move on planet"
          >
            <PlanetDecoratorSvg itemId={placed.itemId} size={24} />
          </div>
        ))}
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-400 text-slate-950 px-2.5 py-1 text-[10px] font-black text-center">
          {toast}
        </div>
      )}

      {/* SHOP SWITCHER: DECOR ITEMS vs. BUY PLANETS */}
      <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setShopTab('decor')}
          className={`py-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer ${
            shopTab === 'decor' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
          }`}
        >
          <ShoppingBag className="w-3 h-3" /> Decor Shop
        </button>
        <button
          type="button"
          onClick={() => setShopTab('planets')}
          className={`py-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer ${
            shopTab === 'planets' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'
          }`}
        >
          <Globe className="w-3 h-3" /> Buy Planets
        </button>
      </div>

      {/* TAB 1: DRAG & DROP PLANET DECOR SHOP */}
      {shopTab === 'decor' ? (
        <div className="grid grid-cols-2 gap-1.5">
          {PLANET_DECORATORS.map((item) => (
            <button
              key={item.id}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id);
                setDraggingShopItemId(item.id);
              }}
              onPointerDown={() => setDraggingShopItemId(item.id)}
              onClick={() => {
                setDraggingShopItemId(null);
                handleBuyOrPlaceDecor(item.id);
              }}
              className="rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 p-2 text-left flex items-center gap-2 cursor-grab active:cursor-grabbing transition"
            >
              <PlanetDecoratorSvg itemId={item.id} size={22} />
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold text-white truncate">{item.name}</div>
                <div className="font-mono text-[9px] text-amber-300 font-bold">
                  {item.costPoints} pts
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* TAB 2: BUY & EQUIP PLANET TEXTURES & COLORS */
        <div className="grid grid-cols-2 gap-1.5">
          {PLANET_SKINS.map((skin) => {
            const isUnlocked = unlockedPlanets.includes(skin.id);
            const isActive = activeSkin.id === skin.id;
            return (
              <button
                key={skin.id}
                type="button"
                onClick={() => handleSelectOrBuyPlanet(skin.id)}
                className={`rounded-xl p-2 border text-left flex items-center gap-2 cursor-pointer transition ${
                  isActive
                    ? 'bg-cyan-950/90 border-cyan-400'
                    : 'bg-slate-900 border-slate-700 hover:border-cyan-400'
                }`}
              >
                <span
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${skin.continentColor}, ${skin.baseColor}, ${skin.oceanColor})`,
                  }}
                  className="w-6 h-6 rounded-full shrink-0 border border-white/40 shadow-sm"
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold text-white truncate">{skin.name}</div>
                  <div className="font-mono text-[9px] font-bold text-cyan-300">
                    {isActive ? 'Equipped' : isUnlocked ? 'Use' : `${skin.costPoints} pts`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* HIDDEN DAILY TASKS OVERLAY DRAWER (ONLY SHOWN WHEN SIDE BUTTON IS CLICKED) */}
      {showTasksDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 p-3 flex flex-col text-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <div className="text-xs font-black text-amber-300">Daily Tasks</div>
              <div className="text-[10px] font-bold text-slate-400">
                Tap a task to earn planet points
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTasksDrawer(false)}
              aria-label="Close Daily Tasks"
              className="p-1.5 rounded-full bg-slate-800 text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {db.dailyTasks.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={t.completed}
                onClick={() => handleCompleteTask(t.id)}
                className={`w-full text-left rounded-xl p-2 border flex items-center justify-between gap-2 transition cursor-pointer ${
                  t.completed
                    ? 'bg-slate-900/50 border-slate-800 opacity-65'
                    : 'bg-slate-900 border-slate-700 hover:border-amber-400'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">{t.title}</div>
                  <div className="font-mono text-[9px] text-amber-300 font-bold">
                    +{t.pointsReward} pts · {t.nasaRef}
                  </div>
                </div>
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    t.completed ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowTasksDrawer(false)}
            className="w-full py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
          >
            Quit
          </button>
        </div>
      )}
    </div>
  );
};
