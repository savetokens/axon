/**
 * Query Hints System
 * Provides metadata to help LLMs understand data structure and optimize queries
 * Hints: !primary, !search, !timeseries, !aggregate, !join, !index
 */

export type QueryHintType =
  | 'primary'
  | 'search'
  | 'timeseries'
  | 'aggregate'
  | 'join'
  | 'index';

export interface QueryHint {
  type: QueryHintType;
  fields: string[];
}

/**
 * Detect primary key field
 */
export function detectPrimaryKey(data: any[]): string | null {
  if (data.length === 0) return null;

  const fields = Object.keys(data[0]!);

  // Common primary key names
  const primaryKeyNames = ['id', '_id', 'uuid', 'key', 'pk'];

  for (const name of primaryKeyNames) {
    if (fields.includes(name)) {
      // Verify uniqueness
      const values = data.map((item) => item[name]);
      const unique = new Set(values);
      if (unique.size === data.length) {
        return name;
      }
    }
  }

  // Check for any unique field
  for (const field of fields) {
    const values = data.map((item) => item[field]);
    const unique = new Set(values);
    if (unique.size === data.length) {
      return field;
    }
  }

  return null;
}

/**
 * Detect searchable text fields
 */
export function detectSearchFields(data: any[]): string[] {
  if (data.length === 0) return [];

  const fields = Object.keys(data[0]!);
  const searchFields: string[] = [];

  for (const field of fields) {
    // Check if field contains strings
    const values = data.map((item) => item[field]);

    if (values.every((v) => typeof v === 'string')) {
      // Common search field names
      if (
        field.toLowerCase().includes('name') ||
        field.toLowerCase().includes('title') ||
        field.toLowerCase().includes('description') ||
        field.toLowerCase().includes('text') ||
        field.toLowerCase().includes('email') ||
        field.toLowerCase().includes('search')
      ) {
        searchFields.push(field);
      }
    }
  }

  return searchFields;
}

/**
 * Detect time-series field
 */
export function detectTimeseriesField(data: any[]): string | null {
  if (data.length === 0) return null;

  const fields = Object.keys(data[0]!);

  // Common timestamp field names
  const timeFieldNames = [
    'timestamp',
    'created',
    'updated',
    'date',
    'time',
    'ts',
    'createdAt',
    'updatedAt',
  ];

  for (const name of timeFieldNames) {
    const field = fields.find((f) => f.toLowerCase() === name.toLowerCase());
    if (field) {
      return field;
    }
  }

  // Check for date-like fields
  for (const field of fields) {
    if (
      field.toLowerCase().includes('date') ||
      field.toLowerCase().includes('time')
    ) {
      return field;
    }
  }

  return null;
}

/**
 * Detect aggregatable (numeric) fields
 */
export function detectAggregateFields(data: any[]): string[] {
  if (data.length === 0) return [];

  const fields = Object.keys(data[0]!);
  const aggregateFields: string[] = [];

  for (const field of fields) {
    const values = data.map((item) => item[field]);

    // Must be all numeric
    if (values.every((v) => typeof v === 'number')) {
      // Common aggregate field names
      if (
        field.toLowerCase().includes('count') ||
        field.toLowerCase().includes('total') ||
        field.toLowerCase().includes('sum') ||
        field.toLowerCase().includes('amount') ||
        field.toLowerCase().includes('price') ||
        field.toLowerCase().includes('revenue') ||
        field.toLowerCase().includes('quantity') ||
        field.toLowerCase().includes('views') ||
        field.toLowerCase().includes('clicks') ||
        field === 'qty' ||
        field === 'value'
      ) {
        aggregateFields.push(field);
      }
    }
  }

  return aggregateFields;
}

/**
 * Detect join/reference fields
 */
export function detectJoinFields(data: any[]): string[] {
  if (data.length === 0) return [];

  const fields = Object.keys(data[0]!);
  const joinFields: string[] = [];

  for (const field of fields) {
    // Common foreign key patterns
    if (
      field.toLowerCase().endsWith('_id') ||
      field.toLowerCase().endsWith('id') ||
      field.toLowerCase().includes('ref') ||
      field.toLowerCase().includes('fk')
    ) {
      joinFields.push(field);
    }
  }

  return joinFields;
}

/**
 * Detect fields that should be indexed
 */
export function detectIndexFields(data: any[]): string[] {
  const indexFields: string[] = [];

  // Primary key
  const primaryKey = detectPrimaryKey(data);
  if (primaryKey) {
    indexFields.push(primaryKey);
  }

  // Timeseries field
  const timeField = detectTimeseriesField(data);
  if (timeField) {
    indexFields.push(timeField);
  }

  // Join fields
  const joinFields = detectJoinFields(data);
  indexFields.push(...joinFields);

  // Deduplicate
  return Array.from(new Set(indexFields));
}

/**
 * Generate all query hints for data
 */
export function generateQueryHints(data: any[]): QueryHint[] {
  const hints: QueryHint[] = [];

  const primaryKey = detectPrimaryKey(data);
  if (primaryKey) {
    hints.push({ type: 'primary', fields: [primaryKey] });
  }

  const searchFields = detectSearchFields(data);
  if (searchFields.length > 0) {
    hints.push({ type: 'search', fields: searchFields });
  }

  const timeField = detectTimeseriesField(data);
  if (timeField) {
    hints.push({ type: 'timeseries', fields: [timeField] });
  }

  const aggregateFields = detectAggregateFields(data);
  if (aggregateFields.length > 0) {
    hints.push({ type: 'aggregate', fields: aggregateFields });
  }

  const joinFields = detectJoinFields(data);
  if (joinFields.length > 0) {
    hints.push({ type: 'join', fields: joinFields });
  }

  const indexFields = detectIndexFields(data);
  if (indexFields.length > 0) {
    hints.push({ type: 'index', fields: indexFields });
  }

  return hints;
}

/**
 * Format query hints as AXON syntax
 */
export function formatQueryHints(hints: QueryHint[]): string {
  return hints.map((hint) => `!${hint.type}:${hint.fields.join(',')}`).join(' ');
}
