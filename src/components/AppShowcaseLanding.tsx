/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AppShowcaseLanding: High-impact Application Showcase Frontend with Integrated Login/Signup,
 * Live Workstation Preview, Features Showcase, and Samuel Renthlei Developer Branding.
 */

import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  ShieldCheck,
  FileCode2,
  Lock,
  Phone,
  User,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  CheckCircle2,
  Sliders,
  Car,
  Play,
  Download,
  Flame,
  Mail,
  BookOpen,
  HelpCircle,
  FileText,
  KeyRound,
  LogIn,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { LegalModalTab } from './LegalModal';

interface AppShowcaseLandingProps {
  onEnterWorkstation: () => void;
  onOpenLegal: (tab: LegalModalTab) => void;
  onOpenAdminBackend?: () => void;
  onEnterUserPortal?: () => void;
  onEnterAdminPortal?: () => void;
}

export const AppShowcaseLanding: React.FC<AppShowcaseLandingProps> = ({
  onEnterWorkstation,
  onOpenLegal,
  onOpenAdminBackend,
  onEnterUserPortal,
  onEnterAdminPortal,
}) => {
  const { user, isLoggedIn, isAdmin, login, signup } = useAuth();

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsLoadingAuth(true);

    if (authMode === 'login') {
      const res = await login(phoneNumber, password);
      setIsLoadingAuth(false);
      if (res.success) {
        const isAdminUser = phoneNumber.trim() === '6009316925';
        setAuthSuccess(
          isAdminUser
            ? 'Administrator authenticated! Redirecting to Master Admin Portal...'
            : 'Logged in successfully! Redirecting to Member Portal...'
        );
        setTimeout(() => {
          if (isAdminUser && onEnterAdminPortal) {
            onEnterAdminPortal();
          } else if (onEnterUserPortal) {
            onEnterUserPortal();
          } else {
            onEnterWorkstation();
          }
        }, 500);
      } else {
        setAuthError(res.error || 'Failed to login');
      }
    } else {
      const res = await signup(phoneNumber, password, displayName, workshopName);
      setIsLoadingAuth(false);
      if (res.success) {
        setAuthSuccess('Account created with 2 Free Usage Tokens! Opening Member Portal...');
        setTimeout(() => {
          if (onEnterUserPortal) {
            onEnterUserPortal();
          } else {
            onEnterWorkstation();
          }
        }, 600);
      } else {
        setAuthError(res.error || 'Failed to signup');
      }
    }
  };

  const fillQuickAdmin = () => {
    setPhoneNumber('6009316925');
    setPassword('Srenthlei16#');
    setAuthMode('login');
    setAuthError(null);
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 select-none overflow-y-auto">
      
      {/* Quick Legal & Navigation Strip (Non-sticky, clean responsive banner) */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-[#080d1a]/60 px-3 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 shrink-0">
            Enterprise v3.8
          </span>
          <button
            onClick={() => onOpenLegal('about')}
            className="px-2 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium whitespace-nowrap transition-colors"
          >
            About Developer
          </button>
          <button
            onClick={() => onOpenLegal('readme')}
            className="px-2 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium whitespace-nowrap transition-colors"
          >
            Readme
          </button>
          <button
            onClick={() => onOpenLegal('supports')}
            className="px-2 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium whitespace-nowrap transition-colors"
          >
            Supported ECUs
          </button>
          <button
            onClick={() => onOpenLegal('agreement')}
            className="px-2 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium whitespace-nowrap transition-colors"
          >
            User Agreement
          </button>
        </div>

        <button
          onClick={onEnterWorkstation}
          className="ml-auto px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 text-xs shrink-0 cursor-pointer"
        >
          <span>Launch Workstation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hero Section & Integrated Login Card */}
      <section className="relative px-3 sm:px-8 py-5 sm:py-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start lg:items-center">
        
        {/* Left Column: Product Showcase & Value Proposition */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Automotive ECU Reverse-Engineering &amp; Gemini 3.8 Flash AI Copilot</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
            Next-Gen ECU Hex Diff, Calibration &amp; AI Tuning Studio
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
            WinOLS-style binary diffing, DaVinci-style signature auto-patching, 2D interactive map curves, and AI comparative learning — designed for tuners and modern performance workshops.
          </p>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xs">
              <div className="text-xl font-black text-blue-600 dark:text-blue-400">0.05ms</div>
              <div className="text-[11px] text-slate-500 font-medium">Binary Diff Engine</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xs">
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">100%</div>
              <div className="text-[11px] text-slate-500 font-medium">Auto Checksum</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xs">
              <div className="text-xl font-black text-amber-600 dark:text-amber-400">2 Tokens</div>
              <div className="text-[11px] text-slate-500 font-medium">Free on Signup</div>
            </div>
          </div>

          {/* Developer Attribution Card */}
          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between gap-3 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                SR
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">
                  Lead Developer &amp; Architect
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Samuel Renthlei
                </h4>
                <a
                  href="mailto:samuellalrinfela@gmail.com"
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 font-mono"
                >
                  samuellalrinfela@gmail.com
                </a>
              </div>
            </div>

            <button
              onClick={() => onOpenLegal('about')}
              className="px-2.5 py-1 text-xs rounded-lg border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-semibold transition-colors"
            >
              Developer Profile
            </button>
          </div>
        </div>

        {/* Right Column: Integrated Login / Sign Up Showcase Box */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
            
            {/* Auth Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>{authMode === 'login' ? 'Tuner / Admin Login' : 'Create Free Tuner Account'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {authMode === 'login'
                    ? 'Enter phone and password to access files'
                    : 'Get started instantly with 2 free export credits'}
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Notification messages */}
            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 font-medium">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                {authSuccess}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Phone Number (Mobile)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    placeholder="e.g. 6009316925"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 font-mono text-xs outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. Samuel Renthlei"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Workshop / Garage Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. RevTuner Lab Aizawl"
                      value={workshopName}
                      onChange={(e) => setWorkshopName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoadingAuth}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>{isLoadingAuth ? 'Authenticating...' : authMode === 'login' ? 'Log In & Continue' : 'Create Free Account (+2 Tokens)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Admin Demo Helper Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Admin Account Quick-Fill:</span>
              <button
                type="button"
                onClick={fillQuickAdmin}
                className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-mono font-bold border border-rose-200 dark:border-rose-800 transition-colors"
                title="Fill Admin Credentials (6009316925 / Srenthlei16#)"
              >
                6009316925 (Admin)
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* Feature Showcase Grid */}
      <section className="px-4 sm:px-8 py-10 bg-white dark:bg-[#090e1b] border-t border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
              End-to-End Automotive ECU Calibrations
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Professional Workstation Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              RevTuner combines client-side binary performance with real-time AI reverse-engineering and persistent server learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                <FileCode2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                WinOLS-Style Hex Diff
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Raw byte comparison between Stock and Mod files with exact offset mapping, 8-bit, 16-bit HiLo/LoHi, and 32-bit endianness support.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-amber-600/10 text-amber-600 flex items-center justify-center font-bold">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                AI Motor &amp; Capability Detection
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automated detection of motor architecture (BMW, Toyota Hilux, VW Golf) with exact breakdown of supported and restricted modifications.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Interactive Manual Tuning Studio
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Fine-tune torque limits, boost targets, common rail pressure, and speed governors using custom delta percentage sliders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer & Documentation Links */}
      <footer className="mt-auto px-4 sm:px-8 py-8 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-[#070b14] text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>RevTuner Enterprise</span>
              <span className="text-[10px] text-slate-400">· Developed by Samuel Renthlei</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Contact: <a href="mailto:samuellalrinfela@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">samuellalrinfela@gmail.com</a>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button onClick={() => onOpenLegal('about')} className="hover:text-slate-900 dark:hover:text-slate-100">
              About
            </button>
            <button onClick={() => onOpenLegal('readme')} className="hover:text-slate-900 dark:hover:text-slate-100">
              Readme
            </button>
            <button onClick={() => onOpenLegal('supports')} className="hover:text-slate-900 dark:hover:text-slate-100">
              Supports
            </button>
            <button onClick={() => onOpenLegal('agreement')} className="hover:text-slate-900 dark:hover:text-slate-100">
              User Agreement
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
