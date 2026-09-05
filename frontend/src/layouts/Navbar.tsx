import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Clock, 
  LogOut, 
  CheckCheck, 
  Trash2, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime, AppNotification } from '../context/RealtimeContext';
import { getNormalizedRole } from './SubNav';
import { getAiAvatar } from '../lib/avatar';
import { Logo } from '../components/brand/Logo';

export interface NavbarProps {
  onToggleAttendanceWidget?: () => void;
  currentUser?: { name: string; role: string; avatar?: string };
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleAttendanceWidget,
  currentUser = { name: 'System Admin', role: 'Admin' },
}) => {
  const auth = useAuth();
  const user = auth?.user;
  const logout = auth?.logout;
  const navigate = useNavigate();

  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useRealtime();

  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const normalizedRole = getNormalizedRole(user);

  const displayName = user?.employee
    ? `${user.employee.first_name} ${user.employee.last_name}`
    : user?.email ? user.email.split('@')[0] : currentUser.name;

  const displayRole = user?.role?.name || user?.role?.id || currentUser.role;

  // AI Vector Avatar generator
  const avatarSeed = user?.employee?.first_name || displayName;
  const avatarSrc = user?.employee?.avatar_url || getAiAvatar(avatarSeed);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

  // Relative timestamp formatter
  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getStatusDot = (type: string) => {
    switch (type) {
      case 'success':
        return <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />;
      case 'warning':
        return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1" />;
      case 'error':
        return <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />;
    }
  };

  return (
    <>
      <header className="w-full sticky top-0 z-40 bg-[#12141F] shadow-[0_4px_20px_rgba(0,0,0,0.25)] border-b border-white/5">
        <div className="h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <NavLink 
            to={normalizedRole === 'employee' ? '/attendance' : '/dashboard'} 
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <Logo size="md" variant="dark" />
          </NavLink>

          {/* Right Actions Cluster */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Punch Terminal Shortcut */}
            {onToggleAttendanceWidget && (
              <button
                onClick={onToggleAttendanceWidget}
                className="flex items-center gap-1.5 bg-[#1B1E30] hover:bg-[#252945] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/10 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="hidden sm:inline">Punch Kiosk</span>
              </button>
            )}

            {/* Notifications Center */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                aria-label="Notifications"
                className={`relative p-2 rounded-full transition-all cursor-pointer ${
                  isNotifOpen 
                    ? 'bg-white/15 text-white' 
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-[#12141F] animate-pulse" />
                )}
              </button>

              {/* Minimalist, Clean Notifications Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 top-12 w-[340px] sm:w-[380px] bg-[#171A2A] text-white rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl z-50 overflow-hidden animate-fade-in">
                  
                  {/* Clean Minimal Header */}
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-primary text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          title="Mark all read"
                          className="p-1 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Mark read</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          title="Clear all"
                          className="p-1 text-slate-400 hover:text-red-400 text-xs transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotifOpen(false)}
                        className="p-1 text-slate-400 hover:text-white transition-colors ml-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Clean List Items */}
                  <div className="max-h-[340px] overflow-y-auto p-1.5 divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notif: AppNotification) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            if (notif.actionUrl) {
                              navigate(notif.actionUrl);
                              setIsNotifOpen(false);
                            }
                          }}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                            notif.read
                              ? 'hover:bg-white/5 opacity-70 hover:opacity-100'
                              : 'bg-white/[0.04] hover:bg-white/[0.08]'
                          }`}
                        >
                          {getStatusDot(notif.type)}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-white truncate">
                                {notif.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                {formatTimeAgo(notif.timestamp)}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">
                              {notif.message}
                            </p>

                            {notif.actionUrl && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-primary hover:underline">
                                <span>View</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Clickable User Profile Chip - Redirects to default profile feature */}
            <button
              type="button"
              onClick={() => {
                const targetEmpId = user?.employee?.id || 
                  (user?.email?.includes('admin') ? 'emp_admin' :
                   user?.email?.includes('hr') ? 'emp_hrmgr' :
                   user?.email?.includes('payroll') ? 'emp_payroll' :
                   user?.email?.includes('amara') ? 'emp_amara' : 'emp_admin');
                navigate(`/employees/${targetEmpId}`);
              }}
              title="View & Edit Profile Details"
              className="flex items-center gap-2.5 pl-2 py-1 pr-2 rounded-full hover:bg-white/10 border-l border-white/10 transition-all text-left cursor-pointer group"
            >
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover ring-1.5 ring-white/20 group-hover:ring-primary shadow-sm shrink-0 transition-all bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAiAvatar(avatarSeed);
                }}
              />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-white leading-tight group-hover:text-primary-200 transition-colors">
                  {displayName}
                </span>
                <span className="text-[10px] text-[#A5B4FC] font-medium leading-tight">
                  {displayRole}
                </span>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors ml-0.5 opacity-60 group-hover:opacity-100" />
            </button>

            {/* Direct Logout Action */}
            {logout && (
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-red-500/20 rounded-full transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
