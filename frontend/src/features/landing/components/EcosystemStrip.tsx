import React from 'react';
import { Database, Server, Code2, Cpu, Zap, ShieldCheck } from 'lucide-react';

export const EcosystemStrip: React.FC = () => {
  const ecosystems = [
    {
      name: 'Supabase PostgreSQL',
      desc: 'Central Relational DB & Triggers',
      icon: Database,
      color: '#10B981',
      badge: 'v15.1 DB',
    },
    {
      name: 'Deterministic Rules AST',
      desc: 'Odoo-Standard Pythonic Salary Engine',
      icon: Cpu,
      color: '#5A5FE8',
      badge: 'Sub-ms Calc',
    },
    {
      name: 'TypeScript Strict Types',
      desc: 'Zero Undefined State Guarantee',
      icon: Code2,
      color: '#2563EB',
      badge: 'Type-Safe',
    },
    {
      name: 'Isolated Worker Pods',
      desc: 'Containerized Payroll Microservices',
      icon: Server,
      color: '#06B6D4',
      badge: 'Docker',
    },
    {
      name: 'Real-time WebSocket Bus',
      desc: 'Instant Push Notifications & Presence',
      icon: Zap,
      color: '#F59E0B',
      badge: 'Live Bus',
    },
    {
      name: '5-Tier Cryptographic RBAC',
      desc: 'Immutable Audit Trail & Permissions',
      icon: ShieldCheck,
      color: '#6366F1',
      badge: 'Encrypted',
    },
  ];

  return (
    <section className="w-full py-14 border-y border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
        
        {/* Modern Badge Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/90 text-slate-600 text-[11px] font-extrabold uppercase tracking-widest font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5A5FE8] animate-pulse"></span>
          <span>Mission-Critical Enterprise Infrastructure</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 items-stretch">
          {ecosystems.map((eco, idx) => {
            const Icon = eco.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-between p-4 rounded-2xl bg-[#F8F9FD] hover:bg-white transition-all duration-300 border border-slate-200/70 hover:border-[#5A5FE8]/30 shadow-xs hover:shadow-md group cursor-default text-center"
              >
                <div className="flex flex-col items-center w-full">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 shadow-xs"
                    style={{ backgroundColor: `${eco.color}15`, color: eco.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="text-[13px] font-extrabold text-[#0F172A] tracking-tight leading-snug">
                    {eco.name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 leading-snug line-clamp-2">
                    {eco.desc}
                  </span>
                </div>

                <span
                  className="mt-3 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border transition-colors"
                  style={{
                    backgroundColor: `${eco.color}10`,
                    color: eco.color,
                    borderColor: `${eco.color}25`,
                  }}
                >
                  {eco.badge}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
