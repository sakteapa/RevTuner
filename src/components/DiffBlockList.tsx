/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, ArrowRight, Activity, Wrench, Search } from 'lucide-react';
import { DiffBlock, bytesToHexString } from '../lib/binaryEngine';

interface DiffBlockListProps {
  diffBlocks: DiffBlock[];
  totalDiffBytes: number;
  activeDiffIndex: number;
  onSelectDiff: (index: number) => void;
  onInspect2D: (offset: number, length: number) => void;
  onLearnRule: (diffBlock: DiffBlock) => void;
}

export const DiffBlockList: React.FC<DiffBlockListProps> = ({
  diffBlocks,
  totalDiffBytes,
  activeDiffIndex,
  onSelectDiff,
  onInspect2D,
  onLearnRule,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col h-full overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Detected Difference Blocks</h3>
        </div>
        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span className="text-amber-700 dark:text-amber-400 font-semibold">{diffBlocks.length}</span> blocks (
          <span className="text-slate-700 dark:text-slate-300 font-medium">{totalDiffBytes}</span> bytes)
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1.5">
        {diffBlocks.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
            <div className="text-xs font-medium text-slate-700 dark:text-slate-400">Zero Differences Detected</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Load both a Stock .bin and a Mod .bin to inspect and group modified calibration blocks.
            </p>
          </div>
        ) : (
          diffBlocks.map((block, idx) => {
            const isActive = idx === activeDiffIndex;
            return (
              <div
                key={block.id}
                onClick={() => onSelectDiff(idx)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500/40 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-850/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">{block.hexOffset}</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                      {block.length} {block.length === 1 ? 'byte' : 'bytes'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">#{idx + 1}</span>
                </div>

                {/* Hex Comparison Snippet */}
                <div className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-1 overflow-x-auto border border-slate-200 dark:border-transparent">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-500 text-[9px] w-8 shrink-0 font-medium">STOCK:</span>
                    <span className="text-slate-800 dark:text-slate-300 truncate">{bytesToHexString(block.stockBytes.slice(0, 16))}</span>
                    {block.stockBytes.length > 16 && <span className="text-slate-400">...</span>}
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-amber-700 dark:text-amber-400 text-[9px] w-8 shrink-0 font-semibold">MOD:</span>
                    <span className="text-amber-700 dark:text-amber-300 font-bold truncate">{bytesToHexString(block.modBytes.slice(0, 16))}</span>
                    {block.modBytes.length > 16 && <span className="text-slate-400">...</span>}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspect2D(block.startOffset, Math.max(16, block.length));
                    }}
                    className="flex items-center gap-1 text-[11px] text-cyan-700 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium hover:underline"
                    title="View 2D Curve graph for this block"
                  >
                    <Activity className="w-3 h-3" />
                    <span>2D Curve</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLearnRule(block);
                    }}
                    className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 font-semibold hover:underline"
                    title="Extract DaVinci patch rule with 8-byte context signatures"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Learn Rule</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
