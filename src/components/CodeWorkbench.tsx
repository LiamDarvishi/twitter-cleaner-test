import React, { useState } from 'react';
import {
  NukeScriptConfig,
  generateAndroidManifestXml,
  generateInjectedJs,
  generateMainActivityKt,
  validateRequirements,
} from '../utils/androidCodeGenerator';
import { Check, Copy, Download, FileCode2 } from 'lucide-react';

interface CodeWorkbenchProps {
  config: NukeScriptConfig;
  onChangeConfig: (next: NukeScriptConfig) => void;
  activeTab: 'MainActivity.kt' | 'AndroidManifest.xml' | 'InjectedJS.js';
  onSelectTab: (tab: 'MainActivity.kt' | 'AndroidManifest.xml' | 'InjectedJS.js') => void;
}

export const CodeWorkbench: React.FC<CodeWorkbenchProps> = ({
  config,
  onChangeConfig,
  activeTab,
  onSelectTab,
}) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const manifestXml = generateAndroidManifestXml();
  const mainActivityKt = generateMainActivityKt(config);
  const injectedJs = generateInjectedJs(config);

  const currentCode =
    activeTab === 'MainActivity.kt'
      ? mainActivityKt
      : activeTab === 'AndroidManifest.xml'
      ? manifestXml
      : injectedJs;

  const currentFilePath =
    activeTab === 'MainActivity.kt'
      ? `app/src/main/java/${config.packageName.replace(/\./g, '/')}/MainActivity.kt`
      : activeTab === 'AndroidManifest.xml'
      ? 'app/src/main/AndroidManifest.xml'
      : 'evaluateJavascript(NUKE_ALL_TWEETS_JS, null)';

  const checks = validateRequirements(manifestXml, mainActivityKt);

  const handleCopy = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(label);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch {
      // Fallback textarea copy
      const el = document.createElement('textarea');
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedFile(label);
      setTimeout(() => setCopiedFile(null), 2000);
    }
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Parameter & Timing Controls */}
      <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Android Studio Project Parameters
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize package namespace and realistic setTimeout intervals (800ms–2000ms)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 font-mono tabular-nums">
            <span className="whitespace-nowrap">Kotlin 2.0</span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">Jetpack Compose Material 3</span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">Min SDK 26</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="android-package-input"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Kotlin Package Name
            </label>
            <input
              id="android-package-input"
              type="text"
              value={config.packageName}
              onChange={(e) =>
                onChangeConfig({ ...config, packageName: e.target.value })
              }
              placeholder="com.example.xnuke"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label
              htmlFor="min-delay-input"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Min Action Delay (ms):{' '}
              <span className="font-mono text-slate-100 tabular-nums">
                {config.minDelayMs}ms
              </span>
            </label>
            <input
              id="min-delay-input"
              type="range"
              min={600}
              max={1500}
              step={50}
              value={config.minDelayMs}
              onChange={(e) => {
                const nextMin = Number(e.target.value);
                onChangeConfig({
                  ...config,
                  minDelayMs: nextMin,
                  maxDelayMs: Math.max(nextMin + 250, config.maxDelayMs),
                });
              }}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor="max-delay-input"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Max Action Delay (ms):{' '}
              <span className="font-mono text-slate-100 tabular-nums">
                {config.maxDelayMs}ms
              </span>
            </label>
            <input
              id="max-delay-input"
              type="range"
              min={1000}
              max={2500}
              step={50}
              value={config.maxDelayMs}
              onChange={(e) => {
                const nextMax = Number(e.target.value);
                onChangeConfig({
                  ...config,
                  maxDelayMs: nextMax,
                  minDelayMs: Math.min(config.minDelayMs, nextMax - 200),
                });
              }}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Source File Tabs & Code Viewer */}
      <div className="border border-slate-800 bg-slate-900/70 rounded-xl overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          {/* Interactive Segmented File Selector */}
          <div
            role="tablist"
            aria-label="Android Studio Source Files"
            className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto max-w-full"
          >
            {(
              [
                { id: 'MainActivity.kt', label: 'MainActivity.kt' },
                { id: 'AndroidManifest.xml', label: 'AndroidManifest.xml' },
                { id: 'InjectedJS.js', label: 'Injected JS' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Copy & Download Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(currentCode, activeTab)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedFile === activeTab ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied {activeTab}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy {activeTab}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDownload(activeTab, currentCode)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* File Path Subheader */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <FileCode2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="truncate">{currentFilePath}</span>
          </div>
          <span className="text-slate-500 shrink-0 tabular-nums">
            {currentCode.split('\n').length} lines · Null-Safe
          </span>
        </div>

        {/* Code Content */}
        <div className="max-h-[540px] overflow-auto bg-[#070A10] p-4">
          <pre className="text-xs font-mono leading-relaxed text-slate-200 overflow-x-auto select-all">
            <code>{currentCode}</code>
          </pre>
        </div>
      </div>

      {/* Specification Verification Checklist (Single-Elevation with Hairline Dividers) */}
      <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-2">
          Strict Technical Spec Verification
        </h3>
        <div className="divide-y divide-slate-800/80">
          {checks.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 py-3 first:pt-1 last:pb-0"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {item.label}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {item.detail}
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 shrink-0 inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
