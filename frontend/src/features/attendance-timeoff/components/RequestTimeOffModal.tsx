import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Check, Info } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface RequestTimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveTypes: any[];
  allocations: any[];
}

export const RequestTimeOffModal: React.FC<RequestTimeOffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leaveTypes,
  allocations,
}) => {
  const { user } = useAuth();
  const [typeId, setTypeId] = useState<string>(leaveTypes[0]?.id || '');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [amount, setAmount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (leaveTypes.length > 0 && !typeId) {
      setTypeId(leaveTypes[0].id);
    }
  }, [leaveTypes]);

  // Auto calculate requested days when start & end dates are picked
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (end >= start) {
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        setAmount(diffDays);
      }
    }
  }, [startDate, endDate]);

  if (!isOpen) return null;

  const currentEmpId = user?.employee?.id || (user as any)?.employee_id || (user as any)?.employeeId || user?.id;
  const selectedType = leaveTypes.find((t) => String(t.id) === String(typeId));
  const matchingAlloc = allocations.find(
    (a) => String(a.time_off_type_id) === String(typeId) && (String(a.employee_id) === String(currentEmpId) || String(a.employee?.id) === String(currentEmpId))
  );
  const remainingBalance = matchingAlloc !== undefined ? matchingAlloc.remaining : (selectedType?.requires_allocation ? 20 : 'Unlimited');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedType?.requires_allocation && typeof remainingBalance === 'number' && amount > remainingBalance) {
      setError(`Insufficient leave balance! You have ${remainingBalance} ${selectedType.unit} remaining, but requested ${amount}.`);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('pp360_token') || localStorage.getItem('token') || 'demo-token';
      const res = await fetch('/api/v1/timeoff/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employee_id: user?.employee?.id || (user as any)?.employee_id || (user as any)?.employeeId || user?.id,
          time_off_type_id: typeId,
          start_date: startDate,
          end_date: endDate,
          requested_amount: amount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit leave request');
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
            <Calendar className="w-5 h-5 text-primary-light" />
            <h3 className="font-bold text-base">Request Time Off</h3>
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
            <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Time Off Type *</label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              required
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-primary"
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.unit}) {t.is_paid ? '— Paid' : '— Unpaid'}
                </option>
              ))}
            </select>
          </div>

          {/* Balance Indicator */}
          {selectedType && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
                <Info className="w-4 h-4 text-primary" />
                <span>Available Balance:</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {remainingBalance} {selectedType.unit}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Requested Amount ({selectedType?.unit || 'Days'}) *</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
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
              <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
