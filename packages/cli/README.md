# AXON CLI

Command-line tool for AXON format operations - encode, decode, validate, analyze, and compare.

## Installation

```bash
# Global installation
npm install -g @axon-format/cli

# Or use with npx (no installation)
npx @axon-format/cli encode data.json
```

## Commands

### `axon encode` - Convert JSON to AXON

Encodes JSON files to AXON format with automatic optimization.

**Basic Usage:**
```bash
axon encode input.json
```

**With Options:**
```bash
# Save to file
axon encode input.json -o output.axon

# Show statistics
axon encode input.json --stats

# Specify mode
axon encode input.json --mode columnar

# Enable compression
axon encode input.json --compression

# Use different delimiter
axon encode input.json --delimiter ","
```

**Real Example:**
```bash
$ axon encode examples/users.json --stats

✔ Encoding complete!

AXON Output:
────────────────────────────────────────────────────────────
users::[4] active:bool|email:str|id:u8|name:str|role:str
  true|alice@example.com|1|"Alice Johnson"|admin
  true|bob@example.com|2|"Bob Smith"|user
  false|charlie@example.com|3|"Charlie Brown"|user
  true|diana@example.com|4|"Diana Prince"|moderator
────────────────────────────────────────────────────────────

📊 Statistics:
  Format      Size       Tokens (est)
  ────────────────────────────────────
  JSON        574        ~144
  AXON        250        ~63
  ────────────────────────────────────
  Savings:    56.4%

📈 Data Info:
  Rows: 4
  Fields: 5
```

---

### `axon decode` - Convert AXON to JSON

Decodes AXON files back to JSON format.

**Basic Usage:**
```bash
axon decode input.axon
```

**With Options:**
```bash
# Save to file
axon decode input.axon -o output.json

# Compact JSON (no formatting)
axon decode input.axon --compact
```

**Real Example:**
```bash
$ axon decode examples/users.axon

✔ Decoding complete!

JSON Output:
────────────────────────────────────────────────────────────
{
  "users": [
    {
      "active": true,
      "email": "alice@example.com",
      "id": 1,
      "name": "Alice Johnson",
      "role": "admin"
    },
    ...
  ]
}
────────────────────────────────────────────────────────────

📊 Decoded Data:
  Type: Object
  Fields: 1
```

---

### `axon stats` - Analyze Data

Analyzes JSON data and shows encoding recommendations, compression opportunities, and query hints.

**Basic Usage:**
```bash
axon stats input.json
```

**With Options:**
```bash
# Show mode recommendations
axon stats input.json --show-modes

# Show compression analysis
axon stats input.json --show-compression

# Show query hints (LLM optimization)
axon stats input.json --show-hints

# Show everything
axon stats input.json --show-modes --show-compression --show-hints
```

**Real Example:**
```bash
$ axon stats examples/analytics.json --show-hints --show-compression

✔ Analysis complete!

📊 Data Analysis

Basic Info:
  Type: Array
  Length: 7 rows
  Fields: 5
  Field names: date, views, clicks, conversions, revenue

🎯 Recommended Mode:

  COMPACT
  Uniform tabular data (7 rows) - compact mode for efficient row storage

  Characteristics:
    • Is Array: true
    • Length: 7
    • Uniform: true
    • Numeric Heavy: true
    • Has Time Field: true
    • Sparsity: 0.0%

💰 Token Savings (estimated):

  JSON:   ~174 tokens (693 chars)
  AXON:   ~70 tokens (277 chars)
  Savings: 60.0%

🎯 Query Hints (for LLM optimization):

  !timeseries:date !aggregate:views,clicks,conversions,revenue

  Detected:
    • timeseries: date
    • aggregate: views, clicks, conversions, revenue

🗜️  Compression Opportunities:

  No obvious compression opportunities
  (Small dataset - compression more beneficial for 100+ rows)
```

---

### `axon compare` - Compare Formats

