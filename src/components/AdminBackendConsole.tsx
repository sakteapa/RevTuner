/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ServerBackendConsole: Dedicated Backend Administration Dashboard
 * Accessible EXCLUSIVELY by Admin Phone: 6009316925
 * Features: Manual Token Pack Setup, User Credit Ledger & Injection, Payment Records, and Engine Settings.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Coins,
  Users,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  Cpu,
  FolderArchive,
  Upload,
  FileText,
  TrendingUp,
  Sliders,
  ExternalLink,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { useTokens, TokenPackItem } from '../lib/tokenContext';
import { FlashReportModal } from './FlashReportModal';
import { FlashRepoFile, FlashAnalysisReport } from '../../server';
import { BinaryFileState, parseBinaryBuffer } from '../lib/binaryEngine';

interface AdminBackendConsoleProps {
  onLoadIntoWorkstation?: (fileState: BinaryFileState, isMod: boolean) => void;
}

export const AdminBackendConsole: React.FC<AdminBackendConsoleProps> = ({
  onLoadIntoWorkstation,
}) => {
  const { user, isAdmin } = useAuth();
  const { fetchPacks } = useTokens();

  const [activeTab, setActiveTab] = useState<'packs' | 'users' | 'transactions' | 'flash_repo'>('flash_repo');
  const [packs, setPacks] = useState<TokenPackItem[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [flashFiles, setFlashFiles] = useState<FlashRepoFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingFlash, setIsUploadingFlash] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Selected Report Modal State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FlashAnalysisReport | null>(null);
  const [selectedFile, setSelectedFile] = useState<FlashRepoFile | null>(null);

  // Flash File Editing Modal State (Admin can change name, type, HW/SW, ECU Family, paired file)
  const [isEditFlashOpen, setIsEditFlashOpen] = useState(false);
  const [editingFlashFile, setEditingFlashFile] = useState<FlashRepoFile | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editFileType, setEditFileType] = useState<'original' | 'tuned'>('original');
  const [editEcuFamily, setEditEcuFamily] = useState('');
  const [editHwNumber, setEditHwNumber] = useState('');
  const [editSwNumber, setEditSwNumber] = useState('');
  const [editPairedId, setEditPairedId] = useState('');

  // Pack Creation / Editing state
  const [isEditingPack, setIsEditingPack] = useState(false);
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [packName, setPackName] = useState('');
  const [packTokens, setPackTokens] = useState<number>(10);
  const [packPriceINR, setPackPriceINR] = useState<number>(999);
  const [packPriceUSD, setPackPriceUSD] = useState<number>(15);
  const [packDesc, setPackDesc] = useState('');
  const [packBadge, setPackBadge] = useState('');

  // Manual User Credit Injection
  const [targetPhone, setTargetPhone] = useState('');
  const [grantAmount, setGrantAmount] = useState<number>(5);

  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-user-phone': user?.phoneNumber || '',
  };

  // Guard: strictly only 6009316925 can view
  if (!isAdmin || user?.phoneNumber !== '6009316925') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <Lock className="w-12 h-12 text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Server Backend Access Denied
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          He server backend hi Administrator phone <strong>6009316925</strong> chauh tana luh theih a ni. Khawngaihin Admin account-in in-login rawh le.
        </p>
      </div>
    );
  }

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch packs
      const packsRes = await fetch('/api/admin/packs', { headers: adminHeaders });
      if (packsRes.ok) {
        const data = await packsRes.json();
        setPacks(data.packs || []);
      }

      // Fetch users
      const usersRes = await fetch('/api/admin/users', { headers: adminHeaders });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersList(data.users || []);
      }

      // Fetch transactions
      const txRes = await fetch('/api/admin/transactions', { headers: adminHeaders });
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }

      // Fetch Flash Repository
      const repoRes = await fetch('/api/admin/flash-repo', { headers: adminHeaders });
      if (repoRes.ok) {
        const data = await repoRes.json();
        setFlashFiles(data.files || []);
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleOpenReport = async (fileItem: FlashRepoFile) => {
    try {
      setSelectedFile(fileItem);
      const res = await fetch(`/api/admin/flash-repo/${fileItem.id}/report`, { headers: adminHeaders });
      if (res.ok) {
        const data = await res.json();
        setSelectedReport(data.report);
        setIsReportOpen(true);
      }
    } catch (err: any) {
      showNotice(`Failed to open report: ${err.message}`);
    }
  };

  const handleUploadFlashBinary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFlash(true);
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const buf = evt.target?.result as ArrayBuffer;
        if (buf) {
          const parsed = parseBinaryBuffer(file.name, buf);

          try {
            const res = await fetch('/api/admin/flash-repo/upload', {
              method: 'POST',
              headers: adminHeaders,
              body: JSON.stringify({
                fileName: file.name,
                size: parsed.size,
                crc32: parsed.crc32,
                detectedStrings: parsed.detectedStrings,
                sampleBytes: Array.from(parsed.buffer.slice(0, 32)),
              }),
            });

            if (res.ok) {
              const data = await res.json();
              showNotice(`Flash "${file.name}" learned & paired with ${data.matchedWith || 'Repository'}!`);
              loadAdminData();
              if (data.report && data.file) {
                setSelectedFile(data.file);
                setSelectedReport(data.report);
                setIsReportOpen(true);
              }
            }
          } catch (err: any) {
            showNotice(`Upload error: ${err.message}`);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    });

    e.target.value = '';
    setIsUploadingFlash(false);
  };

  const handleOpenEditFlash = (f: FlashRepoFile) => {
    setEditingFlashFile(f);
    setEditFileName(f.name);
    setEditFileType(f.fileType);
    setEditEcuFamily(f.ecuFamily);
    setEditHwNumber(f.hardwareNumber);
    setEditSwNumber(f.softwareNumber);
    setEditPairedId(f.pairedFileId || '');
    setIsEditFlashOpen(true);
  };

  const handleSaveEditFlash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlashFile) return;

    try {
      const res = await fetch(`/api/admin/flash-repo/${editingFlashFile.id}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          name: editFileName,
          fileType: editFileType,
          ecuFamily: editEcuFamily,
          hardwareNumber: editHwNumber,
          softwareNumber: editSwNumber,
          pairedFileId: editPairedId || undefined,
        }),
      });

      if (res.ok) {
        showNotice(`Flash file "${editFileName}" successfully modified & updated in database.`);
        setIsEditFlashOpen(false);
        setEditingFlashFile(null);
        loadAdminData();
      }
    } catch (err: any) {
      showNotice(`Failed to update flash file: ${err.message}`);
    }
  };

  const handleDeleteFlash = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from flash repository?`)) return;
    try {
      const res = await fetch(`/api/admin/flash-repo/${id}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (res.ok) {
        showNotice(`Removed "${name}" from repository.`);
        loadAdminData();
      }
    } catch (err: any) {
      showNotice(`Error: ${err.message}`);
    }
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Save or Create Pack
  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName.trim()) return;

    try {
      if (isEditingPack && editingPackId) {
        // Update pack
        const res = await fetch(`/api/admin/packs/${editingPackId}`, {
          method: 'PUT',
          headers: adminHeaders,
          body: JSON.stringify({
            name: packName,
            tokenCount: packTokens,
            priceINR: packPriceINR,
            priceUSD: packPriceUSD,
            description: packDesc,
            badge: packBadge || undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setPacks(data.packs);
          showNotice(`Pack "${packName}" successfully updated!`);
        }
      } else {
        // Create new pack
        const res = await fetch('/api/admin/packs/create', {
          method: 'POST',
          headers: adminHeaders,
          body: JSON.stringify({
            name: packName,
            tokenCount: packTokens,
            priceINR: packPriceINR,
            priceUSD: packPriceUSD,
            description: packDesc,
            badge: packBadge || undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setPacks(data.packs);
          showNotice(`New Token Pack "${packName}" created successfully!`);
        }
      }
      fetchPacks();
      resetPackForm();
    } catch (err: any) {
      showNotice(`Error: ${err.message}`);
    }
  };

  const resetPackForm = () => {
    setIsEditingPack(false);
    setEditingPackId(null);
    setPackName('');
    setPackTokens(10);
    setPackPriceINR(999);
    setPackPriceUSD(15);
    setPackDesc('');
    setPackBadge('');
  };

  const handleDeletePack = async (id: string) => {
    if (!confirm('Are you sure you want to delete this token pack?')) return;
    try {
      const res = await fetch(`/api/admin/packs/${id}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setPacks(data.packs);
        fetchPacks();
        showNotice('Token pack removed.');
      }
    } catch (err: any) {
      showNotice(`Error: ${err.message}`);
    }
  };

  const handleManualGrantCredits = async (phone: string, amount: number) => {
    try {
      const res = await fetch('/api/admin/credits/grant', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ targetPhone: phone, amount }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(`Credited +${amount} Tokens to phone ${phone}. New Balance: ${data.newBalance}`);
        loadAdminData();
      }
    } catch (err: any) {
      showNotice(`Failed to grant tokens: ${err.message}`);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden select-none">
      {/* Top Admin Header */}
      <div className="shrink-0 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600/10 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Server Backend Admin Control Center
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                ADMIN: 6009316925
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Manual Token Pack Setup, User Credit Injection, and Flasher Settings
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('flash_repo')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'flash_repo'
                ? 'bg-rose-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Flash Repository &amp; AI Diff ({flashFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('packs')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'packs'
                ? 'bg-rose-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Manage Packs ({packs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'users'
                ? 'bg-rose-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users &amp; Credits</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'transactions'
                ? 'bg-rose-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payments</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="shrink-0 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tab 0: FLASH REPOSITORY & AI COMPARISON ENGINE */}
      {activeTab === 'flash_repo' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          
          {/* Top Upload & Learning Banner */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  Automated Binary Learning &amp; AI Comparison Engine
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Server Backend Flash Binary Database</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                  Flash .bin i upload apiangin system hian hardware/software numbers a chhiar a, database a awm sa te nen in-ang a awm em tih compare-in, original leh tuned inkar danglamna kimchang tak report a siam nghal zel ang.
                </p>
              </div>

              {/* Upload Action */}
              <label className="cursor-pointer px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm flex items-center gap-2 shrink-0">
                <Upload className="w-4 h-4" />
                <span>{isUploadingFlash ? 'Analyzing & Learning...' : 'Upload Flash Binary (.bin)'}</span>
                <input
                  type="file"
                  multiple
                  accept=".bin,.ori,.mod"
                  className="hidden"
                  onChange={handleUploadFlashBinary}
                  disabled={isUploadingFlash}
                />
              </label>
            </div>
          </div>

          {/* Flash Files Database Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FolderArchive className="w-3.5 h-3.5 text-rose-600" />
                <span>Cataloged Flash Files in Database ({flashFiles.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                File tin hian anmahni pual calibration difference report page an nei vek e.
              </span>
            </div>

            {flashFiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                No flash files in repository. Upload a .bin flash file to start automated AI learning and comparison.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3">ECU Family</th>
                      <th className="py-2.5 px-3">HW / SW Number</th>
                      <th className="py-2.5 px-3">CRC32 / Size</th>
                      <th className="py-2.5 px-3">AI Matched Pair</th>
                      <th className="py-2.5 px-3 text-right">Calibration Report</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {flashFiles.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            f.fileType === 'tuned'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          }`}>
                            {f.fileType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                          {f.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {f.ecuFamily}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          <div>HW: <span className="font-bold text-slate-800 dark:text-slate-200">{f.hardwareNumber}</span></div>
                          <div className="text-[10px] text-slate-400">SW: {f.softwareNumber}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          <div>{f.crc32}</div>
                          <div className="text-[10px]">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {f.pairedFileId ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate max-w-[140px] font-mono">Matched &amp; Linked</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Benchmark Base</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenReport(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Report</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditFlash(f)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                              title="Edit/Modify file in database"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFlash(f.id, f.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* Tab 1: MANAGE TOKEN PACKS */}
      {activeTab === 'packs' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Create / Edit Pack Form */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-rose-600" />
              <span>{isEditingPack ? 'Edit Token Pack' : 'Manual Setup: Create New Token Pack'}</span>
            </h3>

            <form onSubmit={handleSavePack} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Pack Name</label>
                <input
                  type="text"
                  placeholder="e.g. Master Fleet Pack"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Token Count</label>
                <input
                  type="number"
                  placeholder="10"
                  value={packTokens}
                  onChange={(e) => setPackTokens(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Price (INR ₹)</label>
                <input
                  type="number"
                  placeholder="999"
                  value={packPriceINR}
                  onChange={(e) => setPackPriceINR(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Price (USD $)</label>
                <input
                  type="number"
                  placeholder="15"
                  value={packPriceUSD}
                  onChange={(e) => setPackPriceUSD(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs outline-none font-mono"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Description / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Ideal for stage 1 & 2 tuning garages"
                  value={packDesc}
                  onChange={(e) => setPackDesc(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Badge (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Best Seller"
                  value={packBadge}
                  onChange={(e) => setPackBadge(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs outline-none"
                />
              </div>

              <div className="sm:col-span-4 flex items-center justify-end gap-2 pt-1">
                {isEditingPack && (
                  <button
                    type="button"
                    onClick={resetPackForm}
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium text-xs"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold text-xs shadow-xs"
                >
                  {isEditingPack ? 'Update Pack' : 'Save & Publish Pack'}
                </button>
              </div>
            </form>
          </div>

          {/* Active Packs Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Live Token Packs on Platform
            </h3>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 px-3">Pack Name</th>
                    <th className="py-2 px-3">Tokens</th>
                    <th className="py-2 px-3">Price (INR)</th>
                    <th className="py-2 px-3">Price (USD)</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {packs.map((pack) => (
                    <tr key={pack.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{pack.name}</span>
                          {pack.badge && (
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              {pack.badge}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {pack.tokenCount}
                      </td>
                      <td className="py-2 px-3 font-mono">₹{pack.priceINR}</td>
                      <td className="py-2 px-3 font-mono">${pack.priceUSD}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[200px]">
                        {pack.description}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setIsEditingPack(true);
                              setEditingPackId(pack.id);
                              setPackName(pack.name);
                              setPackTokens(pack.tokenCount);
                              setPackPriceINR(pack.priceINR);
                              setPackPriceUSD(pack.priceUSD);
                              setPackDesc(pack.description);
                              setPackBadge(pack.badge || '');
                            }}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"
                            title="Edit pack"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePack(pack.id)}
                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded text-rose-600"
                            title="Delete pack"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: USERS & CREDIT INJECTION */}
      {activeTab === 'users' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Quick Credit Injection Tool */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-rose-600" />
              <span>Manual Credit Injection Tool</span>
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="User Phone Number (e.g. 9876543210)"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs outline-none font-mono w-56"
              />
              <input
                type="number"
                placeholder="Tokens"
                value={grantAmount}
                onChange={(e) => setGrantAmount(Number(e.target.value))}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs outline-none font-mono w-24"
              />
              <button
                onClick={() => handleManualGrantCredits(targetPhone, grantAmount)}
                disabled={!targetPhone.trim()}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors disabled:opacity-40"
              >
                + Inject Credits
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Registered Tuner Accounts ({usersList.length})
            </h3>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 px-3">Phone</th>
                    <th className="py-2 px-3">Tuner Name</th>
                    <th className="py-2 px-3">Workshop</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Credits Balance</th>
                    <th className="py-2 px-3 text-right">Instant Top-Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {u.phoneNumber}
                      </td>
                      <td className="py-2 px-3">{u.displayName}</td>
                      <td className="py-2 px-3 text-slate-500">{u.workshopName}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            u.role === 'admin'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {u.tokenBalance} Credits
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleManualGrantCredits(u.phoneNumber, 5)}
                            className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-mono font-semibold"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleManualGrantCredits(u.phoneNumber, 20)}
                            className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-mono font-semibold"
                          >
                            +20
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: TRANSACTIONS & PAYMENTS */}
      {activeTab === 'transactions' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              UPI &amp; Card Recharge Transactions ({transactions.length})
            </h3>

            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 rounded border border-slate-200 dark:border-slate-800">
                No recharge transactions recorded yet. Users purchasing token packs will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">User Phone</th>
                      <th className="py-2 px-3">Pack</th>
                      <th className="py-2 px-3">Tokens</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Reference / UTR</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {t.phoneNumber}
                        </td>
                        <td className="py-2 px-3">{t.packName}</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-600">
                          +{t.tokenCount}
                        </td>
                        <td className="py-2 px-3 font-mono">₹{t.amountINR}</td>
                        <td className="py-2 px-3 font-mono text-[11px] uppercase">{t.paymentMethod}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                          {t.referenceId}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {t.status.toUpperCase()}
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
      )}

      {/* Modal: Comprehensive Linked Calibration & AI Comparison Report */}
      <FlashReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={selectedReport}
        file={selectedFile}
        onLoadIntoWorkstation={onLoadIntoWorkstation}
      />

      {/* Modal: Admin Edit & Modify Flash Binary Record */}
      {isEditFlashOpen && editingFlashFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Admin: Flash File Database Siam Thatna
                </h3>
              </div>
              <button
                onClick={() => setIsEditFlashOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditFlash} className="p-4 space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 font-mono text-xs outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    File Type
                  </label>
                  <select
                    value={editFileType}
                    onChange={(e) => setEditFileType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs outline-none"
                  >
                    <option value="original">Original (Stock)</option>
                    <option value="tuned">Tuned (Mod / Stage)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    ECU Family
                  </label>
                  <input
                    type="text"
                    value={editEcuFamily}
                    onChange={(e) => setEditEcuFamily(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Hardware Number (HW)
                  </label>
                  <input
                    type="text"
                    value={editHwNumber}
                    onChange={(e) => setEditHwNumber(e.target.value)}
                    placeholder="e.g. 0281013501"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Software Number (SW)
                  </label>
                  <input
                    type="text"
                    value={editSwNumber}
                    onChange={(e) => setEditSwNumber(e.target.value)}
                    placeholder="e.g. 1037381341"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Paired Binary File (for AI Diff Comparison)
                </label>
                <select
                  value={editPairedId}
                  onChange={(e) => setEditPairedId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs outline-none"
                >
                  <option value="">None (Standalone File)</option>
                  {flashFiles
                    .filter((f) => f.id !== editingFlashFile.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        [{f.fileType.toUpperCase()}] {f.name} (HW: {f.hardwareNumber})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditFlashOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-2xs"
                >
                  Save Changes in Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
