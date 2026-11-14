import type { Rule, RuleContext, Finding } from '../types.js';

export const contextRules: Rule[] = [
  {
    id: 'context.agent_guidelines',
    pillar: 'context',
    name: 'Agent Guidelines File (AGENTS.md / CLAUDE.md / .cursorrules)',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const candidates = [
        'AGENTS.md',
        'CLAUDE.md',
        '.cursorrules',
        '.cursor/rules',
        '.github/copilot-instructions.md'
      ];

      const found = candidates.find((c) => ctx.fileExists(c) || ctx.files.some((f) => f.endsWith(`/${c}`)));

      if (found) {
        return {
          id: 'context.agent_guidelines',
          pillar: 'context',
          title: `Agent instructions found (${found})`,
          description: `AI agents can immediately read behavioral and operational rules from ${found}.`,
          severity: 'info',
          pointsEarned: 10,
          maxPoints: 10
        };
      }

      return {
        id: 'context.agent_guidelines',
        pillar: 'context',
        title: 'Missing agent instructions file',
        description: 'No AGENTS.md, CLAUDE.md, or .cursorrules file found. Agents will guess conventions, commands, and boundaries.',
        severity: 'critical',
        pointsEarned: 0,
        maxPoints: 10,
        remediation: {
          summary: 'Add an AGENTS.md in the root directory defining project overview, build, test, and style conventions.',
          targetFile: 'AGENTS.md'
        }
      };
    }
  },
  {
    id: 'context.readme_architecture',
    pillar: 'context',
    name: 'README Clarity & Architecture Overview',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const readmePath = ctx.files.find((f) => /^readme\.md$/i.test(f) || /readme\.md$/i.test(f));

      if (!readmePath) {
        return {
          id: 'context.readme_architecture',
          pillar: 'context',
          title: 'Missing README.md',
          description: 'No README.md exists. Agents cannot get a quick project orientation.',
          severity: 'critical',
          pointsEarned: 0,
          maxPoints: 8,
          remediation: {
            summary: 'Create a README.md with project title, quickstart instructions, and architecture breakdown.',
            targetFile: 'README.md'
          }
        };
      }

      const content = (await ctx.readFile(readmePath)) || '';
      let score = 4; // Base score for having README

      const hasArchOrOverview = /architecture|overview|structure|flow|design|components/i.test(content);
      const hasCommands = /npm|pnpm|yarn|cargo|python|docker|git|pytest|go\s+run/i.test(content);

      if (hasArchOrOverview) score += 2;
      if (hasCommands) score += 2;

      return {
        id: 'context.readme_architecture',
        pillar: 'context',
        title: score === 8 ? 'Comprehensive README.md' : 'Basic README found',
        description:
          score === 8
            ? 'README contains architecture, commands, and project context.'
            : 'README exists but lacks detailed architecture or command references.',
        severity: score === 8 ? 'info' : 'medium',
        pointsEarned: score,
        maxPoints: 8,
        remediation:
          score < 8
            ? {
                summary: 'Expand README.md to include an architecture summary and essential workflow commands.',
                targetFile: 'README.md'
              }
            : undefined
      };
    }
  },
  {
    id: 'context.decision_records',
    pillar: 'context',
    name: 'Architecture Decision Records (ADRs) or Docs Directory',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      // Supports root docs/ as well as monorepo packages/app docs/
      const hasDocs = ctx.files.some((f) => /(^|\/)(docs|doc|adr|architecture)(\/|$)/i.test(f));

      if (hasDocs) {
        return {
          id: 'context.decision_records',
          pillar: 'context',
          title: 'Documentation / ADR directory present',
          description: 'Project maintains dedicated docs/ or architectural records.',
          severity: 'info',
          pointsEarned: 4,
          maxPoints: 4
        };
      }

      return {
        id: 'context.decision_records',
        pillar: 'context',
        title: 'No docs or ADR directory',
        description: 'Decisions and complex architecture rationale are not indexed in a docs/ folder.',
        severity: 'low',
        pointsEarned: 0,
        maxPoints: 4,
        remediation: {
          summary: 'Create a docs/ folder to record key architectural decisions and module maps.',
          targetFile: 'docs/ARCHITECTURE.md'
        }
      };
    }
  },
  {
    id: 'context.contributing_guidelines',
    pillar: 'context',
    name: 'Contributing Guidelines & Code of Conduct',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const hasContributing = ctx.files.some((f) => /(^|\/)(contributing\.md|code_of_conduct\.md)$/i.test(f));

      if (hasContributing) {
        return {
          id: 'context.contributing_guidelines',
          pillar: 'context',
          title: 'CONTRIBUTING.md present',
          description: 'Clear rules for PRs, branch conventions, and contribution workflows.',
          severity: 'info',
          pointsEarned: 3,
          maxPoints: 3
        };
      }

      return {
        id: 'context.contributing_guidelines',
        pillar: 'context',
        title: 'Missing CONTRIBUTING.md',
        description: 'No explicit contribution rules or workflow definitions found.',
        severity: 'low',
        pointsEarned: 0,
        maxPoints: 3,
        remediation: {
          summary: 'Add a CONTRIBUTING.md to outline branch naming, PR conventions, and code review criteria.',
          targetFile: 'CONTRIBUTING.md'
        }
      };
    }
  }
];
