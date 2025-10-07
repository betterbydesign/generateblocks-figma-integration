# GenerateBlocks to Figma Design System Integration

Complete documentation and tooling for syncing GenerateBlocks patterns between WordPress and Figma.

## 📚 Documentation Overview

This repository contains everything you need to understand and implement a bidirectional sync between GenerateBlocks patterns and Figma components.

### Files Included

1. **[generateblocks-pattern-analysis.md](./generateblocks-pattern-analysis.md)** (11KB)
   - Complete technical analysis of GenerateBlocks architecture
   - How patterns are stored and managed
   - GenerateCloud sync system explanation
   - Pattern extraction methods (without installation required)

2. **[architecture-diagrams.md](./architecture-diagrams.md)** (7.2KB)
   - Visual Mermaid diagrams of system architecture
   - Pattern flow sequences
   - Cloud sync flow
   - Database schema

3. **[pattern-extractor.js](./pattern-extractor.js)** (11KB)
   - Working code examples for pattern extraction
   - Multiple extraction methods (REST API, MCP, direct DB)
   - Global styles fetching
   - Figma import integration

4. **[implementation-guide.md](./implementation-guide.md)** (14KB)
   - Step-by-step implementation instructions
   - MCP server integration
   - Pattern to Figma conversion
   - Bidirectional sync setup
   - CLI tool creation

## 🎯 Key Findings

### Where Patterns Come From

**Initial patterns you see in the dashboard come from REMOTE libraries:**
- Default: `https://patterns.generatepress.com`
- Authenticated with built-in public key
- **NOT stored in your database until you install them**

### How to Extract Patterns (Without Installation)

You have 3 options:

#### Option 1: Direct REST API (Recommended)
```javascript
fetch('https://patterns.generatepress.com/wp-json/generateblocks-pro/v1/pattern-library/patterns', {
  headers: { 'X-GB-Public-Key': 'NPhxc91jLH5yGB4Ni6KryXN6HKKggte0' }
})
```

#### Option 2: WordPress MCP Server
```javascript
wp_call_endpoint({
  site: 'patterns-library',
  endpoint: '/generateblocks-pro/v1/pattern-library/patterns',
  method: 'GET'
})
```

#### Option 3: Local Database Query
```sql
SELECT post_content, meta_value as pattern_tree
FROM wp_posts p
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
WHERE post_type = 'wp_block' AND meta_key = 'generateblocks_patterns_tree'
```

### Pattern Tree Structure

The magic happens in the **pattern tree metadata**:

```javascript
{
  "id": "pattern-123",
  "label": "Hero Section",
  "pattern": "<!-- wp:generateblocks/container -->...", // Block markup
  "preview": "<div class='gb-container'>...</div>",    // Rendered HTML ✨
  "scripts": ["accordion.js"],
  "styles": ["accordion-style.css"],
  "globalStyleSelectors": [".button-primary"],
  "categories": [1, 2, 3]
}
```

The `preview` field contains **fully rendered HTML** ready for Figma import!

## 🚀 Quick Start

### 1. Fetch a Pattern

```javascript
// Using the provided pattern-extractor.js
const patterns = await fetchRemotePatterns();
console.log(patterns[0].preview); // HTML ready for Figma
```

### 2. Import to Figma

```javascript
// Using html.to.design MCP
await import_html({
  html: patterns[0].preview,
  name: patterns[0].label
});
```

### 3. Fetch Global Styles

```javascript
const styles = await fetchGlobalStyles(
  'https://patterns.generatepress.com',
  'NPhxc91jLH5yGB4Ni6KryXN6HKKggte0'
);

// styles.individualStyles contains all CSS classes and their properties
```

## 🔄 How GenerateCloud Syncs Patterns

GenerateCloud uses a **public key authentication system** to sync patterns between sites:

1. **Provider Site** creates a public key and assigns permissions
2. **Consumer Site** adds the library using the public key
3. Patterns are fetched via REST API with public key in header
4. Global styles are synced separately
5. Patterns can be imported to consumer site database

**Important:** The cloud plugin doesn't automatically sync patterns - it provides the authentication framework. Pattern syncing happens through the REST API.

## 📊 Architecture Summary

