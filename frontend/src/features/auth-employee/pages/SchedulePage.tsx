import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { apiRequest } from '../../../lib/api';
import { Calendar, Plus, Clock, Save, ShieldCheck } from 'lucide-react';

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
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Working Schedule Builder</h1>
          <p className="text-sm text-slate">Define weekly work patterns with auto-computed total hours</p>
        </div>

        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Schedule Pattern
        </Button>
      </div>

      {/* Schedules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((s) => (
          <Card key={s.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-ink text-base">{s.name}</h3>
              </div>
              <span className="px-3 py-1 bg-primary-light text-primary font-bold text-xs rounded-full">
                {s.total_hours_per_week}h / week
              </span>
            </div>

            <div className="bg-canvas p-3 rounded-md border border-border flex flex-col gap-1.5 text-xs text-slate">
              {s.days?.map((d: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{d.day_of_week}</span>
                  <span>
                    {d.start_time} - {d.end_time} ({d.computed_hours}h)
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* New Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card variant="modal" className="max-w-2xl">
            <h2 className="text-xl font-bold text-ink mb-2">Create Working Schedule</h2>
            <p className="text-xs text-slate mb-4">Total weekly hours are automatically calculated based on day patterns.</p>

            <form onSubmit={handleCreateSchedule} className="flex flex-col gap-4">
              <Input
                label="Schedule Name *"
                placeholder="e.g. Standard 40h Shift"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {/* Day Pattern Grid */}
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                <span className="text-xs font-semibold text-slate uppercase">Weekly Pattern Grid</span>
                {days.map((d, idx) => (
                  <div key={d.day_of_week} className="grid grid-cols-4 gap-2 items-center bg-canvas p-2.5 rounded-md border border-border">
                    <span className="text-xs font-bold text-ink">{d.day_of_week}</span>
                    <input
                      type="time"
                      value={d.start_time}
                      onChange={(e) => handleUpdateDay(idx, 'start_time', e.target.value)}
                      className="h-8 px-2 text-xs border border-border rounded bg-white"
                    />
                    <input
                      type="time"
                      value={d.end_time}
                      onChange={(e) => handleUpdateDay(idx, 'end_time', e.target.value)}
                      className="h-8 px-2 text-xs border border-border rounded bg-white"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        value={d.break_hours}
                        onChange={(e) => handleUpdateDay(idx, 'break_hours', Number(e.target.value))}
                        className="h-8 w-14 px-2 text-xs border border-border rounded bg-white"
                      />
                      <span className="text-[10px] text-slate">h break</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-Calculated Total Banner */}
              <div className="p-3 bg-primary-light border border-primary/30 rounded-md flex items-center justify-between text-primary">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Auto-Calculated Total Weekly Hours</span>
                </div>
                <span className="text-lg font-bold">{computedTotalHours} hrs / week</span>
              </div>

              <div className="flex justify-end gap-3 mt-2">
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
