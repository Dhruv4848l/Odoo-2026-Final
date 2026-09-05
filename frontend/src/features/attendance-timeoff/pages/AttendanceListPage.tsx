import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Table, Column } from '../../../components/ui/Table';

export const AttendanceListPage: React.FC = () => {
  const attendanceLogs = [
    { id: 1, employee: 'Amara Chen', date: '2026-09-04', check_in: '09:00 AM', check_out: '05:30 PM', worked_hours: 8.5, overtime: 0.5, status: 'Present' },
    { id: 2, employee: 'Bhavna Patel', date: '2026-09-04', check_in: '09:15 AM', check_out: '05:00 PM', worked_hours: 7.75, overtime: 0, status: 'Present' },
    { id: 3, employee: 'David Vance', date: '2026-09-04', check_in: '08:50 AM', check_out: '—', worked_hours: '—', overtime: 0, status: 'Missing Checkout' },
    { id: 4, employee: 'Elena Rostova', date: '2026-09-04', check_in: '09:00 AM', check_out: '05:00 PM', worked_hours: 8.0, overtime: 0, status: 'Present' },
  ];

  const columns: Column<any>[] = [
    { header: 'Employee', accessorKey: 'employee', cell: (r) => <span className="font-bold text-xs">{r.employee}</span> },
    { header: 'Date', accessorKey: 'date' },
    { header: 'Check In', accessorKey: 'check_in' },
    { header: 'Check Out', accessorKey: 'check_out' },
    { header: 'Worked Hours', accessorKey: 'worked_hours', cell: (r) => <span className="font-mono">{r.worked_hours} hrs</span> },
    { header: 'Overtime', accessorKey: 'overtime', cell: (r) => <span className="font-mono">{r.overtime} hrs</span> },
    { header: 'Status', cell: (r) => <Badge status={r.status === 'Missing Checkout' ? 'Warning' : 'Active'}>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1A1A2E]">Attendance & Time Off Management</h1>
        <p className="text-xs text-[#6B7280]">Daily attendance exception handling, overtime tracking, and leave requests</p>
      </div>

      <Card title="Attendance Logs & Exception Handling">
        <Table columns={columns} data={attendanceLogs} keyExtractor={(r) => r.id} />
      </Card>
    </div>
  );
};
