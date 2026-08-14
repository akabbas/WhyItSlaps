import type { AnalyzeErrorBody, AnalyzeSuccess } from "@/types/analysis";

/**
 * Reads either classic JSON or NDJSON keep-alive streams from analyze routes.
 */
export async function readAnalyzeResponse(
  res: Response,
): Promise<AnalyzeSuccess | AnalyzeErrorBody> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("ndjson") && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalPayload: AnalyzeSuccess | AnalyzeErrorBody | null = null;

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
        if (obj.type === "ping") continue;
        const rest = { ...obj };
        delete rest.type;
        delete rest.status;
        if (rest.ok === true || rest.ok === false) {
          finalPayload = rest as unknown as AnalyzeSuccess | AnalyzeErrorBody;
        }
      }
    }

    if (!finalPayload) {
      throw new Error("Empty analyze response from server.");
    }
    return finalPayload;
  }

  try {
    return (await res.json()) as AnalyzeSuccess | AnalyzeErrorBody;
  } catch {
    throw new Error("Invalid response from server.");
  }
}
