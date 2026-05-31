"use strict";
/**
 * filesig — Zero-dep file type detector using magic bytes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detect = detect;
exports.detectFile = detectFile;
exports.detectWithExt = detectWithExt;
exports.listAll = listAll;
exports.isMime = isMime;
exports.isExt = isExt;
const sigs_js_1 = require("./sigs.js");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Detect file type from a buffer of content.
 * Reads at most the first 64KB for detection (enough for all signatures).
 */
function detect(buf) {
    if (!buf || buf.length < 2)
        return null;
    for (const sig of sigs_js_1.signatures) {
        const offset = sig.offset ?? 0;
        if (typeof sig.magic === 'string') {
            const magicBuf = Buffer.from(sig.magic, 'hex');
            if (buf.length < offset + magicBuf.length)
                continue;
            const slice = buf.subarray(offset, offset + magicBuf.length);
            if (slice.equals(magicBuf)) {
                // Disambiguate ambiguous signatures
                if (sig.name === 'ZIP' || sig.name === 'DOCX' || sig.name === 'XLSX' || sig.name === 'PPTX') {
                    const refined = (0, sigs_js_1.disambiguateZip)(buf);
                    if (refined)
                        return { ...refined, category: refined.category, confidence: 0.95 };
                    return { name: sig.name, mime: sig.mime, ext: sig.ext, category: sig.category, confidence: 0.7 };
                }
                if (sig.name === 'AVI' || sig.name === 'WAV') {
                    const refined = (0, sigs_js_1.disambiguateRIFF)(buf);
                    if (refined)
                        return { ...refined, category: refined.category, confidence: 0.95 };
                }
                return { name: sig.name, mime: sig.mime, ext: sig.ext, category: sig.category, confidence: 0.95 };
            }
        }
        else {
            // Function-based magic
            try {
                if (sig.magic(buf)) {
                    return { name: sig.name, mime: sig.mime, ext: sig.ext, category: sig.category, confidence: 0.85 };
                }
            }
            catch { /* skip */ }
        }
    }
    // Text-based detection heuristics
    return detectText(buf);
}
function detectText(buf) {
    // Check if it looks like text (no null bytes in first 8KB)
    const sample = buf.subarray(0, Math.min(buf.length, 8192));
    const hasNull = sample.includes(0x00);
    if (hasNull)
        return null;
    const text = sample.toString('utf8');
    // JSON
    if ((text.startsWith('{') && text.includes('}')) || (text.startsWith('[') && text.includes(']'))) {
        try {
            JSON.parse(text);
            return { name: 'JSON', mime: 'application/json', ext: ['json'], category: 'data', confidence: 0.9 };
        }
        catch { /* not JSON */ }
    }
    // XML
    if (text.trimStart().startsWith('<?xml') || text.trimStart().startsWith('<')) {
        return { name: 'XML', mime: 'application/xml', ext: ['xml'], category: 'data', confidence: 0.7 };
    }
    // YAML (basic heuristic)
    if (text.includes('---\n') || (text.includes(': ') && text.includes('\n') && !text.includes('{'))) {
        return { name: 'YAML', mime: 'text/yaml', ext: ['yml', 'yaml'], category: 'data', confidence: 0.5 };
    }
    // Shell script
    if (text.startsWith('#!/bin/sh') || text.startsWith('#!/bin/bash') || text.startsWith('#!/usr/bin/env sh') || text.startsWith('#!/usr/bin/env bash')) {
        return { name: 'Shell Script', mime: 'text/x-shellscript', ext: ['sh'], category: 'data', confidence: 0.9 };
    }
    // Python
    if (text.startsWith('#!/usr/bin/env python') || text.startsWith('#!/usr/bin/python')) {
        return { name: 'Python Script', mime: 'text/x-python', ext: ['py'], category: 'data', confidence: 0.9 };
    }
    // Generic text
    return { name: 'Text', mime: 'text/plain', ext: ['txt'], category: 'data', confidence: 0.3 };
}
/**
 * Detect file type from a file path.
 * Reads up to 64KB from the file.
 */
function detectFile(filePath) {
    if (!(0, fs_1.existsSync)(filePath))
        return null;
    const stat = (0, fs_1.statSync)(filePath);
    const readSize = Math.min(stat.size, 65536);
    const buf = (0, fs_1.readFileSync)(filePath);
    const sample = buf.subarray(0, Math.min(buf.length, readSize));
    return detect(buf);
}
/**
 * Detect file type and consider the file extension as a hint.
 */
function detectWithExt(buf, filePath) {
    const result = detect(buf);
    const ext = (0, path_1.extname)(filePath).toLowerCase().replace('.', '');
    if (!result) {
        // Fallback: guess from extension only
        return guessFromExt(ext);
    }
    // Boost confidence if extension matches
    if (result.ext.includes(ext)) {
        return { ...result, confidence: 1.0 };
    }
    return result;
}
const extMap = {
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
function guessFromExt(ext) {
    return extMap[ext] ?? null;
}
/**
 * Get all supported file types.
 */
function listAll() {
    return sigs_js_1.signatures.map(s => ({
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
function isMime(buf, mime) {
    const result = detect(buf);
    return result?.mime === mime;
}
/**
 * Check if a buffer matches a specific extension.
 */
function isExt(buf, ext) {
    const result = detect(buf);
    return result?.ext.includes(ext) ?? false;
}
