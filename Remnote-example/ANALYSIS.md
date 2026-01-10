# RemNote Export Structure Analysis

**File**: `RemNoteExport_Eden_ye_json_2025-10-26_09-13.rem`
**Date**: 2025-10-26
**Purpose**: Understand RemNote's hierarchical notes, portals, and relationships for RAGAnything denormalization

---

## Executive Summary

RemNote exports are ZIP archives containing JSON files. The main `rem.json` contains a flat array of "docs" (notes/rems) with cross-references via IDs. The system uses:

1. **Hierarchical parent-child relationships** via `parent` and `children` fields
2. **Portal system** (like transclusions/embeds) via `portalsIn`
3. **Type/Tag relationships** via `tp` (typeParents) and `typeChildren`
4. **Rich content** in `key` field with support for references and special content types

---

## File Structure

### Archive Contents
```
RemNoteExport_Eden_ye_json_2025-10-26_09-13.rem (ZIP file)
├── rem.json (1.3MB) - Main content, note hierarchy
├── cards.json (16KB) - Spaced repetition flashcards
├── spaced_repetition_scheduler.json (3KB)
├── knowledgebase_local_stored_data.json (46KB)
├── local_stored_data.json (11KB)
├── knowledge_base_data.json (88KB)
├── user_data.json (1MB)
└── metadata.json (2KB)
```

**Focus**: `rem.json` contains the note hierarchy and relationships

---

## Core Data Model

### Document Structure

Each document (rem) in the `docs` array has this structure:

```json
{
  "_id": "unique_id_string",
  "key": ["Note Title"] | [{"i":"type", "_id":"ref_id"}],
  "parent": ["parent_id_1", "parent_id_2", ...] | null,
  "children": ["child_id_1", "child_id_2", ...],
  "subBlocks": ["ordered_child_id_1", ...],
  "type": entity | relationship | entity and relationship | null,
  "tp": {"type_doc_id": {"t": true, ",u": timestamp}, ...},
  "typeChildren": ["doc_id_1", "doc_id_2", ...],
  "references": [{"q": "target_id", "f": "key|value"}, ...],
  "createdAt": timestamp,
  "u": last_updated_timestamp,
  ...
}
```

### Key Fields Explained

#### 1. Hierarchy Fields

**`parent`**:
- ID of parent document
- `null` for root-level documents
- Example: `"parent": "NHhmbT3NTkn9prQjL"` or `"parent": null`

**`children`**:
- Array of child document IDs (unordered)
- Example: `"children": ["StTZP4bWF2fEksjJ9", "433cp92JcMrLMPoBo", ...]`

**`subBlocks`**:
- Ordered array of children (display order)
- Same IDs as `children` but in specific sequence
- Example: `"subBlocks": ["MywNAh9wsAz8P82iE", "8f6qcnnQhmZQxg2Lw", ...]`

**Tree Traversal**: Use `parent` for upward navigation, `children`/`subBlocks` for downward

---

#### 2. Portal System (Transclusion/Embedding)

**`portalsIn`**:
- Array of document IDs where this document is embedded/referenced as a portal
- A "portal" is like embedding/transcluding content from one note into another
- Example: `"portalsIn": ["PaMW89YtWS224q2h6", "REogBNCXSfQy3iLkJ"]`

**How it works**:
```
Document A (ID: doc_a)
├─ Contains portal reference to Document B

Document B (ID: doc_b)
├─ portalsIn: ["doc_a"]  <- Shows that doc_a embeds it
```

**Use case for RAG**: Portal relationships indicate strong semantic connections - a document that's frequently portal'd is likely a key concept

---

#### 3. Type System and Relationships

**`tp` (typeParents)**:
- Object mapping type document IDs to relationship metadata
- Indicates this document is an instance/child of those types
- Example: `"tp": {"qKs7HkDmpLSvhQchn": {"t": true, ",u": 1711746186384}}`
- **The `~Pro` pattern**: Uses type system for tagging/categorization

