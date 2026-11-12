/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FileLoader: Client-side ArrayBuffer/Uint8Array loader with compact toolbar mode
 * Supports dual drag-and-drop, sample ECU generator, and zero-vertical-waste layout.
 */

import React, { useRef, useState } from 'react';
import {
  Upload,
  FileCode2,
  Cpu,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import {
  BinaryFileState,
  parseBinaryBuffer,
  generateSampleEcuPair,
} from '../lib/binaryEngine';

import { useAuth } from '../lib/authContext';

interface FileLoaderProps {
  stockFile: BinaryFileState | null;
  modFile: BinaryFileState | null;
  onStockLoaded: (file: BinaryFileState) => void;
  onModLoaded: (file: BinaryFileState) => void;
  onClearFiles: () => void;
  endianness: 'little' | 'big';
  onEndiannessChange: (endianness: 'little' | 'big') => void;
}

export const FileLoader: React.FC<FileLoaderProps> = ({
  stockFile,
  modFile,
  onStockLoaded,
  onModLoaded,
  onClearFiles,
  endianness,
  onEndiannessChange,
}) => {
  const { user } = useAuth();
  const stockInputRef = useRef<HTMLInputElement>(null);
  const modInputRef = useRef<HTMLInputElement>(null);
  const [isDropzoneExpanded, setIsDropzoneExpanded] = useState<boolean>(false);
  const [learningNotice, setLearningNotice] = useState<string | null>(null);

  // Auto-catalog into backend database & AI learning engine whenever user uploads
  const autoLearnUpload = async (parsed: BinaryFileState, isMod: boolean) => {
    try {
      const res = await fetch('/api/admin/flash-repo/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-phone': user?.phoneNumber || 'guest_user',
        },
        body: JSON.stringify({
          fileName: parsed.name,
          size: parsed.size,
          crc32: parsed.crc32,
          detectedStrings: parsed.detectedStrings,
          fileTypeHint: isMod ? 'tuned' : 'original',
          sampleBytes: Array.from(parsed.buffer.slice(0, 32)),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLearningNotice(`AI Learned & Saved: ${parsed.name} (${data.matchedWith ? `Matched with ${data.matchedWith}` : 'Database-ah a in-save ta'})`);
        setTimeout(() => setLearningNotice(null), 4000);
      }
    } catch (e) {
      console.warn('Auto AI learning background call failed:', e);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isMod: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const parsed = parseBinaryBuffer(file.name, buffer);
        if (isMod) {
          onModLoaded(parsed);
        } else {
          onStockLoaded(parsed);
        }
        // Auto analyze and catalog in database
        autoLearnUpload(parsed, isMod);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, isMod: boolean) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const parsed = parseBinaryBuffer(file.name, buffer);
        if (isMod) {
          onModLoaded(parsed);
        } else {
          onStockLoaded(parsed);
        }
        // Auto analyze and catalog in database
        autoLearnUpload(parsed, isMod);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const loadSamplePair = () => {
    const sample = generateSampleEcuPair();
    const stockParsed = parseBinaryBuffer(sample.stockName, sample.stock);
    const modParsed = parseBinaryBuffer(sample.modName, sample.mod);
    onStockLoaded(stockParsed);
    onModLoaded(modParsed);
    setIsDropzoneExpanded(false);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const hasLoadedFiles = Boolean(stockFile || modFile);

  // Hidden inputs for file browsing
  const hiddenInputs = (
    <>
      <input
        type="file"
        ref={stockInputRef}
        onChange={(e) => handleFileChange(e, false)}
        accept=".bin,.ori,.rom,.hex,.dump"
        className="hidden"
      />
      <input
        type="file"
        ref={modInputRef}
        onChange={(e) => handleFileChange(e, true)}
        accept=".bin,.mod,.tuned,.hex,.dump"
        className="hidden"
      />
    </>
  );

  // COMPACT TOOLBAR STRIP (When files are already loaded)
  if (hasLoadedFiles && !isDropzoneExpanded) {
    return (
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 text-xs shadow-2xs select-none">
        {hiddenInputs}
        {/* Left: Loaded Binary Badges */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-x-auto py-0.5">
          {learningNotice && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-medium text-[10px] animate-in fade-in">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>{learningNotice}</span>
            </div>
          )}
          {/* Stock Tag */}
          <div
            onClick={() => stockInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 cursor-pointer hover:border-cyan-400 shrink-0 transition-colors"
            title="Click to replace Stock file"
          >
            <span className="font-mono text-[10px] font-bold text-cyan-800 dark:text-cyan-300">
              STOCK:
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[120px] sm:max-w-[180px] truncate text-[11px]">
              {stockFile ? stockFile.name : 'None'}
            </span>
            {stockFile && (
              <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400">
                ({formatSize(stockFile.size)} · CRC:{stockFile.crc32})
              </span>
            )}
          </div>

          {/* Mod Tag */}
          <div
            onClick={() => modInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer shrink-0 transition-colors ${
              modFile
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 hover:border-amber-400 text-amber-900 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800/60 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400'
            }`}
            title="Click to load/replace Mod comparison file"
          >
            <span className="font-mono text-[10px] font-bold">MOD:</span>
            <span className="font-medium max-w-[120px] sm:max-w-[180px] truncate text-[11px]">
              {modFile ? modFile.name : '+ Add Mod .bin'}
            </span>
            {modFile && (
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                ({formatSize(modFile.size)} · CRC:{modFile.crc32})
              </span>
            )}
          </div>
        </div>

        {/* Right: Endianness Toggle & Expand / Clear buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Endianness Switch */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-0.5 text-xs">
            <button
              onClick={() => onEndiannessChange('little')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                endianness === 'little'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Little Endian (LoHi - x86/Denso/Ford)"
            >
              LoHi
            </button>
            <button
              onClick={() => onEndiannessChange('big')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                endianness === 'big'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Big Endian (HiLo - Bosch TriCore/PowerPC)"
            >
              HiLo
            </button>
          </div>

          {/* Expand Details button */}
          <button
            onClick={() => setIsDropzoneExpanded(true)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition-colors"
            title="Expand file dropzones & metadata"
          >
            <SlidersHorizontal className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Files</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Reset button */}
          <button
            onClick={onClearFiles}
            className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
            title="Unload both binary files"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // EXPANDED / EMPTY STATE DUAL DROPZONE PANEL
  return (
    <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs select-none">
      {hiddenInputs}
      <div className="flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-600/10 text-cyan-600 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
              ECU Binary File Loader (Client-Side Memory Engine)
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              Parses real .bin files into Uint8Array. 100% in-browser reverse engineering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSamplePair}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-cyan-50 hover:bg-cyan-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700 rounded transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Load Sample Pair</span>
          </button>

          {hasLoadedFiles && (
            <button
              onClick={() => setIsDropzoneExpanded(false)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </button>
          )}
        </div>
      </div>

      {/* Dual File Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Primary / Stock Binary Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, false)}
          onClick={() => stockInputRef.current?.click()}
          className={`cursor-pointer border border-dashed rounded-lg p-3 transition-all ${
            stockFile
              ? 'border-cyan-400 dark:border-cyan-600/60 bg-cyan-50/40 dark:bg-slate-950/60'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/60 dark:bg-slate-950/30'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`p-1.5 rounded shrink-0 ${
                  stockFile
                    ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileCode2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {stockFile ? 'PRIMARY FILE (STOCK .BIN)' : 'STOCK / ORIGINAL FILE'}
                  </span>
                  {stockFile && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {stockFile ? stockFile.name : 'Click to select or drag stock .bin here'}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              {stockFile ? (
                <div className="text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-300">
                  {formatSize(stockFile.size)}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Upload className="w-3 h-3" />
                  <span>Browse</span>
                </div>
              )}
            </div>
          </div>

          {stockFile && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400">
              <span>CRC32: <strong className="text-slate-800 dark:text-slate-200">{stockFile.crc32}</strong></span>
              <span>CRC16: <strong className="text-slate-800 dark:text-slate-200">{stockFile.crc16}</strong></span>
              {stockFile.detectedStrings[0] && (
                <span className="truncate max-w-[140px] text-cyan-700 dark:text-cyan-300">
                  {stockFile.detectedStrings[0].text}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Comparison / Mod Binary Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, true)}
          onClick={() => modInputRef.current?.click()}
          className={`cursor-pointer border border-dashed rounded-lg p-3 transition-all ${
            modFile
              ? 'border-amber-400 dark:border-amber-600/60 bg-amber-50/40 dark:bg-slate-950/60'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/60 dark:bg-slate-950/30'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`p-1.5 rounded shrink-0 ${
                  modFile
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileCode2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {modFile ? 'COMPARISON FILE (MOD .BIN)' : 'COMPARISON / MOD FILE'}
                  </span>
                  {modFile && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {modFile ? modFile.name : 'Click to select or drag mod .bin here'}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              {modFile ? (
                <div className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-300">
                  {formatSize(modFile.size)}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Upload className="w-3 h-3" />
                  <span>Browse</span>
                </div>
              )}
            </div>
          </div>

          {modFile && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400">
              <span>CRC32: <strong className="text-slate-800 dark:text-slate-200">{modFile.crc32}</strong></span>
              <span>CRC16: <strong className="text-slate-800 dark:text-slate-200">{modFile.crc16}</strong></span>
              {modFile.detectedStrings[0] && (
                <span className="truncate max-w-[140px] text-amber-700 dark:text-amber-300">
                  {modFile.detectedStrings[0].text}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
