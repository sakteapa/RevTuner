/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 2D Map & Calibration Curve Visualizer
 * Interactive SVG visualizer comparing Stock vs. Mod calibration maps with tabular grid.
 */

import React, { useState, useMemo } from 'react';
import { Activity, Table, ChevronDown, ChevronUp } from 'lucide-react';
import { BinaryFileState, extractMapValues, toHexOffset } from '../lib/binaryEngine';

interface MapVisualizer2DProps {
  stockFile: BinaryFileState | null;
  modFile: BinaryFileState | null;
  offset: number;
  onOffsetChange: (offset: number) => void;
}

type BitMode = '8bit' | '16bit_hilo' | '16bit_lohi' | '32bit_hilo' | '32bit_lohi';

export const MapVisualizer2D: React.FC<MapVisualizer2DProps> = ({
  stockFile,
  modFile,
  offset,
}) => {
  const [elementCount, setElementCount] = useState<number>(32);
  const [bitMode, setBitMode] = useState<BitMode>('16bit_hilo');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState<boolean>(true);

  // Extract numerical values
  const stockData = useMemo(() => {
    if (!stockFile) return { values: [], labels: [] };
    return extractMapValues(stockFile.buffer, offset, elementCount, bitMode);
  }, [stockFile, offset, elementCount, bitMode]);

  const modData = useMemo(() => {
    if (!modFile) return { values: [], labels: [] };
    return extractMapValues(modFile.buffer, offset, elementCount, bitMode);
  }, [modFile, offset, elementCount, bitMode]);

  // If mod is loaded but stock isn't, or vice-versa
  const primaryValues = modData.values.length > 0 ? modData.values : stockData.values;
  const secondaryValues = stockData.values.length > 0 ? stockData.values : [];
  const labels = modData.labels.length > 0 ? modData.labels : stockData.labels;

  // Calculate statistics & scale
  const allValues = [...primaryValues, ...secondaryValues];
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 100;
  const range = Math.max(1, maxVal - minVal);

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 20;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  const getCoordinates = (values: number[]) => {
    if (values.length <= 1) return [];
    return values.map((val, idx) => {
      const x = paddingX + (idx / (values.length - 1)) * plotWidth;
      const normalized = (val - minVal) / range;
      const y = paddingY + (1 - normalized) * plotHeight;
      return { x, y, val };
    });
  };

  const stockCoords = getCoordinates(stockData.values);
  const modCoords = getCoordinates(modData.values);

  // Build SVG Path strings
  const buildLinePath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    return coords.reduce(
      (acc, curr, idx) =>
        `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`,
      ''
    );
  };

  const stockPath = buildLinePath(stockCoords);
  const modPath = buildLinePath(modCoords);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col h-full w-full overflow-hidden shadow-xs min-h-0">
      {/* Header & Controls */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            2D Map &amp; Data Curve Visualizer
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bit Mode Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-0.5 text-[11px]">
            <button
              onClick={() => setBitMode('8bit')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                bitMode === '8bit'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              8-Bit
            </button>
            <button
              onClick={() => setBitMode('16bit_hilo')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                bitMode === '16bit_hilo'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="16-bit Big Endian (HiLo - Bosch TriCore)"
            >
              16b HiLo
            </button>
            <button
              onClick={() => setBitMode('16bit_lohi')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                bitMode === '16bit_lohi'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="16-bit Little Endian (LoHi - Denso/Ford)"
            >
              16b LoHi
            </button>
            <button
              onClick={() => setBitMode('32bit_hilo')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                bitMode === '32bit_hilo'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="32-bit Big Endian"
            >
              32-Bit
            </button>
          </div>

          {/* Element Count */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Points:</span>
            <select
              value={elementCount}
              onChange={(e) => setElementCount(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-1.5 py-0.5 text-xs outline-none"
            >
              <option value={16}>16</option>
              <option value={32}>32</option>
              <option value={64}>64</option>
              <option value={128}>128</option>
            </select>
          </div>

          {/* Toggle Table button */}
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <Table className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden xs:inline">Table</span>
            {showTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* SVG Comparison Curve (Flex grow) */}
      <div className="flex-1 min-h-0 p-2 sm:p-3 bg-slate-50/60 dark:bg-[#0b0f17] relative flex flex-col justify-between overflow-hidden">
        {allValues.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs font-mono">
            Load binary files to render 2D calibration curve
          </div>
        ) : (
          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full max-h-[260px]"
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={svgWidth - paddingX}
                y2={paddingY}
                stroke="#cbd5e1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <line
                x1={paddingX}
                y1={paddingY + plotHeight * 0.5}
                x2={svgWidth - paddingX}
                y2={paddingY + plotHeight * 0.5}
                stroke="#cbd5e1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <line
                x1={paddingX}
                y1={paddingY + plotHeight}
                x2={svgWidth - paddingX}
                y2={paddingY + plotHeight}
                stroke="#94a3b8"
              />

              {/* Min/Max Y-Axis Labels */}
              <text
                x={paddingX - 6}
                y={paddingY + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {maxVal}
              </text>
              <text
                x={paddingX - 6}
                y={paddingY + plotHeight * 0.5 + 3}
                textAnchor="end"
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {Math.round(minVal + range * 0.5)}
              </text>
              <text
                x={paddingX - 6}
                y={paddingY + plotHeight + 3}
                textAnchor="end"
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {minVal}
              </text>

              {/* Stock Curve (Cyan) */}
              {stockCoords.length > 0 && (
                <path
                  d={stockPath}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeOpacity={modCoords.length > 0 ? '0.7' : '1'}
                />
              )}

              {/* Mod Curve (Amber) */}
              {modCoords.length > 0 && (
                <path
                  d={modPath}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2.5"
                />
              )}

              {/* Data points */}
              {modCoords.map((pt, i) => (
                <circle
                  key={`mod_${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#d97706"
                  className="cursor-pointer hover:r-5 transition-all"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              ))}

              {stockCoords.map((pt, i) => (
                <circle
                  key={`stock_${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={modCoords.length > 0 ? '2' : '3.5'}
                  fill="#0284c7"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              ))}

              {/* Crosshair indicator on hover */}
              {hoverIndex !== null && hoverIndex < labels.length && (
                <g>
                  <line
                    x1={paddingX + (hoverIndex / (labels.length - 1)) * plotWidth}
                    y1={paddingY}
                    x2={paddingX + (hoverIndex / (labels.length - 1)) * plotWidth}
                    y2={paddingY + plotHeight}
                    stroke="#64748b"
                    strokeDasharray="2 2"
                  />
                </g>
              )}
            </svg>

            {/* Hover details badge */}
            {hoverIndex !== null && hoverIndex < labels.length && (
              <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] font-mono shadow-md flex items-center gap-2">
                <span className="text-slate-500">Idx: {hoverIndex}</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  {labels[hoverIndex]}
                </span>
                {stockData.values[hoverIndex] !== undefined && (
                  <span className="text-cyan-700 dark:text-cyan-400 font-medium">
                    Stock: {stockData.values[hoverIndex]}
                  </span>
                )}
                {modData.values[hoverIndex] !== undefined && (
                  <span className="text-amber-700 dark:text-amber-400 font-bold">
                    Mod: {modData.values[hoverIndex]}
                  </span>
                )}
                {stockData.values[hoverIndex] !== undefined &&
                  modData.values[hoverIndex] !== undefined && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      Δ: {modData.values[hoverIndex] - stockData.values[hoverIndex]}
                    </span>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="shrink-0 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2 pt-1.5 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            {stockData.values.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#0284c7]" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Stock Calibration
                </span>
              </div>
            )}
            {modData.values.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#d97706]" />
                <span className="text-amber-700 dark:text-amber-300 font-semibold">
                  Modified Calibration
                </span>
              </div>
            )}
          </div>
          <div>
            Offset: <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{toHexOffset(offset)}</span>
          </div>
        </div>
      </div>

      {/* Numerical Data Grid Table (Collapsible) */}
      {showTable && (
        <div className="shrink-0 max-h-36 overflow-y-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-2">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-0.5 px-2">Index</th>
                <th className="py-0.5 px-2">Offset</th>
                {stockData.values.length > 0 && (
                  <th className="py-0.5 px-2 text-cyan-700 dark:text-cyan-400">Stock</th>
                )}
                {modData.values.length > 0 && (
                  <th className="py-0.5 px-2 text-amber-700 dark:text-amber-400">Mod</th>
                )}
                {stockData.values.length > 0 && modData.values.length > 0 && (
                  <th className="py-0.5 px-2 text-emerald-700 dark:text-emerald-400">
                    Delta (Δ)
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {labels.map((lbl, idx) => {
                const sVal = stockData.values[idx];
                const mVal = modData.values[idx];
                const delta =
                  sVal !== undefined && mVal !== undefined ? mVal - sVal : 0;
                const isHovered = hoverIndex === idx;

                return (
                  <tr
                    key={idx}
                    onMouseEnter={() => setHoverIndex(idx)}
                    className={`transition-colors ${
                      isHovered
                        ? 'bg-cyan-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="py-0.5 px-2 text-slate-400">{idx}</td>
                    <td className="py-0.5 px-2 text-slate-600 dark:text-slate-400">{lbl}</td>
                    {sVal !== undefined && (
                      <td className="py-0.5 px-2 text-cyan-700 dark:text-cyan-300 font-medium">
                        {sVal}
                      </td>
                    )}
                    {mVal !== undefined && (
                      <td className="py-0.5 px-2 text-amber-700 dark:text-amber-300 font-semibold">
                        {mVal}
                      </td>
                    )}
                    {sVal !== undefined && mVal !== undefined && (
                      <td
                        className={`py-0.5 px-2 font-bold ${
                          delta !== 0
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
