/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LegalModal: Dedicated modal for About, Readme, Supports, and User Agreement.
 * Displays developer information: Samuel Renthlei, samuellalrinfela@gmail.com
 */

import React, { useState } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  Mail,
  User,
  Heart,
  ExternalLink,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Code2,
} from 'lucide-react';

export type LegalModalTab = 'about' | 'readme' | 'supports' | 'agreement';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalModalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'about',
}) => {
  const [activeTab, setActiveTab] = useState<LegalModalTab>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-200 dark:border-blue-900">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  RevTuner Enterprise Platform
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  v3.8.2
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lead Architect: <strong>Samuel Renthlei</strong> · samuellalrinfela@gmail.com
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls Bar */}
        <div className="shrink-0 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'about'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>About Developer</span>
          </button>

          <button
            onClick={() => setActiveTab('readme')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'readme'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Readme &amp; Guides</span>
          </button>

          <button
            onClick={() => setActiveTab('supports')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'supports'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Supports &amp; ECUs</span>
          </button>

          <button
            onClick={() => setActiveTab('agreement')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'agreement'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>User Agreement</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          
          {/* TAB 1: ABOUT DEVELOPER */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    SR
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Samuel Renthlei
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Lead Automotive Systems &amp; ECU Reverse-Engineering Architect
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-blue-700 dark:text-blue-400 font-mono">
                      <Mail className="w-3.5 h-3.5" />
                      <a href="mailto:samuellalrinfela@gmail.com" className="hover:underline">
                        samuellalrinfela@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  <div>Platform: RevTuner Workstation</div>
                  <div className="font-mono text-slate-700 dark:text-slate-300 font-bold">Aizawl, Mizoram, India</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs">
                  <Code2 className="w-4 h-4 text-blue-600" />
                  <span>Platform Vision &amp; Mission</span>
                </h4>
                <p className="leading-relaxed">
                  RevTuner hi khawvel pum huap leh Mizoram automotive tuners te tan liau liau a duan a ni a. WinOLS, DaVinci, leh PCMflash te anga automotive reverse-engineering thawk theiin, Gemini 3.8 Flash AI fing tak nen raw binary, map curves, leh checksum calculation felfai taka khawih theih tura siam a ni.
                </p>
                <p className="leading-relaxed">
                  He project hi Samuel Renthlei kutchhuak a ni a, workshop tana awlsam, chipchiar, leh dik fai taka flash file zirchianna leh tuning khawihna tur a ni.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: README & GUIDES */}
          {activeTab === 'readme' && (
            <div className="space-y-3.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                RevTuner Quickstart Guide &amp; Readme
              </h3>
              
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                  <strong className="text-slate-900 dark:text-slate-100 block mb-1">1. Binary Loading &amp; WinOLS Hex Diff</strong>
                  <p className="text-slate-600 dark:text-slate-400">
                    Stock leh Mod .bin file thun la, system hian byte inthlak zawng zawng WinOLS style-in offset wise-in a tarlang ang.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                  <strong className="text-slate-900 dark:text-slate-100 block mb-1">2. AI Motor Detection &amp; Capabilities</strong>
                  <p className="text-slate-600 dark:text-slate-400">
                    File i upload rualin eng motor in nge hmang (BMW, Toyota Hilux, VW Golf etc.), enge khawih danglam theih (Stage 1, EGR, Vmax) leh eng thil nge a support loh tih AI in a chhui chhuak nghal vek ang.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                  <strong className="text-slate-900 dark:text-slate-100 block mb-1">3. Token Countdown Ledger &amp; Top-up</strong>
                  <p className="text-slate-600 dark:text-slate-400">
                    Account tharah usage token 2 a in-tan a. Binary export apiangin token 1 a in-deduct zel a, GPay/UPI/Card hmangin awlsam takin token a lei belh theih a ni.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                  <strong className="text-slate-900 dark:text-slate-100 block mb-1">4. Admin Backend (6009316925)</strong>
                  <p className="text-slate-600 dark:text-slate-400">
                    Server backend panel luh theihna hi Admin account bik chauh tan hawn a ni a. Database pum pui, pack pricing, leh flash repository te a manage theih vek a ni.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUPPORTS & ECU PROTOCOLS */}
          {activeTab === 'supports' && (
            <div className="space-y-3.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Supported ECU Families &amp; Communication Protocols
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">Bosch Diesel &amp; Petrol</div>
                  <p className="text-[11px] text-slate-500">EDC15, EDC16C35, EDC17C50, EDC17CP02, MD1CS006, MG1CS024</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">Denso Common Rail</div>
                  <p className="text-[11px] text-slate-500">Gen 1, Gen 2 (NEC 76F00xx), Hilux 1GD/2GD-FTV, D-4D series</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">Continental / Siemens</div>
                  <p className="text-[11px] text-slate-500">Simos PCR2.1, Simos 8, Simos 12, Simos 18, SID208, SID807</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">Delphi &amp; Magneti Marelli</div>
                  <p className="text-[11px] text-slate-500">CRD2, CRD3, DCM3.7, DCM6.2, Marelli MJD 6F3, 8DF, 9DF</p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-900 dark:text-blue-200">Customer &amp; Technical Support</div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-400">Direct query &amp; calibration custom requests</div>
                </div>
                <a
                  href="mailto:samuellalrinfela@gmail.com"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-2xs"
                >
                  Contact Developer
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: USER AGREEMENT & DISCLAIMER */}
          {activeTab === 'agreement' && (
            <div className="space-y-3 leading-relaxed">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                End User License &amp; Calibration Safety Agreement
              </h3>

              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 inline mr-1.5" />
                <strong>Motorsport &amp; Off-Highway Calibration Notice:</strong> He platform hi professional automotive workshop, tuners, leh motorsport engineering tana siam a ni.
              </div>

              <ul className="space-y-2 list-disc pl-4 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  User-in binary file a modify leh flasher hmanga motor a write hian motor mechanical limit leh emissions standards zawm tur a ni.
                </li>
                <li>
                  Emissions delete (EGR Off, DPF Off) te hi off-road, track use, emaw legal compliance rules zulzui chauhva hman tur a ni.
                </li>
                <li>
                  Usage token hi binary export leh patch extraction tana hman a ni a, token zawh hnuah top-up theih a ni.
                </li>
                <li>
                  Platform developer <strong>Samuel Renthlei</strong> leh software hi user-te mechanical thil tihsual (improper high rail pressure/boost) avanga motor chhia-ah mawhphurtu a ni lo.
                </li>
              </ul>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Crafted with passion by</span>
            <strong className="text-slate-800 dark:text-slate-200">Samuel Renthlei</strong>
            <span>(samuellalrinfela@gmail.com)</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-2xs"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
