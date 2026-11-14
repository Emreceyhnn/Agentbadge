import type { ReadinessTier } from './types.js';

export function getTierColor(tier: ReadinessTier | 'unknown'): { bg: string; text: string; label: string } {
  switch (tier) {
    case 'agent-ready':
      return { bg: '#22c55e', text: '#ffffff', label: 'agent-ready' };
    case 'agent-friendly':
      return { bg: '#3b82f6', text: '#ffffff', label: 'agent-friendly' };
    case 'agent-tolerated':
      return { bg: '#eab308', text: '#000000', label: 'agent-tolerated' };
    case 'agent-hostile':
      return { bg: '#ef4444', text: '#ffffff', label: 'agent-hostile' };
    case 'unknown':
    default:
      return { bg: '#6b7280', text: '#ffffff', label: 'unknown' };
  }
}

/**
 * Generates an SVG badge for README integration
 */
export function generateSvgBadge(
  score: number | null,
  tier: ReadinessTier | 'unknown',
  grade?: string
): string {
  const { bg, text, label } = getTierColor(tier);
  const gradeStr = grade && tier !== 'unknown' ? ` (${grade})` : '';
  const rightText = tier === 'unknown' || score === null ? 'unknown' : `${score}/100 · ${label}${gradeStr}`;

  // Approximate SVG widths
  const leftWidth = 84;
  const rightWidth = Math.max(80, rightText.length * 7 + 16);
  const totalWidth = leftWidth + rightWidth;
  const height = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="agentbadge: ${rightText}">
  <title>agentbadge: ${rightText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="${height}" fill="#1e293b"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${bg}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${(leftWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(leftWidth - 14) * 10}">agentbadge</text>
    <text x="${(leftWidth / 2) * 10}" y="140" fill="#fff" transform="scale(.1)" textLength="${(leftWidth - 14) * 10}">agentbadge</text>
    <text aria-hidden="true" x="${(leftWidth + rightWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(rightWidth - 14) * 10}">${rightText}</text>
    <text x="${(leftWidth + rightWidth / 2) * 10}" y="140" fill="${text}" transform="scale(.1)" textLength="${(rightWidth - 14) * 10}">${rightText}</text>
  </g>
</svg>`;
}
