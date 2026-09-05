import React, { useState, useEffect } from 'react';
import {
  Calculator,
  CalendarDays,
  ShieldCheck,
  Lock,
  BarChart3,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  FileSignature,
  FileText,
  Users,
  Send,
  Sliders,
  DollarSign,
  TrendingUp,
  Download,
  Mail,
  Check,
  Zap,
} from 'lucide-react';

export const FeatureGridSection: React.FC = () => {
  // Interactive Rule Simulator state in Bento Card 1
  const [activeRuleTab, setActiveRuleTab] = useState<'hra' | 'pf' | 'bonus' | 'tax'>('hra');
  const [baseWage, setBaseWage] = useState<number>(4500);
  const [ratePercent, setRatePercent] = useState<number>(10);

  // Update default rate when tab switches
  const handleTabChange = (tab: 'hra' | 'pf' | 'bonus' | 'tax') => {
    setActiveRuleTab(tab);
    if (tab === 'hra') setRatePercent(10);
    else if (tab === 'pf') setRatePercent(12);
    else if (tab === 'bonus') setRatePercent(8);
    else if (tab === 'tax') setRatePercent(8.4);
  };

  // Compute live result
  const computedAmount =
    activeRuleTab === 'bonus'
      ? 500
      : Math.round((baseWage * (ratePercent / 100)) * 100) / 100;

  // Interactive role selector in Bento Card 4 (supports all 5 roles)
  const [selectedRole, setSelectedRole] = useState<'employee' | 'hr' | 'payroll_user' | 'payroll_manager' | 'admin'>('payroll_manager');

  // Real-time ticking attendance timer in Bento Card 2
  const [liveSeconds, setLiveSeconds] = useState<number>(37);
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSeconds((prev) => (prev + 1) % 60);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="features" className="w-full py-24 px-4 sm:px-6 lg:px-12 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-[#5A5FE8]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#06B6D4]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5A5FE8]/10 text-[#5A5FE8] text-xs font-extrabold tracking-wide font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>PLATFORM ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
            Engineered for Precision. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5A5FE8] via-[#4F46E5] to-[#06B6D4]">
              Connected Across Every Stage of Payroll.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl">
            From contract guardrails and biometric attendance to Pythonic salary AST rules and instant payslip disbursement — built into one seamless pipeline.
          </p>
        </div>

        {/* ================= ZERO-GAP BENTO GRID (3 COLUMNS) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* ================= ROW 1, CARD 1 (2 COLS WIDE): DYNAMIC SALARY RULES AST SIMULATOR ================= */}
          <div className="lg:col-span-2 bg-[#F8F9FD] rounded-3xl p-6 sm:p-8 border border-slate-200/90 hover:border-[#5A5FE8]/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#5A5FE8]/15 text-[#5A5FE8] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                      Deterministic Salary Rule AST
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Odoo-Standard Pythonic Abstract Syntax Tree</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-extrabold uppercase px-3 py-1 rounded-full bg-white border border-[#5A5FE8]/25 text-[#5A5FE8] shadow-xs">
                  ⚡ 0.04ms Execution
                </span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Define dynamic salary rules executed in strict dependency sequence. Evaluate formulas against contract wages, working hours, and tax brackets with zero manual guesswork.
              </p>

              {/* Interactive Rule Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { id: 'hra', label: 'House Rent Allowance (10%)', type: 'Credit' },
                  { id: 'pf', label: 'Provident Fund (12%)', type: 'Deduct' },
                  { id: 'bonus', label: 'Performance Bonus (Fixed)', type: 'Credit' },
                  { id: 'tax', label: 'Statutory Tax (8.4%)', type: 'Deduct' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      activeRuleTab === tab.id
                        ? 'bg-[#5A5FE8] text-white shadow-sm scale-102'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Live Formula Calculator & High-Contrast Code Sandbox */}
            <div className="bg-[#0F172A] rounded-2xl p-5 border border-slate-800 shadow-lg text-white font-mono text-xs flex flex-col gap-4">
              
              {/* Formula Bar with Interactive Glowing Chips */}
              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Formula:</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#5A5FE8]/30 border border-[#5A5FE8]/50 text-indigo-300 font-bold">
                    contract.wage (${baseWage.toLocaleString()})
                  </span>
                  <span className="text-amber-400 font-black">×</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                    rate ({ratePercent}%)
                  </span>
                  <span className="text-slate-400 font-black">=</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Result:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 font-black text-sm">
                    {activeRuleTab === 'pf' || activeRuleTab === 'tax' ? '-' : '+'}${computedAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Code Snippet with Crystal-Clear High-Contrast Vivid Syntax Tokens */}
              <div className="space-y-1.5 text-xs leading-relaxed text-slate-200 pl-1">
                <div>
                  <span className="text-[#A78BFA] font-bold">def</span>{' '}
                  <span className="text-[#38BDF8] font-bold">compute_{activeRuleTab}_rule</span>
                  <span className="text-white">(contract, payslip):</span>
                </div>
                <div className="pl-4 text-slate-400">
                  # Deterministic AST Sequence #{activeRuleTab === 'hra' ? '1' : activeRuleTab === 'pf' ? '2' : '3'}
                </div>
                <div className="pl-4">
                  <span className="text-[#38BDF8]">base_wage</span>{' '}
                  <span className="text-white">=</span>{' '}
                  <span className="text-white">contract.wage</span>{' '}
                  <span className="text-slate-400"># ${baseWage}.00</span>
                </div>
                <div className="pl-4">
                  <span className="text-[#38BDF8]">rate</span>{' '}
                  <span className="text-white">=</span>{' '}
                  <span className="text-[#FBBF24] font-bold">{(ratePercent / 100).toFixed(2)}</span>
                </div>
                <div className="pl-4">
                  <span className="text-[#A78BFA] font-bold">return</span>{' '}
                  <span className="text-white">base_wage * rate</span>
                </div>
              </div>

              {/* Interactive Rate Slider */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-slate-400 flex items-center gap-1 font-sans">
                    <Sliders className="w-3.5 h-3.5 text-[#5A5FE8]" /> Adjust Rate:
                  </span>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="1"
                    value={ratePercent}
                    onChange={(e) => setRatePercent(Number(e.target.value))}
                    className="w-36 accent-[#5A5FE8] cursor-pointer"
                  />
                  <span className="font-bold text-white font-mono">{ratePercent}%</span>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-sans font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Rule Verified &amp; Stamped</span>
                </div>
              </div>

            </div>
          </div>

          {/* ================= ROW 1, CARD 2 (1 COL): BIOMETRIC ATTENDANCE & PRORATION ================= */}
          <div className="bg-[#F8F9FD] rounded-3xl p-6 sm:p-8 border border-slate-200/90 hover:border-amber-400/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Live Presence
                </span>
              </div>

              <h3 className="text-xl font-black text-[#0F172A] mb-2 tracking-tight">
                Biometric Attendance Kiosk
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tracks time logs in real time. Prorates base wages automatically for late check-ins and unapproved absences with supervisor audit trail.
              </p>
            </div>

            {/* Live Attendance Clock & Health Widget */}
            <div className="mt-6 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 font-sans">Kiosk Terminal Clock</span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-black text-[#0F172A]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  09:00:{String(liveSeconds).padStart(2, '0')} AM
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#10B981] h-full w-[87.5%] transition-all duration-500"></div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-100">
                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="text-[10px] text-slate-400 font-bold uppercase font-mono">Working Hours</div>
                  <div className="text-xs font-black text-[#0F172A] mt-0.5">160.0 hrs</div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50">
                  <div className="text-[10px] text-emerald-700 font-bold uppercase font-mono">On-Time Ratio</div>
                  <div className="text-xs font-black text-emerald-700 mt-0.5">87.5%</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>0 Unreconciled Exceptions</span>
                <span className="font-bold text-[#10B981]">Auto-Prorated</span>
              </div>
            </div>
          </div>

          {/* ================= ROW 2, CARD 3 (1 COL): ZERO-OVERLAP CONTRACT GUARD ================= */}
          <div className="bg-[#F8F9FD] rounded-3xl p-6 sm:p-8 border border-slate-200/90 hover:border-blue-400/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <FileSignature className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Concurrency Lock
                </span>
              </div>

              <h3 className="text-xl font-black text-[#0F172A] mb-2 tracking-tight">
                Contract Overlap Guard
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Prevents conflicting active wage agreements. Mid-month promotions terminate prior contracts automatically to preserve payroll integrity.
              </p>
            </div>

            {/* Visual Contract Progression Bar */}
            <div className="mt-6 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col gap-2.5">
              <span className="text-[11px] font-extrabold text-slate-500 font-mono uppercase">
                Contract Progression
              </span>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 text-slate-600">
                  <span>Contract #1 (Sales Assoc)</span>
                  <span className="text-slate-400 font-bold">CLOSED</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  <span>Contract #2 (Store Supv)</span>
                  <span className="text-[#10B981]">ACTIVE</span>
                </div>
              </div>

              <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5 pt-2 border-t border-slate-100">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>Zero Overlap Confirmed</span>
              </div>
            </div>
          </div>

          {/* ================= ROW 2, CARD 4 (1 COL): 5-TIER STRICT RBAC ================= */}
          <div className="bg-[#F8F9FD] rounded-3xl p-6 sm:p-8 border border-slate-200/90 hover:border-[#5A5FE8]/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-[#5A5FE8]/15 text-[#5A5FE8] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full bg-indigo-50 text-[#5A5FE8] border border-[#5A5FE8]/25">
                  Strict Matrix
                </span>
              </div>

              <h3 className="text-xl font-black text-[#0F172A] mb-2 tracking-tight">
                5-Tier RBAC Guard
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Permissions are strictly enforced at the database query layer. Hover over a role below to test live authority boundaries.
              </p>
            </div>

            {/* Interactive Role Switcher with Hover Support */}
            <div className="mt-6 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'employee', label: 'Employee' },
                  { id: 'hr', label: 'HR Mgr' },
                  { id: 'payroll_user', label: 'Payroll User' },
                  { id: 'payroll_manager', label: 'Payroll Mgr' },
                  { id: 'admin', label: 'Admin' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onMouseEnter={() => setSelectedRole(r.id as any)}
                    onClick={() => setSelectedRole(r.id as any)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase font-mono transition-all cursor-pointer ${
                      selectedRole === r.id
                        ? 'bg-[#5A5FE8] text-white shadow-xs scale-102'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-600 space-y-1.5 pt-2 border-t border-slate-100 min-h-[44px]">
                {selectedRole === 'employee' && (
                  <div className="text-slate-600 font-medium">✓ Own Attendance &amp; Leaves · ✕ Payroll Denied (403)</div>
                )}
                {selectedRole === 'hr' && (
                  <div className="text-slate-600 font-medium">✓ Full People CRUD · ✕ Salary Rules Denied (403)</div>
                )}
                {selectedRole === 'payroll_user' && (
                  <div className="text-blue-700 font-medium">✓ Execute Payruns &amp; Print Payslips · ✕ Rule Modification Denied</div>
                )}
                {selectedRole === 'payroll_manager' && (
                  <div className="text-emerald-700 font-semibold">✓ Full Rule Engine, Formula AST &amp; Batch Payruns</div>
                )}
                {selectedRole === 'admin' && (
                  <div className="text-[#5A5FE8] font-bold">✓ Full Root Authority, User Roles &amp; Cloud DB Access</div>
                )}
              </div>
            </div>
          </div>

          {/* ================= ROW 2, CARD 5 (1 COL): INSTANT PDF PAYSLIPS & EMAIL ================= */}
          <div className="bg-[#F8F9FD] rounded-3xl p-6 sm:p-8 border border-slate-200/90 hover:border-emerald-400/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Vector Output
                </span>
              </div>

              <h3 className="text-xl font-black text-[#0F172A] mb-2 tracking-tight">
                Instant PDF &amp; Email Dispatch
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Generate high-resolution vector payslips in 1 click. Dispatches batch PDF statements to all 200 staff via automated email queues.
              </p>
            </div>

            {/* Payslip Dispatch Badge Box */}
            <div className="mt-6 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#5A5FE8]" />
                  <span>Batch Dispatch Status</span>
                </span>
                <span className="text-[#10B981] font-mono">111 / 111 Sent</span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-600">payslip_sep_2026.pdf</span>
                <span className="text-slate-400">148 KB</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="font-mono">SHA-256 Validated</span>
                <span className="font-bold text-[#10B981]">Cryptographically Sealed</span>
              </div>
            </div>
          </div>

          {/* ================= ROW 3, CARD 6 (2 COLS WIDE): EXECUTIVE COMPENSATION VELOCITY ================= */}
          <div className="lg:col-span-2 bg-[#F8F9FD] rounded-3xl p-6 sm:p-8 border border-slate-200/90 hover:border-[#5A5FE8]/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#5A5FE8]/15 text-[#5A5FE8] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                      Compensation Velocity &amp; Fluid Glass Wave
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Historical &amp; Projected Payroll Trajectory (May – Oct 2026)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold font-mono">
                  <span className="flex items-center gap-1.5 text-[#5A5FE8]">
                    <span className="w-2 h-2 rounded-full bg-[#5A5FE8]"></span>
                    Net Payout ($999k)
                  </span>
                  <span className="flex items-center gap-1.5 text-[#06B6D4]">
                    <span className="w-2 h-2 rounded-full bg-[#06B6D4]"></span>
                    Gross ($1.18M)
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Monitor continuous payroll velocity across closed and active cycles. Smooth cubic monotone curves visualize seasonal spikes, statutory withholding ratios, and cashflow requirements.
              </p>
            </div>

            {/* Fluid Glass SVG Area Wave */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="w-full h-28 relative">
                <svg viewBox="0 0 400 90" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="bentoFluidGlass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5A5FE8" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#5A5FE8" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#5A5FE8" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="bentoGrossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="400" y2="20" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="400" y2="80" stroke="#E2E8F0" strokeWidth="1" />

                  {/* Gross Curve */}
                  <path
                    d="M0,68 C70,64 140,56 210,48 C280,40 340,24 400,16 L400,80 L0,80 Z"
                    fill="url(#bentoGrossGrad)"
                  />
                  <path
                    d="M0,68 C70,64 140,56 210,48 C280,40 340,24 400,16"
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                  />

                  {/* Fluid Glass Net Curve */}
                  <path
                    d="M0,74 C70,70 140,62 210,54 C280,48 340,32 400,24 L400,80 L0,80 Z"
                    fill="url(#bentoFluidGlass)"
                  />
                  <path
                    d="M0,74 C70,70 140,62 210,54 C280,48 340,32 400,24"
                    fill="none"
                    stroke="#5A5FE8"
                    strokeWidth="2.5"
                  />

                  {/* Active Month Focal Points */}
                  <circle cx="280" cy="48" r="4.5" fill="#FFFFFF" stroke="#5A5FE8" strokeWidth="2.5" />
                  <circle cx="400" cy="24" r="4" fill="#5A5FE8" />
                </svg>
              </div>

              <div className="flex justify-between text-[11px] font-mono font-bold text-slate-400 pt-1 border-t border-slate-100">
                <span>May ($810k)</span>
                <span>Jun ($865k)</span>
                <span>Jul ($915k)</span>
                <span>Aug ($950k)</span>
                <span className="text-[#5A5FE8] font-black">Sep ($999k)</span>
                <span>Oct Proj ($1.15M)</span>
              </div>
            </div>
          </div>

          {/* ================= ROW 3, CARD 7 (1 COL): DEPARTMENT COST SPLIT DONUT ================= */}
          <div className="bg-[#F8F9FD] rounded-3xl p-6 sm:p-8 border border-slate-200/90 hover:border-[#06B6D4]/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                  Budget Allocation
                </span>
              </div>

              <h3 className="text-xl font-black text-[#0F172A] mb-2 tracking-tight">
                Department Cost Split
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Breakdown of active payroll distribution across workforce teams totaling $1.17M gross disbursal.
              </p>
            </div>

            {/* Donut & Legend Widget */}
            <div className="mt-6 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#5A5FE8" strokeWidth="4.5" strokeDasharray="23 77" strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#06B6D4" strokeWidth="4.5" strokeDasharray="22 78" strokeDashoffset="-23" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="4.5" strokeDasharray="18 82" strokeDashoffset="-45" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#F59E0B" strokeWidth="4.5" strokeDasharray="15 85" strokeDashoffset="-63" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="text-[7px] text-slate-400 font-bold">TOTAL</span>
                    <span className="text-[9px] font-black text-[#0F172A]">$1.17M</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-[11px] font-medium text-slate-600 w-full">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#5A5FE8]"></span> Engineering</span>
                    <span className="font-mono font-bold text-slate-800">$269k</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#06B6D4]"></span> Human Res</span>
                    <span className="font-mono font-bold text-slate-800">$256k</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span> Sales Ops</span>
                    <span className="font-mono font-bold text-slate-800">$213k</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between font-mono">
                <span>108 Active Contracts</span>
                <span className="font-bold text-[#10B981]">Fully Reconciled</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
