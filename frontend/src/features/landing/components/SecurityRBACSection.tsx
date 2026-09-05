import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Check, X, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';

export const SecurityRBACSection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'hr_manager' | 'hr_payroll_manager' | 'employee'>('admin');

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

  return (
    <section className="py-20 bg-white border-y border-border px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="text-center max-w-2xl mx-auto">
          <Badge status="approved">Role-Based Security</Badge>
          <h2 className="text-3xl font-extrabold text-ink mt-3">Interactive RBAC Permission Explorer</h2>
          <p className="text-xs md:text-sm text-slate mt-2">
            Click a role below to preview permissions enforced strictly at the backend query layer.
          </p>
        </div>

        {/* Role Selectors */}
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

        {/* Animated Role Detail Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRole}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
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
                <div className="flex-1 flex flex-col gap-3 bg-white p-4 rounded-lg border border-border w-full md:w-auto">
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
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
