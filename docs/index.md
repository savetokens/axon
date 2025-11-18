---
layout: default
title: AXON Documentation
---

# AXON Documentation

**Adaptive eXchange Oriented Notation**

> Token-efficient data serialization for Large Language Models

---

## 🚀 Quick Start

```bash
# Install
npm install @axon-format/core

# Or use CLI
npm install -g @axon-format/cli
```

```typescript
import { encode, decode } from '@axon-format/core';

const data = {
  users: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' }
  ]
};

const axon = encode(data);
// users::[2] id:u8|name:str|role:str
//   1|Alice|admin
//   2|Bob|user

// 60% token savings vs JSON!
```

---

## 📖 Documentation

### **Getting Started**
- [Installation & First Steps](guide/getting-started.md)
- [5-Minute Tutorial](guide/tutorial.md)
- [Core Concepts](guide/concepts.md)

### **Guides**
- [Compression Guide](guide/compression.md) - Save 90-99% tokens
- [Mode Selection](guide/modes.md) - 6 modes explained
- [Type System](guide/types.md) - 13 types with validation
- [Schema System](guide/schemas.md) - Reusable structures

### **API Reference**
- [encode() & decode()](api/encode-decode.md) - Core API
- [Compression](api/compression.md) - 5 algorithms
- [Schema API](api/schema.md) - Validation system
- [CLI Reference](api/cli.md) - Command-line tool

### **Examples**
- [RAG Pipeline](examples/rag-pipeline.md) - Save 70% on queries
- [Analytics](examples/analytics.md) - Time-series optimization
- [API Integration](examples/api-integration.md) - Convert responses
- [More Examples →](examples/)

---

## 💰 Why AXON?

```
┌─────────────────────────────────────────────────────────────┐
│  Token Comparison (1000-row dataset)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  JSON    ███████████████████████████  ~10,000 tokens       │
│  CSV     ████████████                 ~6,000 tokens         │
│  AXON    ████                         ~2,000 tokens      ✅ │
│                                                             │
│  With compression: 80% reduction vs JSON, 67% vs CSV        │
└─────────────────────────────────────────────────────────────┘
```

**Real Savings:**
- 1,000 API calls with JSON: **$100**
- 1,000 API calls with AXON: **$20**
- **You save: $80** 💰

---

## ✨ Key Features

**6 Adaptive Modes**
- Compact, Nested, Columnar, Stream, Sparse, JSON
- Automatic selection based on data

**13 Data Types**
- Integers, floats, strings, booleans
- Dates, times, ISO-8601 timestamps
- UUIDs (standard + 39% shorter format)
- Enums, references

**5 Compression Algorithms**
- RLE: 90-99% reduction for repeated values
- Dictionary: 60-80% for limited unique values
- Delta: 50-75% for sequential data
- Bit packing: 93-95% for boolean arrays
- Varint: 60-75% for small integers

**Schema System**
- Type-safe validation
- Schema inheritance
- 100% accurate (vs LLM-based validation)

---

## 🎯 Use Cases

**When AXON Shines:**
- ✅ RAG pipelines (70-90% token reduction)
- ✅ Analytics dashboards (75-85% reduction)
- ✅ Large datasets (>100 rows)
- ✅ Repeated or categorical data
- ✅ Type safety required
- ✅ Nested objects or complex structures

**When CSV is simpler:**
- ⚠️ Tiny simple tables (<50 rows)
- ⚠️ No nesting needed
- ⚠️ No validation required

---

## 📊 Proven Results

| Scenario | JSON | AXON | Savings |
|----------|------|------|---------|
| Small data (4 rows) | 144 tokens | 63 tokens | 56% |
| Analytics (7 rows) | 174 tokens | 70 tokens | 60% |
| Repeated values (1000) | 7,374 chars | 36 chars | **99.5%** 🚀 |
| Boolean flags (1000) | 5,685 chars | 250 chars | **95.6%** 🚀 |

*All measurements from real data*

---

## 🛠️ Tools

**CLI Tool:**
```bash
axon encode data.json --stats     # Convert & show savings
axon compare data.json            # Side-by-side comparison
axon stats data.json --show-hints # Analysis & recommendations
```

**Libraries:**
- [@axon-format/core](https://www.npmjs.com/package/@axon-format/core) - Core library
- [@axon-format/cli](https://www.npmjs.com/package/@axon-format/cli) - CLI tool

---

## 🤝 Community

- **GitHub:** [savetokens/axon](https://github.com/savetokens/axon)
- **Issues:** [Report bugs](https://github.com/savetokens/axon/issues)
- **Discussions:** [Ask questions](https://github.com/savetokens/axon/discussions)
- **npm:** [@axon-format](https://www.npmjs.com/org/axon-format)

---

## 📈 Status

```
Tests:      342 passing (93.51% coverage)
Features:   24 (Phases 1-3 complete)
Modes:      6 (adaptive selection)
Types:      13 (full validation)
Compression: 5 algorithms
vs JSON:    60-95% token reduction
vs CSV:     20-200x better (with compression on patterned data)
```

---

**Ready to save tokens?**

[Get Started →](guide/getting-started.md) | [View on GitHub →](https://github.com/savetokens/axon)
