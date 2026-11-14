import type { PillarId, PillarScore, ReadinessTier, ScanResult, RuleContext } from './types.js';
import { contextRules } from './rules/context.js';
import { setupRules } from './rules/setup.js';
import { verificationRules } from './rules/verification.js';
import { guardrailsRules } from './rules/guardrails.js';
import { toolingRules } from './rules/tooling.js';

export const ALL_RULES = [
  ...contextRules,
  ...setupRules,
  ...verificationRules,
  ...guardrailsRules,
  ...toolingRules
];

const PILLAR_CONFIG: Record<PillarId, { name: string; weight: number }> = {
  context: { name: 'Context & Documentation', weight: 25 },
  setup: { name: 'Setup & Environment', weight: 20 },
  verification: { name: 'Verification & Testing', weight: 20 },
  guardrails: { name: 'Guardrails & Safety', weight: 20 },
  tooling: { name: 'Tooling & Schemas', weight: 15 }
};

export function calculateGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'F' {
  if (score >= 95) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'F';
}

export function calculateTier(score: number): ReadinessTier {
  if (score >= 80) return 'agent-ready';
  if (score >= 60) return 'agent-friendly';
  if (score >= 40) return 'agent-tolerated';
  return 'agent-hostile';
}

export async function runScan(ctx: RuleContext, options?: { repoPath?: string; repoName?: string }): Promise<ScanResult> {
  const pillarScores: Record<PillarId, PillarScore> = {
    context: { id: 'context', name: PILLAR_CONFIG.context.name, weight: 25, score: 0, maxScore: 0, percentage: 0, findings: [] },
    setup: { id: 'setup', name: PILLAR_CONFIG.setup.name, weight: 20, score: 0, maxScore: 0, percentage: 0, findings: [] },
    verification: { id: 'verification', name: PILLAR_CONFIG.verification.name, weight: 20, score: 0, maxScore: 0, percentage: 0, findings: [] },
    guardrails: { id: 'guardrails', name: PILLAR_CONFIG.guardrails.name, weight: 20, score: 0, maxScore: 0, percentage: 0, findings: [] },
    tooling: { id: 'tooling', name: PILLAR_CONFIG.tooling.name, weight: 15, score: 0, maxScore: 0, percentage: 0, findings: [] }
  };

  const recommendedActions: string[] = [];
  let criticalCount = 0;

  for (const rule of ALL_RULES) {
    const finding = await rule.evaluate(ctx);
    const targetPillar = pillarScores[rule.pillar];

    targetPillar.findings.push(finding);
    targetPillar.score += finding.pointsEarned;
    targetPillar.maxScore += finding.maxPoints;

    if (finding.severity === 'critical') {
      criticalCount++;
    }

    if (finding.remediation && finding.pointsEarned < finding.maxPoints) {
      recommendedActions.push(finding.remediation.summary);
    }
  }

  let totalEarned = 0;
  let totalMax = 0;

  for (const pId of Object.keys(pillarScores) as PillarId[]) {
    const p = pillarScores[pId];
    p.percentage = p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0;
    totalEarned += p.score;
    totalMax += p.maxScore;
  }

  // Raw score is capped between 0 and 100
  const normalizedScore = totalMax > 0 ? Math.min(100, Math.max(0, Math.round((totalEarned / totalMax) * 100))) : 0;
  const grade = calculateGrade(normalizedScore);
  const tier = calculateTier(normalizedScore);

  return {
    score: normalizedScore,
    tier,
    grade,
    scannedAt: new Date().toISOString(),
    repoPath: options?.repoPath || '.',
    repoName: options?.repoName || 'local-repo',
    pillars: pillarScores,
    summary: {
      criticalIssuesCount: criticalCount,
      recommendedActions
    }
  };
}
