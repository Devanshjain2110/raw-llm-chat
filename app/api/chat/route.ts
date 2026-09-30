export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("q") ?? "Explain what an API is in one sentence.";

  const res = await fetch(
    "http://localhost:11434/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",

      },
      body: JSON.stringify({
        model: "llama3.2",
        messages: [
          { role: "system", content: "Answer in exactly one sentence, no preamble" },
          { role: "user", content: prompt },
        ],
        temperature: 1.8,
        stream: true,
      }),
    });


  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}