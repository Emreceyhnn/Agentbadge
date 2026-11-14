export type PillarId = 'context' | 'setup' | 'verification' | 'guardrails' | 'tooling';

export type ReadinessTier = 'agent-hostile' | 'agent-tolerated' | 'agent-friendly' | 'agent-ready';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Finding {
  id: string;
  pillar: PillarId;
  title: string;
  description: string;
  severity: Severity;
  pointsEarned: number;
  maxPoints: number;
  remediation?: {
    summary: string;
    targetFile?: string;
    diffPatch?: string;
  };
}

export interface PillarScore {
  id: PillarId;
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  percentage: number;
  findings: Finding[];
}

export interface ScanResult {
  score: number; // 0 - 100
  tier: ReadinessTier;
  grade: 'A+' | 'A' | 'B' | 'C' | 'F';
  scannedAt: string;
  repoPath: string;
  repoName?: string;
  pillars: Record<PillarId, PillarScore>;
  summary: {
    criticalIssuesCount: number;
    recommendedActions: string[];
  };
}

export interface RuleContext {
  files: string[]; // Relative file paths in repo
  readFile: (relativePath: string) => Promise<string | null>;
  fileExists: (relativePath: string) => boolean;
}

export interface Rule {
  id: string;
  pillar: PillarId;
  name: string;
  evaluate: (ctx: RuleContext) => Promise<Finding>;
}
