# Monetizer.ai — AI creator chat

**What it does:** With **permission from the creator**, the pipeline ingests that creator’s videos (for example from an approved channel or export), extracts **captions / transcripts**, and stores them in a database. That text becomes the **retrieval context** for a **RAG chatbot**: when a user asks what that creator thinks about a **particular product**, the assistant answers from those stored captions instead of generic web knowledge. When you configure it (for example via `AFFILIATE_LINK` in `.env`), replies can also surface an **affiliate link** so the creator can earn from qualifying referrals.

The web app lets users pick a creator and chat (plus optional voice via the backend). Knowledge and embeddings are backed by **Supabase** (or your own store) and **sentence-transformers**; the LLM runs through **Groq**.

## Quick start

1. **Python 3.10+** and a virtualenv (or conda) are recommended.

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**

   Copy `.env.example` to `.env` and fill in values (Groq, optional ElevenLabs, optional Supabase per creator, optional `AFFILIATE_LINK`). Comments in `.env.example` mark where each secret goes.

4. **Run the server**

   ```bash
   python server.py
   ```

5. **Open the app**

   `http://localhost:5001` (or the host/port you set in `.env`).

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | SPA shell |
| POST | `/api/chat` | Chat (JSON: `message`, `creator`, `systemPrompt`, `sessionId`) |
| GET | `/api/health` | Liveness; reports whether Groq/TTS env vars are set (not their values) |
| POST | `/api/tts` | Text-to-speech proxy (JSON: `text`) — requires `ELEVENLABS_API_KEY` on the server |
| GET | `/api/creators` | Creator list for the UI |

## Stack

- **Frontend**: static HTML/CSS/JS
- **Backend**: Flask + flask-cors
- **LLM**: Groq OpenAI-compatible chat API
- **RAG**: sentence-transformers, optional Supabase vector/table data
- **Voice**: browser speech recognition + server-side ElevenLabs for playback

## Disclaimer

**Disclaimer:** Photos, likenesses, and other materials in this repository and in the demo application are used for **demonstration purposes only**. No monetization is intended. Do not use this project for commercialization. If you have a concern or wish to make a copyright claim, contact [parthgupta9999@gmail.com](mailto:parthgupta9999@gmail.com).

## License

MIT
