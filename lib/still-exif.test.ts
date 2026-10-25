import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { crc32 } from "node:zlib";

import { STILL_CRAFT } from "./dialogue.ts";
import { readStillExposureFacts, stillExposureUserText } from "./still-exif.ts";

const ASCII = 2;
const SHORT = 3;
const LONG = 4;
const RATIONAL = 5;

function u16(n: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
}

function u32(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
}

function entry(tag: number, type: number, count: number, value: number): Buffer {
  const b = Buffer.alloc(12);
  b.writeUInt16LE(tag, 0);
  b.writeUInt16LE(type, 2);
  b.writeUInt32LE(count, 4);
  b.writeUInt32LE(value >>> 0, 8);
  return b;
}

function asciiBuf(value: string): Buffer {
  return Buffer.from(`${value}\0`, "utf8");
}

function buildTiff(opts: {
  ifd0?: Record<number, string>;
  rationals?: Record<number, [number, number]>;
  shorts?: Record<number, number>;
  strings?: Record<number, string>;
}): Buffer {
  const ifd0 = opts.ifd0 ?? {};
  const rationals = opts.rationals ?? {};
  const shorts = opts.shorts ?? {};
  const strings = opts.strings ?? {};
  const ifd0Tags = Object.keys(ifd0).map(Number).sort((a, b) => a - b);
  const ratTags = Object.keys(rationals).map(Number).sort((a, b) => a - b);
  const shortTags = Object.keys(shorts).map(Number).sort((a, b) => a - b);
  const strTags = Object.keys(strings).map(Number).sort((a, b) => a - b);
  const exifTags = [...new Set([...ratTags, ...shortTags, ...strTags])].sort((a, b) => a - b);
  const hasExif = exifTags.length > 0;
  const ifd0Count = ifd0Tags.length + (hasExif ? 1 : 0);
  const ifd0Size = 2 + ifd0Count * 12 + 4;
  let offset = 8 + ifd0Size;

  const ifd0Blobs: Buffer[] = [];
  const ifd0Entries = ifd0Tags.map((tag) => {
    const blob = asciiBuf(ifd0[tag]);
    if (blob.length <= 4) {
      const inline = Buffer.alloc(4);
      blob.copy(inline);
      return entry(tag, ASCII, blob.length, inline.readUInt32LE(0));
    }
    const at = offset;
    offset += blob.length;
    ifd0Blobs.push(blob);
    return entry(tag, ASCII, blob.length, at);
  });

  const exifOffset = offset;
  if (hasExif) ifd0Entries.push(entry(0x8769, LONG, 1, exifOffset));
  ifd0Entries.sort((a, b) => a.readUInt16LE(0) - b.readUInt16LE(0));
  offset = exifOffset + (hasExif ? 2 + exifTags.length * 12 + 4 : 0);

  const extra: Buffer[] = [];
  const ratAt: Record<number, number> = {};
  for (const tag of ratTags) {
    const [num, den] = rationals[tag];
    const blob = Buffer.alloc(8);
    blob.writeUInt32LE(num, 0);
    blob.writeUInt32LE(den, 4);
    ratAt[tag] = offset;
    offset += 8;
    extra.push(blob);
  }
  const strAt: Record<number, number> = {};
  const strCount: Record<number, number> = {};
  for (const tag of strTags) {
    const blob = asciiBuf(strings[tag]);
    strAt[tag] = offset;
    strCount[tag] = blob.length;
    offset += blob.length;
    extra.push(blob);
  }

  const exifEntries = exifTags.map((tag) => {
    if (rationals[tag]) return entry(tag, RATIONAL, 1, ratAt[tag]);
    if (shorts[tag] != null) return entry(tag, SHORT, 1, shorts[tag]);
    return entry(tag, ASCII, strCount[tag], strAt[tag]);
  });

  return Buffer.concat([
    Buffer.from("II", "ascii"),
    u16(42),
    u32(8),
    u16(ifd0Count),
    ...ifd0Entries,
    u32(0),
    ...ifd0Blobs,
    ...(hasExif ? [u16(exifTags.length), ...exifEntries, u32(0)] : []),
    ...extra,
  ]);
}

