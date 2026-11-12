/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AIEngineerConsole: Gemini 3.8 Flash Automotive ECU Reverse-Engineering Copilot
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { BinaryFileState, toHexOffset, bytesToHexString } from '../lib/binaryEngine';

interface AIEngineerConsoleProps {
  stockFile: BinaryFileState | null;
  modFile: BinaryFileState | null;
  selectedOffset: number;
  language?: 'en' | 'mizo';
}

export const AIEngineerConsole: React.FC<AIEngineerConsoleProps> = ({
  stockFile,
  modFile,
  selectedOffset,
  language = 'mizo',
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract snippet of 32 bytes around selectedOffset
  const getContextSnippet = () => {
    const primary = modFile || stockFile;
    if (!primary) return null;

    const start = Math.max(0, selectedOffset - 8);
    const end = Math.min(primary.size, selectedOffset + 24);
    const slice = primary.buffer.slice(start, end);

    const sBytes = stockFile ? Array.from(stockFile.buffer.slice(start, end)) : [];
    const mBytes = modFile ? Array.from(modFile.buffer.slice(start, end)) : [];

    return {
      snippet: bytesToHexString(slice),
      stockBytes: sBytes,
      modBytes: mBytes,
      detectedECU: primary.detectedStrings[0]?.text || 'Bosch / Denso ECU',
    };
  };

  const handleRunAnalysis = async (customPrompt?: string) => {
    const query = customPrompt || userQuery;
    const ctx = getContextSnippet();

    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-ecu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset: selectedOffset,
          hexSnippet: ctx?.snippet || '',
          stockBytes: ctx?.stockBytes || [],
          modBytes: ctx?.modBytes || [],
          detectedECU: ctx?.detectedECU || '',
          userPrompt: query,
          language,
        }),
      });

      const data = await res.json();
      if (res.ok && data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        setAnalysisResult(data.error || 'Failed to complete analysis');
      }
    } catch (err: any) {
      setAnalysisResult(`Error: ${err.message || 'Network error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const promptChips = [
    {
      label: 'Identify Map at this offset',
      prompt: `Identify the ECU calibration map at offset ${toHexOffset(selectedOffset)} and explain its function.`,
    },
    {
      label: 'Explain Stock vs Mod Diff',
      prompt: `Explain what the modified bytes at offset ${toHexOffset(selectedOffset)} do to vehicle performance or emissions.`,
    },
    {
      label: 'Is this safe for Stage 1?',
      prompt: `Review the calibration values at offset ${toHexOffset(selectedOffset)} and evaluate if they are within safe margins for a Stage 1 tune.`,
    },
    {
      label: 'Scan for DTC Error Code',
      prompt: `Check if offset ${toHexOffset(selectedOffset)} belongs to a Diagnostic Trouble Code (DTC) error table or fault path.`,
    },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>AI Tuning Reverse-Engineering Copilot</span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-[10px] text-slate-500">
              Active Offset: <strong className="text-cyan-700 dark:text-cyan-400 font-mono">{toHexOffset(selectedOffset)}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setAnalysisResult(null)}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded transition-colors"
          title="Clear analysis"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/30 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleRunAnalysis(chip.prompt)}
            disabled={isLoading || (!stockFile && !modFile)}
            className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-300 hover:text-cyan-800 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 shadow-2xs shrink-0 flex items-center gap-1"
          >
            <Zap className="w-2.5 h-2.5 text-cyan-600" />
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Main Analysis Display */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 text-xs space-y-3 font-sans leading-relaxed">
        {isLoading ? (
          <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs text-slate-500 font-mono">
              Analyzing binary context at {toHexOffset(selectedOffset)}...
            </div>
          </div>
        ) : analysisResult ? (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 text-xs whitespace-pre-wrap font-sans">
            {analysisResult}
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-600 p-4">
            <Cpu className="w-8 h-8 mb-2 opacity-50" />
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Ready for Reverse Engineering
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
              Select a byte offset in the Hex Grid or 2D Map, then click any prompt chip above to get an instant engineering report.
            </p>
          </div>
        )}
      </div>

      {/* Custom Query Input */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (userQuery.trim()) handleRunAnalysis();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            placeholder="Ask AI about this ECU binary or offset..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !userQuery.trim()}
            className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
            title="Send query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
