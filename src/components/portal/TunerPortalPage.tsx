/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TunerPortalPage: Dedicated User/Tuner Member Portal.
 * Gives every registered user full control over their Account, Workshop Profile,
 * Token Wallet & UPI Purchases, and Personal .BIN Firmware Library.
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Cpu,
  Coins,
  FolderArchive,
  ArrowRight,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Car,
  FileCode2,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Wrench,
  CreditCard,
  QrCode,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { useTokens } from '../../lib/tokenContext';
import { BinaryFileState, parseBinaryBuffer } from '../../lib/binaryEngine';
import { FlashReportModal } from '../FlashReportModal';

interface TunerPortalPageProps {
  onEnterWorkstation: () => void;
  onLoadFileToWorkstation: (file: BinaryFileState, isMod: boolean) => void;
}

type TunerPortalTab = 'overview' | 'wallet' | 'files' | 'profile';

interface PersonalFile {
  id: string;
  name: string;
  size: number;
  fileType: 'original' | 'tuned';
  ecuBrand: string;
  ecuFamily: string;
  hardwareNumber: string;
  softwareNumber: string;
  crc32: string;
  uploadedAt: string;
  isMine: boolean;
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

export const TunerPortalPage: React.FC<TunerPortalPageProps> = ({
  onEnterWorkstation,
  onLoadFileToWorkstation,
}) => {
  const { user, isLoggedIn, updateProfile } = useAuth();
  const { tokenBalance, setIsRechargeModalOpen } = useTokens();

  const [activeTab, setActiveTab] = useState<TunerPortalTab>('overview');
  const [personalFiles, setPersonalFiles] = useState<PersonalFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedReportFile, setSelectedReportFile] = useState<any | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleOpenReport = async (file: PersonalFile) => {
    setSelectedReportFile(file);
    try {
      const res = await fetch(`/api/admin/flash-repo/${file.id}/report`);
      if (res.ok) {
        const data = await res.json();
        setSelectedReport(data.report);
        setIsReportOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Profile Form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [workshopName, setWorkshopName] = useState(user?.workshopName || '');
  const [newPassword, setNewPassword] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Payment transactions
  const [transactions, setTransactions] = useState<any[]>([]);

  // Fetch personal files
  const fetchPersonalFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch('/api/user/files', {
        headers: {
          'x-user-phone': user?.phoneNumber || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setPersonalFiles(data.files);
        }
      }
    } catch (err) {
      console.error('Error fetching personal files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Fetch user transactions
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/admin/transactions', {
        headers: {
          'x-user-phone': user?.phoneNumber || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) {
          // Filter for current user
          const myTxs = data.transactions.filter(
            (t: any) => t.phoneNumber === user?.phoneNumber
          );
          setTransactions(myTxs);
        }
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchPersonalFiles();
      fetchTransactions();
      if (user) {
        setDisplayName(user.displayName || '');
        setWorkshopName(user.workshopName || '');
      }
    }
  }, [isLoggedIn, user?.phoneNumber]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    setIsSavingProfile(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-phone': user?.phoneNumber || '',
        },
        body: JSON.stringify({
          displayName,
          workshopName,
          newPassword: newPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      updateProfile({
        displayName: data.user.displayName,
        workshopName: data.user.workshopName,
      });

      setProfileSuccessMsg('Profile and security details updated successfully.');
      setNewPassword('');
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Error updating profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to remove this .BIN file from your vault?')) return;
    try {
      const res = await fetch(`/api/user/files/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-phone': user?.phoneNumber || '',
        },
      });
      if (res.ok) {
        setPersonalFiles((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleLoadIntoWorkstation = (file: PersonalFile, isMod: boolean) => {
    // Generate dummy buffer or realistic bytes
    const buffer = new Uint8Array(file.size || 2097152);
    // write dummy header
    buffer[0] = 0x50;
    buffer[1] = 0x4b;
    const parsed = parseBinaryBuffer(file.name, buffer);
    onLoadFileToWorkstation(parsed, isMod);
    onEnterWorkstation();
  };

  const myOwnFiles = personalFiles.filter((f) => f.isMine);

  return (
    <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 font-sans">
      {/* Top Banner Navigation */}
      <div className="shrink-0 h-14 bg-white dark:bg-[#0b0f17] border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none">
        {/* Left: Breadcrumbs & Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {user?.workshopName || 'Tuner Workspace'}
              </span>
              <span className="text-slate-400 dark:text-slate-600 hidden xs:inline">/</span>
              <span className="text-[11px] sm:text-xs font-mono font-medium text-cyan-600 dark:text-cyan-400 hidden xs:inline">
                {user?.phoneNumber}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Personal Calibration Vault &amp; Token Wallet
            </p>
          </div>
        </div>

        {/* Right: Quick Launch Workstation */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsRechargeModalOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-500/20 transition-colors"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono font-bold">{tokenBalance}</span>
            <span className="hidden xs:inline">Credits</span>
          </button>

          <button
            onClick={onEnterWorkstation}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span><span className="hidden sm:inline">Launch </span>Workstation</span>
            <ArrowRight className="w-3 h-3 hidden sm:inline" />
          </button>
        </div>
      </div>

      {/* Main Layout: Tab Navigation + Content Pane */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sub-Sidebar Tabs */}
        <aside className="w-full md:w-56 shrink-0 bg-white/70 dark:bg-[#090d15]/70 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-2 sm:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-200/80 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left whitespace-nowrap ${
              activeTab === 'wallet'
                ? 'bg-slate-200/80 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Credits &amp; Top-Up</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left whitespace-nowrap ${
              activeTab === 'files'
                ? 'bg-slate-200/80 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <FolderArchive className="w-4 h-4 shrink-0 text-blue-500" />
            <span>My .BIN Vault</span>
            {myOwnFiles.length > 0 && (
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700">
                {myOwnFiles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-slate-200/80 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <User className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Workshop Profile</span>
          </button>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl">
              {/* Header Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1018] p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Welcome back, {user?.displayName || user?.phoneNumber}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Workshop: <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.workshopName || 'Independent Tuning Garage'}</span> · Platform: RevTuner Automotive Workstation
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onEnterWorkstation}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-colors flex items-center gap-2"
                    >
                      <Cpu className="w-4 h-4" />
                      <span>Start Tuning Workstation</span>
                    </button>
                  </div>
                </div>

                {/* Metric Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Remaining Token Credits</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">{tokenBalance}</span>
                      <span className="text-xs text-slate-400">Exports available</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Stored .BIN Firmware Files</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{personalFiles.length}</span>
                      <span className="text-xs text-slate-400">in personal vault</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Account Status</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Active Tuner</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Files */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Binary Files */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1018] p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FolderArchive className="w-4 h-4 text-cyan-600" />
                      <span>Recent Files in Vault</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('files')}
                      className="text-xs text-cyan-600 hover:underline"
                    >
                      View all ({personalFiles.length})
                    </button>
                  </div>

                  <div className="space-y-2">
                    {personalFiles.slice(0, 4).map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1 truncate">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {file.ecuFamily} · {(file.size / 1024 / 1024).toFixed(1)}MB
                          </p>
                        </div>
                        <button
                          onClick={() => handleLoadIntoWorkstation(file, file.fileType === 'tuned')}
                          className="px-2.5 py-1 rounded bg-cyan-600/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-600/20 text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Token Wallet Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1018] p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Quick Token Top-Up</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Each .BIN export consumes 1 credit. Instant recharges available via GPay, PhonePe UPI, and Debit/Credit Cards.
                  </p>

                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Current Balance</span>
                      <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200">
                        {tokenBalance} Credits
                      </div>
                    </div>
                    <button
                      onClick={() => setIsRechargeModalOpen(true)}
                      className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Top-Up Now
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Manual admin setup: Phone 6009316925 approves or injects custom workshop credits.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOKENS & WALLET */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 max-w-4xl">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1018] p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-500" />
                      <span>Token Credits &amp; Payment Ledger</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Manage calibration export tokens, purchase history, and instant UPI QR payments.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRechargeModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-xs flex items-center gap-2"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Buy Token Pack</span>
                  </button>
                </div>

                {/* Big Balance Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-5 rounded-lg bg-gradient-to-br from-cyan-900/10 to-blue-900/10 border border-cyan-500/20">
                    <span className="text-xs font-medium text-cyan-800 dark:text-cyan-300">Available Credits</span>
                    <div className="text-3xl font-extrabold font-mono text-cyan-900 dark:text-cyan-100 mt-1">
                      {tokenBalance} <span className="text-sm font-normal text-slate-500">Tokens</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      1 token will be deducted on every modified .BIN export or master checksum patch.
                    </p>
                  </div>

                  <div className="p-5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Supported Payment Methods</span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-mono">GPay / PhonePe UPI</span>
                        <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-mono">Debit / Credit Card</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">
                      Payments verified instantly by automated server webhook.
                    </p>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="mt-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Recent Purchase &amp; Top-Up History
                  </h3>

                  {transactions.length === 0 ? (
                    <div className="p-6 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
                      No purchase transactions yet. Buy a token pack to view receipts here.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto text-xs">
                      <table className="w-full min-w-[550px] text-left">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-2.5 font-medium">Date</th>
                            <th className="p-2.5 font-medium">Pack</th>
                            <th className="p-2.5 font-medium">Tokens</th>
                            <th className="p-2.5 font-medium">Amount</th>
                            <th className="p-2.5 font-medium">Method</th>
                            <th className="p-2.5 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                              <td className="p-2.5 font-mono text-slate-500">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-200">
                                {tx.packName}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-cyan-600">
                                +{tx.tokenCount}
                              </td>
                              <td className="p-2.5 font-mono">
                                ₹{tx.amountINR}
                              </td>
                              <td className="p-2.5 capitalize">{tx.paymentMethod.replace('_', ' ')}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tx.status === 'completed'
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                }`}>
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MY .BIN VAULT */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1018] p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FolderArchive className="w-5 h-5 text-cyan-600" />
                      <span>My Calibration .BIN Firmware Vault</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      All your uploaded original dumps, tuned binaries, and matched ECU software pairs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchPersonalFiles}
                      className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Refresh Vault"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={onEnterWorkstation}
                      className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-xs"
                    >
                      Open Hex Workstation
                    </button>
                  </div>
                </div>

                {personalFiles.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                    <FolderArchive className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Vault is currently empty
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Load and compare original and tuned binary files in the workstation to automatically catalog them here.
                    </p>
                    <button
                      onClick={onEnterWorkstation}
                      className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold text-xs shadow-xs"
                    >
                      Launch Workstation Now
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                    <table className="w-full min-w-[650px] text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3 font-medium">Binary Name</th>
                          <th className="p-3 font-medium">Type</th>
                          <th className="p-3 font-medium">ECU Family</th>
                          <th className="p-3 font-medium">Vehicle / Engine</th>
                          <th className="p-3 font-medium">HW / SW</th>
                          <th className="p-3 font-medium">Size</th>
                          <th className="p-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {personalFiles.map((file) => (
                          <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="p-3">
                              <div className="font-semibold text-slate-900 dark:text-white max-w-xs truncate" title={file.name}>
                                {file.name}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                CRC32: {file.crc32 || 'N/A'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  file.fileType === 'original'
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                {file.fileType}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                              {file.ecuFamily}
                            </td>
                            <td className="p-3">
                              {file.vehicleCompatibility ? (
                                <div>
                                  <span className="font-medium text-slate-900 dark:text-white">
                                    {file.vehicleCompatibility.make} {file.vehicleCompatibility.model}
                                  </span>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {file.vehicleCompatibility.engine} ({file.vehicleCompatibility.stockPowerHp}HP)
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">Generic ECU</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              HW: {file.hardwareNumber}<br />
                              SW: {file.softwareNumber}
                            </td>
                            <td className="p-3 font-mono text-slate-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleLoadIntoWorkstation(file, false)}
                                  className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                                  title="Load as Stock in Workstation"
                                >
                                  Stock
                                </button>
                                <button
                                  onClick={() => handleLoadIntoWorkstation(file, true)}
                                  className="px-2 py-1 rounded bg-cyan-600/15 hover:bg-cyan-600/25 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 cursor-pointer"
                                  title="Load as Mod in Workstation"
                                >
                                  Mod
                                </button>
                                {file.hasReport && (
                                  <button
                                    onClick={() => handleOpenReport(file)}
                                    className="p-1 rounded text-cyan-600 hover:bg-cyan-50 dark:hover:bg-slate-800"
                                    title="View Calibration Report"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {file.isMine && (
                                  <button
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                    title="Delete from Vault"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: WORKSHOP PROFILE & SECURITY */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1018] p-6 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 text-cyan-600" />
                  <span>Workshop Identity &amp; Account Security</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Update your technician name, business garage identity, and login password.
                </p>

                {profileSuccessMsg && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number (Account UID)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.phoneNumber || ''}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/80 font-mono text-slate-500 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Phone number is permanently bound to your account and token wallet.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Technician / Tuner Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Samuel Renthlei"
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Workshop / Garage Name
                    </label>
                    <input
                      type="text"
                      value={workshopName}
                      onChange={(e) => setWorkshopName(e.target.value)}
                      placeholder="e.g. Apex Performance Tuning Lab"
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Set a password to login with phone number without waiting for OTP.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {isSavingProfile ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <span>Save Workshop Profile</span>
                      )}
                    </button>
                  </div>
                </form>
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
