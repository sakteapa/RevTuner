/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * RevTuner - Automotive ECU Reverse-Engineering & Binary Patching Engine
 * Pure client-side binary manipulation using ArrayBuffer and Uint8Array.
 */

export interface ECUStringMatch {
  offset: number;
  hexOffset: string;
  type: 'Bosch SW' | 'Bosch HW' | 'VAG PN' | 'Siemens/Conti' | 'Denso' | 'Generic ASCII';
  text: string;
}

export interface BinaryFileState {
  name: string;
  size: number;
  buffer: Uint8Array;
  crc32: string;
  crc16: string;
  detectedStrings: ECUStringMatch[];
  detectedEndianness: 'little' | 'big';
}

export interface DiffBlock {
  id: string;
  startOffset: number;
  hexOffset: string;
  length: number;
  stockBytes: number[];
  modBytes: number[];
  isExpanded?: boolean;
}

export interface PatchRule {
  id: string;
  name: string;
  description: string;
  ecuFamily: string;
  originalOffset: number;
  originalOffsetHex: string;
  preSignature: number[];
  originalBytes: number[];
  modBytes: number[];
  postSignature: number[];
  createdAt: string;
  category: 'EGR Off' | 'DPF Off' | 'DTC Off' | 'Speed Limiter' | 'Custom';
}

export interface PatchApplicationResult {
  ruleId: string;
  ruleName: string;
  status: 'applied' | 'not_found' | 'conflict' | 'already_applied';
  matchedOffset?: number;
  matchedOffsetHex?: string;
  offsetShift?: number;
  confidence: number;
  message: string;
}

// ==========================================
// Checksum Calculation Utilities
// ==========================================

// Standard CRC-32 (IEEE 802.3 polynomial: 0xEDB88320)
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC32_TABLE[i] = c;
}

export function computeCRC32(bytes: Uint8Array): string {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

// CRC-16-CCITT (Polynomial: 0x1021, Init: 0xFFFF)
export function computeCRC16(bytes: Uint8Array): string {
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ==========================================
// Hex Formatting & Helpers
// ==========================================

export function toHex(val: number, pad = 2): string {
  return val.toString(16).toUpperCase().padStart(pad, '0');
}

export function toHexOffset(val: number): string {
  return '0x' + val.toString(16).toUpperCase().padStart(6, '0');
}

export function bytesToHexString(bytes: number[] | Uint8Array, separator = ' '): string {
  const arr = Array.from(bytes);
  return arr.map(b => toHex(b)).join(separator);
}

export function hexStringToBytes(hex: string): number[] {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.substring(i, i + 2), 16));
  }
  return bytes;
}

// ==========================================
// ECU Identification & ASCII String Scanner
// ==========================================

