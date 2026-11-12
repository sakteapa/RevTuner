/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * RevTuner - Automotive ECU Reverse-Engineering & Binary Patching Workstation
 * Features: Usage Token Countdown, UPI/Card Recharges, Admin Backend (6009316925),
 * Gemini 3.8 Flash AI Copilot, ECU Modules & Plugins Hub, and Batch File Vault.
 */

import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Download,
  Layers,
  Wrench,
  Activity,
  Tag,
  Languages,
  Sun,
  Moon,
  Smartphone,
  Tablet,
  Monitor,
  Columns2,
  FolderArchive,
  Sliders,
  Key,
  ShieldAlert,
  User,
  Sparkles,
  LogOut,
  LogIn,
  Menu,
  X,
} from 'lucide-react';
import {
  BinaryFileState,
  DiffBlock,
  compareBinaries,
  parseBinaryBuffer,
} from './lib/binaryEngine';
import { useDeviceDetection } from './lib/deviceDetector';
import { AuthProvider, useAuth } from './lib/authContext';
import { TokenProvider, useTokens } from './lib/tokenContext';
import { FileLoader } from './components/FileLoader';
import { HexViewer } from './components/HexViewer';
import { DiffBlockList } from './components/DiffBlockList';
import { PatchStudio } from './components/PatchStudio';
import { MapVisualizer2D } from './components/MapVisualizer2D';
import { ECUStringInspector } from './components/ECUStringInspector';
import { ExportModal } from './components/ExportModal';
import { TokenBadge } from './components/TokenBadge';
import { TokenRechargeModal } from './components/TokenRechargeModal';
import { AuthModal } from './components/AuthModal';
import { AdminBackendConsole } from './components/AdminBackendConsole';
import { AIEngineerConsole } from './components/AIEngineerConsole';
import { ModulePluginHub } from './components/ModulePluginHub';
import { ApiManager } from './components/ApiManager';
import { FileManager } from './components/FileManager';
import { AppShowcaseLanding } from './components/AppShowcaseLanding';
import { LegalModal, LegalModalTab } from './components/LegalModal';
import { TunerPortalPage } from './components/portal/TunerPortalPage';
import { AdminPortalPage } from './components/admin/AdminPortalPage';

type AppViewMode =
  | 'showcase'
  | 'workstation'
  | 'user_portal'
  | 'admin_portal'
  | 'vault'
  | 'plugins'
  | 'api'
  | 'admin_backend';
type ActiveSidebarTab = 'diffs' | 'patcher' | 'strings' | 'ai_copilot';
type MobileViewTab = 'hex' | 'curve' | 'diffs' | 'patcher' | 'strings' | 'ai';
type DesktopWorkstationView = 'hex' | 'curve' | 'split';

