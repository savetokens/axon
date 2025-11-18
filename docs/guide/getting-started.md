# Getting Started with AXON

Welcome to AXON! This guide will get you up and running in 5 minutes.

## Installation

### Library

```bash
npm install @axon-format/core
```

### CLI Tool

```bash
npm install -g @axon-format/cli
```

---

## Your First AXON Encoding

### Using the Library

```typescript
import { encode, decode } from '@axon-format/core';

// Your data
const data = {
  users: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' }
  ]
};

// Encode to AXON
const axon = encode(data);
console.log(axon);
// Output:
// users::[2] id:u8|name:str|role:str
//   1|Alice|admin
//   2|Bob|user

// Decode back to JavaScript
const decoded = decode(axon);
console.log(decoded);
// Perfect round-trip! ✅
```

**Token Savings:** ~60% fewer tokens than JSON!

---

### Using the CLI

```bash
# Create a JSON file
echo '{
  "users": [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"}
  ]
}' > users.json

# Encode to AXON
axon encode users.json --stats

# Output shows:
# - AXON format
# - Token savings (60%!)
# - Statistics

# Decode back
axon decode users.axon -o users-decoded.json
```

---

## Next Steps

- **[API Reference](../api/encode-decode.md)** - Learn all the features
- **[CLI Guide](../api/cli.md)** - Master the command-line tool
- **[Compression](compression.md)** - Save even more tokens
- **[Examples](../examples/)** - Real-world use cases

---

## Quick Tips

1. **Use `stats` first** - See what AXON can do for your data
2. **Let AXON choose mode** - Automatic optimization
3. **Enable compression** - For large datasets
4. **Validate with schemas** - Catch errors early

**Ready to save tokens!** 🚀
