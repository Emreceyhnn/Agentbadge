import test from 'node:test';
import assert from 'node:assert';
import { runScan } from './engine.js';
import { generateSvgBadge } from './badge.js';
import { generateRemediationAgentsMd } from './remediator.js';
import type { RuleContext, ScanResult } from './types.js';

test('runScan returns low score for empty repo', async () => {
  const mockCtx: RuleContext = {
    files: [],
    fileExists: () => false,
    readFile: async () => null
  };

  const result = await runScan(mockCtx);
  assert.strictEqual(result.tier, 'agent-hostile');
  assert.ok(result.score <= 30);
  assert.strictEqual(result.summary.criticalIssuesCount >= 3, true);
});

test('runScan gives high score for fully prepared repository', async () => {
  const preparedFiles = [
    'AGENTS.md',
    'README.md',
    'docs/ARCHITECTURE.md',
    'CONTRIBUTING.md',
    'pnpm-lock.yaml',
    '.env.example',
    'Dockerfile',
    'Makefile',
    'tsconfig.json',
    'package.json',
    '.eslintrc.json',
    'src/index.test.ts',
    '.github/workflows/ci.yml',
    '.husky',
    '.gitignore',
    'scripts/seed.ts',
    'mcp.json',
    'schema.prisma'
  ];

  const mockCtx: RuleContext = {
    files: preparedFiles,
    fileExists: (path: string) => preparedFiles.includes(path),
    readFile: async (path: string) => {
      if (path === 'README.md') return '# Title\n## Architecture\nRun `npm test` and `pnpm install`';
      if (path === 'package.json') return JSON.stringify({ scripts: { test: 'vitest', 'type-check': 'tsc --noEmit', lint: 'eslint', setup: 'pnpm i' } });
      if (path === '.gitignore') return 'node_modules\n.env\n.env.local\ndist';
      return '';
    }
  };

  const result = await runScan(mockCtx);
  assert.ok(result.score >= 80, `Expected score >= 80, got ${result.score}`);
  assert.strictEqual(result.tier, 'agent-ready');
});

test('generateSvgBadge creates valid SVG with score and colors', () => {
  const svg = generateSvgBadge(92, 'agent-ready', 'A');
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('92/100 · agent-ready (A)'));
  assert.ok(svg.includes('#22c55e')); // Green color for agent-ready
});

test('generateSvgBadge handles unknown / rate-limited state cleanly', () => {
  const svg = generateSvgBadge(null, 'unknown');
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('unknown'));
  assert.ok(svg.includes('#6b7280')); // Neutral gray for unknown
});

test('generateRemediationAgentsMd is strictly idempotent', () => {
  const mockScan: ScanResult = {
    score: 65,
    tier: 'agent-friendly',
    grade: 'B',
    scannedAt: new Date().toISOString(),
    repoPath: '.',
    pillars: {
      context: { id: 'context', name: 'Context', weight: 25, score: 20, maxScore: 25, percentage: 80, findings: [] },
      setup: { id: 'setup', name: 'Setup', weight: 20, score: 10, maxScore: 20, percentage: 50, findings: [] },
      verification: { id: 'verification', name: 'Verification', weight: 20, score: 10, maxScore: 20, percentage: 50, findings: [] },
      guardrails: { id: 'guardrails', name: 'Guardrails', weight: 20, score: 15, maxScore: 20, percentage: 75, findings: [] },
      tooling: { id: 'tooling', name: 'Tooling', weight: 15, score: 10, maxScore: 15, percentage: 66, findings: [] }
    },
    summary: { criticalIssuesCount: 0, recommendedActions: [] }
  };

  const initial = '# My Custom Existing AGENTS.md\nRules here.';
  const firstPass = generateRemediationAgentsMd(mockScan, { existingContent: initial, packageManager: 'pnpm' });
  assert.ok(firstPass.includes('Agent Readiness Patch'));
  assert.ok(firstPass.includes('pnpm type-check'));

  const secondPass = generateRemediationAgentsMd(mockScan, { existingContent: firstPass, packageManager: 'pnpm' });
  
  // Count occurrences of patch header
  const occurrences = (secondPass.match(/## 🤖 Agent Readiness Patch/g) || []).length;
  assert.strictEqual(occurrences, 1, 'Patch header must only exist once (idempotent)');
});

test('linter rule recognises the xo linter (ESLint-based) declared in package.json', async () => {
  const files = ['package.json', 'readme.md'];
  const mockCtx: RuleContext = {
    files,
    fileExists: (path: string) => files.includes(path),
    readFile: async (path: string) => {
      if (path === 'package.json') return JSON.stringify({ scripts: { test: 'xo && node test.js' }, devDependencies: { xo: '^1.2.3' } });
      return '';
    }
  };

  const result = await runScan(mockCtx);
  const linter = result.pillars.verification.findings.find((f) => f.id === 'verification.linter_formatter');
  assert.ok(linter, 'linter finding should exist');
  assert.strictEqual(linter.pointsEarned, linter.maxPoints, 'xo should earn full linter points');
});
