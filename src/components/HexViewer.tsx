/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Auto-Responsive Virtualized HexViewer Component (WinOLS Style)
 * Automatically adapts to available screen height and width without hardcoded overflow.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  CornerDownLeft,
  Eye,
  Split,
  Hash,
  Type,
} from 'lucide-react';
import {
  BinaryFileState,
  DiffBlock,
  toHex,
  toHexOffset,
} from '../lib/binaryEngine';

interface HexViewerProps {
  stockFile: BinaryFileState | null;
  modFile: BinaryFileState | null;
  diffBlocks: DiffBlock[];
  selectedOffset: number;
  onSelectOffset: (offset: number) => void;
  activeDiffIndex: number;
  onNavigateDiff: (direction: 'next' | 'prev') => void;
  defaultBytesPerRow?: 8 | 16;
}

const ROW_HEIGHT = 28; // pixels per row
const BUFFER_ROWS = 8;

export const HexViewer: React.FC<HexViewerProps> = ({
  stockFile,
  modFile,
  diffBlocks,
  selectedOffset,
  onSelectOffset,
  activeDiffIndex,
  onNavigateDiff,
  defaultBytesPerRow = 16,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);
  const [jumpInput, setJumpInput] = useState('');
  const [viewMode, setViewMode] = useState<'diff' | 'split' | 'stock' | 'mod'>('diff');
  const [bytesPerRow, setBytesPerRow] = useState<8 | 16>(defaultBytesPerRow);
  const [showAscii, setShowAscii] = useState<boolean>(true);
  const [hoveredByteInfo, setHoveredByteInfo] = useState<{
    offset: number;
    stock?: number;
    mod?: number;
  } | null>(null);

  // Sync bytesPerRow with detected device recommendation
  useEffect(() => {
    setBytesPerRow(defaultBytesPerRow);
  }, [defaultBytesPerRow]);

  // Active primary buffer to view
  const primaryFile = modFile || stockFile;
  const totalBytes = primaryFile ? primaryFile.size : 0;
  const totalRows = Math.ceil(totalBytes / bytesPerRow);

  // Measure container height dynamically so virtualization matches exact viewport height
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Quick lookup map for differing byte offsets
  const diffOffsetSet = useMemo(() => {
    const set = new Set<number>();
    if (!stockFile || !modFile) return set;
    for (const block of diffBlocks) {
      for (let i = 0; i < block.length; i++) {
        set.add(block.startOffset + i);
      }
    }
    return set;
  }, [diffBlocks, stockFile, modFile]);

  // Virtualization calculations
  const visibleRowCount = Math.ceil(containerHeight / ROW_HEIGHT);
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const endRow = Math.min(totalRows, startRow + visibleRowCount + BUFFER_ROWS * 2);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Scroll to a specific byte offset
  const scrollToOffset = useCallback(
    (offset: number) => {
      if (!containerRef.current || totalBytes === 0) return;
      const clampedOffset = Math.max(0, Math.min(offset, totalBytes - 1));
      const targetRow = Math.floor(clampedOffset / bytesPerRow);
      const targetScroll = Math.max(
        0,
        targetRow * ROW_HEIGHT - Math.floor(containerHeight / 3)
      );
      containerRef.current.scrollTop = targetScroll;
    },
    [totalBytes, bytesPerRow, containerHeight]
  );

  // Jump to offset handler
  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumpInput.trim()) return;
    let target = 0;
    const clean = jumpInput.trim().toLowerCase();
    if (clean.startsWith('0x')) {
      target = parseInt(clean.substring(2), 16);
    } else if (
      /^[0-9a-f]+$/i.test(clean) &&
      (clean.length > 5 || /[a-f]/i.test(clean))
    ) {
      target = parseInt(clean, 16);
    } else {
      target = parseInt(clean, 10);
    }

    if (!isNaN(target)) {
      onSelectOffset(target);
      scrollToOffset(target);
    }
  };

  // Sync scroll when diff navigation occurs
  useEffect(() => {
    if (activeDiffIndex >= 0 && activeDiffIndex < diffBlocks.length) {
      const block = diffBlocks[activeDiffIndex];
      scrollToOffset(block.startOffset);
    }
  }, [activeDiffIndex, diffBlocks, scrollToOffset]);

  // Format printable ASCII
  const getAsciiChar = (byte: number): string => {
    return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '·';
  };

  if (!primaryFile) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-10 flex flex-col items-center justify-center text-center h-full w-full shadow-xs">
        <Hash className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No Binary Loaded
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Upload a Stock .bin or Mod .bin above to begin hex inspection, byte-level diffing, and reverse engineering.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col h-full w-full overflow-hidden shadow-xs min-h-0">
      {/* Hex Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs">
        {/* Left: View Mode Controls */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setViewMode('diff')}
            disabled={!modFile || !stockFile}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'diff'
                ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-40'
            }`}
            title="Highlighted byte differences on the modified binary"
          >
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Diff</span>
            </span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            disabled={!modFile || !stockFile}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'split'
                ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-40'
            }`}
            title="Dual rows: Stock and Mod compared side-by-side"
          >
            <span className="flex items-center gap-1">
              <Split className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Split</span>
            </span>
          </button>

          <button
            onClick={() => setViewMode('stock')}
            disabled={!stockFile}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors hidden sm:inline-block ${
              viewMode === 'stock'
                ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-40'
            }`}
          >
            Stock
          </button>

          <button
            onClick={() => setViewMode('mod')}
            disabled={!modFile}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors hidden sm:inline-block ${
              viewMode === 'mod'
                ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-500/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-40'
            }`}
          >
            Mod
          </button>

          {/* Grid Width Toggle (8B mobile / 16B desktop) */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-0.5 ml-1">
            <button
              onClick={() => setBytesPerRow(8)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                bytesPerRow === 8
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="8 Bytes per Row (Mobile Friendly)"
            >
              8B
            </button>
            <button
              onClick={() => setBytesPerRow(16)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                bytesPerRow === 16
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="16 Bytes per Row (WinOLS Standard)"
            >
              16B
            </button>
          </div>

          {/* ASCII Toggle button */}
          <button
            onClick={() => setShowAscii(!showAscii)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
              showAscii
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
            title="Toggle ASCII Column"
          >
            <Type className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden xs:inline">ASCII</span>
          </button>
        </div>

        {/* Center: Diff Jumper */}
        {diffBlocks.length > 0 && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 shadow-2xs">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              Diff{' '}
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {activeDiffIndex + 1}
              </span>
              /
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {diffBlocks.length}
              </span>
            </span>
            <div className="flex items-center gap-0.5 ml-0.5">
              <button
                onClick={() => onNavigateDiff('prev')}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 rounded transition-colors"
                title="Previous Difference Block"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateDiff('next')}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 rounded transition-colors"
                title="Next Difference Block"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Right: Jump to Offset Input */}
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
          <input
            type="text"
            placeholder="0x074210"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded px-2 py-0.5 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none shadow-2xs w-20 sm:w-24"
          />
          <button
            type="submit"
            className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-400 rounded transition-colors border border-slate-300 dark:border-slate-700 shadow-2xs"
            title="Go to offset"
          >
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Hex Column Headers */}
      <div className="shrink-0 overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/90 text-[11px] font-mono text-slate-600 dark:text-slate-400 select-none">
        <div className="inline-flex min-w-full px-2 sm:px-3 py-1 items-center">
          {/* Frozen Sticky Offset Header */}
          <div className="w-20 sm:w-24 shrink-0 font-semibold text-slate-600 dark:text-slate-500 sticky left-0 bg-slate-100 dark:bg-slate-950/95 z-20 border-r border-slate-200 dark:border-slate-800/80 pr-2">
            OFFSET
          </div>
          {/* Hex Columns */}
          <div className="flex gap-1 sm:gap-2 justify-start px-2">
            {Array.from({ length: bytesPerRow }).map((_, i) => (
              <div
                key={i}
                className={`w-5 sm:w-6 text-center ${
                  i === 8
                    ? 'ml-1 sm:ml-2 text-slate-800 dark:text-slate-300 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {toHex(i, 2)}
              </div>
            ))}
          </div>
          {/* ASCII Header */}
          {showAscii && (
            <div className="pl-3 sm:pl-4 text-slate-600 dark:text-slate-500 font-semibold shrink-0">
              ASCII
            </div>
          )}
        </div>
      </div>

      {/* Virtualized Hex Grid Viewport (occupies all remaining vertical space) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-auto relative bg-white dark:bg-[#0b0f17] font-mono text-xs select-text"
      >
        {/* Full scroll height spacer */}
        <div
          style={{
            height: `${totalRows * ROW_HEIGHT * (viewMode === 'split' ? 2 : 1)}px`,
            position: 'relative',
          }}
        >
          {/* Visible Rows */}
          {Array.from({ length: endRow - startRow }).map((_, idx) => {
            const rowIndex = startRow + idx;
            const rowOffset = rowIndex * bytesPerRow;
            if (rowOffset >= totalBytes) return null;

            const effectiveHeight =
              viewMode === 'split' ? ROW_HEIGHT * 2 : ROW_HEIGHT;
            const topPos = rowIndex * effectiveHeight;

            // Render Split View (Stock row above, Mod row below)
            if (viewMode === 'split' && stockFile && modFile) {
              return (
                <div
                  key={rowIndex}
                  style={{ top: `${topPos}px`, height: `${effectiveHeight}px` }}
                  className="absolute left-0 right-0 inline-flex min-w-full px-2 sm:px-3 py-0.5 flex-col border-b border-slate-100 dark:border-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  {/* Stock Sub-Row */}
                  <div className="flex items-center text-slate-600 dark:text-slate-400">
                    <div className="w-20 sm:w-24 shrink-0 text-slate-500 text-[10px] sm:text-[11px] sticky left-0 bg-white/95 dark:bg-[#0b0f17]/95 z-10 flex items-center justify-between pr-2 border-r border-slate-200 dark:border-slate-800/80">
                      <span>{toHexOffset(rowOffset)}</span>
                      <span className="text-[9px] text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/40 px-1 rounded font-semibold">
                        S
                      </span>
                    </div>
                    <div className="flex gap-1 sm:gap-2 px-2">
                      {Array.from({ length: bytesPerRow }).map((_, byteIdx) => {
                        const offset = rowOffset + byteIdx;
                        if (offset >= totalBytes)
                          return <div key={byteIdx} className="w-5 sm:w-6" />;
                        const sByte = stockFile.buffer[offset];
                        const mByte = modFile.buffer[offset];
                        const isDiff = sByte !== mByte;
                        const isSelected = selectedOffset === offset;

                        return (
                          <span
                            key={byteIdx}
                            onClick={() => onSelectOffset(offset)}
                            className={`w-5 sm:w-6 text-center cursor-pointer rounded-xs py-0.5 ${
                              byteIdx === 8 ? 'ml-1 sm:ml-2' : ''
                            } ${
                              isSelected
                                ? 'bg-cyan-600 text-white font-bold'
                                : isDiff
                                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {toHex(sByte)}
                          </span>
                        );
                      })}
                    </div>
                    {showAscii && (
                      <div className="pl-3 sm:pl-4 text-slate-500 truncate text-[10px] sm:text-[11px]">
                        {Array.from({ length: bytesPerRow })
                          .map((_, byteIdx) => {
                            const offset = rowOffset + byteIdx;
                            return offset < totalBytes
                              ? getAsciiChar(stockFile.buffer[offset])
                              : '';
                          })
                          .join('')}
                      </div>
                    )}
                  </div>

                  {/* Mod Sub-Row */}
                  <div className="flex items-center text-slate-800 dark:text-slate-300 mt-0.5">
                    <div className="w-20 sm:w-24 shrink-0 text-slate-500 text-[10px] sm:text-[11px] sticky left-0 bg-white/95 dark:bg-[#0b0f17]/95 z-10 flex items-center justify-between pr-2 border-r border-slate-200 dark:border-slate-800/80">
                      <span className="opacity-0">{toHexOffset(rowOffset)}</span>
                      <span className="text-[9px] text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-1 rounded font-semibold">
                        M
                      </span>
                    </div>
                    <div className="flex gap-1 sm:gap-2 px-2">
                      {Array.from({ length: bytesPerRow }).map((_, byteIdx) => {
                        const offset = rowOffset + byteIdx;
                        if (offset >= totalBytes)
                          return <div key={byteIdx} className="w-5 sm:w-6" />;
                        const sByte = stockFile.buffer[offset];
                        const mByte = modFile.buffer[offset];
                        const isDiff = sByte !== mByte;
                        const isSelected = selectedOffset === offset;

                        return (
                          <span
                            key={byteIdx}
                            onClick={() => onSelectOffset(offset)}
                            className={`w-5 sm:w-6 text-center cursor-pointer rounded-xs py-0.5 ${
                              byteIdx === 8 ? 'ml-1 sm:ml-2' : ''
                            } ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : isDiff
                                ? 'bg-amber-100 dark:bg-amber-500/25 text-amber-900 dark:text-amber-300 font-bold ring-1 ring-amber-400 dark:ring-amber-500/40'
                                : 'text-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {toHex(mByte)}
                          </span>
                        );
                      })}
                    </div>
                    {showAscii && (
                      <div className="pl-3 sm:pl-4 text-slate-600 dark:text-slate-400 truncate text-[10px] sm:text-[11px]">
                        {Array.from({ length: bytesPerRow })
                          .map((_, byteIdx) => {
                            const offset = rowOffset + byteIdx;
                            return offset < totalBytes
                              ? getAsciiChar(modFile.buffer[offset])
                              : '';
                          })
                          .join('')}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Standard Single-Row Mode (Diff / Stock / Mod)
            const activeBuf =
              viewMode === 'stock' && stockFile
                ? stockFile.buffer
                : primaryFile.buffer;

            return (
              <div
                key={rowIndex}
                style={{ top: `${topPos}px`, height: `${effectiveHeight}px` }}
                className="absolute left-0 right-0 inline-flex min-w-full px-2 sm:px-3 items-center hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
              >
                {/* Frozen Sticky Offset Column */}
                <div className="w-20 sm:w-24 shrink-0 text-slate-500 text-[10px] sm:text-[11px] sticky left-0 bg-white/95 dark:bg-[#0b0f17]/95 z-10 font-semibold border-r border-slate-200 dark:border-slate-800/80 pr-2">
                  {toHexOffset(rowOffset)}
                </div>

                {/* Hex Bytes Grid */}
                <div className="flex gap-1 sm:gap-2 px-2">
                  {Array.from({ length: bytesPerRow }).map((_, byteIdx) => {
                    const offset = rowOffset + byteIdx;
                    if (offset >= totalBytes)
                      return <div key={byteIdx} className="w-5 sm:w-6" />;

                    const byteVal = activeBuf[offset];
                    const isDiff =
                      diffOffsetSet.has(offset) && viewMode === 'diff';
                    const isSelected = selectedOffset === offset;

                    return (
                      <span
                        key={byteIdx}
                        onClick={() => onSelectOffset(offset)}
                        onMouseEnter={() => {
                          setHoveredByteInfo({
                            offset,
                            stock: stockFile
                              ? stockFile.buffer[offset]
                              : undefined,
                            mod: modFile ? modFile.buffer[offset] : undefined,
                          });
                        }}
                        onMouseLeave={() => setHoveredByteInfo(null)}
                        className={`w-5 sm:w-6 text-center cursor-pointer rounded-xs transition-colors py-0.5 ${
                          byteIdx === 8 ? 'ml-1 sm:ml-2' : ''
                        } ${
                          isSelected
                            ? 'bg-cyan-600 text-white font-bold shadow-xs'
                            : isDiff
                            ? 'bg-amber-100 dark:bg-amber-500/25 text-amber-900 dark:text-amber-300 font-bold border-b border-amber-500 dark:border-amber-400'
                            : byteVal === 0x00
                            ? 'text-slate-300 dark:text-slate-600'
                            : byteVal === 0xff
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {toHex(byteVal)}
                      </span>
                    );
                  })}
                </div>

                {/* ASCII Representation */}
                {showAscii && (
                  <div className="pl-3 sm:pl-4 text-slate-600 dark:text-slate-400 tracking-wider truncate text-[10px] sm:text-[11px]">
                    {Array.from({ length: bytesPerRow })
                      .map((_, byteIdx) => {
                        const offset = rowOffset + byteIdx;
                        return offset < totalBytes
                          ? getAsciiChar(activeBuf[offset])
                          : '';
                      })
                      .join('')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hex Status Bar / Hover Telemetry */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[10px] sm:text-[11px] font-mono text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div>
            <span className="text-slate-500">Offset:</span>{' '}
            <span className="text-cyan-700 dark:text-cyan-300 font-semibold">
              {toHexOffset(selectedOffset)}
            </span>
          </div>

          {hoveredByteInfo && (
            <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-800 pl-2">
              {hoveredByteInfo.stock !== undefined && (
                <span className="text-cyan-700 dark:text-cyan-400">
                  S: 0x{toHex(hoveredByteInfo.stock)}
                </span>
              )}
              {hoveredByteInfo.mod !== undefined && (
                <span className="text-amber-700 dark:text-amber-400">
                  M: 0x{toHex(hoveredByteInfo.mod)}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <div>
            Grid: <span className="text-slate-700 dark:text-slate-300 font-semibold">{bytesPerRow}B</span>
          </div>
          <div>
            Size: <span className="text-slate-700 dark:text-slate-300 font-semibold">{(totalBytes / 1024).toFixed(0)} KB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
