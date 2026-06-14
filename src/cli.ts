#!/usr/bin/env node
/**
 * filesig CLI — detect file types from magic bytes.
 */

import { detectWithExt, listAll, DetectResult } from './index.js';
import { readFileSync, statSync } from 'fs';
import { basename, extname } from 'path';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`filesig — detect file types from magic bytes, not extensions

Usage:
  filesig <file...>         Detect file type(s)
  filesig --list            List all supported formats
  filesig --json <file...>  Output as JSON
  filesig --short <file...> Just show MIME type
  filesig --version         Show version

Examples:
  filesig photo.jpg          # → JPEG (image/jpeg) 95%
  filesig --json mystery     # → {"name":"PNG","mime":"image/png",...}
  filesig --short data.bin   # → image/png
`);
  process.exit(0);
}

if (args.includes('--version')) {
  const pkg = JSON.parse(readFileSync(require.resolve('../package.json'), 'utf8'));
  console.log(`filesig v${pkg.version}`);
  process.exit(0);
}

if (args.includes('--list')) {
  const all = listAll();
  const cats = new Map<string, DetectResult[]>();
  for (const r of all) {
    const list = cats.get(r.category) ?? [];
    list.push(r);
    cats.set(r.category, list);
  }
  console.log('Supported file types:\n');
  for (const [cat, items] of cats) {
    console.log(`  ${cat.toUpperCase()}`);
    for (const item of items) {
      console.log(`    ${item.name.padEnd(20)} ${item.mime}  (${item.ext.join(', ')})`);
    }
    console.log();
  }
  console.log(`Total: ${all.length} file types`);
  process.exit(0);
}

const jsonMode = args.includes('--json');
const shortMode = args.includes('--short');
const files = args.filter((a: string) => !a.startsWith('--'));

if (files.length === 0) {
  console.error('No files specified. Use --help for usage.');
  process.exit(1);
}

interface OutputEntry {
  file: string;
  size: number;
  detected?: {
    name: string;
    mime: string;
    ext: string[];
    category: string;
    confidence: number;
  } | null;
  error?: string;
}

const results: OutputEntry[] = [];
let hasError = false;

for (const file of files) {
  try {
    const stat = statSync(file);
    const fullBuf = readFileSync(file);
    const buf = fullBuf.subarray(0, Math.min(fullBuf.length, 65536));
    const result = detectWithExt(buf, file);

    if (jsonMode) {
      results.push({ file, size: stat.size, detected: result });
    } else if (shortMode) {
      console.log(result ? result.mime : 'application/octet-stream');
    } else {
      const name = basename(file);
      if (result) {
        const conf = `${Math.round(result.confidence * 100)}%`;
        const ext = extname(file).toLowerCase().replace('.', '');
        const extMatch = result.ext.includes(ext) ? '✓' : (ext ? '✗' : ' ');
        console.log(`${name}  →  ${result.name}  (${result.mime})  [${result.category}]  confidence: ${conf}  extension match: ${extMatch}`);
      } else {
        console.log(`${name}  →  Unknown`);
      }
    }
  } catch (err: any) {
    hasError = true;
    if (jsonMode) {
      results.push({ file, size: 0, error: err.message });
    } else {
      console.error(`Error: ${file}: ${err.message}`);
    }
  }
}

if (jsonMode) {
  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
}

process.exit(hasError ? 1 : 0);
