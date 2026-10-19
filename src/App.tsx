/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  DEFAULT_NUKE_CONFIG,
  NukeScriptConfig,
  generateMainActivityKt,
} from './utils/androidCodeGenerator';
import { CodeWorkbench } from './components/CodeWorkbench';
import { AndroidSimulator } from './components/AndroidSimulator';
import { Check, Copy } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<NukeScriptConfig>(DEFAULT_NUKE_CONFIG);
  const [activeTab, setActiveTab] = useState<
    'MainActivity.kt' | 'AndroidManifest.xml' | 'InjectedJS.js'
  >('MainActivity.kt');
  const [headerCopied, setHeaderCopied] = useState(false);

  const handleCopyMainActivity = async () => {
    const code = generateMainActivityKt(config);
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setHeaderCopied(true);
    setTimeout(() => setHeaderCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-[#0F172A]">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          XNuke Studio
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a
            href="#workbench"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('MainActivity.kt');
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            MainActivity.kt
          </a>
          <a
            href="#manifest"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('AndroidManifest.xml');
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            AndroidManifest.xml
          </a>
          <a
            href="#js-engine"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('InjectedJS.js');
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            JS Engine
          </a>
          <a
            href="#simulator"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            WebView Simulator
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleCopyMainActivity}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
          >
            {headerCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied MainActivity.kt</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy MainActivity.kt</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Intro Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
              Single-Activity Kotlin &amp; Jetpack Compose X Tweet Nuker
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Copy-paste ready, null-safe Android Studio implementation hosting an
              in-app WebView pointed at <code className="text-slate-200">https://x.com/login</code> with a Material 3 red{' '}
              <code className="text-red-400 font-semibold">NUKE ALL TWEETS</code> header button that injects an autonomous DOM deletion and infinite-scroll loop via{' '}
              <code className="text-slate-200">evaluateJavascript</code>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 font-mono shrink-0">
            <span className="whitespace-nowrap">Zero Dry-Run Checks</span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">Direct DOM Injection</span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">Posts &amp; Reposts</span>
          </div>
        </div>

        {/* 2-Column Workspace Grid */}
        <div
          id="workbench"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left 7 Columns: Android Studio Code Workbench */}
          <div className="lg:col-span-7">
            <CodeWorkbench
              config={config}
              onChangeConfig={setConfig}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            />
          </div>

          {/* Right 5 Columns: Interactive Android Device Simulator */}
          <div id="simulator" className="lg:col-span-5 lg:sticky lg:top-6">
            <AndroidSimulator
              minDelayMs={config.minDelayMs}
              maxDelayMs={config.maxDelayMs}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
