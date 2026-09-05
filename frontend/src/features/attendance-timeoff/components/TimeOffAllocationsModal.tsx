import React, { useState, useEffect } from 'react';
import { X, Award, Check, AlertCircle } from 'lucide-react';

interface TimeOffAllocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: any[];
  leaveTypes: any[];
  initialAllocation?: any;
}

export const TimeOffAllocationsModal: React.FC<TimeOffAllocationsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employees,
  leaveTypes,
  initialAllocation,
}) => {
  const isEdit = Boolean(initialAllocation?.id);

  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [allocated, setAllocated] = useState(15);
  const [validFrom, setValidFrom] = useState('2026-01-01');
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAllocation) {
      setEmployeeId(initialAllocation.employee_id || employees[0]?.id || '');
      setTimeOffTypeId(initialAllocation.time_off_type_id || leaveTypes[0]?.id || '');
      setAllocated(initialAllocation.allocated !== undefined ? Number(initialAllocation.allocated) : 15);
      setValidFrom(initialAllocation.valid_from ? String(initialAllocation.valid_from).split('T')[0] : '2026-01-01');
      setValidUntil(initialAllocation.valid_until ? String(initialAllocation.valid_until).split('T')[0] : '2026-12-31');
    } else {
      setEmployeeId(employees[0]?.id || '');
      setTimeOffTypeId(leaveTypes[0]?.id || '');
      setAllocated(15);
      setValidFrom('2026-01-01');
      setValidUntil('2026-12-31');
    }
  }, [initialAllocation, isOpen, employees, leaveTypes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';
      const url = isEdit ? `/api/v1/timeoff/allocations/${initialAllocation.id}` : '/api/v1/timeoff/allocations';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employee_id: employeeId,
          time_off_type_id: timeOffTypeId,
          allocated: Number(allocated),
          valid_from: validFrom,
          valid_until: validUntil,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to save allocation');
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
        <div className="px-6 py-4 bg-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-light" />
            <h3 className="font-bold text-base">{isEdit ? 'Modify Leave Allocation' : 'Grant Leave Allocation'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 text-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
            <select
              value={employeeId}
              disabled={isEdit}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-primary disabled:opacity-60"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Time Off Type *</label>
              <select
                value={timeOffTypeId}
                disabled={isEdit}
                onChange={(e) => setTimeOffTypeId(e.target.value)}
                required
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-primary disabled:opacity-60"
              >
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Allocated Amount *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={allocated}
                onChange={(e) => setAllocated(Number(e.target.value))}
                required
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary font-bold text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Valid From *</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Valid Until *</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="h-10 px-6 bg-primary hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-sm flex items-center gap-2 cursor-pointer">
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : (isEdit ? 'Save Allocation' : 'Grant Allocation')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
