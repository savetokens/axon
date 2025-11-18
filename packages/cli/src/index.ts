#!/usr/bin/env node
/**
 * AXON CLI - Command-line tool for AXON format operations
 */

import { Command } from 'commander';
import { encodeCommand } from './commands/encode';
import { decodeCommand } from './commands/decode';
import { statsCommand } from './commands/stats';
import { compareCommand } from './commands/compare';
import { validateCommand } from './commands/validate';

const program = new Command();

program
  .name('axon')
  .description('AXON - Adaptive eXchange Oriented Notation CLI')
  .version('0.5.0');

// Encode command
program
  .command('encode')
  .description('Encode JSON to AXON format')
  .argument('<input>', 'Input JSON file')
  .option('-o, --output <file>', 'Output AXON file')
  .option('-m, --mode <mode>', 'Encoding mode (auto|compact|nested|columnar|stream|sparse)', 'auto')
  .option('-d, --delimiter <char>', 'Field delimiter (| or , or tab)', '|')
  .option('-c, --compression', 'Enable compression directives', false)
  .option('-s, --stats', 'Show statistics', false)
  .option('--pretty', 'Pretty print output', true)
  .action(encodeCommand);

// Decode command
program
  .command('decode')
  .description('Decode AXON to JSON format')
  .argument('<input>', 'Input AXON file')
  .option('-o, --output <file>', 'Output JSON file')
  .option('--compact', 'Compact JSON output', false)
  .action(decodeCommand);

// Stats command
program
  .command('stats')
  .description('Analyze data and show compression statistics')
  .argument('<input>', 'Input JSON file')
  .option('--show-modes', 'Show all mode recommendations', false)
  .option('--show-compression', 'Show compression opportunities', false)
  .option('--show-hints', 'Show query hints', false)
  .action(statsCommand);

// Compare command
program
  .command('compare')
  .description('Compare AXON with other formats')
  .argument('<input>', 'Input JSON file')
  .option('--format <formats>', 'Formats to compare (json,csv,axon)', 'json,axon')
  .action(compareCommand);

// Validate command
program
  .command('validate')
  .description('Validate AXON file against schema')
  .argument('<input>', 'Input AXON file')
  .option('--schema <file>', 'Schema file (AXON format)')
  .action(validateCommand);

program.parse();
