import logging

import config
import requests
from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS

from rag_service import rag_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

CREATOR_ID_MAP = {
    "Marques Brownlee": 1,
    "Austin Evans": 2,
    "Justine Ezarik": 3,
    "Zack Nelson": 4,
    "Lewis George Hilsenteger": 5,
}


def get_creator_id(creator_name):
    return CREATOR_ID_MAP.get(creator_name, 1)


def call_groq_api_with_context(messages, creator_name, system_prompt):
    if not config.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not set")

    headers = {
        "Authorization": f"Bearer {config.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    api_messages = [{"role": "system", "content": system_prompt}]
    recent = messages[-10:] if len(messages) > 10 else messages
    api_messages.extend(recent)
    payload = {
        "model": config.GROQ_MODEL,
        "messages": api_messages,
        "max_tokens": 2000,
        "temperature": 0.5,
    }
    response = requests.post(
        config.GROQ_API_URL, headers=headers, json=payload, timeout=120
    )
    if response.status_code == 200:
        data = response.json()
        text = data["choices"][0]["message"]["content"]
        logger.info(
            "Groq ok for %s (%s context msgs)", creator_name, len(messages)
        )
        return text
    logger.error("Groq error %s: %s", response.status_code, response.text)
    raise RuntimeError(response.text)


def get_demo_response(message, creator_name):
    lines = {
        "Marques Brownlee": (
            f"Hey! I'm Marques from MKBHD. You asked: '{message}'. "
            "I can help with tech reviews, phones, and gadgets."
        ),
        "Austin Evans": (
            f"I'm Austin Evans. On '{message}' — ask me about PCs, "
            "gaming hardware, or setups."
        ),
        "Justine Ezarik": (
            f"Hi, I'm iJustine. Re '{message}' — Apple, unboxings, "
            "and gear are my wheelhouse."
        ),
        "Zack Nelson": (
            f"I'm Zack from JerryRigEverything. About '{message}' — "
            "durability, teardowns, and phones."
        ),
        "Lewis George Hilsenteger": (
            f"I'm Lewis from Unbox Therapy. You said '{message}' — "
            "unboxings and reviews are what I do."
        ),
    }
    return lines.get(
        creator_name,
        f"Hello, I'm {creator_name}. You asked: '{message}'. What should we dig into?",
    )


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(".", filename)


conversation_history = {}


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json or {}
        message = data.get("message")
        creator = data.get("creator")
        system_prompt = data.get("systemPrompt")
        session_id = data.get("sessionId", "default")

        if not message or not creator:
            return jsonify({"error": "Message and creator are required"}), 400

        logger.info("Chat %s: %s...", creator, message[:50])

        if session_id not in conversation_history:
            conversation_history[session_id] = {"creator": creator, "messages": []}

        conversation_history[session_id]["messages"].append(
            {"role": "user", "content": message}
        )

        try:
            creator_id = get_creator_id(creator)
            rag_result = rag_service.retrieve_and_augment(
                message, creator, creator_id
            )

            if not rag_result["has_knowledge"]:
                ai_response = rag_result["fallback_response"]
                logger.info("RAG: no knowledge, fallback text")
            else:
                ai_response = call_groq_api_with_context(
                    conversation_history[session_id]["messages"],
                    creator,
                    rag_result["enhanced_system_prompt"],
                )
                logger.info(
                    "RAG reply with %s entries", rag_result["retrieved_entries"]
                )

            conversation_history[session_id]["messages"].append(
                {"role": "assistant", "content": ai_response}
            )

            return jsonify(
                {
                    "response": ai_response,
                    "sessionId": session_id,
                    "messageCount": len(
                        conversation_history[session_id]["messages"]
                    ),
                    "rag_used": rag_result["has_knowledge"],
                    "knowledge_entries": rag_result["retrieved_entries"],
                }
            )
        except Exception as api_error:
            logger.warning("Chat pipeline fallback: %s", api_error)
            demo_response = get_demo_response(message, creator)
            conversation_history[session_id]["messages"].append(
                {"role": "assistant", "content": demo_response}
            )
            return jsonify(
                {
                    "response": demo_response,
                    "sessionId": session_id,
                    "messageCount": len(
                        conversation_history[session_id]["messages"]
                    ),
                }
            )

    except Exception as e:
        logger.error("POST /api/chat: %s", e)
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "healthy",
            "groq_configured": bool(config.GROQ_API_KEY),
            "tts_configured": bool(config.ELEVENLABS_API_KEY),
            "model": config.GROQ_MODEL,
        }
    )


@app.route("/api/tts", methods=["POST"])
def tts():
    if not config.ELEVENLABS_API_KEY:
        return jsonify({"error": "Voice service not configured"}), 503
    body = request.get_json() or {}
    text = (body.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400
    text = text[:5000]
    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/"
        f"{config.ELEVENLABS_VOICE_ID}"
    )
    upstream = requests.post(
        url,
        headers={
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": config.ELEVENLABS_API_KEY,
        },
        json={
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
        },
        timeout=120,
    )
    if upstream.status_code != 200:
        logger.error("ElevenLabs %s", upstream.text)
        return jsonify({"error": "TTS upstream error"}), 502
    return Response(upstream.content, mimetype="audio/mpeg")


@app.route("/api/creators", methods=["GET"])
def get_creators():
    creators = [
        {
            "id": 1,
            "name": "Marques Brownlee",
            "specialty": '"MKBHD"',
            "avatar": "photos/Marques_Brownlee.jpg",
            "description": "Tech reviewer and YouTuber known for in-depth smartphone and gadget reviews",
        },
        {
            "id": 2,
            "name": "Austin Evans",
            "specialty": '"Austin Evans"',
            "avatar": "photos/AustinEvans.jpeg",
            "description": "Tech YouTuber specializing in PC builds, gaming hardware, and tech reviews",
        },
        {
            "id": 3,
            "name": "Zack Nelson",
            "specialty": '"JerryRigEverything"',
            "avatar": "photos/Zack Nelson.jpeg",
            "description": "Tech YouTuber famous for durability tests and smartphone teardowns",
        },
        {
            "id": 4,
            "name": "Lewis George Hilsenteger",
            "specialty": '"Unbox Therapy"',
            "avatar": "photos/Lewis George Hilsenteger.jpg",
            "description": "Tech YouTuber known for unboxing videos and tech product reviews",
        },
    ]
    return jsonify({"creators": creators})


if __name__ == "__main__":
    print("Server http://%s:%s" % (config.HOST, config.PORT))
    app.run(host=config.HOST, port=config.PORT, debug=config.FLASK_DEBUG)