```
Remote Pattern Library (patterns.generatepress.com)
    ↓ [REST API with Public Key]
GenerateBlocks Pro Plugin
    ↓ [Stores in]
WordPress Database (wp_block post type)
    ↓ [Contains]
Pattern Tree Metadata (generateblocks_patterns_tree)
    ↓ [Includes]
Rendered HTML Preview
    ↓ [Import to]
Figma via html.to.design
```

## 🛠️ Implementation Path

Follow this order for best results:

1. **Read** `generateblocks-pattern-analysis.md` to understand the system
2. **View** `architecture-diagrams.md` for visual understanding
3. **Test** code from `pattern-extractor.js` to fetch your first pattern
4. **Follow** `implementation-guide.md` for complete integration
5. **Build** your automated sync system

## 💡 Use Cases

### Design System Creation
Extract all patterns → Import to Figma → Create component library → Publish

### Pattern Development
Design in Figma → Export HTML → Convert to blocks → Save to WordPress

### Multi-Site Management
Central pattern library → Sync to multiple sites → Maintain consistency

### Client Deliverables
WordPress patterns ↔ Figma designs → Single source of truth

## 🔑 Key Endpoints

### Pattern Library
```
GET  /generateblocks-pro/v1/pattern-library/categories
GET  /generateblocks-pro/v1/pattern-library/patterns
GET  /generateblocks-pro/v1/pattern-library/get-global-style-data
POST /generateblocks-pro/v1/pattern-library/import-styles
```

### WordPress Core
```
GET  /wp/v2/blocks              # List patterns
GET  /wp/v2/blocks/{id}         # Get single pattern
POST /wp/v2/blocks              # Create pattern
POST /wp/v2/blocks/{id}         # Update pattern
```

## 📦 Pattern Data Structure

### WordPress Post
- **Type:** `wp_block`
- **Content:** Block markup (Gutenberg format)
- **Meta:** `generateblocks_patterns_tree` (serialized array)
- **Taxonomies:** 
  - `gblocks_pattern_collections` (e.g., "Local")
  - `wp_pattern_category` (e.g., "Hero", "CTA")

### Pattern Tree
- **Pattern:** Original block markup
- **Preview:** Rendered HTML (use this for Figma!)
- **Scripts:** Required JavaScript files
- **Styles:** Required CSS files  
- **Global Classes:** CSS class names used
- **Categories:** Associated category IDs

## 🎨 Style Management

Global styles are stored separately in `gblocks_styles` post type:

- **Selector:** CSS class name (e.g., `.button-primary`)
- **Data:** JSON style properties
- **CSS:** Compiled CSS output

These can be fetched and mapped to Figma text/color/effect styles.

## ⚡ Performance Tips

1. **Cache pattern data** - Patterns don't change often
2. **Batch imports** - Import multiple patterns at once
3. **Rate limiting** - Add delays between API calls
4. **Selective sync** - Only sync patterns that changed
5. **Lazy loading** - Load pattern previews on demand

## 🐛 Common Issues

### Pattern Tree Missing
**Problem:** Meta field `generateblocks_patterns_tree` is empty  
**Solution:** Re-save the pattern in WordPress to trigger tree generation

### Authentication Failed
**Problem:** REST API returns 401/403  
**Solution:** Check public key or Application Password credentials

### HTML Import Fails
**Problem:** Figma import produces incorrect layout  
**Solution:** Ensure CSS is included and HTML is well-formed

### Styles Not Applied
**Problem:** Pattern imports without styles  
**Solution:** Fetch and import global styles separately

## 📝 Next Steps

1. Set up WordPress MCP server with your site
2. Test pattern extraction using `pattern-extractor.js`
3. Configure Figma access and test html.to.design import
4. Implement bidirectional sync workflow
5. Automate with CI/CD for production use

## 🤝 Contributing

This is a documentation and tooling project. Feel free to:
- Add more extraction methods
- Improve HTML to blocks conversion
- Create additional automation tools
- Share your implementation experiences

## 📄 License

MIT - Use freely in your projects

---

**Created by:** Claude (Anthropic)  
**Date:** October 2025  
**Purpose:** GenerateBlocks ↔ Figma Design System Integration
