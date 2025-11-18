import { readFileSync } from 'fs';
import { decode } from '@axon-format/core';
import chalk from 'chalk';
import ora from 'ora';

interface ValidateOptions {
  schema?: string;
}

export async function validateCommand(input: string, options: ValidateOptions): Promise<void> {
  const spinner = ora('Reading AXON file...').start();

  try {
    // Read input
    const axonContent = readFileSync(input, 'utf-8');

    spinner.text = 'Validating AXON syntax...';

    // Try to decode (validates syntax)
    const data = decode(axonContent);

    spinner.succeed('Syntax validation passed!');

    console.log(chalk.green('\n✓ AXON file is syntactically valid'));

    // Basic info
    console.log(chalk.cyan('\n📊 File Info:'));
    console.log(`  Size: ${axonContent.length} chars`);
    console.log(`  Lines: ${axonContent.split('\n').length}`);

    if (Array.isArray(data)) {
      console.log(`  Data type: Array`);
      console.log(`  Items: ${data.length}`);
    } else if (typeof data === 'object' && data !== null) {
      console.log(`  Data type: Object`);
      console.log(`  Fields: ${Object.keys(data).length}`);
    }

    // Schema validation (if provided)
    if (options.schema) {
      spinner.start('Loading schema...');

      // For now, just indicate schema validation would happen here
      // Full implementation requires schema parsing from AXON files
      spinner.info('Schema validation: Coming soon!');

      console.log(chalk.yellow('\n⚠️  Schema validation not yet implemented'));
      console.log(chalk.dim('   Use programmatic API for schema validation'));
    }

    console.log(chalk.green('\n✓ Validation complete!\n'));
  } catch (error) {
    spinner.fail('Validation failed');

    console.error(chalk.red('\n✗ AXON file is invalid\n'));
    console.error(chalk.yellow('Error details:'));
    console.error(chalk.white(`  ${error instanceof Error ? error.message : String(error)}`));

    if (error instanceof Error && 'line' in error) {
      console.error(chalk.dim(`  At line ${(error as any).line}, column ${(error as any).column}`));
    }

    console.log();
    process.exit(1);
  }
}
