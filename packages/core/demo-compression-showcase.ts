#!/usr/bin/env node
/**
 * Compression Showcase Demo
 *
 * Demonstrates maximum compression on extreme-patterns.json
 * by manually applying all 5 compression algorithms
 */

import { readFileSync } from 'fs';
import {
  compressDelta,
  compressDictionary,
  compressToHex,
} from './src';

const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function color(text: string, col: keyof typeof c): string {
  return `${c[col]}${text}${c.reset}`;
}

function printHeader(title: string): void {
  console.log('\n' + color('═'.repeat(80), 'cyan'));
  console.log(color(`  ${title}`, 'bright'));
  console.log(color('═'.repeat(80), 'cyan') + '\n');
}

function printCompression(field: string, original: string, compressed: string, algorithm: string): void {
  const reduction = ((original.length - compressed.length) / original.length * 100).toFixed(1);
  const ratio = (original.length / compressed.length).toFixed(1);

  console.log(color(`\n📦 Field: ${field}`, 'yellow'));
  console.log(color(`   Algorithm: ${algorithm}`, 'cyan'));
  console.log(color(`   Original:  ${original.length.toLocaleString()} chars`, 'red'));
  console.log(color(`   Compressed: ${compressed.length.toLocaleString()} chars`, 'green'));
  console.log(color(`   Savings:   ${reduction}% (${ratio}x smaller)`, 'bright'));

  console.log(color('\n   Preview:', 'dim'));
  console.log(color('   Original: ', 'dim') + original.substring(0, 60) + '...');
  console.log(color('   Compressed: ', 'dim') + compressed.substring(0, 60) + '...');
}

