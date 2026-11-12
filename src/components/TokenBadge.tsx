/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TokenBadge: Real-time Usage Token Countdown Badge in Header
 */

import React from 'react';
import { Coins, Plus, AlertCircle, Lock } from 'lucide-react';
import { useTokens } from '../lib/tokenContext';

export const TokenBadge: React.FC = () => {
  const { tokenBalance, setIsRechargeModalOpen } = useTokens();

  const isZero = tokenBalance <= 0;
  const isLow = tokenBalance === 1;

  return (
    <div className="flex items-center gap-1 select-none">
      <button
        onClick={() => setIsRechargeModalOpen(true)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-medium transition-all shadow-2xs cursor-pointer ${
          isZero
            ? 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/80 animate-pulse'
            : isLow
            ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80'
        }`}
        title={
          isZero
            ? 'Tokens exhausted! Click to recharge via GPay/UPI/Card'
            : `${tokenBalance} Usage Credits remaining. Click to Top-Up.`
        }
      >
        {isZero ? (
          <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        ) : (
          <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        )}

        <div className="flex items-center gap-1">
          <span className="font-bold">{tokenBalance}</span>
          <span className="text-[10px] hidden xs:inline">
            {tokenBalance === 1 ? 'Credit' : 'Credits'}
          </span>
        </div>

        <div className="flex items-center justify-center w-3.5 h-3.5 rounded bg-white/60 dark:bg-black/20 ml-0.5">
          <Plus className="w-2.5 h-2.5" />
        </div>
      </button>

      {isZero && (
        <span
          onClick={() => setIsRechargeModalOpen(true)}
          className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 cursor-pointer hover:underline"
        >
          <AlertCircle className="w-3 h-3" />
          <span>Top Up to Export</span>
        </span>
      )}
    </div>
  );
};
