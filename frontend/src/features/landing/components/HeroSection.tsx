import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { BackgroundCanvas } from './BackgroundCanvas';
import { Sparkles, ArrowRight, Lock, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-b from-navy via-navy/95 to-canvas text-white pt-16 pb-24 px-6 md:px-12 text-center relative overflow-hidden">
      {/* 3D Three.js WebGL Particle Network Canvas */}
      <BackgroundCanvas />

      <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 relative z-10">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-primary-light text-xs font-semibold backdrop-blur-xs shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary-light" />
          <span>Next-Gen HR & Payroll Operations Platform</span>
        </motion.div>

        {/* Animated Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white"
        >
          Reconcile Headcount, Contracts & Payroll in{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-white to-primary">
            One Connected Flow
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base md:text-lg text-gray-300 max-w-2xl font-normal leading-relaxed"
        >
          Every employee, contract, schedule, attendance log, and salary rule reconciles seamlessly into one verified payslip. Enforced with 5-tier role access and real-time validation.
        </motion.p>

        {/* Hero Actions */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-2"
        >
          <Button variant="primary" size="lg" onClick={() => navigate('/login')} className="w-full sm:w-auto shadow-lg">
            Launch Platform
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
        </motion.div>
      </div>

      {/* KPI Stats Strip */}
      <div className="-mb-32 mt-16 max-w-6xl mx-auto w-full relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="kpi" className="bg-white border border-border shadow-md text-ink text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate uppercase">Accuracy</span>
              <ShieldCheck className="w-4 h-4 text-success" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-ink">100%</span>
            <span className="text-xs text-slate mt-1 block">Rule Reconciliation</span>
          </Card>

          <Card variant="kpi" className="bg-white border border-border shadow-md text-ink text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate uppercase">Security</span>
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-ink">5 Roles</span>
            <span className="text-xs text-slate mt-1 block">Enforced RBAC Matrix</span>
          </Card>

          <Card variant="kpi" className="bg-white border border-border shadow-md text-ink text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate uppercase">Database</span>
              <Zap className="w-4 h-4 text-warning" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-ink">Supabase</span>
            <span className="text-xs text-slate mt-1 block">Shared Postgres DB</span>
          </Card>

          <Card variant="kpi" className="bg-white border border-border shadow-md text-ink text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate uppercase">Architecture</span>
              <BarChart3 className="w-4 h-4 text-info" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-ink">4 Squads</span>
            <span className="text-xs text-slate mt-1 block">Parallel Conflict-Free</span>
          </Card>
        </div>
      </div>
    </section>
  );
};
