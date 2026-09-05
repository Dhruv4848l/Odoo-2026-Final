import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  Sparkles,
  ShieldCheck,
  KeyRound,
  Users,
  FileSignature,
  CalendarDays,
  Clock,
  Calculator,
  BarChart3,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Sun,
  Moon,
  ArrowRight,
  Layers,
  Building2,
  FileText,
  Lock,
} from 'lucide-react';
import { ProductDemoVideo } from '../components/ProductDemoVideo';
import '../landing.css';

gsap.registerPlugin(ScrollTrigger);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Theme & Navigation State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [navScrolled, setNavScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeRoleIndex, setActiveRoleIndex] = useState<number | null>(null);
  const [timerText, setTimerText] = useState<string>('02:14:37');

  // DOM Refs
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);
  const spineFillRef = useRef<HTMLDivElement | null>(null);
  const stepperFillRef = useRef<HTMLDivElement | null>(null);
  const miniChartRef = useRef<HTMLDivElement | null>(null);

  // 1. Theme initialization & sync
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme === 'dark' ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // 2. Lenis Smooth Scroll Engine & GSAP Synchronization
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.8,
    });

    // Synchronize Lenis scroll updates with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis with GSAP's optimized ticker for 60/120fps smoothness
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // Intercept in-page anchor links for momentum smooth scrolling
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        const targetEl = document.querySelector(href);
        if (targetEl) {
          lenis.scrollTo(targetEl as HTMLElement, { offset: -70, duration: 1.2 });
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, []);

  // 3. Navigation scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Attendance Timer Tick
  useEffect(() => {
    let secs = 2 * 3600 + 14 * 60 + 37;
    const interval = setInterval(() => {
      secs++;
      const h = String(Math.floor(secs / 3600)).padStart(2, '0');
      const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      setTimerText(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 4. Cursor glow tracking & magnetic buttons & tilt cards
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer:fine)').matches;

    // Cursor Glow
    const handleMouseMoveGlow = (e: MouseEvent) => {
      if (cursorGlowRef.current && finePointer && !reduced) {
        gsap.to(cursorGlowRef.current, {
          left: e.clientX,
          top: e.clientY,
          duration: 0.45,
          ease: 'power2.out',
        });
      }
    };
    if (finePointer && !reduced) {
      window.addEventListener('mousemove', handleMouseMoveGlow);
    }

    // Magnetic Buttons
    const magneticEls = document.querySelectorAll<HTMLElement>('.magnetic');
    const magneticCleanups: Array<() => void> = [];

    if (!reduced) {
      magneticEls.forEach((btn) => {
        const move = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * 0.25;
          const y = (e.clientY - r.top - r.height / 2) * 0.35;
          gsap.to(btn, { x, y, duration: 0.35, ease: 'power2.out' });
        };
        const leave = () => {
          gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        };
        btn.addEventListener('mousemove', move);
        btn.addEventListener('mouseleave', leave);
        magneticCleanups.push(() => {
          btn.removeEventListener('mousemove', move);
          btn.removeEventListener('mouseleave', leave);
        });
      });
    }

    // Tilt on cards
    const tiltEls = document.querySelectorAll<HTMLElement>('.landing-card, .kpi-card, .cta-panel');
    const tiltCleanups: Array<() => void> = [];

    if (finePointer && !reduced) {
      tiltEls.forEach((el) => {
        const move = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(el, {
            rotateX: py * -6,
            rotateY: px * 6,
            transformPerspective: 950,
            duration: 0.4,
            ease: 'power2.out',
          });
        };
        const leave = () => {
          gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
        };
        el.addEventListener('mousemove', move);
        el.addEventListener('mouseleave', leave);
        tiltCleanups.push(() => {
          el.removeEventListener('mousemove', move);
          el.removeEventListener('mouseleave', leave);
        });
      });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlow);
      magneticCleanups.forEach((fn) => fn());
      tiltCleanups.forEach((fn) => fn());
    };
  }, []);

  // 5. Hero Entrance animation
  useEffect(() => {
    gsap
      .timeline()
      .to('.hero .reveal-el', { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out' })
      .to('.hero-right-stage', { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' }, '-=0.6');
  }, []);

  // 6. GSAP ScrollTrigger Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal Elements on scroll
      gsap.utils.toArray<HTMLElement>('.reveal-el').forEach((el) => {
        if (el.closest('.hero')) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 26 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          }
        );
      });

      // Count Up KPIs
      document.querySelectorAll<HTMLElement>('.count').forEach((el) => {
        const target = +(el.dataset.count || 0);
        ScrollTrigger.create({
          trigger: el,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            const obj = { v: 0 };
            gsap.to(obj, {
              v: target,
              duration: 1.3,
              ease: 'power1.out',
              onUpdate: () => {
                el.textContent = String(Math.round(obj.v));
              },
            });
          },
        });
      });

      // Timeline Spine Fill
      if (spineFillRef.current) {
        ScrollTrigger.create({
          trigger: '.timeline',
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: 0.5,
          onUpdate: (self) => {
            if (spineFillRef.current) {
              spineFillRef.current.style.height = self.progress * 100 + '%';
            }
          },
        });
      }

      // Stepper Fill
      if (stepperFillRef.current) {
        ScrollTrigger.create({
          trigger: stepperFillRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(stepperFillRef.current, { width: '55%', duration: 1.1, ease: 'power2.out' });
          },
        });
      }

      // Mini Chart Bars
      if (miniChartRef.current) {
        ScrollTrigger.create({
          trigger: miniChartRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            const bars = miniChartRef.current?.querySelectorAll<HTMLElement>('div');
            bars?.forEach((bar, i) => {
              const h = bar.style.getPropertyValue('--h');
              gsap.to(bar, { height: h, duration: 0.9, delay: i * 0.07, ease: 'power3.out' });
            });
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing-body-wrap">
      {/* Noise Grain Overlay */}
      <div className="grain"></div>

      {/* Radial Cursor Glow Tracking */}
      <div className="cursor-glow" id="cursorGlow" ref={cursorGlowRef}></div>

      {/* Modern Floating Header Navigation */}
      <div className="landing-nav-wrapper">
        <header className={`landing-nav ${navScrolled ? 'scrolled' : ''}`} id="nav">
          <div className="nav-inner">
            <a className="brand" href="#top">
              <span className="brand-badge">P</span>
              <span className="brand-text">
                <strong>PeoplePay360</strong>
                <small>Connected HR &amp; Payroll</small>
              </span>
            </a>

            <nav
              className="nav-links"
              style={
                mobileMenuOpen
                  ? {
                      display: 'flex',
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      right: 0,
                      background: 'var(--surface)',
                      flexDirection: 'column',
                      padding: '20px 24px',
                      gap: '16px',
                      borderRadius: '18px',
                      border: '1px solid var(--border)',
                      boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                    }
                  : {}
              }
            >
              <a href="#stack" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
              <a href="#security" onClick={() => setMobileMenuOpen(false)}>
                Role Security
              </a>
              <a href="#stack" onClick={() => setMobileMenuOpen(false)}>
                HR Modules
              </a>
              <a href="#stack" onClick={() => setMobileMenuOpen(false)}>
                Payroll Engine
              </a>
              <a href="#story" onClick={() => setMobileMenuOpen(false)}>
                Scenario Tour
              </a>
            </nav>

            <div className="nav-actions">
              <button
                className="theme-toggle"
                id="themeToggle"
                aria-label="Toggle color theme"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              {/* Single Primary Action Button */}
              <button className="landing-btn btn-primary magnetic shadow-glow" onClick={() => navigate('/login')}>
                <span>Launch Platform</span>
                <ArrowRight className="w-3.5 h-3.5 arrow" />
              </button>
            </div>

            <button
              className="nav-burger"
              id="navBurger"
              aria-label="Menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </header>
      </div>

      <main id="top">
        {/* HERO SECTION - FULL VIEWPORT HEIGHT */}
        <section className="hero">
          <div className="hero-bg">
            <span className="blob-1"></span>
            <span className="blob-2"></span>
          </div>
          <div className="hero-grid"></div>

          <div className="hero-inner">
            {/* Left Column: Modern High-Impact Copy */}
            <div className="hero-copy">
              <div className="badge-modern reveal-el">
                <span className="live-ping-dot"></span>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Automated Headcount-to-Payroll Intelligence</span>
              </div>

              <h1 className="reveal-el hero-title-modern">
                Reconcile <span className="text-highlight">Headcount</span>,{' '}
                <span className="text-highlight">Contracts</span> &amp;{' '}
                <span className="text-highlight">Payroll</span> in{' '}
                <span className="hero-gradient-text">One Connected Flow</span>.
              </h1>

              <p className="hero-sub-modern reveal-el">
                Eliminate fragmented spreadsheets and sync errors. PeoplePay360 connects{' '}
                <strong>employee profiles</strong>, <strong>contract overlap guards</strong>,{' '}
                <strong>shift patterns</strong>, and <strong>live attendance logs</strong> directly into{' '}
                <strong>rule-sequenced, audit-proof payslips</strong> — in one unified pipeline.
              </p>

              <div className="hero-ctas reveal-el">
                <button
                  className="landing-btn btn-primary btn-lg magnetic shadow-glow"
                  onClick={() => navigate('/login')}
                >
                  <span>Launch Platform</span>
                  <ArrowRight className="w-4 h-4 arrow" />
                </button>

                <button
                  className="landing-btn btn-ghost btn-lg magnetic"
                  onClick={() => navigate('/login')}
                >
                  <KeyRound className="w-4 h-4 text-primary" />
                  <span>Sign In with Demo Roles</span>
                </button>
              </div>

              {/* High-Impact Value Metric Pills */}
              <div className="hero-feature-pills reveal-el">
                <div className="feat-pill">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span><strong>100%</strong> Rule Accuracy</span>
                </div>
                <div className="feat-pill">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span><strong>Zero Overlap</strong> Guard</span>
                </div>
                <div className="feat-pill">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span><strong>5-Tier</strong> RBAC Gated</span>
                </div>
              </div>
            </div>

            {/* Right Column: Product Introduction Video Simulation Component */}
            <div className="hero-right-stage reveal-el">
              <ProductDemoVideo />
            </div>
          </div>

          <div className="scroll-cue">
            <span>Scroll</span>
            <span className="line"></span>
          </div>
        </section>

        {/* KPI STRIP */}
        <section className="kpi-strip">
          <div className="kpi-grid">
            <div className="kpi-card reveal-el">
              <div className="kpi-top-row">
                <div className="kpi-icon-pill">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="kpi-value">
                  <span className="count" data-count="100">
                    0
                  </span>
                  %
                </span>
              </div>
              <div className="kpi-label">Reconciliation Accuracy</div>
              <div className="kpi-desc">Rule-by-rule verification, Basic through Net pay with zero error tolerance.</div>
            </div>

            <div className="kpi-card reveal-el">
              <div className="kpi-top-row">
                <div className="kpi-icon-pill">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="kpi-value">
                  <span className="count" data-count="5">
                    0
                  </span>{' '}
                  Tiers
                </span>
              </div>
              <div className="kpi-label">Enforced Role Matrix</div>
              <div className="kpi-desc">Strict server-side RBAC from self-service employee up to system admin.</div>
            </div>

            <div className="kpi-card reveal-el">
              <div className="kpi-top-row">
                <div className="kpi-icon-pill">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="kpi-value">
                  <span className="live-dot"></span>&nbsp;Live
                </div>
              </div>
              <div className="kpi-label">Supabase Cloud Postgres</div>
              <div className="kpi-desc">Centralized relational database, real-time presence &amp; payrun state.</div>
            </div>

            <div className="kpi-card reveal-el">
              <div className="kpi-top-row">
                <div className="kpi-icon-pill">
                  <Users className="w-4 h-4" />
                </div>
                <span className="kpi-value">
                  <span className="count" data-count="4">
                    0
                  </span>{' '}
                  Squads
                </span>
              </div>
              <div className="kpi-label">Squad Architecture</div>
              <div className="kpi-desc">Conflict-free, modular feature isolation across HR, time-off, and payroll.</div>
            </div>
          </div>
        </section>

        {/* BENTO STACK FEATURES */}
        <section id="stack" className="stack">
          <div className="section-head reveal-el">
            <span className="tag">
              <Layers className="w-3.5 h-3.5" />
              <span>Platform Modules</span>
            </span>
            <h2>One operational stack, six connected modules</h2>
            <p>Every screen writes into the same chain — nothing lives in isolation.</p>
          </div>

          <div className="bento-grid">
            {/* Employee Hub */}
            <div className="landing-card card-light reveal-el">
              <div className="card-icon">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3>Employee Hub &amp; Navigation</h3>
              <p className="card-desc">
                A centralized headcount directory with Kanban, list, and form views. Jump straight to contracts,
                attendance, or time off from any profile.
              </p>
              <div className="mv-stats">
                <span className="mv-chip">
                  <FileText className="w-3.5 h-3.5" /> Contracts (2)
                </span>
                <span className="mv-chip">
                  <Clock className="w-3.5 h-3.5" /> Attendance (98%)
                </span>
                <span className="mv-chip">
                  <CalendarDays className="w-3.5 h-3.5" /> Time Off (3)
                </span>
              </div>
            </div>

            {/* Contract Management */}
            <div className="landing-card card-dark reveal-el">
              <div className="card-icon">
                <FileSignature className="w-5 h-5 text-blue-400" />
              </div>
              <h3>Contract Management &amp; Overlap Guard</h3>
              <p className="card-desc">
                Full contract history per employee, with the active wage always resolved for the period in question.
              </p>
              <div className="mv-overlap">
                <div className="mv-bar-row">
                  <div className="mv-bar"></div>
                  <div className="mv-bar b2"></div>
                </div>
                <span className="mv-flag">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                  <span>Concurrent active contract blocked</span>
                </span>
              </div>
            </div>

            {/* Working Schedule */}
            <div className="landing-card card-dark reveal-el">
              <div className="card-icon">
                <CalendarDays className="w-5 h-5 text-emerald-400" />
              </div>
              <h3>Working Schedule Pattern Builder</h3>
              <p className="card-desc">
                Build a Monday-to-Sunday pattern with start times, end times, and lunch breaks. Weekly hours total
                themselves automatically.
              </p>
              <div className="mv-week">
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div className="weekend">S</div>
                <div className="weekend">S</div>
              </div>
            </div>

            {/* Attendance Widget */}
            <div className="landing-card card-light reveal-el">
              <div className="card-icon">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <h3>Attendance &amp; Presence Widget</h3>
              <p className="card-desc">
                A check-in widget tracks time in real time, flags missed checkouts, and logs every manual supervisor
                correction with an audit trail.
              </p>
              <div className="mv-timer">
                <i></i>
                <span id="timerText">{timerText}</span>
              </div>
            </div>

            {/* Sequenced Payroll Engine */}
            <div className="landing-card card-wide card-light reveal-el">
              <div>
                <div className="card-icon">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <h3>Sequenced Payroll Engine &amp; Payruns</h3>
                <p className="card-desc">
                  A multi-step wizard walks through period and employee selection, then executes fixed, percentage,
                  and formula rules in sequence — before printing verified payslips and emailing them in bulk.
                </p>
              </div>
              <div className="mv-stepper-wrap">
                <div className="mv-track">
                  <div className="mv-track-fill" id="stepperFill" ref={stepperFillRef}></div>
                </div>
                <div className="mv-stepper">
                  <div className="mv-step done">
                    <div className="mv-dot">1</div>
                    <span>Period</span>
                  </div>
                  <div className="mv-step done">
                    <div className="mv-dot">2</div>
                    <span>Employees</span>
                  </div>
                  <div className="mv-step">
                    <div className="mv-dot">3</div>
                    <span>Compute</span>
                  </div>
                  <div className="mv-step">
                    <div className="mv-dot">4</div>
                    <span>Payslips</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard & Analytics */}
            <div className="landing-card card-wide card-dark reveal-el">
              <div>
                <div className="card-icon">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                </div>
                <h3>Live Payroll Dashboard &amp; Analytics</h3>
                <p className="card-desc">
                  Salary cost by department, net salary trends month over month, headcount variances, and instant alerts
                  the moment an anomaly occurs.
                </p>
              </div>
              <div className="mv-chart" id="miniChart" ref={miniChartRef}>
                <div style={{ '--h': '40%' } as React.CSSProperties}></div>
                <div style={{ '--h': '65%' } as React.CSSProperties}></div>
                <div style={{ '--h': '50%' } as React.CSSProperties}></div>
                <div style={{ '--h': '80%' } as React.CSSProperties}></div>
                <div style={{ '--h': '60%' } as React.CSSProperties}></div>
                <div style={{ '--h': '92%' } as React.CSSProperties}></div>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY & ROLE ACCORDION */}
        <section id="security" className="security">
          <div className="section-head reveal-el">
            <span className="tag">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security &amp; RBAC</span>
            </span>
            <h2>Five tiers. Zero ambiguity.</h2>
            <p>Permissions are strictly enforced at the backend query layer — not just hidden in the UI.</p>
          </div>

          <div className="role-matrix">
            {/* TIER 1 */}
            <div className={`role-card reveal-el ${activeRoleIndex === 0 ? 'active' : ''}`}>
              <div
                className="role-head"
                onClick={() => setActiveRoleIndex(activeRoleIndex === 0 ? null : 0)}
              >
                <span className="role-tier tier-1">TIER 1</span>
                <span className="role-name">Employee — Self Service</span>
                <span className="role-teaser">Self-service profile, attendance &amp; time off</span>
                <ChevronDown className="role-chevron" />
              </div>
              <div className="role-details-wrap">
                <div className="role-details">
                  <div className="role-details-inner">
                    <div className="perm-col perm-allow">
                      <h4>Authorized</h4>
                      <ul>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>View own profile and contract records</span>
                        </li>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Check in and out of attendance kiosk</span>
                        </li>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Submit leave and time-off requests</span>
                        </li>
                      </ul>
                    </div>
                    <div className="perm-col perm-deny">
                      <h4>Denied</h4>
                      <ul>
                        <li>
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>View other employees or department directory</span>
                        </li>
                        <li>
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Create or edit employment contracts</span>
                        </li>
                        <li>
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Access payroll or salary calculation screens</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIER 2 */}
            <div className={`role-card reveal-el ${activeRoleIndex === 1 ? 'active' : ''}`}>
              <div
                className="role-head"
                onClick={() => setActiveRoleIndex(activeRoleIndex === 1 ? null : 1)}
              >
                <span className="role-tier tier-2">TIER 2</span>
                <span className="role-name">HR Manager</span>
                <span className="role-teaser">Full people operations, no payroll access</span>
                <ChevronDown className="role-chevron" />
              </div>
              <div className="role-details-wrap">
                <div className="role-details">
                  <div className="role-details-inner">
                    <div className="perm-col perm-allow">
                      <h4>Authorized</h4>
                      <ul>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Full CRUD on employees, contracts, schedules, attendance</span>
                        </li>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Approve or reject time-off requests</span>
                        </li>
                      </ul>
                    </div>
                    <div className="perm-col perm-deny">
                      <h4>Denied</h4>
                      <ul>
                        <li>
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Payroll screens — strictly blocked with 403, even by direct URL</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIER 3 */}
            <div className={`role-card reveal-el ${activeRoleIndex === 2 ? 'active' : ''}`}>
              <div
                className="role-head"
                onClick={() => setActiveRoleIndex(activeRoleIndex === 2 ? null : 2)}
              >
                <span className="role-tier tier-3">TIER 3</span>
                <span className="role-name">HR Payroll User</span>
                <span className="role-teaser">Executes payruns, cannot alter formula rules</span>
                <ChevronDown className="role-chevron" />
              </div>
              <div className="role-details-wrap">
                <div className="role-details">
                  <div className="role-details-inner">
                    <div className="perm-col perm-allow">
                      <h4>Authorized</h4>
                      <ul>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Full access to HR management modules</span>
                        </li>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Create, compute, and confirm monthly payruns</span>
                        </li>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Generate, print, and email bulk payslips</span>
                        </li>
                      </ul>
                    </div>
                    <div className="perm-col perm-deny">
                      <h4>Denied</h4>
                      <ul>
                        <li>
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Salary structures and rules — read-only access</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIER 4 */}
            <div className={`role-card reveal-el ${activeRoleIndex === 3 ? 'active' : ''}`}>
              <div
                className="role-head"
                onClick={() => setActiveRoleIndex(activeRoleIndex === 3 ? null : 3)}
              >
                <span className="role-tier tier-4">TIER 4</span>
                <span className="role-name">HR Payroll Manager</span>
                <span className="role-teaser">Full rule engine, formula builder, and payrun authority</span>
                <ChevronDown className="role-chevron" />
              </div>
              <div className="role-details-wrap">
                <div className="role-details">
                  <div className="role-details-inner">
                    <div className="perm-col perm-allow">
                      <h4>Authorized</h4>
                      <ul>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Full access across HR and Payroll pipelines</span>
                        </li>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Create and modify salary rules, allowances, and formulas</span>
                        </li>
                      </ul>
                    </div>
                    <div className="perm-col perm-deny">
                      <h4>Denied</h4>
                      <ul>
                        <li>
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Platform user management and credential assignments</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIER 5 */}
            <div className={`role-card reveal-el ${activeRoleIndex === 4 ? 'active' : ''}`}>
              <div
                className="role-head"
                onClick={() => setActiveRoleIndex(activeRoleIndex === 4 ? null : 4)}
              >
                <span className="role-tier tier-5">TIER 5</span>
                <span className="role-name">System Administrator</span>
                <span className="role-teaser">Platform configuration, role administration &amp; auditing</span>
                <ChevronDown className="role-chevron" />
              </div>
              <div className="role-details-wrap">
                <div className="role-details">
                  <div className="role-details-inner">
                    <div className="perm-col perm-allow">
                      <h4>Authorized</h4>
                      <ul>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Full system and database access</span>
                        </li>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Create user accounts, grant and revoke system roles</span>
                        </li>
                        <li>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Platform security configuration &amp; audit logging</span>
                        </li>
                      </ul>
                    </div>
                    <div className="perm-col perm-deny">
                      <h4>Denied</h4>
                      <ul>
                        <li>
                          <span className="text-xs text-slate-500 font-semibold">Unrestricted root access</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STORY TIMELINE */}
        <section id="story" className="story">
          <div className="section-head reveal-el">
            <span className="tag">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Live Reconciliation Scenario</span>
            </span>
            <h2>The Amara Chen lifecycle walkthrough</h2>
            <p>One employee's journey reconciled automatically from hire to resignation.</p>
          </div>

          <div className="timeline">
            <div className="timeline-spine">
              <div className="timeline-spine-fill" id="spineFill" ref={spineFillRef}></div>
            </div>

            <div className="timeline-node reveal-el">
              <div className="timeline-dot"></div>
              <span className="timeline-date">Jan 15, 2026 — Initial Hire</span>
              <h3>Onboarded as Sales Associate</h3>
              <p>Contract created at $4,500/month on a standard 40-hour weekly schedule pattern.</p>
            </div>

            <div className="timeline-node reveal-el">
              <div className="timeline-dot"></div>
              <span className="timeline-date">Jun 1, 2026 — Promotion</span>
              <h3>Promoted to Store Supervisor</h3>
              <p>Her previous contract closes May 31. The overlap check passes with zero conflict.</p>
            </div>

            <div className="timeline-node reveal-el">
              <div className="timeline-dot"></div>
              <span className="timeline-date">Sep 10, 2026 — Parental Leave</span>
              <h3>Approved Paid Leave</h3>
              <p>Drawn against her time-off allocation with basic salary preserved and verified.</p>
            </div>

            <div className="timeline-node reveal-el">
              <div className="timeline-dot"></div>
              <span className="timeline-date">Nov 20, 2026 — Resignation</span>
              <h3>Prorated Final Payrun</h3>
              <p>November payslip prorates automatically to day 20. December's payrun omits her entirely.</p>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="cta-banner">
          <div className="cta-panel reveal-el">
            <div className="cta-copy">
              <h2>Ready to experience PeoplePay360?</h2>
              <p>
                Sign in with pre-seeded demo accounts, or test the role boundaries yourself live on the platform.
              </p>
              <button className="landing-btn btn-dark btn-lg magnetic" onClick={() => navigate('/login')}>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4 arrow" />
              </button>
            </div>
            <div className="cta-visual">
              <span className="cta-shape shape-a"></span>
              <span className="cta-shape shape-b"></span>
              <span className="cta-shape shape-c"></span>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <div className="brand">
              <span className="brand-badge">P</span>
              <span className="brand-text">
                <strong>PeoplePay360</strong>
                <small>HR &amp; Payroll Platform</small>
              </span>
            </div>
            <p>
              Reconciles headcount, contracts, schedules, attendance, and salary rules into one verified payslip — built
              on a centralized Supabase Postgres database.
            </p>
          </div>
          <div className="footer-col">
            <h4>HR Modules</h4>
            <ul>
              <li>
                <a href="#stack">Employee Directory</a>
              </li>
              <li>
                <a href="#stack">Contract Management</a>
              </li>
              <li>
                <a href="#stack">Working Schedules</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Time &amp; Payroll</h4>
            <ul>
              <li>
                <a href="#stack">Attendance Logs</a>
              </li>
              <li>
                <a href="#stack">Time Off &amp; Allocations</a>
              </li>
              <li>
                <a href="#stack">Payrun Engine</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li>
                <a href="#stack">Payroll Analytics</a>
              </li>
              <li>
                <a href="#security">Role Access Control</a>
              </li>
              <li>
                <a href="#stack">Supabase DB</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">© 2026 PeoplePay360 Operations Platform. All rights reserved.</div>
      </footer>
    </div>
  );
};
