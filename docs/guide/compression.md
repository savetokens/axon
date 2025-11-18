# Compression Guide

AXON includes 5 powerful compression algorithms that can reduce token usage by 90-99% for patterned data.

## When to Use Compression

**Enable compression when:**
- ✅ Dataset has >100 rows
- ✅ Data has repeated values
- ✅ Sequential numbers or timestamps
- ✅ Boolean flags or categorical data
- ✅ Maximum token efficiency needed

**Skip compression when:**
- ⚠️ Dataset is small (<50 rows)
- ⚠️ All values are unique
- ⚠️ Latency is critical

---

## 1. RLE (Run-Length Encoding)

**Best for:** Consecutive repeated values

### Example

```typescript
import { compressRLE, decompressRLE } from '@axon-format/core';

const statuses = [
  'active', 'active', 'active',  // 800 times
  'inactive', 'inactive',         // 150 times
  'pending'                       // 50 times
];

const compressed = compressRLE(statuses);
// "active*800, inactive*150, pending*50"

// 99.5% reduction! (7,374 chars → 36 chars)

const decompressed = decompressRLE(compressed);
// Back to original array
```

### When AXON Recommends RLE

```typescript
import { shouldUseRLE } from '@axon-format/core';

shouldUseRLE(data);
// Returns true if >30% of values are in consecutive runs
```

---

## 2. Dictionary Compression

**Best for:** Limited unique values repeated many times

### Example

```typescript
import { compressDictionary, decompressDictionary } from '@axon-format/core';

const cities = [
  'Berlin', 'Munich', 'Berlin', 'Hamburg',
  'Berlin', 'Munich', 'Frankfurt', 'Berlin'
  // ... 500 entries, only 5 unique cities
];

const { dictionary, indices } = compressDictionary(cities);
// dictionary: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne']
// indices: [0, 1, 0, 2, 0, 1, 3, 0, ...]

// 73% reduction! (4,000 chars → 1,050 chars)

const original = decompressDictionary(dictionary, indices);
```

### When to Use

- 5-20 unique values in 500+ entries
- Categories, cities, status values
- Repeated strings

---

## 3. Delta Encoding

**Best for:** Sequential or slowly-changing numbers

### Example

```typescript
import { compressDelta, decompressDelta } from '@axon-format/core';

const ids = [1000, 1001, 1002, 1003, 1004];

const compressed = compressDelta(ids);
// "1000, +1, +1, +1, +1"

// 50% reduction for sequential data

const original = decompressDelta(compressed);
```

### Timestamp Delta

```typescript
import { compressTimestampDelta } from '@axon-format/core';

const timestamps = [
  '2025-01-01T00:00:00Z',
  '2025-01-01T01:00:00Z',  // +1 hour
  '2025-01-01T02:00:00Z',  // +1 hour
];

const compressed = compressTimestampDelta(timestamps);
// "2025-01-01T00:00:00Z, +3600, +3600"
```

---

## 4. Bit Packing

**Best for:** Boolean arrays

### Example

```typescript
import { compressToHex, decompressFromHex } from '@axon-format/core';

const flags = Array.from({ length: 1000 }, (_, i) => i % 2 === 0);

const compressed = compressToHex(flags);
// "AAAA..." (hex string)

// 95% reduction! (5,685 chars → 250 chars)

const original = decompressFromHex(compressed, 1000);
```

### Binary vs Hex

```typescript
import { compressToBinary } from '@axon-format/core';

// Binary format
compressToBinary([true, false, true]);
// "101"

// Hex format (4x more efficient)
compressToHex([true, false, true, true]);
// "D" (1101 in binary)
```

---

## 5. Varint (Variable-Length Integers)

**Best for:** Small integers (view counts, IDs, quantities)

### Example

```typescript
import { encodeVarint, decodeVarint } from '@axon-format/core';

const count = 150;

const bytes = encodeVarint(count);
// [150, 1] (2 bytes instead of 4)

// 60-75% savings for typical web analytics data

const original = decodeVarint(bytes);
```

---

## Automatic Compression

AXON can detect compression opportunities:

```typescript
import { encode } from '@axon-format/core';

const data = {
  flags: Array(1000).fill(true),
  categories: ['A', 'B', 'C'].map((c, i) => c.repeat(333)).flat()
};

// Enable compression
const axon = encode(data, { compression: true });

// AXON automatically applies:
// - Bit packing for flags (95% reduction)
// - Dictionary for categories (80% reduction)
```

---

## Heuristics

Each compression algorithm has heuristics:

```typescript
import {
  shouldUseRLE,
  shouldUseDictionary,
  shouldUseDelta,
  shouldUseBitPacking,
  shouldUseVarint
} from '@axon-format/core';

// Check if compression is beneficial
if (shouldUseRLE(data)) {
  const compressed = compressRLE(data);
}
```

---

## Combined Compression

For maximum savings, combine techniques:

```typescript
const analytics = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,              // Delta: sequential
  category: 'A',          // Dictionary: limited unique
  active: i % 2 === 0    // Bit packing: boolean
}));

// Each field gets optimal compression
// Combined: 75-85% token reduction!
```

---

## Performance Tips

1. **Use compression for large datasets** (>100 rows)
2. **Profile first with `shouldUse*` functions**
3. **Batch processing** - Compress once, use many times
4. **Monitor compression ratio** - Use `get*CompressionRatio()` functions

---

## See Also

- [API Reference](../api/compression.md) - Full compression API
- [Benchmarks](benchmarks.md) - Measured compression ratios
- [Format Comparison](../README.md#comparisons) - AXON vs JSON/CSV
