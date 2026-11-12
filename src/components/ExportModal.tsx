/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ExportModal: PCMflash / Scanmatik Binary Export with Token Credit Consumption
 */

import React, { useState } from 'react';
import { Download, CheckCircle2, ShieldCheck, Cpu, X, Coins, Lock } from 'lucide-react';
import { BinaryFileState, computeCRC32, computeCRC16 } from '../lib/binaryEngine';
import { useTokens } from '../lib/tokenContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFile: BinaryFileState | null;
  stockFile: BinaryFileState | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeFile,
  stockFile,
}) => {
  const { tokenBalance, consumeToken, setIsRechargeModalOpen } = useTokens();

  if (!isOpen || !activeFile) return null;

  const currentCrc32 = computeCRC32(activeFile.buffer);
  const currentCrc16 = computeCRC16(activeFile.buffer);

  // Suggested filename
  const [exportFilename, setExportFilename] = useState(() => {
    const base = activeFile.name.replace(/\.[^/.]+$/, '');
    return `${base}_REV_TUNED.bin`;
  });

  const isExactSize = stockFile ? activeFile.buffer.length === stockFile.size : true;
  const isZeroTokens = tokenBalance <= 0;

  const handleDownload = async () => {
    // Attempt token consumption first
    const success = await consumeToken('PCMflash Binary Export');
    if (!success) {
      // Tokens exhausted, recharge modal opens automatically
      onClose();
      setIsRechargeModalOpen(true);
      return;
    }

    // Create Blob directly from Uint8Array
    const blob = new Blob([activeFile.buffer as unknown as BlobPart], {
      type: 'application/octet-stream',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename.trim() || 'patched_ecu.bin';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              PCMflash / Scanmatik Binary Export
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Token Credit Deduction Warning / Notice */}
        <div
          className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
            isZeroTokens
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2 font-mono">
            {isZeroTokens ? (
              <Lock className="w-4 h-4 text-rose-600" />
            ) : (
              <Coins className="w-4 h-4 text-emerald-600" />
            )}
            <div>
              {isZeroTokens ? (
                <div>
                  <strong className="text-rose-700 dark:text-rose-400">0 Credits Remaining.</strong> Export locked.
                </div>
              ) : (
                <div>
                  Export will consume <strong>1 Usage Token</strong>. Current balance:{' '}
                  <strong>{tokenBalance}</strong>
                </div>
              )}
            </div>
          </div>

          {isZeroTokens && (
            <button
              onClick={() => {
                onClose();
                setIsRechargeModalOpen(true);
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold text-xs transition-colors shrink-0"
            >
              Recharge Now
            </button>
          )}
        </div>

        {/* Binary Integrity Audit */}
        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Target File Size:</span>
            <span className="text-slate-900 dark:text-slate-200 font-bold">
              {activeFile.buffer.length.toLocaleString()} bytes
            </span>
          </div>

          {stockFile && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Stock File Size:</span>
              <span className="text-slate-700 dark:text-slate-300">{stockFile.size.toLocaleString()} bytes</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400">Exact Size Preservation:</span>
            {isExactSize ? (
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Match (100% Exact)</span>
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Size Mismatch Warning</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">New File CRC32:</span>
            <span className="text-cyan-700 dark:text-cyan-300 font-bold">{currentCrc32}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">New File CRC16-CCITT:</span>
            <span className="text-cyan-700 dark:text-cyan-300 font-bold">{currentCrc16}</span>
          </div>
        </div>

        {/* Filename Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Export Filename
          </label>
          <input
            type="text"
            value={exportFilename}
            onChange={(e) => setExportFilename(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-200 outline-none shadow-2xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isZeroTokens}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs rounded transition-all shadow-md shadow-cyan-600/20 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Download .BIN (-1 Credit)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
