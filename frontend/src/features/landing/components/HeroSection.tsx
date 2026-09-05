import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Search,
  DollarSign,
  Users,
  Clock,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import gsap from 'gsap';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const card3dRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Smooth 3D mouse tilt parallax on the dashboard card
  useEffect(() => {
    const stage = stageRef.current;
    const card = card3dRef.current;
    if (!stage || !card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Base tilt: rotateY(-13deg), rotateX(9deg)
      const targetRotateY = -13 + (x / rect.width) * 10;
      const targetRotateX = 9 - (y / rect.height) * 8;

      gsap.to(card, {
        rotateY: targetRotateY,
        rotateX: targetRotateX,
        duration: 0.5,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateY: -13,
        rotateX: 9,
        duration: 0.8,
        ease: 'power2.out',
      });
    };

    stage.addEventListener('mousemove', handleMouseMove);
    stage.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      stage.removeEventListener('mousemove', handleMouseMove);
      stage.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const scrollToDemo = () => {
    const demoEl = document.getElementById('demo-showcase');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section className="hero-viewport-section relative w-full min-h-screen flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-12 overflow-hidden bg-gradient-to-b from-[#F8F9FD] via-[#F4F6FC] to-[#EFF2FA]">
      {/* Soft Ambient Radial Lighting Backgrounds */}
      <div className="absolute top-12 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#5A5FE8]/12 to-[#06B6D4]/8 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-gradient-to-tr from-[#3B82F6]/10 to-[#5A5FE8]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(#5A5FE8_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-[0.06] pointer-events-none -z-10"></div>

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10">
        
        {/* ================= LEFT COLUMN: PRODUCT STORY & HIGH-IMPACT COPY ================= */}
        <div className="lg:col-span-6 flex flex-col items-start text-left gap-6">
          
          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#5A5FE8]/20 shadow-[0_4px_14px_rgba(90,95,232,0.1)] hover:border-[#5A5FE8]/40 transition-all cursor-pointer group">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5A5FE8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5A5FE8]"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A5FE8] font-mono">
              NEW
            </span>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
              PeoplePay 2.0 Engine is now live
            </span>
            <ArrowRight className="w-3 h-3 text-[#5A5FE8] group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-[#0F172A] leading-[1.08]">
            The All-in-One <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] via-[#5A5FE8] to-[#06B6D4]">
              Autonomous Payroll
            </span> <br />
            for Modern Teams.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
            PeoplePay reconciles <strong>headcount directories</strong>, <strong>contract overlap guards</strong>, and <strong>biometric attendance</strong> into sequenced, mathematical payslips — completely eliminating manual spreadsheet errors.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#5A5FE8] hover:bg-[#4E53DE] text-white font-bold text-sm shadow-[0_10px_25px_-5px_rgba(90,95,232,0.45)] hover:shadow-[0_14px_30px_-5px_rgba(90,95,232,0.6)] transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={scrollToDemo}
              className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-sm border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-full bg-[#5A5FE8]/10 text-[#5A5FE8] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-3 h-3 fill-[#5A5FE8]" />
              </div>
              <span>Watch Interactive Demo</span>
            </button>
          </div>

          {/* Trust Checkmarks */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-200/80 text-xs font-semibold text-slate-600">
            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Zero calculation errors</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5A5FE8]" />
              <span>Real-time reconciliation</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#06B6D4]" />
              <span>5-Tier RBAC security</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: 3D TILTED EXECUTIVE DASHBOARD SHOWCASE ================= */}
        <div
          ref={stageRef}
          className="lg:col-span-6 relative flex items-center justify-center"
          style={{ perspective: '1400px' }}
        >
          {/* Floating 3D Geometric Crystal Accent (Styled Glass Polygon like Nexora image) */}
          <div className="absolute -top-6 -left-6 z-30 pointer-events-none hidden sm:block animate-float-slow">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 60 60" fill="none" className="w-full h-full drop-shadow-[0_12px_24px_rgba(6,182,212,0.4)]">
                <polygon points="30,4 54,20 30,56 6,20" fill="url(#gemGrad1)" fillOpacity="0.85" />
                <polygon points="30,4 54,20 30,30" fill="url(#gemGrad2)" fillOpacity="0.7" />
                <polygon points="6,20 30,4 30,30" fill="#FFFFFF" fillOpacity="0.35" />
                <defs>
                  <linearGradient id="gemGrad1" x1="6" y1="4" x2="54" y2="56" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                  <linearGradient id="gemGrad2" x1="30" y1="4" x2="54" y2="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#93C5FD" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Secondary Floating Orb */}
          <div className="absolute -bottom-8 -right-4 z-30 pointer-events-none hidden sm:block animate-float-delayed">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#5A5FE8] via-[#818CF8] to-[#06B6D4] p-[1px] shadow-[0_12px_28px_rgba(90,95,232,0.45)]">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-white/40 to-transparent backdrop-blur-md"></div>
            </div>
          </div>

          {/* Floating Live Badge Overlay 1 */}
          <div className="absolute -top-3 right-4 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#5A5FE8]/20 shadow-[0_12px_30px_rgba(90,95,232,0.2)] flex items-center gap-2 animate-bounce-subtle pointer-events-none">
            <div className="w-7 h-7 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold">
              $
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Live Payrun</div>
              <div className="text-xs font-black text-[#0F172A] leading-tight">$999,060 Disbursed</div>
            </div>
          </div>

          {/* Floating Live Badge Overlay 2 */}
          <div className="absolute -bottom-4 left-4 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-500/20 shadow-[0_12px_30px_rgba(16,185,129,0.15)] flex items-center gap-2 pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span className="text-xs font-bold text-[#0F172A]">200 Profiles Reconciled</span>
          </div>

          {/* 3D Tilted Dashboard Frame */}
          <div
            ref={card3dRef}
            className="w-full max-w-[580px] bg-white rounded-[26px] p-4 sm:p-5 border border-white/80 shadow-[0_30px_70px_-15px_rgba(90,95,232,0.22),0_0_0_1px_rgba(90,95,232,0.08),0_15px_30px_-10px_rgba(0,0,0,0.06)] transition-shadow duration-300 select-none overflow-hidden"
            style={{
              transform: 'rotateY(-13deg) rotateX(9deg) rotateZ(1deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Top Navigation Bar in Mockup */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#5A5FE8] flex items-center justify-center text-white font-bold text-[10px]">
                  P
                </div>
                <span className="font-extrabold text-xs text-[#0F172A] tracking-tight">
                  PeoplePay
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#5A5FE8]/10 text-[#5A5FE8] font-mono ml-1">
                  Sep 2026
                </span>
              </div>

              {/* Mock Nav Links */}
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                <span className="px-2 py-1 rounded-md bg-[#5A5FE8] text-white">Dashboard</span>
                <span className="px-2 py-1 hover:text-slate-900">Employees</span>
                <span className="px-2 py-1 hover:text-slate-900">Contracts</span>
                <span className="px-2 py-1 hover:text-slate-900">Payrun</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                  <Search className="w-2.5 h-2.5 text-slate-400" />
                </div>
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#5A5FE8] to-[#06B6D4] text-white font-bold text-[8px] flex items-center justify-center">
                  VP
                </div>
              </div>
            </div>

            {/* Dashboard Subheader */}
            <div className="flex items-center justify-between pt-3 pb-2.5">
              <div>
                <h3 className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1.5">
                  Executive HR &amp; Workforce Dashboard
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-[#5A5FE8] border border-[#5A5FE8]/20">
                    Live Overview
                  </span>
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#5A5FE8] text-white flex items-center gap-1">
                Process Payrun
              </span>
            </div>

            {/* 4 Top KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {/* Total Net Salary */}
              <div className="bg-[#F8F9FD] rounded-xl p-2 border border-slate-100/90">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mb-0.5">
                  <span>Net Salary Fund</span>
                  <DollarSign className="w-2.5 h-2.5 text-[#5A5FE8]" />
                </div>
                <div className="text-xs font-black text-[#0F172A]">$999,060</div>
                <div className="text-[8px] font-semibold text-[#10B981] flex items-center gap-0.5">
                  <span>● Active</span> · 111 payslips
                </div>
              </div>

              {/* Active Workforce */}
              <div className="bg-[#F8F9FD] rounded-xl p-2 border border-slate-100/90">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mb-0.5">
                  <span>Active Workforce</span>
                  <Users className="w-2.5 h-2.5 text-[#06B6D4]" />
                </div>
                <div className="text-xs font-black text-[#0F172A]">200 Staff</div>
                <div className="text-[8px] font-semibold text-[#5A5FE8]">100% Contracted</div>
              </div>

              {/* Attendance Health */}
              <div className="bg-[#F8F9FD] rounded-xl p-2 border border-slate-100/90">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mb-0.5">
                  <span>Attendance</span>
                  <Clock className="w-2.5 h-2.5 text-[#10B981]" />
                </div>
                <div className="text-xs font-black text-[#0F172A]">87.5%</div>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
                  <div className="bg-[#10B981] h-full w-[87.5%]"></div>
                </div>
              </div>

              {/* Approved Leaves */}
              <div className="bg-[#F8F9FD] rounded-xl p-2 border border-slate-100/90">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mb-0.5">
                  <span>Leave Days</span>
                  <Calendar className="w-2.5 h-2.5 text-amber-500" />
                </div>
                <div className="text-xs font-black text-[#0F172A]">10 Days</div>
                <div className="text-[8px] font-semibold text-slate-500">Allocated Paid</div>
              </div>
            </div>

            {/* Middle Visualizations: Fluid Glass Wave Graph & Department Cost Donut */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              
              {/* Fluid Glass Compensation Curve (7 cols) */}
              <div className="sm:col-span-7 bg-[#F8F9FD] rounded-xl p-2.5 border border-slate-100/90 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <div className="text-[10px] font-bold text-[#0F172A]">Monthly Compensation Trend</div>
                    <div className="text-[8px] text-slate-400">Net Payout ($999k) vs Gross Volume</div>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] font-bold">
                    <span className="flex items-center gap-1 text-[#5A5FE8]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5A5FE8]"></span> Net
                    </span>
                    <span className="flex items-center gap-1 text-[#06B6D4]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></span> Gross
                    </span>
                  </div>
                </div>

                {/* SVG Fluid Glass Area Wave */}
                <div className="w-full h-24 relative">
                  <svg viewBox="0 0 240 80" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="miniFluidGlass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5A5FE8" stopOpacity="0.45" />
                        <stop offset="60%" stopColor="#5A5FE8" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#5A5FE8" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="miniGrossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Subtle grid lines */}
                    <line x1="0" y1="20" x2="240" y2="20" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="0" y1="45" x2="240" y2="45" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="0" y1="70" x2="240" y2="70" stroke="#E2E8F0" strokeWidth="0.5" />

                    {/* Gross Reference Curve */}
                    <path
                      d="M0,58 C40,55 80,48 120,42 C160,36 200,24 240,16 L240,70 L0,70 Z"
                      fill="url(#miniGrossGrad)"
                    />
                    <path
                      d="M0,58 C40,55 80,48 120,42 C160,36 200,24 240,16"
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />

                    {/* Fluid Glass Net Payout Area */}
                    <path
                      d="M0,64 C40,61 80,55 120,49 C160,44 200,32 240,24 L240,70 L0,70 Z"
                      fill="url(#miniFluidGlass)"
                    />
                    <path
                      d="M0,64 C40,61 80,55 120,49 C160,44 200,32 240,24"
                      fill="none"
                      stroke="#5A5FE8"
                      strokeWidth="2"
                    />

                    {/* Current Month Active Dot */}
                    <circle cx="200" cy="32" r="3" fill="#FFFFFF" stroke="#5A5FE8" strokeWidth="1.5" />
                  </svg>
                </div>

                <div className="flex justify-between text-[8px] font-mono text-slate-400 pt-1">
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span className="font-bold text-[#5A5FE8]">Sep 26</span>
                  <span>Oct</span>
                </div>
              </div>

              {/* Department Cost Split Donut (5 cols) */}
              <div className="sm:col-span-5 bg-[#F8F9FD] rounded-xl p-2.5 border border-slate-100/90 flex flex-col justify-between">
                <div className="text-[10px] font-bold text-[#0F172A] mb-1">Cost by Department</div>
                
                <div className="flex items-center gap-2">
                  {/* Donut SVG */}
                  <div className="w-14 h-14 relative shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
                      {/* Engineering 23% */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#5A5FE8" strokeWidth="4.5" strokeDasharray="20 80" strokeDashoffset="0" />
                      {/* HR 22% */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#06B6D4" strokeWidth="4.5" strokeDasharray="19 81" strokeDashoffset="-20" />
                      {/* Sales 18% */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="4.5" strokeDasharray="16 84" strokeDashoffset="-39" />
                      {/* Finance 15% */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#F59E0B" strokeWidth="4.5" strokeDasharray="13 87" strokeDashoffset="-55" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                      <span className="text-[7px] text-slate-400 font-bold">TOTAL</span>
                      <span className="text-[8px] font-extrabold text-[#0F172A]">$1.17M</span>
                    </div>
                  </div>

                  {/* Micro Legend */}
                  <div className="flex flex-col gap-1 text-[8px] font-medium text-slate-600">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5A5FE8]"></span>
                      <span>Eng $269k</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></span>
                      <span>HR $256k</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                      <span>Sales $213k</span>
                    </div>
                  </div>
                </div>

                <div className="text-[8px] text-slate-400 pt-1 border-t border-slate-200/60 flex justify-between">
                  <span>108 active payslips</span>
                  <span className="font-bold text-[#10B981]">Balanced</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
