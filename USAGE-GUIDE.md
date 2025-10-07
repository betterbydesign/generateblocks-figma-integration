# GenerateBlocks to Figma Integration - Complete Usage Guide

## 🎉 What You Have

A **complete Figma plugin** that imports GenerateBlocks HTML patterns from WordPress with proper Auto Layout, plus comprehensive documentation on the GenerateBlocks pattern system.

## 📦 Project Structure

```
/code/
├── README.md                              # Main project overview
├── PROJECT-SUMMARY.md                     # Detailed project summary
├── QUICK-REFERENCE.md                     # Quick lookup guide
├── USAGE-GUIDE.md                         # This file
├── generateblocks-pattern-analysis.md     # Deep technical analysis
├── architecture-diagrams.md               # System architecture diagrams
├── implementation-guide.md                # Integration implementation steps
├── pattern-extractor.js                   # Pattern extraction utilities
└── figma-plugin/                          # Complete Figma plugin
    ├── manifest.json                      # Plugin manifest
    ├── package.json                       # Dependencies
    ├── tsconfig.json                      # TypeScript config
    ├── webpack.config.js                  # Build config
    ├── ui.html                           # Plugin UI (complete)
    ├── PLUGIN-SUMMARY.md                 # Plugin overview
    ├── IMPLEMENTATION-GUIDE.md           # Plugin build guide
    └── src/                              # TypeScript source (complete)
        ├── code.ts                       # Main plugin logic
        ├── types.ts                      # Type definitions
        ├── converter.ts                  # HTML to Figma converter
        └── utils.ts                      # Utility functions
```

## 🚀 Getting Started

### Option 1: Use the Figma Plugin (Recommended)

The Figma plugin allows you to import patterns directly into Figma with Auto Layout.

#### Step 1: Install Dependencies

```bash
cd figma-plugin
npm install
```

This installs:
- `@figma/plugin-typings` - Figma API types
- `typescript` - TypeScript compiler
- `webpack` - Module bundler
- `ts-loader` - TypeScript loader for webpack

#### Step 2: Build the Plugin

```bash
npm run build
```

This compiles TypeScript to JavaScript and creates `dist/code.js`.

#### Step 3: Load in Figma