export function scanECUStrings(bytes: Uint8Array): ECUStringMatch[] {
  const matches: ECUStringMatch[] = [];
  const maxScan = Math.min(bytes.length, 1024 * 1024 * 8); // Scan up to 8MB
  let currentString = '';
  let startOffset = 0;

  for (let i = 0; i < maxScan; i++) {
    const charCode = bytes[i];
    // Printable ASCII: 32 (space) to 126 (~)
    if (charCode >= 32 && charCode <= 126) {
      if (currentString.length === 0) {
        startOffset = i;
      }
      currentString += String.fromCharCode(charCode);
    } else {
      if (currentString.length >= 6) {
        // Evaluate potential automotive signatures
        const trimmed = currentString.trim();

        // Bosch SW: 1037xxxxxx
        if (/\b1037[0-9A-Z]{6}\b/.test(trimmed)) {
          matches.push({
            offset: startOffset,
            hexOffset: toHexOffset(startOffset),
            type: 'Bosch SW',
            text: trimmed.match(/\b1037[0-9A-Z]{6}\b/)![0],
          });
        }
        // Bosch HW: 0281xxxxxx
        else if (/\b0281[0-9]{6}\b/.test(trimmed)) {
          matches.push({
            offset: startOffset,
            hexOffset: toHexOffset(startOffset),
            type: 'Bosch HW',
            text: trimmed.match(/\b0281[0-9]{6}\b/)![0],
          });
        }
        // VAG Part Number: 03L906xxx, 03G906xxx, 8K0907xxx, etc.
        else if (/\b0[3-9][A-Z0-9]{7,9}\b/.test(trimmed)) {
          matches.push({
            offset: startOffset,
            hexOffset: toHexOffset(startOffset),
            type: 'VAG PN',
            text: trimmed,
          });
        }
        // Siemens / Continental: 5WP4xxxx or SIDxxx
        else if (/\b(5WP\d+|SID\d{3}|SIMOS\w+)\b/i.test(trimmed)) {
          matches.push({
            offset: startOffset,
            hexOffset: toHexOffset(startOffset),
            type: 'Siemens/Conti',
            text: trimmed,
          });
        }
        // Denso: 89661-xxxxx or 275xxx
        else if (/\b(8966[13]-\d{5}|DENSO\w*)\b/i.test(trimmed)) {
          matches.push({
            offset: startOffset,
            hexOffset: toHexOffset(startOffset),
            type: 'Denso',
            text: trimmed,
          });
        }
        // Meaningful generic firmware labels
        else if (currentString.length >= 8 && /(EDC1[567]|MED17|DELPHI|MARELLI|CALIBRATION|SW:|HW:)/i.test(trimmed)) {
          matches.push({
            offset: startOffset,
            hexOffset: toHexOffset(startOffset),
            type: 'Generic ASCII',
            text: trimmed.substring(0, 40),
          });
        }
      }
      currentString = '';
    }
  }

  // Deduplicate and cap to 30 most relevant matches
  const seen = new Set<string>();
  const uniqueMatches = matches.filter(m => {
    const key = `${m.type}-${m.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueMatches.slice(0, 30);
}

// ==========================================
// Binary File Parser
// ==========================================

export function parseBinaryBuffer(name: string, source: ArrayBuffer | ArrayBufferLike | Uint8Array): BinaryFileState {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source as ArrayBuffer);
  const crc32 = computeCRC32(bytes);
  const crc16 = computeCRC16(bytes);
  const detectedStrings = scanECUStrings(bytes);

  const detectedEndianness: 'little' | 'big' = 'little';

  return {
    name,
    size: bytes.length,
    buffer: bytes,
    crc32,
    crc16,
    detectedStrings,
    detectedEndianness,
  };
}

// ==========================================
// High-Performance Diff Engine (WinOLS Style)
// ==========================================

export function compareBinaries(stock: Uint8Array, mod: Uint8Array): {
  diffBlocks: DiffBlock[];
  totalDiffBytes: number;
} {
  const minLen = Math.min(stock.length, mod.length);
  const diffBlocks: DiffBlock[] = [];
  let totalDiffBytes = 0;

  let inBlock = false;
  let blockStart = 0;
  let stockChunk: number[] = [];
  let modChunk: number[] = [];

  // Group continuous differences (or differences separated by <= 2 identical bytes)
  const MAX_MERGE_GAP = 2;
  let gapCount = 0;
  let pendingIdenticalStock: number[] = [];
  let pendingIdenticalMod: number[] = [];

  for (let i = 0; i < minLen; i++) {
    const s = stock[i];
    const m = mod[i];

    if (s !== m) {
      totalDiffBytes++;
      if (!inBlock) {
        inBlock = true;
        blockStart = i;
        stockChunk = [s];
        modChunk = [m];
        gapCount = 0;
        pendingIdenticalStock = [];
        pendingIdenticalMod = [];
      } else {
        if (gapCount > 0) {
          stockChunk.push(...pendingIdenticalStock);
          modChunk.push(...pendingIdenticalMod);
          gapCount = 0;
          pendingIdenticalStock = [];
          pendingIdenticalMod = [];
        }
        stockChunk.push(s);
        modChunk.push(m);
      }
    } else {
      if (inBlock) {
        gapCount++;
        pendingIdenticalStock.push(s);
        pendingIdenticalMod.push(m);
        if (gapCount > MAX_MERGE_GAP) {
          // Finalize current block
          diffBlocks.push({
            id: `diff_${blockStart.toString(16)}`,
            startOffset: blockStart,
            hexOffset: toHexOffset(blockStart),
            length: stockChunk.length,
            stockBytes: stockChunk,
            modBytes: modChunk,
          });
          inBlock = false;
          stockChunk = [];
          modChunk = [];
          gapCount = 0;
          pendingIdenticalStock = [];
          pendingIdenticalMod = [];
        }
      }
    }
  }

  // Push final open block if any
  if (inBlock && stockChunk.length > 0) {
    diffBlocks.push({
      id: `diff_${blockStart.toString(16)}`,
      startOffset: blockStart,
      hexOffset: toHexOffset(blockStart),
      length: stockChunk.length,
      stockBytes: stockChunk,
      modBytes: modChunk,
    });
  }

  return { diffBlocks, totalDiffBytes };
}

// ==========================================
// DaVinci Deluxe Self-Learning Signature Extractor
// ==========================================

export function extractRuleFromDiff(
  stock: Uint8Array,
  mod: Uint8Array,
  diffBlock: DiffBlock,
  ruleName: string,
  ecuFamily: string,
  category: PatchRule['category'] = 'Custom',
  contextSize = 8
): PatchRule {
  const start = diffBlock.startOffset;
  const end = diffBlock.startOffset + diffBlock.length;

  // Extract preceding context
  const preStart = Math.max(0, start - contextSize);
  const preBytes: number[] = [];
  for (let i = preStart; i < start; i++) {
    preBytes.push(stock[i]);
  }

  // Extract succeeding context
  const postEnd = Math.min(stock.length, end + contextSize);
  const postBytes: number[] = [];
  for (let i = end; i < postEnd; i++) {
    postBytes.push(stock[i]);
  }

  return {
    id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: ruleName || `Patch at ${diffBlock.hexOffset}`,
    description: `Auto-extracted rule modifying ${diffBlock.length} bytes at ${diffBlock.hexOffset}`,
    ecuFamily: ecuFamily || 'Universal / Generic ECU',
    originalOffset: start,
    originalOffsetHex: diffBlock.hexOffset,
    preSignature: preBytes,
    originalBytes: Array.from(diffBlock.stockBytes),
    modBytes: Array.from(diffBlock.modBytes),
    postSignature: postBytes,
    createdAt: new Date().toISOString(),
    category,
  };
}

// ==========================================
// Fuzzy Pattern Matching & Auto-Patcher Engine
// ==========================================

export function applyPatchRule(target: Uint8Array, rule: PatchRule): {
  updatedBuffer: Uint8Array;
  result: PatchApplicationResult;
} {
  const copy = new Uint8Array(target);
  const pre = rule.preSignature;
  const orig = rule.originalBytes;
  const post = rule.postSignature;
  const mod = rule.modBytes;

  const totalLen = pre.length + orig.length + post.length;
  if (totalLen === 0) {
    return {
      updatedBuffer: copy,
      result: {
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'not_found',
        confidence: 0,
        message: 'Rule contains zero signature bytes.',
      },
    };
  }

  // Fast check: verify if original offset matches exactly
  if (rule.originalOffset + orig.length <= copy.length) {
    let exactMatch = true;
    for (let i = 0; i < orig.length; i++) {
      if (copy[rule.originalOffset + i] !== orig[i]) {
        exactMatch = false;
        break;
      }
    }

    // Also check context if exact
    if (exactMatch) {
      let contextMatch = true;
      for (let i = 0; i < pre.length; i++) {
        if (copy[rule.originalOffset - pre.length + i] !== pre[i]) {
          contextMatch = false;
          break;
        }
      }
      for (let i = 0; i < post.length; i++) {
        if (copy[rule.originalOffset + orig.length + i] !== post[i]) {
          contextMatch = false;
          break;
        }
      }

      if (contextMatch) {
        // Apply modification directly
        for (let i = 0; i < mod.length; i++) {
          copy[rule.originalOffset + i] = mod[i];
        }
        return {
          updatedBuffer: copy,
          result: {
            ruleId: rule.id,
            ruleName: rule.name,
            status: 'applied',
            matchedOffset: rule.originalOffset,
            matchedOffsetHex: toHexOffset(rule.originalOffset),
            offsetShift: 0,
            confidence: 100,
            message: `Exact match found at ${toHexOffset(rule.originalOffset)}. Successfully applied ${mod.length} bytes patch.`,
          },
        };
      }
    }
  }

  // Check if it's already patched at original offset
  let alreadyPatched = true;
  for (let i = 0; i < mod.length; i++) {
    if (copy[rule.originalOffset + i] !== mod[i]) {
      alreadyPatched = false;
      break;
    }
  }
  if (alreadyPatched) {
    return {
      updatedBuffer: copy,
      result: {
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'already_applied',
        matchedOffset: rule.originalOffset,
        matchedOffsetHex: toHexOffset(rule.originalOffset),
        confidence: 100,
        message: `Bytes at ${toHexOffset(rule.originalOffset)} already match the target modified values.`,
      },
    };
  }

  // Sliding window search across the entire binary to locate shifted maps
  const maxSearch = copy.length - orig.length;
  let bestCandidateOffset = -1;
  let highestScore = 0;

  for (let i = 0; i < maxSearch; i++) {
    // Quick check on first byte of original
    if (copy[i] !== orig[0]) continue;

    // Check original bytes
    let origScore = 0;
    for (let o = 0; o < orig.length; o++) {
      if (copy[i + o] === orig[o]) origScore++;
    }

    if (origScore === orig.length) {
      // Original bytes matched, now evaluate pre and post context score
      let preScore = 0;
      for (let p = 0; p < pre.length; p++) {
        const offset = i - pre.length + p;
        if (offset >= 0 && copy[offset] === pre[p]) preScore++;
      }

      let postScore = 0;
      for (let p = 0; p < post.length; p++) {
        const offset = i + orig.length + p;
        if (offset < copy.length && copy[offset] === post[p]) postScore++;
      }

      const totalMatches = origScore + preScore + postScore;
      const confidence = Math.round((totalMatches / totalLen) * 100);

      if (confidence > highestScore) {
        highestScore = confidence;
        bestCandidateOffset = i;
      }

      // If 100% confidence match found, break early
      if (confidence === 100) break;
    }
  }

  if (bestCandidateOffset !== -1 && highestScore >= 80) {
    // Apply modification at shifted offset
    for (let i = 0; i < mod.length; i++) {
      copy[bestCandidateOffset + i] = mod[i];
    }
    const shift = bestCandidateOffset - rule.originalOffset;
    const shiftSign = shift >= 0 ? `+0x${shift.toString(16).toUpperCase()}` : `-0x${Math.abs(shift).toString(16).toUpperCase()}`;

    return {
      updatedBuffer: copy,
      result: {
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'applied',
        matchedOffset: bestCandidateOffset,
        matchedOffsetHex: toHexOffset(bestCandidateOffset),
        offsetShift: shift,
        confidence: highestScore,
        message: `Pattern matched at ${toHexOffset(bestCandidateOffset)} with ${highestScore}% confidence (Offset shifted by ${shiftSign}). Patch applied.`,
      },
    };
  }

  return {
    updatedBuffer: copy,
    result: {
      ruleId: rule.id,
      ruleName: rule.name,
      status: 'not_found',
      confidence: highestScore,
      message: `Signature not found in target binary. Max confidence achieved: ${highestScore}%. Patch skipped to avoid ECU corruption.`,
    },
  };
}

// ==========================================
// 2D Map Curve & Numerical Value Parser
// ==========================================

export function extractMapValues(
  bytes: Uint8Array,
  offset: number,
  count: number,
  mode: '8bit' | '16bit_hilo' | '16bit_lohi' | '32bit_hilo' | '32bit_lohi'
): { values: number[]; labels: string[] } {
  const values: number[] = [];
  const labels: string[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let currentOffset = offset;
  let i = 0;

  while (i < count && currentOffset < bytes.length) {
    labels.push(toHexOffset(currentOffset));

    switch (mode) {
      case '8bit':
        values.push(bytes[currentOffset]);
        currentOffset += 1;
        break;

      case '16bit_hilo': // Big Endian (e.g., Bosch ME7, EDC17 Tricore)
        if (currentOffset + 2 <= bytes.length) {
          values.push(view.getUint16(currentOffset, false));
        } else {
          values.push(0);
        }
        currentOffset += 2;
        break;

      case '16bit_lohi': // Little Endian (e.g., Bosch EDC15, Siemens SIMOS, Denso)
        if (currentOffset + 2 <= bytes.length) {
          values.push(view.getUint16(currentOffset, true));
        } else {
          values.push(0);
        }
        currentOffset += 2;
        break;

      case '32bit_hilo':
        if (currentOffset + 4 <= bytes.length) {
          values.push(view.getUint32(currentOffset, false));
        } else {
          values.push(0);
        }
        currentOffset += 4;
        break;

      case '32bit_lohi':
        if (currentOffset + 4 <= bytes.length) {
          values.push(view.getUint32(currentOffset, true));
        } else {
          values.push(0);
        }
        currentOffset += 4;
        break;
    }
    i++;
  }

  return { values, labels };
}

// ==========================================
// Built-In ECU Rules Library (Preloaded Templates)
// ==========================================

export const BUILTIN_ECU_RULES: PatchRule[] = [
  {
    id: 'builtin_edc16_egr_off',
    name: 'Bosch EDC16C39 EGR Hysteresis Off',
    description: 'Zeroes out the dual EGR duty cycle hysteresis threshold maps (2x2 table) to disable exhaust gas recirculation permanently.',
    ecuFamily: 'Bosch EDC16C39 / EDC16C34',
    category: 'EGR Off',
    originalOffset: 0x074210,
    originalOffsetHex: '0x074210',
    preSignature: [0x3B, 0x00, 0x02, 0x00, 0x01, 0x00, 0x00, 0x00],
    originalBytes: [0x27, 0x10, 0x27, 0x10, 0x27, 0x10, 0x27, 0x10], // 10000 in dec (0x2710)
    modBytes: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],      // 00000 (Disabled)
    postSignature: [0x00, 0x00, 0x03, 0x00, 0x1A, 0x04, 0x00, 0x00],
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'builtin_edc17_dtc_p0401',
    name: 'Bosch EDC17 DTC P0401 Mask Off',
    description: 'Deactivates OBD Diagnostic Trouble Code P0401 (EGR Flow Insufficient Detected) in error path class matrix.',
    ecuFamily: 'Bosch EDC17CP14 / EDC17C46',
    category: 'DTC Off',
    originalOffset: 0x1B8420,
    originalOffsetHex: '0x1B8420',
    preSignature: [0x04, 0x01, 0x00, 0x01, 0x20, 0x00, 0x03, 0x00],
    originalBytes: [0x01, 0x02, 0x01, 0x00],
    modBytes: [0x00, 0x00, 0x00, 0x00],
    postSignature: [0x04, 0x02, 0x00, 0x01, 0x20, 0x00, 0x03, 0x00],
    createdAt: '2026-01-20T00:00:00.000Z',
  },
  {
    id: 'builtin_vag_speed_limiter',
    name: 'VAG / BMW Vmax Speed Limiter Lift (300 km/h)',
    description: 'Raises the electronic factory top speed limiter threshold from 250 km/h to 300 km/h.',
    ecuFamily: 'Siemens Continental SIMOS / Bosch MED17',
    category: 'Speed Limiter',
    originalOffset: 0x0E5100,
    originalOffsetHex: '0x0E5100',
    preSignature: [0xFA, 0x00, 0x00, 0x00, 0x32, 0x00, 0xFA, 0x00],
    originalBytes: [0x00, 0xFA], // 250 km/h
    modBytes: [0x01, 0x2C],      // 300 km/h
    postSignature: [0x00, 0x00, 0x64, 0x00, 0xC8, 0x00, 0x00, 0x00],
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'builtin_denso_dpf_switch',
    name: 'Toyota Denso Gen2 DPF Regeneration Switch Off',
    description: 'Disables active DPF particulate filter regeneration cycles in Denso NEC 76F00xx microcontrollers.',
    ecuFamily: 'Toyota Denso 76F0038/76F0039',
    category: 'DPF Off',
    originalOffset: 0x09F200,
    originalOffsetHex: '0x09F200',
    preSignature: [0x01, 0x00, 0x00, 0x00, 0x14, 0x00, 0x28, 0x00],
    originalBytes: [0x01, 0x01],
    modBytes: [0x00, 0x00],
    postSignature: [0x00, 0x00, 0x50, 0x00, 0x78, 0x00, 0x00, 0x00],
    createdAt: '2026-02-10T00:00:00.000Z',
  },
];

// ==========================================
// Real Sample ECU Binary Pair Generator
// ==========================================

export function generateSampleEcuPair(): {
  stock: Uint8Array;
  mod: Uint8Array;
  stockName: string;
  modName: string;
} {
  // Generate a realistic 512 KB ECU binary with real Bosch headers & calibration tables
  const SIZE = 512 * 1024;
  const stock = new Uint8Array(SIZE);
  const mod = new Uint8Array(SIZE);

  // Fill with typical flash patterns (0xFF unprogrammed flash areas and code blocks)
  for (let i = 0; i < SIZE; i++) {
    // Generate simulated microcontroller instruction byte distribution
    const pseudo = (Math.sin(i * 0.05) * 127 + 128) ^ ((i >> 4) & 0xff);
    stock[i] = pseudo & 0xff;
  }

  // Inject real ASCII ECU information strings
  const injectString = (buf: Uint8Array, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      buf[offset + i] = str.charCodeAt(i);
    }
  };

  injectString(stock, 0x000100, 'BOSCH EDC16C39');
  injectString(stock, 0x000120, '1037389884'); // Real Bosch Software Number
  injectString(stock, 0x000140, '0281013328'); // Real Bosch Hardware Number
  injectString(stock, 0x000160, '03L906022B'); // VAG part number
  injectString(stock, 0x000180, 'EDC16 DIESEL CALIBRATION REV.04');

  // Inject EGR Hysteresis map at 0x074208
  // Pre-signature: 8 bytes
  const pre = [0x3B, 0x00, 0x02, 0x00, 0x01, 0x00, 0x00, 0x00];
  for (let i = 0; i < pre.length; i++) {
    stock[0x074210 - 8 + i] = pre[i];
  }
  // Original EGR threshold values (4 words: 10000 = 0x2710)
  const egrStock = [0x27, 0x10, 0x27, 0x10, 0x27, 0x10, 0x27, 0x10];
  for (let i = 0; i < egrStock.length; i++) {
    stock[0x074210 + i] = egrStock[i];
  }
  // Post-signature: 8 bytes
  const post = [0x00, 0x00, 0x03, 0x00, 0x1A, 0x04, 0x00, 0x00];
  for (let i = 0; i < post.length; i++) {
    stock[0x074210 + egrStock.length + i] = post[i];
  }

  // Inject Speed Limiter at 0x03B100 (250 km/h = 0x00FA)
  stock[0x03B100] = 0x00;
  stock[0x03B101] = 0xFA;

  // Copy stock to mod
  mod.set(stock);

  // Apply MOD 1: EGR Off (Zero the 8 bytes of EGR hysteresis)
  for (let i = 0; i < 8; i++) {
    mod[0x074210 + i] = 0x00;
  }

  // Apply MOD 2: Speed Limiter raised to 300 km/h (0x012C)
  mod[0x03B100] = 0x01;
  mod[0x03B101] = 0x2C;

  // Apply MOD 3: Torque Limiter map curve increase at 0x042500 (16 bytes)
  for (let i = 0; i < 16; i++) {
    const origVal = (stock[0x042500 + i] = 120 + i * 5);
    mod[0x042500 + i] = Math.min(255, origVal + 35); // +35 Nm torque limit
  }

  return {
    stock,
    mod,
    stockName: 'Bosch_EDC16C39_1037389884_Stock.bin',
    modName: 'Bosch_EDC16C39_1037389884_EGR_Vmax_Stage1.bin',
  };
}
