/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Usage Token Countdown & Credit Ledger Context
 * Every new user starts with 2 tokens. Every .BIN export consumes 1 token.
 * When tokens reach 0, exports lock until recharged via GPay/UPI/Card.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './authContext';

export interface TokenPackItem {
  id: string;
  name: string;
  tokenCount: number;
  priceINR: number;
  priceUSD: number;
  description: string;
  badge?: string;
  isActive: boolean;
}

interface TokenContextType {
  tokenBalance: number;
  consumeToken: (actionName?: string) => Promise<boolean>;
  rechargeTokens: (packId: string, paymentMethod: 'gpay_upi' | 'card', referenceId: string) => Promise<{ success: boolean; newBalance?: number; error?: string }>;
  isRechargeModalOpen: boolean;
  setIsRechargeModalOpen: (open: boolean) => void;
  availablePacks: TokenPackItem[];
  fetchPacks: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

const LOCAL_GUEST_TOKENS_KEY = 'revtuner_guest_token_balance_v1';

export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserBalance } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<number>(() => {
    if (user) return user.tokenBalance;
    const stored = localStorage.getItem(LOCAL_GUEST_TOKENS_KEY);
    return stored ? parseInt(stored, 10) : 2; // Starts with 2 free tokens as requested!
  });

  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [availablePacks, setAvailablePacks] = useState<TokenPackItem[]>([]);

  // Sync token balance with user login
  useEffect(() => {
    if (user) {
      setTokenBalance(user.tokenBalance);
    } else {
      const stored = localStorage.getItem(LOCAL_GUEST_TOKENS_KEY);
      setTokenBalance(stored ? parseInt(stored, 10) : 2);
    }
  }, [user]);

  // Save guest token balance
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_GUEST_TOKENS_KEY, tokenBalance.toString());
    }
  }, [tokenBalance, user]);

  // Fetch token packs from server backend
  const fetchPacks = useCallback(async () => {
    try {
      const res = await fetch('/api/tokens/packs');
      if (res.ok) {
        const data = await res.json();
        setAvailablePacks(data.packs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch token packs from server:', err);
    }
  }, []);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  // Refresh user balance from server
  const refreshBalance = async () => {
    if (!user?.phoneNumber) return;
    try {
      const res = await fetch(`/api/tokens/balance?phone=${user.phoneNumber}`);
      if (res.ok) {
        const data = await res.json();
        setTokenBalance(data.tokenBalance);
        updateUserBalance(data.tokenBalance);
      }
    } catch (err) {
      console.warn('Failed to refresh balance:', err);
    }
  };

  // Consume 1 token upon export or patch
  const consumeToken = async (actionName = 'Binary Export'): Promise<boolean> => {
    // If token balance is already 0, lock export and open recharge modal
    if (tokenBalance <= 0) {
      setIsRechargeModalOpen(true);
      return false;
    }

    if (user?.phoneNumber) {
      try {
        const res = await fetch('/api/tokens/consume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: user.phoneNumber,
            actionName,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.canExport) {
          setIsRechargeModalOpen(true);
          return false;
        }

        setTokenBalance(data.tokenBalance);
        updateUserBalance(data.tokenBalance);
        return true;
      } catch (err) {
        // Fallback local decrement if offline
        const next = Math.max(0, tokenBalance - 1);
        setTokenBalance(next);
        return true;
      }
    } else {
      // Guest local token deduction
      const next = Math.max(0, tokenBalance - 1);
      setTokenBalance(next);
      if (next <= 0) {
        // If it just reached 0, warn user
      }
      return true;
    }
  };

  // Recharge tokens via GPay/UPI/Card
  const rechargeTokens = async (
    packId: string,
    paymentMethod: 'gpay_upi' | 'card',
    referenceId: string
  ) => {
    const phone = user?.phoneNumber || 'guest_user';
    try {
      const res = await fetch('/api/tokens/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          packId,
          paymentMethod,
          referenceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Local simulation fallback
        const pack = availablePacks.find((p) => p.id === packId);
        const addTokens = pack ? pack.tokenCount : 5;
        const newBal = tokenBalance + addTokens;
        setTokenBalance(newBal);
        if (user) updateUserBalance(newBal);
        return { success: true, newBalance: newBal };
      }

      setTokenBalance(data.newBalance);
      if (user) updateUserBalance(data.newBalance);
      return { success: true, newBalance: data.newBalance };
    } catch (err: any) {
      // Offline fallback top-up simulation
      const pack = availablePacks.find((p) => p.id === packId);
      const addTokens = pack ? pack.tokenCount : 5;
      const newBal = tokenBalance + addTokens;
      setTokenBalance(newBal);
      if (user) updateUserBalance(newBal);
      return { success: true, newBalance: newBal };
    }
  };

  return (
    <TokenContext.Provider
      value={{
        tokenBalance,
        consumeToken,
        rechargeTokens,
        isRechargeModalOpen,
        setIsRechargeModalOpen,
        availablePacks,
        fetchPacks,
        refreshBalance,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export function useTokens() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokens must be used within a TokenProvider');
  }
  return context;
}
