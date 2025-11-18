# AXON Documentation

Complete documentation for AXON - the token-efficient data serialization format for LLMs.

## 📚 Table of Contents

### Getting Started
- **[Getting Started](guide/getting-started.md)** - Install and encode your first data
- [Quick Reference](guide/quick-reference.md) - Cheat sheet
- [FAQ](guide/faq.md) - Common questions

### Guides
- [Compression Guide](guide/compression.md) - Save 90-99% tokens
- [Mode Selection](guide/modes.md) - 6 modes explained
- [Type System](guide/types.md) - 13 types with validation
- [Schema System](guide/schemas.md) - Reusable validated structures
- [Query Hints](guide/query-hints.md) - LLM optimization

### API Reference
- [encode() & decode()](api/encode-decode.md) - Core functions
- [Compression API](api/compression.md) - 5 compression algorithms
- [Schema API](api/schema.md) - Schema registry and validation
- [Utilities](api/utilities.md) - Helper functions
- [CLI Reference](api/cli.md) - Command-line tool

### Examples
- [RAG Pipeline](examples/rag-pipeline.md) - Save 70% on document queries
- [Analytics Dashboard](examples/analytics.md) - Time-series optimization
- [API Integration](examples/api-integration.md) - Convert API responses
- [Schema Validation](examples/schema-validation.md) - Type-safe data

### Comparisons
- [AXON vs JSON](comparison/vs-json.md) - 60-95% token reduction
- [AXON vs CSV](comparison/vs-csv.md) - Best of both worlds
- [When to Use What](comparison/decision-guide.md) - Choose the right format

---

## 🚀 Quick Links

**Installation:**
```bash
npm install @axon-format/core
npm install -g @axon-format/cli
```

**First Example:**
```typescript
import { encode } from '@axon-format/core';

const axon = encode({ users: [{ id: 1, name: 'Alice' }] });
// 60% token savings!
```

**Live Demo:**
```bash
axon encode data.json --stats
```

---

## 📖 Documentation Structure

```
docs/
├── guide/          # Learning materials
├── api/            # API reference
├── examples/       # Real-world examples
└── comparison/     # Format comparisons
```

---

## 🤝 Contributing to Docs

Found an error or want to improve docs?

1. Edit the relevant .md file
2. Submit a pull request
3. We'll review and merge

---

## 📬 Need Help?

- [GitHub Issues](https://github.com/savetokens/axon/issues)
- [GitHub Discussions](https://github.com/savetokens/axon/discussions)

---

**Start saving tokens!** 🚀