**`typeChildren`**:
- Array of document IDs that are instances of this document (when used as a type)
- Example: `"typeChildren": ["10OXhPAEVyMU8zQTm", "1uq33gtVYcmr91rLT", ...]`

**Relationship Model**:
```
"System Design" (Type/Tag)
├─ typeChildren: ["Document A", "Document B", ...]

"Document A"
├─ tp: {"System Design": {"t": true}}
```

This is how `~Pro`, `~Topic`, `~Concept` work - they're type documents that tag other documents

**`references`**:
- Array showing where this document is referenced
- Each reference includes: `{"q": "target_doc_id", "f": "key|value"}`
- `f` indicates whether referenced in key (title) or value (content)
- Example: `"references": [{"q": "jdoTRby8YA62ZW8hp", "f": "key"}]`

---

#### 4. Rich Content in `key` Field

The `key` field can contain:

**Simple text**:
```json
{
  "key": ["System Design"]
}
```

**Rich content with references**:
```json
{
  "key": [
    {"i": "q", "_id": "v6WYdBQtrYHgG624Y"}
  ]
}
```

Where `i` indicates content type:
- `"q"`: Reference/link to another document
- Other types: TODO, images, code blocks, etc.

**Mixed content** (text + references):
```json
{
  "key": [
    "This is a note about ",
    {"i": "q", "_id": "some_doc_id"},
    " and more text"
  ]
}
```

---

## Denormalization Strategy for RAGAnything

### Problem Statement
RAGAnything processes flat documents but RemNote has:
- Deep hierarchical nesting
- Portal (transclusion) relationships
- Type/tag relationships (`~Pro`, `~Topic`, etc.)
- Rich inline references

**Goal**: Denormalize these into a format suitable for RAGAnything entity extraction and graph building

---

### Recommended Denormalization Approach

#### 1. **Flatten Hierarchy with Context**

Each document should include its full hierarchical path:

```json
{
  "doc_id": "child_doc_id",
  "title": "Child Note",
  "content": "Note content",
  "hierarchy_path": [
    {"id": "root_id", "title": "Root"},
    {"id": "parent_id", "title": "Parent"},
    {"id": "child_doc_id", "title": "Child Note"}
  ],
  "depth": 2,
  "parent_titles": ["Root", "Parent"]
}
```

**Rationale**: Provides context for entity extraction - "Database Design > Normalization > 3NF" is more informative than just "3NF"

---

#### 2. **Resolve Portal References**

Expand `portalsIn` relationships:

**Original**:
```json
{
  "_id": "concept_a",
  "key": ["Important Concept"],
  "portalsIn": ["doc_1", "doc_2", "doc_3"]
}
```

**Denormalized**:
```json
{
  "doc_id": "concept_a",
  "title": "Important Concept",
  "embedded_in": [
    {"id": "doc_1", "title": "Chapter 1", "path": "Book/Chapter 1"},
    {"id": "doc_2", "title": "Summary", "path": "Book/Summary"},
    {"id": "doc_3", "title": "References", "path": "Appendix/References"}
  ],
  "portal_count": 3
}
```

**For RAGAnything**:
- High portal count indicates central/important concepts
- Portal relationships = strong semantic links → should become graph edges
- Can create `EMBEDDED_IN` or `REFERENCES` relationship types

---

#### 3. **Expand Type Relationships**

Convert `tp` and `typeChildren` to explicit tags/categories:

**Original**:
```json
{
  "_id": "doc_a",
  "key": ["Database Normalization"],
  "tp": {
    "system_design_tag": {"t": true},
    "pro_tag": {"t": true}
  }
}
```

**Denormalized**:
```json
{
  "doc_id": "doc_a",
  "title": "Database Normalization",
  "tags": ["System Design", "Pro"],
  "tag_ids": ["system_design_tag", "pro_tag"],
  "categories": [
    {"type": "Topic", "value": "System Design"},
    {"type": "Proficiency", "value": "Pro"}
  ]
}
```

