import { spawn } from "child_process";

const SAMPLE_RATE = 22050;

export function floatFromS16le(buffer: Buffer): Float32Array {
  const length = Math.floor(buffer.length / 2);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    samples[i] = buffer.readInt16LE(i * 2) / 32768;
  }
  return samples;
}

/** Decode any audio file ffmpeg can read into mono PCM at 22050 Hz. */
export function decodeAudioFileToPcm(filePath: string): Promise<{ samples: Float32Array; sampleRate: number } | null> {
  return new Promise((resolve) => {
    const child = spawn(
      "ffmpeg",
      [
        "-v",
        "error",
        "-t",
        "45",
        "-i",
        filePath,
        "-ac",
        "1",
        "-ar",
        String(SAMPLE_RATE),
        "-f",
        "s16le",
        "-acodec",
        "pcm_s16le",
        "pipe:1",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    const chunks: Buffer[] = [];
    let bytes = 0;
    const maxBytes = SAMPLE_RATE * 2 * 50;
    child.stdout?.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes <= maxBytes) chunks.push(chunk);
    });
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0 || chunks.length === 0) {
        resolve(null);
        return;
      }
      resolve({ samples: floatFromS16le(Buffer.concat(chunks)), sampleRate: SAMPLE_RATE });
    });
  });
}
