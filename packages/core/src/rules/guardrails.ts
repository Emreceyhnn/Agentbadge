import type { Rule, RuleContext, Finding } from '../types.js';

export const guardrailsRules: Rule[] = [
  {
    id: 'guardrails.ci_workflow',
    pillar: 'guardrails',
    name: 'Automated CI/CD Workflow (GitHub Actions / GitLab CI)',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const ciFiles = ctx.files.filter(
        (f) =>
          f.startsWith('.github/workflows/') ||
          f.includes('/.github/workflows/') ||
          f === '.gitlab-ci.yml' ||
          f === 'bitbucket-pipelines.yml' ||
          f === '.circleci/config.yml' ||
          f === 'Jenkinsfile'
      );

      if (ciFiles.length > 0) {
        return {
          id: 'guardrails.ci_workflow',
          pillar: 'guardrails',
          title: `Continuous Integration workflow active (${ciFiles.length} workflows)`,
          description: 'Every pull request or commit will be automatically validated by CI.',
          severity: 'info',
          pointsEarned: 10,
          maxPoints: 10
        };
      }

      return {
        id: 'guardrails.ci_workflow',
        pillar: 'guardrails',
        title: 'Missing CI/CD pipeline',
        description: 'No GitHub Actions (.github/workflows) or CI configs found. Unchecked agent changes can be merged directly.',
        severity: 'critical',
        pointsEarned: 0,
        maxPoints: 10,
        remediation: {
          summary: 'Add a GitHub Actions workflow (.github/workflows/ci.yml) to test, build, and lint on every pull request.',
          targetFile: '.github/workflows/ci.yml'
        }
      };
    }
  },
  {
    id: 'guardrails.pre_commit_hooks',
    pillar: 'guardrails',
    name: 'Git Hooks & Pre-commit Enforcers (Husky / Lefthook / Pre-commit)',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const hookPatterns = [
        /(^|\/)\.husky(\/|$)/i,
        /(^|\/)lefthook\.ya?ml$/i,
        /(^|\/)\.pre-commit-config\.ya?ml$/i,
        /(^|\/)\.lintstagedrc(\..+)?$/i
      ];

      const found = ctx.files.find((f) => hookPatterns.some((pattern) => pattern.test(f)));

      if (found) {
        return {
          id: 'guardrails.pre_commit_hooks',
          pillar: 'guardrails',
          title: `Git hook safeguards configured (${found})`,
          description: 'Prevents broken or unformatted code from ever leaving the local workspace.',
          severity: 'info',
          pointsEarned: 5,
          maxPoints: 5
        };
      }

      return {
        id: 'guardrails.pre_commit_hooks',
        pillar: 'guardrails',
        title: 'No pre-commit git hooks',
        description: 'No Husky or Lefthook configured. Agents might commit failing or unformatted code.',
        severity: 'low',
        pointsEarned: 0,
        maxPoints: 5,
        remediation: {
          summary: 'Configure Husky or Lefthook to run lint and type-check on pre-commit.'
        }
      };
    }
  },
  {
    id: 'guardrails.secret_protection',
    pillar: 'guardrails',
    name: 'Secret Leakage Prevention & .gitignore Hygiene',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const gitignoreFiles = ctx.files.filter((f) => /(^|\/)\.gitignore$/i.test(f));

      if (gitignoreFiles.length === 0) {
        return {
          id: 'guardrails.secret_protection',
          pillar: 'guardrails',
          title: 'Missing .gitignore',
          description: 'No .gitignore found! Risk of agents committing secrets (.env), node_modules, or build artifacts.',
          severity: 'critical',
          pointsEarned: 0,
          maxPoints: 5,
          remediation: {
            summary: 'Create a .gitignore file ignoring node_modules, .env, build output, and OS files.',
            targetFile: '.gitignore'
          }
        };
      }

      let ignoresEnv = false;
      let ignoresDeps = false;

      for (const gi of gitignoreFiles) {
        const content = (await ctx.readFile(gi)) || '';
        if (/\.env/i.test(content)) ignoresEnv = true;
        if (/node_modules|venv|\.venv|target|dist|\.next/i.test(content)) ignoresDeps = true;
      }

      if (ignoresEnv && ignoresDeps) {
        return {
          id: 'guardrails.secret_protection',
          pillar: 'guardrails',
          title: 'Clean .gitignore with secret protection',
          description: '.gitignore protects environment files and package dependencies from being committed.',
          severity: 'info',
          pointsEarned: 5,
          maxPoints: 5
        };
      }

      return {
        id: 'guardrails.secret_protection',
        pillar: 'guardrails',
        title: '.gitignore exists but missing .env or dependency rules',
        description: '.gitignore does not explicitly mention .env or build directories.',
        severity: 'high',
        pointsEarned: 2,
        maxPoints: 5,
        remediation: {
          summary: 'Ensure .env, .env.local, and build artifacts are explicitly listed in .gitignore.',
          targetFile: '.gitignore'
        }
      };
    }
  }
];
