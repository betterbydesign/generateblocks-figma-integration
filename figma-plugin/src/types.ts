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
