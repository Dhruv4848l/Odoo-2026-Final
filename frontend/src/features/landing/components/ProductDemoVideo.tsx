import React, { useEffect, useState } from 'react';
import {
  Users,
  FileSignature,
  CalendarDays,
  Clock,
  Calculator,
  Bell,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  BadgeCheck,
  Send,
  Lock,
} from 'lucide-react';

export const ProductDemoVideo: React.FC = () => {
  // Video step: 0: Contract, 1: Attendance, 2: Payroll Engine, 3: Notification
  const [step, setStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(37);

  // 16-second total loop (4 seconds per chapter)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.05;
        if (next >= 16) {
          return 0;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Update step and trigger click animations at specific timestamps
  useEffect(() => {
    const currentStep = Math.floor(progress / 4);
    setStep(currentStep);

    const timeInStep = progress % 4;
    // Trigger click ripple at 1.4s into each step
    if (timeInStep >= 1.35 && timeInStep <= 1.65) {
      setIsClicking(true);
    } else {
      setIsClicking(false);
    }

    if (currentStep === 1) {
      setTimerSeconds((prev) => (prev % 60) + 1);
    }
  }, [progress]);

  // Dynamic cursor coordinates based on step
  const getCursorPos = () => {
    const timeInStep = progress % 4;
    const progressInStep = Math.min(Math.max(timeInStep / 1.4, 0), 1);

    // Easing helper
    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    const easedProgress = ease(progressInStep);

    switch (step) {
      case 0: // Contract creation
        return {
          x: 160 + (220 - 160) * easedProgress,
          y: 280 + (145 - 280) * easedProgress,
        };
      case 1: // Attendance check-in
        return {
          x: 220 + (320 - 220) * easedProgress,
          y: 145 + (225 - 145) * easedProgress,
        };
      case 2: // Compute payrun
        return {
          x: 320 + (340 - 320) * easedProgress,
          y: 225 + (355 - 225) * easedProgress,
        };
      case 3: // Notification bell
        return {
          x: 340 + (385 - 340) * easedProgress,
          y: 355 + (42 - 355) * easedProgress,
        };
      default:
        return { x: 200, y: 200 };
    }
  };

  // Zoom transform based on active step
  const getStageZoom = () => {
    switch (step) {
      case 0:
        return 'scale(1.04) translate(6px, 12px)';
      case 1:
        return 'scale(1.05) translate(-10px, 8px)';
      case 2:
        return 'scale(1.05) translate(0px, -18px)';
      case 3:
        return 'scale(1.07) translate(-36px, 32px)';
      default:
        return 'scale(1) translate(0px, 0px)';
    }
  };

  const cursorPos = getCursorPos();

  return (
    <div className="product-video-shell">
      {/* Chrome Window Header */}
      <div className="video-window-bar">
        <div className="window-dots">
          <span className="dot dot-red"></span>
          <span className="dot dot-yellow"></span>
          <span className="dot dot-green"></span>
        </div>
        <div className="window-address-pill">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>app.peoplepay360.com/payroll</span>
        </div>
        <div className="window-live-tag">
          <span className="live-rec-dot"></span>
          <span>TOUR DEMO</span>
        </div>
      </div>

      {/* Main Video Viewport with Smooth Camera Zoom */}
      <div className="video-viewport">
        <div
          className="video-stage-canvas"
          style={{
            transform: getStageZoom(),
            transition: 'transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Top App Header inside the Mockup */}
          <div className="mock-app-header">
            <div className="mock-app-brand">
              <div className="mock-brand-icon">P</div>
              <div>
                <strong>PeoplePay360</strong>
                <small>Connected HR &amp; Payroll</small>
              </div>
            </div>

            <div className="mock-header-actions">
              <div
                className={`mock-bell-btn ${step === 3 ? 'bell-highlight' : ''}`}
              >
                <Bell className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                <span className="bell-badge-count">1</span>
              </div>
            </div>
          </div>

          {/* Toast Notification (pops open on Step 3) */}
          <div
            className={`mock-notification-toast ${
              step === 3 ? 'toast-open' : ''
            }`}
          >
            <div className="toast-icon">
              <BadgeCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="toast-body">
              <strong>Payslip Ready &amp; Emailed</strong>
              <small>Delivered to amara.chen@peoplepay360.com</small>
            </div>
            <Send className="w-3.5 h-3.5 text-primary ml-auto" />
          </div>

          {/* Module 1 & 2 Cards Row */}
          <div className="mock-grid-row">
            {/* Contract Card */}
            <div
              className={`mock-card ${step === 0 ? 'active-card-glow' : ''}`}
            >
              <div className="mock-card-head">
                <span className="mock-card-label">
                  <FileSignature className="w-3.5 h-3.5 text-blue-500" />
                  Contract Guard
                </span>
                <span className="mock-badge-success">Active</span>
              </div>
              <div className="mock-emp-row">
                <div className="mock-avatar">AC</div>
                <div>
                  <div className="mock-emp-name">Amara Chen</div>
                  <div className="mock-emp-role">Store Supervisor</div>
                </div>
              </div>
              <div className="mock-contract-wage">
                <small>Contract Wage</small>
                <strong>$4,500.00 / mo</strong>
              </div>
              <div className="mock-contract-check">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero Overlap Guard Passed</span>
              </div>
            </div>

            {/* Attendance Card */}
            <div
              className={`mock-card ${step === 1 ? 'active-card-glow' : ''}`}
            >
              <div className="mock-card-head">
                <span className="mock-card-label">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Presence Kiosk
                </span>
                <span className="mock-badge-live">Live</span>
              </div>
              <div className="mock-attendance-status">
                <div className="attendance-pill">
                  <span className="pulse-green-dot"></span>
                  <strong>Checked In</strong>
                </div>
                <span className="attendance-time">09:00:{String(timerSeconds).padStart(2, '0')} AM</span>
              </div>
              <div className="mock-hours-progress">
                <div className="hours-text">
                  <span>Monthly Hours</span>
                  <strong>160.0 hrs (98.5%)</strong>
                </div>
                <div className="mock-progress-track">
                  <div
                    className="mock-progress-bar"
                    style={{ width: step >= 1 ? '98%' : '75%' }}
                  ></div>
                </div>
              </div>
              <button
                className={`mock-punch-btn ${
                  step === 1 ? 'punch-btn-clicked' : ''
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Attendance Verified</span>
              </button>
            </div>
          </div>

          {/* Module 3: Live Payroll Calculation Engine */}
          <div
            className={`mock-payroll-box ${
              step >= 2 ? 'active-payroll-glow' : ''
            }`}
          >
            <div className="mock-payroll-head">
              <div className="mock-payroll-title">
                <Calculator className="w-4 h-4 text-primary" />
                <span>Sequenced Payrun Engine</span>
              </div>
              <div className="mock-step-pills">
                <span className="step-pill done">1. Contract ✓</span>
                <span className="step-pill done">2. Hours ✓</span>
                <span
                  className={`step-pill ${step >= 2 ? 'done' : 'pending'}`}
                >
                  3. Computed
                </span>
              </div>
            </div>

            <div className="mock-calc-row">
              <div className="calc-item">
                <small>Basic Salary</small>
                <strong>$4,500.00</strong>
              </div>
              <span className="calc-operator">+</span>
              <div className="calc-item">
                <small>Allowance</small>
                <strong className="text-emerald-500">+$450.00</strong>
              </div>
              <span className="calc-operator">-</span>
              <div className="calc-item">
                <small>Tax &amp; Deduct</small>
                <strong className="text-red-400">-$380.00</strong>
              </div>
              <span className="calc-operator">=</span>
              <div className="calc-item calc-total">
                <small>Net Verified Pay</small>
                <strong className="text-primary">$4,570.00</strong>
              </div>
            </div>

            <div className="mock-payroll-footer">
              <div className="mock-verified-stamp">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span>Rule Engine Reconciled &amp; Locked</span>
              </div>
              <div className="mock-action-run-btn">
                <span>Payrun Disbursed</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Animated Realistic Moving Cursor */}
        <div
          className="demo-animated-cursor"
          style={{
            transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`,
          }}
        >
          {/* SVG Mouse Pointer */}
          <svg
            className={`cursor-pointer-svg ${isClicking ? 'cursor-pressed' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            width="28"
            height="28"
          >
            <path
              d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
              fill="#5B4FE9"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>

          {/* Click Ripple Effect */}
          {isClicking && <span className="cursor-click-ripple"></span>}
        </div>
      </div>

      {/* Video Progress Controls Bar */}
      <div className="video-timeline-footer">
        <div className="timeline-chapters">
          <div
            className={`timeline-tab ${step === 0 ? 'tab-active' : ''}`}
            onClick={() => setProgress(0)}
          >
            <span className="tab-number">1</span>
            <span className="tab-title">Contract Setup</span>
            <div className="tab-progress-track">
              <div
                className="tab-progress-bar"
                style={{
                  width:
                    step === 0
                      ? `${((progress % 4) / 4) * 100}%`
                      : step > 0
                      ? '100%'
                      : '0%',
                }}
              ></div>
            </div>
          </div>

          <div
            className={`timeline-tab ${step === 1 ? 'tab-active' : ''}`}
            onClick={() => setProgress(4)}
          >
            <span className="tab-number">2</span>
            <span className="tab-title">Attendance Punch</span>
            <div className="tab-progress-track">
              <div
                className="tab-progress-bar"
                style={{
                  width:
                    step === 1
                      ? `${((progress % 4) / 4) * 100}%`
                      : step > 1
                      ? '100%'
                      : '0%',
                }}
              ></div>
            </div>
          </div>

          <div
            className={`timeline-tab ${step === 2 ? 'tab-active' : ''}`}
            onClick={() => setProgress(8)}
          >
            <span className="tab-number">3</span>
            <span className="tab-title">Payrun Engine</span>
            <div className="tab-progress-track">
              <div
                className="tab-progress-bar"
                style={{
                  width:
                    step === 2
                      ? `${((progress % 4) / 4) * 100}%`
                      : step > 2
                      ? '100%'
                      : '0%',
                }}
              ></div>
            </div>
          </div>

          <div
            className={`timeline-tab ${step === 3 ? 'tab-active' : ''}`}
            onClick={() => setProgress(12)}
          >
            <span className="tab-number">4</span>
            <span className="tab-title">Payslip Sent</span>
            <div className="tab-progress-track">
              <div
                className="tab-progress-bar"
                style={{
                  width:
                    step === 3
                      ? `${((progress % 4) / 4) * 100}%`
                      : '0%',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
