import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Check, X, ShieldCheck, Lock } from 'lucide-react';

export const SecurityRBACSection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<
    'admin' | 'hr_manager' | 'hr_payroll_user' | 'hr_payroll_manager' | 'employee'
  >('admin');

  const roleSpecs = {
    admin: {
      name: 'System Admin',
      tier: 'TIER 5',
      badge: 'Full Root Access',
      badgeStatus: 'active' as const,
      email: 'admin@peoplepay.com',
      rights: [
        'Full System Configuration & Cloud DB Authority',
        'User Account & Privilege Role Assignments',
        'Cryptographic Audit Logging & Platform Security',
        'Global Analytics & Cross-Department Oversight',
      ],
      denied: [],
    },
    hr_payroll_manager: {
      name: 'HR Payroll Manager',
      tier: 'TIER 4',
      badge: 'Rule Engine Authority',
      badgeStatus: 'active' as const,
      email: 'payroll.manager@peoplepay.com',
      rights: [
        'Full Payroll & Payrun Batch Authority',
        'Salary Structures, Rules & Pythonic Formula Engine',
        'Bulk Payslip Generation, Vector PDF & Email Dispatch',
        'Comprehensive Attendance & Contract Reconciliation',
      ],
      denied: ['Platform User Creation & Root Configuration'],
    },
    hr_payroll_user: {
      name: 'HR Payroll User',
      tier: 'TIER 3',
      badge: 'Payrun Executor',
      badgeStatus: 'info' as const,
      email: 'payroll.user@peoplepay.com',
      rights: [
        'Create, Compute & Confirm Monthly Payruns',
        'Generate, Print & Email Verified Bulk Payslips',
        'Full Access to Employee Lifecycle Records',
        'Attendance & Time-Off Status Verification',
      ],
      denied: [
        'Modify Salary Rules & Mathematical Formulas (Read-Only)',
        'System Privilege & User Administration',
      ],
    },
    hr_manager: {
      name: 'HR Manager',
      tier: 'TIER 2',
      badge: 'People Ops Only',
      badgeStatus: 'info' as const,
      email: 'hr.manager@peoplepay.com',
      rights: [
        'Full CRUD on Employees, Contracts & Schedules',
        'Review & Approve Leave Allocations and Time Off',
        'Supervisor Attendance Corrections & Audit Trails',
        'Department Roster & Position Planning',
      ],
      denied: [
        'Payroll Execution Screens (403 Blocked by Server)',
        'Salary Structures, AST Rules & Compensation Totals',
      ],
    },
    employee: {
      name: 'Amara Chen (Employee)',
      tier: 'TIER 1',
      badge: 'Self-Service Scoped',
      badgeStatus: 'warning' as const,
      email: 'amara.chen@peoplepay.com',
      rights: [
        'View Own Profile, Contract & Wage Details',
        'Biometric Kiosk Punch (Check-In / Out)',
        'Submit Leave & Time-Off Requests',
        'Download Personal Cryptographically Sealed Payslips',
      ],
      denied: [
        'View Other Employee Profiles or Department Directory',
        'Create or Alter Contract Agreements',
        'Access Payroll, Accounting or Formula Screens',
      ],
    },
  };

  return (
    <section className="py-24 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-12 relative">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5A5FE8]/10 text-[#5A5FE8] text-xs font-extrabold tracking-wide font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>ROLE-BASED ACCESS CONTROL (RBAC)</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            5 Enforced Tiers. Zero Ambiguity.
          </h2>

          <p className="text-xs sm:text-sm text-slate-600">
            Hover over any role below to preview permissions enforced strictly at the database query layer.
          </p>
        </div>

        {/* 5-Role Selector Cards with Hover Interaction */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.keys(roleSpecs) as Array<keyof typeof roleSpecs>).map((roleKey) => {
            const role = roleSpecs[roleKey];
            const isSelected = selectedRole === roleKey;

            return (
              <div
                key={roleKey}
                onMouseEnter={() => setSelectedRole(roleKey)}
                onClick={() => setSelectedRole(roleKey)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 cursor-pointer select-none ${
                  isSelected
                    ? 'border-[#5A5FE8] bg-indigo-50/60 shadow-md ring-2 ring-[#5A5FE8]/25 scale-102'
                    : 'border-slate-200 bg-[#F8F9FD] hover:bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[9px] font-extrabold uppercase font-mono px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-[#5A5FE8] text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {role.tier}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#5A5FE8] animate-ping"></span>
                    )}
                  </div>
                  <span className="text-xs font-black text-[#0F172A] leading-tight block">
                    {role.name}
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 font-mono truncate block">
                  {role.email}
                </span>
              </div>
            );
          })}
        </div>

        {/* Animated Role Detail Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6 sm:p-8 bg-[#F8F9FD] rounded-3xl border border-slate-200/90 shadow-sm flex flex-col lg:flex-row gap-8 items-start justify-between">
              
              {/* Authorized Capabilities (Left) */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-extrabold font-mono text-[#5A5FE8] bg-[#5A5FE8]/10 px-2.5 py-1 rounded-full border border-[#5A5FE8]/20">
                    {roleSpecs[selectedRole].tier}
                  </span>
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">
                    {roleSpecs[selectedRole].name}
                  </h3>
                  <Badge status={roleSpecs[selectedRole].badgeStatus}>
                    {roleSpecs[selectedRole].badge}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  <span className="text-xs font-extrabold text-slate-400 uppercase font-mono tracking-wider">
                    Authorized Server Privileges
                  </span>
                  {roleSpecs[selectedRole].rights.map((right, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-[#0F172A] font-semibold">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{right}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Denied / Restricted Capabilities (Right) */}
              <div className="flex-1 w-full lg:max-w-md bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
                <span className="text-xs font-extrabold text-red-600 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Strictly Restricted / 403 Blocked
                </span>

                {roleSpecs[selectedRole].denied.length > 0 ? (
                  roleSpecs[selectedRole].denied.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-600">
                      <div className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <X className="w-3 h-3" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    Unrestricted root access. System Administrator maintains full supervisory authority across all data partitions.
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
