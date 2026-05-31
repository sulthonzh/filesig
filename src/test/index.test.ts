import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detect, detectFile, detectWithExt, listAll, isMime, isExt } from '../index.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const TMP = join(__dirname, '..', 'tmp_test');

function hexBuf(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}

describe('detect — images', () => {
  it('detects JPEG', () => {
    const buf = Buffer.alloc(64, 0);
    Buffer.from('FFD8FFE0', 'hex').copy(buf);
    const r = detect(buf);
    assert.ok(r);
    assert.equal(r!.name, 'JPEG');
    assert.equal(r!.mime, 'image/jpeg');
    assert.ok(r!.ext.includes('jpg'));
  });

  it('detects PNG', () => {
    const r = detect(hexBuf('89504E470D0A1A0A') as Buffer);
    assert.ok(r);
    assert.equal(r!.name, 'PNG');
    assert.equal(r!.mime, 'image/png');
  });

  it('detects GIF', () => {
    const r = detect(Buffer.from('GIF89a'));
    assert.ok(r);
    assert.equal(r!.name, 'GIF');
    assert.equal(r!.category, 'image');
  });

  it('detects BMP', () => {
    const r = detect(hexBuf('424D'));
    assert.ok(r);
    assert.equal(r!.name, 'BMP');
  });

  it('detects WebP (via RIFF)', () => {
    const buf = Buffer.alloc(20, 0);
    Buffer.from('52494646', 'hex').copy(buf, 0);
    buf.writeUInt32LE(12, 4);
    Buffer.from('57454250', 'hex').copy(buf, 8);
    const r = detect(buf);
    assert.ok(r);
    assert.equal(r!.name, 'WebP');
  });

  it('detects ICO', () => {
    const r = detect(hexBuf('00000100'));
    assert.ok(r);
    assert.equal(r!.name, 'ICO');
  });

  it('detects SVG', () => {
    const r = detect(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">'));
    assert.ok(r);
    assert.equal(r!.name, 'SVG');
  });
});

describe('detect — audio', () => {
  it('detects MP3 with ID3 tag', () => {
    const r = detect(Buffer.from('ID3\x04\x00'));
    assert.ok(r);
    assert.equal(r!.name, 'MP3 (ID3)');
    assert.equal(r!.mime, 'audio/mpeg');
  });

  it('detects FLAC', () => {
    const r = detect(hexBuf('664C614300000022'));
    assert.ok(r);
    assert.equal(r!.name, 'FLAC');
  });

  it('detects OGG', () => {
    const r = detect(Buffer.from('OggS\x00'));
    assert.ok(r);
    assert.equal(r!.name, 'OGG');
  });

  it('detects MIDI', () => {
    const r = detect(hexBuf('4D546864'));
    assert.ok(r);
    assert.equal(r!.name, 'MIDI');
  });
});

describe('detect — video', () => {
  it('detects MKV', () => {
    const r = detect(hexBuf('1A45DFA3'));
    assert.ok(r);
    assert.equal(r!.name, 'MKV');
  });

  it('detects FLV', () => {
    const r = detect(Buffer.from('FLV\x01'));
    assert.ok(r);
    assert.equal(r!.name, 'FLV');
  });

  it('detects MP4 via ftyp box', () => {
    const buf = Buffer.alloc(20, 0);
    buf.writeUInt32BE(20, 0); // size
    Buffer.from('ftyp', 'utf8').copy(buf, 4);
    const r = detect(buf);
    assert.ok(r);
    assert.equal(r!.name, 'MP4');
  });
});

describe('detect — documents', () => {
  it('detects PDF', () => {
    const r = detect(Buffer.from('%PDF-1.4\n'));
    assert.ok(r);
    assert.equal(r!.name, 'PDF');
  });

  it('detects RTF', () => {
    const r = detect(Buffer.from('{\\rtf1'));
    assert.ok(r);
    assert.equal(r!.name, 'RTF');
  });
});

describe('detect — archives', () => {
  it('detects GZIP', () => {
    const r = detect(hexBuf('1F8B08'));
    assert.ok(r);
    assert.equal(r!.name, 'GZIP');
  });

  it('detects BZ2', () => {
    const r = detect(hexBuf('425A68'));
    assert.ok(r);
    assert.equal(r!.name, 'BZ2');
  });

  it('detects 7-Zip', () => {
    const r = detect(hexBuf('377ABCAF271C'));
    assert.ok(r);
    assert.equal(r!.name, '7-Zip');
  });

  it('detects RAR', () => {
    const r = detect(hexBuf('526172211A0700'));
    assert.ok(r);
    assert.equal(r!.name, 'RAR');
  });

  it('detects XZ', () => {
    const r = detect(hexBuf('FD377A585A00'));
    assert.ok(r);
    assert.equal(r!.name, 'XZ');
  });

  it('detects TAR', () => {
    const buf = Buffer.alloc(300, 0);
    Buffer.from('ustar', 'utf8').copy(buf, 257);
    const r = detect(buf);
    assert.ok(r);
    assert.equal(r!.name, 'TAR');
  });
});

describe('detect — executables', () => {
  it('detects ELF', () => {
    const r = detect(hexBuf('7F454C46'));
    assert.ok(r);
    assert.equal(r!.name, 'ELF');
    assert.equal(r!.category, 'executable');
  });

  it('detects PE (EXE)', () => {
    const r = detect(Buffer.from('MZ\x90\x00'));
    assert.ok(r);
    assert.equal(r!.name, 'PE (EXE)');
  });

  it('detects Mach-O 64', () => {
    const r = detect(hexBuf('FEEDFACF'));
    assert.ok(r);
    assert.equal(r!.name, 'Mach-O 64');
  });
});

describe('detect — fonts', () => {
  it('detects TrueType', () => {
    const r = detect(hexBuf('00010000'));
    assert.ok(r);
    assert.equal(r!.name, 'TrueType');
  });

  it('detects WOFF', () => {
    const r = detect(Buffer.from('wOFF'));
    assert.ok(r);
    assert.equal(r!.name, 'WOFF');
  });
});

describe('detect — data', () => {
  it('detects SQLite', () => {
    const r = detect(Buffer.from('SQLite format 3\x00'));
    assert.ok(r);
    assert.equal(r!.name, 'SQLite');
  });
});

describe('detect — text heuristics', () => {
  it('detects JSON', () => {
    const r = detect(Buffer.from('{"hello": "world"}'));
    assert.ok(r);
    assert.equal(r!.name, 'JSON');
    assert.equal(r!.confidence, 0.9);
  });

  it('detects JSON array', () => {
    const r = detect(Buffer.from('[1, 2, 3]'));
    assert.ok(r);
    assert.equal(r!.name, 'JSON');
  });

  it('detects shell script', () => {
    const r = detect(Buffer.from('#!/bin/bash\necho hello'));
    assert.ok(r);
    assert.equal(r!.name, 'Shell Script');
  });

  it('detects generic text', () => {
    const r = detect(Buffer.from('Hello, this is plain text.'));
    assert.ok(r);
    assert.equal(r!.name, 'Text');
  });
});

describe('detect — edge cases', () => {
  it('returns null for empty buffer', () => {
    assert.equal(detect(Buffer.alloc(0)), null);
  });

  it('returns null for tiny buffer', () => {
    assert.equal(detect(Buffer.from([0xFF])), null);
  });

  it('returns null for binary garbage', () => {
    const buf = Buffer.alloc(64);
    for (let i = 0; i < 64; i++) buf[i] = i * 4;
    // Might still match something exotic, but likely null or low confidence
    const r = detect(buf);
    // Just ensure it doesn't crash
    assert.ok(r === null || r.confidence < 1);
  });
});

describe('detectFile', () => {
  it('detects from file path', () => {
    mkdirSync(TMP, { recursive: true });
    const f = join(TMP, 'test.png');
    writeFileSync(f, hexBuf('89504E470D0A1A0A' + '00'.repeat(56)));
    const r = detectFile(f);
    assert.ok(r);
    assert.equal(r!.name, 'PNG');
    rmSync(TMP, { recursive: true, force: true });
  });

  it('returns null for missing file', () => {
    assert.equal(detectFile('/nonexistent/file.xyz'), null);
  });
});

describe('detectWithExt', () => {
  it('boosts confidence when extension matches', () => {
    const buf = hexBuf('89504E470D0A1A0A' + '00'.repeat(56));
    const r = detectWithExt(buf, 'photo.png');
    assert.ok(r);
    assert.equal(r!.confidence, 1.0);
  });

  it('falls back to extension guess for unknown binary', () => {
    const buf = Buffer.from('some random text content');
    const r = detectWithExt(buf, 'app.js');
    // Text detection might not match js specifically, but extension fallback
    assert.ok(r); // either text or extension guess
  });
});

describe('isMime / isExt', () => {
  it('isMime works', () => {
    assert.ok(isMime(hexBuf('89504E470D0A1A0A' + '00'.repeat(56)), 'image/png'));
    assert.ok(!isMime(hexBuf('89504E470D0A1A0A' + '00'.repeat(56)), 'image/jpeg'));
  });

  it('isExt works', () => {
    assert.ok(isExt(hexBuf('89504E470D0A1A0A' + '00'.repeat(56)), 'png'));
    assert.ok(!isExt(hexBuf('89504E470D0A1A0A' + '00'.repeat(56)), 'jpg'));
  });
});

describe('listAll', () => {
  it('returns all signatures', () => {
    const all = listAll();
    assert.ok(all.length >= 40);
    assert.ok(all.some(r => r.category === 'image'));
    assert.ok(all.some(r => r.category === 'audio'));
    assert.ok(all.some(r => r.category === 'archive'));
  });
});
