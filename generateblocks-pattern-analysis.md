# GenerateBlocks Pattern System Analysis

## Overview

The GenerateBlocks pattern system consists of two main plugins:
1. **GenerateBlocks Pro** - Handles pattern library, local patterns, and pattern management
2. **GenerateCloud** - Handles pattern syncing between sites using public keys

## Architecture

### Pattern Storage

Patterns are stored as WordPress posts using the `wp_block` post type (WordPress's native reusable blocks/patterns). The system extends this with:

- **Custom Post Meta:**
  - `generateblocks_patterns_tree` - Contains parsed pattern data including preview HTML, scripts, styles, and categories
  - `_editor_width` - Editor display width preference

- **Custom Taxonomies:**
  - `gblocks_pattern_collections` - Organizes patterns into collections (e.g., "Local")
  - `wp_pattern_category` - Standard WordPress pattern categories

### Pattern Sources

#### 1. Remote Pattern Libraries (Default Source)

When you open the pattern library in the dashboard, patterns come from **remote hosted libraries**:

**Default Pro Library:**
- Domain: `https://patterns.generatepress.com` (legacy) or `https://patterns.generatepress.com` (v2)
- Public Key: Built into the plugin
- Location: `class-pattern-library.php::get_default()`

**How it works:**
```php
// Default library configuration
$domain = 'https://patterns.generatepress.com';
$public_key = 'NPhxc91jLH5yGB4Ni6KryXN6HKKggte0';
```

The patterns are fetched via REST API calls to the remote server, **NOT** stored in your local database initially.

#### 2. Local Patterns

Once you install/import a pattern from the library:
1. Pattern is saved as a `wp_block` post in your local database
2. Pattern tree metadata is generated and saved to `generateblocks_patterns_tree` meta
3. Pattern can be edited locally and becomes part of your local collection

### Pattern Library REST API

Located in `class-pattern-library-rest.php`, key endpoints:

```
GET /generateblocks-pro/v1/pattern-library/categories
GET /generateblocks-pro/v1/pattern-library/patterns
GET /generateblocks-pro/v1/pattern-library/get-global-style-data
POST /generateblocks-pro/v1/pattern-library/import-styles
GET /generateblocks-pro/v1/pattern-library/get-library-by-public-key
POST /generateblocks-pro/v1/pattern-library/add-library
```

**Pattern Listing Logic:**
```php
// Patterns are fetched from wp_block posts
$posts = get_posts([
    'post_type' => 'wp_block',
    'posts_per_page' => 250,
    'tax_query' => [
        // Filter by collection
        'taxonomy' => 'gblocks_pattern_collections',
        'terms' => $allowed_collections,
    ]
]);

// Each pattern's tree is stored in post meta
$post_patterns = get_post_meta($post->ID, 'generateblocks_patterns_tree', true);
```

### Pattern Tree Structure

When a pattern is saved, the system generates a "tree" containing:

```php
[
    'id' => 'pattern-{post_id}',
    'label' => 'Pattern Name',
    'pattern' => '<!-- wp:generateblocks/... -->', // Raw block markup
    'preview' => '<div>...</div>', // Rendered HTML preview
    'scripts' => ['url/to/script.js'], // Required JS files
    'styles' => ['url/to/style.css'], // Required CSS files
    'categories' => [1, 2, 3], // Category IDs
    'globalStyleSelectors' => ['.class-name'] // Global CSS classes used
]
```

This tree is generated in `class-pattern-library.php::build_tree()` and includes:
- Rendered HTML preview via `do_blocks()`
- Detection of required scripts (accordion, tabs, menus)
- Extraction of global style class names
- Processing of nested reusable blocks

## GenerateCloud Sync System

### How Pattern Syncing Works

GenerateCloud enables pattern sharing between sites using a **public key authentication system**:

#### 1. Public Key Setup

On the **provider site** (site sharing patterns):
- Create a public key via `gblocks_public_keys` post type
- Configure permissions:
  ```php
  'gb_permissions' => [
      'patterns' => [
          'enabled' => true,
          'name' => 'My Pattern Library',
          'includes' => [1, 2, 3] // Collection term IDs
      ]
  ]
  ```

#### 2. Remote Site Connection

On the **consumer site** (site receiving patterns):
- Add library via REST API: `POST /generateblocks-pro/v1/pattern-library/add-library`
- Provide:
  - Public key
  - Domain of provider site
  
The system then:
1. Validates the public key with the provider
2. Fetches library name
3. Stores connection in WordPress options as `generateblocks_pattern_libraries`

#### 3. Pattern Fetching

When viewing patterns from a remote library:

```php
// Request includes public key in header
'headers' => [
    'X-GB-Public-Key' => $public_key
]

// Provider validates and returns patterns
$allowed_collections = $instance->get_collections_by_public_key($public_key);
// Returns patterns from those collections
```

#### 4. Style/CSS Syncing

When importing a pattern with global styles:

1. **Fetch global style data:**
   ```
   GET /pattern-library/get-global-style-data
   ```
   
2. **Provider returns:**
   ```php
   [
       'css' => '/* compiled CSS */',
       'styles' => [
           [
               'title' => '.button-primary',
               'className' => 'button-primary',
               'styles' => '{"spacing":{"padding":"10px"}}',
               'css' => '.button-primary { padding: 10px; }'
           ]
       ]
   ]
   ```

3. **Import to consumer site:**
   ```
   POST /pattern-library/import-styles
   ```
   Creates `gblocks_styles` posts with the style data

### Key Files

**GenerateBlocks Pro:**
- `/includes/pattern-library/class-pattern-library.php` - Main pattern library logic
- `/includes/pattern-library/class-pattern-library-rest.php` - REST API endpoints
- `/includes/pattern-library/class-patterns-post-type.php` - Post type registration
- `/includes/styles/class-styles-post-type.php` - Global styles management

**GenerateCloud:**
- `/includes/Plugin.php` - Main plugin initialization
- `/includes/Modules/Post_Type.php` - Public keys post type
- `/includes/Modules/Rest_Api.php` - License validation
- `/includes/Utils/Functions.php` - Helper functions

## Extracting Patterns for Figma (Without Installation)

### Method 1: Direct REST API Access

You can fetch patterns **without installing them** by calling the REST API directly:

```javascript
// Fetch patterns from remote library
fetch('https://patterns.generatepress.com/wp-json/generateblocks-pro/v1/pattern-library/patterns', {
  headers: {
    'X-GB-Public-Key': 'NPhxc91jLH5yGB4Ni6KryXN6HKKggte0'
  }
})
.then(r => r.json())
.then(data => {
  // data.response.data contains array of patterns
  // Each has: pattern (markup), preview (HTML), styles, scripts
});
```

### Method 2: WordPress Installation REST API

If you want to extract patterns from your local WordPress:

```javascript
// Fetch all local patterns
fetch('https://yoursite.com/wp-json/wp/v2/blocks?per_page=100', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
.then(r => r.json())
.then(patterns => {
  patterns.forEach(pattern => {
    // pattern.content.raw = block markup
    // pattern.meta.generateblocks_patterns_tree = pattern tree with preview
  });
});
```

### Method 3: Database Direct Access

Query patterns directly from WordPress database:

```sql
-- Get all patterns
SELECT 
    p.ID,
    p.post_title,
    p.post_content,
    pm.meta_value as pattern_tree
FROM wp_posts p
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = 'generateblocks_patterns_tree'
WHERE p.post_type = 'wp_block'
AND p.post_status = 'publish';
```

## Pattern to Figma Conversion Strategy

### Recommended Workflow

1. **Extract Pattern Data**
   - Use REST API or database to get pattern tree
   - Pattern tree contains rendered HTML preview
   - Also includes required CSS classes and styles

2. **Parse HTML Preview**
   - Pattern preview is complete rendered HTML
   - Includes inline styles from GenerateBlocks
   - Contains all necessary classes

3. **Map to Figma Components**
   ```javascript
   // Example pattern tree structure
   {
     "id": "pattern-123",
     "label": "Hero Section",
     "preview": "<div class='gb-container'>...</div>",
     "globalStyleSelectors": [".button-primary", ".text-large"],
     "styles": ["accordion-style.css"],
     "scripts": ["accordion.js"]
   }
   ```

4. **Import to Figma via html.to.design**
   - Use the `preview` HTML directly
   - Import associated CSS classes
   - Map global styles to Figma styles

### CSS/Style Mapping

Global styles are stored in `gblocks_styles` post type with:
- `gb_style_selector` - CSS class name
- `gb_style_data` - JSON style properties
- `gb_style_css` - Compiled CSS

Fetch via:
```
GET /pattern-library/get-global-style-data
```

Returns all global styles used across patterns, ready for import.

## MCP Server Integration Strategy

### WordPress MCP Server

Use the WordPress MCP server to:

1. **List patterns:**
   ```
   wp_call_endpoint({
     endpoint: '/wp/v2/blocks',
     method: 'GET',
     params: { per_page: 100 }
   })
   ```

2. **Get pattern details:**
   ```
   wp_call_endpoint({
     endpoint: '/wp/v2/blocks/{id}',
     method: 'GET'
   })
   ```

3. **Fetch pattern metadata:**
   ```
   wp_call_endpoint({
     endpoint: '/generateblocks-pro/v1/pattern-library/patterns',
     method: 'GET'
   })
   ```

### Figma MCP Server

Use html.to.design to import patterns:

```javascript
import_html({
  html: patternTree.preview,
  name: patternTree.label
});
```

### Automation Workflow

1. **Discover patterns** → WordPress MCP lists all patterns
2. **Extract data** → Get pattern tree with preview HTML
3. **Fetch styles** → Get global style data
4. **Convert to Figma** → Import HTML via html.to.design
5. **Map styles** → Create Figma styles from global styles
6. **Sync back** → Export Figma changes back to WordPress

## Summary

- **Initial patterns** come from remote libraries (patterns.generatepress.com)
- **Patterns are NOT in your database** until you import them
- **Pattern tree** contains everything needed: HTML preview, CSS, scripts
- **GenerateCloud** syncs patterns between sites via public key authentication
- **No need to install** patterns to extract them - use REST API directly
- **Best extraction method**: Fetch pattern tree via REST API, contains rendered HTML preview
- **Figma import**: Use html.to.design MCP with pattern preview HTML
- **Style syncing**: Fetch global styles separately and map to Figma styles

## Next Steps for Your Workflow

1. Build MCP integration to fetch patterns from WordPress REST API
2. Parse pattern trees to extract HTML previews
3. Use html.to.design to convert HTML to Figma components
4. Create mapping between GenerateBlocks global styles and Figma styles
5. Build bidirectional sync to push Figma changes back to WordPress patterns