1. Open **Figma Desktop App** (plugins don't work in browser)
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Navigate to `/code/figma-plugin/` and select `manifest.json`
4. The plugin will appear in your **Plugins** menu

#### Step 4: Use the Plugin

**Browse Patterns:**
1. Open the plugin from Plugins menu
2. Click "Load Patterns" on the Browse tab
3. Browse available patterns from GeneratePress
4. Click any pattern to import it into Figma

**Import Custom HTML:**
1. Switch to "Import HTML" tab
2. Paste pattern HTML (from the `preview` field)
3. Enter a pattern name
4. Click "Import to Figma"

**Configure Custom WordPress Site:**
1. Switch to "Settings" tab
2. Enter your WordPress site URL
3. (Optional) Enter public key if using GenerateCloud
4. Click "Save Settings"

### Option 2: Use the Pattern Extractor Script

The pattern extractor script provides utilities to fetch and analyze patterns.

```bash
# Fetch patterns from remote library
node pattern-extractor.js fetch-remote

# Fetch from local WordPress site
node pattern-extractor.js fetch-local https://yoursite.com YOUR_API_KEY

# Run full sync workflow
node pattern-extractor.js sync
```

## 📖 How It Works

### Pattern Extraction Flow

```
WordPress Site
    ↓ REST API
Pattern Library Endpoint
    ↓ Returns Pattern Tree
{
  "id": "pattern-123",
  "label": "Hero Section",
  "preview": "<div>...</div>",  ← HTML ready for Figma
  "globalStyleSelectors": [".button-primary"]
}
    ↓ Parse HTML
DOMParser + getComputedStyle
    ↓ Extract Structure & Styles
Figma Converter
    ↓ Create Frames & Auto Layout
Figma Design
```

### What Gets Converted

#### Layout (Automatic)
- `display: flex` → Auto Layout (horizontal/vertical)
- `gap` → itemSpacing
- `padding` → frame padding
- `justify-content` → primaryAxisAlignItems
- `align-items` → counterAxisAlignItems

#### Visual Styles
- `background-color` → fills
- `border-radius` → cornerRadius
- `box-shadow` → effects (drop shadow)
- `color` → text fills
- `font-size` → fontSize

#### Structure
- Nested HTML elements → nested Figma frames
- Text nodes → TextNode
- Images → RectangleNode (placeholder)

## 🎯 Key Concepts

### 1. Pattern Tree Metadata

GenerateBlocks stores patterns with rich metadata:

```json
{
  "id": "pattern-123",
  "label": "Hero Section",
  "pattern": "<!-- wp:generateblocks/container -->...",
  "preview": "<div class='gb-container'>...</div>",
  "scripts": ["accordion.js"],
  "styles": ["style.css"],
  "globalStyleSelectors": [".button-primary"],
  "categories": [1, 2, 3]
}
```

**Key Field:** `preview` contains fully rendered HTML - this is what the plugin imports!

### 2. Remote Pattern Libraries

Initial patterns come from **remote libraries**, NOT your local database:

- **Default Library:** https://patterns.generatepress.com
- **Public Key:** `NPhxc91jLH5yGB4Ni6KryXN6HKKggte0` (built-in)
- **Access Method:** REST API with public key header
- **Storage:** Patterns are NOT stored locally until you install them

### 3. GenerateCloud Sync

GenerateCloud enables pattern sharing between sites:

1. **Provider Site** creates public key with permissions
2. **Consumer Site** adds library using the key
3. Patterns fetched via REST API (not automatic)
4. Global styles synced separately

## 🔧 Common Tasks

### Fetch All Patterns from GeneratePress

```javascript
const response = await fetch(
  'https://patterns.generatepress.com/wp-json/generateblocks-pro/v1/pattern-library/patterns',
  {
    headers: {
      'X-GB-Public-Key': 'NPhxc91jLH5yGB4Ni6KryXN6HKKggte0'
    }
  }
);

const data = await response.json();
const patterns = data.response.data;
```

### Import Pattern to Figma

Using the plugin:
1. Load patterns in Browse tab
2. Click the pattern you want
3. Done! Pattern appears in Figma with Auto Layout

Programmatically:
```javascript
// Get pattern HTML
const patternHTML = pattern.preview;

// Parse and import via plugin
// (Plugin UI handles this automatically)
```

### Fetch Global Styles

```javascript
const response = await fetch(
  'https://patterns.generatepress.com/wp-json/generateblocks-pro/v1/pattern-library/provide-global-style-data',
  {
    headers: {
      'X-GB-Public-Key': 'NPhxc91jLH5yGB4Ni6KryXN6HKKggte0'
    }
  }
);

const styles = await response.json();
// styles.response.data.styles contains all CSS classes
```

### Connect to Your WordPress Site

1. Create Application Password in WordPress:
   - Go to Users → Profile
   - Scroll to "Application Passwords"
   - Create new password

2. Configure plugin:
   - Open plugin Settings tab
   - Enter your site URL
   - For REST API auth, use Application Password
   - For GenerateCloud, use Public Key

## 🎨 Testing the Plugin

### Test HTML

Try importing this sample HTML to test the plugin:

```html
<div style="display: flex; flex-direction: column; gap: 16px; padding: 24px; background-color: #f5f5f5; border-radius: 8px;">
  <div style="font-size: 24px; font-weight: bold; color: #333;">Hero Section</div>
  <div style="font-size: 16px; color: #666;">This is a sample GenerateBlocks pattern</div>
  <div style="display: flex; gap: 8px;">
    <div style="padding: 12px 24px; background-color: #0066ff; color: white; border-radius: 6px;">Primary Button</div>
    <div style="padding: 12px 24px; border: 2px solid #0066ff; color: #0066ff; border-radius: 6px;">Secondary Button</div>
  </div>
</div>
```

### Expected Result

This should create:
- Outer frame with Auto Layout (vertical)
- Gap of 16px between items
- Padding of 24px
- Light gray background
- Rounded corners (8px)
- Two text nodes
- Inner frame with Auto Layout (horizontal) containing two button frames

## 🐛 Troubleshooting

### Plugin Won't Load
- **Solution:** Make sure you're using Figma Desktop App, not browser
- **Solution:** Check that `dist/code.js` exists after building
- **Solution:** Verify manifest.json points to correct file

### Patterns Won't Load
- **Solution:** Check network access in manifest.json
- **Solution:** Verify WordPress site URL is correct
- **Solution:** Test API endpoint in browser first

### Import Creates Wrong Layout
- **Solution:** Check that HTML has proper `display: flex` styles
- **Solution:** Verify styles are inline or computed correctly
- **Solution:** Try simpler HTML first to isolate issue

### TypeScript Build Errors
- **Solution:** Run `npm install` to ensure dependencies are installed
- **Solution:** Check TypeScript version matches tsconfig.json
- **Solution:** Clear dist folder and rebuild

## 📚 Additional Resources

### Documentation Files

1. **README.md** - Start here for overview
2. **PROJECT-SUMMARY.md** - Detailed project breakdown
3. **QUICK-REFERENCE.md** - Quick lookup for API endpoints
4. **generateblocks-pattern-analysis.md** - Deep dive into how patterns work
5. **architecture-diagrams.md** - Visual system diagrams
6. **implementation-guide.md** - Step-by-step integration guide
7. **figma-plugin/PLUGIN-SUMMARY.md** - Plugin features and architecture
8. **figma-plugin/IMPLEMENTATION-GUIDE.md** - Plugin build instructions

### External Links

- **GenerateBlocks Docs:** https://docs.generateblocks.com/
- **Figma Plugin API:** https://www.figma.com/plugin-docs/
- **WordPress REST API:** https://developer.wordpress.org/rest-api/

## 🎯 Development Workflow

### For Plugin Development

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Make changes to src/code.ts, src/converter.ts, etc.

# In Figma: Plugins → Development → Reload plugin

# Test your changes
```

### For Adding Features

1. **Edit TypeScript files** in `src/`
2. **Run build:** `npm run build`
3. **Reload plugin** in Figma
4. **Test** with sample HTML or real patterns

### For Debugging

- **UI debugging:** Use `console.log()` in ui.html (check browser console)
- **Plugin debugging:** Use `console.log()` in src/code.ts (check Figma console)
- **Network issues:** Check browser Network tab when loading patterns

## 🎊 Next Steps

### Immediate
1. ✅ Build the plugin: `cd figma-plugin && npm install && npm run build`
2. ✅ Load in Figma Desktop
3. ✅ Test with sample HTML
4. ✅ Load patterns from GeneratePress

### Short Term
1. Import your first real pattern
2. Test with different pattern types
3. Customize for your WordPress site
4. Explore global styles integration

### Long Term
1. Add more style conversions (gradients, etc.)
2. Implement image loading with CORS
3. Add component variant creation
4. Build bidirectional sync (Figma → WordPress)
5. Publish to Figma Community

## 💡 Pro Tips

1. **Start Simple:** Test with simple HTML before complex patterns
2. **Use Preview Field:** Always use the `preview` field from pattern tree
3. **Cache Patterns:** Patterns don't change often, cache API responses
4. **Check Styles:** Verify inline styles or computed styles are available
5. **Auto Layout:** Ensure parent has `display: flex` for Auto Layout

## 🎓 Understanding the System

### Where Patterns Come From
- Remote library at patterns.generatepress.com
- Fetched via REST API (not in your DB)
- Use public key authentication
- Pattern tree contains rendered HTML

### How Sync Works
- GenerateCloud provides auth framework
- Patterns synced via REST API calls
- Global styles fetched separately
- Consumer can import to local DB

### How Import Works
- UI parses HTML with DOMParser
- Computes styles with getComputedStyle
- Sends parsed data to plugin code
- Plugin creates Figma frames with Auto Layout

## ✅ Success Criteria

You're ready when you can:

- ✅ Build the plugin without errors
- ✅ Load it in Figma Desktop
- ✅ Import sample HTML successfully
- ✅ See proper Auto Layout applied
- ✅ Load patterns from GeneratePress
- ✅ Understand the pattern tree structure

## 🤝 Getting Help

If something doesn't work:

1. **Check the docs** - All answers are in the markdown files
2. **Review error messages** - They usually point to the issue
3. **Test with simple HTML** - Isolate the problem
4. **Check console logs** - Both UI and plugin consoles
5. **Verify setup** - Ensure all files are in place

---

## 🚀 Quick Start Summary

```bash
# 1. Build the plugin
cd figma-plugin
npm install
npm run build

# 2. Load in Figma
# Figma Desktop → Plugins → Development → Import plugin from manifest
# Select: figma-plugin/manifest.json

# 3. Test
# Open plugin → Import HTML tab → Paste sample HTML → Import

# 4. Use
# Browse tab → Load Patterns → Click any pattern → Done!
```

**You're all set! Happy pattern importing! 🎉**
