# GenerateBlocks to Figma Integration Implementation Guide

## Phase 1: Pattern Extraction Setup

### 1.1 WordPress MCP Server Configuration

First, configure your WordPress sites in the MCP server:

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["/path/to/wordpress-mcp-server"],
      "env": {
        "sites": [
          {
            "alias": "local-site",
            "url": "https://yoursite.local",
            "auth": {
              "type": "application-password",
              "username": "admin",
              "password": "xxxx xxxx xxxx xxxx"
            }
          },
          {
            "alias": "patterns-library",
            "url": "https://patterns.generatepress.com",
            "auth": {
              "type": "public-key",
              "key": "NPhxc91jLH5yGB4Ni6KryXN6HKKggte0"
            }
          }
        ]
      }
    }
  }
}
```

### 1.2 Test Pattern Extraction

Test the WordPress MCP server to fetch patterns:

```javascript
// Discover available endpoints
const endpoints = await wp_discover_endpoints({
  site: 'local-site'
});

// Fetch patterns from local site
const patterns = await wp_call_endpoint({
  site: 'local-site',
  endpoint: '/wp/v2/blocks',
  method: 'GET',
  params: {
    per_page: 100,
    _fields: 'id,title,content,meta,wp_pattern_category'
  }
});

// Fetch patterns from remote library
const remotePatterns = await wp_call_endpoint({
  site: 'patterns-library',
  endpoint: '/generateblocks-pro/v1/pattern-library/patterns',
  method: 'GET',
  params: {
    libraryId: 'gb_default_pro_library'
  }
});
```

## Phase 2: Pattern to Figma Conversion

### 2.1 Extract Pattern Preview HTML

Create a function to extract the ready-to-use HTML preview:

```javascript
async function getPatternHTML(pattern) {
  // Option 1: From pattern tree metadata
  if (pattern.meta?.generateblocks_patterns_tree) {
    const tree = JSON.parse(pattern.meta.generateblocks_patterns_tree);
    return {
      html: tree[0].preview,
      name: tree[0].label,
      scripts: tree[0].scripts,
      styles: tree[0].styles,
      globalClasses: tree[0].globalStyleSelectors
    };
  }
  
  // Option 2: Render pattern content
  // This requires WordPress to render the blocks
  const rendered = await wp_call_endpoint({
    site: 'local-site',
    endpoint: `/wp/v2/blocks/${pattern.id}`,
    method: 'GET',
    params: {
      context: 'view'
    }
  });
  
  return {
    html: rendered.content.rendered,
    name: pattern.title.rendered
  };
}
```

### 2.2 Import to Figma via html.to.design

```javascript
async function importPatternToFigma(patternId) {
  // Step 1: Fetch pattern from WordPress
  const pattern = await wp_call_endpoint({
    site: 'local-site',
    endpoint: `/wp/v2/blocks/${patternId}`,
    method: 'GET'
  });
  
  // Step 2: Extract HTML
  const { html, name, globalClasses } = await getPatternHTML(pattern);
  
  // Step 3: Fetch required CSS for global classes
  const styles = await fetchGlobalStyles(globalClasses);
  
  // Step 4: Combine HTML with styles
  const fullHTML = `
    <style>
      ${styles.css}
    </style>
    ${html}
  `;
  
  // Step 5: Import to Figma
  const figmaNode = await import_html({
    html: fullHTML,
    name: name
  });
  
  return figmaNode;
}
```

### 2.3 Fetch and Apply Global Styles

```javascript
async function fetchGlobalStyles(classSelectors) {
  // Fetch all global styles from WordPress
  const stylesResponse = await wp_call_endpoint({
    site: 'local-site',
    endpoint: '/generateblocks-pro/v1/pattern-library/provide-global-style-data',
    method: 'GET'
  });
  
  const allStyles = stylesResponse.response.data.styles;
  
  // Filter to only the styles we need
  const requiredStyles = allStyles.filter(style => 
    classSelectors.includes(`.${style.className}`)
  );
  
  // Compile CSS
  const css = requiredStyles.map(style => style.css).join('\n');
  
  return {
    css,
    styles: requiredStyles
  };
}
```

## Phase 3: Create Figma Design System

### 3.1 Map GenerateBlocks Styles to Figma Styles

```javascript
async function syncStylesToFigma() {
  // Fetch all global styles
  const stylesData = await wp_call_endpoint({
    site: 'local-site',
    endpoint: '/generateblocks-pro/v1/pattern-library/provide-global-style-data',
    method: 'GET'
  });
  
  const styles = stylesData.response.data.styles;
  
  // Create Figma text styles
  for (const style of styles) {
    const styleProps = JSON.parse(style.styles);
    
    // Map to Figma text style properties
    if (styleProps.typography) {
      await createFigmaTextStyle({
        name: style.className,
        fontSize: styleProps.typography.fontSize,
        fontWeight: styleProps.typography.fontWeight,
        lineHeight: styleProps.typography.lineHeight,
        letterSpacing: styleProps.typography.letterSpacing
      });
    }
    
    // Map to Figma color styles
    if (styleProps.color) {
      await createFigmaColorStyle({
        name: `${style.className}/background`,
        color: styleProps.color.background
      });
      
      await createFigmaColorStyle({
        name: `${style.className}/text`,
        color: styleProps.color.text
      });
    }
    
    // Map to Figma effect styles (shadows, etc.)
    if (styleProps.boxShadow) {
      await createFigmaEffectStyle({
        name: `${style.className}/shadow`,
        effects: parseBoxShadow(styleProps.boxShadow)
      });
    }
  }
}
```

### 3.2 Create Figma Component Library

```javascript
async function createFigmaComponentLibrary() {
  // Get all pattern categories
  const categories = await wp_call_endpoint({
    site: 'local-site',
    endpoint: '/generateblocks-pro/v1/pattern-library/categories',
    method: 'GET'
  });
  
  // Create a page for each category in Figma
  for (const category of categories.response.data) {
    // Create Figma page
    const page = await figma.createPage(category.name);
    
    // Get patterns in this category
    const patterns = await wp_call_endpoint({
      site: 'local-site',
      endpoint: '/generateblocks-pro/v1/pattern-library/patterns',
      method: 'GET',
      params: {
        categoryId: category.id
      }
    });
    
    // Import each pattern to this page
    let yPosition = 0;
    for (const pattern of patterns.response.data) {
      const figmaNode = await importPatternToFigma(pattern.id);
      
      // Position components vertically
      figmaNode.y = yPosition;
      yPosition += figmaNode.height + 100;
      
      // Convert to component
      await figma.createComponent(figmaNode);
    }
  }
}
```

## Phase 4: Bidirectional Sync

### 4.1 Export Figma Changes Back to WordPress

```javascript
async function exportFigmaToWordPress(figmaNodeId) {
  // Get the Figma node
  const figmaNode = await figma.getNode(figmaNodeId);
  
  // Convert Figma to HTML
  const html = await figma.exportToHTML(figmaNode);
  
  // Parse HTML to extract block structure
  const blockMarkup = convertHTMLToBlocks(html);
  
  // Find or create pattern in WordPress
  const patternTitle = figmaNode.name;
  const existingPatterns = await wp_call_endpoint({
    site: 'local-site',
    endpoint: '/wp/v2/blocks',
    method: 'GET',
    params: {
      search: patternTitle
    }
  });
  
  if (existingPatterns.length > 0) {
    // Update existing pattern
    await wp_call_endpoint({
      site: 'local-site',
      endpoint: `/wp/v2/blocks/${existingPatterns[0].id}`,
      method: 'POST',
      params: {
        content: blockMarkup
      }
    });
  } else {
    // Create new pattern
    await wp_call_endpoint({
      site: 'local-site',
      endpoint: '/wp/v2/blocks',
      method: 'POST',
      params: {
        title: patternTitle,
        content: blockMarkup,
        status: 'publish'
      }
    });
  }
}
```

### 4.2 HTML to GenerateBlocks Converter

```javascript
function convertHTMLToBlocks(html) {
  // This is a simplified example
  // You'll need to map HTML elements to GenerateBlocks
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  let blocks = '';
  
  // Example: Convert divs to containers
  doc.querySelectorAll('.gb-container').forEach(container => {
    blocks += `
<!-- wp:generateblocks/container {
  "uniqueId": "${generateUniqueId()}",
  "backgroundColor": "${getComputedStyle(container).backgroundColor}"
} -->
<div class="gb-container">
  ${convertChildren(container)}
</div>
<!-- /wp:generateblocks/container -->
    `;
  });
  
  return blocks;
}
```

## Phase 5: Automation & Monitoring

### 5.1 Watch for Pattern Changes

```javascript
// Watch for new patterns in WordPress
async function watchForPatternChanges() {
  let lastCheckTime = new Date();
  
  setInterval(async () => {
    const newPatterns = await wp_call_endpoint({
      site: 'local-site',
      endpoint: '/wp/v2/blocks',
      method: 'GET',
      params: {
        after: lastCheckTime.toISOString(),
        orderby: 'modified',
        order: 'desc'
      }
    });
    
    if (newPatterns.length > 0) {
      console.log(`Found ${newPatterns.length} new/updated patterns`);
      
      // Import to Figma
      for (const pattern of newPatterns) {
        await importPatternToFigma(pattern.id);
      }
      
      lastCheckTime = new Date();
    }
  }, 60000); // Check every minute
}
```

### 5.2 Bulk Pattern Import

```javascript
async function bulkImportPatterns(options = {}) {
  const {
    site = 'local-site',
    category = null,
    collection = null,
    limit = 50
  } = options;
  
  // Build query parameters
  const params = {
    per_page: limit,
    _fields: 'id,title,content,meta'
  };
  
  if (category) {
    params.wp_pattern_category = category;
  }
  
  if (collection) {
    params.gblocks_pattern_collections = collection;
  }
  
  // Fetch patterns
  const patterns = await wp_call_endpoint({
    site,
    endpoint: '/wp/v2/blocks',
    method: 'GET',
    params
  });
  
  console.log(`Importing ${patterns.length} patterns...`);
  
  // Import to Figma with progress tracking
  const results = {
    success: [],
    failed: []
  };
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    
    try {
      console.log(`[${i+1}/${patterns.length}] Importing: ${pattern.title.rendered}`);
      
      const figmaNode = await importPatternToFigma(pattern.id);
      
      results.success.push({
        patternId: pattern.id,
        patternName: pattern.title.rendered,
        figmaNodeId: figmaNode.id
      });
      
      // Rate limiting
      await sleep(1000);
      
    } catch (error) {
      console.error(`Failed to import ${pattern.title.rendered}:`, error);
      
      results.failed.push({
        patternId: pattern.id,
        patternName: pattern.title.rendered,
        error: error.message
      });
    }
  }
  
  console.log(`\nImport complete!`);
  console.log(`Success: ${results.success.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  return results;
}
```

## Phase 6: CLI Tool

Create a command-line interface for pattern management:

```javascript
#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

program
  .name('gb-figma-sync')
  .description('Sync GenerateBlocks patterns with Figma')
  .version('1.0.0');

program
  .command('import')
  .description('Import patterns from WordPress to Figma')
  .option('-s, --site <alias>', 'WordPress site alias', 'local-site')
  .option('-c, --category <id>', 'Filter by category ID')
  .option('-l, --limit <number>', 'Maximum patterns to import', '50')
  .action(async (options) => {
    const results = await bulkImportPatterns(options);
    console.log(JSON.stringify(results, null, 2));
  });

program
  .command('export')
  .description('Export Figma components to WordPress')
  .option('-n, --node <id>', 'Figma node ID to export')
  .action(async (options) => {
    await exportFigmaToWordPress(options.node);
  });

program
  .command('sync-styles')
  .description('Sync global styles to Figma')
  .action(async () => {
    await syncStylesToFigma();
  });

program
  .command('watch')
  .description('Watch for pattern changes and auto-sync')
  .action(async () => {
    await watchForPatternChanges();
  });

program
  .command('list')
  .description('List all patterns')
  .option('-s, --site <alias>', 'WordPress site alias', 'local-site')
  .action(async (options) => {
    const patterns = await wp_call_endpoint({
      site: options.site,
      endpoint: '/wp/v2/blocks',
      method: 'GET',
      params: { per_page: 100 }
    });
    
    patterns.forEach(pattern => {
      console.log(`${pattern.id}\t${pattern.title.rendered}`);
    });
  });

program.parse();
```

## Quick Start Checklist

- [ ] Configure WordPress MCP server with your site credentials
- [ ] Test connection by listing patterns: `wp_call_endpoint`
- [ ] Extract a single pattern and inspect its structure
- [ ] Test html.to.design import with pattern preview HTML
- [ ] Fetch and map global styles to Figma
- [ ] Create bulk import script for all patterns
- [ ] Set up category-based Figma pages
- [ ] Implement bidirectional sync
- [ ] Create automated watch system
- [ ] Build CLI tool for team use

## Troubleshooting

### Pattern Tree Missing
If `generateblocks_patterns_tree` meta is missing, the pattern hasn't been saved properly. Re-save it in WordPress to trigger tree generation.

### Authentication Issues
Make sure you're using Application Passwords for local sites and the correct Public Key for remote libraries.

### HTML Import Fails
Check that the HTML is valid and includes necessary styles. You may need to inline CSS for better Figma compatibility.

### Rate Limiting
Add delays between API calls and imports to avoid hitting rate limits on either WordPress or Figma.

## Resources

- GenerateBlocks Documentation: https://docs.generateblocks.com
- WordPress REST API: https://developer.wordpress.org/rest-api/
- Figma Plugin API: https://www.figma.com/plugin-docs/
- html.to.design: https://www.figma.com/community/plugin/1159123024924461424
