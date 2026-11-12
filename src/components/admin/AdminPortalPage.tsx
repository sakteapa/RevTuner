/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AdminPortalPage: Dedicated Central Master System Administrator Portal.
 * Restricted strictly to Administrator phone 6009316925.
 * Provides complete 360° master control over the entire platform:
 * Users, Tokens, Pricing, UPI Ledger, Flash Repo & AI, Modules & Plugins, and System Backup.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Coins,
  Users,
  CreditCard,
  FolderArchive,
  Sliders,
  Key,
  Settings,
  RefreshCw,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Download,
  Lock,
  ExternalLink,
  Sparkles,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  Wrench,
  Check,
  ChevronRight,
  Database,
  UserX,
  UserCheck,
  LogOut,
  Car,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { BinaryFileState, parseBinaryBuffer } from '../../lib/binaryEngine';
import { FlashReportModal } from '../FlashReportModal';

interface AdminPortalPageProps {
  onEnterWorkstation: () => void;
  onEnterUserPortal?: () => void;
  onLoadFileToWorkstation: (file: BinaryFileState, isMod: boolean) => void;
}

type AdminPortalTab =
  | 'overview'
  | 'users'
  | 'packs'
  | 'payments'
  | 'flash_repo'
  | 'modules'
  | 'api_gateway'
  | 'settings';

interface UserItem {
  uid: string;
  phoneNumber: string;
  displayName: string;
  workshopName: string;
  role: string;
  tokenBalance: number;
  totalTokensPurchased: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

interface TokenPackItem {
  id: string;
  name: string;
  tokenCount: number;
  priceINR: number;
  priceUSD: number;
  description: string;
  badge?: string;
  isActive: boolean;
}

interface TransactionItem {
  id: string;
  phoneNumber: string;
  packName: string;
  tokenCount: number;
  amountINR: number;
  paymentMethod: string;
  referenceId: string;
  status: 'completed' | 'pending';
  createdAt: string;
}

interface FlashRepoItem {
  id: string;
  name: string;
  size: number;
  fileType: 'original' | 'tuned';
  ecuBrand: string;
  ecuFamily: string;
  hardwareNumber: string;
  softwareNumber: string;
  crc32: string;
  uploadedBy: string;
  uploadedAt: string;
  hasReport?: boolean;
  pairedFileName?: string;
  vehicleCompatibility?: {
    make: string;
    model: string;
    engine: string;
    displacement: string;
    stockPowerHp: number;
    stockTorqueNm: number;
  };
}

interface ModuleItem {
  id: string;
  name: string;
  category: string;
  description: string;
  isEnabled: boolean;
  creditCost: number;
}

export const AdminPortalPage: React.FC<AdminPortalPageProps> = ({
  onEnterWorkstation,
  onEnterUserPortal,
  onLoadFileToWorkstation,
}) => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();

  // Strict Security Guard: Only 6009316925
  const isSuperAdmin = isLoggedIn && isAdmin && user?.phoneNumber === '6009316925';

