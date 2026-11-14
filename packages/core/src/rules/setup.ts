import type { Rule, RuleContext, Finding } from '../types.js';

export const setupRules: Rule[] = [
  {
    id: 'setup.lockfile',
    pillar: 'setup',
    name: 'Deterministic Package Lockfile',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const lockfilePatterns = [
        /(^|\/)pnpm-lock\.ya?ml$/i,
        /(^|\/)package-lock\.json$/i,
        /(^|\/)yarn\.lock$/i,
        /(^|\/)bun\.lockb?$/i,
        /(^|\/)poetry\.lock$/i,
        /(^|\/)Pipfile\.lock$/i,
        /(^|\/)Cargo\.lock$/i,
        /(^|\/)go\.sum$/i,
        /(^|\/)Gemfile\.lock$/i,
        /(^|\/)composer\.lock$/i
      ];

      const found = ctx.files.find((f) => lockfilePatterns.some((pattern) => pattern.test(f)));

      if (found) {
        return {
          id: 'setup.lockfile',
          pillar: 'setup',
          title: `Lockfile present (${found})`,
          description: 'Dependencies are locked deterministically. Agents will not face dependency drift.',
          severity: 'info',
          pointsEarned: 6,
          maxPoints: 6
        };
      }

      return {
        id: 'setup.lockfile',
        pillar: 'setup',
        title: 'Missing lockfile',
        description: 'No lockfile found. Agents installing dependencies may receive breaking peer updates.',
        severity: 'high',
        pointsEarned: 0,
        maxPoints: 6,
        remediation: {
          summary: 'Commit your package manager lockfile (e.g. package-lock.json or pnpm-lock.yaml) to version control.'
        }
      };
    }
  },
  {
    id: 'setup.env_template',
    pillar: 'setup',
    name: 'Environment Variable Template (.env.example)',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const envPatterns = [
        /(^|\/)\.env\.example$/i,
        /(^|\/)\.env\.template$/i,
        /(^|\/)\.env\.sample$/i,
        /(^|\/)example\.env$/i
      ];

      const found = ctx.files.find((f) => envPatterns.some((pattern) => pattern.test(f)));

      if (found) {
        return {
          id: 'setup.env_template',
          pillar: 'setup',
          title: `Environment template found (${found})`,
          description: 'Agents can infer required secret keys and configuration without guessing.',
          severity: 'info',
          pointsEarned: 5,
          maxPoints: 5
        };
      }

      // Check if project contains environment variable references (.env or process.env)
      const hasEnvUsage = ctx.files.some((f) => f.includes('.env'));

      return {
        id: 'setup.env_template',
        pillar: 'setup',
        title: 'Missing .env.example',
        description: 'No .env.example found. Agents cannot know what environment variables or credentials are required to boot the app.',
        severity: hasEnvUsage ? 'high' : 'medium',
        pointsEarned: 0,
        maxPoints: 5,
        remediation: {
          summary: 'Create .env.example with mock or placeholder values for all runtime environment variables.',
          targetFile: '.env.example'
        }
      };
    }
  },
  {
    id: 'setup.container_or_devcontainer',
    pillar: 'setup',
    name: 'Container or Devcontainer Specification',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const containerPatterns = [
        /(^|\/)Dockerfile(\..+)?$/i,
        /(^|\/)docker-compose(\..+)?\.ya?ml$/i,
        /(^|\/)compose(\..+)?\.ya?ml$/i,
        /(^|\/)\.devcontainer\/devcontainer\.json$/i,
        /(^|\/)\.devcontainer\.json$/i
      ];

      const found = ctx.files.find((f) => containerPatterns.some((pattern) => pattern.test(f)));

      if (found) {
        return {
          id: 'setup.container_or_devcontainer',
          pillar: 'setup',
          title: `Container/Devcontainer environment found (${found})`,
          description: 'Environment can be containerized or spun up in sandboxes effortlessly.',
          severity: 'info',
          pointsEarned: 5,
          maxPoints: 5
        };
      }

      return {
        id: 'setup.container_or_devcontainer',
        pillar: 'setup',
        title: 'No container or devcontainer configuration',
        description: 'Host-level system dependencies (databases, OS packages) are not codified in Docker or Devcontainer.',
        severity: 'medium',
        pointsEarned: 0,
        maxPoints: 5,
        remediation: {
          summary: 'Add a Dockerfile, docker-compose.yml, or .devcontainer/devcontainer.json for automated sandbox reproduction.',
          targetFile: '.devcontainer/devcontainer.json'
        }
      };
    }
  },
  {
    id: 'setup.bootstrap_command',
    pillar: 'setup',
    name: 'Single Command Bootstrap (Makefile / Taskfile / setup script)',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const bootstrapPatterns = [
        /(^|\/)Makefile$/i,
        /(^|\/)Taskfile(\..+)?\.ya?ml$/i,
        /(^|\/)justfile$/i,
        /(^|\/)pnpm-workspace\.ya?ml$/i,
        /(^|\/)lerna\.json$/i
      ];

      const found = ctx.files.find((f) => bootstrapPatterns.some((pattern) => pattern.test(f)));

      if (found) {
        return {
          id: 'setup.bootstrap_command',
          pillar: 'setup',
          title: `Bootstrap task runner/workspace found (${found})`,
          description: 'Project uses a standard task runner or monorepo workspace for automated bootstrapping.',
          severity: 'info',
          pointsEarned: 4,
          maxPoints: 4
        };
      }

      // Check root package.json scripts for setup or bootstrap
      if (ctx.fileExists('package.json')) {
        const pkgStr = await ctx.readFile('package.json');
        if (pkgStr && /"setup"|"bootstrap"|"prepare"|"build"/i.test(pkgStr)) {
          return {
            id: 'setup.bootstrap_command',
            pillar: 'setup',
            title: 'Bootstrap or build script defined in package.json',
            description: 'Found bootstrap/build script in root package.json.',
            severity: 'info',
            pointsEarned: 4,
            maxPoints: 4
          };
        }
      }

      return {
        id: 'setup.bootstrap_command',
        pillar: 'setup',
        title: 'No single-command bootstrap configured',
        description: 'No Makefile or package setup script found. Agents must figure out multi-step onboarding manually.',
        severity: 'medium',
        pointsEarned: 0,
        maxPoints: 4,
        remediation: {
          summary: 'Add a "setup" script to package.json or a Makefile that runs installs, builds, and migrations in one command.'
        }
      };
    }
  }
];
