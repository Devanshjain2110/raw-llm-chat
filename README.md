# raw-llm-chat

A small Next.js app that sends a prompt to a large language model and shows the reply. It uses no SDK and no framework, just a raw `fetch` from a route handler.

I built it to learn how LLM APIs actually work under the hood before reaching for libraries that hide the details. It started on Google's Gemini API and now runs against a local open-weight model (`llama3.2`) through Ollama.

## How it works

```
Browser (page with input + button)
   │  GET /api/chat?q=<your prompt>
   ▼
Next.js route handler (app/api/chat/route.ts)
   │  fetch → model API
   ▼
Gemini API  or  Ollama (localhost:11434)
   │
   ▼
Reply text rendered on the page
```

## Running it

```bash
git clone https://github.com/<your-username>/raw-llm-chat.git
cd raw-llm-chat
npm install
npm run dev
```

**Using a local model (Ollama, default):** install [Ollama](https://ollama.com), then run:

```bash
ollama pull llama3.2
```

No API key is needed, and nothing leaves your machine.

**Using Gemini:** get a free key from [Google AI Studio](https://aistudio.google.com) and put it in `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

`.env.local` is in `.gitignore`. Never commit API keys.

## What I learned

### Tokens

Models don't read letters or words. They read **tokens**, chunks of text that average about ¾ of a word. Limits and pricing are both counted in tokens. This is also why models are bad at counting letters in a word: they never see the individual letters.

### The MAX_TOKENS bug

I set `maxOutputTokens: 30` to keep replies short. The whole reply came back as:

> An API

The response metadata explained why:

```
finishReason: "MAX_TOKENS"
thoughtsTokenCount: 24
candidatesTokenCount: 2
```

The model "thinks" before answering, and those thinking tokens come out of the same budget as the answer. It spent 24 of my 30 tokens thinking and had almost nothing left for the reply. Raising the limit to 2000 fixed it (`finishReason: "STOP"`).

**In plain English:** I gave someone 30 seconds to answer a question. They spent 24 seconds thinking, so all I got was "An API". The fix was to give them more time.

### Read the response before indexing into it

`data.candidates[0].content.parts[0].text` makes four assumptions in a row. When generation hit the token limit, `parts` was missing and the app crashed. I now use optional chaining and check `finishReason`.

### Model names change

`gemini-2.5-flash` started returning 404. Instead of trusting tutorials, I call the list-models endpoint (`GET /v1beta/models` for Gemini, `/v1/models` for Ollama) to see which models actually exist right now.

### Swapping providers

Gemini and the OpenAI-style APIs use different shapes:

| | Request | Reply text lives at |
|---|---|---|
| Gemini | `contents` / `parts` | `candidates[0].content.parts[0].text` |
| OpenAI-compatible (Ollama, most others) | `messages` with roles | `choices[0].message.content` |

Because Ollama offers an OpenAI-compatible endpoint (`/v1/chat/completions`), switching was only a few lines. Keeping provider-specific code in one function makes swapping cheap.

### Temperature

I sent the same prompt ("write one sentence about the sea") five times at each setting:

- `temperature: 0` gave almost identical sentences every time.
- `temperature: 1.8` gave all different sentences, which got stranger as they went.

Temperature doesn't change what the model predicts. It changes how the next token is picked from those predictions. Low values suit anything code needs to parse, and high values suit creative work.

(Gemini 3.x models ignore temperature, which is why I ran this experiment locally.)

### The prompt is a control surface

- Replies came back full of Markdown. Adding "respond in plain text, no Markdown" to the prompt fixed it, with no extra library needed.
- A **system message** sets behaviour for the whole conversation. A pirate persona turned the same question into a completely different answer.
- The model is **stateless**: it remembers nothing between calls. "Conversation history" is just an array of messages you send again each time.

## Next

- Stream the reply token-by-token (Server-Sent Events)
- Force structured JSON output
- Log token usage and cost per request
