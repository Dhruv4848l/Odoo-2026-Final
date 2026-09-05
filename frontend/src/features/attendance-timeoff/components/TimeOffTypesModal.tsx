import React, { useState } from 'react';
import { X, Settings, Check, AlertCircle } from 'lucide-react';

interface TimeOffTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TimeOffTypesModal: React.FC<TimeOffTypesModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Days');
  const [requiresAllocation, setRequiresAllocation] = useState(true);
  const [approvalWorkflow, setApprovalWorkflow] = useState('by_hr');
  const [isPaid, setIsPaid] = useState(true);
  const [displayColor, setDisplayColor] = useState('#5B4FE9');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/timeoff/types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          unit,
          requires_allocation: requiresAllocation,
          approval_workflow: approvalWorkflow,
          is_paid: isPaid,
          display_color: displayColor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create time off type');
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
            <Settings className="w-5 h-5 text-primary-light" />
            <h3 className="font-bold text-base">New Time Off Type</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Leave Type Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Parental Leave, Floating Holiday"
              required
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
              >
                <option value="Days">Days</option>
                <option value="Hours">Hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Color Swatch</label>
              <input
                type="color"
                value={displayColor}
                onChange={(e) => setDisplayColor(e.target.value)}
                className="w-full h-10 p-1 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresAllocation}
                onChange={(e) => setRequiresAllocation(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              <span className="text-xs font-semibold text-gray-700">Requires Allocation (Balance check enforced)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              <span className="text-xs font-semibold text-gray-700">Paid Leave (Does not deduct Basic Salary)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="h-10 px-6 bg-primary hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-sm flex items-center gap-2 cursor-pointer">
              <Check className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Type'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
