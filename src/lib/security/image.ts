import sharp from 'sharp'
import { randomUUID } from 'crypto'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

// JPEG/PNG/WebP/GIF magic bytes
const MAGIC: Array<{ bytes: number[]; mime: string }> = [
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: 'image/png' },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp' }, // RIFF (WebP)
  { bytes: [0x47, 0x49, 0x46], mime: 'image/gif' },
]

export type ImageValidationError =
  | 'FILE_TOO_LARGE'
  | 'INVALID_MIME_TYPE'
  | 'INVALID_MAGIC_BYTES'
  | 'PROCESSING_FAILED'

export interface ProcessedImage {
  buffer: Buffer
  filename: string
  mimeType: 'image/webp'
  sizeBytes: number
}

/**
 * Validate and process an image upload:
 * - Enforce 2 MB limit
 * - Validate MIME type and magic bytes
 * - Strip all EXIF/metadata
 * - Auto-rotate based on EXIF orientation (then strip)
 * - Convert to WebP at 80% quality
 * - Resize to max 1200×1200 (maintain aspect ratio, no upscaling)
 * - Generate a UUID filename
 */
export async function processUpload(
  buffer: Buffer,
  declaredMime: string
): Promise<{ error: ImageValidationError } | { data: ProcessedImage }> {
  // 1. Size check
  if (buffer.byteLength > MAX_BYTES) {
    return { error: 'FILE_TOO_LARGE' }
  }

  // 2. Declared MIME type check
  if (!ALLOWED_MIME.has(declaredMime)) {
    return { error: 'INVALID_MIME_TYPE' }
  }

  // 3. Magic bytes check (don't trust the declared type alone)
  const header = Array.from(buffer.subarray(0, 8))
  const magicMatch = MAGIC.some(({ bytes }) =>
    bytes.every((b, i) => header[i] === b)
  )
  if (!magicMatch) {
    return { error: 'INVALID_MAGIC_BYTES' }
  }

  // 4. Process with sharp: strip EXIF, convert to WebP, resize
  let processed: Buffer
  try {
    processed = await sharp(buffer)
      .rotate()                          // auto-rotate using EXIF, then strip orientation
      .withMetadata({})                  // strip all metadata (location, device, etc.)
      .webp({ quality: 80 })
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer()
  } catch {
    return { error: 'PROCESSING_FAILED' }
  }

  return {
    data: {
      buffer: processed,
      filename: `${randomUUID()}.webp`,
      mimeType: 'image/webp',
      sizeBytes: processed.byteLength,
    },
  }
}
