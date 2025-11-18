/**
 * Adaptive Mode Selection
 * Automatically selects optimal encoding mode based on data characteristics
 */

import type { AXONMode } from '../types';
import { analyzeData } from './analyzer';
import { shouldUseColumnar } from './modes/columnar';
import { shouldUseStream } from './modes/stream';
import { shouldUseSparse } from './modes/sparse';

/**
 * Select optimal mode for data
 */
export function selectMode(value: any, options?: { mode?: AXONMode }): AXONMode {
  // If mode explicitly specified, use it
  if (options?.mode && options.mode !== 'auto') {
    return options.mode;
  }

  // Not an array - use nested mode for objects
  if (!Array.isArray(value)) {
    return 'nested';
  }

  // Empty array
  if (value.length === 0) {
    return 'compact';
  }

  const analysis = analyzeData(value);

  // Array of primitives - use compact
  if (!analysis.isArrayOfObjects) {
    return 'compact';
  }

  // Non-uniform - use JSON compatibility mode
  if (!analysis.isUniform) {
    return 'json';
  }

  // Check for sparse data (many nulls)
  if (shouldUseSparse(value)) {
    return 'sparse';
  }

  // Check for time-series (stream mode)
  if (shouldUseStream(value)) {
    return 'stream';
  }

  // Check for large numeric datasets (columnar mode)
  if (shouldUseColumnar(value)) {
    return 'columnar';
  }

  // Default to compact mode
  return 'compact';
}

/**
 * Get mode recommendation with reasoning
 */
export function getModeRecommendation(value: any): {
  mode: AXONMode;
  reason: string;
  characteristics: {
    isArray: boolean;
    length: number;
    isUniform: boolean;
    isNumericHeavy: boolean;
    hasTimeField: boolean;
    sparsityRatio: number;
  };
} {
  const mode = selectMode(value);

  // Analyze characteristics
  const isArray = Array.isArray(value);
  const length = isArray ? value.length : 0;
  const analysis = isArray ? analyzeData(value) : null;

  let isNumericHeavy = false;
  let hasTimeField = false;
  let sparsityRatio = 0;

  if (isArray && analysis?.isArrayOfObjects && value.length > 0) {
    const fields = Object.keys(value[0]!);

    // Check numeric fields
    let numericCount = 0;
    for (const field of fields) {
      if (value.every((item: any) => typeof item[field] === 'number')) {
        numericCount++;
      }
    }
    isNumericHeavy = numericCount / fields.length > 0.5;

    // Check for time fields
    hasTimeField = fields.some((f) =>
      f.toLowerCase().includes('time') || f.toLowerCase().includes('date')
    );

    // Calculate sparsity
    let nullCount = 0;
    let totalCount = 0;
    for (const item of value) {
      for (const val of Object.values(item)) {
        totalCount++;
        if (val === null || val === undefined) {
          nullCount++;
        }
      }
    }
    sparsityRatio = nullCount / totalCount;
  }

  // Generate reasoning
  let reason = '';
  switch (mode) {
    case 'columnar':
      reason = `Large numeric dataset (${length} rows, ${isNumericHeavy ? '>50%' : ''} numeric) - columnar mode optimal for analytics`;
      break;
    case 'stream':
      reason = `Time-series data detected (${length} rows with temporal field) - stream mode for sequential data`;
      break;
    case 'sparse':
      reason = `High sparsity (${(sparsityRatio * 100).toFixed(0)}% null values) - sparse mode omits nulls`;
      break;
    case 'compact':
      reason = `Uniform tabular data (${length} rows) - compact mode for efficient row storage`;
      break;
    case 'nested':
      reason = 'Complex object with nesting - nested mode preserves structure';
      break;
    case 'json':
      reason = 'Non-uniform or complex data - JSON compatibility mode';
      break;
    default:
      reason = 'Default mode selected';
  }

  return {
    mode,
    reason,
    characteristics: {
      isArray,
      length,
      isUniform: analysis?.isUniform || false,
      isNumericHeavy,
      hasTimeField,
      sparsityRatio,
    },
  };
}