function RevTunerMainApp() {
  const device = useDeviceDetection();
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const { setIsRechargeModalOpen } = useTokens();

  // Primary Platform Navigation View - Default to Showcase
  const [currentView, setCurrentView] = useState<AppViewMode>('showcase');

  // Binary files state
  const [stockFile, setStockFile] = useState<BinaryFileState | null>(null);
  const [modFile, setModFile] = useState<BinaryFileState | null>(null);
  const [endianness, setEndianness] = useState<'little' | 'big'>('little');

  // Workstation state
  const [selectedOffset, setSelectedOffset] = useState<number>(0);
  const [activeDiffIndex, setActiveDiffIndex] = useState<number>(0);
  const [activeSidebarTab, setActiveSidebarTab] = useState<ActiveSidebarTab>('diffs');
  const [mobileTab, setMobileTab] = useState<MobileViewTab>('hex');
  const [desktopView, setDesktopView] = useState<DesktopWorkstationView>('hex');

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalModalTab>('about');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenLegal = (tab: LegalModalTab) => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Auto-redirect upon login based on role:
  // Admin (6009316925) -> Admin Master Portal; Regular Tuner -> User Member Portal
  const prevUserPhoneRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (isLoggedIn && user?.phoneNumber) {
      if (prevUserPhoneRef.current !== user.phoneNumber) {
        prevUserPhoneRef.current = user.phoneNumber;
        if (isAdmin && user.phoneNumber === '6009316925') {
          setCurrentView('admin_portal');
        } else {
          setCurrentView('user_portal');
        }
      }
    } else {
      prevUserPhoneRef.current = null;
    }
  }, [isLoggedIn, user?.phoneNumber, isAdmin]);

  // Language & Theme
  const [lang, setLang] = useState<'en' | 'mizo'>('mizo');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Compute diff blocks whenever stock or mod binaries update
  const { diffBlocks, totalDiffBytes } = useMemo(() => {
    if (!stockFile || !modFile) {
      return { diffBlocks: [], totalDiffBytes: 0 };
    }
    return compareBinaries(stockFile.buffer, modFile.buffer);
  }, [stockFile, modFile]);

  const selectedDiffBlock: DiffBlock | null = useMemo(() => {
    if (diffBlocks.length === 0) return null;
    return diffBlocks[activeDiffIndex] || diffBlocks[0];
  }, [diffBlocks, activeDiffIndex]);

  const handleNavigateDiff = (direction: 'next' | 'prev') => {
    if (diffBlocks.length === 0) return;
    let nextIndex = activeDiffIndex;
    if (direction === 'next') {
      nextIndex = (activeDiffIndex + 1) % diffBlocks.length;
    } else {
      nextIndex = (activeDiffIndex - 1 + diffBlocks.length) % diffBlocks.length;
    }
    setActiveDiffIndex(nextIndex);
    setSelectedOffset(diffBlocks[nextIndex].startOffset);
  };

  const handleInspect2D = (offset: number) => {
    setSelectedOffset(offset);
    if (device.isDesktop) {
      if (desktopView === 'hex') {
        setDesktopView('split');
      }
    } else {
      setMobileTab('curve');
    }
  };

  const handleBinaryUpdated = (newBuffer: Uint8Array, _actionName: string) => {
    if (!stockFile) return;
    const updated = parseBinaryBuffer(stockFile.name, newBuffer);
    if (modFile) {
      setModFile(updated);
    } else {
      setStockFile(updated);
    }
  };

  const handleClearFiles = () => {
    setStockFile(null);
    setModFile(null);
    setSelectedOffset(0);
    setActiveDiffIndex(0);
  };

  const handleLearnRuleFromDiff = (block: DiffBlock) => {
    setActiveSidebarTab('patcher');
    setSelectedOffset(block.startOffset);
    if (!device.isDesktop) {
      setMobileTab('patcher');
    }
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-slate-100 dark:bg-[#080c14] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200 transition-colors duration-150">
      {/* Top Header Bar */}
      <header className="shrink-0 h-11 bg-white/95 dark:bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-4 shadow-2xs select-none">
        {/* Zone 1: Brand & View Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Mobile Navigation Drawer Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
            aria-label="Navigation Menu"
            title="Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-cyan-600" /> : <Menu className="w-4 h-4" />}
          </button>

          <div
            onClick={() => setCurrentView('workstation')}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-black shadow-xs shrink-0">
              <Cpu className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              RevTuner
            </span>
          </div>

          {/* Primary View Switcher Tabs (Desktop / Tablet) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCurrentView('showcase')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentView === 'showcase'
                  ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Showcase
            </button>

            <button
              onClick={() => setCurrentView('workstation')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentView === 'workstation'
                  ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Workstation
            </button>

            {/* User Member Portal (Accessible to all logged in users) */}
            {isLoggedIn && (
              <button
                onClick={() => setCurrentView('user_portal')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  currentView === 'user_portal'
                    ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-300 font-bold border border-cyan-300 dark:border-cyan-800'
                    : 'text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-200'
                }`}
              >
                <User className="w-3.5 h-3.5 text-cyan-600" />
                <span>My Portal</span>
              </button>
            )}

            {/* RESTRICTED: Master System Administrator Portal (6009316925 only) */}
            {isAdmin && user?.phoneNumber === '6009316925' && (
              <button
                onClick={() => setCurrentView('admin_portal')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold ${
                  currentView === 'admin_portal'
                    ? 'bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 shadow-2xs'
                    : 'hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Master Portal</span>
              </button>
            )}

            <button
              onClick={() => setCurrentView('vault')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                currentView === 'vault'
                  ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>File Vault</span>
            </button>

            <button
              onClick={() => setCurrentView('plugins')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                currentView === 'plugins'
                  ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Modules &amp; Plugins</span>
            </button>

            <button
              onClick={() => setCurrentView('api')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                currentView === 'api'
                  ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>API Manager</span>
            </button>
          </nav>
        </div>

        {/* Zone 3: Token Badge, User Auth, Theme & Export */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Developer Attribution & Docs Modal (desktop only) */}
          <button
            onClick={() => handleOpenLegal('about')}
            className="hidden lg:flex items-center gap-1 px-2 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded border border-cyan-200 dark:border-cyan-900/50 transition-colors cursor-pointer"
            title="Developer Samuel Renthlei, Docs & Legal"
          >
            <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>Dev: Samuel Renthlei</span>
          </button>

          {/* Usage Token Countdown Badge */}
          <TokenBadge />

          {/* User Account / Login Button */}
          {isLoggedIn ? (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 sm:px-2 py-1 text-xs">
              <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200 max-w-[70px] sm:max-w-[120px] truncate">
                {user?.displayName || user?.phoneNumber}
              </span>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-rose-600 ml-0.5 sm:ml-1 p-0.5"
                title="Logout"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-700 transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3 h-3 text-cyan-600" />
              <span className="hidden sm:inline">Login / Sign Up</span>
              <span className="sm:hidden text-[10px] font-bold">Login</span>
            </button>
          )}

          {/* Theme Toggle (hidden on tiny screens, available in mobile drawer) */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="hidden sm:flex p-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {/* Language Toggle (hidden on tiny screens, available in mobile drawer) */}
          <button
            onClick={() => setLang(lang === 'en' ? 'mizo' : 'en')}
            className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded transition-colors font-mono"
            title="Switch Language: Mizo / English"
          >
            <Languages className="w-3 h-3 text-cyan-600" />
            <span className="uppercase text-[10px]">{lang}</span>
          </button>

          {/* Flasher Export Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={!modFile && !stockFile}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 disabled:opacity-40 rounded shadow-xs transition-all whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150 select-none">
          <div className="bg-white dark:bg-[#0c1017] border-t border-slate-200 dark:border-slate-800 rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto space-y-3 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">RevTuner Mobile Menu</span>
                  <p className="text-[10px] text-slate-400">Select Workstation View</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Links */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setCurrentView('showcase');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                  currentView === 'showcase'
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>Showcase &amp; Login</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('workstation');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                  currentView === 'workstation'
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-4 h-4 text-cyan-600" />
                <span>WinOLS Hex Workstation</span>
              </button>

              {isLoggedIn && (
                <button
                  onClick={() => {
                    setCurrentView('user_portal');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                    currentView === 'user_portal'
                      ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <User className="w-4 h-4 text-cyan-600" />
                  <span>My Tuner Portal</span>
                </button>
              )}

              {isAdmin && user?.phoneNumber === '6009316925' && (
                <button
                  onClick={() => {
                    setCurrentView('admin_portal');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                    currentView === 'admin_portal'
                      ? 'bg-rose-500/20 text-rose-300 font-bold'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-950/20'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Master Admin Portal (6009316925)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setCurrentView('vault');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                  currentView === 'vault'
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FolderArchive className="w-4 h-4 text-blue-500" />
                <span>File Vault &amp; Batches</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('plugins');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                  currentView === 'plugins'
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-500" />
                <span>Modules &amp; Plugins</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('api');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                  currentView === 'api'
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Key className="w-4 h-4 text-amber-500" />
                <span>API Manager</span>
              </button>
            </div>

            {/* Mobile Drawer Settings Strip */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
                </button>

                <button
                  onClick={() => setLang(lang === 'en' ? 'mizo' : 'en')}
                  className="px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1"
                >
                  <Languages className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="uppercase text-xs">{lang}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  handleOpenLegal('about');
                  setIsMobileMenuOpen(false);
                }}
                className="text-xs text-cyan-600 dark:text-cyan-400 font-medium"
              >
                Dev: Samuel Renthlei
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dynamic Viewport Container */}
      <main className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col p-1.5 sm:p-2.5 gap-2">
        {/* VIEW 0: APPLICATION SHOWCASE & LOGIN FRONTEND */}
        {currentView === 'showcase' && (
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <AppShowcaseLanding
              onEnterWorkstation={() => setCurrentView('workstation')}
              onOpenLegal={handleOpenLegal}
              onOpenAdminBackend={() => setCurrentView('admin_portal')}
              onEnterUserPortal={() => setCurrentView('user_portal')}
              onEnterAdminPortal={() => setCurrentView('admin_portal')}
            />
          </div>
        )}

        {/* VIEW: TUNER MEMBER PORTAL */}
        {currentView === 'user_portal' && (
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <TunerPortalPage
              onEnterWorkstation={() => setCurrentView('workstation')}
              onLoadFileToWorkstation={(file, isMod) => {
                if (isMod) {
                  setModFile(file);
                } else {
                  setStockFile(file);
                }
                setCurrentView('workstation');
              }}
            />
          </div>
        )}

        {/* VIEW: SYSTEM ADMINISTRATOR MASTER PORTAL */}
        {currentView === 'admin_portal' && (
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <AdminPortalPage
              onEnterWorkstation={() => setCurrentView('workstation')}
              onEnterUserPortal={() => setCurrentView('user_portal')}
              onLoadFileToWorkstation={(file, isMod) => {
                if (isMod) {
                  setModFile(file);
                } else {
                  setStockFile(file);
                }
                setCurrentView('workstation');
              }}
            />
          </div>
        )}

        {/* VIEW 1: WORKSTATION */}
        {currentView === 'workstation' && (
          <div className="flex-1 min-h-0 min-w-0 flex flex-col gap-2 overflow-hidden">
            {/* File Loader Strip */}
            <FileLoader
              stockFile={stockFile}
              modFile={modFile}
              onStockLoaded={(f) => {
                setStockFile(f);
                setSelectedOffset(0);
              }}
              onModLoaded={(f) => {
                setModFile(f);
                setSelectedOffset(0);
              }}
              onClearFiles={handleClearFiles}
              endianness={endianness}
              onEndiannessChange={setEndianness}
            />

            {/* Mobile / Tablet View Switcher */}
            {!device.isDesktop && (
              <div className="shrink-0 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-1 text-xs shadow-2xs overflow-x-auto gap-1">
                <button
                  onClick={() => setMobileTab('hex')}
                  className={`flex-1 py-1 px-2 rounded font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
                    mobileTab === 'hex'
                      ? 'bg-cyan-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>Hex Grid</span>
                </button>

                <button
                  onClick={() => setMobileTab('curve')}
                  className={`flex-1 py-1 px-2 rounded font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
                    mobileTab === 'curve'
                      ? 'bg-cyan-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>2D Curve</span>
                </button>

                <button
                  onClick={() => setMobileTab('ai')}
                  className={`flex-1 py-1 px-2 rounded font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
                    mobileTab === 'ai'
                      ? 'bg-cyan-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>AI Copilot</span>
                </button>

                <button
                  onClick={() => setMobileTab('diffs')}
                  className={`flex-1 py-1 px-2 rounded font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
                    mobileTab === 'diffs'
                      ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Diffs ({diffBlocks.length})</span>
                </button>

                <button
                  onClick={() => setMobileTab('patcher')}
                  className={`flex-1 py-1 px-2 rounded font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
                    mobileTab === 'patcher'
                      ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Wrench className="w-3 h-3" />
                  <span>DaVinci</span>
                </button>
              </div>
            )}

            {/* Desktop Workstation Multi-Pane */}
            {device.isDesktop ? (
              <div className="flex-1 min-h-0 min-w-0 flex gap-2.5 overflow-hidden">
                {/* Left Sidebar (Diffs, DaVinci, ECU IDs, AI Copilot) */}
                <div className="w-80 xl:w-96 shrink-0 h-full flex flex-col min-h-0 overflow-hidden bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                  {/* Sidebar Tab Header */}
                  <div className="shrink-0 flex items-center bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-1 text-xs gap-1">
                    <button
                      onClick={() => setActiveSidebarTab('diffs')}
                      className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                        activeSidebarTab === 'diffs'
                          ? 'bg-white dark:bg-slate-800 text-cyan-800 dark:text-cyan-300 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>Diffs ({diffBlocks.length})</span>
                    </button>

                    <button
                      onClick={() => setActiveSidebarTab('patcher')}
                      className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                        activeSidebarTab === 'patcher'
                          ? 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Wrench className="w-3 h-3" />
                      <span>DaVinci</span>
                    </button>

                    <button
                      onClick={() => setActiveSidebarTab('ai_copilot')}
                      className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                        activeSidebarTab === 'ai_copilot'
                          ? 'bg-white dark:bg-slate-800 text-cyan-800 dark:text-cyan-300 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-cyan-600" />
                      <span>AI Copilot</span>
                    </button>

                    <button
                      onClick={() => setActiveSidebarTab('strings')}
                      className={`flex-1 py-1 px-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                        activeSidebarTab === 'strings'
                          ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>IDs</span>
                    </button>
                  </div>

                  {/* Sidebar View Container */}
                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    {activeSidebarTab === 'diffs' && (
                      <DiffBlockList
                        diffBlocks={diffBlocks}
                        totalDiffBytes={totalDiffBytes}
                        activeDiffIndex={activeDiffIndex}
                        onSelectDiff={(idx) => {
                          setActiveDiffIndex(idx);
                          setSelectedOffset(diffBlocks[idx].startOffset);
                        }}
                        onInspect2D={handleInspect2D}
                        onLearnRule={handleLearnRuleFromDiff}
                      />
                    )}

                    {activeSidebarTab === 'patcher' && (
                      <PatchStudio
                        stockFile={stockFile}
                        modFile={modFile}
                        selectedDiffBlock={selectedDiffBlock}
                        onBinaryUpdated={handleBinaryUpdated}
                        onSelectOffset={setSelectedOffset}
                      />
                    )}

                    {activeSidebarTab === 'ai_copilot' && (
                      <AIEngineerConsole
                        stockFile={stockFile}
                        modFile={modFile}
                        selectedOffset={selectedOffset}
                        language={lang}
                      />
                    )}

                    {activeSidebarTab === 'strings' && (
                      <ECUStringInspector
                        strings={
                          stockFile?.detectedStrings || modFile?.detectedStrings || []
                        }
                        onSelectOffset={setSelectedOffset}
                      />
                    )}
                  </div>
                </div>

                {/* Right Workstation Main View */}
                <div className="flex-1 min-w-0 h-full flex flex-col min-h-0 overflow-hidden">
                  {/* View Mode Controls */}
                  <div className="shrink-0 flex items-center justify-between px-2.5 py-1 mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {desktopView === 'hex'
                        ? 'WinOLS Virtualized Hex Diff Grid'
                        : desktopView === 'curve'
                        ? '2D Calibration Map Visualizer'
                        : 'Split Mode: Hex Diff & 2D Curve'}
                    </span>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded border border-slate-200 dark:border-slate-800 text-[11px]">
                      <button
                        onClick={() => setDesktopView('hex')}
                        className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                          desktopView === 'hex'
                            ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <Cpu className="w-3 h-3" />
                        <span>Hex Full</span>
                      </button>
                      <button
                        onClick={() => setDesktopView('curve')}
                        className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                          desktopView === 'curve'
                            ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <Activity className="w-3 h-3" />
                        <span>2D Map Full</span>
                      </button>
                      <button
                        onClick={() => setDesktopView('split')}
                        className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                          desktopView === 'split'
                            ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <Columns2 className="w-3 h-3" />
                        <span>Split</span>
                      </button>
                    </div>
                  </div>

                  {/* Components */}
                  {desktopView === 'hex' && (
                    <div className="flex-1 min-h-0 w-full overflow-hidden">
                      <HexViewer
                        stockFile={stockFile}
                        modFile={modFile}
                        diffBlocks={diffBlocks}
                        selectedOffset={selectedOffset}
                        onSelectOffset={setSelectedOffset}
                        activeDiffIndex={activeDiffIndex}
                        onNavigateDiff={handleNavigateDiff}
                        defaultBytesPerRow={device.recommendedBytesPerRow}
                      />
                    </div>
                  )}

                  {desktopView === 'curve' && (
                    <div className="flex-1 min-h-0 w-full overflow-hidden">
                      <MapVisualizer2D
                        stockFile={stockFile}
                        modFile={modFile}
                        offset={selectedOffset}
                        onOffsetChange={setSelectedOffset}
                      />
                    </div>
                  )}

                  {desktopView === 'split' && (
                    <div className="flex-1 min-h-0 w-full flex flex-col gap-2 overflow-hidden">
                      <div className="flex-1 min-h-0 w-full overflow-hidden">
                        <HexViewer
                          stockFile={stockFile}
                          modFile={modFile}
                          diffBlocks={diffBlocks}
                          selectedOffset={selectedOffset}
                          onSelectOffset={setSelectedOffset}
                          activeDiffIndex={activeDiffIndex}
                          onNavigateDiff={handleNavigateDiff}
                          defaultBytesPerRow={device.recommendedBytesPerRow}
                        />
                      </div>
                      <div className="h-60 shrink-0 w-full overflow-hidden">
                        <MapVisualizer2D
                          stockFile={stockFile}
                          modFile={modFile}
                          offset={selectedOffset}
                          onOffsetChange={setSelectedOffset}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Mobile Adaptive Single-Tool View */
              <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
                {mobileTab === 'hex' && (
                  <div className="flex-1 min-h-0 w-full overflow-hidden">
                    <HexViewer
                      stockFile={stockFile}
                      modFile={modFile}
                      diffBlocks={diffBlocks}
                      selectedOffset={selectedOffset}
                      onSelectOffset={setSelectedOffset}
                      activeDiffIndex={activeDiffIndex}
                      onNavigateDiff={handleNavigateDiff}
                      defaultBytesPerRow={device.recommendedBytesPerRow}
                    />
                  </div>
                )}

                {mobileTab === 'curve' && (
                  <div className="flex-1 min-h-0 w-full overflow-hidden">
                    <MapVisualizer2D
                      stockFile={stockFile}
                      modFile={modFile}
                      offset={selectedOffset}
                      onOffsetChange={setSelectedOffset}
                    />
                  </div>
                )}

                {mobileTab === 'ai' && (
                  <div className="flex-1 min-h-0 w-full overflow-hidden">
                    <AIEngineerConsole
                      stockFile={stockFile}
                      modFile={modFile}
                      selectedOffset={selectedOffset}
                      language={lang}
                    />
                  </div>
                )}

                {mobileTab === 'diffs' && (
                  <div className="flex-1 min-h-0 w-full overflow-hidden bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <DiffBlockList
                      diffBlocks={diffBlocks}
                      totalDiffBytes={totalDiffBytes}
                      activeDiffIndex={activeDiffIndex}
                      onSelectDiff={(idx) => {
                        setActiveDiffIndex(idx);
                        setSelectedOffset(diffBlocks[idx].startOffset);
                        setMobileTab('hex');
                      }}
                      onInspect2D={handleInspect2D}
                      onLearnRule={handleLearnRuleFromDiff}
                    />
                  </div>
                )}

                {mobileTab === 'patcher' && (
                  <div className="flex-1 min-h-0 w-full overflow-hidden bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <PatchStudio
                      stockFile={stockFile}
                      modFile={modFile}
                      selectedDiffBlock={selectedDiffBlock}
                      onBinaryUpdated={handleBinaryUpdated}
                      onSelectOffset={(off) => {
                        setSelectedOffset(off);
                        setMobileTab('hex');
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: FILE VAULT & BATCH MANAGER */}
        {currentView === 'vault' && (
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <FileManager
              onLoadAsStock={(f) => {
                setStockFile(f);
                setSelectedOffset(0);
                setCurrentView('workstation');
              }}
              onLoadAsMod={(f) => {
                setModFile(f);
                setSelectedOffset(0);
                setCurrentView('workstation');
              }}
            />
          </div>
        )}

        {/* VIEW 3: MODULES & PLUGINS HUB */}
        {currentView === 'plugins' && (
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <ModulePluginHub
              stockFile={stockFile}
              modFile={modFile}
              onBinaryUpdated={handleBinaryUpdated}
              language={lang}
            />
          </div>
        )}

        {/* VIEW 4: API MANAGER */}
        {currentView === 'api' && (
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <ApiManager />
          </div>
        )}

        {/* VIEW 5: RESTRICTED SERVER BACKEND ADMIN (6009316925 ONLY) */}
        {currentView === 'admin_backend' && (
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <AdminBackendConsole
              onLoadIntoWorkstation={(fileState, isMod) => {
                if (isMod) {
                  setModFile(fileState);
                } else {
                  setStockFile(fileState);
                }
                setCurrentView('workstation');
              }}
            />
          </div>
        )}
      </main>

      {/* Global Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeFile={modFile || stockFile}
        stockFile={stockFile}
      />

      <TokenRechargeModal />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Compact Status & Developer Footer */}
      <footer className="shrink-0 h-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070a10] px-3 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-slate-700 dark:text-slate-300">RevTuner Enterprise</span>
          <span>·</span>
          <button
            onClick={() => handleOpenLegal('about')}
            className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-sans font-medium"
            title="Developed by Samuel Renthlei"
          >
            Dev: Samuel Renthlei
          </button>
          <span className="hidden md:inline">·</span>
          <button
            onClick={() => handleOpenLegal('readme')}
            className="hidden md:inline hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Readme
          </button>
          <span className="hidden md:inline">·</span>
          <button
            onClick={() => handleOpenLegal('supports')}
            className="hidden md:inline hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Supports
          </button>
          <span className="hidden md:inline">·</span>
          <button
            onClick={() => handleOpenLegal('agreement')}
            className="hidden md:inline hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Agreement
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="mailto:samuellalrinfela@gmail.com"
            className="text-slate-500 dark:text-slate-400 hover:text-cyan-500 transition-colors hidden sm:inline"
          >
            samuellalrinfela@gmail.com
          </a>
          <span className="hidden sm:inline">·</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">100% Screen Fit</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TokenProvider>
        <RevTunerMainApp />
      </TokenProvider>
    </AuthProvider>
  );
}
