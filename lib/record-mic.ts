/** Browser mic clip for POST /api/identify-audio. No extra identify vendor. */

export const LISTEN_SECONDS = 15;

const RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

export function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return RECORDER_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

/** Names that hit the audio (not video-duration) path on /api/identify-audio. */
export function recorderFileMeta(mime: string): { type: string; name: string } {
  const type = mime.split(";")[0]?.trim() || "audio/webm";
  if (type.includes("mp4")) return { type: type || "audio/mp4", name: "listen.m4a" };
  if (type.includes("ogg")) return { type: type || "audio/ogg", name: "listen.ogg" };
  if (type.includes("mpeg") || type.includes("mp3")) return { type: "audio/mpeg", name: "listen.mp3" };
  return { type: type.startsWith("audio/") ? type : "audio/webm", name: "listen.opus" };
}

export function micErrorMessage(err: unknown): string {
  if (!err) return "Could not listen. Try again, or upload a file.";
  const name = typeof err === "object" && err && "name" in err ? String((err as { name: unknown }).name) : "";
  if (name === "AbortError") return "";
  const msg = err instanceof Error ? err.message : String(err);
  if (name === "NotAllowedError" || name === "SecurityError" || /permission|denied|notallowed/i.test(msg)) {
    return "Microphone blocked. Allow mic in the browser, or upload a file.";
  }
  if (name === "NotFoundError" || /notfound|no microphone|requested device not found/i.test(msg)) {
    return "No microphone found. Plug one in, or upload a file.";
  }
  if (name === "NotReadableError" || name === "OverconstrainedError" || /track.*start|could not start/i.test(msg)) {
    return "Microphone is busy. Close other apps using it, or upload a file.";
  }
  if (
    name === "NotSupportedError" ||
    /mediarecorder|getusermedia is not defined|issecurecontext|https/i.test(msg)
  ) {
    return "This browser cannot listen from the mic. Upload a file instead.";
  }
  return msg.trim() || "Could not listen. Try again, or upload a file.";
}

function abortError(message = "Listening cancelled."): Error {
  const err = new Error(message);
  err.name = "AbortError";
  return err;
}

function unsupported(message: string): Error {
  const err = new Error(message);
  err.name = "NotSupportedError";
  return err;
}

export async function recordMicClip(opts: {
  durationMs?: number;
  onTick?: (secondsLeft: number) => void;
  signal?: AbortSignal;
}): Promise<File> {
  const durationMs = opts.durationMs ?? LISTEN_SECONDS * 1000;
  const signal = opts.signal;

  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw unsupported("This browser cannot listen from the mic. Upload a file instead.");
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw unsupported("Microphone needs https (or localhost). Upload a file instead.");
  }
  if (typeof MediaRecorder === "undefined") {
    throw unsupported("This browser cannot listen from the mic. Upload a file instead.");
  }
  if (signal?.aborted) throw abortError();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  if (signal?.aborted) {
    for (const track of stream.getTracks()) track.stop();
    throw abortError();
  }
  if (stream.getAudioTracks().length === 0) {
    for (const track of stream.getTracks()) track.stop();
    const err = new Error("No microphone found. Plug one in, or upload a file.");
    err.name = "NotFoundError";
    throw err;
  }

  const mime = pickRecorderMime();
  const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  return new Promise<File>((resolve, reject) => {
    let settled = false;
    const started = Date.now();
    opts.onTick?.(Math.ceil(durationMs / 1000));

    const stopTracks = () => {
      for (const track of stream.getTracks()) track.stop();
    };

    const cleanup = () => {
      window.clearInterval(tickTimer);
      window.clearTimeout(stopTimer);
      signal?.removeEventListener("abort", onAbort);
      recorder.onerror = null;
      recorder.onstop = null;
      stopTracks();
    };

    const fail = (err: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const succeed = () => {
      if (settled) return;
      settled = true;
      cleanup();
      const type = recorder.mimeType || mime || "audio/webm";
      const meta = recorderFileMeta(type);
      const file = new File(chunks, meta.name, { type: meta.type });
      if (file.size < 64) {
        reject(new Error("No audio captured. Try again, or upload a file."));
        return;
      }
      resolve(file);
    };

    const onAbort = () => {
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        /* already stopped */
      }
      fail(abortError());
    };

    const tickTimer = window.setInterval(() => {
      const leftMs = Math.max(0, durationMs - (Date.now() - started));
      opts.onTick?.(Math.max(0, Math.ceil(leftMs / 1000)));
    }, 250);

    const stopTimer = window.setTimeout(() => {
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch (err) {
        fail(err);
      }
    }, durationMs);

    recorder.onerror = () => fail(new Error("Could not listen. Try again, or upload a file."));
    recorder.onstop = () => {
      if (signal?.aborted) {
        fail(abortError());
        return;
      }
      succeed();
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort);

    try {
      recorder.start(1000);
    } catch {
      try {
        recorder.start();
      } catch (err) {
        fail(err);
      }
    }
  });
}
