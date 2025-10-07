#!/usr/bin/env node

/**
 * GenerateBlocks Pattern Extractor
 * 
 * This script demonstrates how to extract patterns from GenerateBlocks
 * without needing to install them first.
 */

// =============================================================================
// Method 1: Extract from Remote Pattern Library
// =============================================================================

async function fetchRemotePatterns() {
  const REMOTE_LIBRARY = 'https://patterns.generatepress.com';
  const PUBLIC_KEY = 'NPhxc91jLH5yGB4Ni6KryXN6HKKggte0';
  
  try {
    // Fetch categories first
    const categoriesResponse = await fetch(
      `${REMOTE_LIBRARY}/wp-json/generateblocks-pro/v1/pattern-library/categories`,
      {
        headers: {
          'X-GB-Public-Key': PUBLIC_KEY
        }
      }
    );
    
    const categories = await categoriesResponse.json();
    console.log('Available Categories:', categories.response.data);
    
    // Fetch all patterns
    const patternsResponse = await fetch(
      `${REMOTE_LIBRARY}/wp-json/generateblocks-pro/v1/pattern-library/patterns`,
      {
        headers: {
          'X-GB-Public-Key': PUBLIC_KEY
        }
      }
    );
    
    const patterns = await patternsResponse.json();
    console.log(`Found ${patterns.response.data.length} patterns`);
    
    return patterns.response.data;
  } catch (error) {
    console.error('Error fetching remote patterns:', error);
    return [];
  }
}

// =============================================================================
// Method 2: Extract from Local WordPress Installation
// =============================================================================

