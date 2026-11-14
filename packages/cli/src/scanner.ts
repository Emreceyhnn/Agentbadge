import fs from 'node:fs/promises';
import path from 'node:path';
import type { RuleContext } from '@agentbadge/core';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.venv',
  'venv',
  'target'
]);

/**
 * Traverses a repository directory and builds a fast in-memory file index
 */
export async function createLocalRuleContext(targetDir: string): Promise<{ ctx: RuleContext; totalFiles: number }> {
  const relativeFiles: string[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          await walk(path.join(currentDir, entry.name));
        }
      } else if (entry.isFile()) {
        const fullPath = path.join(currentDir, entry.name);
        const rel = path.relative(targetDir, fullPath).replace(/\\/g, '/');
        relativeFiles.push(rel);
      }
    }
  }

  await walk(targetDir);

  const fileSet = new Set(relativeFiles);

  const ctx: RuleContext = {
    files: relativeFiles,
    fileExists: (relPath: string) => fileSet.has(relPath.replace(/\\/g, '/')),
    readFile: async (relPath: string) => {
      try {
        const full = path.join(targetDir, relPath);
        return await fs.readFile(full, 'utf-8');
      } catch {
        return null;
      }
    }
  };

  return { ctx, totalFiles: relativeFiles.length };
}
