# Figma Plugin Implementation Guide

## Quick Start

This is a **simplified, production-ready** implementation that focuses on the core functionality.

## Project Structure

```
generateblocks-figma-importer/
├── manifest.json           # Plugin manifest
├── package.json           # NPM dependencies
├── tsconfig.json          # TypeScript config
├── webpack.config.js      # Build config
├── ui.html               # Plugin UI
└── src/
    ├── code.ts           # Main plugin code
    ├── types.ts          # Type definitions
    ├── parser.ts         # HTML parser
    ├── converter.ts      # HTML to Figma converter
    └── utils.ts          # Utility functions
```

## Installation

```bash
# 1. Create plugin directory
mkdir generateblocks-figma-importer
cd generateblocks-figma-importer

# 2. Initialize npm
npm init -y

# 3. Install dependencies
npm install --save-dev @figma/plugin-typings typescript ts-loader webpack webpack-cli

# 4. Copy the provided files to your project

# 5. Build the plugin
npm run build

# 6. Load in Figma
# Figma Desktop App → Plugins → Development → Import plugin from manifest
```

## Core Implementation Files

### 1. types.ts - Type Definitions

```typescript
// src/types.ts

export interface ParsedNode {
  tag: string;
  classes: string[];
  id?: string;
  text?: string;
  children: ParsedNode[];
  computedStyles: {
    // Layout
    display?: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
    gap?: string;
    padding?: string;
    margin?: string;
    
    // Dimensions
    width?: string;
    height?: string;
    minWidth?: string;
    maxWidth?: string;
    
    // Visual
    backgroundColor?: string;
    color?: string;
    borderRadius?: string;
    border?: string;
    boxShadow?: string;
    
    // Typography
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    textAlign?: string;
  };
}

export interface PatternData {
  id: string;
  label: string;
  pattern: string;
  preview: string;
  scripts?: string[];
  styles?: string[];
  globalStyleSelectors?: string[];
  categories?: number[];
}

export interface PluginMessage {
  type: string;
  data?: any;
}
```

### 2. parser.ts - Simple HTML Parser

```typescript
// src/parser.ts

import { ParsedNode } from './types';

export class SimpleHTMLParser {
  parse(html: string): ParsedNode {
    // Create iframe to safely parse HTML
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) throw new Error('Failed to create document');
    
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            /* Include any base styles needed for computation */
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    doc.close();
    
    // Wait for styles to compute
    const rootElement = doc.body.firstElementChild as HTMLElement;
    const parsed = this.parseElement(rootElement, doc.defaultView!);
    
    document.body.removeChild(iframe);
    
    return parsed;
  }
  
  private parseElement(element: HTMLElement, win: Window): ParsedNode {
    const styles = win.getComputedStyle(element);
    
    // Get only text nodes (not nested elements)
    const directText = Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent?.trim())
      .filter(Boolean)
      .join(' ');
    
    return {
      tag: element.tagName.toLowerCase(),
      classes: Array.from(element.classList),
      id: element.id || undefined,
      text: directText || undefined,
      children: Array.from(element.children)
        .map(child => this.parseElement(child as HTMLElement, win)),
      computedStyles: {
        display: styles.display,
        flexDirection: styles.flexDirection,
        justifyContent: styles.justifyContent,
        alignItems: styles.alignItems,
        gap: styles.gap,
        padding: styles.padding,
        margin: styles.margin,
        width: styles.width,
        height: styles.height,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        borderRadius: styles.borderRadius,
        border: styles.border,
        boxShadow: styles.boxShadow,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        textAlign: styles.textAlign
      }
    };
  }
}
```

### 3. utils.ts - Utility Functions

```typescript
// src/utils.ts

export class ColorConverter {
  static parseColor(colorStr: string): RGB {
    if (colorStr.startsWith('rgb')) {
      return this.parseRGB(colorStr);
    } else if (colorStr.startsWith('#')) {
      return this.parseHex(colorStr);
    }
    
    // Default to black
    return { r: 0, g: 0, b: 0 };
  }
  
  private static parseRGB(rgb: string): RGB {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return { r: 0, g: 0, b: 0 };
    
    return {
      r: parseInt(match[1]) / 255,
      g: parseInt(match[2]) / 255,
      b: parseInt(match[3]) / 255
    };
  }
  
  private static parseHex(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };
    
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    };
  }
}

export class UnitConverter {
  static toPixels(value: string): number {
    if (!value) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  static parsePadding(padding: string): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    const values = padding.split(' ').map(v => this.toPixels(v));
    
    if (values.length === 1) {
      return { top: values[0], right: values[0], bottom: values[0], left: values[0] };
    } else if (values.length === 2) {
      return { top: values[0], right: values[1], bottom: values[0], left: values[1] };
    } else if (values.length === 3) {
      return { top: values[0], right: values[1], bottom: values[2], left: values[1] };
    } else {
      return { top: values[0], right: values[1], bottom: values[2], left: values[3] };
    }
  }
}
```

### 4. converter.ts - HTML to Figma Converter

