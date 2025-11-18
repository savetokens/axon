import { readFileSync } from 'fs';
import { encode } from '@axon-format/core';
import chalk from 'chalk';
import ora from 'ora';

interface CompareOptions {
  format?: string;
}

export async function compareCommand(input: string, options: CompareOptions): Promise<void> {
  const spinner = ora('Reading file...').start();

  try {
    const jsonContent = readFileSync(input, 'utf-8');
    const data = JSON.parse(jsonContent);

    spinner.text = 'Encoding in multiple formats...';

    // Formats to compare
    const formats = (options.format || 'json,axon').split(',');

    const results: Array<{ name: string; content: string; size: number; tokens: number }> = [];

    // JSON (pretty)
    if (formats.includes('json')) {
      const jsonPretty = JSON.stringify(data, null, 2);
      results.push({
        name: 'JSON (pretty)',
        content: jsonPretty,
        size: jsonPretty.length,
        tokens: Math.ceil(jsonPretty.length / 4),
      });
    }

    // JSON (compact)
    if (formats.includes('json')) {
      const jsonCompact = JSON.stringify(data);
      results.push({
        name: 'JSON (compact)',
        content: jsonCompact,
        size: jsonCompact.length,
        tokens: Math.ceil(jsonCompact.length / 4),
      });
    }

    // CSV (simulated)
    if (formats.includes('csv') && Array.isArray(data) && data.length > 0) {
      const fields = Object.keys(data[0]!);
      const csvHeader = fields.join(',');
      const csvRows = data.map((item) =>
        fields.map((f) => {
          const value = item[f];
          // Simple CSV escaping
          const str = String(value);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      ).join('\n');
      const csvContent = csvHeader + '\n' + csvRows;

      results.push({
        name: 'CSV',
        content: csvContent,
        size: csvContent.length,
        tokens: Math.ceil(csvContent.length / 4),
      });
    }

    // AXON
    if (formats.includes('axon')) {
      const axonContent = encode(data);
      results.push({
        name: 'AXON',
        content: axonContent,
        size: axonContent.length,
        tokens: Math.ceil(axonContent.length / 4),
      });
    }

    spinner.succeed('Comparison complete!');

    // Display comparison
    console.log(chalk.cyan('\n📊 Format Comparison\n'));

    console.log(chalk.white('Format           Size (chars)  Tokens (est)  Reduction'));
    console.log(chalk.white('─'.repeat(60)));

    const baselineTokens = results[0]!.tokens;

    results.forEach((result, index) => {
      const reduction = index === 0 ? '-' : ((baselineTokens - result.tokens) / baselineTokens * 100).toFixed(1) + '%';
      const color = result.name === 'AXON' ? 'green' : 'white';

      console.log(
        chalk[color](
          `${result.name.padEnd(16)} ${String(result.size).padStart(12)}  ${String(result.tokens).padStart(12)}  ${String(reduction).padStart(10)}`
        )
      );
    });

    console.log(chalk.white('─'.repeat(60)));

    // Show preview
    console.log(chalk.cyan('\n📄 Preview (first 10 lines):\n'));

    results.forEach((result) => {
      console.log(chalk.yellow(`${result.name}:`));
      const lines = result.content.split('\n').slice(0, 10);
      lines.forEach((line) => {
        const truncated = line.length > 70 ? line.substring(0, 67) + '...' : line;
        console.log(chalk.dim('  ' + truncated));
      });
      if (result.content.split('\n').length > 10) {
        console.log(chalk.dim(`  ... +${result.content.split('\n').length - 10} more lines\n`));
      } else {
        console.log();
      }
    });
  } catch (error) {
    spinner.fail('Comparison failed');
    console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
