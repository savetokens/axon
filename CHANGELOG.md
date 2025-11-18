# Changelog

All notable changes to AXON will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.2] - 2025-01-17

### Changed

**Strategic Repositioning:**
- Repositioned AXON as competing against industry standards (JSON/CSV)
- Updated CLI `compare` command to support CSV format comparisons
- Completely rewrote all documentation with JSON/CSV focus
- New value proposition: "Best of both worlds - CSV's compactness + JSON's flexibility"

**Updated Packages:**
- @axon-format/core@0.5.1 - Updated demo-comparison.ts with CSV examples
- @axon-format/cli@0.5.2 - CLI compare command now supports `--format json,csv,axon`

**Documentation:**
- Main README rewritten with professional JSON/CSV comparisons
- Updated all comparison charts and performance benchmarks
- Clearer positioning against established, widely-used formats
- Added comprehensive real-world comparison examples

### Removed
- Removed outdated comparison demos and tests
- Cleaned up legacy format references from all documentation

---

## [0.5.0-beta.1] - 2025-11-16

### 🎉 Initial Beta Release

First public release of AXON with core features, advanced types, compression, and CLI tool.

### Added

**Core Library (@axon-format/core)**

**Encoding Modes (6):**
- Compact mode for uniform arrays
- Nested mode for complex objects (arbitrary depth)
- Columnar mode for large datasets (1000+ rows)
- Stream mode for time-series data
- Sparse mode for null-heavy data (>50% nulls)
- JSON compatibility mode (fallback)

**Type System (13 types):**
- Integer types: i8, i16, i32, i64, u8, u16, u32, u64
- Float types: f32, f64
- Primitives: str, bool, null
- Temporal types: date, time, iso8601 (with validation)
- UUID types: uuid (standard), uuid-short (Base62, 39% smaller)
- Enum types: inline enums with validation
- Reference types: ref(table) for foreign keys

**Schema System:**
- Schema registry for reusable structures
- Schema validation with type checking
- Schema inheritance with @extends
- Validates all 13 types automatically

**Compression (5 algorithms):**
- RLE (Run-Length Encoding) - 90-99% reduction for repeated values
- Dictionary - 60-80% reduction for limited unique values
- Delta encoding - 50-75% reduction for sequential data
- Bit packing - 93-95% reduction for boolean arrays
- Varint - 60-75% savings for small integers

**Adaptive Features:**
- Automatic mode selection based on data characteristics
- Query hints generation (6 types: primary, search, timeseries, aggregate, join, index)
- Summary statistics calculation (sum, avg, min, max, median, stddev, count, distinct)

**CLI Tool (@axon-format/cli)**

**Commands:**
- `axon encode` - Convert JSON to AXON
- `axon decode` - Convert AXON to JSON
- `axon stats` - Analyze data and show recommendations
- `axon compare` - Compare AXON with JSON/CSV
- `axon validate` - Validate AXON syntax

**Features:**
- Colored output for better readability
- Progress indicators
- Statistics display (token savings, compression analysis)
- Mode recommendations
- Query hints detection
- Compression opportunity analysis

### Metrics

- **Tests:** 342 passing (93.51% coverage)
- **Features:** 24 major features
- **Token Savings:** 60-95% vs JSON, 20-200x vs CSV (with compression)
- **Modes:** 6 (automatic selection)
- **Types:** 13 (full validation)
- **Compression:** 5 algorithms

### Performance

- Encoding: ~2-3x slower than JSON (worth it for 60-95% token savings)
- Decoding: ~2-3x slower than JSON
- Memory: ~2-3x higher during processing
- Token Savings: 60-95% reduction vs JSON

### Known Limitations

- Arrays of objects inside objects use inline format (not compact mode)
- Optional fields with null not yet supported in compact mode
- Token counting uses character estimation (real tokenizer in future update)

---

## [Unreleased]

### Planned

- Token counting with tiktoken (exact token measurements)
- Performance benchmarks
- VS Code extension
- Python implementation
- Documentation website
- Interactive playground

---

## Version History

- **0.5.0-beta.1** - Initial beta release (2025-01-15)

---

**Note:** Version 0.5.0 indicates beta status. Version 1.0.0 will be released after community feedback and stabilization.
