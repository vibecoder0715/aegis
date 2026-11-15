import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { playBuffVictory, playGameNote, playTapClick } from '../watchAudio';
import type { VisitorWatchDatabase } from '../watchDb';

type GameId =
  | '2048'
  | 'piano'
  | 'snake'
  | 'asteroid'
  | 'memory'
  | 'reflex'
  | 'tictactoe'
  | 'simon'
  | 'puzzle15'
  | 'brick';

const GAMES_MENU: Array<{ id: GameId; name: string; color: string }> = [
  { id: '2048', name: '2048 Orbit', color: 'from-amber-500 to-orange-600' },
  { id: 'piano', name: 'Piano Tiles', color: 'from-sky-500 to-blue-600' },
  { id: 'snake', name: 'Space Snake', color: 'from-emerald-500 to-teal-600' },
  { id: 'asteroid', name: 'Asteroid Dodge', color: 'from-indigo-500 to-violet-600' },
  { id: 'memory', name: 'Memory Match', color: 'from-pink-500 to-rose-600' },
  { id: 'reflex', name: 'Fast Reflex', color: 'from-cyan-400 to-sky-600' },
  { id: 'tictactoe', name: 'Tic-Tac-Toe', color: 'from-violet-500 to-purple-600' },
  { id: 'simon', name: 'Simon Sound', color: 'from-orange-500 to-red-600' },
  { id: 'puzzle15', name: 'Slide Puzzle', color: 'from-teal-400 to-emerald-600' },
  { id: 'brick', name: 'Brick Breaker', color: 'from-rose-500 to-pink-600' },
];

const MiniGameIconSvg: React.FC<{ id: GameId; size?: number }> = ({ id, size = 32 }) => {
  switch (id) {
    case '2048':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="9" fill="#F59E0B" />
          <rect x="6" y="6" width="11" height="11" rx="3" fill="#FEF3C7" />
          <rect x="19" y="6" width="11" height="11" rx="3" fill="#FDE68A" />
          <rect x="6" y="19" width="11" height="11" rx="3" fill="#FCD34D" />
          <rect x="19" y="19" width="11" height="11" rx="3" fill="#78350F" />
          <text x="11.5" y="14" textAnchor="middle" fontSize="7" fontWeight="900" fill="#78350F">2</text>
          <text x="24.5" y="14" textAnchor="middle" fontSize="7" fontWeight="900" fill="#78350F">4</text>
          <text x="11.5" y="27" textAnchor="middle" fontSize="7" fontWeight="900" fill="#78350F">8</text>
          <text x="24.5" y="27" textAnchor="middle" fontSize="6" fontWeight="900" fill="#FEF3C7">16</text>
        </svg>
      );
    case 'piano':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="9" fill="#0284C7" />
          <rect x="6" y="6" width="7" height="24" rx="2" fill="#FFFFFF" />
          <rect x="14.5" y="6" width="7" height="24" rx="2" fill="#FFFFFF" />
          <rect x="23" y="6" width="7" height="24" rx="2" fill="#FFFFFF" />
          <rect x="11" y="6" width="4.5" height="14" rx="1.5" fill="#0F172A" />
          <rect x="20" y="6" width="4.5" height="14" rx="1.5" fill="#0F172A" />
        </svg>
      );
    case 'snake':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="9" fill="#065F46" />
          <path d="M8 25 H20 C23 25 25 23 25 20 V15 C25 12 23 10 20 10 H14" stroke="#34D399" strokeWidth="5" strokeLinecap="round" />
          <circle cx="13" cy="10" r="4" fill="#10B981" />
          <circle cx="12" cy="8.8" r="1" fill="#064E3B" />
          <path d="M9 10 L6 9 M9 10 L6 11" stroke="#F43F5E" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="27" cy="25" r="3" fill="#F43F5E" />
        </svg>
      );
    case 'asteroid':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="9" fill="#312E81" />
          <path d="M18 7 L23 19 L18 16 L13 19 Z" fill="#38BDF8" />
          <circle cx="11" cy="26" r="4" fill="#94A3B8" />
          <circle cx="25" cy="24" r="3.5" fill="#CBD5E1" />
        </svg>
      );
    case 'memory':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="9" fill="#BE185D" />
          <rect x="7" y="8" width="10" height="13" rx="2.5" fill="#FBCFE8" />
          <rect x="19" y="15" width="10" height="13" rx="2.5" fill="#F472B6" />
          <path d="M12 12 L13.5 15 L10.5 15 Z" fill="#BE185D" />
          <circle cx="24" cy="21.5" r="2.5" fill="#FFFFFF" />
        </svg>
      );
    case 'reflex':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="9" fill="#0891B2" />
          <path d="M20 6 L10 20 H18 L16 30 L26 16 H18 L20 6 Z" fill="#FDE047" />
        </svg>
      );
    case 'tictactoe':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="9" fill="#5B21B6" />
          <path d="M14 7 V29 M22 7 V29 M7 14 H29 M7 22 H29" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
          <path d="M8.5 8.5 L12.5 12.5 M12.5 8.5 L8.5 12.5" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="18" cy="18" r="2.3" stroke="#F43F5E" strokeWidth="2" />
          <path d="M23.5 23.5 L27.5 27.5 M27.5 23.5 L23.5 27.5" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'simon':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="9" fill="#1E293B" />
          <rect x="6" y="6" width="11" height="11" rx="4" fill="#10B981" />
          <rect x="19" y="6" width="11" height="11" rx="4" fill="#F43F5E" />
          <rect x="6" y="19" width="11" height="11" rx="4" fill="#FBBF24" />
          <rect x="19" y="19" width="11" height="11" rx="4" fill="#38BDF8" />
        </svg>
      );
    case 'puzzle15':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="9" fill="#0D9488" />
          <rect x="6" y="6" width="11" height="11" rx="2.5" fill="#99F6E4" />
          <rect x="19" y="6" width="11" height="11" rx="2.5" fill="#5EEAD4" />
          <rect x="6" y="19" width="11" height="11" rx="2.5" fill="#2DD4BF" />
          <path d="M24 22 V27 M21.5 24.5 H26.5" stroke="#CCFBF1" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'brick':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="2" y="2" width="32" height="32" rx="9" fill="#881337" />
          <rect x="6" y="7" width="7" height="4" rx="1" fill="#FB7185" />
          <rect x="14.5" y="7" width="7" height="4" rx="1" fill="#FBBF24" />
          <rect x="23" y="7" width="7" height="4" rx="1" fill="#38BDF8" />
          <circle cx="18" cy="19" r="3" fill="#FFFFFF" />
          <rect x="11" y="26" width="14" height="3.5" rx="1.75" fill="#34D399" />
        </svg>
      );
  }
};

