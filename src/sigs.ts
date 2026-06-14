/**
 * File signature definitions — magic bytes mapped to file types.
 * Each signature is checked in order; first match wins.
 */

export interface FileSignature {
  /** Human-readable name */
  name: string;
  /** MIME type (or 'application/octet-stream') */
  mime: string;
  /** Common extensions */
  ext: string[];
  /** Category for grouping */
  category: 'image' | 'audio' | 'video' | 'document' | 'archive' | 'executable' | 'font' | 'data' | 'other';
  /** Magic byte offset (default 0) */
  offset?: number;
  /** Magic bytes as hex string or function that checks the buffer */
  magic: string | ((buf: Buffer) => boolean);
}

export const signatures: FileSignature[] = [
  { name: 'JPEG', mime: 'image/jpeg', ext: ['jpg', 'jpeg'], category: 'image', magic: 'FFD8FF' },
  { name: 'PNG', mime: 'image/png', ext: ['png'], category: 'image', magic: '89504E470D0A1A0A' },
  { name: 'GIF', mime: 'image/gif', ext: ['gif'], category: 'image', magic: '47494638' }, // GIF8
  { name: 'WebP', mime: 'image/webp', ext: ['webp'], category: 'image', offset: 8, magic: '57454250' },
  { name: 'BMP', mime: 'image/bmp', ext: ['bmp'], category: 'image', magic: '424D' },
  { name: 'ICO', mime: 'image/x-icon', ext: ['ico'], category: 'image', magic: '00000100' },
  { name: 'TIFF (LE)', mime: 'image/tiff', ext: ['tif', 'tiff'], category: 'image', magic: '49492A00' },
  { name: 'TIFF (BE)', mime: 'image/tiff', ext: ['tif', 'tiff'], category: 'image', magic: '4D4D002A' },
  { name: 'PSD', mime: 'image/vnd.adobe.photoshop', ext: ['psd'], category: 'image', magic: '38425053' },
  { name: 'SVG', mime: 'image/svg+xml', ext: ['svg'], category: 'image', magic: (buf: Buffer) => {
    const s = buf.toString('utf8', 0, 256).trimStart();
    return s.startsWith('<?xml') && s.includes('<svg') || s.startsWith('<svg');
  }},
  { name: 'AVIF', mime: 'image/avif', ext: ['avif'], category: 'image', offset: 4, magic: '6674797061766966' },

  { name: 'MP3 (ID3)', mime: 'audio/mpeg', ext: ['mp3'], category: 'audio', magic: '494433' },
  { name: 'MP3', mime: 'audio/mpeg', ext: ['mp3'], category: 'audio', magic: 'FFF3' },
  { name: 'MP3 (sync)', mime: 'audio/mpeg', ext: ['mp3'], category: 'audio', magic: 'FFF2' },
  { name: 'FLAC', mime: 'audio/flac', ext: ['flac'], category: 'audio', magic: '664C614300000022' },
  { name: 'OGG', mime: 'audio/ogg', ext: ['ogg'], category: 'audio', magic: '4F676753' },
  { name: 'WAV', mime: 'audio/wav', ext: ['wav'], category: 'audio', magic: '52494646', /* RIFF */ },
  { name: 'AAC', mime: 'audio/aac', ext: ['aac'], category: 'audio', magic: 'FFF1' },
  { name: 'MIDI', mime: 'audio/midi', ext: ['mid', 'midi'], category: 'audio', magic: '4D546864' },
  { name: 'WMA', mime: 'audio/x-ms-wma', ext: ['wma'], category: 'audio', magic: '3026B2758E66CF11' },

  { name: 'MP4', mime: 'video/mp4', ext: ['mp4', 'm4v'], category: 'video', magic: (buf: Buffer) => {
    if (buf.length < 12) return false;
    const size = buf.readUInt32BE(0);
    return size > 0 && size <= buf.length && buf.toString('utf8', 4, 8) === 'ftyp';
  }},
  { name: 'AVI', mime: 'video/avi', ext: ['avi'], category: 'video', magic: '52494646' }, // RIFF + check AVI
  { name: 'MKV', mime: 'video/x-matroska', ext: ['mkv'], category: 'video', magic: '1A45DFA3' },
  { name: 'WebM', mime: 'video/webm', ext: ['webm'], category: 'video', magic: '1A45DFA3' },
  { name: 'FLV', mime: 'video/x-flv', ext: ['flv'], category: 'video', magic: '464C56' },
  { name: 'MOV', mime: 'video/quicktime', ext: ['mov'], category: 'video', magic: (buf: Buffer) => {
    if (buf.length < 12) return false;
    return buf.toString('utf8', 4, 8) === 'moov' || buf.toString('utf8', 4, 8) === 'mdat' ||
           (buf.toString('utf8', 4, 8) === 'ftyp' && buf.toString('utf8', 8, 12).match(/qt\s*/) !== null);
  }},

  { name: 'PDF', mime: 'application/pdf', ext: ['pdf'], category: 'document', magic: '25504446' }, // %PDF
  { name: 'PostScript', mime: 'application/postscript', ext: ['ps'], category: 'document', magic: '25215053' },
  { name: 'DOCX', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: ['docx'], category: 'document', magic: '504B0304' },
  { name: 'XLSX', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: ['xlsx'], category: 'document', magic: '504B0304' },
  { name: 'PPTX', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: ['pptx'], category: 'document', magic: '504B0304' },
  { name: 'DOC', mime: 'application/msword', ext: ['doc'], category: 'document', magic: 'D0CF11E0A1B11AE1' },
  { name: 'RTF', mime: 'application/rtf', ext: ['rtf'], category: 'document', magic: '7B5C727466' },

  { name: 'ZIP', mime: 'application/zip', ext: ['zip'], category: 'archive', magic: '504B0304' },
  { name: 'GZIP', mime: 'application/gzip', ext: ['gz'], category: 'archive', magic: '1F8B' },
  { name: 'BZ2', mime: 'application/x-bzip2', ext: ['bz2'], category: 'archive', magic: '425A68' },
  { name: '7-Zip', mime: 'application/x-7z-compressed', ext: ['7z'], category: 'archive', magic: '377ABCAF271C' },
  { name: 'RAR', mime: 'application/vnd.rar', ext: ['rar'], category: 'archive', magic: '526172211A0700' },
  { name: 'XZ', mime: 'application/x-xz', ext: ['xz'], category: 'archive', magic: 'FD377A585A00' },
  { name: 'TAR', mime: 'application/x-tar', ext: ['tar'], category: 'archive', magic: (buf: Buffer) => {
    // TAR has magic at offset 257: "ustar"
    return buf.length >= 262 && buf.toString('utf8', 257, 262) === 'ustar';
  }},

  { name: 'ELF', mime: 'application/x-elf', ext: ['elf', 'bin', 'so', 'o'], category: 'executable', magic: '7F454C46' },
  { name: 'PE (EXE)', mime: 'application/x-msdownload', ext: ['exe', 'dll'], category: 'executable', magic: '4D5A' }, // MZ
  { name: 'Mach-O 64', mime: 'application/x-mach-binary', ext: ['macho'], category: 'executable', magic: 'FEEDFACF' },
  { name: 'Mach-O 32', mime: 'application/x-mach-binary', ext: ['macho'], category: 'executable', magic: 'FEEDFACE' },
  { name: 'Mach-O (FAT)', mime: 'application/x-mach-binary', ext: ['macho'], category: 'executable', magic: 'CAFEBABE' },

  { name: 'TrueType', mime: 'font/ttf', ext: ['ttf'], category: 'font', magic: '00010000' },
  { name: 'OpenType', mime: 'font/otf', ext: ['otf'], category: 'font', magic: '4F54544F' },
  { name: 'WOFF', mime: 'font/woff', ext: ['woff'], category: 'font', magic: '774F4646' },
  { name: 'WOFF2', mime: 'font/woff2', ext: ['woff2'], category: 'font', magic: '774F4632' },
  { name: 'EOT', mime: 'application/vnd.ms-fontobject', ext: ['eot'], category: 'font', magic: (buf: Buffer) => {
    return buf.length >= 36 && buf.readUInt32BE(34) === 0x4C50;
  }},

  { name: 'SQLite', mime: 'application/x-sqlite3', ext: ['sqlite', 'db'], category: 'data', magic: '53514C69746520666F726D61742033' },
  { name: 'Parquet', mime: 'application/vnd.apache.parquet', ext: ['parquet'], category: 'data', magic: '50415231' },
  { name: 'Java Class', mime: 'application/java-vm', ext: ['class'], category: 'data', magic: 'CAFEBABE' },
  { name: 'DMG', mime: 'application/x-apple-diskimage', ext: ['dmg'], category: 'data', magic: (buf: Buffer) => {
    // Check for koly block at end
    if (buf.length < 512) return false;
    const tail = buf.toString('utf8', buf.length - 8);
    return tail.includes('koly');
  }},
  { name: 'ISO', mime: 'application/x-iso9660-image', ext: ['iso'], category: 'data', offset: 32769, magic: '4344303031' }, // CD001

  { name: 'Pcap', mime: 'application/vnd.tcpdump.pcap', ext: ['pcap'], category: 'other', magic: 'D4C3B2A1' },
  { name: 'PcapNG', mime: 'application/vnd.tcpdump.pcap', ext: ['pcapng'], category: 'other', magic: '0A0D0D0A' },
];

