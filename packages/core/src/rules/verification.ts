import type { Rule, RuleContext, Finding } from '../types.js';

export const verificationRules: Rule[] = [
  {
    id: 'verification.tests',
    pillar: 'verification',
    name: 'Executable Test Suite',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      // 1. Look for test files across root and monorepo packages/apps
      const testFilePatterns = [
        /\.test\.[jt]sx?$/,
        /\.spec\.[jt]sx?$/,
        /__tests__\//,
        /tests?\/.*_test\.py$/,
        /tests?\/test_.*\.py$/,
        /tests?\/.*\.rs$/,
        /tests?\/.*\.go$/,
        /tests?\/.*\.rb$/
      ];

      const testFiles = ctx.files.filter((f) => testFilePatterns.some((pattern) => pattern.test(f)));
      const hasTestFiles = testFiles.length > 0;

      // 2. Look for package.json scripts that define tests (root or any subpackage)
      const packageJsonFiles = ctx.files.filter((f) => f === 'package.json' || f.endsWith('/package.json'));
      let hasTestScript = false;

      for (const pkgPath of packageJsonFiles) {
        const pkgStr = await ctx.readFile(pkgPath);
        if (pkgStr) {
          try {
            const pkg = JSON.parse(pkgStr);
            if (pkg.scripts && pkg.scripts.test && !/no test specified/i.test(pkg.scripts.test)) {
              hasTestScript = true;
              break;
            }
          } catch {
            // ignore malformed json
          }
        }
      }

      // Check python pytest/tox, cargo, go
      const hasOtherTestManifest = ctx.files.some((f) =>
        /(^|\/)(pytest\.ini|pyproject\.toml|Cargo\.toml|go\.mod)$/i.test(f)
      );

      if (hasTestScript || (hasTestFiles && hasOtherTestManifest)) {
        return {
          id: 'verification.tests',
          pillar: 'verification',
          title: `Configured test suite (${hasTestFiles ? `${testFiles.length} test files` : 'test scripts present'})`,
          description: 'A test command and test suites are present. Agents can independently verify code changes.',
          severity: 'info',
          pointsEarned: 8,
          maxPoints: 8
        };
      }

      if (hasTestFiles) {
        return {
          id: 'verification.tests',
          pillar: 'verification',
          title: 'Test files detected but missing standard test script',
          description: 'Test files exist, but there is no standardized test script (e.g. in package.json) for the agent to run.',
          severity: 'medium',
          pointsEarned: 4,
          maxPoints: 8,
          remediation: {
            summary: 'Expose a standard "test" command in package.json or Makefile.',
            targetFile: 'package.json'
          }
        };
      }

      return {
        id: 'verification.tests',
        pillar: 'verification',
        title: 'Missing automated test suite',
        description: 'No automated tests or test runner command found. An AI agent modifying this repo has no feedback loop.',
        severity: 'critical',
        pointsEarned: 0,
        maxPoints: 8,
        remediation: {
          summary: 'Set up an automated test runner (Vitest, Jest, Pytest, etc.) with a "test" script.'
        }
      };
    }
  },
  {
    id: 'verification.type_checking',
    pillar: 'verification',
    name: 'Static Type Checking (TypeScript / Mypy / Pyright / Rust / Go)',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const typeConfigPatterns = [
        /(^|\/)tsconfig(\..+)?\.json$/i,
        /(^|\/)mypy\.ini$/i,
        /(^|\/)pyproject\.toml$/i,
        /(^|\/)Cargo\.toml$/i,
        /(^|\/)go\.mod$/i
      ];

      const foundConfig = ctx.files.find((f) => typeConfigPatterns.some((pattern) => pattern.test(f)));

      const packageJsonFiles = ctx.files.filter((f) => f === 'package.json' || f.endsWith('/package.json'));
      let hasTypeCheckScript = false;

      for (const pkgPath of packageJsonFiles) {
        const pkgStr = await ctx.readFile(pkgPath);
        if (pkgStr && /"type-check"|"tsc"|"typecheck"/i.test(pkgStr)) {
          hasTypeCheckScript = true;
          break;
        }
      }

      if (foundConfig && (hasTypeCheckScript || foundConfig.endsWith('Cargo.toml') || foundConfig.endsWith('go.mod'))) {
        return {
          id: 'verification.type_checking',
          pillar: 'verification',
          title: `Strict static typing configured (${foundConfig})`,
          description: 'Static type checking is enforced with a runnable type-check task.',
          severity: 'info',
          pointsEarned: 6,
          maxPoints: 6
        };
      }

      if (foundConfig) {
        return {
          id: 'verification.type_checking',
          pillar: 'verification',
          title: `Type configuration present (${foundConfig}) but no explicit type-check script`,
          description: 'Type config exists, but adding a dedicated "type-check": "tsc --noEmit" script allows agents to run verification fast.',
          severity: 'low',
          pointsEarned: 4,
          maxPoints: 6,
          remediation: {
            summary: 'Add "type-check": "tsc --noEmit" to package.json scripts.'
          }
        };
      }

      return {
        id: 'verification.type_checking',
        pillar: 'verification',
        title: 'No static type checking detected',
        description: 'No tsconfig.json, mypy, or statically typed toolchain detected. Agents are prone to runtime type regressions.',
        severity: 'high',
        pointsEarned: 0,
        maxPoints: 6,
        remediation: {
          summary: 'Introduce TypeScript (tsconfig.json) or python type annotations (mypy) to guard data contracts.'
        }
      };
    }
  },
  {
    id: 'verification.linter_formatter',
    pillar: 'verification',
    name: 'Linter & Code Formatter (ESLint / Biome / Ruff / Prettier)',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const linterPatterns = [
        /(^|\/)\.eslintrc(\..+)?$/i,
        /(^|\/)eslint\.config\.(js|mjs|cjs|ts)$/i,
        /(^|\/)biome\.json$/i,
        /(^|\/)\.prettierrc(\..+)?$/i,
        /(^|\/)ruff\.toml$/i,
        /(^|\/)\.golangci\.ya?ml$/i
      ];

      const found = ctx.files.find((f) => linterPatterns.some((pattern) => pattern.test(f)));

      const packageJsonFiles = ctx.files.filter((f) => f === 'package.json' || f.endsWith('/package.json'));
      let hasLintScript = false;

      for (const pkgPath of packageJsonFiles) {
        const pkgStr = await ctx.readFile(pkgPath);
        if (pkgStr && /"lint"/i.test(pkgStr)) {
          hasLintScript = true;
          break;
        }
      }

      if (found || hasLintScript) {
        return {
          id: 'verification.linter_formatter',
          pillar: 'verification',
          title: `Linting & Formatting rules present (${found || 'lint script'})`,
          description: 'Agents can run linter to quickly catch syntax and style errors before pushing.',
          severity: 'info',
          pointsEarned: 6,
          maxPoints: 6
        };
      }

      return {
        id: 'verification.linter_formatter',
        pillar: 'verification',
        title: 'Missing linter or code formatting configuration',
        description: 'No ESLint, Biome, Ruff or Prettier config found. Agents cannot self-format or detect lint errors.',
        severity: 'medium',
        pointsEarned: 0,
        maxPoints: 6,
        remediation: {
          summary: 'Install ESLint / Biome / Ruff and add a "lint" command to scripts.'
        }
      };
    }
  }
];
