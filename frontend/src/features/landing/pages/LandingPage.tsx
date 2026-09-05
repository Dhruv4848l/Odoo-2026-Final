import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  Users,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  BarChart3,
  Award,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Employee Hub & Navigation',
      description: 'Centralized headcount directory with Kanban, List, and Form views. Instant smart-button links to Contracts, Attendance, and Time Off.',
      squad: 'Dev A Core HR',
    },
    {
      icon: FileText,
      title: 'Contract Management & Overlap Guard',
      description: 'Historical contract tracking with period-active wage resolution and automated blocking of overlapping active contracts.',
      squad: 'Dev A Core HR',
    },
    {
      icon: Calendar,
      title: 'Working Schedule Builder',
      description: 'Custom weekly pattern grid (Mon–Sun) with auto-calculated total weekly hours, assignable to employees or contract overrides.',
      squad: 'Dev A Core HR',
    },
    {
      icon: Clock,
      title: 'Attendance & Presence Widget',
      description: 'Floating check-in/check-out popup with running totals, missing checkout flags, and manual correction audit trails.',
      squad: 'Dev B Time & Presence',
    },
    {
      icon: DollarSign,
      title: 'Sequenced Payroll Engine',
      description: '2-step Payrun wizard with fixed, percentage, and formula rules, proration, PF caps, PDF generation, and bulk emailing.',
      squad: 'Dev C Payroll Engine',
    },
    {
      icon: LayoutDashboard,
      title: 'Live Analytics Dashboard',
      description: 'Real-time KPIs, salary cost charts, attendance breakdown, and proactive system warning alerts.',
      squad: 'Dev D Platform',
    },
  ];

  const roles = [
    { name: 'Employee', desc: 'Own profile, attendance & leave balance view only' },
    { name: 'HR Manager', desc: 'Full HR access; blocked from Payroll screens' },
    { name: 'HR Payroll User', desc: 'HR access + Payruns view & process; read-only rules' },
    { name: 'HR Payroll Manager', desc: 'Full HR & Payroll access including Salary Rules' },
    { name: 'Admin', desc: 'Full system access including User & Role Management' },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex flex-col selection:bg-primary-light selection:text-primary">
      {/* Top Utility Nav */}
      <header className="h-[64px] bg-navy text-white px-6 md:px-12 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-xl text-white shadow-sm ring-2 ring-primary/40">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-wide text-white">PeoplePay360</span>
            <span className="text-[10px] text-gray-400 font-medium">HR & Payroll Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-semibold text-gray-300 hover:text-white transition-colors hidden sm:block"
          >
            Sign In
          </button>
          <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
            Launch Platform
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-navy via-navy/95 to-canvas text-white pt-16 pb-24 px-6 md:px-12 text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-primary-light text-xs font-semibold backdrop-blur-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary-light" />
            <span>Odoo 2026 Hackathon Finalist Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Reconcile Headcount, Contracts & Payroll in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary">One Flow</span>
          </h1>

          <p className="text-base md:text-lg text-gray-300 max-w-2xl font-normal leading-relaxed">
            Every employee, contract, schedule, attendance log, and salary rule reconciles seamlessly into one verified payslip. Built with strict role-based access and zero-conflict modular architecture.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Button variant="primary" size="lg" onClick={() => navigate('/login')} className="w-full sm:w-auto shadow-lg">
              Get Started Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Lock className="w-4 h-4 mr-2 text-primary-light" />
              Demo Role Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* KPI Highlight Strip */}
      <section className="-mt-10 px-6 md:px-12 max-w-6xl mx-auto w-full z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="kpi" className="bg-white border border-border shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate uppercase">Accuracy</span>
              <ShieldCheck className="w-4 h-4 text-success" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-ink">100%</span>
            <span className="text-xs text-slate mt-1 block">Rule Reconciliation</span>
          </Card>

          <Card variant="kpi" className="bg-white border border-border shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate uppercase">Security</span>
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-ink">5 Roles</span>
            <span className="text-xs text-slate mt-1 block">Enforced RBAC Matrix</span>
          </Card>

          <Card variant="kpi" className="bg-white border border-border shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate uppercase">Database</span>
              <Zap className="w-4 h-4 text-warning" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-ink">Supabase</span>
            <span className="text-xs text-slate mt-1 block">Shared Postgres DB</span>
          </Card>

          <Card variant="kpi" className="bg-white border border-border shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate uppercase">Architecture</span>
              <BarChart3 className="w-4 h-4 text-info" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-ink">4 Squads</span>
            <span className="text-xs text-slate mt-1 block">Parallel Conflict-Free</span>
          </Card>
        </div>
      </section>

      {/* Feature Modules Grid */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge status="info">Connected Operations</Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-ink mt-3">Integrated HR & Payroll Stack</h2>
          <p className="text-sm md:text-base text-slate mt-2">
            Designed from the ground up around the Employee hub to keep the HR data chain connected end-to-end.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const IconComponent = f.icon;
            return (
              <Card key={idx} className="flex flex-col gap-4 p-6 hover:border-primary transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold shadow-xs">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate uppercase tracking-wider bg-canvas px-2.5 py-1 rounded-full border border-border">
                    {f.squad}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-bold text-ink">{f.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{f.description}</p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center text-xs font-semibold text-primary">
                  <span>Explore Feature</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Role-Based Access Control Showcase */}
      <section className="py-16 bg-white border-y border-border px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex flex-col gap-4">
            <Badge status="approved">Security & RBAC</Badge>
            <h2 className="text-3xl font-extrabold text-ink">5-Tier Role Enforcement</h2>
            <p className="text-sm text-slate leading-relaxed">
              Permissions are strictly enforced at the API/query layer — an HR Manager is blocked from Payroll screens even by direct URL, and plain Employees only see their own profile and attendance logs.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              {roles.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-canvas border border-border/80 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span className="font-bold text-ink shrink-0 w-36">{r.name}</span>
                  <span className="text-slate">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <Card variant="gradient" className="flex-1 max-w-md w-full flex flex-col gap-6 text-white p-8">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-primary-light" />
              <div>
                <h3 className="text-xl font-bold">Amara Chen Scenario</h3>
                <span className="text-xs text-primary-light font-medium">Demo Validation Workflow</span>
              </div>
            </div>
            <p className="text-xs text-gray-200 leading-relaxed">
              Experience the complete employee lifecycle: Jan 15 Hire → Jun 1 Store Supervisor Promotion → Sep Parental Leave → Prorated Payrun → Nov 20 Resignation with exact numbers.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/login')}
              className="bg-white text-primary hover:bg-gray-100 font-bold shadow-md"
            >
              Sign In to Run Scenario
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-gray-400 py-8 px-6 md:px-12 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xs">
            P
          </div>
          <span className="text-white font-semibold">PeoplePay360</span>
          <span>© 2026 HR & Payroll Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">
            Login
          </button>
          <button onClick={() => navigate('/employees')} className="hover:text-white transition-colors">
            Employees
          </button>
          <button onClick={() => navigate('/contracts')} className="hover:text-white transition-colors">
            Contracts
          </button>
        </div>
      </footer>
    </div>
  );
};
