# GenerateBlocks Pattern Extraction - Quick Reference

## 🎯 The Big Answer to Your Question

**"Where do initial patterns come from?"**

They come from **remote hosted pattern libraries** at:
- `https://patterns.generatepress.com` (or legacy domain)
- Fetched via REST API using built-in public key
- **NOT in your database until you click "Install"**

## 🔍 How to Extract Without Installing

### Method 1: REST API (Easiest)
```bash
curl 'https://patterns.generatepress.com/wp-json/generateblocks-pro/v1/pattern-library/patterns' \
  -H 'X-GB-Public-Key: NPhxc91jLH5yGB4Ni6KryXN6HKKggte0'
```

### Method 2: WordPress MCP
```javascript
wp_call_endpoint({
  site: 'patterns-library',
  endpoint: '/generateblocks-pro/v1/pattern-library/patterns',
  method: 'GET'
})
```

### Method 3: Direct DB (Local Patterns Only)
```sql
SELECT pm.meta_value FROM wp_postmeta pm
WHERE pm.meta_key = 'generateblocks_patterns_tree'
```

## 📦 What You Get Back

```json
{
  "id": "pattern-123",
  "label": "Hero Section",
  "pattern": "<!-- wp:generateblocks/... -->",  ← Block markup
  "preview": "<div>...</div>",                  ← Use this for Figma! ✨
  "scripts": ["accordion.js"],
  "styles": ["style.css"],
  "globalStyleSelectors": [".button-primary"],
  "categories": [1, 2]
}
```

## 🎨 Import to Figma

```javascript
// The preview field has fully rendered HTML!
import_html({
  html: pattern.preview,
  name: pattern.label
});
```

## 🔄 How Cloud Sync Works

```
Site A (Provider)
   ↓ Creates public key
   ↓ Assigns permissions
Site B (Consumer)
   ↓ Adds library with key
   ↓ Fetches patterns via API
   ↓ Imports to local DB
```

**Key Point:** GenerateCloud provides authentication, not automatic syncing.

## 🗂️ File Storage

### Patterns
- **Post Type:** `wp_block`
- **Content:** Block markup
- **Meta Key:** `generateblocks_patterns_tree`
- **Value:** Array with preview HTML

### Taxonomies
- `gblocks_pattern_collections` → Collections (e.g., "Local")
- `wp_pattern_category` → Categories (e.g., "Hero")

### Global Styles  
- **Post Type:** `gblocks_styles`
- **Meta:** `gb_style_selector`, `gb_style_data`, `gb_style_css`

## 🚀 Your Workflow

1. Fetch pattern tree from REST API
2. Extract `preview` HTML
3. Fetch global styles (if needed)
4. Import HTML to Figma via html.to.design
5. Map global styles to Figma styles

## 📍 Important Files

### GenerateBlocks Pro
```
/includes/pattern-library/
├── class-pattern-library.php          ← Main logic
├── class-pattern-library-rest.php     ← REST endpoints
└── class-patterns-post-type.php       ← Post type setup
```

### GenerateCloud
```
/includes/
├── Plugin.php                         ← Main plugin
├── Modules/
│   ├── Post_Type.php                 ← Public keys CPT
│   └── Rest_Api.php                  ← License API
└── Utils/Functions.php                ← Helpers
```

## 🎓 Key Concepts

### Pattern Tree Generation
When you save a pattern:
1. Parse blocks
2. Render HTML via `do_blocks()`
3. Detect required scripts (accordion, tabs, etc.)
4. Extract global CSS classes
5. Save as `generateblocks_patterns_tree` meta

### Public Key Authentication
```php
// Provider stores permission:
'gb_permissions' => [
  'patterns' => [
    'enabled' => true,
    'name' => 'My Library',
    'includes' => [1, 2, 3]  // Collection IDs
  ]
]

// Consumer sends in header:
'X-GB-Public-Key' => 'your-key-here'
```

## ⚡ Quick Commands

### List All Local Patterns
```bash
wp post list --post_type=wp_block --format=table
```

### Get Pattern Tree
```bash
wp post meta get <ID> generateblocks_patterns_tree --format=json
```

### Fetch Remote Patterns
```bash
curl -H "X-GB-Public-Key: KEY" \
  https://patterns.generatepress.com/wp-json/generateblocks-pro/v1/pattern-library/patterns
```

## 🐛 Debugging Tips

### No Pattern Tree?
Re-save the pattern to trigger generation

### Can't Authenticate?
Check public key or use Application Password

### HTML Import Broken?
Include CSS in the HTML or fetch global styles

### Performance Issues?
Cache pattern data, they don't change often

## 🎯 Success Criteria

✅ You can fetch patterns without installing them  
✅ Pattern tree contains rendered HTML preview  
✅ You can import HTML directly to Figma  
✅ Global styles can be fetched separately  
✅ You understand how cloud sync authenticates  

## 📚 Full Documentation

- **README.md** - Start here
- **generateblocks-pattern-analysis.md** - Deep dive
- **architecture-diagrams.md** - Visual diagrams
- **pattern-extractor.js** - Working code
- **implementation-guide.md** - Step-by-step

## 💡 Pro Tips

1. Use the `preview` field for Figma - it's already rendered!
2. Fetch patterns in batches to improve performance
3. Cache global styles - they're shared across patterns
4. Filter by category to organize imports
5. Map GenerateBlocks global classes to Figma styles

---

**TL;DR:** Patterns come from remote library, fetch via REST API, use `preview` HTML for Figma import. 🚀
