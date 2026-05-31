# filesig

Zero-dep file type detector using magic bytes — not file extensions.

Detects **50+ file formats** by reading the actual content header. No more trusting `.exe` files renamed to `.jpg`.

## Why?

File extensions lie. A `.png` could be a JPEG, a `.pdf` could be malware, and your upload validator probably just checks the extension. `filesig` reads the magic bytes — the actual binary signature — to tell you what a file really is.

## Install

```bash
npm install filesig
```

## CLI

```bash
# Detect a file
filesig photo.jpg
# → photo.jpg  →  JPEG  (image/jpeg)  [image]  confidence: 95%  extension match: ✓

# JSON output
filesig --json mystery.bin

# Just the MIME type
filesig --short data.bin
# → image/png

# List all supported formats
filesig --list
```

## API

```typescript
import { detect, detectFile, detectWithExt, isMime, isExt, listAll } from 'filesig';

// From a buffer (reads first 64KB max)
const result = detect(buffer);
// → { name: 'PNG', mime: 'image/png', ext: ['png'], category: 'image', confidence: 0.95 }

// From a file path
const result = detectFile('/path/to/file');

// With extension cross-check (boosts confidence to 1.0 if they match)
const result = detectWithExt(buffer, 'photo.png');

// Quick checks
isMime(buffer, 'image/png');  // true/false
isExt(buffer, 'png');         // true/false

// List all 50+ supported formats
listAll();
```

## Supported Formats

**Images:** JPEG, PNG, GIF, WebP, BMP, ICO, TIFF, PSD, SVG, AVIF

**Audio:** MP3, FLAC, OGG, WAV, AAC, MIDI, WMA

**Video:** MP4, AVI, MKV, WebM, FLV, MOV

**Documents:** PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, RTF, PostScript

**Archives:** ZIP, GZIP, BZ2, 7-Zip, RAR, XZ, TAR (+ JAR, APK disambiguation)

**Executables:** ELF, PE (EXE/DLL), Mach-O (32/64/FAT)

**Fonts:** TrueType, OpenType, WOFF, WOFF2

**Data:** SQLite, Parquet, pcap, pcapng

**Text heuristics:** JSON, XML, YAML, Shell, Python, plain text

## How It Works

1. Reads the first 64KB of the file
2. Checks against 50+ magic byte signatures (offset + hex pattern)
3. Disambiguates ambiguous formats (ZIP → DOCX/XLSX/JAR/APK, RIFF → WAV/AVI/WebP)
4. Falls back to text-based heuristics for source files
5. Returns confidence score: 1.0 (extension matches), 0.95 (magic match), 0.85 (function match), 0.7 (ambiguous), 0.3-0.5 (heuristic)

## Zero Dependencies

No `file-type`, no `mime`, no native modules. Pure TypeScript that compiles to CommonJS. Runs anywhere Node.js runs.

## License

MIT
