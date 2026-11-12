/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AuthModal: Phone + Password Login and Sign Up Modal
 * Supports Admin (6009316925 / Srenthlei16#) and Tuner accounts.
 */

import React, { useState } from 'react';
import {
  X,
  Phone,
  Lock,
  User,
  Building,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'otp_verify'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('849201');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await login(phoneNumber, password);
    setIsLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to login');
    }
  };

  const handleInitiateSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !password) {
      setError('Please provide phone number and password');
      return;
    }
    // Simulate SMS OTP dispatch
    const fakeOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(fakeOtp);
    setMode('otp_verify');
  };

  const handleConfirmSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await signup(phoneNumber, password, displayName, workshopName);
    setIsLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to complete signup');
    }
  };

  const fillAdminCredentials = () => {
    setPhoneNumber('6009316925');
    setPassword('Srenthlei16#');
    setMode('login');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-sm w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/10 text-cyan-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {mode === 'login'
                  ? 'Tuner / Admin Login'
                  : mode === 'signup'
                  ? 'Sign Up with Phone'
                  : 'Verify SMS Code'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'login'
                  ? 'Login with Phone Number and Password'
                  : 'New accounts receive 2 free usage tokens'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        {mode !== 'otp_verify' && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 font-medium transition-colors ${
                mode === 'login'
                  ? 'border-b-2 border-cyan-600 text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-50/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              Login (Phone + Password)
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2 font-medium transition-colors ${
                mode === 'signup'
                  ? 'border-b-2 border-cyan-600 text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-50/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              Sign Up (+2 Credits)
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-4 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    placeholder="e.g. 6009316925"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded text-xs font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              {/* Admin Quick Credentials Button */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-800 dark:text-rose-300 rounded text-[11px] font-mono border border-rose-200 dark:border-rose-800/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Use Admin Account (6009316925)</span>
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleInitiateSignup} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded text-xs font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Tuner Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Samuel"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Garage / Workshop Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Apex Dyno Workshop"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="password"
                    placeholder="Choose strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Continue &amp; Verify SMS</span>
              </button>
            </form>
          )}

          {mode === 'otp_verify' && (
            <form onSubmit={handleConfirmSignupOtp} className="space-y-3">
              <div className="p-2.5 rounded bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-800 dark:text-cyan-300 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SMS Verification Code Sent</span>
                </div>
                <div className="text-[11px] font-mono">
                  Simulation Code: <strong>{generatedOtp}</strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Enter 6-Digit SMS Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder={generatedOtp}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-widest py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded text-base font-mono font-bold outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded transition-colors shadow-xs"
                >
                  {isLoading ? 'Creating Account...' : 'Confirm & Claim 2 Tokens'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