function useSwipeBind(onDir: (dir: 'L' | 'R' | 'U' | 'D') => void) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      e.stopPropagation();
      if (e.touches[0]) startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.stopPropagation();
      if (!startRef.current || !e.changedTouches[0]) return;
      const dx = e.changedTouches[0].clientX - startRef.current.x;
      const dy = e.changedTouches[0].clientY - startRef.current.y;
      startRef.current = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) onDir(dx > 0 ? 'R' : 'L');
      else onDir(dy > 0 ? 'D' : 'U');
    },
    onMouseDown: (e: React.MouseEvent) => {
      e.stopPropagation();
      startRef.current = { x: e.clientX, y: e.clientY };
    },
    onMouseUp: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      startRef.current = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) onDir(dx > 0 ? 'R' : 'L');
      else onDir(dy > 0 ? 'D' : 'U');
    },
  };
}

interface MiniGamesProps {
  db: VisitorWatchDatabase;
  onUpdateDb: (updater: (prev: VisitorWatchDatabase) => VisitorWatchDatabase) => void;
}

export const MiniGamesAppView: React.FC<MiniGamesProps> = ({ db, onUpdateDb }) => {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  const recordHigh = (game: GameId, score: number) => {
    onUpdateDb((prev) => {
      const currentBest = prev.highScores[game] || 0;
      if (score <= currentBest) return prev;
      return {
        ...prev,
        highScores: { ...prev.highScores, [game]: score },
      };
    });
  };

  if (!activeGame) {
    return (
      <div className="space-y-2 text-white">
        <div className="grid grid-cols-2 gap-1.5">
          {GAMES_MENU.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                playTapClick(db.settings.muted);
                setActiveGame(g.id);
              }}
              className="rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-cyan-400 p-2 text-left flex items-center gap-2 cursor-pointer transition"
            >
              <div className="shrink-0">
                <MiniGameIconSvg id={g.id} size={32} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold truncate text-white">{g.name}</div>
                <div className="text-[9px] font-mono text-amber-300 font-bold flex items-center gap-0.5 mt-0.5">
                  <Trophy className="w-2.5 h-2.5" /> {db.highScores[g.id] ?? 0}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-white">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveGame(null)}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3 h-3" /> Games
        </button>
        <span className="text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1">
          <Trophy className="w-3 h-3" /> Best: {db.highScores[activeGame] ?? 0}
        </span>
      </div>

      {activeGame === '2048' && <Game2048 muted={db.settings.muted} onScore={(s) => recordHigh('2048', s)} />}
      {activeGame === 'piano' && <GamePianoTiles muted={db.settings.muted} onScore={(s) => recordHigh('piano', s)} />}
      {activeGame === 'snake' && <GameSpaceSnake onScore={(s) => recordHigh('snake', s)} />}
      {activeGame === 'asteroid' && <GameAsteroidDodge onScore={(s) => recordHigh('asteroid', s)} />}
      {activeGame === 'memory' && <GameMemoryMatch muted={db.settings.muted} onScore={(s) => recordHigh('memory', s)} />}
      {activeGame === 'reflex' && <GameReactionReflex onScore={(s) => recordHigh('reflex', s)} />}
      {activeGame === 'tictactoe' && <GameTicTacToe onScore={(s) => recordHigh('tictactoe', s)} />}
      {activeGame === 'simon' && <GameSimonSound muted={db.settings.muted} onScore={(s) => recordHigh('simon', s)} />}
      {activeGame === 'puzzle15' && <GameSlidePuzzle muted={db.settings.muted} onScore={(s) => recordHigh('puzzle15', s)} />}
      {activeGame === 'brick' && <GameBrickBreaker onScore={(s) => recordHigh('brick', s)} />}
    </div>
  );
};

