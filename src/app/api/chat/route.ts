import Anthropic from "@anthropic-ai/sdk";

// ANTHROPIC_API_KEY を .env.local から読み込む
const client = new Anthropic();

const SYSTEM_PROMPT =
  "あなたは親切で簡潔なアシスタントです。ユーザーと同じ言語で回答してください。";

export async function POST(request: Request) {
  const { messages } = (await request.json()) as {
    messages: Anthropic.MessageParam[];
  };

  const stream = client.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 64000,
    system: SYSTEM_PROMPT,
    // チャット用途なので応答速度を優先して low に設定
    output_config: { effort: "low" },
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const message = await stream.finalMessage();
        console.log(
          `[chat] input_tokens=${message.usage.input_tokens} output_tokens=${message.usage.output_tokens}`,
        );
        if (message.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode("\n\n（このリクエストには回答できませんでした）"),
          );
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
