import React, { useEffect, useRef, useState } from 'react';
import {
  Camera as CameraIcon,
  Video,
  Mic,
  Square,
  Trash2,
  Send,
  Sparkles,
  ScanSearch,
  Plus,
  BookOpen,
  Heart,
  Users,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from 'lucide-react';
import type { LiveSensorInputs, SituationId } from '../../src/utils/metricsEngine';
import { SMART_DETECTOR_CATALOG } from '../nasaCsaKnowledge';
import {
  deleteVisitorMediaItem,
  evaluateOfflineAiQuery,
  grepVisitorWatchDb,
  listVisitorMedia,
  saveVisitorMediaItem,
  VisitorWatchDatabase,
  WatchMediaItem,
} from '../watchDb';
import { playTapClick } from '../watchAudio';

interface MediaAiProps {
  db: VisitorWatchDatabase;
  inputs: LiveSensorInputs;
  situation: SituationId;
  onUpdateDb: (updater: (prev: VisitorWatchDatabase) => VisitorWatchDatabase) => void;
}

export const CameraAppView: React.FC<MediaAiProps> = ({ db, inputs, onUpdateDb }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [hasLiveCam, setHasLiveCam] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [smartResult, setSmartResult] = useState<string | null>(null);
  const [detectLoading, setDetectLoading] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            setHasLiveCam(true);
          }
        })
        .catch(() => setHasLiveCam(false));
    }
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const captureFrameDataUrl = (): string => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 220;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (hasLiveCam && videoRef.current && videoRef.current.readyState >= 2) {
        if (db.settings.beautifyCamera) {
          ctx.filter = 'brightness(1.08) contrast(1.04) saturate(1.12)';
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
      } else {
        const grad = ctx.createLinearGradient(0, 0, 320, 220);
        grad.addColorStop(0, '#0F172A');
        grad.addColorStop(1, '#1E3A8A');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 320, 220);
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(160, 110, 56, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('AEGIS CAMERA', 24, 34);
        ctx.font = '12px monospace';
        ctx.fillText(`Heart ${inputs.heartRate} bpm · Steps ${inputs.steps}`, 24, 196);
      }
    }
    return canvas.toDataURL('image/png');
  };

  const handleTakePhoto = async () => {
    playTapClick(db.settings.muted);
    const dataUrl = captureFrameDataUrl();
    const item: WatchMediaItem = {
      id: `pic-${Date.now().toString(36)}`,
      visitorId: db.visitorId,
      kind: 'photo',
      title: `Photo ${new Date().toISOString().slice(11, 16)}`,
      createdAtUtc: new Date().toISOString(),
      dataUrl,
      smartTag: db.settings.smartDetectorMode ? 'Smart' : 'Photo',
    };
    await saveVisitorMediaItem(item);
    setSmartResult('Photo saved to Gallery!');
  };

  const handleToggleVideo = async () => {
    playTapClick(db.settings.muted);
    if (recordingVideo) {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      } else {
        const dataUrl = captureFrameDataUrl();
        await saveVisitorMediaItem({
          id: `vid-${Date.now().toString(36)}`,
          visitorId: db.visitorId,
          kind: 'video',
          title: `Video ${new Date().toISOString().slice(11, 16)}`,
          createdAtUtc: new Date().toISOString(),
          dataUrl,
          durationSec: 4,
        });
        setSmartResult('Video saved to Gallery!');
      }
      setRecordingVideo(false);
      return;
    }

    setRecordingVideo(true);
    if (hasLiveCam && videoRef.current?.srcObject && typeof MediaRecorder !== 'undefined') {
      try {
        chunksRef.current = [];
        const mr = new MediaRecorder(videoRef.current.srcObject as MediaStream);
        mr.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunksRef.current.push(ev.data);
        };
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            await saveVisitorMediaItem({
              id: `vid-${Date.now().toString(36)}`,
              visitorId: db.visitorId,
              kind: 'video',
              title: `Clip ${new Date().toISOString().slice(11, 16)}`,
              createdAtUtc: new Date().toISOString(),
              dataUrl: String(reader.result || ''),
              durationSec: 5,
            });
            setSmartResult('Video saved to Gallery!');
          };
          reader.readAsDataURL(blob);
        };
        mr.start();
        recorderRef.current = mr;
      } catch {
        // Fallback
      }
    }
  };

  const handleSmartDetect = async () => {
    playTapClick(db.settings.muted);
    setDetectLoading(true);
    const pick = SMART_DETECTOR_CATALOG[Math.floor(Date.now() / 5000) % SMART_DETECTOR_CATALOG.length];
    setSmartResult(`Found: ${pick.name}. ${pick.usageGuidance}`);
    setDetectLoading(false);
  };

  return (
    <div className="space-y-2.5 text-white">
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 h-32 flex items-center justify-center">
        {hasLiveCam ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              db.settings.beautifyCamera ? 'brightness-110 saturate-110 contrast-105' : ''
            }`}
          />
        ) : (
          <div className="text-center px-3 space-y-1">
            <CameraIcon className="w-7 h-7 mx-auto text-sky-400" />
            <div className="text-[11px] font-bold text-slate-200">
              Watch Camera Ready
            </div>
            <div className="text-[9px] text-slate-400">
              Take photos or scan items
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <button
          type="button"
          onClick={() =>
            onUpdateDb((p) => ({
              ...p,
              settings: { ...p.settings, beautifyCamera: !p.settings.beautifyCamera },
            }))
          }
          className={`py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer ${
            db.settings.beautifyCamera ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          <Sparkles className="w-3 h-3" /> Glow {db.settings.beautifyCamera ? 'ON' : 'OFF'}
        </button>

        <button
          type="button"
          onClick={handleSmartDetect}
          disabled={detectLoading}
          className="py-1.5 rounded-xl bg-cyan-400 text-slate-950 font-black flex items-center justify-center gap-1 cursor-pointer"
        >
          <ScanSearch className="w-3 h-3" /> {detectLoading ? 'Checking...' : 'Smart Scan'}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleTakePhoto}
          className="flex-1 py-2 rounded-xl bg-white text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
        >
          <CameraIcon className="w-3.5 h-3.5" /> Photo
        </button>
        <button
          type="button"
          onClick={handleToggleVideo}
          className={`flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1 cursor-pointer ${
            recordingVideo ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-white'
          }`}
        >
          {recordingVideo ? <Square className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          {recordingVideo ? 'Stop' : 'Video'}
        </button>
      </div>

      {smartResult && (
        <div className="rounded-xl bg-slate-900 border border-cyan-500/40 p-2 text-[10px] leading-snug text-cyan-100">
          {smartResult}
        </div>
      )}
    </div>
  );
};

