"use client";

import { useEffect, useRef, useState } from "react";
import useIsMobile from "@/hooks/use-is-mobile";
import { SPLASH_MESSAGES } from "@/lib/splash-messages";

const STORAGE_KEY = "myclass_splash_date";

function todayVNKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

const EMOJIS = ["🌸", "💖", "✨", "🌷", "🍀", "🌺", "💐", "⭐", "🌟", "💕"];

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  emoji: EMOJIS[i % EMOJIS.length],
  left: `${5 + ((i * 537) % 85)}%`,
  fontSize: `${16 + (i * 3) % 14}px`,
  duration: `${6 + (i * 7) % 6}s`,
  delay: `${((i * 4) % 40) / 10}s`,
}));

export default function DailySplash() {
  const [show, setShow] = useState<boolean | null>(null);
  const [exiting, setExiting] = useState(false);
  const [typed, setTyped] = useState("");
  const [buttonVisible, setButtonVisible] = useState(false);
  const messageRef = useRef("");
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // SSR guard + daily check
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === todayVNKey()) {
        setShow(false);
        return;
      }
      messageRef.current =
        SPLASH_MESSAGES[Math.floor(Math.random() * SPLASH_MESSAGES.length)];
      setShow(true);
    } catch {
      setShow(false);
    }
  }, []);

  // Typewriter
  useEffect(() => {
    if (!show) return;
    const chars = [...messageRef.current];
    let i = 0;
    let ticker: ReturnType<typeof setTimeout>;

    const startTimeout = setTimeout(() => {
      const tick = () => {
        if (i >= chars.length) {
          setTimeout(() => setButtonVisible(true), 300);
          return;
        }
        setTyped(chars.slice(0, i + 1).join(""));
        i++;
        ticker = setTimeout(tick, 35);
      };
      tick();
    }, 400);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(ticker);
    };
  }, [show]);

  // 3D tilt — desktop mouse
  useEffect(() => {
    if (!show || isMobile) return;
    const onMouseMove = (e: MouseEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const rx =
        ((e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) * -12;
      const ry =
        ((e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)) * 12;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [show, isMobile]);

  // 3D tilt — mobile gyroscope (breathing CSS is fallback; gyro disables it on first event)
  useEffect(() => {
    if (!show || !isMobile) return;
    const onOrientation = (e: DeviceOrientationEvent) => {
      const card = cardRef.current;
      if (!card || e.beta === null || e.gamma === null) return;
      if (card.style.animationName !== "none") {
        card.style.animation = "none";
      }
      const rx = Math.max(-12, Math.min(12, (e.beta - 45) / 4));
      const ry = Math.max(-12, Math.min(12, e.gamma / 4));
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [show, isMobile]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, todayVNKey());
    } catch {}
    setExiting(true);
    setTimeout(() => setShow(false), 400);
  };

  if (show === null || !show) return null;

  const bgUrl = isMobile ? "/bg-mobile.png" : "/bg-main.png";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: `url('${bgUrl}') center/cover fixed no-repeat`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: exiting
          ? "splashExit 0.4s ease-in forwards"
          : "splashEnter 0.5s ease-out forwards",
      }}
    >
      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          aria-hidden
          style={{
            position: "absolute",
            left: p.left,
            bottom: "-40px",
            fontSize: p.fontSize,
            animation: `floatUp ${p.duration} ${p.delay} ease-in infinite`,
            pointerEvents: "none",
            userSelect: "none",
            lineHeight: 1,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* 3D card */}
      <div
        ref={cardRef}
        style={{
          position: "relative",
          maxWidth: "520px",
          width: "calc(100% - 48px)",
          padding: "32px",
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: "24px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          animation: isMobile ? "breathe 3s ease-in-out infinite" : undefined,
          transition: "transform 0.1s ease-out",
          maxHeight: "70dvh",
          overflowY: "auto",
        }}
      >
        {/* Shimmer overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "24px",
            background:
              "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 3s linear infinite",
            pointerEvents: "none",
          }}
        />

        {/* Message text */}
        <p
          style={{
            fontSize: isMobile ? "18px" : "22px",
            fontWeight: 600,
            color: "white",
            textShadow: "0 1px 8px rgba(0,0,0,0.3)",
            textAlign: "center",
            lineHeight: 1.6,
            margin: 0,
            minHeight: "2em",
            position: "relative",
            zIndex: 1,
          }}
        >
          {typed}
          {!buttonVisible && (
            <span
              aria-hidden
              style={{ opacity: 0.7, animation: "blink 0.8s step-end infinite" }}
            >
              |
            </span>
          )}
        </p>

        {/* Dismiss button */}
        {buttonVisible && (
          <div
            style={{
              textAlign: "center",
              marginTop: "28px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <button
              onClick={dismiss}
              style={{
                background: "#E8788A",
                color: "white",
                border: "none",
                borderRadius: "50px",
                padding: "12px 32px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(232,120,138,0.4)",
                animation: "fadeInBtn 0.6s ease-out forwards",
              }}
            >
              Bắt đầu ngày mới 🌸
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes splashEnter {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashExit {
          from { opacity: 1; }
          to   { opacity: 0; transform: scale(1.03); }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0) rotate(0deg);    opacity: 0.9; }
          80%  { opacity: 0.5; }
          100% { transform: translateY(-110vh) rotate(20deg); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes breathe {
          0%, 100% { transform: perspective(800px) scale(1);     }
          50%       { transform: perspective(800px) scale(1.015); }
        }
        @keyframes fadeInBtn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 0;   }
        }
      `}</style>
    </div>
  );
}
