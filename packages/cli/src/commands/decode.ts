import { readFileSync, writeFileSync } from 'fs';
import { decode } from '@axon-format/core';
import chalk from 'chalk';
import ora from 'ora';

interface DecodeOptions {
  output?: string;
  compact?: boolean;
}

export async function decodeCommand(input: string, options: DecodeOptions): Promise<void> {
  const spinner = ora('Reading AXON file...').start();

  try {
    // Read input file
    const axonContent = readFileSync(input, 'utf-8');
    spinner.text = 'Decoding AXON...';

    // Decode
    const data = decode(axonContent);
    spinner.succeed('Decoding complete!');

    // Convert to JSON
    const jsonContent = JSON.stringify(data, null, options.compact ? 0 : 2);

    // Output
    if (options.output) {
      writeFileSync(options.output, jsonContent, 'utf-8');
      console.log(chalk.green(`\n✓ Written to: ${options.output}`));
    } else {
      console.log(chalk.cyan('\nJSON Output:'));
      console.log(chalk.white('─'.repeat(60)));
      console.log(jsonContent);
      console.log(chalk.white('─'.repeat(60)));
    }

    // Show data summary
    if (Array.isArray(data)) {
      console.log(chalk.cyan('\n📊 Decoded Data:'));
      console.log(`  Type: Array`);
      console.log(`  Length: ${data.length} items`);
    } else if (typeof data === 'object' && data !== null) {
      console.log(chalk.cyan('\n📊 Decoded Data:'));
      console.log(`  Type: Object`);
      console.log(`  Fields: ${Object.keys(data).length}`);
    }
  } catch (error) {
    spinner.fail('Decoding failed');
    console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
