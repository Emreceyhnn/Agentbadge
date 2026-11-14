import { NextRequest, NextResponse } from 'next/server';
import { runScan, createGitHubRuleContext, generateSvgBadge, calculateTier, calculateGrade } from '@agentbadge/core';

// In-memory cache for scanned repos (TTL: 10 minutes)
interface CacheEntry {
  score: number;
  tier: ReturnType<typeof calculateTier>;
  grade: ReturnType<typeof calculateGrade>;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoParam = searchParams.get('repo'); // e.g. "facebook/react" or "owner/repo"
  const scoreParam = searchParams.get('score');

  // Case 1: Manual score provided (e.g. ?score=86)
  if (scoreParam !== null) {
    const score = Math.min(100, Math.max(0, parseInt(scoreParam, 10) || 0));
    const tier = calculateTier(score);
    const grade = calculateGrade(score);
    const svg = generateSvgBadge(score, tier, grade);
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  }

  // Case 2: repo query provided (e.g. ?repo=owner/repo)
  if (repoParam) {
    const cleanRepo = repoParam.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, '');
    const parts = cleanRepo.split('/');
    if (parts.length === 2) {
      const [owner, repo] = parts;
      const cacheKey = `${owner}/${repo}`.toLowerCase();
      const cached = cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        const svg = generateSvgBadge(cached.score, cached.tier, cached.grade);
        return new NextResponse(svg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
          },
        });
      }

      try {
        const token = process.env.GITHUB_TOKEN;
        const { ctx } = await createGitHubRuleContext(owner, repo, token);
        const result = await runScan(ctx, { repoName: `${owner}/${repo}` });
        cache.set(cacheKey, {
          score: result.score,
          tier: result.tier,
          grade: result.grade,
          timestamp: Date.now(),
        });

        const svg = generateSvgBadge(result.score, result.tier, result.grade);
        return new NextResponse(svg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
          },
        });
      } catch (err) {
        // Return neutral gray "unknown" badge for errors/rate limit/private repo
        const svg = generateSvgBadge(null, 'unknown');
        return new NextResponse(svg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
          },
        });
      }
    }
  }

  // Default fallback neutral badge
  const svg = generateSvgBadge(null, 'unknown');
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
