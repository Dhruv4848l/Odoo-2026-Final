import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from '../../../components/brand/Logo';
import { HeroSection } from '../components/HeroSection';
import { EcosystemStrip } from '../components/EcosystemStrip';
import { StorySection } from '../components/StorySection';
import { ProductDemoVideo } from '../components/ProductDemoVideo';
import { FeatureGridSection } from '../components/FeatureGridSection';
import { SecurityRBACSection } from '../components/SecurityRBACSection';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';
import '../landing.css';

gsap.registerPlugin(ScrollTrigger);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [navScrolled, setNavScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);

  // 1. Force Light Mode Only
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  // 2. Lenis Smooth Scroll Engine & GSAP Synchronization
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.8,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // Anchor smooth scrolling
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        const targetEl = document.querySelector(href);
        if (targetEl) {
          lenis.scrollTo(targetEl as HTMLElement, { offset: -80, duration: 1.2 });
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

  // 3. Navbar scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 4. Cursor glow tracking
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer:fine)').matches;

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

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlow);
    };
  }, []);

  return (
    <div className="landing-body-wrap bg-[#F8F9FD] text-[#0F172A] min-h-screen">
      {/* Noise Grain Overlay */}
      <div className="grain pointer-events-none"></div>

      {/* Subtle Cursor Glow */}
      <div className="cursor-glow pointer-events-none" id="cursorGlow" ref={cursorGlowRef}></div>

      {/* ================= FLOATING GLASS NAVBAR (LIGHT THEME ONLY) ================= */}
      <div className="landing-nav-wrapper">
        <header className={`landing-nav ${navScrolled ? 'scrolled' : ''}`} id="nav">
          <div className="nav-inner flex items-center justify-between py-2.5 px-5 sm:px-6">
            
            {/* Brand Logo */}
            <a href="#top" className="flex items-center">
              <Logo size="md" variant="light" />
            </a>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">
              <a href="#top" className="hover:text-[#5A5FE8] transition-colors">
                Product
              </a>
              <a href="#story" className="hover:text-[#5A5FE8] transition-colors">
                Problem &amp; Solution
              </a>
              <a href="#demo-showcase" className="hover:text-[#5A5FE8] transition-colors">
                Interactive Demo
              </a>
              <a href="#features" className="hover:text-[#5A5FE8] transition-colors">
                Features &amp; AST
              </a>
              <a href="#security" className="hover:text-[#5A5FE8] transition-colors">
                5-Tier RBAC
              </a>
            </nav>

            {/* Right Action: Single Primary Button (Dark Mode Toggle Removed) */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5A5FE8] hover:bg-[#4E53DE] text-white font-bold text-xs shadow-[0_4px_14px_rgba(90,95,232,0.35)] hover:shadow-[0_8px_20px_rgba(90,95,232,0.45)] transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Launch Platform</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden px-6 py-5 bg-white border-t border-slate-100 flex flex-col gap-4 text-sm font-bold text-slate-700 rounded-b-2xl shadow-xl">
              <a href="#top" onClick={() => setMobileMenuOpen(false)}>
                Product
              </a>
              <a href="#story" onClick={() => setMobileMenuOpen(false)}>
                Problem &amp; Solution
              </a>
              <a href="#demo-showcase" onClick={() => setMobileMenuOpen(false)}>
                Interactive Demo
              </a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>
                Features &amp; AST
              </a>
              <a href="#security" onClick={() => setMobileMenuOpen(false)}>
                5-Tier RBAC
              </a>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 text-center text-xs font-bold rounded-full bg-slate-100 text-slate-800"
                >
                  Sign In with Demo Roles
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 text-center text-xs font-bold rounded-full bg-[#5A5FE8] text-white shadow-md"
                >
                  Launch Platform
                </button>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* ================= MAIN CONTENT SECTIONS ================= */}
      <main id="top">
        {/* 1. Full-Viewport Hero Section with 3D Tilted Dashboard Showcase */}
        <HeroSection />

        {/* 2. Enterprise Infrastructure / Tech Stack Trust Strip */}
        <EcosystemStrip />

        {/* 3. Storytelling: Problem (Spreadsheet Disaster) & Solution (PeoplePay Engine) */}
        <StorySection />

        {/* 4. ScrollTrigger 18s Code-Simulated Demo Video Engine */}
        <ProductDemoVideo />

        {/* 5. Asymmetric Bento Grid Features Showcase */}
        <FeatureGridSection />

        {/* 6. 5-Tier RBAC Role Security Matrix */}
        <div id="security">
          <SecurityRBACSection />
        </div>

        {/* 7. Final Conversion Workspace Launch CTA */}
        <CTASection />
      </main>

      {/* ================= LIGHT MODE SEMANTIC FOOTER ================= */}
      <Footer />
    </div>
  );
};
