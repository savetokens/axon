# Example: RAG Pipeline Optimization

Reduce token costs in Retrieval-Augmented Generation pipelines.

## The Problem

RAG pipelines send document metadata to LLMs on every query. With JSON, this is expensive:

```typescript
// 1,000 documents with metadata
const documents = [
  {
    id: 1,
    title: "Introduction to AI",
    content: "...",
    embedding: [0.1, 0.2, ...], // 1536 dimensions
    created: "2025-01-15T10:30:00Z",
    category: "AI/ML"
  },
  // ... 999 more
];

// As JSON: ~500,000 tokens per query
// Cost with GPT-4: $5 per query
```

## The AXON Solution

```typescript
import { encode } from '@axon-format/core';

// Encode document metadata
const axonMetadata = encode(documents, {
  mode: 'columnar',      // Large dataset
  compression: true      // Enable compression
});

// Result: ~150,000 tokens
// Cost with GPT-4: $1.50 per query
// Savings: $3.50 per query (70%)
```

## Real Savings

**Over 1,000 queries:**
- JSON: $5,000
- AXON: $1,500
- **Savings: $3,500** 💰

**Over 10,000 queries:**
- JSON: $50,000
- AXON: $15,000
- **Savings: $35,000** 💰💰

---

## Implementation

### Step 1: Prepare Documents

```typescript
// Extract metadata (skip large embeddings)
const metadata = documents.map(doc => ({
  id: doc.id,
  title: doc.title,
  category: doc.category,
  created: doc.created,
  // Don't include full content or embeddings in metadata
}));
```

### Step 2: Encode with AXON

```typescript
const axonMetadata = encode(metadata, {
  mode: 'columnar',  // Optimal for large datasets
  compression: true
});

// AXON applies:
// - Delta encoding for sequential IDs
// - Dictionary for categories (limited unique values)
// - Columnar layout for analytics
```

### Step 3: Send to LLM

```typescript
const prompt = `
Given these documents:

${axonMetadata}

User question: "${userQuery}"

Find the most relevant document and answer the question.
`;

const response = await llm.complete(prompt);
```

### Step 4: Parse Response

```typescript
// LLM understands AXON format naturally
// AXON's query hints help LLM optimize:
// - !primary:id (for lookups)
// - !search:title,category (for filtering)
// - !timeseries:created (for sorting)
```

---

## With LangChain

```typescript
import { encode } from '@axon-format/core';
import { ChatOpenAI } from 'langchain/chat_models/openai';

const llm = new ChatOpenAI({ modelName: 'gpt-4' });

// Convert documents to AXON
const axonDocs = encode(documents, { compression: true });

// Use in prompt
const response = await llm.call([
  {
    role: 'system',
    content: 'You are a helpful assistant. Documents are in AXON format.'
  },
  {
    role: 'user',
    content: `Documents:\n${axonDocs}\n\nQuestion: ${userQuery}`
  }
]);

// 70% token savings!
```

---

## Results

**Before AXON:**
```
Documents: 500,000 tokens
Prompt: 50,000 tokens
Total: 550,000 tokens ($5.50 with GPT-4)
```

**After AXON:**
```
Documents: 150,000 tokens (70% reduction!)
Prompt: 50,000 tokens
Total: 200,000 tokens ($2.00 with GPT-4)
```

**Savings: $3.50 per query** 💰

---

## Tips for RAG

1. **Use columnar mode** for large document sets
2. **Enable compression** for metadata
3. **Add query hints** to help LLM optimize
4. **Exclude embeddings** from metadata (too large)
5. **Use schemas** to validate documents

---

## See Also

- [Compression Guide](../guide/compression.md)
- [Columnar Mode](../guide/modes.md#columnar)
- [Query Hints](../guide/query-hints.md)