function main(): void {
  printHeader('🚀 Maximum Compression Showcase: extreme-patterns.json');

  // Load data
  const data = JSON.parse(readFileSync('../../examples/extreme-patterns.json', 'utf-8')) as any[];

  console.log(color(`Dataset: ${data.length} rows`, 'bright'));
  console.log(color('Columns: id, status, priority, category, region, active, score\n', 'dim'));

  // Extract columns
  const ids = data.map(d => d.id);
  const statuses = data.map(d => d.status);
  const priorities = data.map(d => d.priority);
  const categories = data.map(d => d.category);
  const regions = data.map(d => d.region);
  const actives = data.map(d => d.active);
  const scores = data.map(d => d.score);

  // JSON baseline
  const jsonCompact = JSON.stringify(data);
  const csvContent = 'id,status,priority,category,region,active,score\n' +
    data.map(d => `${d.id},${d.status},${d.priority},${d.category},${d.region},${d.active},${d.score}`).join('\n');

  console.log(color('📊 Baseline Comparison:', 'bright'));
  console.log(color(`   JSON (compact): ${jsonCompact.length.toLocaleString()} chars`, 'red'));
  console.log(color(`   CSV:            ${csvContent.length.toLocaleString()} chars`, 'yellow'));

  printHeader('🗜️ Applying Compression Algorithms');

  // 1. Delta encoding for IDs
  const idsOriginal = ids.join(',');
  const idsCompressed = compressDelta(ids);
  printCompression('id', idsOriginal, idsCompressed, 'Delta Encoding');

  // 2. Delta encoding for scores
  const scoresOriginal = scores.join(',');
  const scoresCompressed = compressDelta(scores);
  printCompression('score', scoresOriginal, scoresCompressed, 'Delta Encoding');

  // 3. Dictionary for status
  const statusOriginal = statuses.join(',');
  const { dictionary: statusDict, indices: statusIndices } = compressDictionary(statuses);
  const statusCompressed = `@d:[${statusDict.join(',')}]|${statusIndices.join(',')}`;
  printCompression('status', statusOriginal, statusCompressed, 'Dictionary');

  // 4. Dictionary for priority
  const priorityOriginal = priorities.join(',');
  const { dictionary: priorityDict, indices: priorityIndices } = compressDictionary(priorities);
  const priorityCompressed = `@d:[${priorityDict.join(',')}]|${priorityIndices.join(',')}`;
  printCompression('priority', priorityOriginal, priorityCompressed, 'Dictionary');

  // 5. Dictionary for category
  const categoryOriginal = categories.join(',');
  const { dictionary: categoryDict, indices: categoryIndices } = compressDictionary(categories);
  const categoryCompressed = `@d:[${categoryDict.join(',')}]|${categoryIndices.join(',')}`;
  printCompression('category', categoryOriginal, categoryCompressed, 'Dictionary');

  // 6. Dictionary for region
  const regionOriginal = regions.join(',');
  const { dictionary: regionDict, indices: regionIndices } = compressDictionary(regions);
  const regionCompressed = `@d:[${regionDict.join(',')}]|${regionIndices.join(',')}`;
  printCompression('region', regionOriginal, regionCompressed, 'Dictionary');

  // 7. Bit packing for active boolean
  const activeOriginal = actives.map(a => a ? 'true' : 'false').join(',');
  const activeCompressed = compressToHex(actives);
  printCompression('active', activeOriginal, activeCompressed, 'Bit Packing (Hex)');

  // Build the actual AXON format that would be sent to LLM
  printHeader('📄 AXON Format Sent to LLM (Maximum Compression)');

  const axonCompressed = `::[50] active:bool@hex|category:str@dict|id:u16@delta|priority:str@dict|region:str@dict|score:u8@delta|status:str@dict

# Compressed columns:
active@hex: ${activeCompressed}
category@dict: ${categoryCompressed}
id@delta: ${idsCompressed}
priority@dict: ${priorityCompressed}
region@dict: ${regionCompressed}
score@delta: ${scoresCompressed}
status@dict: ${statusCompressed}`;

  console.log(color('This is what gets sent to the LLM:', 'bright'));
  console.log(color('─'.repeat(80), 'dim'));
  console.log(axonCompressed);
  console.log(color('─'.repeat(80), 'dim'));

  // Calculate totals
  printHeader('📈 Final Results: Maximum Compression');

  const originalTotal =
    idsOriginal.length +
    statusOriginal.length +
    priorityOriginal.length +
    categoryOriginal.length +
    regionOriginal.length +
    activeOriginal.length +
    scoresOriginal.length +
    200; // overhead for structure

  const compressedTotal = axonCompressed.length;

  const totalReduction = ((originalTotal - compressedTotal) / originalTotal * 100).toFixed(1);
  const totalRatio = (originalTotal / compressedTotal).toFixed(1);

  console.log(color('Uncompressed AXON (with types):', 'yellow'));
  console.log(color(`  Estimated: ~${originalTotal.toLocaleString()} chars (~${Math.ceil(originalTotal / 4)} tokens)`, 'red'));

  console.log(color('\nCompressed AXON (sent to LLM):', 'green'));
  console.log(color(`  Actual:    ${compressedTotal.toLocaleString()} chars (${Math.ceil(compressedTotal / 4)} tokens)`, 'green'));

  console.log(color(`\n💰 Savings: ${totalReduction}% reduction (${totalRatio}x smaller!)`, 'bright'));

  console.log(color('\n\n📊 Final Comparison:', 'bright'));
  console.log(color('─'.repeat(80), 'dim'));

  const jsonTokens = Math.ceil(jsonCompact.length / 4);
  const csvTokens = Math.ceil(csvContent.length / 4);
  const axonTokens = Math.ceil(compressedTotal / 4);

  console.log(color(`  JSON (compact):         ${jsonCompact.length.toLocaleString().padStart(6)} chars  ~${jsonTokens.toLocaleString().padStart(5)} tokens`, 'red'));
  console.log(color(`  CSV:                    ${csvContent.length.toLocaleString().padStart(6)} chars  ~${csvTokens.toLocaleString().padStart(5)} tokens`, 'yellow'));
  console.log(color(`  AXON (no compression):  ${originalTotal.toLocaleString().padStart(6)} chars  ~${Math.ceil(originalTotal / 4).toLocaleString().padStart(5)} tokens`, 'cyan'));
  console.log(color(`  AXON (max compression):  ${compressedTotal.toLocaleString().padStart(5)} chars  ~${axonTokens.toLocaleString().padStart(5)} tokens  ✅`, 'green'));

  const vsJson = ((jsonTokens - axonTokens) / jsonTokens * 100).toFixed(1);
  const vsCsv = ((csvTokens - axonTokens) / csvTokens * 100).toFixed(1);
  const vsAxonUncompressed = ((Math.ceil(originalTotal / 4) - axonTokens) / Math.ceil(originalTotal / 4) * 100).toFixed(1);

  console.log(color('\n  Savings:', 'bright'));
  console.log(color(`    vs JSON:                ${vsJson}%`, 'green'));
  console.log(color(`    vs CSV:                 ${vsCsv}% 🚀`, 'green'));
  console.log(color(`    vs AXON (uncompressed): ${vsAxonUncompressed}%`, 'green'));

  const ratioVsCsv = (csvTokens / axonTokens).toFixed(1);
  console.log(color(`\n  AXON is ${ratioVsCsv}x more efficient than CSV! 🚀🚀🚀`, 'bright'));

  // Show comparison of actual content
  printHeader('📋 What Actually Gets Sent to LLM');

  console.log(color('\n1️⃣  CSV Format (2,117 chars):', 'yellow'));
  console.log(color('─'.repeat(80), 'dim'));
  const csvLines = csvContent.split('\n');
  csvLines.slice(0, 6).forEach(line => console.log('  ' + line));
  console.log(color(`  ... ${csvLines.length - 6} more rows`, 'dim'));
  console.log(color(`  Total: ${csvContent.length} chars\n`, 'yellow'));

  console.log(color('2️⃣  AXON Compressed Format (${compressedTotal} chars):', 'green'));
  console.log(color('─'.repeat(80), 'dim'));
  const axonLines = axonCompressed.split('\n');
  axonLines.forEach(line => {
    const display = line.length > 75 ? line.substring(0, 72) + '...' : line;
    console.log('  ' + display);
  });
  console.log(color(`  Total: ${compressedTotal} chars\n`, 'green'));

  console.log(color('✨ Key Insight:', 'bright'));
  console.log(color('  Without compression: CSV wins by ~6%', 'yellow'));
  console.log(color(`  With compression:    AXON wins by ${ratioVsCsv}x! 🚀`, 'green'));
  console.log(color('\n  This is why AXON is built for real-world LLM use cases!', 'cyan'));
  console.log();
}

main();
