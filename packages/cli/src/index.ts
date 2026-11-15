#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'node:path';
import fs from 'node:fs/promises';
import { runScan, generateSvgBadge, generateRemediationAgentsMd, type ScanResult } from 'agentbadge-core';
import { createLocalRuleContext } from './scanner.js';

const program = new Command();

program
  .name('agentbadge')
  .description('Lighthouse for AI coding agents - score repository agent-readiness from 0 to 100')
  .version('0.1.0');

program
  .command('scan')
  .description('Audit a repository and evaluate agent readiness')
  .argument('[directory]', 'Target directory to scan', '.')
  .option('--json', 'Output results as JSON')
  .option('--badge [file]', 'Generate SVG badge to specified file (default: agentbadge.svg)')
  .option('--fix', 'Safely update or generate AGENTS.md with missing guidelines diff')
  .action(async (directory: string, options: { json?: boolean; badge?: string | boolean; fix?: boolean }) => {
    const targetDir = path.resolve(process.cwd(), directory);
    const repoName = path.basename(targetDir);

    let spinner: ReturnType<typeof ora> | null = null;
    if (!options.json) {
      console.log(chalk.bold.hex('#6366f1')('\n🛡️  agentbadge') + chalk.gray(' — Repository Readiness Scanner\n'));
      spinner = ora(`Scanning files in ${chalk.cyan(targetDir)}...`).start();
    }

    try {
      const { ctx, totalFiles } = await createLocalRuleContext(targetDir);
      
      if (spinner) {
        spinner.text = `Evaluating agent readiness rules across ${totalFiles} indexed files...`;
      }

      const scanResult: ScanResult = await runScan(ctx, { repoPath: targetDir, repoName });

      if (spinner) {
        spinner.stop();
      }

      if (options.json) {
        console.log(JSON.stringify(scanResult, null, 2));
        return;
      }

      // Display formatted CLI summary
      renderTerminalReport(scanResult);

      // Handle --badge option
      if (options.badge !== undefined) {
        const badgeFileName = typeof options.badge === 'string' ? options.badge : 'agentbadge.svg';
        const badgeSvg = generateSvgBadge(scanResult.score, scanResult.tier, scanResult.grade);
        const badgePath = path.join(targetDir, badgeFileName);
        await fs.writeFile(badgePath, badgeSvg, 'utf-8');
        console.log(chalk.green(`\n✔ SVG Badge saved to: ${chalk.bold(badgeFileName)}`));
      }

      // Handle --fix option (Non-destructive safe patch)
      if (options.fix) {
        const agentsMdPath = path.join(targetDir, 'AGENTS.md');
        let existingContent: string | undefined = undefined;
        try {
          existingContent = await fs.readFile(agentsMdPath, 'utf-8');
        } catch {
          // File does not exist, brand new
        }

        // Detect package manager
        const hasPnpm = ctx.fileExists('pnpm-lock.yaml') || ctx.fileExists('pnpm-workspace.yaml');
        const hasYarn = ctx.fileExists('yarn.lock');
        const hasBun = ctx.fileExists('bun.lockb');
        const pm = hasPnpm ? 'pnpm' : hasYarn ? 'yarn' : hasBun ? 'bun' : 'npm';

        const remediationMd = generateRemediationAgentsMd(scanResult, {
          existingContent,
          packageManager: pm,
        });

        await fs.writeFile(agentsMdPath, remediationMd, 'utf-8');
        if (existingContent) {
          console.log(chalk.green(`✔ Safely patched missing instructions into existing ${chalk.bold('AGENTS.md')}!`));
        } else {
          console.log(chalk.green(`✔ Generated tailored ${chalk.bold('AGENTS.md')} in repository root!`));
        }
      }

    } catch (err) {
      if (spinner) spinner.fail('Scan failed');
      console.error(chalk.red('\nScan encountered an error:'), err);
      process.exit(1);
    }
  });

function renderTerminalReport(result: ScanResult) {
  const tierColor =
    result.tier === 'agent-ready'
      ? chalk.bold.green
      : result.tier === 'agent-friendly'
      ? chalk.bold.blue
      : result.tier === 'agent-tolerated'
      ? chalk.bold.yellow
      : chalk.bold.red;

  console.log(`\n${chalk.bold('Repository:')} ${chalk.white(result.repoName)}`);
  console.log(`${chalk.bold('Overall Score:')} ${tierColor(`${result.score}/100`)} (${chalk.bold(result.grade)}) · ${tierColor(result.tier)}\n`);

  console.log(chalk.bold('Pillar Breakdown:'));
  console.log('─'.repeat(60));

  for (const pillarKey of Object.keys(result.pillars) as Array<keyof typeof result.pillars>) {
    const p = result.pillars[pillarKey];
    const barLength = 20;
    const filled = Math.round((p.percentage / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    
    console.log(
      `${p.name.padEnd(28)} ${chalk.cyan(bar)} ${p.percentage.toString().padStart(3)}% (${p.score}/${p.maxScore} pts)`
    );
  }

  console.log('─'.repeat(60));

  if (result.summary.recommendedActions.length > 0) {
    console.log(chalk.bold.yellow('\nTop Recommended Fixes:'));
    result.summary.recommendedActions.slice(0, 4).forEach((action, i) => {
      console.log(`  ${chalk.cyan(`${i + 1}.`)} ${action}`);
    });
    console.log(chalk.gray('\nRun with --fix to safely patch or generate AGENTS.md.'));
    console.log(chalk.gray('Run with --badge to export the live README badge.\n'));
  } else {
    console.log(chalk.green('\n🎉 Outstanding! Repository is fully prepared for AI coding agents.\n'));
  }
}

program.parse();
