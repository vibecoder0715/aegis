import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
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

const GAMES_MENU: Array<{ id: GameId; name: string; tag: string; color: string }> = [
  { id: '2048', name: '2048 Orbit', tag: 'Logic', color: 'bg-amber-500 text-slate-950' },
  { id: 'piano', name: 'Piano Tiles', tag: 'Rhythm', color: 'bg-sky-500 text-slate-950' },
  { id: 'snake', name: 'Space Snake', tag: 'Reflex', color: 'bg-emerald-500 text-slate-950' },
  { id: 'asteroid', name: 'Asteroid Dodge', tag: 'Piloting', color: 'bg-indigo-500 text-white' },
  { id: 'memory', name: 'Memory Match', tag: 'Memory', color: 'bg-pink-500 text-white' },
  { id: 'reflex', name: 'Reaction Reflex', tag: 'Speed ms', color: 'bg-cyan-400 text-slate-950' },
  { id: 'tictactoe', name: 'Tic-Tac-Toe', tag: 'Strategy', color: 'bg-violet-500 text-white' },
  { id: 'simon', name: 'Simon Sound', tag: 'Audio', color: 'bg-orange-500 text-slate-950' },
  { id: 'puzzle15', name: 'Slide Puzzle', tag: 'Spatial', color: 'bg-teal-400 text-slate-950' },
  { id: 'brick', name: 'Brick Breaker', tag: 'Arcade', color: 'bg-rose-500 text-white' },
];

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
        <div className="rounded-xl bg-indigo-950 border border-indigo-400/40 p-2 flex items-center justify-between text-[11px]">
          <span className="font-extrabold">10 Offline Mini Games</span>
          <span className="text-amber-300 font-mono font-bold">0% Wi-Fi</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {GAMES_MENU.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                playTapClick(db.settings.muted);
                setActiveGame(g.id);
              }}
              className="rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-400 p-2 text-left space-y-1 cursor-pointer"
            >
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black ${g.color}`}>
                {g.tag}
              </span>
              <div className="text-xs font-extrabold">{g.name}</div>
              <div className="text-[9px] font-mono text-slate-400">
                Best: {db.highScores[g.id] ?? 0}
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
          className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3 h-3" /> 10 Games
        </button>
        <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
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

  return (
    <div className="space-y-2 text-center">
      <div className="font-mono text-xs font-bold text-amber-300">2048 Score: {score}</div>
      <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1.5 rounded-xl">
        {board.map((v, i) => (
          <div
            key={i}
            className={`h-10 rounded-lg font-mono text-xs font-black flex items-center justify-center ${
              v === 0
                ? 'bg-slate-800 text-slate-600'
                : v >= 16
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-200 text-slate-900'
            }`}
          >
            {v || ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1 text-xs font-black">
        <button type="button" onClick={() => move('L')} className="py-1.5 rounded-lg bg-slate-800 cursor-pointer">←</button>
        <button type="button" onClick={() => move('U')} className="py-1.5 rounded-lg bg-slate-800 cursor-pointer">↑</button>
        <button type="button" onClick={() => move('D')} className="py-1.5 rounded-lg bg-slate-800 cursor-pointer">↓</button>
        <button type="button" onClick={() => move('R')} className="py-1.5 rounded-lg bg-slate-800 cursor-pointer">→</button>
      </div>
    </div>
  );
};

/* ---------------- 2. PIANO TILES ---------------- */
const GamePianoTiles: React.FC<{ muted: boolean; onScore: (s: number) => void }> = ({ muted, onScore }) => {
  const [rows, setRows] = useState<number[]>(() => [0, 2, 1, 3].map(() => Math.floor(Math.random() * 4)));
  const [score, setScore] = useState(0);
  const notes = [261.63, 293.66, 329.63, 392.0];

  const tapCol = (col: number) => {
    if (rows[3] === col) {
      playGameNote(notes[col], muted);
      const ns = score + 1;
      setScore(ns);
      onScore(ns);
      setRows((prev) => [Math.floor(Math.random() * 4), ...prev.slice(0, 3)]);
    } else {
      setScore(0);
    }
  };

  return (
    <div className="space-y-1.5 text-center">
      <div className="text-xs font-mono font-bold text-sky-300">Tap Bottom Black Tile · Score: {score}</div>
      <div className="grid grid-cols-4 gap-1 bg-slate-800 p-1 rounded-xl">
        {rows.map((blackCol, rIdx) =>
          [0, 1, 2, 3].map((cIdx) => {
            const isBlack = blackCol === cIdx;
            const isBottom = rIdx === 3;
            return (
              <button
                key={`${rIdx}-${cIdx}`}
                type="button"
                disabled={!isBottom}
                onClick={() => tapCol(cIdx)}
                className={`h-9 rounded-md cursor-pointer ${
                  isBlack
                    ? isBottom
                      ? 'bg-sky-400 border-2 border-white'
                      : 'bg-slate-950'
                    : 'bg-slate-700/60'
                }`}
                aria-label={`Piano row ${rIdx} col ${cIdx}`}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

/* ---------------- 3. SPACE SNAKE ---------------- */
const GameSpaceSnake: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const [snake, setSnake] = useState<Array<[number, number]>>([[4, 4], [4, 3]]);
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
    }, 340);
    return () => clearInterval(id);
  }, [dir, food]);

  return (
    <div className="space-y-1.5 text-center">
      <div className="text-xs font-mono font-bold text-emerald-300">Snake Length: {score + 2}</div>
      <div className="grid grid-cols-8 gap-0.5 bg-slate-950 p-1 rounded-xl border border-slate-700">
        {Array.from({ length: 64 }).map((_, idx) => {
          const r = Math.floor(idx / 8);
          const c = idx % 8;
          const isSnake = snake.some(([sr, sc]) => sr === r && sc === c);
          const isFood = food[0] === r && food[1] === c;
          return (
            <div
              key={idx}
              className={`h-4 rounded-sm ${
                isSnake ? 'bg-emerald-400' : isFood ? 'bg-rose-400' : 'bg-slate-900'
              }`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-1 text-xs font-black">
        <button type="button" onClick={() => setDir([0, -1])} className="py-1 rounded bg-slate-800 cursor-pointer">←</button>
        <button type="button" onClick={() => setDir([-1, 0])} className="py-1 rounded bg-slate-800 cursor-pointer">↑</button>
        <button type="button" onClick={() => setDir([1, 0])} className="py-1 rounded bg-slate-800 cursor-pointer">↓</button>
        <button type="button" onClick={() => setDir([0, 1])} className="py-1 rounded bg-slate-800 cursor-pointer">→</button>
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

  return (
    <div className="space-y-2 text-center">
      <div className="text-xs font-mono font-bold text-indigo-300">Dodged: {score}</div>
      <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-700">
        {Array.from({ length: 25 }).map((_, i) => {
          const r = Math.floor(i / 5);
          const c = i % 5;
          const isRock = r === rock.row && c === rock.col;
          const isShip = r === 4 && c === shipCol;
          return (
            <div key={i} className="h-6 rounded flex items-center justify-center text-xs bg-slate-900">
              {isRock ? '☄️' : isShip ? '🚀' : ''}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setShipCol((c) => Math.max(0, c - 1))} className="flex-1 py-1.5 rounded-lg bg-indigo-600 text-xs font-bold cursor-pointer">Left</button>
        <button type="button" onClick={() => setShipCol((c) => Math.min(4, c + 1))} className="flex-1 py-1.5 rounded-lg bg-indigo-600 text-xs font-bold cursor-pointer">Right</button>
      </div>
    </div>
  );
};

/* ---------------- 5. MEMORY MATCH ---------------- */
const GameMemoryMatch: React.FC<{ muted: boolean; onScore: (s: number) => void }> = ({ muted, onScore }) => {
  const icons = ['🛰️', '🌙', '☀️', '⭐', '🚀', '🧬'];
  const [cards] = useState(() => [...icons, ...icons].sort(() => Math.random() - 0.5));
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
        setTimeout(() => setOpen([]), 650);
      }
    }
  };

  return (
    <div className="space-y-2 text-center">
      <div className="text-xs font-mono font-bold text-pink-300">
        Matched: {matched.length / 2}/6 · Moves: {moves}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {cards.map((sym, i) => {
          const shown = open.includes(i) || matched.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => flip(i)}
              className={`h-10 rounded-lg text-base font-bold cursor-pointer ${
                shown ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {shown ? sym : '?'}
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
        {ms ? `Reaction: ${ms} ms` : 'Orbital Piloting Reflex Test'}
      </div>
      <button
        type="button"
        onClick={phase === 'go' ? hit : start}
        className={`w-full h-28 rounded-2xl font-black text-sm cursor-pointer ${
          phase === 'go'
            ? 'bg-emerald-400 text-slate-950'
            : phase === 'wait'
            ? 'bg-amber-500 text-slate-950'
            : 'bg-slate-800 text-white'
        }`}
      >
        {phase === 'idle' && 'Tap to Start Test'}
        {phase === 'wait' && 'Wait for Green...'}
        {phase === 'go' && 'TAP NOW!'}
        {phase === 'done' && `${ms} ms — Tap to Retry`}
      </button>
    </div>
  );
};

