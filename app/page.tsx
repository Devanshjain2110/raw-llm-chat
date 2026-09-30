"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [returnText, setReturnText] = useState<string | null>(null);
  const [loader, setLoader] = useState(false);
  async function handleClick() {
    setReturnText("");
    const res = await fetch("/api/test?q=" + encodeURIComponent(input));
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") continue;

        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) setReturnText((prev) => (prev ?? "") + delta);
        } catch { }
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen min-w-screen items-center justify-center gap-3">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={handleClick}>Send</button>
      {returnText && <p style={{ whiteSpace: "pre-wrap" }}>{returnText}</p>}
      {loader && <p>Loading...</p>}
    </div>
  );
}