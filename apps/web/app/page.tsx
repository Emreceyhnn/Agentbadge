'use client';

import React, { useState } from 'react';
import { ShieldCheck, Terminal, Sparkles, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

interface ScanPillar {
  name: string;
  percentage: number;
  score: number;
  maxScore: number;
}

interface ScanData {
  score: number;
  tier: string;
  grade: string;
  repoName: string;
  pillars: Record<string, ScanPillar>;
}

export default function Home() {
  const [repoInput, setRepoInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanData | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    setScanning(true);
    setErrorMessage(null);
    setScanResult(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: repoInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to scan repository.');
      }

      setScanResult({
        score: data.result.score,
        tier: data.result.tier,
        grade: data.result.grade,
        repoName: data.repo,
        pillars: data.result.pillars,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while scanning.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-gray-800/60">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">agentbadge</span>
        </div>
        <div className="flex items-center space-x-6">
          <a href="#pillars" className="text-sm font-medium text-gray-400 hover:text-white transition">5 Pillars</a>
          <a href="#quickstart" className="text-sm font-medium text-gray-400 hover:text-white transition">Quickstart</a>
          <a
            href="https://github.com/Emreceyhnn/Agentbadge"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition"
          >
            <span>GitHub ↗</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-4xl px-6 pt-20 pb-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/40 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>What Lighthouse is to web performance, agentbadge is to AI agent readiness</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight sm:leading-none">
          Is Your Repo <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            AI Agent-Ready?
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
          Benchmark how well autonomous coding agents (Claude Code, Cursor, Codex, Devin) navigate and execute in your repository. Score from 0 to 100, turn missing context into ready-to-merge diffs, and show off a live README badge.
        </p>

        {/* Scan Input Form */}
        <form onSubmit={handleScan} className="mt-10 w-full max-w-xl flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="e.g. facebook/react or github.com/owner/repo"
            className="flex-1 bg-gray-900/90 border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-sm text-gray-100 placeholder-gray-500 outline-none transition"
          />
          <button
            type="submit"
            disabled={scanning}
            className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {scanning ? (
              <span>Auditing...</span>
            ) : (
              <>
                <span>Score Repo</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mt-6 w-full max-w-xl bg-red-950/40 border border-red-800 rounded-xl p-4 flex items-center space-x-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Real Scan Result Modal / Card */}
        {scanResult && (
          <div className="mt-8 w-full max-w-xl bg-gray-900/90 border border-indigo-500/40 rounded-2xl p-6 text-left shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Audited Repo</span>
                <h3 className="text-lg font-bold text-white">{scanResult.repoName}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-black text-indigo-400">{scanResult.score}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 font-bold border border-indigo-800">
                  {scanResult.tier} ({scanResult.grade})
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-400">Live README Badge:</span>
              <img src={`/api/badge?score=${scanResult.score}`} alt="agentbadge" className="h-5" />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800/80 flex items-center justify-between">
              <code className="text-xs bg-gray-950 px-3 py-2 rounded-lg text-indigo-300 border border-gray-800 font-mono">
                npx agentbadge scan . --fix
              </code>
              <span className="text-xs text-green-400 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Audit Complete</span>
              </span>
            </div>
          </div>
        )}

        {/* CLI Quick Terminal Banner */}
        <div id="quickstart" className="mt-12 w-full max-w-xl bg-black/50 border border-gray-800 rounded-2xl p-4 text-left font-mono text-sm text-gray-300">
          <div className="flex items-center space-x-2 text-gray-500 mb-2 border-b border-gray-800/60 pb-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="text-xs">Run instantly from your terminal:</span>
          </div>
          <div className="text-indigo-400">
            $ <span className="text-gray-100">npx agentbadge scan . --badge --fix</span>
          </div>
        </div>
      </main>

      {/* The 5 Pillars Section */}
      <section id="pillars" className="w-full max-w-5xl px-6 py-16 border-t border-gray-800/60">
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white">
          The 5 Pillars of Agent Readiness
        </h2>
        <p className="text-center text-gray-400 text-sm mt-2 max-w-xl mx-auto">
          Repositories are no longer just for human eyes — they must expose machine-readable context.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-indigo-500/40 transition">
            <h3 className="font-bold text-lg text-white">1. Context & Boundaries (25 Pts)</h3>
            <p className="text-sm text-gray-400 mt-2">
              AGENTS.md, CLAUDE.md, and documented architecture. Does the agent know its guardrails within 60 seconds?
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-indigo-500/40 transition">
            <h3 className="font-bold text-lg text-white">2. Setup & Environment (20 Pts)</h3>
            <p className="text-sm text-gray-400 mt-2">
              Deterministic lockfiles, .env.example templates, and containerized environments for one-command boots.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-indigo-500/40 transition">
            <h3 className="font-bold text-lg text-white">3. Verification & Feedback (20 Pts)</h3>
            <p className="text-sm text-gray-400 mt-2">
              Can the agent test its own code in 30 seconds? Automated test suites, strict type-checking, and formatters.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-indigo-500/40 transition">
            <h3 className="font-bold text-lg text-white">4. Guardrails & Safety (20 Pts)</h3>
            <p className="text-sm text-gray-400 mt-2">
              CI/CD automation, pre-commit hooks, and secret leak prevention to prevent broken code from shipping.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-indigo-500/40 transition md:col-span-2">
            <h3 className="font-bold text-lg text-white">5. Tooling & Machine Schemas (15 Pts)</h3>
            <p className="text-sm text-gray-400 mt-2">
              Model Context Protocol (MCP) tool manifests, OpenAPI/Prisma models, and machine-readable logs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-gray-800/60 py-8 px-6 text-center text-xs text-gray-500">
        © 2026 agentbadge. Open standard under MIT License.
      </footer>
    </div>
  );
}
