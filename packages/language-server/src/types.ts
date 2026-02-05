/**
 * Types for Expressive Code text markers
 */

export type MarkerType = 'mark' | 'ins' | 'del';

export interface LineRange {
  start: number;
  end: number;
}

export interface LineMarker {
  type: MarkerType;
  ranges: LineRange[];
  label?: string;
}

export interface InlineMarker {
  type: MarkerType;
  pattern: string | RegExp;
  isRegex: boolean;
}

export interface CodeFenceMetadata {
  language: string;
  lineMarkers: LineMarker[];
  inlineMarkers: InlineMarker[];
  useDiffSyntax: boolean;
  diffLanguage?: string; // for lang="..." when using diff
}

export interface MarkerMatch {
  type: MarkerType;
  line: number;
  startChar: number;
  endChar: number;
  isLineMarker: boolean;
  label?: string;
}