**For RAGAnything**:
- Tags become entity attributes
- Can create `HAS_TAG` or `BELONGS_TO_CATEGORY` relationships
- `~Pro` pattern becomes `{"type": "Proficiency", "value": "Pro"}`

---

#### 4. **Resolve Inline References in Content**

Parse rich `key` content to resolve references:

**Original**:
```json
{
  "key": [
    "See ",
    {"i": "q", "_id": "concept_x_id"},
    " for more details"
  ]
}
```

**Denormalized**:
```json
{
  "content_text": "See [[Concept X]] for more details",
  "content_html": "See <a href='concept_x_id'>Concept X</a> for more details",
  "inline_references": [
    {
      "target_id": "concept_x_id",
      "target_title": "Concept X",
      "position": 4
    }
  ]
}
```

**For RAGAnything**:
- Inline references = explicit entity relationships
- Can create `REFERENCES` or `LINKS_TO` relationships
- Preserves link context (what's being discussed when reference appears)

---

#### 5. **Include Relationship Metadata**

Add metadata for relationship strength/type:

```json
{
  "doc_id": "doc_a",
  "relationships": [
    {
      "type": "CHILD_OF",
      "target_id": "parent_id",
      "target_title": "Parent Doc",
      "strength": 1.0
    },
    {
      "type": "PORTAL_IN",
      "target_id": "embedding_doc_id",
      "target_title": "Embedding Doc",
      "strength": 0.8
    },
    {
      "type": "TAGGED_AS",
      "target_id": "tag_id",
      "target_title": "System Design",
      "strength": 0.6
    },
    {
      "type": "REFERENCES",
      "target_id": "ref_doc_id",
      "target_title": "Related Concept",
      "strength": 0.5
    }
  ]
}
```

---

### Complete Denormalized Document Example

**Original RemNote Document**:
```json
{
  "_id": "doc_123",
  "key": ["3NF Normalization"],
  "parent": "normalization_parent_id",
  "children": ["example_1_id", "example_2_id"],
  "portalsIn": ["chapter_5_id", "summary_id"],
  "tp": {
    "database_design_tag": {"t": true},
    "advanced_tag": {"t": true}
  },
  "references": [{"q": "2nf_doc_id", "f": "key"}],
  "createdAt": 1625705252869
}
```

**Denormalized for RAGAnything**:
```json
{
  "id": "doc_123",
  "title": "3NF Normalization",
  "content": "Third Normal Form (3NF) eliminates transitive dependencies...",

  "hierarchy": {
    "path": ["Database Design", "Normalization", "3NF Normalization"],
    "path_ids": ["root_id", "normalization_parent_id", "doc_123"],
    "depth": 2,
    "parent_id": "normalization_parent_id",
    "parent_title": "Normalization",
    "children_ids": ["example_1_id", "example_2_id"],
    "children_titles": ["Example 1", "Example 2"]
  },

  "portals": {
    "embedded_in": [
      {
        "id": "chapter_5_id",
        "title": "Chapter 5: Advanced Normalization",
        "path": "Textbook/Chapter 5"
      },
      {
        "id": "summary_id",
        "title": "Course Summary",
        "path": "Course/Summary"
      }
    ],
    "embed_count": 2
  },

  "tags": ["Database Design", "Advanced"],
  "tag_details": [
    {"id": "database_design_tag", "name": "Database Design", "type": "topic"},
    {"id": "advanced_tag", "name": "Advanced", "type": "difficulty"}
  ],

  "references": [
    {
      "target_id": "2nf_doc_id",
      "target_title": "2NF Normalization",
      "reference_type": "prerequisite",
      "field": "key"
    }
  ],

  "relationships": [
    {"type": "CHILD_OF", "target": "normalization_parent_id", "strength": 1.0},
    {"type": "HAS_CHILD", "target": "example_1_id", "strength": 1.0},
    {"type": "HAS_CHILD", "target": "example_2_id", "strength": 1.0},
    {"type": "EMBEDDED_IN", "target": "chapter_5_id", "strength": 0.8},
    {"type": "EMBEDDED_IN", "target": "summary_id", "strength": 0.8},
    {"type": "TAGGED_AS", "target": "database_design_tag", "strength": 0.6},
    {"type": "TAGGED_AS", "target": "advanced_tag", "strength": 0.6},
    {"type": "BUILDS_ON", "target": "2nf_doc_id", "strength": 0.7}
  ],

  "metadata": {
    "created_at": "2021-07-08T06:47:32.869Z",
    "source": "remnote_export",
    "original_id": "doc_123"
  }
}
```

---

## RAGAnything Integration Strategy

### Step 1: Extract and Denormalize

```python
def denormalize_remnote_export(rem_json_path):
    """
    Convert RemNote hierarchical export to flat, denormalized documents
    """
    with open(rem_json_path) as f:
        data = json.load(f)

    docs = data['docs']
    doc_map = {doc['_id']: doc for doc in docs}

    denormalized = []

    for doc in docs:
        # Build hierarchy path
        path = build_hierarchy_path(doc, doc_map)

        # Resolve portals
        portal_info = resolve_portals(doc, doc_map)

        # Extract tags/types
        tags = extract_tags(doc, doc_map)

        # Parse rich content
        content = parse_rich_content(doc['key'], doc_map)

        # Build relationships
        relationships = build_relationships(doc, doc_map)

        denormalized.append({
            'id': doc['_id'],
            'title': extract_title(doc['key']),
            'content': content,
            'hierarchy': path,
            'portals': portal_info,
            'tags': tags,
            'relationships': relationships,
            'metadata': extract_metadata(doc)
        })

    return denormalized
```

### Step 2: Feed to RAGAnything

```python
from raganything import RAGAnything

# Initialize RAGAnything
rag = RAGAnything(
    mode='multimodal',  # Support text + future images
    entity_types=['Concept', 'Topic', 'Tag', 'Document'],
    relationship_types=[
        'CHILD_OF', 'HAS_CHILD',
        'EMBEDDED_IN', 'EMBEDS',
        'TAGGED_AS', 'HAS_TAG',
        'REFERENCES', 'BUILDS_ON'
    ]
)

# Process denormalized documents
denormalized_docs = denormalize_remnote_export('rem.json')

for doc in denormalized_docs:
    # RAGAnything extracts entities from denormalized content
    rag.add_document(
        content=doc['content'],
        metadata={
            'id': doc['id'],
            'title': doc['title'],
            'hierarchy_path': doc['hierarchy']['path'],
            'tags': doc['tags'],
            'pre_extracted_relationships': doc['relationships']
        }
    )
```

### Step 3: Enhance with Pre-extracted Relationships

RAGAnything will extract entities from text, but we can **enhance** with RemNote's explicit relationships:

```python
# After RAGAnything processes documents
for doc in denormalized_docs:
    for rel in doc['relationships']:
        rag.add_relationship(
            source_id=doc['id'],
            target_id=rel['target'],
            relationship_type=rel['type'],
            strength=rel['strength'],
            source='remnote_structure'  # Mark as pre-extracted
        )
```

**Benefit**: Combines LLM-extracted entities (from content) with explicit structure (from RemNote's data model)

---

## Key Insights for RAGAnything Processing

### 1. **Multi-Level Context**
RemNote hierarchy provides multiple levels of context:
- **Document title**: Direct content
- **Parent titles**: Categorical context
- **Path**: Full conceptual lineage
- **Portal embeds**: Usage context

Feed all levels to entity extraction for richer understanding

### 2. **Explicit vs Implicit Relationships**

**Explicit** (from data model):
- Parent-child hierarchy
- Portal embeddings
- Type/tag assignments
- Inline references

**Implicit** (extract with RAGAnything):
- Semantic similarity
- Thematic connections
- Conceptual dependencies

Combine both for comprehensive knowledge graph

### 3. **Portal Weight**
Documents with high `portalsIn` count are:
- Frequently referenced concepts
- Central to knowledge structure
- Should have higher entity importance/centrality

Use portal count as entity ranking signal

### 4. **Tag Taxonomy**
The `~Pro`, `~Topic` pattern creates taxonomy:
```
~Topic: System Design
  ├─ ~SubTopic: Database Design
  │   └─ Document: "3NF Normalization"
  └─ ~SubTopic: API Design
      └─ Document: "REST vs GraphQL"

~Proficiency: Pro
  └─ All documents tagged as professional-level
```

Preserves knowledge organization in graph structure

---

## Implementation Checklist

- [ ] Extract ZIP archive
- [ ] Parse `rem.json`
- [ ] Build document ID → document map
- [ ] For each document:
  - [ ] Traverse `parent` chain to build hierarchy path
  - [ ] Resolve `children` IDs to titles
  - [ ] Resolve `portalsIn` IDs to embedding document info
  - [ ] Extract `tp` types and resolve to tag names
  - [ ] Parse `key` field for rich content and inline references
  - [ ] Build relationship list with types and strengths
- [ ] Create denormalized JSON output
- [ ] Feed to RAGAnything with metadata
- [ ] Add pre-extracted relationships to graph

---

## Sample Code Snippets

### Build Hierarchy Path

```python
def build_hierarchy_path(doc, doc_map):
    path = []
    path_ids = []
    current = doc

    while current:
        title = extract_title(current['key'])
        path.insert(0, title)
        path_ids.insert(0, current['_id'])

        parent_id = current.get('parent')
        if parent_id:
            current = doc_map.get(parent_id)
        else:
            break

    return {
        'path': path,
        'path_ids': path_ids,
        'depth': len(path) - 1
    }
```

### Resolve Portals

```python
def resolve_portals(doc, doc_map):
    portals_in = doc.get('portalsIn', [])

    embedded_in = []
    for portal_id in portals_in:
        portal_doc = doc_map.get(portal_id)
        if portal_doc:
            embedded_in.append({
                'id': portal_id,
                'title': extract_title(portal_doc['key']),
                'path': '/'.join(build_hierarchy_path(portal_doc, doc_map)['path'])
            })

    return {
        'embedded_in': embedded_in,
        'embed_count': len(embedded_in)
    }
```

### Parse Rich Content

```python
def parse_rich_content(key_field, doc_map):
    if not key_field:
        return ""

    parts = []
    inline_refs = []

    for item in key_field:
        if isinstance(item, str):
            parts.append(item)
        elif isinstance(item, dict) and item.get('i') == 'q':
            # Reference to another document
            ref_id = item.get('_id')
            ref_doc = doc_map.get(ref_id)
            ref_title = extract_title(ref_doc['key']) if ref_doc else ref_id

            parts.append(f"[[{ref_title}]]")
            inline_refs.append({
                'target_id': ref_id,
                'target_title': ref_title
            })

    return ''.join(parts), inline_refs
```

---

## Conclusion

RemNote's export format provides rich structured data through:
1. **Hierarchical parent-child relationships** for context
2. **Portal system** for cross-document embeddings
3. **Type/tag system** for categorization (`~Pro`, etc.)
4. **Inline references** for explicit semantic links

**For RAGAnything integration**:
- Denormalize to flat documents with embedded context
- Preserve all relationship types as pre-extracted graph edges
- Use hierarchy paths and portal counts as entity importance signals
- Combine explicit structure with LLM-extracted implicit relationships

This approach leverages RemNote's explicit knowledge structure while allowing RAGAnything's AI to discover additional semantic connections.