async function fetchLocalPatterns(siteUrl, apiKey) {
  try {
    // Using WordPress REST API
    const response = await fetch(
      `${siteUrl}/wp-json/wp/v2/blocks?per_page=100`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const patterns = await response.json();
    
    // Fetch pattern trees (metadata)
    const patternsWithMeta = await Promise.all(
      patterns.map(async (pattern) => {
        const metaResponse = await fetch(
          `${siteUrl}/wp-json/wp/v2/blocks/${pattern.id}`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );
        
        const fullPattern = await metaResponse.json();
        
        return {
          id: fullPattern.id,
          title: fullPattern.title.rendered,
          content: fullPattern.content.raw,
          meta: fullPattern.meta,
          categories: fullPattern.wp_pattern_category
        };
      })
    );
    
    return patternsWithMeta;
  } catch (error) {
    console.error('Error fetching local patterns:', error);
    return [];
  }
}

// =============================================================================
// Method 3: Using WordPress MCP Server
// =============================================================================

async function fetchPatternsViaMCP() {
  // Assuming you have the WordPress MCP server configured
  
  const patterns = await wp_call_endpoint({
    site: 'your-site-alias',
    endpoint: '/wp/v2/blocks',
    method: 'GET',
    params: {
      per_page: 100,
      _fields: 'id,title,content,meta'
    }
  });
  
  return patterns;
}

// =============================================================================
// Extract Pattern Data for Figma
// =============================================================================

function extractPatternForFigma(patternTree) {
  return {
    id: patternTree.id,
    name: patternTree.label,
    html: patternTree.preview, // Use this for html.to.design import
    blockMarkup: patternTree.pattern, // Original block markup
    requiredScripts: patternTree.scripts,
    requiredStyles: patternTree.styles,
    globalClasses: patternTree.globalStyleSelectors,
    categories: patternTree.categories
  };
}

// =============================================================================
// Fetch Global Styles/CSS
// =============================================================================

async function fetchGlobalStyles(siteUrl, publicKey) {
  try {
    const response = await fetch(
      `${siteUrl}/wp-json/generateblocks-pro/v1/pattern-library/provide-global-style-data`,
      {
        headers: {
          'X-GB-Public-Key': publicKey
        }
      }
    );
    
    const styles = await response.json();
    
    return {
      compiledCSS: styles.response.data.css,
      individualStyles: styles.response.data.styles.map(style => ({
        className: style.className,
        title: style.title,
        css: style.css,
        properties: JSON.parse(style.styles)
      }))
    };
  } catch (error) {
    console.error('Error fetching global styles:', error);
    return null;
  }
}

// =============================================================================
// Import to Figma via html.to.design MCP
// =============================================================================

async function importPatternToFigma(pattern) {
  try {
    const result = await import_html({
      html: pattern.preview,
      name: pattern.label
    });
    
    console.log(`Imported pattern "${pattern.label}" to Figma:`, result);
    return result;
  } catch (error) {
    console.error('Error importing to Figma:', error);
    return null;
  }
}

// =============================================================================
// Complete Workflow Example
// =============================================================================

async function syncPatternsToFigma() {
  console.log('=== Starting Pattern to Figma Sync ===\n');
  
  // Step 1: Fetch patterns from remote library
  console.log('Step 1: Fetching patterns from remote library...');
  const remotePatterns = await fetchRemotePatterns();
  
  // Step 2: Extract pattern data
  console.log('\nStep 2: Extracting pattern data...');
  const figmaReadyPatterns = remotePatterns.map(extractPatternForFigma);
  
  // Step 3: Fetch global styles
  console.log('\nStep 3: Fetching global styles...');
  const globalStyles = await fetchGlobalStyles(
    'https://patterns.generatepress.com',
    'NPhxc91jLH5yGB4Ni6KryXN6HKKggte0'
  );
  
  // Step 4: Import to Figma
  console.log('\nStep 4: Importing to Figma...');
  for (const pattern of figmaReadyPatterns.slice(0, 5)) { // First 5 for demo
    console.log(`\nImporting: ${pattern.name}`);
    await importPatternToFigma(pattern);
    
    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== Sync Complete ===');
  
  return {
    patterns: figmaReadyPatterns,
    styles: globalStyles
  };
}

// =============================================================================
// Database Query Examples (if you have direct DB access)
// =============================================================================

const SQL_QUERIES = {
  // Get all patterns with their metadata
  getAllPatterns: `
    SELECT 
      p.ID,
      p.post_title,
      p.post_content,
      p.post_date,
      pm.meta_value as pattern_tree
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm 
      ON p.ID = pm.post_id 
      AND pm.meta_key = 'generateblocks_patterns_tree'
    WHERE p.post_type = 'wp_block'
      AND p.post_status = 'publish'
    ORDER BY p.post_date DESC;
  `,
  
  // Get patterns by collection
  getPatternsByCollection: `
    SELECT 
      p.ID,
      p.post_title,
      t.name as collection_name,
      pm.meta_value as pattern_tree
    FROM wp_posts p
    INNER JOIN wp_term_relationships tr ON p.ID = tr.object_id
    INNER JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    INNER JOIN wp_terms t ON tt.term_id = t.term_id
    LEFT JOIN wp_postmeta pm 
      ON p.ID = pm.post_id 
      AND pm.meta_key = 'generateblocks_patterns_tree'
    WHERE p.post_type = 'wp_block'
      AND p.post_status = 'publish'
      AND tt.taxonomy = 'gblocks_pattern_collections'
      AND t.slug = :collection_slug
    ORDER BY p.post_date DESC;
  `,
  
  // Get all global styles
  getGlobalStyles: `
    SELECT 
      p.ID,
      p.post_title,
      MAX(CASE WHEN pm.meta_key = 'gb_style_selector' THEN pm.meta_value END) as class_name,
      MAX(CASE WHEN pm.meta_key = 'gb_style_data' THEN pm.meta_value END) as style_data,
      MAX(CASE WHEN pm.meta_key = 'gb_style_css' THEN pm.meta_value END) as css
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
    WHERE p.post_type = 'gblocks_styles'
      AND p.post_status = 'publish'
    GROUP BY p.ID, p.post_title
    ORDER BY p.menu_order ASC;
  `
};

// =============================================================================
// Pattern Analysis Helper
// =============================================================================

function analyzePattern(pattern) {
  const tree = pattern.meta?.generateblocks_patterns_tree?.[0] || {};
  
  return {
    id: pattern.id,
    title: pattern.title,
    blockCount: (pattern.content.match(/<!-- wp:/g) || []).length,
    hasGlobalStyles: (tree.globalStyleSelectors || []).length > 0,
    requiresScripts: (tree.scripts || []).length > 0,
    requiresStyles: (tree.styles || []).length > 0,
    categories: pattern.categories || [],
    preview: {
      hasPreview: !!tree.preview,
      previewLength: tree.preview?.length || 0
    },
    blocks: extractBlockTypes(pattern.content)
  };
}

function extractBlockTypes(content) {
  const blockMatches = content.matchAll(/<!-- wp:([^\s]+)/g);
  const blocks = new Set();
  
  for (const match of blockMatches) {
    blocks.add(match[1]);
  }
  
  return Array.from(blocks);
}

// =============================================================================
// Export Functions
// =============================================================================

module.exports = {
  fetchRemotePatterns,
  fetchLocalPatterns,
  fetchPatternsViaMCP,
  extractPatternForFigma,
  fetchGlobalStyles,
  importPatternToFigma,
  syncPatternsToFigma,
  analyzePattern,
  SQL_QUERIES
};

// =============================================================================
// CLI Usage Example
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'fetch-remote':
      fetchRemotePatterns().then(patterns => {
        console.log(JSON.stringify(patterns, null, 2));
      });
      break;
      
    case 'fetch-local':
      const siteUrl = args[1];
      const apiKey = args[2];
      fetchLocalPatterns(siteUrl, apiKey).then(patterns => {
        console.log(JSON.stringify(patterns, null, 2));
      });
      break;
      
    case 'sync':
      syncPatternsToFigma();
      break;
      
    default:
      console.log(`
Usage:
  node pattern-extractor.js fetch-remote
  node pattern-extractor.js fetch-local <site-url> <api-key>
  node pattern-extractor.js sync
      `);
  }
}
