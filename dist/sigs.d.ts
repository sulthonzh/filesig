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
export declare const signatures: FileSignature[];
/**
 * Ambiguous signatures that need deeper inspection.
 * e.g. ZIP could be DOCX/XLSX/PPTX/JAR/APK etc.
 */
export declare function disambiguateZip(buf: Buffer): FileSignature | null;
export declare function disambiguateRIFF(buf: Buffer): FileSignature | null;
