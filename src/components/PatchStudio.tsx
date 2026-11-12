/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wrench, Play, Download, Upload, Trash2, CheckCircle2, AlertTriangle, BookmarkPlus, Sparkles, FileText, Info } from 'lucide-react';
import {
  PatchRule,
  PatchApplicationResult,
  BinaryFileState,
  DiffBlock,
  extractRuleFromDiff,
  applyPatchRule,
  bytesToHexString,
  toHexOffset,
  BUILTIN_ECU_RULES,
} from '../lib/binaryEngine';

interface PatchStudioProps {
  stockFile: BinaryFileState | null;
  modFile: BinaryFileState | null;
  selectedDiffBlock: DiffBlock | null;
  onBinaryUpdated: (newBuffer: Uint8Array, actionName: string) => void;
  onSelectOffset: (offset: number) => void;
}

const LOCAL_STORAGE_RULES_KEY = 'revtuner_saved_patch_rules_v1';

export const PatchStudio: React.FC<PatchStudioProps> = ({
  stockFile,
  modFile,
  selectedDiffBlock,
  onBinaryUpdated,
  onSelectOffset,
}) => {
  const [rules, setRules] = useState<PatchRule[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'learn' | 'autopatch'>('rules');

  // Rule creation state
  const [ruleName, setRuleName] = useState('');
  const [ruleEcuFamily, setRuleEcuFamily] = useState('');
  const [ruleCategory, setRuleCategory] = useState<PatchRule['category']>('EGR Off');
  const [contextSize, setContextSize] = useState(8);

  // Auto-patcher state
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [patchLogs, setPatchLogs] = useState<PatchApplicationResult[]>([]);
  const [isPatching, setIsPatching] = useState(false);

  // Load saved rules from localStorage and prepend built-ins
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_RULES_KEY);
      if (stored) {
        const customRules: PatchRule[] = JSON.parse(stored);
        setRules([...customRules, ...BUILTIN_ECU_RULES]);
      } else {
        setRules([...BUILTIN_ECU_RULES]);
      }
    } catch {
      setRules([...BUILTIN_ECU_RULES]);
    }
  }, []);

  // Update form when selectedDiffBlock changes
  useEffect(() => {
    if (selectedDiffBlock) {
      setRuleName(`Custom Patch at ${selectedDiffBlock.hexOffset}`);
      setRuleEcuFamily(stockFile?.detectedStrings[0]?.text || 'Universal ECU');
      setActiveTab('learn');
    }
  }, [selectedDiffBlock, stockFile]);

  // Save rules to localStorage (filtering out built-ins from storage to prevent duplicates)
  const saveCustomRules = (newRules: PatchRule[]) => {
    setRules(newRules);
    try {
      const customOnly = newRules.filter((r) => !r.id.startsWith('builtin_'));
      localStorage.setItem(LOCAL_STORAGE_RULES_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Failed to save rules to localStorage', e);
    }
  };

  // Handle Learn Rule
  const handleSaveLearnedRule = () => {
    if (!stockFile || !modFile || !selectedDiffBlock) return;

    const newRule = extractRuleFromDiff(
      stockFile.buffer,
      modFile.buffer,
      selectedDiffBlock,
      ruleName.trim() || `Patch at ${selectedDiffBlock.hexOffset}`,
      ruleEcuFamily.trim() || 'Generic ECU',
      ruleCategory,
      contextSize
    );

    const updated = [newRule, ...rules];
    saveCustomRules(updated);
    setSelectedRuleId(newRule.id);
    setActiveTab('rules');
  };

  // Export rules as JSON file
  const handleExportRules = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `RevTuner_ECU_Rules_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import rules from JSON file
  const handleImportRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const merged = [...parsed, ...rules.filter((r) => !parsed.some((p: PatchRule) => p.id === r.id))];
          saveCustomRules(merged);
        }
      } catch (err) {
        alert('Invalid rules JSON format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Delete a custom rule
  const handleDeleteRule = (id: string) => {
    if (id.startsWith('builtin_')) {
      alert('Built-in system rule templates cannot be deleted.');
      return;
    }
    const filtered = rules.filter((r) => r.id !== id);
    saveCustomRules(filtered);
    if (selectedRuleId === id) setSelectedRuleId('');
  };

  // Auto-Patcher Execution
  const handleApplySelectedPatch = () => {
    if (!stockFile) {
      alert('Please load a binary file first to apply a patch.');
      return;
    }
    const rule = rules.find((r) => r.id === selectedRuleId);
    if (!rule) {
      alert('Please select a patch rule first.');
      return;
    }

    setIsPatching(true);
    setTimeout(() => {
      const { updatedBuffer, result } = applyPatchRule(stockFile.buffer, rule);
      setPatchLogs((prev) => [result, ...prev]);

      if (result.status === 'applied') {
        onBinaryUpdated(updatedBuffer, `Patched with ${rule.name}`);
        if (result.matchedOffset !== undefined) {
          onSelectOffset(result.matchedOffset);
        }
      }
      setIsPatching(false);
    }, 150);
  };

  const activeRule = rules.find((r) => r.id === selectedRuleId);

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col h-full overflow-hidden shadow-xs">
      {/* Studio Navigation Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">DaVinci Signature &amp; Patch Studio</h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              activeTab === 'rules'
                ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Saved Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('learn')}
            disabled={!selectedDiffBlock}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              activeTab === 'learn'
                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-40'
            }`}
            title={selectedDiffBlock ? 'Learn rule from selected difference block' : 'Select a difference block first'}
          >
            Extract Rule
          </button>
          <button
            onClick={() => setActiveTab('autopatch')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              activeTab === 'autopatch'
                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Auto-Patcher
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* TAB 1: SAVED RULES & TEMPLATES */}
        {activeTab === 'rules' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Rule Library (Built-In + Custom)</span>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors shadow-2xs">
                  <Upload className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  <span>Import JSON</span>
                  <input type="file" accept=".json" onChange={handleImportRules} className="hidden" />
                </label>
                <button
                  onClick={handleExportRules}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors shadow-2xs"
                >
                  <Download className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  <span>Export Rules</span>
                </button>
              </div>
            </div>

            {/* Rules Cards */}
            <div className="space-y-2 pr-1">
              {rules.map((rule) => {
                const isSelected = rule.id === selectedRuleId;
                const isBuiltin = rule.id.startsWith('builtin_');

                return (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`p-3 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-50/70 dark:bg-cyan-500/10 border-cyan-400 dark:border-cyan-500/40 shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-950/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{rule.name}</span>
                          {isBuiltin ? (
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-cyan-800 dark:text-cyan-400 px-1.5 py-0.2 rounded font-mono font-semibold">
                              PRESET
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono border border-amber-300 dark:border-amber-900/50 font-semibold">
                              CUSTOM
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{rule.ecuFamily} · {rule.category}</div>
                      </div>

                      {!isBuiltin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRule(rule.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">{rule.description}</p>

                    {/* Byte Signature Preview */}
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500">ORIGINAL: </span>
                        <span className="text-slate-700 dark:text-slate-300">{bytesToHexString(rule.originalBytes.slice(0, 8))}</span>
                      </div>
                      <div>
                        <span className="text-amber-600 dark:text-amber-500">MOD: </span>
                        <span className="text-amber-700 dark:text-amber-300 font-semibold">{bytesToHexString(rule.modBytes.slice(0, 8))}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Offset: {rule.originalOffsetHex}</span>
                      <span>Pre/Post: {rule.preSignature.length}B / {rule.postSignature.length}B</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: EXTRACT SIGNATURE & LEARN RULE */}
        {activeTab === 'learn' && (
          <div className="space-y-3">
            {selectedDiffBlock ? (
              <>
                <div className="bg-amber-50/70 dark:bg-slate-950/60 border border-amber-200 dark:border-slate-800 rounded p-3 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold mb-1">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Learning Signature from Difference at {selectedDiffBlock.hexOffset}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Captures modified {selectedDiffBlock.length} bytes + 8 preceding bytes and 8 succeeding bytes for reliable pattern matching across ECU revisions.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Rule Name</label>
                    <input
                      type="text"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="e.g. Toyota Denso EGR Off"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">ECU Family</label>
                      <input
                        type="text"
                        value={ruleEcuFamily}
                        onChange={(e) => setRuleEcuFamily(e.target.value)}
                        placeholder="e.g. Bosch EDC17CP14"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                      <select
                        value={ruleCategory}
                        onChange={(e) => setRuleCategory(e.target.value as PatchRule['category'])}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none shadow-2xs"
                      >
                        <option value="EGR Off">EGR Off</option>
                        <option value="DPF Off">DPF Off</option>
                        <option value="DTC Off">DTC Off</option>
                        <option value="Speed Limiter">Speed Limiter</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  {/* Context Preview */}
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-1.5">
                    <div>
                      <span className="text-slate-500">Pre-Signature (8B): </span>
                      <span className="text-cyan-700 dark:text-cyan-400 font-semibold">
                        {bytesToHexString(
                          stockFile?.buffer.slice(
                            Math.max(0, selectedDiffBlock.startOffset - contextSize),
                            selectedDiffBlock.startOffset
                          ) || []
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Target Stock (Old): </span>
                      <span className="text-slate-700 dark:text-slate-300">{bytesToHexString(selectedDiffBlock.stockBytes)}</span>
                    </div>
                    <div>
                      <span className="text-amber-600 dark:text-amber-500">Target Mod (New): </span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold">{bytesToHexString(selectedDiffBlock.modBytes)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Post-Signature (8B): </span>
                      <span className="text-cyan-700 dark:text-cyan-400 font-semibold">
                        {bytesToHexString(
                          stockFile?.buffer.slice(
                            selectedDiffBlock.startOffset + selectedDiffBlock.length,
                            selectedDiffBlock.startOffset + selectedDiffBlock.length + contextSize
                          ) || []
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveLearnedRule}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Save Learned Rule to Workstation</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10 px-4 text-slate-500">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
                <div className="text-xs font-medium text-slate-700 dark:text-slate-400">No Difference Block Selected</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click on any detected difference block in the left panel to extract its signature and surrounding context.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AUTO-PATCHER ENGINE */}
        {activeTab === 'autopatch' && (
          <div className="space-y-3">
            <div className="bg-emerald-50/70 dark:bg-slate-950/60 border border-emerald-200 dark:border-slate-800 rounded p-3 text-xs">
              <div className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Automatic Context-Aware Firmware Patcher</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Applies selected patch rules to the active binary even if memory address offsets have shifted across different software revisions.
              </p>
            </div>

            {/* Active Rule Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Select Rule to Apply</label>
              <select
                value={selectedRuleId}
                onChange={(e) => setSelectedRuleId(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none shadow-2xs"
              >
                <option value="">-- Choose a Patch Rule --</option>
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Apply Action Button */}
            <button
              onClick={handleApplySelectedPatch}
              disabled={!selectedRuleId || isPatching || !stockFile}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs rounded transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isPatching ? 'Scanning Context & Patching...' : 'Scan & Apply Patch to Binary'}</span>
            </button>

            {/* Verification & Audit Logs */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Patch Audit &amp; Verification Log</span>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 max-h-[220px] overflow-y-auto space-y-2 text-[11px] font-mono">
                {patchLogs.length === 0 ? (
                  <div className="text-slate-500 text-center py-4">No patches executed yet.</div>
                ) : (
                  patchLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border ${
                        log.status === 'applied'
                          ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                          : log.status === 'already_applied'
                          ? 'border-cyan-300 dark:border-cyan-500/40 bg-cyan-50/80 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300'
                          : 'border-rose-300 dark:border-rose-500/40 bg-rose-50/80 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{log.ruleName}</span>
                        <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-black/40">
                          {log.status.replace('_', ' ')} ({log.confidence}%)
                        </span>
                      </div>
                      <div className="text-[10px] mt-1 text-slate-700 dark:text-slate-300">{log.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
