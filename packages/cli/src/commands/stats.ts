import { readFileSync } from 'fs';
import {
  encode,
  selectMode,
  getModeRecommendation,
  generateQueryHints,
  formatQueryHints,
  generateSummaryStats,
  shouldUseRLE,
  shouldUseDictionary,
  shouldUseDelta,
  shouldUseBitPacking,
  shouldUseVarint,
} from '@axon-format/core';
import chalk from 'chalk';
import ora from 'ora';

interface StatsOptions {
  showModes?: boolean;
  showCompression?: boolean;
  showHints?: boolean;
}

export async function statsCommand(input: string, options: StatsOptions): Promise<void> {
  const spinner = ora('Reading JSON file...').start();

  try {
    // Read and parse
    const jsonContent = readFileSync(input, 'utf-8');
    const data = JSON.parse(jsonContent);

    spinner.text = 'Analyzing data...';

    // Get mode recommendation
    const recommendation = getModeRecommendation(data);

    spinner.succeed('Analysis complete!');

    // Basic stats
    console.log(chalk.cyan('\n📊 Data Analysis\n'));

    console.log(chalk.white('Basic Info:'));
    if (Array.isArray(data)) {
      console.log(`  Type: Array`);
      console.log(`  Length: ${data.length} rows`);
      if (data.length > 0 && typeof data[0] === 'object') {
        console.log(`  Fields: ${Object.keys(data[0]!).length}`);
        console.log(`  Field names: ${Object.keys(data[0]!).join(', ')}`);
      }
    } else if (typeof data === 'object' && data !== null) {
      console.log(`  Type: Object`);
      console.log(`  Fields: ${Object.keys(data).length}`);
    }

    // Mode recommendation
    console.log(chalk.cyan('\n🎯 Recommended Mode:\n'));
    console.log(chalk.green(`  ${recommendation.mode.toUpperCase()}`));
    console.log(chalk.dim(`  ${recommendation.reason}`));

    console.log(chalk.white('\n  Characteristics:'));
    console.log(`    • Is Array: ${recommendation.characteristics.isArray}`);
    if (recommendation.characteristics.isArray) {
      console.log(`    • Length: ${recommendation.characteristics.length}`);
      console.log(`    • Uniform: ${recommendation.characteristics.isUniform}`);
      console.log(`    • Numeric Heavy: ${recommendation.characteristics.isNumericHeavy}`);
      console.log(`    • Has Time Field: ${recommendation.characteristics.hasTimeField}`);
      console.log(`    • Sparsity: ${(recommendation.characteristics.sparsityRatio * 100).toFixed(1)}%`);
    }

    // Token savings
    const axonContent = encode(data, { mode: recommendation.mode as any });
    const jsonSize = jsonContent.length;
    const axonSize = axonContent.length;
    const savings = ((jsonSize - axonSize) / jsonSize * 100).toFixed(1);

    console.log(chalk.cyan('\n💰 Token Savings (estimated):\n'));
    console.log(`  JSON:   ~${Math.ceil(jsonSize / 4)} tokens (${jsonSize} chars)`);
    console.log(chalk.green(`  AXON:   ~${Math.ceil(axonSize / 4)} tokens (${axonSize} chars)`));
    console.log(chalk.green(`  Savings: ${savings}%`));

    // Query hints
    if (options.showHints && Array.isArray(data) && data.length > 0) {
      const hints = generateQueryHints(data);
      if (hints.length > 0) {
        console.log(chalk.cyan('\n🎯 Query Hints (for LLM optimization):\n'));
        console.log(chalk.yellow('  ' + formatQueryHints(hints)));

        console.log(chalk.dim('\n  Detected:'));
        hints.forEach((hint) => {
          console.log(chalk.dim(`    • ${hint.type}: ${hint.fields.join(', ')}`));
        });
      }
    }

    // Compression opportunities
    if (options.showCompression && Array.isArray(data) && data.length > 0) {
      console.log(chalk.cyan('\n🗜️  Compression Opportunities:\n'));

      const fields = Object.keys(data[0]!);
      const compressionOps: string[] = [];

      for (const field of fields) {
        const values = data.map((item) => item[field]);

        if (shouldUseRLE(values)) {
          compressionOps.push(`  • ${field}: RLE (run-length encoding)`);
        }
        if (shouldUseDictionary(values)) {
          compressionOps.push(`  • ${field}: Dictionary (limited unique values)`);
        }
        if (values.every((v) => typeof v === 'number') && shouldUseDelta(values)) {
          compressionOps.push(`  • ${field}: Delta (sequential numbers)`);
        }
        if (shouldUseBitPacking(values)) {
          compressionOps.push(`  • ${field}: Bit packing (boolean array)`);
        }
        if (values.every((v) => typeof v === 'number') && shouldUseVarint(values)) {
          compressionOps.push(`  • ${field}: Varint (small integers)`);
        }
      }

      if (compressionOps.length > 0) {
        compressionOps.forEach((op) => console.log(chalk.green(op)));
      } else {
        console.log(chalk.dim('  No obvious compression opportunities'));
      }
    }

    // Summary statistics
    if (options.showHints && Array.isArray(data) && data.length > 10) {
      const stats = generateSummaryStats(data);
      const numericFields = Object.keys(stats).filter(
        (f) => stats[f]!.sum !== undefined
      );

      if (numericFields.length > 0) {
        console.log(chalk.cyan('\n📈 Summary Statistics:\n'));
        numericFields.slice(0, 3).forEach((field) => {
          const stat = stats[field]!;
          console.log(chalk.white(`  ${field}:`));
          console.log(`    Sum: ${stat.sum?.toFixed(2)}`);
          console.log(`    Avg: ${stat.avg?.toFixed(2)}`);
          console.log(`    Min/Max: ${stat.min} / ${stat.max}`);
        });

        if (numericFields.length > 3) {
          console.log(chalk.dim(`  ... and ${numericFields.length - 3} more fields`));
        }
      }
    }
  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
