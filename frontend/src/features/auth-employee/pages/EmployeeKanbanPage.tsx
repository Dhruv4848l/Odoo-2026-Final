import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input, Select } from '../../../components/ui/Input';
import { apiRequest } from '../../../lib/api';
import { LayoutGrid, List, Plus, Search, Mail, Phone, Building2 } from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';

export const EmployeeKanbanPage: React.FC = () => {
  const { user } = useAuth();
  const isEmployeeRole = user?.role?.id === 'employee';

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (deptFilter) params.append('department_id', deptFilter);

      const res = await apiRequest(`/employees?${params.toString()}`);
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiRequest('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [search, deptFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Employees Directory</h1>
          <p className="text-sm text-slate">Manage company headcount, profiles, contracts & schedules</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Kanban / List Toggle */}
          <div className="bg-white border border-border rounded-md p-1 flex items-center gap-1 shadow-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-sm text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'kanban' ? 'bg-primary text-white' : 'text-slate hover:text-ink'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-sm text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'list' ? 'bg-primary text-white' : 'text-slate hover:text-ink'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {!isEmployeeRole && (
            <Button variant="primary" onClick={() => navigate('/employees/new')}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Employee
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Controls */}
      <Card className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm bg-canvas border border-border rounded-md focus:outline-none focus:border-primary"
          />
        </div>

        <div className="w-full md:w-64">
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>
      </Card>

      {/* View Content */}
      {loading ? (
        <div className="text-center py-12 text-slate text-sm">Loading employees...</div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp) => (
            <Card
              key={emp.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col gap-4"
              onClick={() => navigate(`/employees/${emp.id}`)}
            >
              <div className="flex items-start gap-3">
                <img
                  src={emp.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.first_name}`}
                  alt={emp.first_name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <h3 className="text-base font-bold text-ink truncate">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <span className="text-xs text-slate font-medium truncate">{emp.job_position}</span>
                  <div className="mt-1">
                    <Badge status={emp.status === 'active' ? 'active' : 'inactive'} />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex flex-col gap-1.5 text-xs text-slate">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{emp.department?.name || 'No Dept'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas border-b border-border text-slate text-xs font-semibold uppercase">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Job Position</th>
                <th className="p-4">Department</th>
                <th className="p-4">Hire Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="hover:bg-primary-light/40 cursor-pointer transition-colors"
                >
                  <td className="p-4 flex items-center gap-3 font-semibold text-ink">
                    <img
                      src={emp.avatar_url}
                      alt={emp.first_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span>
                      {emp.first_name} {emp.last_name}
                    </span>
                  </td>
                  <td className="p-4 text-slate">{emp.job_position}</td>
                  <td className="p-4 text-slate">{emp.department?.name || '—'}</td>
                  <td className="p-4 text-slate">{emp.hire_date}</td>
                  <td className="p-4">
                    <Badge status={emp.status === 'active' ? 'active' : 'inactive'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
