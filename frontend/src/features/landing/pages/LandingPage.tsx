import React, { useState } from 'react';
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
  ChevronRight,
  Eye,
  Check,
  X,
  AlertTriangle,
  Plus,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'hr_manager' | 'hr_payroll_manager' | 'employee'>('admin');
  const [activeTab, setActiveTab] = useState<'kanban' | 'overlap' | 'schedule' | 'amara'>('kanban');

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

  const roleSpecs = {
    admin: {
      name: 'System Admin',
      badge: 'Full Access',
      badgeStatus: 'active' as const,
      email: 'admin@peoplepay360.com',
      rights: ['Full HR Access', 'Full Payroll Access', 'User & Role Management', 'System Analytics'],
      denied: [],
    },
    hr_manager: {
      name: 'HR Manager',
      badge: 'HR Modules Only',
      badgeStatus: 'info' as const,
      email: 'hr.manager@peoplepay360.com',
      rights: ['Full Employee Directory', 'Contract Management', 'Time Off Approval', 'Attendance Tracking'],
      denied: ['Payroll Screens (403 Blocked)', 'Salary Rules Setup'],
    },
    hr_payroll_manager: {
      name: 'HR Payroll Manager',
      badge: 'HR + Payroll Full',
      badgeStatus: 'active' as const,
      email: 'payroll@peoplepay360.com',
      rights: ['Full HR Access', 'Payrun Processing', 'Salary Structures & Rules', 'PDF Payslips & Bulk Email'],
      denied: ['User Role Administration'],
    },
    employee: {
      name: 'Amara Chen (Employee)',
      badge: 'Own Profile Scoped',
      badgeStatus: 'warning' as const,
      email: 'amara.chen@peoplepay360.com',
      rights: ['View Own Profile', 'Check-In / Out Attendance', 'Submit Leave Requests'],
      denied: ['Create New Employee', 'Create Contract', 'View Other Employees', 'Payroll Access'],
    },
  };

  const amaraTimeline = [
    { date: 'Jan 15, 2026', title: 'Initial Hire', desc: 'Hired as Sales Associate ($4,500/mo) with standard 40h schedule.' },
    { date: 'Jun 01, 2026', title: 'Promotion', desc: 'Promoted to Store Supervisor. Previous contract ended, overlap validated.' },
    { date: 'Sep 10, 2026', title: 'Parental Leave', desc: 'Approved paid leave against Allocation; Basic salary preserved.' },
    { date: 'Nov 20, 2026', title: 'Resignation', desc: 'Nov payslip prorated to 20th; excluded from Dec Payrun.' },
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
            <span className="text-[10px] text-gray-400 font-medium">HR & Payroll Operations Platform</span>
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-primary-light text-xs font-semibold backdrop-blur-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary-light" />
            <span>Finnova Design System · Odoo 2026 Reference Theme</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Reconcile Headcount, Contracts & Payroll in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary">One Flow</span>
          </h1>

          <p className="text-base md:text-lg text-gray-300 max-w-2xl font-normal leading-relaxed">
            Every employee, contract, schedule, attendance log, and salary rule reconciles seamlessly into one verified payslip. Built with strict role-based access and zero-conflict modular architecture.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Button variant="primary" size="lg" onClick={() => navigate('/login')} className="w-full sm:w-auto shadow-lg">
              Launch Live App
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Lock className="w-4 h-4 mr-2 text-primary-light" />
              Sign In (Demo Roles)
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

      {/* Interactive Feature Explorer Tabs */}
      <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge status="info">Interactive Preview</Badge>
          <h2 className="text-3xl font-extrabold text-ink mt-3">Developer A Features Showcase</h2>
          <p className="text-xs md:text-sm text-slate mt-2">
            Explore the core HR foundation built for Developer A (Auth, Employee Directory, Contracts & Schedules).
          </p>
        </div>

        {/* Feature Tabs Header */}
        <div className="flex justify-center border-b border-border gap-2 md:gap-4 overflow-x-auto pb-1 mb-6">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 text-xs md:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'kanban' ? 'border-primary text-primary' : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            Employee Directory
          </button>
          <button
            onClick={() => setActiveTab('overlap')}
            className={`px-4 py-2 text-xs md:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'overlap' ? 'border-primary text-primary' : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            Contract Overlap Guard
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 text-xs md:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'schedule' ? 'border-primary text-primary' : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            Working Schedule Grid
          </button>
          <button
            onClick={() => setActiveTab('amara')}
            className={`px-4 py-2 text-xs md:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'amara' ? 'border-primary text-primary' : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            Amara Chen Scenario
          </button>
        </div>

        {/* Feature Preview Card */}
        <Card className="p-6 md:p-8 bg-white border border-border shadow-md">
          {activeTab === 'kanban' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink">Kanban & List Employee Directory</h3>
                  <p className="text-xs text-slate">Filter by department, job position, or live search with instant Smart Stat navigation.</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate('/employees')}>
                  Open Directory
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 border border-border rounded-lg bg-canvas flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center">AC</div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">Amara Chen</h4>
                    <span className="text-xs text-slate">Sales Associate · Sales Dept</span>
                    <div className="mt-1"><Badge status="active" /></div>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg bg-canvas flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-white font-bold flex items-center justify-center">SA</div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">System Admin</h4>
                    <span className="text-xs text-slate">Platform Administrator</span>
                    <div className="mt-1"><Badge status="active" /></div>
                  </div>
                </div>

                <div className="p-4 border border-border/60 rounded-lg bg-white flex flex-col justify-center items-center text-center p-6 border-dashed">
                  <Plus className="w-6 h-6 text-slate mb-1" />
                  <span className="text-xs font-semibold text-slate">Role-Gated Employee Creation</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overlap' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-danger shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-ink">Contract Overlap Validation Rule</h3>
                  <p className="text-xs text-slate">Prevents double-booking running contracts for the same employee over overlapping periods.</p>
                </div>
              </div>

              <div className="p-4 bg-danger-tint border border-danger/30 rounded-lg text-danger-text text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Validation Error Enforced</span>
                  <span>Validation Error: Employee already has an active running contract (CNT-2026-001) covering the requested period. End the existing contract first before starting a new active contract.</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => navigate('/contracts')}>
                  Try Contract Management
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink">Working Schedule Builder</h3>
                  <p className="text-xs text-slate">Weekly pattern grid (Mon–Sun) with auto-calculated total weekly hours.</p>
                </div>
                <Badge status="approved">Auto-Computed 40h</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <div key={day} className="p-3 bg-canvas border border-border rounded-md font-semibold">
                    <span className="text-slate block">{day}</span>
                    <span className="text-ink font-bold block mt-1">09:00 - 17:00</span>
                    <span className="text-[10px] text-primary block mt-0.5">7h + 1h break</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'amara' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-ink">Amara Chen Lifecycle Scenario</h3>
              <p className="text-xs text-slate">The 5-minute live-demo narrative exercising every system module in sequence.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {amaraTimeline.map((item, i) => (
                  <div key={i} className="p-3 border border-border rounded-lg bg-canvas flex flex-col gap-1 text-xs">
                    <span className="text-[10px] font-bold text-primary">{item.date}</span>
                    <span className="font-bold text-ink">{item.title}</span>
                    <span className="text-slate leading-relaxed">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Role Permission Matrix Explorer */}
      <section className="py-16 bg-white border-y border-border px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge status="approved">Role-Based Security</Badge>
            <h2 className="text-3xl font-extrabold text-ink mt-3">Interactive RBAC Permission Explorer</h2>
            <p className="text-xs md:text-sm text-slate mt-2">
              Click a role below to preview permissions enforced at the backend query layer.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(roleSpecs) as Array<keyof typeof roleSpecs>).map((roleKey) => (
              <button
                key={roleKey}
                onClick={() => setSelectedRole(roleKey)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  selectedRole === roleKey
                    ? 'border-primary bg-primary-light shadow-xs ring-2 ring-primary/20'
                    : 'border-border bg-canvas hover:bg-white'
                }`}
              >
                <span className="text-xs font-bold text-ink">{roleSpecs[roleKey].name}</span>
                <span className="text-[10px] text-slate font-mono">{roleSpecs[roleKey].email}</span>
              </button>
            ))}
          </div>

          {/* Selected Role Active Card */}
          <Card className="p-6 bg-canvas border border-border flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-ink">{roleSpecs[selectedRole].name}</h3>
                <Badge status={roleSpecs[selectedRole].badgeStatus}>
                  {roleSpecs[selectedRole].badge}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <span className="text-xs font-bold text-slate uppercase">Authorized Capabilities</span>
                {roleSpecs[selectedRole].rights.map((right, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-ink font-semibold">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>{right}</span>
                  </div>
                ))}
              </div>
            </div>

            {roleSpecs[selectedRole].denied.length > 0 && (
              <div className="flex-1 flex flex-col gap-3 bg-white p-4 rounded-lg border border-border">
                <span className="text-xs font-bold text-danger uppercase">Strictly Blocked / Restricted</span>
                {roleSpecs[selectedRole].denied.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate">
                    <X className="w-4 h-4 text-danger shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
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

      {/* Final Call to Action CTA */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-r from-navy via-navy/95 to-primary-dark text-white text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <h2 className="text-3xl md:text-4xl font-extrabold">Ready to Experience PeoplePay360?</h2>
          <p className="text-sm md:text-base text-gray-300">
            Sign in with seeded demo credentials or test role boundaries live on the platform.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/login')} className="shadow-lg">
            Sign In to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-gray-400 py-8 px-6 md:px-12 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
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