function jpeg(tiff: Buffer): Buffer {
  const payload = Buffer.concat([Buffer.from("Exif\0\0", "ascii"), tiff]);
  const header = Buffer.alloc(4);
  header[0] = 0xff;
  header[1] = 0xe1;
  header.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), header, payload, Buffer.from([0xff, 0xd9])]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function png(tiff: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("eXIf", tiff),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function webp(chunks: { id: string; data: Buffer }[]): Buffer {
  const parts: Buffer[] = [Buffer.from("WEBP", "ascii")];
  for (const chunk of chunks) {
    const header = Buffer.alloc(8);
    header.write(chunk.id, 0, 4, "ascii");
    header.writeUInt32LE(chunk.data.length, 4);
    parts.push(header, chunk.data);
    if (chunk.data.length % 2 === 1) parts.push(Buffer.from([0]));
  }
  const body = Buffer.concat(parts);
  const riff = Buffer.alloc(8);
  riff.write("RIFF", 0, 4, "ascii");
  riff.writeUInt32LE(body.length, 4);
  return Buffer.concat([riff, body]);
}

const FULL = {
  ifd0: { 0x010f: "CanonIgnoreMe", 0x0110: "EOS R5 Guess" },
  rationals: { 0x829a: [1, 250] as [number, number], 0x829d: [9, 5] as [number, number], 0x920a: [35, 1] as [number, number] },
  shorts: { 0x8827: 200 },
  strings: { 0xa434: "RF 50mm F1.2 L" },
};

const EMPTY_PROMPT =
  "One still picture is attached. The file contained no focal length, aperture, shutter, or ISO. Do not invent them. Do not guess a lens or a camera. Judge the picture in front of you.";

describe("still exposure prompt", () => {
  it("lists only the facts that were passed, in a fixed order", () => {
    assert.equal(
      stillExposureUserText({ focalLengthMm: 35, aperture: 1.8, shutterSeconds: 0.004, iso: 200 }),
      [
        "One still picture is attached. These exposure facts were in the file:",
        "Focal length: 35 mm",
        "Aperture: f/1.8",
        "Shutter: 1/250 s",
        "ISO: 200",
        "Use only the facts listed above. If a fact is not listed, it was not in the file: leave it out. Do not guess a lens or a camera. Judge the picture in front of you.",
      ].join("\n"),
    );
  });

  it("drops a missing fact instead of leaving a blank", () => {
    const text = stillExposureUserText({ shutterSeconds: 2, iso: 100 });
    assert.match(text, /Shutter: 2 s/);
    assert.match(text, /ISO: 100/);
    assert.doesNotMatch(text, /Focal length:/);
    assert.doesNotMatch(text, /Aperture:/);
  });

  it("formats fractions, whole stops, and non-standard speeds without inventing a camera", () => {
    assert.match(stillExposureUserText({ shutterSeconds: 1 / 3 }), /Shutter: 1\/3 s/);
    assert.match(stillExposureUserText({ shutterSeconds: 0.4 }), /Shutter: 0\.4 s/);
    assert.match(stillExposureUserText({ shutterSeconds: 1 / 8000 }), /Shutter: 1\/8000 s/);
    assert.match(stillExposureUserText({ aperture: 8 }), /Aperture: f\/8/);
    assert.match(stillExposureUserText({ focalLengthMm: 5.2 }), /Focal length: 5\.2 mm/);
    assert.equal(stillExposureUserText({ focalLengthMm: 0, aperture: Number.NaN, shutterSeconds: -1, iso: 0 }), EMPTY_PROMPT);
  });

  it("tells the speaker to use a listed aperture and not to guess one", () => {
    assert.match(STILL_CRAFT, /that number is from the file/);
    assert.match(STILL_CRAFT, /leave that fact out/);
    assert.match(STILL_CRAFT, /Do not guess a lens or a camera/);
    assert.doesNotMatch(STILL_CRAFT, /Do not guess a lens, an aperture/);
    assert.match(STILL_CRAFT, /Do not treat a screenshot or a soft, compressed copy as a lens/);
  });
});

describe("readStillExposureFacts", () => {
  it("reads the four tags from a JPEG and leaves the camera and lens out", async () => {
    const facts = await readStillExposureFacts(jpeg(buildTiff(FULL)));
    assert.equal(facts.focalLengthMm, 35);
    assert.equal(facts.aperture, 1.8);
    assert.equal(facts.iso, 200);
    assert.ok(facts.shutterSeconds !== undefined && Math.abs(facts.shutterSeconds - 0.004) < 1e-6);
    const text = stillExposureUserText(facts);
    assert.match(text, /Focal length: 35 mm/);
    assert.match(text, /Aperture: f\/1\.8/);
    assert.match(text, /Shutter: 1\/250 s/);
    assert.match(text, /ISO: 200/);
    assert.doesNotMatch(text, /Canon|EOS|RF 50/);
    assert.equal(JSON.stringify(facts).includes("Canon"), false);
  });

  it("omits tags the file does not contain", async () => {
    const facts = await readStillExposureFacts(
      jpeg(buildTiff({ ifd0: { 0x010f: "DoNotLeak" }, rationals: { 0x920a: [52, 10] }, strings: { 0xa434: "Secret Lens" } })),
    );
    assert.equal(facts.focalLengthMm, 5.2);
    assert.equal(facts.aperture, undefined);
    assert.equal(facts.shutterSeconds, undefined);
    assert.equal(facts.iso, undefined);
    const text = stillExposureUserText(facts);
    assert.match(text, /Focal length: 5\.2 mm/);
    assert.doesNotMatch(text, /Aperture:|Shutter:|ISO:|DoNotLeak|Secret Lens/);
  });

  it("does not treat a camera, a lens, or a 35mm-equivalent tag as focal length", async () => {
    const cameraOnly = await readStillExposureFacts(
      jpeg(buildTiff({ ifd0: { 0x010f: "CanonIgnoreMe", 0x0110: "EOS R5 Guess" }, strings: { 0xa434: "RF 50mm F1.2 L" } })),
    );
    assert.deepEqual(cameraOnly, {});
    assert.doesNotMatch(stillExposureUserText(cameraOnly), /Canon|EOS|RF 50|50 mm/);

    const equivalentOnly = await readStillExposureFacts(jpeg(buildTiff({ shorts: { 0xa405: 50 } })));
    assert.equal(equivalentOnly.focalLengthMm, undefined);
    assert.doesNotMatch(stillExposureUserText(equivalentOnly), /50/);
  });

  it("uses ISOSpeed only when PhotographicSensitivity is missing", async () => {
    const onlySpeed = await readStillExposureFacts(jpeg(buildTiff({ shorts: { 0x8833: 640 }, strings: { 0xa434: "nope" } })));
    assert.deepEqual(onlySpeed, { iso: 640 });
    const both = await readStillExposureFacts(jpeg(buildTiff({ shorts: { 0x8827: 200, 0x8833: 640 } })));
    assert.equal(both.iso, 200);
  });

  it("drops a zero aperture and a file with no EXIF", async () => {
    const zero = await readStillExposureFacts(jpeg(buildTiff({ rationals: { 0x829d: [0, 1] }, shorts: { 0x8827: 100 } })));
    assert.equal(zero.aperture, undefined);
    assert.equal(zero.iso, 100);
    assert.deepEqual(await readStillExposureFacts(Buffer.from([0xff, 0xd8, 0xff, 0xd9])), {});
    assert.deepEqual(await readStillExposureFacts(Buffer.from("not a picture")), {});
  });

  it("does not read XMP when the EXIF tags are absent", async () => {
    const xml = Buffer.from("<x:xmpmeta>Canon EOS Secret Lens FocalLength 85</x:xmpmeta>");
    const payload = Buffer.concat([Buffer.from("http://ns.adobe.com/xap/1.0/\0", "ascii"), xml]);
    const header = Buffer.alloc(4);
    header[0] = 0xff;
    header[1] = 0xe1;
    header.writeUInt16BE(payload.length + 2, 2);
    const file = Buffer.concat([Buffer.from([0xff, 0xd8]), header, payload, Buffer.from([0xff, 0xd9])]);
    assert.deepEqual(await readStillExposureFacts(file), {});
  });

  it("reads a PNG eXIf chunk", async () => {
    const facts = await readStillExposureFacts(png(buildTiff(FULL)));
    assert.equal(facts.focalLengthMm, 35);
    assert.equal(facts.iso, 200);
    assert.doesNotMatch(stillExposureUserText(facts), /Canon|RF 50/);
  });

  it("reads a WebP EXIF chunk and ignores XMP sitting beside it", async () => {
    const tiff = buildTiff(FULL);
    const prefixed = await readStillExposureFacts(
      webp([
        { id: "JUNK", data: Buffer.from([0xab]) },
        { id: "EXIF", data: Buffer.concat([Buffer.from("Exif\0\0", "ascii"), tiff]) },
      ]),
    );
    assert.equal(prefixed.focalLengthMm, 35);
    assert.equal(prefixed.aperture, 1.8);
    assert.equal(prefixed.iso, 200);

    const raw = await readStillExposureFacts(
      webp([
        { id: "XMP ", data: Buffer.from("Canon Secret Lens FocalLength 85") },
        { id: "EXIF", data: tiff },
      ]),
    );
    assert.equal(raw.focalLengthMm, 35);
    assert.doesNotMatch(stillExposureUserText(raw), /Canon|Secret|85/);

    const xmpOnly = await readStillExposureFacts(webp([{ id: "XMP ", data: Buffer.from("Canon FocalLength 85") }]));
    assert.deepEqual(xmpOnly, {});
  });

  it("leaves a GIF alone, even when a comment names a camera", async () => {
    const gif = Buffer.concat([Buffer.from("GIF89a"), Buffer.from("Canon EOS FocalLength 50 ISO 200")]);
    assert.deepEqual(await readStillExposureFacts(gif), {});
    assert.equal(stillExposureUserText({}), EMPTY_PROMPT);
  });
});
