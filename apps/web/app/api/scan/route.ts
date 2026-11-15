import { NextRequest, NextResponse } from 'next/server';
import { runScan, createGitHubRuleContext } from 'agentbadge-core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repoInput = (body.repo || '').trim();

    if (!repoInput) {
      return NextResponse.json({ error: 'Repository name or URL is required.' }, { status: 400 });
    }

    const clean = repoInput.replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, '');
    const parts = clean.split('/');

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return NextResponse.json(
        { error: 'Invalid repository format. Please provide "owner/repo" or "github.com/owner/repo".' },
        { status: 400 }
      );
    }

    const [owner, repo] = parts;

    const { ctx, totalFiles } = await createGitHubRuleContext(
      owner,
      repo,
      process.env.GITHUB_TOKEN
    );

    const result = await runScan(ctx, { repoName: `${owner}/${repo}` });

    return NextResponse.json({
      success: true,
      repo: `${owner}/${repo}`,
      totalFiles,
      result,
    });
  } catch (error: any) {
    const message = error?.message || 'An error occurred during repository scan.';
    const isRateLimit = message.includes('403') || message.includes('rate limit');
    const isNotFound = message.includes('404');

    return NextResponse.json(
      {
        error: isRateLimit
          ? 'GitHub API rate limit exceeded. Please try again later or supply a token.'
          : isNotFound
          ? 'Repository not found or is private.'
          : message,
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
