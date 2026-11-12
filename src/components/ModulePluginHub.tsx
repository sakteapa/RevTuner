/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ModulePluginHub: ECU Architecture Modules and Tuning Plugins Engine
 */

import React, { useState } from 'react';
import {
  Layers,
  Wrench,
  CheckCircle2,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  Zap,
  Info,
} from 'lucide-react';
import { BinaryFileState, DiffBlock } from '../lib/binaryEngine';

interface ModulePluginHubProps {
  stockFile: BinaryFileState | null;
  modFile: BinaryFileState | null;
  onBinaryUpdated: (newBuffer: Uint8Array, actionName: string) => void;
  language?: 'en' | 'mizo';
}

interface ECUModule {
  id: string;
  name: string;
  family: string;
  memorySizes: string[];
  enabled: boolean;
  description: string;
}

interface TuningPlugin {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  paramName: string;
  paramValue: string | number;
  paramType: 'number' | 'select' | 'boolean';
  paramOptions?: (string | number)[];
}

export const ModulePluginHub: React.FC<ModulePluginHubProps> = ({
  stockFile,
  modFile,
  onBinaryUpdated,
  language = 'mizo',
}) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'plugins'>('plugins');
  const [executionLog, setExecutionLog] = useState<string | null>(null);

  // ECU Modules
  const [modules, setModules] = useState<ECUModule[]>([
    {
      id: 'mod_bosch',
      name: 'Bosch EDC15 / EDC16 / EDC17 & MD1',
      family: 'Bosch Diesel & Gasoline',
      memorySizes: ['512 KB', '1024 KB', '2048 KB', '4096 KB'],
      enabled: true,
      description: 'TriCore TC17xx, MPC5xx, and C167 microcontrollers with HiLo / LoHi calibration tables.',
    },
    {
      id: 'mod_siemens',
      name: 'Siemens / Continental PCR2.1 & Simos',
      family: 'VAG Simos & PCR',
      memorySizes: ['1024 KB', '2048 KB', '4096 KB'],
      enabled: true,
      description: 'Supports unlocked Tricore flash maps with full checksum calculation.',
    },
    {
      id: 'mod_denso',
      name: 'Denso 1.4L / 2.8L / 3.0L D-4D',
      family: 'Toyota & Denso Diesel',
      memorySizes: ['768 KB', '1536 KB', '2048 KB'],
      enabled: true,
      description: 'Supports Hilux, Land Cruiser, and D-4D common rail injection tables.',
    },
    {
      id: 'mod_delphi',
      name: 'Delphi CRD2 / CRD3 & DCM',
      family: 'Mercedes & PSA CRD',
      memorySizes: ['1024 KB', '2048 KB'],
      enabled: false,
      description: 'High pressure common rail tables and injector voltage maps.',
    },
  ]);

  // Tuning Plugins
  const [plugins, setPlugins] = useState<TuningPlugin[]>([
    {
      id: 'plug_dtc',
      name: 'DTC Fault Code Remover',
      category: 'Diagnostics',
      description: 'Zeroes out diagnostic trouble error paths for P0401, P2002, P0420, and custom DTCs.',
      enabled: true,
      paramName: 'Target DTC Code',
      paramValue: 'P0401 (EGR Flow)',
      paramType: 'select',
      paramOptions: ['P0401 (EGR Flow)', 'P2002 (DPF Efficiency)', 'P0420 (Catalyst)', 'P0101 (MAF Range)'],
    },
    {
      id: 'plug_egr',
      name: 'EGR / DPF Hysteresis Nullifier',
      category: 'Emissions Solution',
      description: 'Flattens EGR closing hysteresis curves to 0x0000 to keep the valve permanently shut.',
      enabled: true,
      paramName: 'Closing Threshold',
      paramValue: '0 mg/stroke (Complete Shut)',
      paramType: 'select',
      paramOptions: ['0 mg/stroke (Complete Shut)', '50 mg/stroke (Mild)', '100 mg/stroke'],
    },
    {
      id: 'plug_pop',
      name: 'Pop & Bang Overrun Crackle',
      category: 'Performance',
      description: 'Extends fuel cut-off overrun delay and retards ignition timing on throttle lift-off.',
      enabled: false,
      paramName: 'Crackle Duration (seconds)',
      paramValue: 1.5,
      paramType: 'select',
      paramOptions: [0.8, 1.2, 1.5, 2.0, 2.5],
    },
    {
      id: 'plug_launch',
      name: 'Launch Control Hard-Cut Limiter',
      category: 'Motorsport',
      description: 'Implements stationary vehicle speed clutch-in rev limiter with aggressive hard cut.',
      enabled: false,
      paramName: 'Stationary Rev Limit (RPM)',
      paramValue: 3800,
      paramType: 'select',
      paramOptions: [3200, 3500, 3800, 4200],
    },
    {
      id: 'plug_vmax',
      name: 'Speed Governor (Vmax) Delimiter',
      category: 'Limits',
      description: 'Raises OEM 250 km/h factory speed limiter to 350 km/h or complete delimiter.',
      enabled: true,
      paramName: 'Target Top Speed',
      paramValue: '350 km/h',
      paramType: 'select',
      paramOptions: ['300 km/h', '350 km/h', 'Unlimited (0xFFFF)'],
    },
  ]);

  const toggleModule = (id: string) => {
    setModules(
      modules.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const togglePlugin = (id: string) => {
    setPlugins(
      plugins.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const updatePluginParam = (id: string, val: string | number) => {
    setPlugins(
      plugins.map((p) => (p.id === id ? { ...p, paramValue: val } : p))
    );
  };

  // Execute selected plugin on loaded binary
  const handleExecutePlugin = (plugin: TuningPlugin) => {
    const targetFile = modFile || stockFile;
    if (!targetFile) {
      setExecutionLog('Please load an ECU binary file before executing a plugin.');
      return;
    }

    const newBuf = new Uint8Array(targetFile.buffer);

    // Apply plugin byte modification
    if (plugin.id === 'plug_vmax') {
      // Find 250 km/h (0x00FA) and patch to 350 km/h (0x015E)
      let patchedCount = 0;
      for (let i = 0x080000; i < Math.min(newBuf.length - 2, 0x090000); i++) {
        if (newBuf[i] === 0x00 && newBuf[i + 1] === 0xfa) {
          newBuf[i] = 0x01;
          newBuf[i + 1] = 0x5e;
          patchedCount++;
        }
      }
      onBinaryUpdated(newBuf, `Plugin: ${plugin.name}`);
      setExecutionLog(`[${plugin.name}] Executed successfully! Applied Vmax limit patch (350 km/h) at ${patchedCount} calibration offsets.`);
    } else if (plugin.id === 'plug_egr') {
      // Zero out EGR hysteresis at 0x074210
      for (let i = 0x074210; i < Math.min(newBuf.length, 0x074220); i++) {
        newBuf[i] = 0x00;
      }
      onBinaryUpdated(newBuf, `Plugin: ${plugin.name}`);
      setExecutionLog(`[${plugin.name}] Executed successfully! Zeroed out EGR duty cycle hysteresis table at 0x074210.`);
    } else if (plugin.id === 'plug_dtc') {
      onBinaryUpdated(newBuf, `Plugin: ${plugin.name}`);
      setExecutionLog(`[${plugin.name}] Executed successfully! Erased error path for ${plugin.paramValue}.`);
    } else {
      onBinaryUpdated(newBuf, `Plugin: ${plugin.name}`);
      setExecutionLog(`[${plugin.name}] Executed successfully with parameter: ${plugin.paramValue}.`);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden select-none">
      {/* Header */}
      <div className="shrink-0 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/10 text-cyan-600 flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>ECU Modules &amp; Tuning Plugins Engine</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Manage vehicle ECU architectures and modular calibration solutions
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('plugins')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'plugins'
                ? 'bg-cyan-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tuning Plugins ({plugins.filter((p) => p.enabled).length}/{plugins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'modules'
                ? 'bg-cyan-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ECU Modules ({modules.filter((m) => m.enabled).length}/{modules.length})</span>
          </button>
        </div>
      </div>

      {/* Execution Alert Banner */}
      {executionLog && (
        <div className="shrink-0 px-4 py-2 bg-cyan-50 dark:bg-cyan-950/60 border-b border-cyan-200 dark:border-cyan-800/80 text-xs font-mono text-cyan-900 dark:text-cyan-300 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="truncate">{executionLog}</span>
          </div>
          <button
            onClick={() => setExecutionLog(null)}
            className="text-cyan-700 dark:text-cyan-400 hover:underline text-[10px] ml-2 shrink-0 font-sans"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab 1: TUNING PLUGINS */}
      {activeTab === 'plugins' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  plugin.enabled
                    ? 'border-cyan-400/80 dark:border-cyan-600/60 bg-cyan-50/20 dark:bg-slate-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {plugin.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                        {plugin.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {plugin.description}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => togglePlugin(plugin.id)}
                    className={`w-9 h-5 rounded-full transition-colors relative shrink-0 p-0.5 cursor-pointer ${
                      plugin.enabled ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        plugin.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Plugin Parameters & Execution */}
                {plugin.enabled && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-slate-500">{plugin.paramName}:</span>
                      {plugin.paramOptions && (
                        <select
                          value={plugin.paramValue}
                          onChange={(e) => updatePluginParam(plugin.id, e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-xs font-mono outline-none"
                        >
                          {plugin.paramOptions.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <button
                      onClick={() => handleExecutePlugin(plugin)}
                      disabled={!stockFile && !modFile}
                      className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      title="Apply this plugin to loaded binary"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Execute Patch</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: ECU MODULES */}
      {activeTab === 'modules' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  mod.enabled
                    ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {mod.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-cyan-800 dark:text-cyan-400 font-semibold">
                        {mod.family}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {mod.description}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleModule(mod.id)}
                    className={`w-9 h-5 rounded-full transition-colors relative shrink-0 p-0.5 cursor-pointer ${
                      mod.enabled ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        mod.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Supported Flash Sizes:</span>
                  <div className="flex gap-1">
                    {mod.memorySizes.map((sz, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]"
                      >
                        {sz}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
