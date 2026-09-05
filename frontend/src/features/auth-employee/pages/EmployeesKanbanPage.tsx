import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { SmartStatButton } from '../../../components/ui/Button';

export const EmployeesKanbanPage: React.FC = () => {
  const employees = [
    { id: 1, name: 'Amara Chen', role: 'Store Supervisor', department: 'Sales & Retail', status: 'Active', contracts: 2, attendance: '98%' },
    { id: 2, name: 'Bhavna Patel', role: 'HR Specialist', department: 'Human Resources', status: 'Active', contracts: 1, attendance: '100%' },
    { id: 3, name: 'David Vance', role: 'Software Engineer', department: 'Engineering', status: 'Active', contracts: 1, attendance: '95%' },
    { id: 4, name: 'Elena Rostova', role: 'Accountant', department: 'Finance', status: 'Active', contracts: 1, attendance: '99%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Employees & Contracts Directory</h1>
          <p className="text-xs text-[#6B7280]">Unified HR Employee hub with linked contract history and working schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {employees.map((emp) => (
          <Card key={emp.id} variant="kanban">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-[#5B4FE9]/15 border border-[#5B4FE9] flex items-center justify-center font-bold text-[#5B4FE9] text-sm">
                {emp.name.split(' ').map(n => n[0]).join('')}
              </div>
              <Badge status={emp.status} />
            </div>
            <h3 className="font-bold text-sm text-[#1A1A2E]">{emp.name}</h3>
            <p className="text-xs text-[#6B7280] mb-3">{emp.role} · {emp.department}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]">
              <SmartStatButton label="Contracts" count={emp.contracts} />
              <SmartStatButton label="Attendance" count={emp.attendance} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
