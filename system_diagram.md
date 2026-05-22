# Monetizer.ai - System Architecture Diagram

## Overview
This document presents the complete system architecture for Monetizer.ai, an AI-powered creator platform that connects users with AI personas of YouTube creators for product recommendations and monetized conversations.

---

## System Architecture Diagram

```mermaid
graph TB
    subgraph "User Layer"
        U1[User Browser]
        U2[User Voice Input]
    end

    subgraph "Frontend Layer - HTML/CSS/JS"
        F1[index.html<br/>Multi-page SPA]
        F2[script.js<br/>990 lines]
        F3[styles.css<br/>1218 lines]
        F4[Canvas Confetti<br/>Animations]
    end

    subgraph "API Communication"
        API1[POST /api/chat<br/>Message, Creator, SessionId]
        API2[GET /api/health<br/>Health Check]
        API3[GET /api/creators<br/>Creator List]
    end

    subgraph "Backend - Flask Server (Port 5001)"
        B1[server.py<br/>246 lines]
        B2[Conversation History<br/>Session Management]
        B3[Creator ID Mapping]
    end

    subgraph "RAG Service Layer"
        R1[rag_service.py<br/>369 lines]
        R2[Embedding Model<br/>SentenceTransformer]
        R3[Semantic Search<br/>0.3 Threshold]
        R4[Fallback Logic]
    end

    subgraph "Creator Configuration"
        C1[creator_config.py<br/>45 lines]
        C2[Per-Creator Supabase Config]
        C3[Table Name Mapping]
    end

    subgraph "AI/LLM Integration"
        A1[Groq API<br/>llama-3.1-8b-instant]
        A2[Max Tokens: 2000]
        A3[Temperature: 0.5]
        A4[Context Window: 10 msgs]
    end

    subgraph "Data Layer - Supabase Per Creator"
        D1[MKBHD Database<br/>Supabase project from env]
        D2[Table: mkbhd_videos<br/>26 entries]
        D3[Zack Nelson DB<br/>jerry_videos]
        D4[Unbox Therapy DB<br/>unbox_videos]
        D5[Vector Embeddings<br/>384 dim]
    end

    subgraph "External APIs"
        E1[ElevenLabs API<br/>TTS]
        E2[Web Speech API<br/>STT]
        E3[Groq API<br/>Free Tier]
    end

    subgraph "Static Assets"
        S1[photos/<br/>Creator Images]
        S2[mono.png<br/>Logo]
        S3[avatar/<br/>Video Assets]
    end

    %% User to Frontend
    U1 -->|HTTP GET| F1
    U2 -->|Web Speech API| F2
    F1 --> F2
    F2 --> F3
    F4 -.-> F1

    %% Frontend to Backend
    F2 -->|POST Request| API1
    F2 -->|Health Check| API2
    F2 -->|Get Creators| API3

    %% API to Backend
    API1 --> B1
    API2 --> B1
    API3 --> B1

    %% Backend to RAG
    B1 --> B2
    B2 --> R1
    B1 --> B3

    %% RAG Service
    R1 --> R2
    R2 --> R3
    R3 --> R4
    R1 --> C1

    %% Config to Data
    C1 --> C2
    C2 --> C3
    C3 --> D1
    C3 --> D3
    C3 --> D4

    %% Data Layer
    D1 --> D2
    D3 --> D5
    D4 --> D5

    %% RAG to AI
    R1 -->|Enhanced Prompt| A1
    A1 --> A2
    A2 --> A3
    A3 --> A4

    %% Voice Processing
    F2 -->|Audio| E1
    F2 -->|Speech| E2

    %% Static Assets
    F1 --> S1
    F1 --> S2
    F2 --> S3

    %% Styling
    classDef userLayer fill:#e1f5fe
    classDef frontendLayer fill:#f3e5f5
    classDef backendLayer fill:#fff3e0
    classDef raglayer fill:#e8f5e9
    classDef datalayer fill:#fce4ec
    classDef apilayer fill:#e0f2f1

    class U1,U2 userLayer
    class F1,F2,F3,F4 frontendLayer
    class B1,B2,B3 backendLayer
    class R1,R2,R3,R4,C1,C2,C3 raglayer
    class D1,D2,D3,D4,D5 datalayer
    class A1,A2,A3,A4,E1,E2,E3 apilayer
```

---

## Data Flow Diagrams

### 1. User Chat Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant F as Frontend (script.js)
    participant B as Flask Server
    participant R as RAG Service
    participant S as Supabase
    participant G as Groq API

    U->>F: Type message & select creator
    F->>B: POST /api/chat (message, creator, sessionId)
    B->>B: Get/create conversation history
    B->>R: retrieve_and_augment(query, creator, id)
    R->>R: Get creator config
    R->>S: Query creator's Supabase database
    S->>R: Return relevant entries
    R->>R: Generate embeddings
    R->>R: Semantic similarity search (0.3 threshold)
    R->>B: Enhanced prompt + knowledge context
    B->>G: Call Groq API with context
    G->>B: AI response
    B->>B: Add to conversation history
    B->>F: Return response + sessionId
    F->>U: Display formatted response
