import type { AnalyzeErrorBody, AnalyzeSuccess } from "@/types/analysis";

export type NdjsonHandlers = {
  onStage?: (stage: string) => void;
};

export type NdjsonAcc<T> = { payload: T | null };

/**
 * Apply one parsed NDJSON object. Pings are ignored. Stage lines call onStage.
 * Result/error lines stash the payload (HTTP status lives on the line, not the body).
 */
export function consumeNdjsonRecord<T extends { ok?: boolean }>(
  obj: Record<string, unknown>,
  acc: NdjsonAcc<T>,
  handlers?: NdjsonHandlers,
): void {
  if (obj.type === "ping") return;
  if (obj.type === "stage") {
    if (typeof obj.stage === "string" && obj.stage.trim()) {
      handlers?.onStage?.(obj.stage);
    }
    return;
  }
  const rest = { ...obj };
  delete rest.type;
  delete rest.status;
  if (rest.ok === true || rest.ok === false) {
    acc.payload = rest as T;
  }
}

/**
 * Reads either classic JSON or NDJSON keep-alive streams from analyze routes.
 */
export async function readAnalyzeResponse<T extends { ok?: boolean } = AnalyzeSuccess | AnalyzeErrorBody>(
  res: Response,
  handlers?: NdjsonHandlers,
): Promise<T> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("ndjson") && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const acc: NdjsonAcc<T> = { payload: null };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let obj: Record<string, unknown>;
        try {
          obj = JSON.parse(trimmed) as Record<string, unknown>;
        } catch {
          continue;
        }
        consumeNdjsonRecord(obj, acc, handlers);
      }
    }

    if (!acc.payload) {
      throw new Error("Empty analyze response from server.");
    }
    return acc.payload;
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new Error("Invalid response from server.");
  }
}
