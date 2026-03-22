"use client";

import { useState, useRef, useEffect } from "react";
import { speak } from "../../lib/api/finances";
import { useApiToken } from "../../lib/hooks/useApiToken";

const SERIF = "Georgia, 'Palatino Linotype', Palatino, serif";

interface Message {
  role: "user" | "assistant";
  text: string;
  hasAudio?: boolean;
  replyText?: string;
}

function playBase64Audio(b64: string) {
  const audio = new Audio(`data:audio/mpeg;base64,${b64}`);
  audio.play().catch(() => {});
  return audio;
}

function speakBrowser(text: string, onEnd: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) { onEnd(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.88;
  utt.pitch = 0.8;
  utt.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const deep = voices.find(v => /male|guy|daniel|david|fred|alex/i.test(v.name));
  if (deep) utt.voice = deep;
  utt.onend = onEnd;
  utt.onerror = onEnd;
  window.speechSynthesis.speak(utt);
}

/* Animated waveform bars shown while speaking */
function Waveform() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 20 }}>
      {[0.6, 1, 0.7, 1, 0.5, 0.9, 0.6].map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: `${h * 100}%`,
            background: "#4ADE80",
            borderRadius: 2,
            animation: `wave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to   { transform: scaleY(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function FinancesChatPage() {
  const token = useApiToken();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Howdy, partner! I'm Frontier Frank, your western financial advisor. Ask me anything about savin', investin', or budgetin' — and I'll holler it back at ya.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [stubMode, setStubMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopVoice = () => {
    audioRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setIsPlaying(false);
  };

  const replayMessage = (text: string) => {
    stopVoice();
    setIsPlaying(true);
    speakBrowser(text, () => setIsPlaying(false));
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await speak(text, token);
      const replyText = res.reply_text || res.message || "…";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: replyText, hasAudio: !!res.audio_b64, replyText },
      ]);

      if (res.stub) setStubMode(true);

      if (!voiceEnabled) return;

      if (res.audio_b64) {
        audioRef.current?.pause();
        setIsPlaying(true);
        const audio = playBase64Audio(res.audio_b64);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
      } else {
        setIsPlaying(true);
        speakBrowser(replyText, () => setIsPlaying(false));
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "1rem" }}>
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6 flex flex-col" style={{ height: "calc(100vh - 80px)" }}>

        {/* ── Header (centered) ── */}
        <div className="text-center mb-4">
          <h1
            className="text-3xl font-bold tracking-wide text-glow"
            style={{ fontFamily: SERIF, color: "#E8C060" }}
          >
            🤠 Frontier Frank
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7A5830" }}>Your western financial advisor</p>
        </div>

        {/* ── Prominent voice badge ── */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => {
              if (isPlaying) { stopVoice(); return; }
              setVoiceEnabled((v) => !v);
            }}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl btn-3d transition-all"
            style={{
              background: isPlaying
                ? "rgba(74,222,128,0.18)"
                : voiceEnabled
                  ? "rgba(146,64,14,0.55)"
                  : "rgba(35,14,2,0.7)",
              border: isPlaying
                ? "1.5px solid rgba(74,222,128,0.7)"
                : voiceEnabled
                  ? "1.5px solid rgba(217,119,6,0.6)"
                  : "1.5px solid rgba(217,119,6,0.2)",
              color: isPlaying ? "#4ADE80" : voiceEnabled ? "#FDE68A" : "#5A3820",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>{isPlaying ? "🔊" : voiceEnabled ? "🔈" : "🔇"}</span>
            <div style={{ textAlign: "left" }}>
              <p className="text-sm font-bold" style={{ fontFamily: SERIF, lineHeight: 1.2 }}>
                {isPlaying ? "Speaking — tap to stop" : voiceEnabled ? "Voice Active" : "Voice Off"}
              </p>
              <p className="text-[10px]" style={{ color: isPlaying ? "#4ADE80" : voiceEnabled ? "#C8A870" : "#5A3820", opacity: 0.85 }}>
                {isPlaying ? "" : voiceEnabled ? (stubMode ? "Browser TTS" : "ElevenLabs ready") : "Tap to enable"}
              </p>
            </div>
            {isPlaying && (
              <div style={{ marginLeft: 4 }}>
                <Waveform />
              </div>
            )}
          </button>
        </div>

        {/* ── Message list ── */}
        <div
          className="flex-1 overflow-y-auto rounded-xl p-4 space-y-3 mb-3"
          style={{ background: "rgba(12,4,0,0.6)", border: "1px solid rgba(217,119,6,0.15)" }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-sm px-4 py-2.5 rounded-xl text-sm ${m.role === "user" ? "ml-auto" : ""}`}
              style={
                m.role === "user"
                  ? { background: "rgba(146,64,14,0.65)", border: "1px solid rgba(217,119,6,0.3)", color: "#FDE68A" }
                  : { background: "rgba(35,14,2,0.8)", border: "1px solid rgba(217,119,6,0.18)", color: "#C8A870" }
              }
            >
              {m.role === "assistant" && (
                <div className="flex items-center justify-between mb-1 gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#E8C060", fontFamily: SERIF }}>
                    🤠 Frontier Frank
                  </p>
                  {/* Per-message replay button */}
                  {voiceEnabled && (
                    <button
                      onClick={() => replayMessage(m.text)}
                      title="Replay voice"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        opacity: 0.65,
                        padding: "0 2px",
                      }}
                    >
                      🔊
                    </button>
                  )}
                </div>
              )}
              {m.text}
            </div>
          ))}
          {loading && (
            <div
              className="max-w-sm px-4 py-2.5 rounded-xl text-sm"
              style={{ background: "rgba(35,14,2,0.8)", border: "1px solid rgba(217,119,6,0.18)", color: "#7A5830" }}
            >
              <span className="animate-pulse">Frank is thinkin'…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input row ── */}
        <div className="flex gap-2">
          <input
            className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
            placeholder="Ask about savings, investing, budgets…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && send()}
            disabled={loading}
            style={{
              background: "rgba(20,8,0,0.7)",
              border: "1px solid rgba(217,119,6,0.25)",
              color: "#F5DEB3",
            }}
          />
          <button
            className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-3d disabled:opacity-40"
            onClick={send}
            disabled={loading || !input.trim()}
            style={{ background: "rgba(146,64,14,0.7)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.35)" }}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
