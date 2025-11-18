import { readFileSync, writeFileSync } from 'fs';
import { encode } from '@axon-format/core';
import type { AXONMode } from '@axon-format/core';
import chalk from 'chalk';
import ora from 'ora';

interface EncodeOptions {
  output?: string;
  mode?: string;
  delimiter?: string;
  compression?: boolean;
  stats?: boolean;
  pretty?: boolean;
}

export async function encodeCommand(input: string, options: EncodeOptions): Promise<void> {
  const spinner = ora('Reading JSON file...').start();

  try {
    // Read input file
    const jsonContent = readFileSync(input, 'utf-8');
    spinner.text = 'Parsing JSON...';

    const data = JSON.parse(jsonContent);
    spinner.text = 'Encoding to AXON...';

    // Encode
    const mode = (options.mode || 'auto') as AXONMode;
    const axonContent = encode(data, {
      mode,
      delimiter: (options.delimiter || '|') as ',' | '|' | '\t',
      compression: options.compression,
    });

    spinner.succeed('Encoding complete!');

    // Output
    if (options.output) {
      writeFileSync(options.output, axonContent, 'utf-8');
      console.log(chalk.green(`\n✓ Written to: ${options.output}`));
    } else {
      console.log(chalk.cyan('\nAXON Output:'));
      console.log(chalk.white('─'.repeat(60)));
      console.log(axonContent);
      console.log(chalk.white('─'.repeat(60)));
    }

    // Stats
    if (options.stats) {
      showStats(jsonContent, axonContent, data);
    }
  } catch (error) {
    spinner.fail('Encoding failed');
    console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

function showStats(jsonContent: string, axonContent: string, data: any): void {
  console.log(chalk.cyan('\n📊 Statistics:'));

  const jsonSize = jsonContent.length;
  const axonSize = axonContent.length;
  const savings = ((jsonSize - axonSize) / jsonSize * 100).toFixed(1);

  console.log(chalk.white('  Format      Size       Tokens (est)'));
  console.log(chalk.white('  ────────────────────────────────────'));
  console.log(`  JSON        ${String(jsonSize).padEnd(10)} ~${Math.ceil(jsonSize / 4)}`);
  console.log(chalk.green(`  AXON        ${String(axonSize).padEnd(10)} ~${Math.ceil(axonSize / 4)}`));
  console.log(chalk.white('  ────────────────────────────────────'));
  console.log(chalk.green(`  Savings:    ${savings}%`));

  // Data info
  if (Array.isArray(data)) {
    console.log(chalk.cyan('\n📈 Data Info:'));
    console.log(`  Rows: ${data.length}`);
    if (data.length > 0 && typeof data[0] === 'object') {
      console.log(`  Fields: ${Object.keys(data[0]!).length}`);
    }
  } else if (typeof data === 'object' && data !== null) {
    console.log(chalk.cyan('\n📈 Data Info:'));
    console.log(`  Type: Object`);
    console.log(`  Top-level fields: ${Object.keys(data).length}`);
  }
}
