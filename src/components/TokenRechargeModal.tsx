/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TokenRechargeModal: GPay, PhonePe UPI, and Card Token Pack Purchase Portal
 */

import React, { useState } from 'react';
import {
  X,
  Coins,
  CheckCircle2,
  QrCode,
  CreditCard,
  Copy,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { useTokens, TokenPackItem } from '../lib/tokenContext';
import { useAuth } from '../lib/authContext';

export const TokenRechargeModal: React.FC = () => {
  const { isRechargeModalOpen, setIsRechargeModalOpen, availablePacks, rechargeTokens, tokenBalance } = useTokens();
  const { user } = useAuth();

  const [selectedPackId, setSelectedPackId] = useState<string>(
    availablePacks[0]?.id || 'pack_workshop'
  );
  const [paymentMethod, setPaymentMethod] = useState<'gpay_upi' | 'card'>('gpay_upi');
  const [copied, setCopied] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isRechargeModalOpen) return null;

  const defaultPacks: TokenPackItem[] = [
    {
      id: 'pack_starter',
      name: 'Starter Pack',
      tokenCount: 5,
      priceINR: 499,
      priceUSD: 8,
      description: '5 ECU Binary Exports & Patches',
      badge: 'Starter',
      isActive: true,
    },
    {
      id: 'pack_workshop',
      name: 'Workshop Pro',
      tokenCount: 15,
      priceINR: 1299,
      priceUSD: 20,
      description: '15 High-Performance Calibrations',
      badge: 'Popular',
      isActive: true,
    },
    {
      id: 'pack_fleet',
      name: 'Fleet Master',
      tokenCount: 50,
      priceINR: 3499,
      priceUSD: 55,
      description: '50 Commercial Batch Patches',
      badge: 'Best Value',
      isActive: true,
    },
  ];

  const packs = availablePacks.length > 0 ? availablePacks : defaultPacks;
  const activePack = packs.find((p) => p.id === selectedPackId) || packs[1] || packs[0];

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('revtuner@upi');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const ref = paymentMethod === 'gpay_upi'
      ? utrInput.trim() || `UPI_${Math.floor(100000 + Math.random() * 900000)}`
      : `CARD_${Math.floor(100000 + Math.random() * 900000)}`;

    const res = await rechargeTokens(activePack.id, paymentMethod, ref);
    setIsProcessing(false);

    if (res.success) {
      setSuccessMessage(
        `Top-up successful! +${activePack.tokenCount} Usage Credits have been added to your account.`
      );
      setTimeout(() => {
        setSuccessMessage(null);
        setIsRechargeModalOpen(false);
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Top-Up Usage Token Credits</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {tokenBalance} Current Credits
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Purchase calibration credits via GPay, PhonePe UPI, or Card
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRechargeModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {successMessage ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Payment Confirmed
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                {successMessage}
              </p>
            </div>
          ) : (
            <>
              {/* Select Token Pack */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  1. Select Token Credit Pack
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {packs.map((pack) => {
                    const isSelected = pack.id === selectedPackId;
                    return (
                      <div
                        key={pack.id}
                        onClick={() => setSelectedPackId(pack.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-300'
                        }`}
                      >
                        {pack.badge && (
                          <span className="absolute -top-2 right-2 text-[9px] font-mono font-bold uppercase bg-emerald-600 text-white px-1.5 py-0.2 rounded-full shadow-2xs">
                            {pack.badge}
                          </span>
                        )}
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                          {pack.tokenCount} Tokens
                        </div>
                        <div className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">
                          ₹{pack.priceINR}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            (${pack.priceUSD})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                          {pack.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Switcher */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  2. Choose Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gpay_upi')}
                    className={`py-2 px-3 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      paymentMethod === 'gpay_upi'
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>GPay / PhonePe UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-3 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      paymentMethod === 'card'
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Debit / Credit Card</span>
                  </button>
                </div>
              </div>

              {/* Payment Forms */}
              <form onSubmit={handleCompletePayment} className="space-y-3 pt-1">
                {paymentMethod === 'gpay_upi' ? (
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">Official UPI ID:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          revtuner@upi
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-500"
                          title="Copy UPI ID"
                        >
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center shrink-0">
                        <QrCode className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Scan with GPay, PhonePe, or Paytm
                        </div>
                        <div>
                          Pay exactly{' '}
                          <strong className="text-emerald-700 dark:text-emerald-400">
                            ₹{activePack.priceINR}
                          </strong>{' '}
                          for {activePack.tokenCount} credits
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                        Enter 12-Digit UTR / Transaction Reference Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 412389102931"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 8921"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                          Expiry MM/YY
                        </label>
                        <input
                          type="text"
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                          CVC / CVV
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Instant Credit Activation</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>
                          Pay ₹{activePack.priceINR} &amp; Add +{activePack.tokenCount} Tokens
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
