import type { AnalyzeErrorBody, AnalyzeSuccess } from "@/types/analysis";

export type AnalyzeJsonBody = AnalyzeSuccess | AnalyzeErrorBody;

export type AnalyzeWorkResult = {
  status: number;
  body: AnalyzeJsonBody;
};

/**
 * Stream NDJSON with periodic pings so Railway's edge does not kill long
 * video jobs that otherwise send zero bytes until the end.
 */
export function keepAliveNdjsonResponse(work: () => Promise<AnalyzeWorkResult>): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };

      write({ type: "ping" });

      const heartbeat = setInterval(() => {
        try {
          write({ type: "ping" });
        } catch {
          // stream already closed
        }
      }, 10_000);

      try {
        const { status, body } = await work();
        write({
          type: body.ok ? "result" : "error",
          status,
          ...body,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        write({
          type: "error",
          status: 500,
          ok: false,
          error: "Analysis failed unexpectedly.",
          hint: message || undefined,
        } satisfies AnalyzeErrorBody & { type: string; status: number });
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
