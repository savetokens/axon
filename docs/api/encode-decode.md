# Encode & Decode API Reference

## encode()

Converts JavaScript objects to AXON format.

### Signature

```typescript
function encode(value: any, options?: EncodeOptions): string
```

### Parameters

**value** - Any JavaScript value
- Objects, arrays, primitives
- Nested structures supported
- Type inference automatic

**options** (optional)
```typescript
{
  mode?: 'auto' | 'compact' | 'nested' | 'columnar' | 'stream' | 'sparse' | 'json',
  compression?: boolean,  // Enable compression directives
  delimiter?: '|' | ',' | '\t',  // Field delimiter
  indent?: number  // Indentation spaces (default: 2)
}
```

### Returns

**string** - AXON-formatted string

### Examples

**Basic encoding:**
```typescript
const data = { users: [{ id: 1, name: 'Alice' }] };
const axon = encode(data);
// users::[1] id:u8|name:str
//   1|Alice
```

**With compression:**
```typescript
const data = { flags: Array(1000).fill(true) };
const axon = encode(data, { compression: true });
// Automatically applies bit packing
```

**Specific mode:**
```typescript
const data = [/* large dataset */];
const axon = encode(data, { mode: 'columnar' });
// Forces columnar mode
```

---

## decode()

Converts AXON format back to JavaScript objects.

### Signature

```typescript
function decode(input: string, options?: DecodeOptions): any
```

### Parameters

**input** - AXON-formatted string

**options** (optional)
```typescript
{
  strict?: boolean  // Strict validation (default: true)
}
```

### Returns

**any** - JavaScript object/array/primitive

### Examples

**Basic decoding:**
```typescript
const axon = 'users::[2] id|name\n  1|Alice\n  2|Bob';
const data = decode(axon);
// { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] }
```

**Round-trip:**
```typescript
const original = { data: [1, 2, 3] };
const axon = encode(original);
const decoded = decode(axon);
// decoded === original ✅
```

---

## Type Inference

AXON automatically infers optimal types:

| JavaScript Type | AXON Type | Range |
|----------------|-----------|-------|
| `42` (small int) | `u8` | 0-255 |
| `1000` (medium int) | `u16` | 0-65,535 |
| `100000` (large int) | `u32` | 0-4,294,967,295 |
| `-50` (negative) | `i8`, `i16`, `i32` | Signed integers |
| `3.14` (float) | `f32` | Floating point |
| `"text"` | `str` | String |
| `true/false` | `bool` | Boolean |
| `null` | `null` | Null |

---

## Mode Selection

When `mode: 'auto'` (default), AXON analyzes your data:

```
Data Analysis → Mode Selection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
>50% null values        → Sparse mode
Has timestamp field     → Stream mode
Large + numeric (100+)  → Columnar mode
Uniform array          → Compact mode
Complex object         → Nested mode
Non-uniform            → JSON mode (fallback)
```

---

## Error Handling

### Parse Errors

```typescript
try {
  const data = decode('invalid axon');
} catch (error) {
  console.error(error.message);
  // "Parse error at line 1, column 5: Expected value"
  console.error(error.line, error.column);
}
```

### Type Errors

```typescript
import { AXONTypeError } from '@axon-format/core';

try {
  // Invalid type scenario
} catch (error) {
  if (error instanceof AXONTypeError) {
    console.error('Type error:', error.path, error.expected, error.actual);
  }
}
```

---

## Performance

**Encoding Speed:** 2-3x slower than JSON (worth it for 60-95% token savings)

**Decoding Speed:** 2-3x slower than JSON

**Memory:** 2-3x higher during processing

**Trade-off:** Slightly slower for massive token savings

---

## See Also

- [Mode Selection Guide](../guide/modes.md)
- [Compression Guide](../guide/compression.md)
- [Schema System](schema.md)
