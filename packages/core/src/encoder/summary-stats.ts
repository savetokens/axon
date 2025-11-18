/**
 * Summary Statistics
 * Precomputed statistics for fast LLM queries
 * Format: @summary(sum:field, avg:field, count:*, distinct:field)
 */

export interface SummaryStats {
  field: string;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  count?: number;
  distinct?: number;
  median?: number;
  stddev?: number;
}

/**
 * Calculate summary statistics for a numeric field
 */
export function calculateFieldStats(data: any[], field: string): SummaryStats {
  const values = data.map((item) => item[field]).filter((v) => typeof v === 'number');

  if (values.length === 0) {
    return { field };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const count = values.length;

  // Calculate median
  const sorted = [...values].sort((a, b) => a - b);
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
      : sorted[Math.floor(sorted.length / 2)]!;

  // Calculate standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  const stddev = Math.sqrt(variance);

  return {
    field,
    sum,
    avg,
    min,
    max,
    count,
    median,
    stddev,
  };
}

/**
 * Calculate distinct count for a field
 */
export function calculateDistinctCount(data: any[], field: string): number {
  const values = data.map((item) => item[field]);
  return new Set(values).size;
}

/**
 * Generate summary statistics for dataset
 */
export function generateSummaryStats(data: any[], fields?: string[]): Record<string, SummaryStats> {
  if (data.length === 0) return {};

  const targetFields = fields || Object.keys(data[0]!);
  const stats: Record<string, SummaryStats> = {};

  for (const field of targetFields) {
    const values = data.map((item) => item[field]);

    // Only calculate stats for numeric fields
    if (values.every((v) => typeof v === 'number')) {
      stats[field] = calculateFieldStats(data, field);
    } else {
      // For non-numeric, just count distinct
      stats[field] = {
        field,
        distinct: calculateDistinctCount(data, field),
        count: data.length,
      };
    }
  }

  return stats;
}

/**
 * Format summary stats as AXON @computed block
 */
export function formatSummaryStats(stats: Record<string, SummaryStats>): string {
  const lines: string[] = ['@computed: {'];

  for (const [field, stat] of Object.entries(stats)) {
    if (stat.sum !== undefined) {
      lines.push(`  ${field}_sum: ${stat.sum}`);
    }
    if (stat.avg !== undefined) {
      lines.push(`  ${field}_avg: ${stat.avg.toFixed(2)}`);
    }
    if (stat.min !== undefined) {
      lines.push(`  ${field}_min: ${stat.min}`);
    }
    if (stat.max !== undefined) {
      lines.push(`  ${field}_max: ${stat.max}`);
    }
    if (stat.count !== undefined && stat.distinct === undefined) {
      lines.push(`  ${field}_count: ${stat.count}`);
    }
    if (stat.distinct !== undefined) {
      lines.push(`  ${field}_distinct: ${stat.distinct}`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Calculate distribution for categorical field
 */
export function calculateDistribution(data: any[], field: string): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const item of data) {
    const value = String(item[field]);
    distribution[value] = (distribution[value] || 0) + 1;
  }

  return distribution;
}

/**
 * Format distribution as AXON @distribution block
 */
export function formatDistribution(field: string, distribution: Record<string, number>): string {
  const lines: string[] = [`@distribution: {`, `  ${field}: {`];

  // Sort by count (descending)
  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

  for (const [value, count] of sorted) {
    lines.push(`    ${value}: ${count},`);
  }

  lines.push('  }');
  lines.push('}');

  return lines.join('\n');
}
