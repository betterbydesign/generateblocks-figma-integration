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
