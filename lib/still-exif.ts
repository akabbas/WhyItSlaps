import exifr from "exifr";

/**
 * Exposure facts for the still prompt.
 * Camera make, model, and lens are never fields here: those tags are not read.
 * Focal length is EXIF FocalLength (millimetres), not the 35mm-equivalent tag.
 * ISO is PhotographicSensitivity (0x8827). ISOSpeed (0x8833) is used only when that tag is absent.
 */

export interface StillExposureFacts {
  focalLengthMm?: number;
  aperture?: number;
  shutterSeconds?: number;
  iso?: number;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EXIF_ASCII_HEADER = Buffer.from("Exif\0\0", "ascii");

/** exifr 7.1.3 reads JPEG, PNG, and TIFF. `pick` disables every other tag, including GPS and lens. */
const EXIF_PARSE_OPTIONS = {
  pick: ["FocalLength", "FNumber", "ExposureTime", "ISO", "ISOSpeed"],
  gps: false,
  xmp: false,
  iptc: false,
  icc: false,
  interop: false,
  makerNote: false,
  userComment: false,
  reviveValues: true,
  translateKeys: true,
  sanitize: true,
  mergeOutput: true,
  chunkLimit: 130,
};

function positiveNumber(value: unknown): number | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const n = positiveNumber(item);
      if (n !== undefined) return n;
    }
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

function isoValue(value: unknown): number | undefined {
  const n = positiveNumber(value);
  if (n === undefined || n < 1) return undefined;
  return Math.round(n);
}

function factsFromParsed(parsed: unknown): StillExposureFacts {
  if (!parsed || typeof parsed !== "object") return {};
  const tags = parsed as Record<string, unknown>;
  const facts: StillExposureFacts = {};
  const focalLengthMm = positiveNumber(tags.FocalLength);
  const aperture = positiveNumber(tags.FNumber);
  const shutterSeconds = positiveNumber(tags.ExposureTime);
  const iso = isoValue(tags.ISO) ?? isoValue(tags.ISOSpeed);
  if (focalLengthMm !== undefined) facts.focalLengthMm = focalLengthMm;
  if (aperture !== undefined) facts.aperture = aperture;
  if (shutterSeconds !== undefined) facts.shutterSeconds = shutterSeconds;
  if (iso !== undefined) facts.iso = iso;
  return facts;
}

function isGif(file: Buffer): boolean {
  if (file.length < 6) return false;
  const magic = file.toString("ascii", 0, 6);
  return magic === "GIF87a" || magic === "GIF89a";
}

function isJpeg(file: Buffer): boolean {
  return file.length >= 2 && file[0] === 0xff && file[1] === 0xd8;
}

function isPng(file: Buffer): boolean {
  return file.length >= PNG_SIGNATURE.length && file.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

function isWebp(file: Buffer): boolean {
  return file.length >= 12 && file.toString("ascii", 0, 4) === "RIFF" && file.toString("ascii", 8, 12) === "WEBP";
}

/** WebP stores Exif in an EXIF chunk. The payload is TIFF, sometimes prefixed by the JPEG Exif header. */
function webpExifTiff(file: Buffer): Buffer | null {
  let offset = 12;
  while (offset + 8 <= file.length) {
    const id = file.toString("ascii", offset, offset + 4);
    const size = file.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (size > file.length - start) return null;
    if (id === "EXIF") {
      const payload = file.subarray(start, start + size);
      if (payload.length >= EXIF_ASCII_HEADER.length && payload.subarray(0, EXIF_ASCII_HEADER.length).equals(EXIF_ASCII_HEADER)) {
        return Buffer.from(payload.subarray(EXIF_ASCII_HEADER.length));
      }
      return Buffer.from(payload);
    }
    offset = start + size + (size & 1);
  }
  return null;
}

async function parseExposureBytes(bytes: Buffer): Promise<StillExposureFacts> {
  if (bytes.length < 8) return {};
  const parsed: unknown = await exifr.parse(bytes, EXIF_PARSE_OPTIONS);
  return factsFromParsed(parsed);
}

export async function readStillExposureFacts(file: Buffer): Promise<StillExposureFacts> {
  try {
    if (isGif(file) || file.length < 8) return {};
    if (isWebp(file)) {
      const tiff = webpExifTiff(file);
      if (!tiff) return {};
      return await parseExposureBytes(tiff);
    }
    if (isJpeg(file) || isPng(file)) return await parseExposureBytes(file);
    return {};
  } catch {
    return {};
  }
}

function formatTenths(n: number): string {
  const tenths = Math.round(n * 10) / 10;
  return Number.isInteger(tenths) ? String(tenths) : tenths.toFixed(1);
}

function formatFocalLength(mm: number | undefined): string | undefined {
  if (mm === undefined || !Number.isFinite(mm) || mm <= 0) return undefined;
  return `${formatTenths(mm)} mm`;
}

function formatAperture(n: number | undefined): string | undefined {
  if (n === undefined || !Number.isFinite(n) || n <= 0) return undefined;
  return `f/${formatTenths(n)}`;
}

function formatShutter(seconds: number | undefined): string | undefined {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) return undefined;
  if (seconds >= 1) return `${formatTenths(seconds)} s`;
  const denom = Math.round(1 / seconds);
  if (denom >= 1 && Math.abs(seconds - 1 / denom) <= seconds * 0.015) return `1/${denom} s`;
  if (seconds >= 0.1) return `${formatTenths(seconds)} s`;
  return `${Number(seconds.toPrecision(2))} s`;
}

function formatIso(iso: number | undefined): string | undefined {
  if (iso === undefined || !Number.isFinite(iso) || iso < 1) return undefined;
  return String(Math.round(iso));
}

function exposureLines(exposure: StillExposureFacts): string[] {
  const lines: string[] = [];
  const focal = formatFocalLength(exposure.focalLengthMm);
  const aperture = formatAperture(exposure.aperture);
  const shutter = formatShutter(exposure.shutterSeconds);
  const iso = formatIso(exposure.iso);
  if (focal) lines.push(`Focal length: ${focal}`);
  if (aperture) lines.push(`Aperture: ${aperture}`);
  if (shutter) lines.push(`Shutter: ${shutter}`);
  if (iso) lines.push(`ISO: ${iso}`);
  return lines;
}

export function stillExposureUserText(exposure: StillExposureFacts | null | undefined): string {
  const lines = exposureLines(exposure ?? {});
  if (lines.length === 0) {
    return "One still picture is attached. The file contained no focal length, aperture, shutter, or ISO. Do not invent them. Do not guess a lens or a camera. Judge the picture in front of you.";
  }
  return [
    "One still picture is attached. These exposure facts were in the file:",
    ...lines,
    "Use only the facts listed above. If a fact is not listed, it was not in the file: leave it out. Do not guess a lens or a camera. Judge the picture in front of you.",
  ].join("\n");
}
