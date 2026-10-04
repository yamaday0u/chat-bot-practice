"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const history: Message[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: reply }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      // 失敗したターンは履歴から外す
      setMessages(messages);
      setInput(text);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex h-screen w-full max-w-3xl flex-col px-4">
      <header className="border-b border-zinc-200 py-4 dark:border-zinc-800">
        <h1 className="text-xl font-semibold">Chat Bot Practice</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.length === 0 && (
          <p className="text-center text-zinc-500">
            メッセージを入力して会話を始めましょう
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              {m.content || (isLoading ? "…" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="pb-2 text-sm text-red-600">エラー: {error}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-zinc-200 py-4 dark:border-zinc-800"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力…"
          className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-4 py-2 outline-none focus:border-blue-500 dark:border-zinc-700"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </main>
  );
}