export const GalleryAppView: React.FC<MediaAiProps> = ({ db }) => {
  const [items, setItems] = useState<WatchMediaItem[]>([]);

  const reload = () => {
    listVisitorMedia(db.visitorId).then((list) =>
      setItems(list.filter((i) => i.kind === 'photo' || i.kind === 'video'))
    );
  };

  useEffect(() => {
    reload();
  }, [db.visitorId]);

  return (
    <div className="space-y-2.5 text-white">
      <div className="rounded-xl bg-sky-950/75 border border-sky-500/40 p-2 text-[11px] font-bold text-sky-200">
        My Photos ({items.length})
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4 text-center text-[11px] text-slate-400">
          No photos yet. Use Camera to take one!
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-900 border border-slate-700 p-2 space-y-1.5">
              {item.kind === 'video' && item.dataUrl.startsWith('data:video') ? (
                <video src={item.dataUrl} controls className="w-full h-28 rounded-xl bg-black" />
              ) : (
                <img src={item.dataUrl} alt={item.title} className="w-full h-24 object-cover rounded-xl" />
              )}
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-200 truncate">{item.title}</span>
                <button
                  type="button"
                  aria-label={`Delete ${item.title}`}
                  onClick={async () => {
                    await deleteVisitorMediaItem(item.id);
                    reload();
                  }}
                  className="text-slate-400 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const RecorderAppView: React.FC<MediaAiProps> = ({ db }) => {
  const [recordings, setRecordings] = useState<WatchMediaItem[]>([]);
  const [recording, setRecording] = useState(false);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const reload = () => {
    listVisitorMedia(db.visitorId).then((list) =>
      setRecordings(list.filter((i) => i.kind === 'audio'))
    );
  };

  useEffect(() => {
    reload();
  }, [db.visitorId]);

  const toggleRecord = async () => {
    playTapClick(db.settings.muted);
    if (recording) {
      if (mrRef.current && mrRef.current.state !== 'inactive') {
        mrRef.current.stop();
      } else {
        await saveVisitorMediaItem({
          id: `aud-${Date.now().toString(36)}`,
          visitorId: db.visitorId,
          kind: 'audio',
          title: `Voice Note ${new Date().toISOString().slice(11, 16)}`,
          createdAtUtc: new Date().toISOString(),
          dataUrl: '',
          durationSec: 3,
        });
        reload();
      }
      setRecording(false);
      return;
    }

    setRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          await saveVisitorMediaItem({
            id: `aud-${Date.now().toString(36)}`,
            visitorId: db.visitorId,
            kind: 'audio',
            title: `Voice Note ${new Date().toISOString().slice(11, 16)}`,
            createdAtUtc: new Date().toISOString(),
            dataUrl: String(reader.result || ''),
            durationSec: 4,
          });
          reload();
        };
        reader.readAsDataURL(blob);
      };
      mr.start();
      mrRef.current = mr;
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-2.5 text-white">
      <div className="rounded-2xl bg-red-950/75 border border-red-500/40 p-3 text-center space-y-2">
        <button
          type="button"
          onClick={toggleRecord}
          className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center font-bold cursor-pointer ${
            recording ? 'bg-red-500 animate-pulse' : 'bg-red-600 hover:bg-red-500'
          }`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          {recording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>
        <div className="text-xs font-bold">
          {recording ? 'Recording voice...' : 'Tap to Record Voice'}
        </div>
      </div>

      <div className="space-y-1.5">
        {recordings.map((r) => (
          <div key={r.id} className="rounded-xl bg-slate-900 border border-slate-700 p-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-200 truncate">{r.title}</span>
              <button
                type="button"
                aria-label={`Delete ${r.title}`}
                onClick={async () => {
                  await deleteVisitorMediaItem(r.id);
                  reload();
                }}
                className="text-slate-400 hover:text-red-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {r.dataUrl ? (
              <audio controls src={r.dataUrl} className="w-full h-7" />
            ) : (
              <div className="text-[10px] font-bold text-slate-400">Saved voice clip ({r.durationSec}s)</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const AegisAiAppView: React.FC<MediaAiProps> = ({
  db,
  inputs,
  situation,
  onUpdateDb,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});

  const sendQuery = async (customText?: string) => {
    const q = (customText ?? prompt).trim();
    if (!q || loading) return;
    playTapClick(db.settings.muted);
    setPrompt('');

    const userMsg = {
      id: `u-${Date.now().toString(36)}`,
      role: 'user' as const,
      text: q,
      timestampUtc: new Date().toISOString(),
      mode: 'offline-db' as const,
    };
    onUpdateDb((prev) => ({ ...prev, aiHistory: [...prev.aiHistory, userMsg] }));
    setLoading(true);

    const grepped = grepVisitorWatchDb(db, inputs, q, situation);
    let replyText = '';
    let usedOnline = false;

    if (!db.settings.offlineSimulated) {
      try {
        const res = await fetch('/api/aegis-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId: db.visitorId,
            query: q,
            watchDbSnapshot: grepped.snapshot,
            matchedNasaCsaRefs: grepped.matchedNasaCsaRefs,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.reply) {
            replyText = data.reply;
            usedOnline = true;
          }
        }
      } catch {
        // Fallback to local responder
      }
    }

    if (!replyText) {
      replyText = evaluateOfflineAiQuery(q, db, inputs, situation);
    }

    onUpdateDb((prev) => ({
      ...prev,
      aiHistory: [
        ...prev.aiHistory,
        {
          id: `a-${Date.now().toString(36)}`,
          role: 'assistant',
          text: replyText,
          timestampUtc: new Date().toISOString(),
          mode: usedOnline ? 'ai' : 'offline-db',
        },
      ],
    }));
    setLoading(false);
  };

  const hasHistory = db.aiHistory.length > 0;

  const SUGGESTIONS = [
    { icon: Heart, label: 'How is my health today?' },
    { icon: Users, label: 'Check all 10 crewmates' },
    { icon: BookOpen, label: 'Reset my focus in 5 minutes' },
  ];

  return (
    <div className="min-h-[210px] flex flex-col justify-between text-white py-1">
      {!hasHistory ? (
        /* EMPTY STATE (Matches Screenshot 1: "Where should we start?" + Pill Input + Suggestions Below) */
        <div className="flex-1 flex flex-col justify-center space-y-3.5 px-1 pt-2">
          <h3 className="text-center text-base font-bold tracking-tight text-slate-100">
            Where should we start?
          </h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuery();
            }}
            className="flex items-center gap-2 rounded-full bg-[#1E1F23] border border-white/10 px-3 py-2 shadow-md"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Aegis"
              className="flex-1 min-w-0 bg-transparent text-white placeholder-slate-400 text-xs focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send to Aegis"
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              {prompt.trim() ? <Send className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </form>

          <div className="space-y-1.5 pt-1 pl-1">
            {SUGGESTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => sendQuery(item.label)}
                  className="w-full text-left flex items-center gap-2.5 py-1.5 px-2 rounded-xl hover:bg-white/5 text-[11px] font-medium text-slate-200 transition cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* EXPANDED CHAT HISTORY STATE (Matches Screenshot 2) */
        <div className="flex-1 flex flex-col justify-between space-y-2.5">
          <div className="space-y-2.5 max-h-44 overflow-y-auto px-0.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {db.aiHistory.slice(-6).map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-[#1E1F23] border border-white/10 px-3 py-2 text-[11px] text-slate-100 leading-snug">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="space-y-1.5 pr-1">
                  <div className="text-[11px] text-slate-200 leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 pt-0.5">
                    <button
                      type="button"
                      aria-label="Helpful response"
                      onClick={() =>
                        setFeedback((prev) => ({
                          ...prev,
                          [msg.id]: prev[msg.id] === 'up' ? null : 'up',
                        }))
                      }
                      className={`cursor-pointer ${
                        feedback[msg.id] === 'up' ? 'text-emerald-400' : 'hover:text-slate-200'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      aria-label="Needs improvement"
                      onClick={() =>
                        setFeedback((prev) => ({
                          ...prev,
                          [msg.id]: prev[msg.id] === 'down' ? null : 'down',
                        }))
                      }
                      className={`cursor-pointer ${
                        feedback[msg.id] === 'down' ? 'text-rose-400' : 'hover:text-slate-200'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                    {msg.mode === 'offline-db' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Offline AI
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateDb((prev) => ({
                          ...prev,
                          aiHistory: [],
                        }))
                      }
                      aria-label="Reset conversation"
                      className="hover:text-slate-200 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            )}
            {loading && (
              <div className="text-[11px] font-medium text-slate-400 px-1">
                Thinking...
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuery();
            }}
            className="flex items-center gap-2 rounded-full bg-[#1E1F23] border border-white/10 px-3 py-2 shadow-md"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Aegis"
              className="flex-1 min-w-0 bg-transparent text-white placeholder-slate-400 text-xs focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send to Aegis"
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              {prompt.trim() ? <Send className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
