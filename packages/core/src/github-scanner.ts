import type { RuleContext } from './types.js';

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

// Rules evaluate these specific high-value files. We only fetch content for these to stay ultra fast.
const RELEVANT_CONTENT_PATTERNS = [
  /^readme\.md$/i,
  /^package\.json$/i,
  /^\.gitignore$/i,
  /^agents\.md$/i,
  /^claude\.md$/i
];

/**
 * Creates a RuleContext backed directly by GitHub's public REST API.
 * Optimized with timeout and selective lazy content fetching.
 */
export async function createGitHubRuleContext(
  owner: string,
  repo: string,
  token?: string,
  timeoutMs = 12000
): Promise<{ ctx: RuleContext; totalFiles: number }> {
  const headers: Record<string, string> = {
    'User-Agent': 'agentbadge-scanner',
    Accept: 'application/vnd.github.v3+json',
  };

  if (token && token.trim().length > 0) {
    headers['Authorization'] = `token ${token.trim()}`;
  }

  // 1. Fetch repo metadata with timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let defaultBranch = 'main';
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      signal: controller.signal,
    });

    if (!repoRes.ok) {
      throw new Error(`GitHub API error (${repoRes.status}): ${repoRes.statusText}`);
    }

    const repoData = (await repoRes.json()) as { default_branch?: string };
    defaultBranch = repoData.default_branch || 'main';
  } finally {
    clearTimeout(timer);
  }

  // 2. Fetch git tree recursively (capped tree)
  const treeController = new AbortController();
  const treeTimer = setTimeout(() => treeController.abort(), timeoutMs);

  let files: string[] = [];
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers, signal: treeController.signal }
    );

    if (!treeRes.ok) {
      throw new Error(`Failed to fetch tree for ${owner}/${repo}: HTTP ${treeRes.status}`);
    }

    const treeData = (await treeRes.json()) as GitHubTreeResponse;
    files = (treeData.tree || [])
      .filter((item) => item.type === 'blob')
      .map((item) => item.path);
  } finally {
    clearTimeout(treeTimer);
  }

  const fileSet = new Set(files);
  const contentCache = new Map<string, string | null>();

  const ctx: RuleContext = {
    files,
    fileExists: (relPath: string) => fileSet.has(relPath.replace(/\\/g, '/')),
    readFile: async (relPath: string) => {
      const normalized = relPath.replace(/\\/g, '/');
      if (contentCache.has(normalized)) {
        return contentCache.get(normalized) || null;
      }
      if (!fileSet.has(normalized)) {
        return null;
      }

      // Check if file is worth fetching over network
      const isRelevant = RELEVANT_CONTENT_PATTERNS.some((p) => p.test(normalized));
      if (!isRelevant) {
        return null;
      }

      try {
        const fetchController = new AbortController();
        const fetchTimer = setTimeout(() => fetchController.abort(), 4000);
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${normalized}`;
        const rawRes = await fetch(rawUrl, { headers, signal: fetchController.signal });
        clearTimeout(fetchTimer);

        if (!rawRes.ok) {
          contentCache.set(normalized, null);
          return null;
        }
        const text = await rawRes.text();
        contentCache.set(normalized, text);
        return text;
      } catch {
        contentCache.set(normalized, null);
        return null;
      }
    },
  };

  return { ctx, totalFiles: files.length };
}