/**
 * Ambiguous signatures that need deeper inspection.
 * e.g. ZIP could be DOCX/XLSX/PPTX/JAR/APK etc.
 */
export function disambiguateZip(buf: Buffer): FileSignature | null {
  // Look for [Content_Types].xml or specific directory entries
  const str = buf.toString('utf8', 0, Math.min(buf.length, 65536));
  if (str.includes('word/')) {
    return { name: 'DOCX', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: ['docx'], category: 'document' as const, magic: '504B0304' };
  }
  if (str.includes('xl/')) {
    return { name: 'XLSX', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: ['xlsx'], category: 'document' as const, magic: '504B0304' };
  }
  if (str.includes('ppt/')) {
    return { name: 'PPTX', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: ['pptx'], category: 'document' as const, magic: '504B0304' };
  }
  if (str.includes('META-INF/MANIFEST.MF')) {
    return { name: 'JAR', mime: 'application/java-archive', ext: ['jar'], category: 'archive' as const, magic: '504B0304' };
  }
  if (str.includes('AndroidManifest.xml') || str.includes('classes.dex')) {
    return { name: 'APK', mime: 'application/vnd.android.package-archive', ext: ['apk'], category: 'executable' as const, magic: '504B0304' };
  }
  return null;
}

export function disambiguateRIFF(buf: Buffer): FileSignature | null {
  if (buf.length < 12) return null;
  const format = buf.toString('utf8', 8, 12);
  if (format === 'WAVE') {
    return { name: 'WAV', mime: 'audio/wav', ext: ['wav'], category: 'audio' as const, magic: '52494646' };
  }
  if (format === 'AVI ') {
    return { name: 'AVI', mime: 'video/avi', ext: ['avi'], category: 'video' as const, magic: '52494646' };
  }
  if (format === 'WEBP') {
    return { name: 'WebP', mime: 'image/webp', ext: ['webp'], category: 'image' as const, magic: '52494646' };
  }
  return null;
}