```typescript
// src/converter.ts

import { ParsedNode } from './types';
import { ColorConverter, UnitConverter } from './utils';

export class FigmaConverter {
  async convert(parsed: ParsedNode, parentNode?: BaseNode): Promise<SceneNode> {
    // Determine node type
    if (parsed.text && parsed.children.length === 0) {
      return this.createTextNode(parsed);
    }
    
    if (parsed.tag === 'img') {
      return this.createImageNode(parsed);
    }
    
    return this.createFrameNode(parsed);
  }
  
  private async createFrameNode(parsed: ParsedNode): Promise<FrameNode> {
    const frame = figma.createFrame();
    
    // Set name
    frame.name = this.getNodeName(parsed);
    
    // Apply visual styles
    this.applyBackgroundColor(frame, parsed);
    this.applyBorderRadius(frame, parsed);
    this.applyBoxShadow(frame, parsed);
    
    // Apply layout
    this.applyAutoLayout(frame, parsed);
    
    // Set size if specified
    const width = UnitConverter.toPixels(parsed.computedStyles.width || '');
    const height = UnitConverter.toPixels(parsed.computedStyles.height || '');
    
    if (width > 0 && height > 0) {
      frame.resize(width, height);
    } else if (frame.layoutMode === 'NONE') {
      // Default size for non-auto-layout frames
      frame.resize(200, 100);
    }
    
    // Create children
    for (const child of parsed.children) {
      const childNode = await this.convert(child, frame);
      frame.appendChild(childNode);
    }
    
    return frame;
  }
  
  private async createTextNode(parsed: ParsedNode): Promise<TextNode> {
    const text = figma.createText();
    
    // Load default font
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    
    // Set text content
    text.characters = parsed.text || '';
    text.name = 'Text';
    
    // Apply text styles
    const fontSize = UnitConverter.toPixels(parsed.computedStyles.fontSize || '16');
    text.fontSize = fontSize;
    
    // Apply color
    if (parsed.computedStyles.color) {
      const color = ColorConverter.parseColor(parsed.computedStyles.color);
      text.fills = [{ type: 'SOLID', color }];
    }
    
    // Apply alignment
    const textAlign = parsed.computedStyles.textAlign || 'left';
    text.textAlignHorizontal = this.mapTextAlign(textAlign);
    
    return text;
  }
  
  private createImageNode(parsed: ParsedNode): RectangleNode {
    const rect = figma.createRectangle();
    rect.name = 'Image';
    
    // Create placeholder
    rect.fills = [{ 
      type: 'SOLID', 
      color: { r: 0.9, g: 0.9, b: 0.9 } 
    }];
    
    rect.resize(200, 150);
    
    return rect;
  }
  
  private applyAutoLayout(frame: FrameNode, parsed: ParsedNode) {
    const display = parsed.computedStyles.display;
    
    // Only apply auto layout for flex or grid
    if (display !== 'flex' && display !== 'inline-flex' && display !== 'grid') {
      frame.layoutMode = 'NONE';
      return;
    }
    
    // Determine direction
    const flexDirection = parsed.computedStyles.flexDirection || 'row';
    frame.layoutMode = flexDirection.includes('column') ? 'VERTICAL' : 'HORIZONTAL';
    
    // Apply spacing
    const gap = UnitConverter.toPixels(parsed.computedStyles.gap || '0');
    frame.itemSpacing = gap;
    
    // Apply padding
    const padding = UnitConverter.parsePadding(parsed.computedStyles.padding || '0');
    frame.paddingLeft = padding.left;
    frame.paddingRight = padding.right;
    frame.paddingTop = padding.top;
    frame.paddingBottom = padding.bottom;
    
    // Apply alignment
    const justify = parsed.computedStyles.justifyContent || 'flex-start';
    const align = parsed.computedStyles.alignItems || 'stretch';
    
    frame.primaryAxisAlignItems = this.mapJustifyContent(justify);
    frame.counterAxisAlignItems = this.mapAlignItems(align);
  }
  
  private applyBackgroundColor(node: FrameNode | RectangleNode, parsed: ParsedNode) {
    const bgColor = parsed.computedStyles.backgroundColor;
    if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
      node.fills = [];
      return;
    }
    
    const color = ColorConverter.parseColor(bgColor);
    node.fills = [{ type: 'SOLID', color }];
  }
  
  private applyBorderRadius(node: FrameNode | RectangleNode, parsed: ParsedNode) {
    const radius = UnitConverter.toPixels(parsed.computedStyles.borderRadius || '0');
    node.cornerRadius = radius;
  }
  
  private applyBoxShadow(node: FrameNode | RectangleNode, parsed: ParsedNode) {
    const shadow = parsed.computedStyles.boxShadow;
    if (!shadow || shadow === 'none') return;
    
    // Simple shadow parsing (format: "0px 4px 8px rgba(0,0,0,0.25)")
    const match = shadow.match(/([-\d.]+)px\s+([-\d.]+)px\s+([-\d.]+)px\s+(.+)/);
    if (!match) return;
    
    const [, x, y, blur, color] = match;
    
    node.effects = [{
      type: 'DROP_SHADOW',
      color: { ...ColorConverter.parseColor(color), a: 0.25 },
      offset: { x: parseFloat(x), y: parseFloat(y) },
      radius: parseFloat(blur),
      visible: true,
      blendMode: 'NORMAL'
    }];
  }
  
  private getNodeName(parsed: ParsedNode): string {
    // Use GenerateBlocks class name
    const gbClass = parsed.classes.find(c => c.startsWith('gb-'));
    if (gbClass) {
      return gbClass.replace('gb-', '').split('-').map(
        w => w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' ');
    }
    
    // Use first class or tag name
    return parsed.classes[0] || parsed.tag;
  }
  
  private mapJustifyContent(justify: string): 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' {
    const map: Record<string, any> = {
      'flex-start': 'MIN',
      'center': 'CENTER',
      'flex-end': 'MAX',
      'space-between': 'SPACE_BETWEEN'
    };
    return map[justify] || 'MIN';
  }
  
  private mapAlignItems(align: string): 'MIN' | 'CENTER' | 'MAX' {
    const map: Record<string, any> = {
      'flex-start': 'MIN',
      'center': 'CENTER',
      'flex-end': 'MAX',
      'stretch': 'MIN'
    };
    return map[align] || 'MIN';
  }
  
  private mapTextAlign(align: string): 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED' {
    const map: Record<string, any> = {
      'left': 'LEFT',
      'center': 'CENTER',
      'right': 'RIGHT',
      'justify': 'JUSTIFIED'
    };
    return map[align] || 'LEFT';
  }
}
```

