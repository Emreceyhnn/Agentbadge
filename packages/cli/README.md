# agentbadge

Lighthouse for AI coding agents. `agentbadge` statically audits a repository across 5 pillars (context & docs, setup, verification, guardrails, tooling & schemas), produces a deterministic 0–100 agent-readiness score, and can generate a README badge and a remediation `AGENTS.md`.

## Usage

```bash
npx agentbadge scan .              # score the current repo
npx agentbadge scan . --badge      # export an SVG badge
npx agentbadge scan . --fix        # generate/patch AGENTS.md
npx agentbadge scan . --json       # machine-readable output
```

## Links

- Source: https://github.com/Emreceyhnn/Agentbadge
- Live demo: https://agentbadge.emreceyhan.xyz
- Scoring engine: [`agentbadge-core`](https://www.npmjs.com/package/agentbadge-core)

## License

MIT © Emre Ceyhan
