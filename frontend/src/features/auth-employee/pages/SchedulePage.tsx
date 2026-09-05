import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { apiRequest } from '../../../lib/api';
import { Calendar, Plus, Clock, Save, ShieldCheck, ChevronRight } from 'lucide-react';

interface DayConfig {
  day_of_week: string;
  start_time: string;
  end_time: string;
  break_hours: number;
}

const DEFAULT_DAYS: DayConfig[] = [
  { day_of_week: 'Monday', start_time: '09:00', end_time: '17:00', break_hours: 1 },
  { day_of_week: 'Tuesday', start_time: '09:00', end_time: '17:00', break_hours: 1 },
  { day_of_week: 'Wednesday', start_time: '09:00', end_time: '17:00', break_hours: 1 },
  { day_of_week: 'Thursday', start_time: '09:00', end_time: '17:00', break_hours: 1 },
  { day_of_week: 'Friday', start_time: '09:00', end_time: '17:00', break_hours: 1 },
];

export const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [days, setDays] = useState<DayConfig[]>(DEFAULT_DAYS);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const res = await apiRequest('/schedules');
      setSchedules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Compute live preview of total weekly hours
  const computedTotalHours = days.reduce((sum, d) => {
    const [sH, sM] = d.start_time.split(':').map(Number);
    const [eH, eM] = d.end_time.split(':').map(Number);
    const gross = eH + eM / 60 - (sH + sM / 60);
    return sum + Math.max(0, gross - Number(d.break_hours || 0));
  }, 0);

  const handleUpdateDay = (index: number, field: keyof DayConfig, value: any) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: value };
    setDays(updated);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/schedules', {
        method: 'POST',
        body: JSON.stringify({ name, days }),
      });
      setShowModal(false);
      setName('');
      fetchSchedules();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              Workforce Shift Engineering
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs">Contract Hours Automation</span>
          </div>
          <h1 className="text-2xl font-bold text-[#12141F] tracking-tight">Working Schedules</h1>
          <p className="text-xs text-slate-500 mt-0.5">Define weekly work patterns with auto-computed total hours and shift thresholds</p>
        </div>

        <Button variant="primary" className="gap-2 shadow-fintech" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          <span>New Schedule Pattern</span>
        </Button>
      </div>

      {/* Schedules List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {schedules.map((s) => (
          <div 
            key={s.id} 
            className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-fintech hover:shadow-fintech-hover transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#12141F]">{s.name}</h3>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full font-tabular">
                  {s.total_hours_per_week}h / week
                </span>
              </div>

              <div className="bg-slate-50/80 p-3.5 rounded-[18px] border border-slate-200/60 space-y-2 text-xs">
                {s.days?.map((d: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="font-bold text-[#12141F]">{d.day_of_week}</span>
                    <span className="font-mono text-slate-600 text-[11px] font-tabular">
                      {d.start_time} - {d.end_time} ({d.computed_hours}h)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Auto-applied to linked contracts</span>
              <span className="text-emerald-600 font-semibold">Active</span>
            </div>
          </div>
        ))}
        {schedules.length === 0 && (
          <div className="col-span-full p-12 bg-white rounded-[24px] border border-slate-100 text-center text-slate-400 text-xs">
            No working schedule patterns created yet. Click 'New Schedule Pattern' to define standard weekly shifts.
          </div>
        )}
      </div>

      {/* New Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#12141F]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card variant="modal" className="max-w-2xl shadow-deck rounded-[28px]">
            <h2 className="text-lg font-bold text-[#12141F] mb-1">Create Working Schedule</h2>
            <p className="text-xs text-slate-500 mb-4">Total weekly hours are automatically calculated based on day patterns.</p>

            <form onSubmit={handleCreateSchedule} className="flex flex-col gap-4">
              <Input
                label="Schedule Name *"
                placeholder="e.g. Standard 40h Shift (9 AM - 5 PM)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {/* Day Pattern Grid */}
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Pattern Grid</span>
                {days.map((d, idx) => (
                  <div key={d.day_of_week} className="grid grid-cols-4 gap-2 items-center bg-slate-50 p-2.5 rounded-[14px] border border-slate-200/80">
                    <span className="text-xs font-bold text-[#12141F]">{d.day_of_week}</span>
                    <input
                      type="time"
                      value={d.start_time}
                      onChange={(e) => handleUpdateDay(idx, 'start_time', e.target.value)}
                      className="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-primary font-mono"
                    />
                    <input
                      type="time"
                      value={d.end_time}
                      onChange={(e) => handleUpdateDay(idx, 'end_time', e.target.value)}
                      className="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-primary font-mono"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        value={d.break_hours}
                        onChange={(e) => handleUpdateDay(idx, 'break_hours', Number(e.target.value))}
                        className="h-8 w-14 px-2 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-primary font-mono"
                      />
                      <span className="text-[11px] text-slate-500">h break</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-Calculated Total Banner */}
              <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-[18px] flex items-center justify-between text-primary">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Auto-Calculated Total Weekly Hours</span>
                </div>
                <span className="text-base font-bold font-tabular">{computedTotalHours} hrs / week</span>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Schedule Pattern
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
