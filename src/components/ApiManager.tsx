/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ApiManager: Flasher Webhooks and Workshop REST API Keys Manager
 */

import React, { useState } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  Terminal,
  Activity,
  Globe,
} from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  status: 'active' | 'revoked';
}

export const ApiManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key_workshop_main',
      name: 'Workshop Toughbook Flasher Client',
      keyPrefix: 'rev_live_94f8••••••••',
      scopes: ['read', 'patch', 'flasher'],
      createdAt: '2026-11-12',
      lastUsedAt: 'Just now',
      status: 'active',
    },
    {
      id: 'key_dyno_logger',
      name: 'Dyno Data Logger & OBD Stream',
      keyPrefix: 'rev_live_21b7••••••••',
      scopes: ['read'],
      createdAt: '2026-11-10',
      lastUsedAt: '2 hours ago',
      status: 'active',
    },
  ]);

  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read', 'patch']);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generatedKeySecret, setGeneratedKeySecret] = useState<string | null>(null);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const rawSecret = `rev_live_${Math.random().toString(36).substring(2, 12)}_${Math.random().toString(36).substring(2, 12)}`;
    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      keyPrefix: `${rawSecret.substring(0, 16)}••••••••`,
      scopes: selectedScopes,
      createdAt: new Date().toISOString().slice(0, 10),
      lastUsedAt: 'Never',
      status: 'active',
    };

    setApiKeys([newKey, ...apiKeys]);
    setGeneratedKeySecret(rawSecret);
    setNewKeyName('');
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(
      apiKeys.map((k) => (k.id === id ? { ...k, status: 'revoked' } : k))
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="shrink-0 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/10 text-cyan-600 flex items-center justify-center font-bold">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Workshop REST API &amp; Flasher Integrations
            </h2>
            <p className="text-[11px] text-slate-500">
              Generate Bearer tokens for PCMflash, Scanmatik 2, and remote dyno consoles
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Generated Key Alert Modal */}
        {generatedKeySecret && (
          <div className="p-3.5 rounded-lg border border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold">
              <span>New API Secret Generated</span>
              <button
                onClick={() => setGeneratedKeySecret(null)}
                className="text-slate-400 hover:text-slate-600 text-[11px]"
              >
                Dismiss
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Please copy and store this API key securely. It will not be shown again.
            </p>
            <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 font-mono text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 select-all font-bold">
                {generatedKeySecret}
              </span>
              <button
                onClick={() => copyToClipboard(generatedKeySecret, 'secret')}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
              >
                {copiedKey === 'secret' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Generate New API Key Form */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-cyan-600" />
            <span>Generate New Workshop API Key</span>
          </h3>

          <form onSubmit={handleGenerateKey} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Key Description / Device Name</label>
              <input
                type="text"
                placeholder="e.g. Garage Scanmatik Laptop #2"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs outline-none"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold text-xs transition-colors shadow-2xs"
              >
                Create API Token
              </button>
            </div>
          </form>
        </div>

        {/* Live API Keys Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Active API Credentials
          </h3>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 px-3">Device / Application</th>
                  <th className="py-2 px-3">Token Prefix</th>
                  <th className="py-2 px-3">Permission Scopes</th>
                  <th className="py-2 px-3">Created</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {key.name}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {key.keyPrefix}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1 flex-wrap">
                        {key.scopes.map((s, i) => (
                          <span
                            key={i}
                            className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{key.createdAt}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          key.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {key.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {key.status === 'active' && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="px-2 py-0.5 text-[11px] text-rose-600 hover:text-rose-700 hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* cURL Example */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Terminal className="w-4 h-4 text-cyan-600" />
            <span>Flasher API Direct cURL Example</span>
          </div>
          <pre className="p-2.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-300 overflow-x-auto">
{`curl -X POST https://revtuner.app/api/flasher/patch \\
  -H "Authorization: Bearer rev_live_94f8..." \\
  -H "Content-Type: application/octet-stream" \\
  --data-binary @stock_ecu.bin`}
          </pre>
        </div>
      </div>
    </div>
  );
};
