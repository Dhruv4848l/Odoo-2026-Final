import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { apiRequest } from '../../../lib/api';
import { LayoutGrid, List, Plus, Search, Mail, Building2, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getNormalizedRole } from '../../../layouts/SubNav';
import { getAiAvatar } from '../../../lib/avatar';

export const EmployeeKanbanPage: React.FC = () => {
  const { user } = useAuth();
  const normalizedRole = getNormalizedRole(user);
  const isEmployeeRole = normalizedRole === 'employee';

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);

  // Pagination State (Default 8 items: 2 rows × 4 columns grid)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (deptFilter) params.append('department_id', deptFilter);

      const res = await apiRequest(`/employees?${params.toString()}`);
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiRequest('/departments');
      setDepartments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [search, deptFilter]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter]);

  // Pagination Computations
  const totalItems = employees.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedEmployees = employees.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              Workforce Directory
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs">Total Headcount: {totalItems}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#12141F] tracking-tight">Employees Roster</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage company personnel, job roles, linked contracts, and working schedules</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Kanban / List Toggle Pills */}
          <div className="bg-white border border-slate-200/80 rounded-full p-1 flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-primary text-white shadow-glow' : 'text-slate-600 hover:text-[#12141F]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-primary text-white shadow-glow' : 'text-slate-600 hover:text-[#12141F]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {!isEmployeeRole && (
            <Button variant="primary" className="gap-2 shadow-fintech" onClick={() => navigate('/employees/new')}>
              <Plus className="w-4 h-4" />
              <span>New Employee</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Capsule Bar with Top Quick-Navigator */}
      <div className="bg-white p-3 rounded-[24px] shadow-sm border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, job role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200/80 rounded-full text-[#12141F] placeholder:text-slate-400 outline-none focus:border-primary font-medium"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200/80 rounded-full text-xs text-[#12141F] font-medium outline-none focus:border-primary"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top Quick Navigation Bar */}
        {totalItems > 0 && (
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              Page <span className="font-bold text-[#12141F]">{currentPage}</span> of{' '}
              <span className="font-bold text-[#12141F]">{totalPages}</span>
              <span className="hidden sm:inline text-slate-400 ml-1">
                ({startIndex + 1}–{endIndex} of {totalItems})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Content */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-[24px] border border-slate-100 shadow-sm text-slate-400 text-xs font-semibold">
          Loading employees directory...
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-fintech hover:shadow-fintech-hover transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={emp.avatar_url || getAiAvatar(emp.first_name)}
                      alt={emp.first_name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 shrink-0 group-hover:ring-primary transition-all bg-slate-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getAiAvatar(emp.first_name);
                      }}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[#12141F] truncate group-hover:text-primary transition-colors">
                        {emp.first_name} {emp.last_name}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium truncate">{emp.job_position}</span>
                      <div className="mt-1.5">
                        <Badge status={emp.status === 'active' ? 'Approved' : 'Draft'} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate font-medium">{emp.department?.name || 'General Org'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate text-slate-500 text-[11px]">{emp.email}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-primary font-semibold">
                  <span>View Profile</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
            {paginatedEmployees.length === 0 && (
              <div className="col-span-full p-12 bg-white rounded-[24px] border border-slate-100 text-center text-slate-400 text-xs">
                No employees found matching the filter.
              </div>
            )}
          </div>

          {/* Bottom Full Numbered Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[8, 16, 24, 32]}
            itemLabel="employees"
          />
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          <Card title="Employee Records" subtitle="Overview of personnel details, departments, and active statuses">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Job Position</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Hire Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-[#12141F]">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatar_url || getAiAvatar(emp.first_name)}
                            alt={emp.first_name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/20 bg-slate-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getAiAvatar(emp.first_name);
                            }}
                          />
                          <span>{emp.first_name} {emp.last_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{emp.job_position}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-700">
                          {emp.department?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{emp.hire_date || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge status={emp.status === 'active' ? 'Approved' : 'Draft'} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" className="rounded-full text-xs">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {paginatedEmployees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No employees found matching the filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Bottom Full Numbered Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[8, 16, 24, 32]}
            itemLabel="employees"
          />
        </div>
      )}
    </div>
  );
};
