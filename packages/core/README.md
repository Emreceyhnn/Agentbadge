# agentbadge-core

The deterministic scanning engine and rule evaluator behind [`agentbadge`](https://www.npmjs.com/package/agentbadge). It scores a repository's agent-readiness on a 0–100 scale across 5 pillars.

This package is the library layer. For the command-line tool, install `agentbadge` instead:

```bash
npx agentbadge scan .
```

## Architecture

Rules are grouped by pillar in `src/rules/` (context, setup, verification, guardrails, tooling). Each rule receives a `RuleContext` (file list and file reader) and returns a `Finding` with points earned and an optional remediation. `runScan` aggregates the findings into the 0–100 score, tier and grade; `generateSvgBadge` renders the badge.

## License

MIT © Emre Ceyhan
