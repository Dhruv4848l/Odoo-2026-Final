import React, { useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Users, FileText, Calendar, Clock, DollarSign, LayoutDashboard, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const FeatureGridSection: React.FC = () => {
  useEffect(() => {
    const cards = gsap.utils.toArray('.feature-card-item');
    if (cards.length === 0) return;

    gsap.from(cards, {
      scrollTrigger: {
        trigger: '#feature-grid-section',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
      opacity: 0,
      y: 40,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power3.out',
    });
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Employee Hub & Directory',
      description: 'Centralized headcount directory with Kanban, List, and Form views. Smart-button links to Contracts, Attendance, and Time Off.',
      squad: 'Dev A Core HR',
    },
    {
      icon: FileText,
      title: 'Contract Overlap Validation Guard',
      description: 'Historical contract tracking with period-active wage resolution and automated blocking of overlapping active contracts.',
      squad: 'Dev A Core HR',
    },
    {
      icon: Calendar,
      title: 'Working Schedule Pattern Grid',
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

  return (
    <section id="feature-grid-section" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full mt-12">
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
            <div key={idx} className="feature-card-item">
              <Card className="flex flex-col gap-4 p-6 hover:border-primary transition-all h-full">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold shadow-xs">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-slate uppercase tracking-wider bg-canvas px-2.5 py-1 rounded-full border border-border">
                    {f.squad}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  <h3 className="text-lg font-bold text-ink">{f.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{f.description}</p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center text-xs font-semibold text-primary">
                  <span>Explore Feature</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
};
