/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, CornerDownRight, Tag } from 'lucide-react';
import { ECUStringMatch } from '../lib/binaryEngine';

interface ECUStringInspectorProps {
  strings: ECUStringMatch[];
  onSelectOffset: (offset: number) => void;
}

export const ECUStringInspector: React.FC<ECUStringInspectorProps> = ({
  strings,
  onSelectOffset,
}) => {
  const [filterText, setFilterText] = useState('');

  const filteredStrings = strings.filter(
    (s) =>
      s.text.toLowerCase().includes(filterText.toLowerCase()) ||
      s.type.toLowerCase().includes(filterText.toLowerCase()) ||
      s.hexOffset.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col h-full overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">ECU Hardware / Software ID Scanner</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{strings.length} Found</span>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search software ID (e.g. 1037...)"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none font-mono shadow-2xs"
          />
        </div>
      </div>

      {/* String List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {filteredStrings.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500 text-xs">
            No matching ECU hardware/software strings detected in this binary.
          </div>
        ) : (
          filteredStrings.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onSelectOffset(item.offset)}
              className="p-2 rounded bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-400 dark:hover:border-cyan-500/40 hover:bg-slate-100/70 dark:hover:bg-slate-900/60 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-0.5 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-cyan-800 dark:text-cyan-400 font-semibold">
                    {item.type}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                    {item.text}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <span>Offset: {item.hexOffset}</span>
                </div>
              </div>

              <div className="text-slate-400 dark:text-slate-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors shrink-0">
                <CornerDownRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
