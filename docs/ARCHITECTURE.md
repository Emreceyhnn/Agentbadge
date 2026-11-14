# Architecture & System Design

agentbadge is structured as a monorepo consisting of:

- `packages/core`: Deterministic scanning engine and 5-pillar rule evaluator.
- `packages/cli`: Terminal interface (`agentbadge scan`).
- `apps/web`: Web dashboard, live dynamic SVG badge endpoint (`/api/badge`), and repository scan API (`/api/scan`).
