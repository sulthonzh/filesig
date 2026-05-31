#!/usr/bin/env node
"use strict";
/**
 * filesig CLI — detect file types from magic bytes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("./index.js");
const fs_1 = require("fs");
const path_1 = require("path");
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
    const pkg = JSON.parse((0, fs_1.readFileSync)(require.resolve('../package.json'), 'utf8'));
    console.log(`filesig v${pkg.version}`);
    process.exit(0);
}
if (args.includes('--list')) {
    const all = (0, index_js_1.listAll)();
    const cats = new Map();
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
const files = args.filter((a) => !a.startsWith('--'));
if (files.length === 0) {
    console.error('No files specified. Use --help for usage.');
    process.exit(1);
}
const results = [];
let hasError = false;
for (const file of files) {
    try {
        const stat = (0, fs_1.statSync)(file);
        const fullBuf = (0, fs_1.readFileSync)(file);
        const buf = fullBuf.subarray(0, Math.min(fullBuf.length, 65536));
        const result = (0, index_js_1.detectWithExt)(buf, file);
        if (jsonMode) {
            results.push({ file, size: stat.size, detected: result });
        }
        else if (shortMode) {
            console.log(result ? result.mime : 'application/octet-stream');
        }
        else {
            const name = (0, path_1.basename)(file);
            if (result) {
                const conf = `${Math.round(result.confidence * 100)}%`;
                const ext = (0, path_1.extname)(file).toLowerCase().replace('.', '');
                const extMatch = result.ext.includes(ext) ? '✓' : (ext ? '✗' : ' ');
                console.log(`${name}  →  ${result.name}  (${result.mime})  [${result.category}]  confidence: ${conf}  extension match: ${extMatch}`);
            }
            else {
                console.log(`${name}  →  Unknown`);
            }
        }
    }
    catch (err) {
        hasError = true;
        if (jsonMode) {
            results.push({ file, size: 0, error: err.message });
        }
        else {
            console.error(`Error: ${file}: ${err.message}`);
        }
    }
}
if (jsonMode) {
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
}
process.exit(hasError ? 1 : 0);