  const [activeTab, setActiveTab] = useState<AdminPortalTab>('overview');

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Users state
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isGrantingCredit, setIsGrantingCredit] = useState(false);
  const [grantPhone, setGrantPhone] = useState('');
  const [grantAmount, setGrantAmount] = useState('10');
  const [userActionMessage, setUserActionMessage] = useState('');

  // Password reset state
  const [resetPhone, setResetPhone] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // Packs state
  const [packs, setPacks] = useState<TokenPackItem[]>([]);
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [newPackForm, setNewPackForm] = useState({
    id: '',
    name: '',
    tokenCount: 10,
    priceINR: 999,
    priceUSD: 15,
    description: '',
    badge: '',
  });

  // Transactions state
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  // Flash Repo state
  const [flashFiles, setFlashFiles] = useState<FlashRepoItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedReportFile, setSelectedReportFile] = useState<any | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleOpenReport = async (file: FlashRepoItem) => {
    setSelectedReportFile(file);
    try {
      const res = await fetch(`/api/admin/flash-repo/${file.id}/report`, {
        headers: { 'x-user-phone': '6009316925' },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedReport(data.report);
        setIsReportOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Modules & Plugins state
  const [modules, setModules] = useState<ModuleItem[]>([]);

  // System Settings state
  const [settings, setSettings] = useState<any>({
    maintenanceMode: false,
    signupBonusTokens: 2,
    systemNotice: '',
    developerName: 'Samuel Renthlei',
    developerEmail: 'samuellalrinfela@gmail.com',
  });
  const [settingsSaveMsg, setSettingsSaveMsg] = useState('');

  // Fetch Stats
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/admin/system/stats', {
        headers: { 'x-user-phone': '6009316925' },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch admin stats:', e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-user-phone': '6009316925' },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Packs
  const fetchPacks = async () => {
    try {
      const res = await fetch('/api/admin/packs', {
        headers: { 'x-user-phone': '6009316925' },
      });
      if (res.ok) {
        const data = await res.json();
        setPacks(data.packs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Transactions
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/admin/transactions', {
        headers: { 'x-user-phone': '6009316925' },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Flash Repo
  const fetchFlashRepo = async () => {
    try {
      const res = await fetch('/api/admin/flash-repo', {
        headers: { 'x-user-phone': '6009316925' },
      });
      if (res.ok) {
        const data = await res.json();
        setFlashFiles(data.files || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Modules
  const fetchModules = async () => {
    try {
      const res = await fetch('/api/admin/modules', {
        headers: { 'x-user-phone': '6009316925' },
      });
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/system/settings', {
        headers: { 'x-user-phone': '6009316925' },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStats();
      fetchUsers();
      fetchPacks();
      fetchTransactions();
      fetchFlashRepo();
      fetchModules();
      fetchSettings();
    }
  }, [isSuperAdmin]);

  // Actions
  const handleGrantCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionMessage('');
    try {
      const res = await fetch('/api/admin/credits/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-phone': '6009316925',
        },
        body: JSON.stringify({
          targetPhone: grantPhone,
          amount: parseInt(grantAmount, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grant credits');
      setUserActionMessage(`Successfully credited ${data.addedTokens} tokens to ${grantPhone}! New balance: ${data.newBalance}`);
      setIsGrantingCredit(false);
      setGrantPhone('');
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      setUserActionMessage(`Error: ${err.message}`);
    }
  };

  const handleToggleUserStatus = async (phone: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(`/api/admin/users/${phone}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-phone': '6009316925',
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.phoneNumber === phone ? { ...u, status: nextStatus as any } : u))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPhone || !newPasswordVal) return;
    try {
      const res = await fetch(`/api/admin/users/${resetPhone}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-phone': '6009316925',
        },
        body: JSON.stringify({ newPassword: newPasswordVal }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Password reset successfully');
        setResetPhone(null);
        setNewPasswordVal('');
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}/approve`, {
        method: 'POST',
        headers: { 'x-user-phone': '6009316925' },
      });
      if (res.ok) {
        fetchTransactions();
        fetchUsers();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaveMsg('');
    try {
      const res = await fetch('/api/admin/system/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-phone': '6009316925',
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettingsSaveMsg('System settings updated successfully.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleModule = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/admin/modules/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-phone': '6009316925',
        },
        body: JSON.stringify({ isEnabled: !currentState }),
      });
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isEnabled: !currentState } : m))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadRepoFile = (file: FlashRepoItem, isMod: boolean) => {
    const buffer = new Uint8Array(file.size || 2097152);
    buffer[0] = 0x50;
    buffer[1] = 0x4b;
    const parsed = parseBinaryBuffer(file.name, buffer);
    onLoadFileToWorkstation(parsed, isMod);
    onEnterWorkstation();
  };

  // If unauthorized, render high-security lock screen
  if (!isSuperAdmin) {
    return (
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white font-sans">
        <div className="max-w-md w-full bg-slate-950 border border-rose-900/60 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-950/70 border border-rose-600/50 flex items-center justify-center mx-auto mb-4 text-rose-500">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">
            Restricted Master Admin Access
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            This Master System Administrator Portal is strictly guarded and restricted exclusively to System Administrator credentials (Phone: <span className="font-mono text-rose-400">6009316925</span>).
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onEnterWorkstation}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              Return to Tuner Workstation
            </button>
            {onEnterUserPortal && (
              <button
                onClick={onEnterUserPortal}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
              >
                Go to My Tuner Portal
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.phoneNumber.includes(userSearchQuery) ||
      (u.displayName && u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
      (u.workshopName && u.workshopName.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-rose-500/30">
      {/* Top Header Bar */}
      <header className="shrink-0 h-14 bg-[#0a0e17] border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none">
        {/* Left: Master Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[130px] sm:max-w-none">
                RevTuner Admin Portal
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                SUPERADMIN
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden xs:block">
              Platform Control: 6009316925 · Samuel Renthlei Engine
            </p>
          </div>
        </div>

        {/* Right Actions: Workstation switch, User Portal switch, Refresh */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onEnterUserPortal && (
            <button
              onClick={onEnterUserPortal}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-[11px] sm:text-xs text-slate-300 font-medium transition-colors"
            >
              Tuner Portal
            </button>
          )}

          <button
            onClick={onEnterWorkstation}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] sm:text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span><span className="hidden sm:inline">Switch to </span>Workstation</span>
            <ArrowRight className="w-3 h-3 hidden sm:inline" />
          </button>

          <button
            onClick={logout}
            className="p-1.5 sm:p-2 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile & Tablet Horizontal Tab Navigation Bar (lg:hidden) */}
      <div className="lg:hidden shrink-0 border-b border-slate-800 bg-[#080c14] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'overview'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
          <span>Mission Control</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'users'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tuners ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('packs')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'packs'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>Packs</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'payments'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>Payments ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('flash_repo')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'flash_repo'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5 text-blue-400" />
          <span>Flash Repo ({flashFiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'modules'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Modules</span>
        </button>

        <button
          onClick={() => setActiveTab('api_gateway')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'api_gateway'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-yellow-400" />
          <span>API</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
            activeTab === 'settings'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>System</span>
        </button>
      </div>

      {/* Main Body: 260px Sidebar + Master Content Panes */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Master Sidebar (260px) - Visible only on Desktop */}
        <aside className="hidden lg:flex w-64 shrink-0 bg-[#080c14] border-r border-slate-800 p-3 flex-col justify-between overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Master Controls
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'overview'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Mission Control</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'users'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Tuner Accounts ({usersList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('packs')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'packs'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Coins className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Token Pricing Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'payments'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Financial Ledger ({transactions.length})</span>
            </button>

            <div className="pt-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ECU Engine &amp; System
            </div>

            <button
              onClick={() => setActiveTab('flash_repo')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'flash_repo'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <FolderArchive className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Master Flash Repo ({flashFiles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('modules')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'modules'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0 text-purple-400" />
              <span>Modules &amp; Plugins</span>
            </button>

            <button
              onClick={() => setActiveTab('api_gateway')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'api_gateway'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Key className="w-4 h-4 shrink-0 text-yellow-400" />
              <span>API Gateway</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'settings'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-400" />
              <span>System &amp; Backups</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-slate-900 text-[10px] text-slate-400 font-mono">
            <div>RevTuner Enterprise v4.8</div>
            <div>Dev: Samuel Renthlei</div>
          </div>
        </aside>

        {/* Master Content Area */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-[#0a0e17]">
          {/* TAB 1: MISSION CONTROL OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Executive Mission Control
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time platform telemetry, user registration metrics, and token economy status.
                  </p>
                </div>
                <button
                  onClick={fetchStats}
                  className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Refresh Telemetry"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Stat Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400">Total Registered Tuners</span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {stats?.totalUsers ?? usersList.length}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-2">
                    ● {stats?.activeUsers ?? usersList.length} Active Accounts
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400">Tokens In Circulation</span>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                    {stats?.totalTokensCirculating ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2">
                    Default bonus: {stats?.signupBonusTokens ?? 2} / user
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400">Master Bin Repo Files</span>
                  <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
                    {stats?.totalRepoFiles ?? flashFiles.length}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2">
                    All Bosch, Denso, Simos maps
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400">Gross Platform Revenue</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    ₹{stats?.totalRevenueINR ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2">
                    ~${stats?.totalRevenueUSD ?? 0} USD via UPI/Card
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>Instant Credit Injection</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Directly inject token credits into any tuner account without requiring payment.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('users');
                        setIsGrantingCredit(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xs"
                    >
                      Open Credit Grant Tool
                    </button>
                    <button
                      onClick={() => setActiveTab('packs')}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                    >
                      Edit Token Packs
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>Database JSON Backup</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Download an offline JSON snapshot of all registered users, tokens, and bin metadata.
                  </p>
                  <a
                    href="/api/admin/system/backup"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Platform JSON</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TUNER ACCOUNTS & CREDITS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <span>Tuner Accounts Directory</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage client credentials, inject free tokens, and toggle account access.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search phone or workshop..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <button
                    onClick={() => setIsGrantingCredit(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Grant Credits</span>
                  </button>
                </div>
              </div>

              {userActionMessage && (
                <div className="p-3 rounded-lg bg-slate-900 border border-cyan-800 text-xs text-cyan-300">
                  {userActionMessage}
                </div>
              )}

              {/* Credit Grant Modal / Form */}
              {isGrantingCredit && (
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                      Grant Token Credits Manually
                    </h4>
                    <button
                      onClick={() => setIsGrantingCredit(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleGrantCredit} className="flex flex-wrap gap-3 items-end text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Target Tuner Phone</label>
                      <input
                        type="text"
                        placeholder="e.g. 9862123456"
                        value={grantPhone}
                        onChange={(e) => setGrantPhone(e.target.value)}
                        required
                        className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Token Amount</label>
                      <input
                        type="number"
                        min="1"
                        value={grantAmount}
                        onChange={(e) => setGrantAmount(e.target.value)}
                        required
                        className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono w-28"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-xs shadow-xs hover:bg-rose-500 cursor-pointer"
                    >
                      Inject Credits
                    </button>
                  </form>
                </div>
              )}

              {/* Users Table */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-900/40">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 font-medium">Tuner Phone</th>
                      <th className="p-3 font-medium">Workshop / Name</th>
                      <th className="p-3 font-medium">Role</th>
                      <th className="p-3 font-medium">Token Balance</th>
                      <th className="p-3 font-medium">Total Purchased</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map((u) => (
                      <tr key={u.phoneNumber} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-white">
                          {u.phoneNumber}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{u.displayName || 'Unnamed'}</div>
                          <div className="text-[11px] text-slate-400">{u.workshopName || 'Independent'}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-cyan-400">
                          {u.tokenBalance}
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {u.totalTokensPurchased}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'suspended'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleUserStatus(u.phoneNumber, u.status)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                                title="Toggle Active / Suspended"
                              >
                                {u.status === 'suspended' ? 'Unban' : 'Suspend'}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setResetPhone(u.phoneNumber);
                                setNewPasswordVal('tuner123');
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-400"
                              title="Reset Password"
                            >
                              Reset Pass
                            </button>
                            <button
                              onClick={() => {
                                setGrantPhone(u.phoneNumber);
                                setIsGrantingCredit(true);
                              }}
                              className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-[11px] text-rose-300"
                              title="Add Tokens"
                            >
                              +Credits
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Password Reset Modal */}
              {resetPhone && (
                <div className="p-4 rounded-xl border border-cyan-800 bg-slate-900/90 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Reset Password for {resetPhone}</span>
                    <button onClick={() => setResetPhone(null)} className="text-slate-400 hover:text-white">Cancel</button>
                  </div>
                  <form onSubmit={handleResetPassword} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      placeholder="New password..."
                      className="p-2 rounded bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                    <button type="submit" className="px-3 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                      Save New Password
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TOKEN PRICING STUDIO */}
          {activeTab === 'packs' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span>Token Packs &amp; Pricing Studio</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure token packages available to tuners via GPay, UPI QR, and Credit Card.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packs.map((pack) => (
                  <div
                    key={pack.id}
                    className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{pack.name}</span>
                        {pack.badge && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            {pack.badge}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-cyan-400">
                          {pack.tokenCount}
                        </span>
                        <span className="text-xs text-slate-400">Credits</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{pack.description}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="font-mono text-sm font-bold text-white">
                        ₹{pack.priceINR} <span className="text-xs text-slate-500">(${pack.priceUSD})</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIAL LEDGER & PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span>Financial Ledger &amp; UPI Approvals</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live record of all GPay, PhonePe, and Card payment attempts with UTR verification.
                  </p>
                </div>
                <button
                  onClick={fetchTransactions}
                  className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-900/40">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 font-medium">Timestamp</th>
                      <th className="p-3 font-medium">Tuner Phone</th>
                      <th className="p-3 font-medium">Pack</th>
                      <th className="p-3 font-medium">Amount</th>
                      <th className="p-3 font-medium">Method</th>
                      <th className="p-3 font-medium">Ref / UTR ID</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="p-3 font-mono font-bold text-white">{tx.phoneNumber}</td>
                        <td className="p-3 text-slate-200">{tx.packName}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">₹{tx.amountINR}</td>
                        <td className="p-3 capitalize">{tx.paymentMethod.replace('_', ' ')}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{tx.referenceId}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {tx.status === 'pending' ? (
                            <button
                              onClick={() => handleApproveTransaction(tx.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Approved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: MASTER FLASH REPOSITORY */}
          {activeTab === 'flash_repo' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FolderArchive className="w-5 h-5 text-blue-400" />
                    <span>Master Flash Repository &amp; AI Vehicle Intelligence</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Central catalog of all original and modified ECU flash binaries, AI motor matches, and map diffs.
                  </p>
                </div>
                <button
                  onClick={fetchFlashRepo}
                  className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-900/40">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 font-medium">Binary File</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium">ECU Family</th>
                      <th className="p-3 font-medium">Vehicle &amp; Engine</th>
                      <th className="p-3 font-medium">HW / SW</th>
                      <th className="p-3 font-medium">Uploader</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {flashFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-900/50">
                        <td className="p-3">
                          <div className="font-semibold text-white max-w-xs truncate">{file.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">CRC: {file.crc32 || 'N/A'}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            file.fileType === 'original'
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {file.fileType}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">{file.ecuFamily}</td>
                        <td className="p-3">
                          {file.vehicleCompatibility ? (
                            <div>
                              <div className="font-semibold text-white">
                                {file.vehicleCompatibility.make} {file.vehicleCompatibility.model}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {file.vehicleCompatibility.engine} ({file.vehicleCompatibility.stockPowerHp}HP)
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Generic</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">
                          HW: {file.hardwareNumber}<br />
                          SW: {file.softwareNumber}
                        </td>
                        <td className="p-3 font-mono text-slate-400">{file.uploadedBy}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleLoadRepoFile(file, false)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                            >
                              Stock
                            </button>
                            <button
                              onClick={() => handleLoadRepoFile(file, true)}
                              className="px-2 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-[11px] cursor-pointer"
                            >
                              Mod
                            </button>
                            {file.hasReport && (
                              <button
                                onClick={() => handleOpenReport(file)}
                                className="p-1 rounded text-cyan-400 hover:bg-slate-800"
                                title="Open AI Report"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: ECU MODULES & PLUGINS */}
          {activeTab === 'modules' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  <span>Platform ECU Modules &amp; Plugin Manager</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toggle platform-wide availability of automated DaVinci patches and configure token cost per module.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{m.name}</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300">
                          {m.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs font-mono">
                        <span className="text-slate-400">Fee:</span>
                        <span className="font-bold text-amber-400">{m.creditCost} Token</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleModule(m.id, m.isEnabled)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        m.isEnabled
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {m.isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: API GATEWAY */}
          {activeTab === 'api_gateway' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-yellow-400" />
                  <span>Developer API Gateway</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  External flasher tool integrators (PCMflash, BitBox, KESS3, Autotuner) access tokens.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Master Flasher API Token</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled
                      value="revtuner_live_master_98a72bf9c1044"
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-400"
                    />
                    <button
                      onClick={() => alert('Master API key copied')}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="font-semibold text-white">Active Endpoints:</div>
                  <div className="font-mono text-slate-400 space-y-1">
                    <div>POST /api/flash-repo/upload · Rate Limit: 100 req/min</div>
                    <div>POST /api/tokens/consume · Rate Limit: 300 req/min</div>
                    <div>POST /api/ai/analyze-ecu · Rate Limit: 60 req/min</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SYSTEM SETTINGS & BACKUP */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span>Platform Settings &amp; Full System Backup</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure signup tokens, maintenance mode, and download complete platform database JSON.
                </p>
              </div>

              {settingsSaveMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  {settingsSaveMsg}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Default Free Signup Bonus Tokens
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.signupBonusTokens}
                    onChange={(e) =>
                      setSettings({ ...settings, signupBonusTokens: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Credits awarded immediately upon phone number signup (default: 2).
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Global System Broadcast Notice
                  </label>
                  <input
                    type="text"
                    value={settings.systemNotice}
                    onChange={(e) => setSettings({ ...settings, systemNotice: e.target.value })}
                    placeholder="e.g. System operating nominal."
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="maintenance"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="rounded border-slate-700"
                  />
                  <label htmlFor="maintenance" className="text-slate-300 font-medium">
                    Activate Platform Maintenance Mode (Lock non-admin exports)
                  </label>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xs"
                  >
                    Save System Settings
                  </button>
                </div>
              </form>

              {/* Database Backup Box */}
              <div className="pt-6 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Disaster Recovery &amp; State Backup
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Export the full platform state including all user accounts, token balances, transaction logs, and cataloged .BIN files as a standardized JSON package.
                </p>
                <a
                  href="/api/admin/system/backup"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full Database Backup (.JSON)</span>
                </a>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Embedded Flash Report Modal if selected */}
      {isReportOpen && (
        <FlashReportModal
          isOpen={isReportOpen}
          onClose={() => {
            setIsReportOpen(false);
            setSelectedReport(null);
            setSelectedReportFile(null);
          }}
          report={selectedReport}
          file={selectedReportFile}
          onLoadIntoWorkstation={(fileState: BinaryFileState, isMod: boolean) => {
            onLoadFileToWorkstation(fileState, isMod);
            setIsReportOpen(false);
            onEnterWorkstation();
          }}
        />
      )}
    </div>
  );
};
