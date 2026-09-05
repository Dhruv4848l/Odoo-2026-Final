import React, { useState } from 'react';
import { X, AlertTriangle, FileText, Check } from 'lucide-react';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingAttendance?: any;
  employees: any[];
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingAttendance,
  employees,
}) => {
  const [employeeId, setEmployeeId] = useState<string>(existingAttendance?.employee_id || (employees[0]?.id || ''));
  const [checkIn, setCheckIn] = useState<string>(
    existingAttendance?.check_in ? existingAttendance.check_in.substring(0, 16) : new Date().toISOString().substring(0, 16)
  );
  const [checkOut, setCheckOut] = useState<string>(
    existingAttendance?.check_out ? existingAttendance.check_out.substring(0, 16) : ''
  );
  const [auditNote, setAuditNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditNote.trim()) {
      setError('Audit note is mandatory for manual attendance adjustments.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';
      const isEdit = Boolean(existingAttendance);
      const url = isEdit ? `/api/v1/attendance/${existingAttendance.id}` : '/api/v1/attendance';
      const method = isEdit ? 'PUT' : 'POST';

      const body: any = {
        employee_id: employeeId,
        check_in: new Date(checkIn).toISOString(),
        check_out: checkOut ? new Date(checkOut).toISOString() : null,
        audit_note: auditNote,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to save attendance correction');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-light" />
            <h3 className="font-bold text-base">
              {existingAttendance ? 'Manual Attendance Correction' : 'Log Manual Attendance'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {!existingAttendance && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-primary"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Check In Time *</label>
              <input
                type="datetime-local"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Check Out Time</label>
              <input
                type="datetime-local"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Audit Note / Reason for Correction *
            </label>
            <textarea
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              placeholder="e.g. Corrected missing clock-out due to system maintenance / manager approval"
              required
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-primary resize-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              * Audit notes are permanently preserved in the system log to ensure compliance.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-6 bg-primary hover:bg-indigo-700 text-white font-semibold text-xs rounded-full transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Correction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
