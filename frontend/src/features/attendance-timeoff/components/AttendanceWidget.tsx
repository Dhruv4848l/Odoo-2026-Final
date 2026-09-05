import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface AttendanceWidgetProps {
  onStatusChange?: () => void;
}

export const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ onStatusChange }) => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/attendance/current', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setActiveSession(data.data);
        const startTime = new Date(data.data.check_in).getTime();
        const now = new Date().getTime();
        setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
      } else {
        setActiveSession(null);
        setElapsedSeconds(0);
      }
    } catch (err) {
      console.error('Failed to fetch attendance status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (activeSession) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Check-in failed');
      }
      await fetchStatus();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Check-out failed');
      }
      await fetchStatus();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-r from-navy via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left Info Section */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeSession ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50 animate-pulse' : 'bg-primary/20 text-primary-light'}`}>
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Attendance Punch Widget</span>
            {activeSession ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Working Now
              </span>
            ) : (
              <span className="text-[11px] font-semibold bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-full">
                Checked Out
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-200 mt-0.5">
            {user?.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user?.email}
          </p>
        </div>
      </div>

      {/* Middle Live Counter */}
      <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/10 min-w-[160px]">
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Session Duration</span>
        <span className="text-2xl font-bold tracking-widest font-mono text-white">
          {formatTimer(elapsedSeconds)}
        </span>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {error && (
          <div className="text-xs text-red-300 bg-red-950/60 px-3 py-1.5 rounded-lg border border-red-500/30 flex items-center gap-1.5 max-w-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {activeSession ? (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="h-11 px-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-sm rounded-full transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Check Out</span>
          </button>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="h-11 px-6 bg-primary hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm rounded-full transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Check In</span>
          </button>
        )}
      </div>
    </div>
  );
};
