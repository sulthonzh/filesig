/**
 * filesig — Zero-dep file type detector using magic bytes.
 */

import { signatures, disambiguateZip, disambiguateRIFF } from './sigs.js';
import { existsSync, readFileSync } from 'fs';
import { extname } from 'path';

export interface DetectResult {
  name: string;
  mime: string;
  ext: string[];
  category: string;
  confidence: number; // 0-1
}

/**
 * Detect file type from a buffer of content.
 * Reads at most the first 64KB for detection (enough for all signatures).
 */
export function detect(buf: Buffer): DetectResult | null {
  if (!buf || buf.length < 2) return null;

  for (const sig of signatures) {
    const offset = sig.offset ?? 0;

    if (typeof sig.magic === 'string') {
      const magicBuf = Buffer.from(sig.magic, 'hex');
      if (buf.length < offset + magicBuf.length) continue;
      const slice = buf.subarray(offset, offset + magicBuf.length);
      if (slice.equals(magicBuf)) {
        if (sig.name === 'ZIP' || sig.name === 'DOCX' || sig.name === 'XLSX' || sig.name === 'PPTX') {
          const refined = disambiguateZip(buf);
          if (refined) return { ...refined, category: refined.category, confidence: 0.95 };
          return { name: sig.name, mime: sig.mime, ext: sig.ext, category: sig.category, confidence: 0.7 };
        }
        if (sig.name === 'AVI' || sig.name === 'WAV') {
          const refined = disambiguateRIFF(buf);
          if (refined) return { ...refined, category: refined.category, confidence: 0.95 };
        }
        return { name: sig.name, mime: sig.mime, ext: sig.ext, category: sig.category, confidence: 0.95 };
      }
    } else {
      try {
        if (sig.magic(buf)) {
          return { name: sig.name, mime: sig.mime, ext: sig.ext, category: sig.category, confidence: 0.85 };
        }
      } catch { /* skip */ }
    }
  }

  // Text-based detection heuristics
  return detectText(buf);
}

function detectText(buf: Buffer): DetectResult | null {
  // Check if it looks like text (no null bytes in first 8KB)
  const sample = buf.subarray(0, Math.min(buf.length, 8192));
  const hasNull = sample.includes(0x00);
  if (hasNull) return null;

  const text = sample.toString('utf8');

  if ((text.startsWith('{') && text.includes('}')) || (text.startsWith('[') && text.includes(']'))) {
    try {
      JSON.parse(text);
      return { name: 'JSON', mime: 'application/json', ext: ['json'], category: 'data', confidence: 0.9 };
    } catch { /* not JSON */ }
  }

  if (text.trimStart().startsWith('<?xml') || text.trimStart().startsWith('<')) {
    return { name: 'XML', mime: 'application/xml', ext: ['xml'], category: 'data', confidence: 0.7 };
  }

  if (text.includes('---\n') || (text.includes(': ') && text.includes('\n') && !text.includes('{'))) {
    return { name: 'YAML', mime: 'text/yaml', ext: ['yml', 'yaml'], category: 'data', confidence: 0.5 };
  }

  if (text.startsWith('#!/bin/sh') || text.startsWith('#!/bin/bash') || text.startsWith('#!/usr/bin/env sh') || text.startsWith('#!/usr/bin/env bash')) {
    return { name: 'Shell Script', mime: 'text/x-shellscript', ext: ['sh'], category: 'data', confidence: 0.9 };
  }

  if (text.startsWith('#!/usr/bin/env python') || text.startsWith('#!/usr/bin/python')) {
    return { name: 'Python Script', mime: 'text/x-python', ext: ['py'], category: 'data', confidence: 0.9 };
  }

  return { name: 'Text', mime: 'text/plain', ext: ['txt'], category: 'data', confidence: 0.3 };
}

/**
 * Detect file type from a file path.
 * Reads up to 64KB from the file.
 */
export function detectFile(filePath: string): DetectResult | null {
  if (!existsSync(filePath)) return null;
  const buf = readFileSync(filePath);
  return detect(buf);
}

/**
 * Detect file type and consider the file extension as a hint.
 */
export function detectWithExt(buf: Buffer, filePath: string): DetectResult | null {
  const result = detect(buf);
  const ext = extname(filePath).toLowerCase().replace('.', '');

  if (!result) {
    return guessFromExt(ext);
  }

  if (result.ext.includes(ext)) {
    return { ...result, confidence: 1.0 };
  }

  return result;
}

const extMap: Record<string, DetectResult> = {
  js: { name: 'JavaScript', mime: 'text/javascript', ext: ['js'], category: 'data', confidence: 0.4 },
  ts: { name: 'TypeScript', mime: 'text/typescript', ext: ['ts'], category: 'data', confidence: 0.4 },
  jsx: { name: 'JSX', mime: 'text/jsx', ext: ['jsx'], category: 'data', confidence: 0.4 },
  tsx: { name: 'TSX', mime: 'text/tsx', ext: ['tsx'], category: 'data', confidence: 0.4 },
  css: { name: 'CSS', mime: 'text/css', ext: ['css'], category: 'data', confidence: 0.4 },
  html: { name: 'HTML', mime: 'text/html', ext: ['html', 'htm'], category: 'data', confidence: 0.4 },
  md: { name: 'Markdown', mime: 'text/markdown', ext: ['md'], category: 'data', confidence: 0.4 },
  py: { name: 'Python', mime: 'text/x-python', ext: ['py'], category: 'data', confidence: 0.4 },
  rs: { name: 'Rust', mime: 'text/rust', ext: ['rs'], category: 'data', confidence: 0.4 },
  go: { name: 'Go', mime: 'text/go', ext: ['go'], category: 'data', confidence: 0.4 },
  java: { name: 'Java', mime: 'text/x-java', ext: ['java'], category: 'data', confidence: 0.4 },
  rb: { name: 'Ruby', mime: 'text/x-ruby', ext: ['rb'], category: 'data', confidence: 0.4 },
  php: { name: 'PHP', mime: 'text/x-php', ext: ['php'], category: 'data', confidence: 0.4 },
  sh: { name: 'Shell', mime: 'text/x-shellscript', ext: ['sh'], category: 'data', confidence: 0.4 },
  yaml: { name: 'YAML', mime: 'text/yaml', ext: ['yml', 'yaml'], category: 'data', confidence: 0.4 },
  yml: { name: 'YAML', mime: 'text/yaml', ext: ['yml', 'yaml'], category: 'data', confidence: 0.4 },
  toml: { name: 'TOML', mime: 'text/toml', ext: ['toml'], category: 'data', confidence: 0.4 },
  csv: { name: 'CSV', mime: 'text/csv', ext: ['csv'], category: 'data', confidence: 0.4 },
  lock: { name: 'Lockfile', mime: 'text/plain', ext: ['lock'], category: 'data', confidence: 0.3 },
};

function guessFromExt(ext: string): DetectResult | null {
  return extMap[ext] ?? null;
}

/**
 * Get all supported file types.
 */
export function listAll(): DetectResult[] {
  return signatures.map(s => ({
    name: s.name,
    mime: s.mime,
    ext: s.ext,
    category: s.category,
    confidence: 1.0,
  }));
}

/**
 * Check if a buffer matches a specific MIME type.
 */
export function isMime(buf: Buffer, mime: string): boolean {
  const result = detect(buf);
  return result?.mime === mime;
}

/**
 * Check if a buffer matches a specific extension.
 */
export function isExt(buf: Buffer, ext: string): boolean {
  const result = detect(buf);
  return result?.ext.includes(ext) ?? false;
}
