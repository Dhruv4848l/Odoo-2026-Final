import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface AttendanceWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({
  isOpen,
  onClose,
  userName = 'Amara Chen',
}) => {
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    let interval: any = null;
    if (isCheckedIn) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn]);

  if (!isOpen) return null;

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (!isCheckedIn) {
      setIsCheckedIn(true);
    } else {
      setIsCheckedIn(false);
      setSeconds(0);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-xl shadow-lg border border-[#E5E7EB] p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-[#22C55E] animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-xs font-semibold text-[#6B7280]">
            {isCheckedIn ? 'Checked In' : 'Checked Out'}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="text-center py-2">
        <h4 className="text-sm font-semibold text-[#1A1A2E]">Welcome back, {userName}</h4>
        <div className="my-3 text-3xl font-bold font-mono tracking-wider text-[#14141F]">
          {formatTime(seconds)}
        </div>
        <p className="text-[11px] text-[#6B7280] mb-4">
          Today's Total: <span className="font-semibold text-[#1A1A2E]">{isCheckedIn ? (seconds / 3600).toFixed(2) : '0.00'} hrs</span>
        </p>

        <Button
          fullWidth
          variant={isCheckedIn ? 'finalize' : 'primary'}
          onClick={handleToggle}
          className="gap-2"
        >
          {isCheckedIn ? (
            <>
              <Square className="w-4 h-4 text-red-400 fill-current" />
              <span>Check Out</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-emerald-300 fill-current" />
              <span>Check In</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