Compare AXON with JSON and CSV side-by-side.

**Basic Usage:**
```bash
axon compare input.json
```

**With Options:**
```bash
# Compare with CSV
axon compare input.json --format json,csv,axon
```

**Real Example:**
```bash
$ axon compare examples/users.json

✔ Comparison complete!

📊 Format Comparison

Format           Size (chars)  Tokens (est)  Reduction
────────────────────────────────────────────────────────────
JSON (pretty)             573           144           -
JSON (compact)            365            92       36.1%
AXON                      250            63       56.3%
────────────────────────────────────────────────────────────

📄 Preview (first 10 lines):

JSON (pretty):
  {
    "users": [
      {
        "id": 1,
        "name": "Alice Johnson",
        ...

AXON:
  users::[4] active:bool|email:str|id:u8|name:str|role:str
    true|alice@example.com|1|"Alice Johnson"|admin
    true|bob@example.com|2|"Bob Smith"|user
    ...
```

---

### `axon validate` - Validate AXON Files

Validates AXON file syntax.

**Basic Usage:**
```bash
axon validate input.axon
```

**With Schema (coming soon):**
```bash
axon validate input.axon --schema schema.axon
```

**Real Example:**
```bash
$ axon validate examples/users.axon

✔ Syntax validation passed!

✓ AXON file is syntactically valid

📊 File Info:
  Size: 250 chars
  Lines: 5
  Data type: Object
  Fields: 1

✓ Validation complete!
```

---

## Real-World Workflows

### Workflow 1: Convert API Response

```bash
# 1. Get API data
curl https://api.example.com/users > users.json

# 2. Convert to AXON
axon encode users.json -o users.axon --stats

# Result: 56.4% token savings

# 3. Use in LLM prompt
cat users.axon | your-llm-tool "Analyze these users..."
```

---

### Workflow 2: Analyze Before Encoding

```bash
# See what compression AXON can achieve
axon stats data.json --show-compression --show-hints

# Then encode with recommended settings
axon encode data.json -o data.axon --compression
```

---

### Workflow 3: Validate Round-Trip

```bash
# Encode
axon encode original.json -o data.axon

# Validate syntax
axon validate data.axon

# Decode back
axon decode data.axon -o decoded.json

# Verify identical
diff original.json decoded.json
# Should show no differences!
```

---

## Options Reference

### Global Options
- `--help` - Show help
- `--version` - Show version

### Encode Options
- `-o, --output <file>` - Output file
- `-m, --mode <mode>` - Mode (auto|compact|nested|columnar|stream|sparse)
- `-d, --delimiter <char>` - Delimiter (|,tab)
- `-c, --compression` - Enable compression
- `-s, --stats` - Show statistics

### Decode Options
- `-o, --output <file>` - Output file
- `--compact` - Compact JSON

### Stats Options
- `--show-modes` - Show all mode recommendations
- `--show-compression` - Show compression opportunities
- `--show-hints` - Show query hints

### Compare Options
- `--format <formats>` - Formats to compare (json,csv,axon)

---

## Tips

**Best Practices:**
- Use `stats` first to see potential savings
- Let AXON choose mode automatically (`--mode auto`)
- Enable compression for large datasets
- Use `compare` to visualize improvements

**Token Optimization:**
```bash
axon encode data.json --compression --mode auto
```

**Debugging:**
```bash
# Validate JSON first
cat data.json | jq .

# Check AXON syntax
axon validate output.axon
```

---

## Development

```bash
git clone https://github.com/savetokens/axon.git
cd axon
pnpm install
pnpm build
```

---

## Support

- **Issues:** [GitHub Issues](https://github.com/savetokens/axon/issues)
- **Docs:** [GitHub Wiki](https://github.com/savetokens/axon/wiki)
- **Discussions:** [GitHub Discussions](https://github.com/savetokens/axon/discussions)

---

## License

MIT © 2025 AXON Contributors
