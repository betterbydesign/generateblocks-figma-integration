# GenerateBlocks Pattern Importer - Figma Plugin

Import GenerateBlocks HTML patterns into Figma with automatic Auto Layout conversion.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Figma Desktop App

### Build & Install

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# For development (auto-rebuild on changes)
npm run watch
```

### Load in Figma

1. Open **Figma Desktop App** (plugins don't work in browser)
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Navigate to this directory and select `manifest.json`
4. Plugin appears in your Plugins menu

## 📁 Project Structure

```
figma-plugin/
├── manifest.json          # Figma plugin configuration
├── package.json          # NPM dependencies & scripts
├── tsconfig.json         # TypeScript compiler config
├── webpack.config.js     # Webpack bundler config
├── ui.html              # Plugin UI (complete & functional)
├── src/                 # TypeScript source files
│   ├── code.ts          # Main plugin code (message handling)
│   ├── types.ts         # TypeScript type definitions
│   ├── converter.ts     # HTML to Figma converter (Auto Layout)
│   └── utils.ts         # Utility functions (color, units)
└── dist/                # Build output (created by webpack)
    └── code.js          # Compiled plugin code
```

## ✨ Features

- **Browse Patterns** - Load patterns from WordPress REST API
- **Import HTML** - Paste pattern HTML and convert to Figma
- **Auto Layout** - Automatic flex → Auto Layout conversion
- **Style Conversion** - Colors, borders, shadows, padding, etc.
- **Settings Storage** - Save WordPress site configuration

## 🎯 What Gets Converted

### Layout (Automatic)
- `display: flex` → Auto Layout (horizontal/vertical)
- `flex-direction` → layoutMode
- `gap` → itemSpacing
- `padding` → frame padding
- `justify-content` → primaryAxisAlignItems
- `align-items` → counterAxisAlignItems

### Visual Styles
- `background-color` → fills
- `color` → text fills
- `border-radius` → cornerRadius
- `box-shadow` → drop shadow effects
- `font-size` → fontSize
- `font-weight` → fontWeight

### Structure
- Nested elements → nested frames
- Text nodes → TextNode
- Images → RectangleNode (placeholder)
- CSS classes → layer names

## 🧪 Testing

Try this sample HTML to test the plugin:

```html
<div style="display: flex; flex-direction: column; gap: 16px; padding: 24px; background-color: #f5f5f5; border-radius: 8px;">
  <div style="font-size: 24px; font-weight: bold; color: #333;">Hero Section</div>
  <div style="font-size: 16px; color: #666;">This is a sample pattern</div>
  <div style="display: flex; gap: 8px;">
    <div style="padding: 12px 24px; background-color: #0066ff; color: white; border-radius: 6px;">Primary</div>
    <div style="padding: 12px 24px; border: 2px solid #0066ff; color: #0066ff; border-radius: 6px;">Secondary</div>
  </div>
</div>
```

Expected result:
- Vertical Auto Layout frame with 16px gap
- 24px padding, light gray background, 8px border radius
- Two text nodes
- Horizontal Auto Layout frame with two button frames

## 🔧 Development

### Build Commands

```bash
# Production build
npm run build

# Development build with watch mode
npm run watch

# Clean build
rm -rf dist && npm run build
```

### Making Changes

1. Edit TypeScript files in `src/`
2. Run `npm run build` (or keep `npm run watch` running)
3. In Figma: **Plugins** → **Development** → **Reload plugin**
4. Test your changes

### Debugging

**UI Debugging (ui.html):**
- Open browser DevTools (Right-click → Inspect Element)
- Check Console tab for `console.log()` output
- Check Network tab for API requests

**Plugin Code Debugging (src/code.ts):**
- Open Figma Desktop DevTools:
  - Mac: **Plugins** → **Development** → **Open Console**
  - Windows: **Plugins** → **Development** → **Open Console**
- Check for `console.log()` and error messages

## 🐛 Troubleshooting

### Build Errors

**Error: "No inputs were found in config file"**
- **Cause:** `src/` directory is missing or empty
- **Fix:** Ensure all TypeScript files are present in `src/`:
  - `code.ts`
  - `types.ts`
  - `converter.ts`
  - `utils.ts`

**Error: "Cannot find module '@figma/plugin-typings'"**
- **Fix:** Run `npm install`

**Error: "tsc: command not found"**
- **Fix:** Run `npm install` to install TypeScript locally

### Plugin Loading Issues

**Plugin won't load in Figma**
- Ensure you're using **Figma Desktop App** (not browser)
- Check that `dist/code.js` exists after building
- Verify `manifest.json` points to `dist/code.js`

**Plugin loads but doesn't work**
- Check Figma Console for errors
- Reload plugin after rebuilding

### Import Issues

**Patterns won't load from WordPress**
- Check WordPress site URL in Settings tab
- Test API endpoint in browser first
- Verify network access in `manifest.json`

**HTML import creates wrong layout**
- Ensure HTML has `display: flex` styles
- Check that styles are inline or computed
- Try simpler HTML first to isolate issue

## 📚 Documentation

- **PLUGIN-SUMMARY.md** - Features and architecture overview
- **IMPLEMENTATION-GUIDE.md** - Detailed implementation guide
- **../USAGE-GUIDE.md** - Complete usage instructions
- **../README.md** - Project overview

## 🔗 API Endpoints

### Default Pattern Library
- **URL:** https://patterns.generatepress.com
- **Public Key:** `NPhxc91jLH5yGB4Ni6KryXN6HKKggte0`

### REST API Endpoints
```
GET  /wp-json/generateblocks-pro/v1/pattern-library/patterns
GET  /wp-json/generateblocks-pro/v1/pattern-library/categories
GET  /wp-json/generateblocks-pro/v1/pattern-library/provide-global-style-data
```

## 💡 Tips

1. **Start Simple** - Test with basic HTML before complex patterns
2. **Use Auto Layout** - Ensure parent elements have `display: flex`
3. **Inline Styles** - Work better than external CSS
4. **Cache Patterns** - Store fetched patterns to avoid repeated API calls
5. **Check Console** - Always check both UI and plugin consoles for errors

## 🎓 How It Works

```
WordPress REST API
    ↓
Pattern Tree Data (includes preview HTML)
    ↓
UI (ui.html) parses HTML with DOMParser
    ↓
Computes styles with getComputedStyle
    ↓
Sends parsed structure to plugin code
    ↓
Plugin creates Figma frames with Auto Layout
    ↓
Native Figma design!
```

## 📝 License

MIT - Use freely in your projects

---

**Ready to build?** Run `npm install && npm run build` and start importing patterns!
