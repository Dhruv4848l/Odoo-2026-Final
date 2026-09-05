import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, AlertCircle, X, CheckCircle } from 'lucide-react';
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
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';
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
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';
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
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';
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

  // Floating modal mode (e.g. quick kiosk trigger)
  if (isOpen !== undefined) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-84 bg-[#12141F] text-white rounded-[24px] shadow-deck border border-white/10 p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${activeSession ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-bold text-slate-300">
              {activeSession ? 'Shift Active' : 'Offline'}
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary-fixed mx-auto flex items-center justify-center font-bold text-sm mb-2 ring-2 ring-primary/40">
            {displayName.charAt(0)}
          </div>
          <h4 className="text-sm font-bold text-white">{displayName}</h4>
          <div className="my-3 text-3xl font-bold font-mono tracking-wider text-white font-tabular">
            {formatTimer(elapsedSeconds)}
          </div>
          <p className="text-[11px] text-slate-400 mb-4">
            Total Session Time: <span className="font-semibold text-emerald-400">{(elapsedSeconds / 3600).toFixed(2)} hrs</span>
          </p>

          {error && (
            <div className="mb-3 p-2.5 text-xs text-red-300 bg-red-950/80 rounded-xl border border-red-500/30">
              {error}
            </div>
          )}

          {activeSession ? (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 active:scale-[0.97] text-white font-semibold text-xs rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Punch Check Out</span>
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-semibold text-xs rounded-full transition-all shadow-glow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Punch Check In</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Inline Banner mode (Embedded in AttendanceListPage)
  return (
    <div className="bg-gradient-to-r from-[#12141F] via-[#1B1E30] to-[#171A2A] text-white rounded-[24px] p-5 shadow-deck border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left Info Section */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          activeSession 
            ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40 animate-pulse' 
            : 'bg-primary/20 text-primary-fixed ring-2 ring-primary/40'
        }`}>
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Attendance Punch Terminal</span>
            {activeSession ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Working Now
              </span>
            ) : (
              <span className="text-[11px] font-semibold bg-[#252945] text-slate-300 px-2.5 py-0.5 rounded-full">
                Shift Inactive
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-white mt-0.5">
            {displayName}
          </p>
        </div>
      </div>

      {/* Middle Live Counter */}
      <div className="text-center px-6 py-2.5 bg-[#12141F] rounded-[18px] border border-white/5 min-w-[170px]">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Shift Elapsed</span>
        <span className="text-2xl font-bold tracking-widest font-mono text-white font-tabular">
          {formatTimer(elapsedSeconds)}
        </span>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {error && (
          <div className="text-xs text-red-300 bg-red-950/80 px-3 py-1.5 rounded-xl border border-red-500/30 flex items-center gap-1.5 max-w-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {activeSession ? (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="h-11 px-6 bg-red-500 hover:bg-red-600 active:scale-[0.97] text-white font-semibold text-xs rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Check Out</span>
          </button>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="h-11 px-6 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-semibold text-xs rounded-full transition-all shadow-glow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Check In</span>
          </button>
        )}
      </div>
    </div>
  );
};
