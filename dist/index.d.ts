/**
 * filesig — Zero-dep file type detector using magic bytes.
 */
export interface DetectResult {
    name: string;
    mime: string;
    ext: string[];
    category: string;
    confidence: number;
}
/**
 * Detect file type from a buffer of content.
 * Reads at most the first 64KB for detection (enough for all signatures).
 */
export declare function detect(buf: Buffer): DetectResult | null;
/**
 * Detect file type from a file path.
 * Reads up to 64KB from the file.
 */
export declare function detectFile(filePath: string): DetectResult | null;
/**
 * Detect file type and consider the file extension as a hint.
 */
export declare function detectWithExt(buf: Buffer, filePath: string): DetectResult | null;
/**
 * Get all supported file types.
 */
export declare function listAll(): DetectResult[];
/**
 * Check if a buffer matches a specific MIME type.
 */
export declare function isMime(buf: Buffer, mime: string): boolean;
/**
 * Check if a buffer matches a specific extension.
 */
export declare function isExt(buf: Buffer, ext: string): boolean;