```

### 2. Voice Chat Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant W as Web Speech API
    participant B as Flask Server
    participant E as ElevenLabs API
    participant A as AudioContext

    U->>F: Click microphone
    F->>F: Open voice modal
    F->>W: Start listening
    U->>W: Speak message
    W->>F: Transcript on pause
    F->>B: POST /api/chat (same as text)
    B->>F: Return response
    F->>F: Summarize response
    F->>E: Generate audio (TTS)
    E->>F: Return audio
    F->>F: Play audio with visualization
    A->>F: Analyze frequency
    F->>F: Scale logo by pitch
    F->>U: Display audio + animation
```

### 3. Creator Registration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant V as Validation
    participant C as Confetti

    U->>F: Fill signup form
    U->>F: Click submit
    F->>V: Validate email & phone
    V->>F: Validation result
    F->>C: Trigger confetti animation
    C->>C: Play confetti (3s)
    C->>F: Show success modal (1s delay)
    F->>U: Display success message
    U->>F: Click "Back to Home"
    F->>U: Redirect to home page
```

---

## Component Details

### 1. Frontend Components

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| HTML Structure | `index.html` | 206 | Multi-page SPA with Home, Creator Selection, Chat, and Signup pages |
| JavaScript Logic | `script.js` | 990 | Navigation, search (Trie), chat, voice, confetti, form validation |
| Styling | `styles.css` | 1218 | Dark mode UI, animations, responsive design, cyan theme |

**Key Features:**
- Trie-based autocomplete for creator search
- Real-time audio visualization with pitch detection
- Confetti animations for celebrations
- Form validation with regex
- Typewriter effect for streaming responses
- Markdown parsing for AI responses

### 2. Backend Components

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Flask Server | `server.py` | 246 | API endpoints, conversation management |
| RAG Service | `rag_service.py` | 369 | Knowledge retrieval, embeddings, semantic search |
| Creator Config | `creator_config.py` | 45 | Per-creator Supabase configuration |

**Key Features:**
- Session-based conversation context
- Per-creator isolated knowledge bases
- Fallback responses when no knowledge found
- CORS enabled for frontend communication

### 3. Data Layer

| Creator | Database | Table | Entries |
|---------|----------|-------|---------|
| Marques Brownlee | (set in .env) | mkbhd_videos | 26 |
| Zack Nelson | jerry_videos | jerry_videos | TBD |
| Unbox Therapy | unbox_videos | unbox_videos | TBD |

**Schema:**
- `id`: Serial PRIMARY KEY
- `title`: TEXT
- `content`: TEXT
- `embedding`: VECTOR(384) - sentence-transformers dimension
- `similarity_score`: FLOAT

### 4. External Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Groq API | LLM inference | Model: llama-3.1-8b-instant, Max tokens: 2000, Free tier: 14,400 req/day |
| ElevenLabs | Text-to-Speech | Voice ID: 5Q0t7uMcjvnagumLfvZi (Male) |
| Web Speech API | Speech-to-Text | Browser-based, no configuration needed |
| Supabase | Database | Per-creator instances with REST API |

---

## System Requirements

### Performance Metrics
- **Chat Response Time**: < 3 seconds
- **Voice Response Time**: < 5 seconds
- **Vector Search**: < 500ms
- **Audio Visualization**: 60 FPS

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Canvas Confetti
- **Backend**: Python 3.13, Flask 2.3.3
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: Groq API, SentenceTransformers, LangChain
- **APIs**: ElevenLabs, Web Speech API

### Security
- CORS enabled for frontend origin
- API keys stored in code (should be moved to environment variables)
- Input validation and sanitization
- Session-based conversation management

---

## Deployment Notes

**Local Development:**
- Flask server runs on port 5001
- Debug mode enabled
- Static files served from same directory

**Production Recommendations:**
- Move API keys to environment variables
- Use production WSGI server (Gunicorn)
- Enable HTTPS
- Add rate limiting
- Implement proper error logging
- Add database connection pooling

---

## File Structure

```
project/
├── index.html              # Main HTML file
├── script.js               # Frontend JavaScript (990 lines)
├── styles.css              # Styling (1218 lines)
├── server.py               # Flask backend (246 lines)
├── rag_service.py          # RAG implementation (369 lines)
├── creator_config.py       # Creator configs (45 lines)
├── requirements.txt        # Python dependencies
├── photos/                 # Creator profile images
│   ├── Marques_Brownlee.jpg
│   ├── AustinEvans.jpeg
│   ├── Zack Nelson.jpeg
│   ├── Lewis George Hilsenteger.jpg
│   └── mono.png
├── avatar/                 # Avatar assets
│   └── marcus brownlee.mp4
└── system_diagram.md       # This file
```

---

## Notes
- Creator "Austin Evans" is mapped to "Justine Ezarik" config (needs update)
- Total frontend code: ~2,414 lines
- Total backend code: ~660 lines
- RAG system uses semantic similarity with 0.3 threshold
- Conversation context limited to last 10 messages
