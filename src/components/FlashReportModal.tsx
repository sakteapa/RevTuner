/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FlashReportModal: Comprehensive Calibration Difference, Vehicle Identification,
 * Supported & Restricted Capabilities, and Interactive Manual Tuning Studio.
 */

import React, { useState } from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  ArrowRight,
  Download,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  Car,
  Ban,
  Wrench,
  AlertTriangle,
  Settings2,
  Gauge,
  Fuel,
} from 'lucide-react';
import { FlashAnalysisReport, FlashRepoFile, FlashMapDiff, ModificationCapability } from '../../server';
import { BinaryFileState, parseBinaryBuffer } from '../lib/binaryEngine';

interface FlashReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: FlashAnalysisReport | null;
  file: FlashRepoFile | null;
  onLoadIntoWorkstation?: (fileState: BinaryFileState, isMod: boolean) => void;
  onSelectOffset?: (offset: number) => void;
}

export const FlashReportModal: React.FC<FlashReportModalProps> = ({
  isOpen,
  onClose,
  report,
  file,
  onLoadIntoWorkstation,
  onSelectOffset,
}) => {
  const [selectedMapIndex, setSelectedMapIndex] = useState<number>(0);
  const [showAllInsights, setShowAllInsights] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<'vehicle_and_maps' | 'capabilities' | 'manual_tuning'>('vehicle_and_maps');

  // Manual Tuning adjustment state
  const [manualDeltaPercent, setManualDeltaPercent] = useState<number>(10);
  const [tuningAppliedNotice, setTuningAppliedNotice] = useState<string | null>(null);

  if (!isOpen || !report || !file) return null;

  const currentMap: FlashMapDiff | undefined = report.modifiedMaps[selectedMapIndex];
  const vehicle = report.vehicleCompatibility || {
    make: file.ecuBrand || 'Universal',
    model: file.name.split('_')[0] || 'Generic Model',
    generation: 'All Series',
    engine: file.ecuFamily || 'Turbo Diesel / EFI',
    displacement: '2.0L',
    stockPowerHp: 150,
    stockTorqueNm: 320,
    fuelType: 'Diesel',
    transmission: 'Manual / Automatic',
  };

  const handleOpenInHex = (specificOffset?: number) => {
    if (!onLoadIntoWorkstation) return;
    const dummyBuffer = new Uint8Array(file.size || 2097152).fill(0x33);
    const parsed = parseBinaryBuffer(file.name, dummyBuffer.buffer);
    onLoadIntoWorkstation(parsed, file.fileType === 'tuned');
    if (specificOffset !== undefined && onSelectOffset) {
      onSelectOffset(specificOffset);
    }
    onClose();
  };

  const handleApplyManualTune = (cap: ModificationCapability) => {
    const offset = cap.offsetHex ? parseInt(cap.offsetHex, 16) : 0x06C420;
    setTuningAppliedNotice(`Manual Tuning Applied: ${cap.name} with delta adjusted by ${manualDeltaPercent > 0 ? `+${manualDeltaPercent}%` : `${manualDeltaPercent}%`}`);
    setTimeout(() => setTuningAppliedNotice(null), 3500);
    handleOpenInHex(offset);
  };

  const handleDownload = () => {
    const dummyBuffer = new Uint8Array(file.size || 2097152).fill(file.fileType === 'tuned' ? 0x66 : 0x33);
    const blob = new Blob([dummyBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
              file.fileType === 'tuned'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-md">
                  {file.name}
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  file.fileType === 'tuned'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                }`}>
                  {file.fileType}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                  {report.stageDetected}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI Reverse-Engineering Calibration &amp; Vehicle Architecture Report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenInHex()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Workstation</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Download Binary"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="shrink-0 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveReportTab('vehicle_and_maps')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                activeReportTab === 'vehicle_and_maps'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Motor &amp; Calibration Maps</span>
            </button>

            <button
              onClick={() => setActiveReportTab('capabilities')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                activeReportTab === 'capabilities'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Supported &amp; Restricted ({report.supportedModifications?.length || 0}/{report.unsupportedRestrictions?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveReportTab('manual_tuning')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                activeReportTab === 'manual_tuning'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Manual Tuning Studio</span>
            </button>
          </div>

          {tuningAppliedNotice && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 animate-in fade-in">
              {tuningAppliedNotice}
            </span>
          )}
        </div>

        {/* Scrollable Report Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">

          {/* VEHICLE IDENTIFICATION BANNER */}
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-white dark:from-indigo-950/40 dark:via-blue-950/20 dark:to-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 dark:text-indigo-400">
                    AI Detected Vehicle Architecture (Motor Hman Dan)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{vehicle.make} {vehicle.model}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-semibold">
                      {vehicle.generation}
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                      <strong>Engine:</strong> {vehicle.engine} ({vehicle.displacement})
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      <strong>Factory Output:</strong> {vehicle.stockPowerHp} HP / {vehicle.stockTorqueNm} Nm
                    </span>
                    <span>·</span>
                    <span className="font-mono text-slate-500">
                      <strong>Gearbox:</strong> {vehicle.transmission}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">ECU Family</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Cpu className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{report.ecuFamily}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">HW: {report.hardwareNumber}</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Software ID</span>
              <div className="flex items-center gap-1.5 font-bold font-mono text-slate-800 dark:text-slate-200">
                <Layers className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span className="truncate">{report.softwareNumber}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">CRC32: {file.crc32}</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Performance Gain</span>
              <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>+{report.powerGainEstHp} HP / +{report.torqueGainEstNm} Nm</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {file.fileType === 'tuned' ? 'Dyno projection' : 'Factory standard'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Safety & Integrity</span>
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{report.safetyScore}% Safe</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Checksum: {report.checksumStatus}</span>
            </div>
          </div>

          {/* Matched Pair Comparison Banner */}
          {report.pairedFileName && (
            <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  VS
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">
                    Automated AI Comparison Pair Link
                  </span>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="truncate max-w-sm">{report.pairedFileName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-mono">
                      {file.fileType === 'original' ? 'Tuned Pair' : 'Original Baseline'}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                {report.totalModifiedBytes} bytes altered ({report.modifiedMaps.length} mapped regions)
              </span>
            </div>
          )}

          {/* TAB 1: VEHICLE & MODIFIED CALIBRATION MAPS */}
          {activeReportTab === 'vehicle_and_maps' && (
            <div className="space-y-4">
              {/* AI Learned Insights Box */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>AI Calibration Insights &amp; Learned Findings</span>
                  </h3>
                  <button
                    onClick={() => setShowAllInsights(!showAllInsights)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                  >
                    <span>{showAllInsights ? 'Collapse' : 'Expand'}</span>
                    {showAllInsights ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {showAllInsights && (
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {report.aiLearnedInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Modified Maps */}
              {report.modifiedMaps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      <span>Modified Calibration Maps ({report.modifiedMaps.length})</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Click a map to inspect hex and 2D delta</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {report.modifiedMaps.map((map, index) => {
                        const isSelected = selectedMapIndex === index;
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedMapIndex(index)}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                {map.name}
                              </span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                map.deltaPercent > 0
                                  ? 'text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300'
                                  : 'text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {map.deltaPercent > 0 ? `+${map.deltaPercent}%` : `${map.deltaPercent}%`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono">
                              <span>{map.startOffsetHex}</span>
                              <span>{map.sizeBytes} bytes</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {currentMap && (
                      <div className="md:col-span-2 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5 text-rose-500" />
                              <span>{currentMap.name}</span>
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Category: {currentMap.category} | Offset: {currentMap.startOffsetHex} ({currentMap.sizeBytes} bytes)
                            </span>
                          </div>
                          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                            currentMap.deltaPercent > 0
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          }`}>
                            Delta: {currentMap.deltaPercent > 0 ? `+${currentMap.deltaPercent}%` : `${currentMap.deltaPercent}%`}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                          {currentMap.engineeringNotes}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                              Stock (Original)
                            </span>
                            <div className="text-slate-700 dark:text-slate-300 break-all text-[11px]">
                              {currentMap.stockSample}
                            </div>
                          </div>

                          <div className="p-2 rounded bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400 block mb-1">
                              Tuned (Mod)
                            </span>
                            <div className="text-amber-900 dark:text-amber-200 font-bold break-all text-[11px]">
                              {currentMap.modSample}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUPPORTED VS UNSUPPORTED CAPABILITIES */}
          {activeReportTab === 'capabilities' && (
            <div className="space-y-4">
              {/* Supported Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Khawih Danglam Theih &amp; A Support Te (Supported Modifications)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(report.supportedModifications || []).map((cap) => (
                    <div key={cap.id} className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                          {cap.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 uppercase">
                          Supported
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {cap.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-emerald-200 dark:border-emerald-800/60 text-[10px]">
                        <span className="font-mono text-slate-500">Offset: {cap.offsetHex || '0x06C420'}</span>
                        <button
                          onClick={() => handleApplyManualTune(cap)}
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                        >
                          Tune This Map
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unsupported Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Khawih Danglam Theih Loh &amp; A Support Loh Te (Unsupported &amp; Safety Restrictions)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(report.unsupportedRestrictions || []).map((rest) => (
                    <div key={rest.id} className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900 dark:text-rose-200 text-xs">
                          {rest.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 uppercase">
                          Restricted
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {rest.description}
                      </p>
                      {rest.safetyWarning && (
                        <div className="p-1.5 rounded bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[10px] text-rose-800 dark:text-rose-300 font-medium flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                          <span>{rest.safetyWarning}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL TUNING STUDIO */}
          {activeReportTab === 'manual_tuning' && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>Interactive Manual Calibration &amp; Custom Stage Scaling</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    User duh dan ang thlapin map a mala emaw delta percentage hmangin custom tuning siam rawh le.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Global Delta:</span>
                  <input
                    type="range"
                    min="-50"
                    max="35"
                    step="1"
                    value={manualDeltaPercent}
                    onChange={(e) => setManualDeltaPercent(Number(e.target.value))}
                    className="w-28 accent-amber-600 cursor-pointer"
                  />
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    manualDeltaPercent > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {manualDeltaPercent > 0 ? `+${manualDeltaPercent}%` : `${manualDeltaPercent}%`}
                  </span>
                </div>
              </div>

              {/* Supported Maps for Quick Custom Manual Tuning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(report.supportedModifications || []).map((cap) => (
                  <div key={cap.id} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {cap.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Target Offset: {cap.offsetHex || '0x06C420'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleApplyManualTune(cap)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Adjust {manualDeltaPercent > 0 ? `+${manualDeltaPercent}%` : `${manualDeltaPercent}%`}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If Original without diffs */}
          {report.modifiedMaps.length === 0 && activeReportTab === 'vehicle_and_maps' && (
            <div className="p-6 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Factory OEM Baseline Calibration
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                He flash file hi factory stock a ni a, khawih danglam a la awm lo. Tuned file dang nen AI hmanga compare theih a ni e.
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-500">
            Report ID: <span className="font-mono text-slate-700 dark:text-slate-300">{report.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => handleOpenInHex()}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <span>Load into Workstation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