/* ---------------- 1. 2048 ORBIT ---------------- */
const Game2048: React.FC<{ muted: boolean; onScore: (s: number) => void }> = ({ muted, onScore }) => {
  const spawn = (b: number[]) => {
    const empties = b.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    if (empties.length === 0) return b;
    const next = [...b];
    next[empties[Math.floor(Math.random() * empties.length)]] = Math.random() < 0.8 ? 2 : 4;
    return next;
  };
  const [board, setBoard] = useState<number[]>(() => spawn(spawn(Array(16).fill(0))));
  const [score, setScore] = useState(0);

  const slideRow = (row: number[]) => {
    const nz = row.filter((x) => x > 0);
    let gained = 0;
    const out: number[] = [];
    for (let i = 0; i < nz.length; i++) {
      if (nz[i] === nz[i + 1]) {
        const merged = nz[i] * 2;
        gained += merged;
        out.push(merged);
        i++;
      } else {
        out.push(nz[i]);
      }
    }
    while (out.length < 4) out.push(0);
    return { out, gained };
  };

  const move = (dir: 'L' | 'R' | 'U' | 'D') => {
    playTapClick(muted);
    let totalGain = 0;
    const next = Array(16).fill(0);
    for (let i = 0; i < 4; i++) {
      const line = [0, 1, 2, 3].map((j) =>
        dir === 'L' || dir === 'R' ? board[i * 4 + j] : board[j * 4 + i]
      );
      if (dir === 'R' || dir === 'D') line.reverse();
      const { out, gained } = slideRow(line);
      totalGain += gained;
      if (dir === 'R' || dir === 'D') out.reverse();
      for (let j = 0; j < 4; j++) {
        if (dir === 'L' || dir === 'R') next[i * 4 + j] = out[j];
        else next[j * 4 + i] = out[j];
      }
    }
    if (next.join(',') !== board.join(',')) {
      const updated = spawn(next);
      const ns = score + totalGain;
      setBoard(updated);
      setScore(ns);
      onScore(ns);
    }
  };

  const swipeProps = useSwipeBind(move);

  const tileColor = (v: number) => {
    if (v === 0) return 'bg-slate-800/80 text-transparent';
    if (v === 2) return 'bg-amber-100 text-slate-900';
    if (v === 4) return 'bg-amber-200 text-slate-900';
    if (v === 8) return 'bg-orange-400 text-white';
    if (v === 16) return 'bg-orange-500 text-white';
    if (v === 32) return 'bg-rose-500 text-white';
    return 'bg-amber-400 text-slate-950 ring-2 ring-white';
  };

  return (
    <div className="space-y-2 text-center select-none" {...swipeProps}>
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-xs font-bold text-amber-300">Score: {score}</span>
        <span className="text-[10px] text-slate-400">Swipe or tap arrows</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-2 rounded-2xl border border-slate-700">
        {board.map((v, i) => (
          <div
            key={i}
            className={`h-10 rounded-xl font-mono text-xs font-black flex items-center justify-center shadow-inner transition-all ${tileColor(v)}`}
          >
            {v || ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1 text-xs font-black">
        <button type="button" onClick={() => move('L')} className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer">←</button>
        <button type="button" onClick={() => move('U')} className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer">↑</button>
        <button type="button" onClick={() => move('D')} className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer">↓</button>
        <button type="button" onClick={() => move('R')} className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer">→</button>
      </div>
    </div>
  );
};

/* ---------------- 2. PIANO TILES (AUTO-SCROLL 4 -> 11 TILES/SEC) ---------------- */
interface PianoTileItem {
  id: number;
  col: number;
  y: number;
  hit: boolean;
}

const PIANO_PLAYFIELD_H = 168;
const PIANO_TILE_H = 42;
const PIANO_MIN_TPS = 4;
const PIANO_MAX_TPS = 11;

const makeInitialPianoTiles = (nextIdRef: React.MutableRefObject<number>): PianoTileItem[] => {
  const list: PianoTileItem[] = [];
  for (let i = 0; i < 6; i++) {
    list.push({
      id: nextIdRef.current++,
      col: Math.floor(Math.random() * 4),
      y: -10 - i * PIANO_TILE_H,
      hit: false,
    });
  }
  return list;
};

const GamePianoTiles: React.FC<{ muted: boolean; onScore: (s: number) => void }> = ({ muted, onScore }) => {
  const nextIdRef = useRef(1);
  const tilesRef = useRef<PianoTileItem[]>(makeInitialPianoTiles(nextIdRef));
  const scoreRef = useRef(0);
  const elapsedRef = useRef(0);
  const gameOverRef = useRef<string | null>(null);
  const [tiles, setTiles] = useState<PianoTileItem[]>(() => tilesRef.current);
  const [score, setScore] = useState(0);
  const [tilesPerSec, setTilesPerSec] = useState(PIANO_MIN_TPS);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [flashCol, setFlashCol] = useState<number | null>(null);
  const notes = [261.63, 293.66, 329.63, 392.0];

  const resetGame = () => {
    const fresh = makeInitialPianoTiles(nextIdRef);
    tilesRef.current = fresh;
    scoreRef.current = 0;
    elapsedRef.current = 0;
    gameOverRef.current = null;
    setTiles(fresh);
    setScore(0);
    setTilesPerSec(PIANO_MIN_TPS);
    setGameOver(null);
    setFlashCol(null);
  };

  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      if (!gameOverRef.current) {
        elapsedRef.current += dt;
        const speed = Math.min(PIANO_MAX_TPS, PIANO_MIN_TPS + elapsedRef.current * 0.25);
        const dy = speed * PIANO_TILE_H * dt;

        const moved = tilesRef.current
          .map((tile) => ({ ...tile, y: tile.y + dy }))
          .filter((tile) => tile.y < PIANO_PLAYFIELD_H + PIANO_TILE_H);

        const missed = moved.some((tile) => !tile.hit && tile.y >= PIANO_PLAYFIELD_H - 4);
        if (missed) {
          gameOverRef.current = 'Missed tile!';
          setTiles(moved);
          setTilesPerSec(speed);
          setGameOver('Missed tile!');
          rafId = requestAnimationFrame(step);
          return;
        }

        let topY = moved.reduce((minY, tile) => Math.min(minY, tile.y), PIANO_PLAYFIELD_H);
        while (topY > -PIANO_TILE_H) {
          topY -= PIANO_TILE_H;
          moved.push({
            id: nextIdRef.current++,
            col: Math.floor(Math.random() * 4),
            y: topY,
            hit: false,
          });
        }

        tilesRef.current = moved;
        setTiles(moved);
        setTilesPerSec(speed);
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleColTap = (col: number) => {
    if (gameOverRef.current) return;
    setFlashCol(col);
    window.setTimeout(() => setFlashCol((c) => (c === col ? null : c)), 110);

    const activeTargets = tilesRef.current
      .filter((tile) => !tile.hit && tile.y > -PIANO_TILE_H)
      .sort((a, b) => b.y - a.y);

    const lowest = activeTargets[0];
    if (!lowest) return;

    if (lowest.col === col) {
      playGameNote(notes[col], muted);
      tilesRef.current = tilesRef.current.map((tile) =>
        tile.id === lowest.id ? { ...tile, hit: true } : tile
      );
      setTiles(tilesRef.current);
      const ns = scoreRef.current + 1;
      scoreRef.current = ns;
      setScore(ns);
      onScore(ns);
    } else {
      gameOverRef.current = 'Wrong lane!';
      setGameOver('Wrong lane!');
    }
  };

  return (
    <div className="space-y-1.5 text-center">
      <div className="flex items-center justify-between text-[11px] font-mono font-bold px-1">
        <span className="text-sky-300">Score: {score}</span>
        <span className="text-cyan-300">{tilesPerSec.toFixed(1)} tiles/s</span>
      </div>

      <div
        className="relative w-full rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden select-none"
        style={{ height: `${PIANO_PLAYFIELD_H}px` }}
      >
        <div className="grid grid-cols-4 h-full relative z-10">
          {[0, 1, 2, 3].map((col) => (
            <button
              key={col}
              type="button"
              onPointerDown={() => handleColTap(col)}
              aria-label={`Piano lane ${col + 1}`}
              className={`h-full border-r last:border-r-0 border-slate-800/80 cursor-pointer transition-colors ${
                flashCol === col ? 'bg-sky-500/15' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-11 bg-sky-500/10 border-t border-sky-400/25"
        />

        {tiles.map((tile) => (
          <div
            key={tile.id}
            aria-hidden="true"
            className="pointer-events-none absolute px-1"
            style={{
              left: `${tile.col * 25}%`,
              width: '25%',
              top: `${tile.y}px`,
              height: `${PIANO_TILE_H - 3}px`,
            }}
          >
            <div
              className={`w-full h-full rounded-lg transition-opacity ${
                tile.hit
                  ? 'bg-emerald-400/40 border border-emerald-300/60 opacity-45'
                  : 'bg-gradient-to-b from-sky-400 to-blue-600 border border-white/80 shadow-[0_0_10px_rgba(56,189,248,0.55)]'
              }`}
            />
          </div>
        ))}

        {gameOver && (
          <div className="absolute inset-0 z-20 bg-slate-950/85 flex flex-col items-center justify-center gap-2 p-3">
            <div className="text-xs font-extrabold text-rose-400">{gameOver}</div>
            <div className="text-base font-black text-white">Score {score}</div>
            <button
              type="button"
              onClick={resetGame}
              className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-black cursor-pointer"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- 3. SPACE SNAKE (DETAILED HEAD, EYES, TONGUE & APPLE) ---------------- */
const GameSpaceSnake: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const [snake, setSnake] = useState<Array<[number, number]>>([
    [4, 4],
    [4, 3],
    [4, 2],
  ]);
  const [food, setFood] = useState<[number, number]>([2, 6]);
  const [dir, setDir] = useState<[number, number]>([0, 1]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSnake((prev) => {
        const head: [number, number] = [(prev[0][0] + dir[0] + 8) % 8, (prev[0][1] + dir[1] + 8) % 8];
        const ate = head[0] === food[0] && head[1] === food[1];
        const next = [head, ...(ate ? prev : prev.slice(0, -1))];
        if (ate) {
          setFood([Math.floor(Math.random() * 8), Math.floor(Math.random() * 8)]);
          setScore((s) => {
            onScore(s + 1);
            return s + 1;
          });
        }
        return next;
      });
    }, 320);
    return () => clearInterval(id);
  }, [dir, food]);

  const swipeProps = useSwipeBind((d) => {
    if (d === 'L') setDir([0, -1]);
    if (d === 'R') setDir([0, 1]);
    if (d === 'U') setDir([-1, 0]);
    if (d === 'D') setDir([1, 0]);
  });

  return (
    <div className="space-y-1.5 text-center select-none" {...swipeProps}>
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono font-bold text-emerald-300">Apples: {score}</span>
        <span className="text-[10px] text-slate-400">Swipe or tap</span>
      </div>
      <div className="grid grid-cols-8 gap-0.5 bg-[#07111E] p-1.5 rounded-2xl border border-emerald-500/40">
        {Array.from({ length: 64 }).map((_, idx) => {
          const r = Math.floor(idx / 8);
          const c = idx % 8;
          const segIdx = snake.findIndex(([sr, sc]) => sr === r && sc === c);
          const isHead = segIdx === 0;
          const isTail = segIdx === snake.length - 1 && segIdx > 0;
          const isBody = segIdx > 0;
          const isFood = food[0] === r && food[1] === c;
          return (
            <div
              key={idx}
              className={`h-5 rounded flex items-center justify-center relative ${
                isHead
                  ? 'bg-emerald-400 rounded-md shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : isTail
                  ? 'bg-emerald-600/80 rounded-full scale-75'
                  : isBody
                  ? 'bg-emerald-500 rounded-sm scale-90'
                  : 'bg-slate-900/80'
              }`}
            >
              {isHead && (
                <div className="flex items-center justify-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-slate-950" />
                  <span className="w-1 h-1 rounded-full bg-slate-950" />
                </div>
              )}
              {isFood && (
                <svg className="w-4 h-4" viewBox="0 0 16 16">
                  <circle cx="8" cy="9" r="5" fill="#F43F5E" />
                  <path d="M8 3 Q10 1 12 3" stroke="#34D399" strokeWidth="1.5" fill="none" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-1 text-xs font-black">
        <button type="button" onClick={() => setDir([0, -1])} className="py-1 rounded-lg bg-slate-800 cursor-pointer">←</button>
        <button type="button" onClick={() => setDir([-1, 0])} className="py-1 rounded-lg bg-slate-800 cursor-pointer">↑</button>
        <button type="button" onClick={() => setDir([1, 0])} className="py-1 rounded-lg bg-slate-800 cursor-pointer">↓</button>
        <button type="button" onClick={() => setDir([0, 1])} className="py-1 rounded-lg bg-slate-800 cursor-pointer">→</button>
      </div>
    </div>
  );
};

/* ---------------- 4. ASTEROID DODGE ---------------- */
const GameAsteroidDodge: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const [shipCol, setShipCol] = useState(2);
  const [rock, setRock] = useState({ col: 1, row: 0 });
  const [score, setScore] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRock((r) => {
        if (r.row >= 4) {
          if (r.col === shipCol) {
            setScore(0);
          } else {
            setScore((s) => {
              onScore(s + 1);
              return s + 1;
            });
          }
          return { col: Math.floor(Math.random() * 5), row: 0 };
        }
        return { ...r, row: r.row + 1 };
      });
    }, 320);
    return () => clearInterval(id);
  }, [shipCol]);

  const swipeProps = useSwipeBind((d) => {
    if (d === 'L') setShipCol((c) => Math.max(0, c - 1));
    if (d === 'R') setShipCol((c) => Math.min(4, c + 1));
  });

  return (
    <div className="space-y-2 text-center select-none" {...swipeProps}>
      <div className="text-xs font-mono font-bold text-indigo-300">Dodged: {score}</div>
      <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-indigo-500/40">
        {Array.from({ length: 25 }).map((_, i) => {
          const r = Math.floor(i / 5);
          const c = i % 5;
          const isRock = r === rock.row && c === rock.col;
          const isShip = r === 4 && c === shipCol;
          return (
            <div key={i} className="h-7 rounded-lg flex items-center justify-center bg-slate-900">
              {isRock && (
                <svg className="w-5 h-5" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="7" fill="#94A3B8" />
                  <circle cx="8" cy="8" r="2" fill="#475569" />
                  <circle cx="13" cy="12" r="1.5" fill="#475569" />
                </svg>
              )}
              {isShip && (
                <svg className="w-5 h-5" viewBox="0 0 20 20">
                  <path d="M10 2 L16 16 L10 13 L4 16 Z" fill="#38BDF8" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setShipCol((c) => Math.max(0, c - 1))} className="flex-1 py-1.5 rounded-xl bg-indigo-600 text-xs font-bold cursor-pointer">← Left</button>
        <button type="button" onClick={() => setShipCol((c) => Math.min(4, c + 1))} className="flex-1 py-1.5 rounded-xl bg-indigo-600 text-xs font-bold cursor-pointer">Right →</button>
      </div>
    </div>
  );
};

/* ---------------- 5. MEMORY MATCH ---------------- */
const GameMemoryMatch: React.FC<{ muted: boolean; onScore: (s: number) => void }> = ({ muted, onScore }) => {
  const icons = ['🛰️', '🌙', '☀️', '⭐', '🚀', '🪐'];
  const [cards, setCards] = useState(() => [...icons, ...icons].sort(() => Math.random() - 0.5));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const flip = (idx: number) => {
    if (open.includes(idx) || matched.includes(idx) || open.length === 2) return;
    playTapClick(muted);
    const nextOpen = [...open, idx];
    setOpen(nextOpen);
    if (nextOpen.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextOpen;
      if (cards[a] === cards[b]) {
        const nextM = [...matched, a, b];
        setMatched(nextM);
        setOpen([]);
        if (nextM.length === 12) {
          playBuffVictory(muted);
          onScore(Math.max(10, 30 - moves));
        }
      } else {
        setTimeout(() => setOpen([]), 600);
      }
    }
  };

  return (
    <div className="space-y-2 text-center">
      <div className="flex items-center justify-between px-1 text-xs font-mono font-bold text-pink-300">
        <span>Pairs: {matched.length / 2}/6</span>
        <button
          type="button"
          onClick={() => {
            setCards([...icons, ...icons].sort(() => Math.random() - 0.5));
            setOpen([]);
            setMatched([]);
            setMoves(0);
          }}
          className="text-[10px] text-slate-300 flex items-center gap-0.5 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {cards.map((sym, i) => {
          const shown = open.includes(i) || matched.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => flip(i)}
              className={`h-10 rounded-xl text-base font-bold cursor-pointer transition-transform ${
                shown
                  ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white scale-100'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
              }`}
            >
              {shown ? sym : '✦'}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- 6. REACTION REFLEX ---------------- */
const GameReactionReflex: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const [phase, setPhase] = useState<'idle' | 'wait' | 'go' | 'done'>('idle');
  const [startMs, setStartMs] = useState(0);
  const [ms, setMs] = useState<number | null>(null);

  const start = () => {
    setPhase('wait');
    setTimeout(() => {
      setStartMs(performance.now());
      setPhase('go');
    }, 900 + Math.random() * 1400);
  };

  const hit = () => {
    if (phase === 'go') {
      const diff = Math.round(performance.now() - startMs);
      setMs(diff);
      setPhase('done');
      onScore(Math.max(10, 500 - diff));
    }
  };

  return (
    <div className="space-y-3 text-center">
      <div className="text-xs font-mono font-bold text-cyan-300">
        {ms ? `Speed: ${ms} ms` : 'Tap when screen turns green'}
      </div>
      <button
        type="button"
        onClick={phase === 'go' ? hit : start}
        className={`w-full h-28 rounded-2xl font-black text-sm cursor-pointer shadow-lg transition ${
          phase === 'go'
            ? 'bg-emerald-400 text-slate-950'
            : phase === 'wait'
            ? 'bg-amber-500 text-slate-950'
            : 'bg-slate-800 text-white'
        }`}
      >
        {phase === 'idle' && 'Tap to Start'}
        {phase === 'wait' && 'Wait for Green...'}
        {phase === 'go' && 'TAP NOW!'}
        {phase === 'done' && `${ms} ms · Tap to Retry`}
      </button>
    </div>
  );
};

/* ---------------- 7. TIC-TAC-TOE (GLOWING SVG X & O) ---------------- */
const GameTicTacToe: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const [board, setBoard] = useState<Array<'X' | 'O' | null>>(Array(9).fill(null));
  const checkWin = (b: Array<'X' | 'O' | null>) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, c, d] of lines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line: [a, c, d] };
    }
    return null;
  };
  const winInfo = checkWin(board);
  const winner = winInfo?.winner ?? null;

  const playCell = (i: number) => {
    if (board[i] || winner) return;
    const next = [...board];
    next[i] = 'X';
    if (!checkWin(next)) {
      const empties = next.map((v, idx) => (v ? -1 : idx)).filter((x) => x >= 0);
      if (empties.length > 0) {
        next[empties[Math.floor(Math.random() * empties.length)]] = 'O';
      }
    } else {
      onScore(10);
    }
    setBoard(next);
  };

  return (
    <div className="space-y-2 text-center">
      <div className="text-xs font-bold text-violet-300">
        {winner ? `${winner} Wins!` : 'You (X) vs Watch (O)'}
      </div>
      <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-2 rounded-2xl border border-violet-500/40">
        {board.map((cell, i) => {
          const isWinCell = winInfo?.line.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => playCell(i)}
              className={`h-12 rounded-xl flex items-center justify-center cursor-pointer transition ${
                isWinCell ? 'bg-violet-600/50 ring-2 ring-amber-300' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              {cell === 'X' && (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M5 5 L19 19 M19 5 L5 19" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              )}
              {cell === 'O' && (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="7" stroke="#F43F5E" strokeWidth="3.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setBoard(Array(9).fill(null))}
        className="w-full py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold cursor-pointer"
      >
        New Match
      </button>
    </div>
  );
};

/* ---------------- 8. SIMON SOUND ---------------- */
const GameSimonSound: React.FC<{ muted: boolean; onScore: (s: number) => void }> = ({ muted, onScore }) => {
  const freqs = [329.63, 440, 523.25, 659.25];
  const colors = ['bg-emerald-500', 'bg-rose-500', 'bg-amber-400', 'bg-sky-500'];
  const [seq, setSeq] = useState<number[]>([0, 2]);
  const [step, setStep] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);

  const playPattern = (list: number[]) => {
    list.forEach((pad, idx) => {
      setTimeout(() => {
        setFlash(pad);
        playGameNote(freqs[pad], muted);
        setTimeout(() => setFlash(null), 260);
      }, idx * 420);
    });
  };

  const press = (pad: number) => {
    playGameNote(freqs[pad], muted);
    if (seq[step] === pad) {
      if (step + 1 === seq.length) {
        onScore(seq.length);
        const nextSeq = [...seq, Math.floor(Math.random() * 4)];
        setSeq(nextSeq);
        setStep(0);
        setTimeout(() => playPattern(nextSeq), 450);
      } else {
        setStep(step + 1);
      }
    } else {
      setSeq([0]);
      setStep(0);
    }
  };

  return (
    <div className="space-y-2 text-center">
      <div className="text-xs font-mono font-bold text-orange-300">Level: {seq.length}</div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => press(p)}
            className={`h-14 rounded-2xl cursor-pointer transition ${colors[p]} ${
              flash === p ? 'ring-4 ring-white scale-95' : 'opacity-85 hover:opacity-100'
            }`}
            aria-label={`Simon pad ${p}`}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => playPattern(seq)}
        className="w-full py-1.5 rounded-xl bg-slate-800 text-xs font-bold cursor-pointer"
      >
        Play Sound Pattern
      </button>
    </div>
  );
};

/* ---------------- 9. SLIDE PUZZLE (3x3 WITH SWIPE & 3D TILES) ---------------- */
const GameSlidePuzzle: React.FC<{ muted: boolean; onScore: (s: number) => void }> = ({ muted, onScore }) => {
  const [tiles, setTiles] = useState([1, 2, 3, 4, 5, 6, 7, 0, 8]);
  const [moves, setMoves] = useState(0);
  const solved = tiles.join(',') === '1,2,3,4,5,6,7,8,0';

  const tap = (idx: number) => {
    const empty = tiles.indexOf(0);
    const sameRow = Math.floor(idx / 3) === Math.floor(empty / 3);
    const adj = (sameRow && Math.abs(idx - empty) === 1) || Math.abs(idx - empty) === 3;
    if (!adj) return;
    playTapClick(muted);
    const next = [...tiles];
    [next[idx], next[empty]] = [next[empty], next[idx]];
    setTiles(next);
    setMoves((m) => m + 1);
    if (next.join(',') === '1,2,3,4,5,6,7,8,0') {
      playBuffVictory(muted);
      onScore(Math.max(10, 40 - moves));
    }
  };

  const swipeProps = useSwipeBind((dir) => {
    const empty = tiles.indexOf(0);
    const r = Math.floor(empty / 3);
    const c = empty % 3;
    if (dir === 'L' && c < 2) tap(empty + 1);
    if (dir === 'R' && c > 0) tap(empty - 1);
    if (dir === 'U' && r < 2) tap(empty + 3);
    if (dir === 'D' && r > 0) tap(empty - 3);
  });

  const shuffle = () => {
    playTapClick(muted);
    setTiles([1, 2, 3, 4, 0, 6, 7, 5, 8]);
    setMoves(0);
  };

  return (
    <div className="space-y-2 text-center select-none" {...swipeProps}>
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono font-bold text-teal-300">
          {solved ? 'Solved!' : `Moves: ${moves}`}
        </span>
        <button
          type="button"
          onClick={shuffle}
          className="text-[10px] font-bold text-slate-300 flex items-center gap-0.5 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Shuffle
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-2 rounded-2xl border border-teal-500/40">
        {tiles.map((val, i) => {
          const inPlace = val !== 0 && val === i + 1;
          return (
            <button
              key={i}
              type="button"
              onClick={() => tap(i)}
              className={`h-12 rounded-xl font-mono text-sm font-black cursor-pointer transition-all ${
                val === 0
                  ? 'bg-slate-950/90 border border-dashed border-slate-800 text-transparent'
                  : inPlace
                  ? 'bg-gradient-to-b from-teal-300 to-emerald-500 text-slate-950 shadow-[0_3px_0_#065F46]'
                  : 'bg-gradient-to-b from-slate-200 to-slate-400 text-slate-950 shadow-[0_3px_0_#334155]'
              }`}
            >
              {val}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- 10. BRICK BREAKER ---------------- */
const GameBrickBreaker: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const [paddleX, setPaddleX] = useState(50);
  const [bricks, setBricks] = useState([true, true, true, true, true, true, true, true]);
  const [score, setScore] = useState(0);

  const hitBrick = () => {
    const idx = bricks.findIndex(Boolean);
    if (idx === -1) {
      setBricks([true, true, true, true, true, true, true, true]);
      return;
    }
    const next = [...bricks];
    next[idx] = false;
    setBricks(next);
    const ns = score + 10;
    setScore(ns);
    onScore(ns);
  };

  const swipeProps = useSwipeBind((dir) => {
    if (dir === 'L') setPaddleX((p) => Math.max(15, p - 20));
    if (dir === 'R') setPaddleX((p) => Math.min(85, p + 20));
  });

  return (
    <div className="space-y-2 text-center select-none" {...swipeProps}>
      <div className="text-xs font-mono font-bold text-rose-300">Score: {score}</div>
      <div className="rounded-2xl bg-slate-950 border border-rose-500/40 p-2.5 space-y-4">
        <div className="grid grid-cols-4 gap-1.5">
          {bricks.map((alive, i) => (
            <div
              key={i}
              className={`h-4 rounded-md transition ${
                alive ? 'bg-gradient-to-r from-rose-500 to-amber-500 shadow' : 'bg-slate-900'
              }`}
            />
          ))}
        </div>
        <div className="h-8 relative flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_#fff]" />
          <div
            style={{ left: `${paddleX}%` }}
            className="absolute bottom-0 -translate-x-1/2 w-14 h-2.5 rounded-full bg-sky-400 shadow"
          />
        </div>
      </div>
      <div className="flex gap-1.5">
        <button type="button" onClick={() => setPaddleX((p) => Math.max(15, p - 18))} className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold cursor-pointer">←</button>
        <button type="button" onClick={hitBrick} className="flex-1 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-black cursor-pointer">Hit Brick</button>
        <button type="button" onClick={() => setPaddleX((p) => Math.min(85, p + 18))} className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold cursor-pointer">→</button>
      </div>
    </div>
  );
};
