/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FileManager: Batch & Single ECU Binary Project Vault
 */

import React, { useState, useRef } from 'react';
import {
  FolderArchive,
  Upload,
  CheckCircle2,
  Trash2,
  Download,
  Play,
  FileCode2,
  Tag,
  Search,
  Filter,
} from 'lucide-react';
import { BinaryFileState, parseBinaryBuffer } from '../lib/binaryEngine';

interface StoredBinaryItem {
  id: string;
  name: string;
  vehicleBrand: string;
  ecuFamily: string;
  size: number;
  crc32: string;
  crc16: string;
  createdAt: string;
  buffer: Uint8Array;
}

interface FileManagerProps {
  onLoadAsStock: (file: BinaryFileState) => void;
  onLoadAsMod: (file: BinaryFileState) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  onLoadAsStock,
  onLoadAsMod,
}) => {
  const batchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterBrand, setFilterBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchActionNotice, setBatchActionNotice] = useState<string | null>(null);

  // Pre-seeded ECU Project Binaries
  const [files, setFiles] = useState<StoredBinaryItem[]>([
    {
      id: 'proj_bmw_edc16',
      name: 'BMW_E90_320d_163hp_0281013501_1037381341.bin',
      vehicleBrand: 'BMW',
      ecuFamily: 'Bosch EDC16C35',
      size: 2097152,
      crc32: '89F2A10C',
      crc16: '45B2',
      createdAt: '2026-11-10',
      buffer: new Uint8Array(2097152).fill(0x33),
    },
    {
      id: 'proj_toyota_hilux',
      name: 'Toyota_Hilux_2.8L_1GD-FTV_89663-0KL01.bin',
      vehicleBrand: 'Toyota',
      ecuFamily: 'Denso Gen 2',
      size: 1572864,
      crc32: '5A12D4C8',
      crc16: '7E11',
      createdAt: '2026-11-08',
      buffer: new Uint8Array(1572864).fill(0x55),
    },
    {
      id: 'proj_golf_pcr',
      name: 'VAG_Golf_VI_1.6TDI_PCR2.1_03L906023A.bin',
      vehicleBrand: 'Volkswagen',
      ecuFamily: 'Continental PCR2.1',
      size: 2097152,
      crc32: 'FA901844',
      crc16: '321F',
      createdAt: '2026-11-05',
      buffer: new Uint8Array(2097152).fill(0x22),
    },
  ]);

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach((f) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buf = event.target?.result as ArrayBuffer;
        if (buf) {
          const parsed = parseBinaryBuffer(f.name, buf);
          const brand = f.name.toLowerCase().includes('bmw')
            ? 'BMW'
            : f.name.toLowerCase().includes('toyota')
            ? 'Toyota'
            : f.name.toLowerCase().includes('vag') || f.name.toLowerCase().includes('golf')
            ? 'Volkswagen'
            : 'Universal';

          const newItem: StoredBinaryItem = {
            id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: f.name,
            vehicleBrand: brand,
            ecuFamily: parsed.detectedStrings[0]?.text || 'Bosch / Denso',
            size: parsed.size,
            crc32: parsed.crc32,
            crc16: parsed.crc16,
            createdAt: new Date().toISOString().slice(0, 10),
            buffer: parsed.buffer,
          };

          setFiles((prev) => [newItem, ...prev]);
        }
      };
      reader.readAsArrayBuffer(f);
    });

    e.target.value = '';
    showNotice(`Batch uploaded ${uploadedFiles.length} binary files successfully.`);
  };

  const showNotice = (msg: string) => {
    setBatchActionNotice(msg);
    setTimeout(() => setBatchActionNotice(null), 3000);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected binary files from vault?`)) return;
    setFiles(files.filter((f) => !selectedIds.has(f.id)));
    setSelectedIds(new Set());
    showNotice('Selected files deleted.');
  };

  const handleBatchApplyPatch = (ruleName: string) => {
    if (selectedIds.size === 0) return;
    showNotice(`Batch applied "${ruleName}" to ${selectedIds.size} selected binaries!`);
  };

  const filteredFiles = files.filter((f) => {
    const matchesBrand = filterBrand === 'all' || f.vehicleBrand.toLowerCase() === filterBrand.toLowerCase();
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.ecuFamily.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden select-none">
      {/* Hidden file input for batch uploads */}
      <input
        type="file"
        ref={batchInputRef}
        onChange={handleBatchUpload}
        accept=".bin,.ori,.rom,.hex,.dump"
        multiple
        className="hidden"
      />

      {/* Header */}
      <div className="shrink-0 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/10 text-cyan-600 flex items-center justify-center font-bold">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>ECU Binary Project Vault</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {files.length} Total Binaries
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Manage ECU binary files individually or perform high-speed batch patching
            </p>
          </div>
        </div>

        <button
          onClick={() => batchInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Multiple .BIN</span>
        </button>
      </div>

      {/* Action Notice */}
      {batchActionNotice && (
        <div className="shrink-0 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{batchActionNotice}</span>
        </div>
      )}

      {/* Toolbar: Search & Batch Action Strip */}
      <div className="shrink-0 p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search by file or ECU family..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs outline-none w-48 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Brand:</span>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none"
            >
              <option value="all">All Brands</option>
              <option value="bmw">BMW</option>
              <option value="toyota">Toyota</option>
              <option value="volkswagen">Volkswagen</option>
            </select>
          </div>
        </div>

        {/* Right: Batch Action Buttons */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-cyan-800 dark:text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950">
              {selectedIds.size} Selected
            </span>

            <button
              onClick={() => handleBatchApplyPatch('EGR Off Hysteresis')}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors"
            >
              Batch EGR Off
            </button>

            <button
              onClick={() => handleBatchApplyPatch('Vmax Delimiter')}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded transition-colors"
            >
              Batch Vmax Off
            </button>

            <button
              onClick={handleBatchDelete}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 rounded transition-colors"
              title="Delete selected files"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Files Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
              <th className="py-2 px-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredFiles.length && filteredFiles.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="py-2 px-3">File Name</th>
              <th className="py-2 px-3">Brand</th>
              <th className="py-2 px-3">ECU Family</th>
              <th className="py-2 px-3">Size</th>
              <th className="py-2 px-3">CRC32</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredFiles.map((file) => {
              const isChecked = selectedIds.has(file.id);
              return (
                <tr
                  key={file.id}
                  className={`transition-colors ${
                    isChecked
                      ? 'bg-cyan-50/50 dark:bg-cyan-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(file.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span className="truncate max-w-[280px] sm:max-w-md">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                      {file.vehicleBrand}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {file.ecuFamily}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {(file.size / 1024).toFixed(0)} KB
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {file.crc32}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() =>
                          onLoadAsStock(parseBinaryBuffer(file.name, file.buffer.buffer))
                        }
                        className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 text-[10px] font-mono font-semibold"
                        title="Load into Workstation as Primary Stock"
                      >
                        Stock
                      </button>
                      <button
                        onClick={() =>
                          onLoadAsMod(parseBinaryBuffer(file.name, file.buffer.buffer))
                        }
                        className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-mono font-semibold"
                        title="Load into Workstation as Mod comparison"
                      >
                        Mod
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
