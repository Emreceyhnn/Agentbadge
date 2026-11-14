import type { Rule, RuleContext, Finding } from '../types.js';

export const toolingRules: Rule[] = [
  {
    id: 'tooling.automation_scripts',
    pillar: 'tooling',
    name: 'Automation Scripts Directory or Task Runners',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const hasScriptsDir = ctx.files.some((f) => /(^|\/)(scripts|bin)(\/|$)/i.test(f));
      
      let packageScriptCount = 0;
      const pkgFiles = ctx.files.filter((f) => f === 'package.json' || f.endsWith('/package.json'));

      for (const pf of pkgFiles) {
        const pkgStr = await ctx.readFile(pf);
        if (pkgStr) {
          try {
            const pkg = JSON.parse(pkgStr);
            if (pkg.scripts) {
              packageScriptCount += Object.keys(pkg.scripts).length;
            }
          } catch {
            // ignore
          }
        }
      }

      if (hasScriptsDir || packageScriptCount >= 4) {
        return {
          id: 'tooling.automation_scripts',
          pillar: 'tooling',
          title: 'Rich automation scripts available',
          description: `Discovered structured utility scripts (${hasScriptsDir ? 'scripts/ dir' : `${packageScriptCount} package scripts across workspace`}) that agents can invoke directly.`,
          severity: 'info',
          pointsEarned: 6,
          maxPoints: 6
        };
      }

      if (packageScriptCount > 0) {
        return {
          id: 'tooling.automation_scripts',
          pillar: 'tooling',
          title: 'Basic script runners present',
          description: 'A few scripts exist, but creating dedicated workflow scripts in scripts/ will streamline repetitive agent tasks.',
          severity: 'low',
          pointsEarned: 3,
          maxPoints: 6
        };
      }

      return {
        id: 'tooling.automation_scripts',
        pillar: 'tooling',
        title: 'Sparse or missing automation tooling',
        description: 'No scripts/ directory or package scripts found. Agents will have to manually reconstruct commands.',
        severity: 'medium',
        pointsEarned: 0,
        maxPoints: 6,
        remediation: {
          summary: 'Group common database seeds, migrations, and release tasks under scripts/ or package scripts.'
        }
      };
    }
  },
  {
    id: 'tooling.mcp_manifests',
    pillar: 'tooling',
    name: 'Model Context Protocol (MCP) or Tool Manifests',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const mcpPatterns = [
        /(^|\/)mcp\.json$/i,
        /(^|\/)\.cursor\/mcp\.json$/i,
        /(^|\/)\.claude\/mcp\.json$/i,
        /(^|\/)tools\.json$/i
      ];

      const found = ctx.files.find((f) => mcpPatterns.some((pattern) => pattern.test(f)));

      if (found) {
        return {
          id: 'tooling.mcp_manifests',
          pillar: 'tooling',
          title: `MCP tool configuration detected (${found})`,
          description: 'Project provides explicit Model Context Protocol tool configurations for AI IDEs and agents.',
          severity: 'info',
          pointsEarned: 5,
          maxPoints: 5
        };
      }

      return {
        id: 'tooling.mcp_manifests',
        pillar: 'tooling',
        title: 'No MCP (Model Context Protocol) integration',
        description: 'No mcp.json or agent tool configurations found. AI agents rely purely on standard CLI rather than native tools.',
        severity: 'low',
        pointsEarned: 0,
        maxPoints: 5,
        remediation: {
          summary: 'Add an mcp.json or .cursor/mcp.json if your project exposes database or API tools to agents.'
        }
      };
    }
  },
  {
    id: 'tooling.api_schemas',
    pillar: 'tooling',
    name: 'Machine-Readable Schemas (OpenAPI, GraphQL, Protobuf, Zod/Prisma)',
    evaluate: async (ctx: RuleContext): Promise<Finding> => {
      const schemaPatterns = [
        /openapi\.(ya?ml|json)$/i,
        /swagger\.(ya?ml|json)$/i,
        /\.graphqls?$/i,
        /schema\.graphql$/i,
        /schema\.prisma$/i,
        /\.proto$/i
      ];

      const hasSchema = ctx.files.some((f) => schemaPatterns.some((pattern) => pattern.test(f)));

      if (hasSchema) {
        return {
          id: 'tooling.api_schemas',
          pillar: 'tooling',
          title: 'Machine-readable schemas found',
          description: 'OpenAPI, Prisma, GraphQL, or Protobuf definitions enable agents to understand domain data models unambiguously.',
          severity: 'info',
          pointsEarned: 4,
          maxPoints: 4
        };
      }

      return {
        id: 'tooling.api_schemas',
        pillar: 'tooling',
        title: 'No declarative schema manifests detected',
        description: 'No OpenAPI, GraphQL, or Prisma schema found. Agents must inspect procedural code to deduce API/DB structures.',
        severity: 'low',
        pointsEarned: 0,
        maxPoints: 4,
        remediation: {
          summary: 'Export API contracts as OpenAPI/Swagger specs or Prisma schemas to make models machine-readable.'
        }
      };
    }
  }
];
