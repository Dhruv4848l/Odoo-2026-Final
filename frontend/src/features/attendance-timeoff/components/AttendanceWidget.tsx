import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export interface AttendanceWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  onStatusChange?: () => void;
  userName?: string;
}

export const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({
  isOpen,
  onClose,
  onStatusChange,
  userName,
}) => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  if (isOpen === false) return null;

  const displayName = userName || (user?.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user?.email || 'Employee');

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

  // If floating modal mode (isOpen is explicitly passed)
  if (isOpen !== undefined) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-xl shadow-lg border border-[#E5E7EB] p-5 animate-slide-up text-slate-800">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${activeSession ? 'bg-[#22C55E] animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-xs font-semibold text-[#6B7280]">
              {activeSession ? 'Checked In' : 'Checked Out'}
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-center py-2">
          <h4 className="text-sm font-semibold text-[#1A1A2E]">Welcome back, {displayName}</h4>
          <div className="my-3 text-3xl font-bold font-mono tracking-wider text-[#14141F]">
            {formatTimer(elapsedSeconds)}
          </div>
          <p className="text-[11px] text-[#6B7280] mb-4">
            Session Duration: <span className="font-semibold text-[#1A1A2E]">{(elapsedSeconds / 3600).toFixed(2)} hrs</span>
          </p>

          {error && (
            <div className="mb-3 p-2 text-xs text-red-600 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}

          {activeSession ? (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Check Out</span>
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Check In</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Inline Banner mode (default when embedded in pages like AttendanceListPage)
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left Info Section */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeSession ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50 animate-pulse' : 'bg-indigo-500/20 text-indigo-300'}`}>
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
            {displayName}
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
            className="h-11 px-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-sm rounded-full transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Check Out</span>
          </button>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Check In</span>
          </button>
        )}
      </div>
    </div>
  );
};
