import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Calculator,
  Bell,
  Send,
  Lock,
  BadgeCheck,
  FileSignature,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const ProductDemoVideo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);

  // 18-second video engine state
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(14);

  // Total duration: 18 seconds
  const TOTAL_DURATION = 18;

  // 1. ScrollTrigger Entrance Animation (comes from below smoothly and centers)
  useEffect(() => {
    const player = playerRef.current;
    const container = containerRef.current;
    if (!player || !container) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 80%',
        end: 'top 35%',
        scrub: 0.8,
        onEnter: () => setIsPlaying(true),
        onEnterBack: () => setIsPlaying(true),
      },
    });

    tl.fromTo(
      player,
      {
        y: 100,
        scale: 0.88,
        opacity: 0.4,
        rotateX: 6,
      },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        rotateX: 0,
        ease: 'power2.out',
      }
    );

    return () => {
      tl.kill();
    };
  }, []);

  // 2. Playback ticker (18 second loop)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.05;
        if (next >= TOTAL_DURATION) {
          return 0; // Loop back
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // 3. Step resolution & click triggers
  useEffect(() => {
    // 4 chapters:
    // Ch 1: 0 - 4s (Contract Guard)
    // Ch 2: 4 - 8s (Attendance Punch)
    // Ch 3: 8 - 13s (Rule Execution Engine)
    // Ch 4: 13 - 18s (Payslip Delivery & Notification)
    let currentStep = 0;
    if (progress < 4) currentStep = 0;
    else if (progress < 8) currentStep = 1;
    else if (progress < 13) currentStep = 2;
    else currentStep = 3;

    setStep(currentStep);

    // Trigger click wave at specific timestamps
    const stepStarts = [0, 4, 8, 13];
    const timeInCurrent = progress - stepStarts[currentStep];
    if (timeInCurrent >= 1.4 && timeInCurrent <= 1.7) {
      setIsClicking(true);
    } else {
      setIsClicking(false);
    }

    if (currentStep === 1) {
      setTimerSeconds((prev) => (prev % 60) + 1);
    }
  }, [progress]);

  // Smooth Cursor Coordinates across chapters
  const getCursorPos = () => {
    const stepStarts = [0, 4, 8, 13];
    const stepDurations = [4, 4, 5, 5];
    const timeIn = progress - stepStarts[step];
    const fraction = Math.min(Math.max(timeIn / (stepDurations[step] * 0.65), 0), 1);

    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    const eased = ease(fraction);

    switch (step) {
      case 0: // Contract verify
        return { x: 120 + (240 - 120) * eased, y: 320 + (160 - 320) * eased };
      case 1: // Attendance kiosk punch
        return { x: 240 + (360 - 240) * eased, y: 160 + (220 - 160) * eased };
      case 2: // Compute payrun button
        return { x: 360 + (380 - 360) * eased, y: 220 + (340 - 220) * eased };
      case 3: // Notification bell
        return { x: 380 + (460 - 380) * eased, y: 340 + (48 - 340) * eased };
      default:
        return { x: 200, y: 200 };
    }
  };

  const cursorPos = getCursorPos();

  // Formatting helper for timecode (e.g. 00:08)
  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    return `00:${String(s).padStart(2, '0')}`;
  };

  return (
    <section id="demo-showcase" ref={containerRef} className="w-full py-20 px-4 sm:px-6 lg:px-12 bg-gradient-to-b from-white to-[#F8F9FD] overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Section Headline */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5A5FE8]/10 text-[#5A5FE8] text-xs font-bold tracking-wide mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INTERACTIVE SIMULATION ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            See the Autonomous Engine in Action
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Watch the 18-second simulated pipeline: from contract verification to attendance punch, sequenced formula execution, and instant payslip disbursement.
          </p>
        </div>

        {/* ================= VIDEO PLAYER SHELL ================= */}
        <div
          ref={playerRef}
          className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-[0_25px_60px_-15px_rgba(90,95,232,0.2),0_0_0_1px_rgba(90,95,232,0.06)] overflow-hidden transition-all duration-300"
        >
          {/* Top Browser Window Header */}
          <div className="bg-[#F8F9FD] px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-500 text-xs font-mono">
              <Lock className="w-3 h-3 text-[#5A5FE8]" />
              <span className="text-[11px] font-semibold">app.peoplepay.com/payruns/interactive-demo</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-extrabold uppercase font-mono text-slate-700">
                LIVE 18s ENGINE
              </span>
            </div>
          </div>

          {/* Main Video Screen Viewport */}
          <div className="relative w-full h-[420px] bg-[#F1F4FA] p-4 sm:p-6 overflow-hidden select-none">
            
            {/* Top In-App Bar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#5A5FE8] text-white flex items-center justify-center font-bold text-xs">
                  P
                </div>
                <span className="font-extrabold text-xs text-[#0F172A]">PeoplePay Platform</span>
                <span className="text-[10px] font-mono text-slate-400 ml-1">· Batch #PR-2026-09</span>
              </div>

              <div className="relative">
                <div className={`p-1.5 rounded-full bg-white border border-slate-200 transition-all ${step === 3 ? 'ring-2 ring-[#5A5FE8] bg-indigo-50' : ''}`}>
                  <Bell className="w-4 h-4 text-slate-700" />
                </div>
              </div>
            </div>

            {/* Notification Toast (Pops open on Chapter 4) */}
            <div
              className={`absolute top-14 right-6 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-500/30 shadow-[0_12px_30px_rgba(16,185,129,0.2)] flex items-center gap-3 transition-all duration-500 ${
                step === 3 ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs text-[#0F172A] block leading-tight">Payslip Disbursed &amp; Emailed</strong>
                <span className="text-[10px] text-slate-500">Delivered to amara.chen@peoplepay.com</span>
              </div>
              <Send className="w-4 h-4 text-[#5A5FE8] ml-2" />
            </div>

            {/* Stage Content: Interactive Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              
              {/* Scene 1: Contract Card */}
              <div className={`bg-white rounded-2xl p-4 border transition-all duration-300 ${step === 0 ? 'border-[#5A5FE8] shadow-md ring-2 ring-[#5A5FE8]/20' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <FileSignature className="w-3.5 h-3.5" />
                    Contract Overlap Guard
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px]">
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#5A5FE8]/15 text-[#5A5FE8] font-bold text-xs flex items-center justify-center">
                    AC
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">Amara Chen</div>
                    <div className="text-[10px] text-slate-500">Store Supervisor</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Monthly Wage</span>
                  <strong className="text-[#0F172A] font-mono">$4,500.00</strong>
                </div>

                <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 p-1.5 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Zero-Overlap Validated</span>
                </div>
              </div>

              {/* Scene 2: Attendance Kiosk */}
              <div className={`bg-white rounded-2xl p-4 border transition-all duration-300 ${step === 1 ? 'border-[#5A5FE8] shadow-md ring-2 ring-[#5A5FE8]/20' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <Clock className="w-3.5 h-3.5" />
                    Biometric Punch Kiosk
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-mono">
                    Live Sync
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Check-in Status</span>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    09:00:{String(timerSeconds).padStart(2, '0')} AM
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-[#10B981] h-full transition-all duration-500"
                    style={{ width: step >= 1 ? '98.5%' : '75%' }}
                  ></div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>160.0 Working Hours</span>
                  <span className="font-bold text-[#10B981]">98.5% On-Time</span>
                </div>
              </div>

            </div>

            {/* Scene 3: Sequenced Salary Rule AST */}
            <div className={`bg-white rounded-2xl p-4 border transition-all duration-300 ${step >= 2 ? 'border-[#5A5FE8] shadow-md ring-2 ring-[#5A5FE8]/20' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#5A5FE8]">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Autonomous Salary Rule Sequence</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-[#5A5FE8] font-bold">
                  Rule AST Executed
                </span>
              </div>

              {/* Dynamic Formula Display */}
              <div className="grid grid-cols-4 gap-2 items-center text-center py-2 bg-[#F8F9FD] rounded-xl font-mono text-xs">
                <div>
                  <div className="text-[9px] text-slate-400 font-sans font-bold">BASIC</div>
                  <strong className="text-slate-800">$4,500.00</strong>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-sans font-bold">HRA (10%)</div>
                  <strong className="text-emerald-600">+$450.00</strong>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-sans font-bold">STATUTORY TAX</div>
                  <strong className="text-red-500">-$380.00</strong>
                </div>
                <div className="bg-[#5A5FE8]/10 py-1 rounded-lg border border-[#5A5FE8]/20">
                  <div className="text-[9px] text-[#5A5FE8] font-sans font-bold">NET SALARY</div>
                  <strong className="text-[#5A5FE8] font-black">$4,570.00</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[10px] font-medium text-slate-500">
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  Mathematical Accuracy Verified
                </span>
                <span className="font-mono text-slate-400">SHA-256: 7f8a...9c4b</span>
              </div>
            </div>

            {/* Simulated Animated Cursor */}
            <div
              className="absolute pointer-events-none transition-transform duration-300 z-50"
              style={{
                transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 drop-shadow-md">
                <path
                  d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                  fill="#5A5FE8"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Click Ripple Animation */}
              {isClicking && (
                <span className="absolute -top-2 -left-2 w-10 h-10 rounded-full bg-[#5A5FE8]/40 animate-ping"></span>
              )}
            </div>

          </div>

          {/* ================= VIDEO CONTROLS TIMELINE FOOTER ================= */}
          <div className="bg-white p-4 border-t border-slate-200 flex flex-col gap-3">
            
            {/* Top Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-[#5A5FE8] hover:bg-[#4E53DE] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setProgress(0);
                    setIsPlaying(true);
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Restart"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div className="text-xs font-mono font-bold text-slate-600">
                  <span>{formatTime(progress)}</span>
                  <span className="text-slate-400"> / {formatTime(TOTAL_DURATION)}</span>
                </div>
              </div>

              {/* Interactive Chapter Pills */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 0, label: '1. Contract Guard', time: 0 },
                  { id: 1, label: '2. Attendance Sync', time: 4 },
                  { id: 2, label: '3. Rule AST', time: 8 },
                  { id: 3, label: '4. Payslip Sent', time: 13 },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setProgress(ch.time);
                      setIsPlaying(true);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      step === ch.id
                        ? 'bg-[#5A5FE8] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Scrubber Line */}
            <div
              className="w-full h-1.5 bg-slate-100 hover:h-2.5 rounded-full overflow-hidden cursor-pointer transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newProgress = (clickX / rect.width) * TOTAL_DURATION;
                setProgress(newProgress);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-[#5A5FE8] to-[#06B6D4] transition-all duration-75"
                style={{ width: `${(progress / TOTAL_DURATION) * 100}%` }}
              ></div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
