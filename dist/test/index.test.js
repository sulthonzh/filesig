"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const index_js_1 = require("../index.js");
const fs_1 = require("fs");
const path_1 = require("path");
const TMP = (0, path_1.join)(__dirname, '..', 'tmp_test');
function hexBuf(hex) {
    return Buffer.from(hex, 'hex');
}
(0, node_test_1.describe)('detect — images', () => {
    (0, node_test_1.it)('detects JPEG', () => {
        const buf = Buffer.alloc(64, 0);
        Buffer.from('FFD8FFE0', 'hex').copy(buf);
        const r = (0, index_js_1.detect)(buf);
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'JPEG');
        strict_1.default.equal(r.mime, 'image/jpeg');
        strict_1.default.ok(r.ext.includes('jpg'));
    });
    (0, node_test_1.it)('detects PNG', () => {
        const r = (0, index_js_1.detect)(hexBuf('89504E470D0A1A0A'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'PNG');
        strict_1.default.equal(r.mime, 'image/png');
    });
    (0, node_test_1.it)('detects GIF', () => {
        const r = (0, index_js_1.detect)(Buffer.from('GIF89a'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'GIF');
        strict_1.default.equal(r.category, 'image');
    });
    (0, node_test_1.it)('detects BMP', () => {
        const r = (0, index_js_1.detect)(hexBuf('424D'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'BMP');
    });
    (0, node_test_1.it)('detects WebP (via RIFF)', () => {
        const buf = Buffer.alloc(20, 0);
        Buffer.from('52494646', 'hex').copy(buf, 0);
        buf.writeUInt32LE(12, 4);
        Buffer.from('57454250', 'hex').copy(buf, 8);
        const r = (0, index_js_1.detect)(buf);
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'WebP');
    });
    (0, node_test_1.it)('detects ICO', () => {
        const r = (0, index_js_1.detect)(hexBuf('00000100'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'ICO');
    });
    (0, node_test_1.it)('detects SVG', () => {
        const r = (0, index_js_1.detect)(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'SVG');
    });
});
(0, node_test_1.describe)('detect — audio', () => {
    (0, node_test_1.it)('detects MP3 with ID3 tag', () => {
        const r = (0, index_js_1.detect)(Buffer.from('ID3\x04\x00'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'MP3 (ID3)');
        strict_1.default.equal(r.mime, 'audio/mpeg');
    });
    (0, node_test_1.it)('detects FLAC', () => {
        const r = (0, index_js_1.detect)(hexBuf('664C614300000022'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'FLAC');
    });
    (0, node_test_1.it)('detects OGG', () => {
        const r = (0, index_js_1.detect)(Buffer.from('OggS\x00'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'OGG');
    });
    (0, node_test_1.it)('detects MIDI', () => {
        const r = (0, index_js_1.detect)(hexBuf('4D546864'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'MIDI');
    });
});
(0, node_test_1.describe)('detect — video', () => {
    (0, node_test_1.it)('detects MKV', () => {
        const r = (0, index_js_1.detect)(hexBuf('1A45DFA3'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'MKV');
    });
    (0, node_test_1.it)('detects FLV', () => {
        const r = (0, index_js_1.detect)(Buffer.from('FLV\x01'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'FLV');
    });
    (0, node_test_1.it)('detects MP4 via ftyp box', () => {
        const buf = Buffer.alloc(20, 0);
        buf.writeUInt32BE(20, 0); // size
        Buffer.from('ftyp', 'utf8').copy(buf, 4);
        const r = (0, index_js_1.detect)(buf);
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'MP4');
    });
});
(0, node_test_1.describe)('detect — documents', () => {
    (0, node_test_1.it)('detects PDF', () => {
        const r = (0, index_js_1.detect)(Buffer.from('%PDF-1.4\n'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'PDF');
    });
    (0, node_test_1.it)('detects RTF', () => {
        const r = (0, index_js_1.detect)(Buffer.from('{\\rtf1'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'RTF');
    });
});
(0, node_test_1.describe)('detect — archives', () => {
    (0, node_test_1.it)('detects GZIP', () => {
        const r = (0, index_js_1.detect)(hexBuf('1F8B08'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'GZIP');
    });
    (0, node_test_1.it)('detects BZ2', () => {
        const r = (0, index_js_1.detect)(hexBuf('425A68'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'BZ2');
    });
    (0, node_test_1.it)('detects 7-Zip', () => {
        const r = (0, index_js_1.detect)(hexBuf('377ABCAF271C'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, '7-Zip');
    });
    (0, node_test_1.it)('detects RAR', () => {
        const r = (0, index_js_1.detect)(hexBuf('526172211A0700'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'RAR');
    });
    (0, node_test_1.it)('detects XZ', () => {
        const r = (0, index_js_1.detect)(hexBuf('FD377A585A00'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'XZ');
    });
    (0, node_test_1.it)('detects TAR', () => {
        const buf = Buffer.alloc(300, 0);
        Buffer.from('ustar', 'utf8').copy(buf, 257);
        const r = (0, index_js_1.detect)(buf);
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'TAR');
    });
});
(0, node_test_1.describe)('detect — executables', () => {
    (0, node_test_1.it)('detects ELF', () => {
        const r = (0, index_js_1.detect)(hexBuf('7F454C46'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'ELF');
        strict_1.default.equal(r.category, 'executable');
    });
    (0, node_test_1.it)('detects PE (EXE)', () => {
        const r = (0, index_js_1.detect)(Buffer.from('MZ\x90\x00'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'PE (EXE)');
    });
    (0, node_test_1.it)('detects Mach-O 64', () => {
        const r = (0, index_js_1.detect)(hexBuf('FEEDFACF'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'Mach-O 64');
    });
});
(0, node_test_1.describe)('detect — fonts', () => {
    (0, node_test_1.it)('detects TrueType', () => {
        const r = (0, index_js_1.detect)(hexBuf('00010000'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'TrueType');
    });
    (0, node_test_1.it)('detects WOFF', () => {
        const r = (0, index_js_1.detect)(Buffer.from('wOFF'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'WOFF');
    });
});
(0, node_test_1.describe)('detect — data', () => {
    (0, node_test_1.it)('detects SQLite', () => {
        const r = (0, index_js_1.detect)(Buffer.from('SQLite format 3\x00'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'SQLite');
    });
});
(0, node_test_1.describe)('detect — text heuristics', () => {
    (0, node_test_1.it)('detects JSON', () => {
        const r = (0, index_js_1.detect)(Buffer.from('{"hello": "world"}'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'JSON');
        strict_1.default.equal(r.confidence, 0.9);
    });
    (0, node_test_1.it)('detects JSON array', () => {
        const r = (0, index_js_1.detect)(Buffer.from('[1, 2, 3]'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'JSON');
    });
    (0, node_test_1.it)('detects shell script', () => {
        const r = (0, index_js_1.detect)(Buffer.from('#!/bin/bash\necho hello'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'Shell Script');
    });
    (0, node_test_1.it)('detects generic text', () => {
        const r = (0, index_js_1.detect)(Buffer.from('Hello, this is plain text.'));
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'Text');
    });
});
(0, node_test_1.describe)('detect — edge cases', () => {
    (0, node_test_1.it)('returns null for empty buffer', () => {
        strict_1.default.equal((0, index_js_1.detect)(Buffer.alloc(0)), null);
    });
    (0, node_test_1.it)('returns null for tiny buffer', () => {
        strict_1.default.equal((0, index_js_1.detect)(Buffer.from([0xFF])), null);
    });
    (0, node_test_1.it)('returns null for binary garbage', () => {
        const buf = Buffer.alloc(64);
        for (let i = 0; i < 64; i++)
            buf[i] = i * 4;
        // Might still match something exotic, but likely null or low confidence
        const r = (0, index_js_1.detect)(buf);
        // Just ensure it doesn't crash
        strict_1.default.ok(r === null || r.confidence < 1);
    });
});
(0, node_test_1.describe)('detectFile', () => {
    (0, node_test_1.it)('detects from file path', () => {
        (0, fs_1.mkdirSync)(TMP, { recursive: true });
        const f = (0, path_1.join)(TMP, 'test.png');
        (0, fs_1.writeFileSync)(f, hexBuf('89504E470D0A1A0A' + '00'.repeat(56)));
        const r = (0, index_js_1.detectFile)(f);
        strict_1.default.ok(r);
        strict_1.default.equal(r.name, 'PNG');
        (0, fs_1.rmSync)(TMP, { recursive: true, force: true });
    });
    (0, node_test_1.it)('returns null for missing file', () => {
        strict_1.default.equal((0, index_js_1.detectFile)('/nonexistent/file.xyz'), null);
    });
});
(0, node_test_1.describe)('detectWithExt', () => {
    (0, node_test_1.it)('boosts confidence when extension matches', () => {
        const buf = hexBuf('89504E470D0A1A0A' + '00'.repeat(56));
        const r = (0, index_js_1.detectWithExt)(buf, 'photo.png');
        strict_1.default.ok(r);
        strict_1.default.equal(r.confidence, 1.0);
    });
    (0, node_test_1.it)('falls back to extension guess for unknown binary', () => {
        const buf = Buffer.from('some random text content');
        const r = (0, index_js_1.detectWithExt)(buf, 'app.js');
        // Text detection might not match js specifically, but extension fallback
        strict_1.default.ok(r); // either text or extension guess
    });
});
(0, node_test_1.describe)('isMime / isExt', () => {
    (0, node_test_1.it)('isMime works', () => {
        strict_1.default.ok((0, index_js_1.isMime)(hexBuf('89504E470D0A1A0A' + '00'.repeat(56)), 'image/png'));
        strict_1.default.ok(!(0, index_js_1.isMime)(hexBuf('89504E470D0A1A0A' + '00'.repeat(56)), 'image/jpeg'));
    });
    (0, node_test_1.it)('isExt works', () => {
        strict_1.default.ok((0, index_js_1.isExt)(hexBuf('89504E470D0A1A0A' + '00'.repeat(56)), 'png'));
        strict_1.default.ok(!(0, index_js_1.isExt)(hexBuf('89504E470D0A1A0A' + '00'.repeat(56)), 'jpg'));
    });
});
(0, node_test_1.describe)('listAll', () => {
    (0, node_test_1.it)('returns all signatures', () => {
        const all = (0, index_js_1.listAll)();
        strict_1.default.ok(all.length >= 40);
        strict_1.default.ok(all.some(r => r.category === 'image'));
        strict_1.default.ok(all.some(r => r.category === 'audio'));
        strict_1.default.ok(all.some(r => r.category === 'archive'));
    });
});