### 5. code.ts - Main Plugin Code

```typescript
// src/code.ts

import { SimpleHTMLParser } from './parser';
import { FigmaConverter } from './converter';
import { PluginMessage, PatternData } from './types';

// Show UI
figma.showUI(__html__, { 
  width: 400, 
  height: 600,
  themeColors: true 
});

const parser = new SimpleHTMLParser();
const converter = new FigmaConverter();

figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
    switch (msg.type) {
      case 'import-pattern':
        await handleImportPattern(msg.data);
        break;
        
      case 'fetch-patterns':
        await handleFetchPatterns(msg.data);
        break;
        
      case 'cancel':
        figma.closePlugin();
        break;
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      data: { message: error.message }
    });
  }
};

async function handleImportPattern(data: { html: string; name: string }) {
  const { html, name } = data;
  
  // Parse HTML in UI thread (has DOM access)
  figma.ui.postMessage({
    type: 'parse-html',
    data: { html }
  });
}

// Listen for parsed data from UI
figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'html-parsed') {
    const { parsed, name } = msg.data;
    
    // Convert to Figma nodes
    const frame = await converter.convert(parsed);
    frame.name = name;
    
    // Select and zoom to the created frame
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);
    
    figma.ui.postMessage({
      type: 'import-success',
      data: { nodeName: frame.name }
    });
  }
};

async function handleFetchPatterns(data: { siteUrl: string; publicKey: string }) {
  const { siteUrl, publicKey } = data;
  
  try {
    const url = `${siteUrl}/wp-json/generateblocks-pro/v1/pattern-library/patterns`;
    
    // Note: Figma plugins can't make network requests directly
    // We need to do this in the UI thread
    figma.ui.postMessage({
      type: 'fetch-from-ui',
      data: { url, publicKey }
    });
    
  } catch (error) {
    figma.ui.postMessage({
      type: 'fetch-error',
      data: { error: error.message }
    });
  }
}
```

## Testing

### Test with Sample HTML

```html
<div style="display: flex; flex-direction: column; gap: 16px; padding: 24px; background-color: #f5f5f5; border-radius: 8px;">
  <div style="font-size: 24px; font-weight: bold; color: #333;">Hero Section</div>
  <div style="font-size: 16px; color: #666;">This is a sample pattern from GenerateBlocks</div>
  <div style="display: flex; gap: 8px;">
    <div style="padding: 12px 24px; background-color: #0066ff; color: white; border-radius: 6px;">Primary Button</div>
    <div style="padding: 12px 24px; background-color: transparent; color: #0066ff; border: 2px solid #0066ff; border-radius: 6px;">Secondary Button</div>
  </div>
</div>
```

## Known Limitations

1. **Images**: Image loading requires CORS-enabled URLs
2. **Fonts**: Only Inter font is loaded by default
3. **Complex CSS**: Advanced CSS features may not convert perfectly
4. **Responsive**: No responsive/breakpoint support yet
5. **Animations**: CSS animations are not converted

## Next Steps

1. Add support for more fonts
2. Implement image loading with CORS proxy
3. Add CSS grid to Auto Layout conversion
4. Support for absolute positioning
5. Component variant creation
6. Style library sync

## Debugging Tips

- Use `console.log()` in the UI to see parsed data
- Use `figma.notify()` for user-facing messages
- Check Figma Desktop App console for errors
- Test with simple HTML first, then add complexity

This simplified implementation focuses on the core functionality and can be extended based on your needs!
