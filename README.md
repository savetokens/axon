<div align="center">

# AXON

**Adaptive eXchange Oriented Notation**

A compression layer for LLM tool outputs. Reduces token usage by 85-95% for structured data with repeated patterns.

[![npm](https://img.shields.io/npm/v/@axon-format/core?color=000)](https://npmjs.com/package/@axon-format/core)
[![tests](https://img.shields.io/badge/tests-405_passing-000)](https://github.com/savetokens/axon/actions)
[![coverage](https://img.shields.io/badge/coverage-93.5%25-000)](https://github.com/savetokens/axon)
[![license](https://img.shields.io/badge/license-MIT-000)](./LICENSE)

[Documentation](./docs) · [Benchmarks](#benchmarks) · [Contributing](./CONTRIBUTING.md)

</div>

---

## Quick Start

```bash
npm install @axon-format/core
```

```typescript
import { encode, decode } from '@axon-format/core';

const rows = await mcp.database.query("SELECT * FROM orders LIMIT 5000");
const data = { orders: rows };
// JSON: 234,000 tokens

const compressed = encode(data);
// AXON: 18,200 tokens (92% reduction)

const original = decode(compressed);
// Lossless round-trip: original.orders === rows
```

---

## Why AXON

Enterprise data has predictable patterns — status fields repeat thousands of times, IDs are sequential, categories come from small sets. JSON/CSV/XML encode every repetition individually.

AXON applies pattern-aware compression:

| Algorithm | Use Case | Example |
|-----------|----------|---------|
| **RLE** | Consecutive repeats | `active*800\|inactive*150` |
| **Dictionary** | Categorical values | `@d:[US,DE,UK]` → `0,1,0,2,0` |
| **Delta** | Sequential data | `1001\|+1\|+1\|+1` |
| **Bit Packing** | Booleans | `0xB6DB6DB6...` |

---

## Benchmarks

| Dataset | Records | JSON Tokens | AXON Tokens | Reduction |
|---------|---------|-------------|-------------|-----------|
| Salesforce Accounts | 1,000 | 52,340 | 4,891 | 90.7% |
| PostgreSQL Orders | 5,000 | 234,112 | 18,205 | 92.2% |
| Nginx Access Logs | 10,000 | 412,850 | 8,412 | 98.0% |
| Time-series Metrics | 8,760 | 156,444 | 12,388 | 92.1% |

```bash
npx @axon-format/cli analyze ./your-data.json
```

---

## Use Cases

### Tool/Function Returns

```typescript
import { encode, decode } from "@axon-format/core";

// Wrap large query results before returning to LLM
async function getOrders(limit: number) {
  const rows = await db.query(`SELECT * FROM orders LIMIT ${limit}`);
  return encode({ orders: rows });
}

// LLM receives compressed AXON, can decode if needed
const data = decode(compressedResponse);
```

### Multi-Agent Communication

```typescript
import { encode, decode } from "@axon-format/core";

// Agent A: Compress before sending
const payload = encode({ results: analysisResults });
await channel.send("agent-b", payload);

// Agent B: Decompress on receive
const { results } = decode(await channel.receive());
```

### XML/RSS/SOAP Integration

```typescript
import { xmlToAxon, axonToXml } from "@axon-format/core";

const compressed = xmlToAxon(await fetch(feedUrl).then(r => r.text()));
const xmlOutput = axonToXml(compressed); // Convert back when needed
```

---

## API

```typescript
import { encode, decode, getModeRecommendation } from "@axon-format/core";

// Data should be an object with named arrays
const data = {
  users: [
    { id: 1, name: "Alice", status: "active" },
    { id: 2, name: "Bob", status: "active" },
  ]
};

// Encode (auto mode selection by default)
const compressed = encode(data);

// Decode
const original = decode(compressed);
// original.users[0].name === "Alice"

// Get mode recommendation with reasoning
const rec = getModeRecommendation(data);
// { mode: "compact", reason: "Uniform tabular data (2 rows)..." }
```

### Schema Validation

```typescript
import { registerSchema, validateAgainstSchema } from "@axon-format/core";

const schema = {
  name: 'User',
  fields: [
    { name: 'id', type: 'i32' },
    { name: 'email', type: 'str' },
    { name: 'plan', type: 'enum(free,pro,enterprise)' }
  ]
};

registerSchema(schema);
const result = validateAgainstSchema(data, schema);
```

### Supported Types

`u8` `u16` `u32` `i8` `i16` `i32` `f32` `f64` `bool` `str` `iso8601` `date` `time` `uuid` `enum(...)` `ref(...)`

---

## CLI

```bash
npm install -g @axon-format/cli

axon encode data.json -o data.axon    # Encode
axon decode data.axon -o data.json    # Decode
axon stats data.json --show-hints     # Analyze
```

---

## Adaptive Modes

AXON auto-selects the optimal encoding:

| Mode | Best For |
|------|----------|
| **Compact** | Small uniform arrays |
| **Nested** | Complex objects |
| **Columnar** | Large datasets (1000+ rows) |
| **Stream** | Time-series data |
| **Sparse** | >50% null values |

---

## LLM Compatibility

Tested on GPT, Claude, Gemini, Grok, DeepSeek, Llama, Mistral.

Output is human-readable:
```
orders::[500] status:enum|customer_id:i32|total:f32
@rle:status shipped*312|pending*142|cancelled*46
@delta:customer_id 1001|+1|+1|+2|+1...
```

---

## Packages

| Package | Description |
|---------|-------------|
| `@axon-format/core` | Core compression library |
| `@axon-format/cli` | Command-line interface |

---

## Roadmap

- [x] Core compression (RLE, Dictionary, Delta, Bit Packing)
- [x] TypeScript SDK with 13 types
- [x] CLI, Schema system, XML conversion
- [ ] Python SDK
- [ ] MCP middleware
- [ ] LangChain/LlamaIndex integration
- [ ] Go/Rust SDKs

---

## Contributing

```bash
git clone https://github.com/savetokens/axon.git
cd axon && pnpm install
pnpm test   # 405 tests
pnpm build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT

<div align="center">

[Documentation](./docs) · [GitHub](https://github.com/savetokens/axon) · [npm](https://npmjs.com/package/@axon-format/core)

</div>
