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
