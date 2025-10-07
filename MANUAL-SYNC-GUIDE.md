# Manual Sync Guide

The Sculptor sync is having issues due to a merge conflict. Here's how to manually get the files to your local machine.

## Option 1: Copy TypeScript Files Only (Fastest)

You only need 4 TypeScript files to fix the build error. Copy these to your local repo:

### Create the directory:
```bash
cd /Users/scottfoster/git/generateblocks-figma-integration/figma-plugin
mkdir -p src
```

### Copy the 4 TypeScript files:

I'll provide the contents below. Create each file in `figma-plugin/src/`:

---

## File 1: figma-plugin/src/types.ts

```typescript
// src/types.ts

export interface ParsedNode {
  tag: string;
  classes: string[];
  id?: string;
  text?: string;
  children: ParsedNode[];
  computedStyles: ComputedStyles;
}

export interface ComputedStyles {
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

---

## File 2: figma-plugin/src/utils.ts

```typescript
// src/utils.ts

export class ColorConverter {
  static parseColor(colorStr: string): RGB {
    if (!colorStr || colorStr === 'transparent') {
      return { r: 0, g: 0, b: 0 };
    }

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
    if (!padding) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const values = padding.split(/\s+/).map(v => this.toPixels(v));

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

---

## File 3: figma-plugin/src/converter.ts

```typescript
// src/converter.ts

import { ParsedNode } from './types';
import { ColorConverter, UnitConverter } from './utils';

export class FigmaConverter {
  async convert(parsed: ParsedNode): Promise<SceneNode> {
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
    await this.applyAutoLayout(frame, parsed);

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
      const childNode = await this.convert(child);
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
    text.fontSize = fontSize > 0 ? fontSize : 16;

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

  private async applyAutoLayout(frame: FrameNode, parsed: ParsedNode) {
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

    const [, x, y, blur, colorStr] = match;
    const color = ColorConverter.parseColor(colorStr);

    node.effects = [{
      type: 'DROP_SHADOW',
      color: { r: color.r, g: color.g, b: color.b, a: 0.25 },
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

---

## File 4: figma-plugin/src/code.ts

```typescript
// src/code.ts

import { FigmaConverter } from './converter';
import { PluginMessage } from './types';

// Show UI
figma.showUI(__html__, {
  width: 400,
  height: 600,
  themeColors: true
});

const converter = new FigmaConverter();

figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
    switch (msg.type) {
      case 'html-parsed':
        await handleHtmlParsed(msg.data);
        break;

      case 'cancel':
        figma.closePlugin();
        break;
    }
  } catch (error: any) {
    figma.ui.postMessage({
      type: 'error',
      data: { message: error.message }
    });
  }
};

async function handleHtmlParsed(data: { parsed: any; name: string }) {
  const { parsed, name } = data;

  try {
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

    figma.notify(`Successfully imported: ${frame.name}`);
  } catch (error: any) {
    figma.ui.postMessage({
      type: 'error',
      data: { message: error.message }
    });
    figma.notify(`Error: ${error.message}`, { error: true });
  }
}
```

---

## Build the Plugin

After copying these 4 files:

```bash
cd /Users/scottfoster/git/generateblocks-figma-integration/figma-plugin
npm install
npm run build
```

## Load in Figma

1. Open Figma Desktop App
2. Plugins → Development → Import plugin from manifest
3. Select: `/Users/scottfoster/git/generateblocks-figma-integration/figma-plugin/manifest.json`

Done!