/* ---------------- 7. TIC-TAC-TOE ---------------- */
const GameTicTacToe: React.FC<{ onScore: (s: number) => void }> = ({ onScore }) => {
  const [board, setBoard] = useState<Array<'X' | 'O' | null>>(Array(9).fill(null));
  const checkWin = (b: Array<'X' | 'O' | null>) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, c, d] of lines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return null;
  };
  const winner = checkWin(board);

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
        {winner ? `Winner: ${winner}` : 'You (X) vs Watch AI (O)'}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {board.map((cell, i) => (
          <button
            key={i}
            type="button"
            onClick={() => playCell(i)}
            className="h-11 rounded-xl bg-slate-800 font-black text-base cursor-pointer"
          >
            {cell || ''}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setBoard(Array(9).fill(null))}
        className="w-full py-1.5 rounded-lg bg-violet-500 text-xs font-bold cursor-pointer"
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
      <div className="text-xs font-mono font-bold text-orange-300">Sequence Level: {seq.length}</div>
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
        className="w-full py-1.5 rounded-lg bg-slate-800 text-xs font-bold cursor-pointer"
      >
        Replay Tone Cue
      </button>
    </div>
  );
};

/* ---------------- 9. SLIDE PUZZLE (3x3) ---------------- */
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

  return (
    <div className="space-y-2 text-center">
      <div className="text-xs font-mono font-bold text-teal-300">
        {solved ? 'Solved!' : `Moves: ${moves}`}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {tiles.map((val, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(i)}
            className={`h-11 rounded-xl font-mono text-sm font-black cursor-pointer ${
              val === 0 ? 'bg-slate-950 text-transparent' : 'bg-teal-500 text-slate-950'
            }`}
          >
            {val}
          </button>
        ))}
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

  return (
    <div className="space-y-2 text-center">
      <div className="text-xs font-mono font-bold text-rose-300">Orbital Bricks Score: {score}</div>
      <div className="rounded-xl bg-slate-950 border border-slate-700 p-2 space-y-3">
        <div className="grid grid-cols-4 gap-1">
          {bricks.map((alive, i) => (
            <div key={i} className={`h-4 rounded ${alive ? 'bg-rose-500' : 'bg-slate-900'}`} />
          ))}
        </div>
        <div className="h-6 relative">
          <div
            style={{ left: `${paddleX}%` }}
            className="absolute bottom-0 -translate-x-1/2 w-12 h-2.5 rounded-full bg-sky-400"
          />
        </div>
      </div>
      <div className="flex gap-1.5">
        <button type="button" onClick={() => setPaddleX((p) => Math.max(15, p - 18))} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold cursor-pointer">←</button>
        <button type="button" onClick={hitBrick} className="flex-1 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-black cursor-pointer">Launch Ball</button>
        <button type="button" onClick={() => setPaddleX((p) => Math.min(85, p + 18))} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold cursor-pointer">→</button>
      </div>
    </div>
  );
};
