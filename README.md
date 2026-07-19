# AI Process Bot 🤖

An intelligent, self-hosted internal knowledge-base Q&A assistant that lets teams ask natural-language questions about internal processes, systems, and workflows — and get accurate, context-aware answers powered by LLMs. Built with a Vue 3 chat interface and a Node.js/Express backend supporting multiple AI providers.

---

## Table of Contents

- [Overview](#overview)
- [Project Vision & Judging Criteria](#project-vision--judging-criteria)
- [Recent Changes](#recent-changes)
- [Architecture](#architecture)
- [How It Works — Data Flow](#how-it-works--data-flow)
- [Features](#features)
- [Project Structure](#project-structure)
- [Backend Deep Dive](#backend-deep-dive)
- [Frontend Deep Dive](#frontend-deep-dive)
- [API Reference](#api-reference)
- [AI Provider System](#ai-provider-system)
- [Knowledge Base System](#knowledge-base-system)
- [Middleware & Security](#middleware--security)
- [Logging & Observability](#logging--observability)
- [Quick Start (Clone & Run)](#quick-start-clone--run)
- [Configuration Reference](#configuration-reference)
- [Development Mode](#development-mode)
- [Deployment (Render + Vercel)](#deployment-render--vercel)
- [Roadmap & Improvements](#roadmap--improvements)
- [Potential New Features](#potential-new-features)

---

## Overview

**Problem:** In complex multi-product organizations, tribal knowledge lives in scattered docs, Slack threads, and people's heads. New team members and even veterans waste hours finding answers to process-related questions.

**Solution:** AI Process Bot ingests your internal documentation (Markdown/text files), and when a user asks a question through the chat UI, it:

1. Extracts keywords from the question
2. Searches across all loaded knowledge documents for relevant context
3. Sends the question + matched context to an LLM (Groq/OpenAI/Anthropic)
4. Returns a clear, grounded answer — not hallucinated, but based on **your** docs

This makes it a **Retrieval-Augmented Generation (RAG)** system tailored for internal knowledge.

---

## Project Vision & Judging Criteria

This project was built as a **central command for operational knowledge** — a single AI assistant that helps teams navigate complex, multi-product enterprise workflows (Order Management, Shipment, Billing, Inventory) without digging through scattered documentation.

Projects in this space are evaluated on:

| Criterion | How Koshendra addresses it |
|-----------|----------------------------|
| **Innovation** | Combines keyword-based RAG with a product/module-aware chat UI — users browse domains (OM, SM, BM, IM) and ask contextual questions instead of searching static wikis |
| **Execution** | Full-stack working app: Vue 3 frontend, Express API, MongoDB auth & chat history, multi-provider LLM integration, rate limiting, and structured knowledge retrieval |
| **Impact** | Reduces time-to-answer for process questions; onboarding new team members faster; one place for order, shipment, billing, and inventory workflows |
| **Product quality** | Polished chat UX with auth, sidebar history, suggested questions, product explorer, responsive layout, and graceful error/rate-limit handling |
| **Meaningful use of AI** | LLM answers are **grounded in loaded documentation** — the system retrieves relevant docs first, then generates; it refuses to invent facts when no context is found |
| **Creativity** | Product-centric navigation (modules + starter questions) paired with a general Q&A engine; demo-safe generic knowledge base for public sharing without exposing confidential internals |

---

## Recent Changes

| Change | Details |
|--------|---------|
| **Generic knowledge base** | Replaced confidential internal docs with demo-safe Markdown in `knowledge/` covering all four product domains (OM, SM, BM, IM) and their modules |
| **Auth proxy fix** | Vite dev proxy now correctly targets backend port **7000** (was misconfigured to 7001, causing login/register `ECONNREFUSED` errors) |
| **Knowledge file structure** | Four aligned docs: `order-management.md`, `shipment-management.md`, `billing-management.md`, `inventory-management.md` |
| **Demo disclaimer** | Each knowledge file includes a notice that content is fictional/sample data for public demos |

> **For production:** Replace files in `knowledge/` with your real internal documentation. Never commit `.env` or confidential docs to a public repository.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Vue 3 Frontend                           │
│                                                                  │
│  ┌────────────┐  ┌───────────┐  ┌─────────────────────────────┐  │
│  │ AuthModal  │  │ AppHeader │  │        Main Content         │  │
│  │ (JWT login │  └───────────┘  │                             │  │
│  │  register) │                 │  ┌─────────┐ ┌───────────┐  │  │
│  └────────────┘  ┌───────────┐  │  │Welcome  │ │ChatScreen │  │  │
│                  │ Sidebar   │  │  │Screen   │ │ ┌────────┐│  │  │
│  ┌────────────┐  │ • chat    │  │  │ • prods │ │ │MsgList ││  │  │
│  │  Stores    │  │   history │  │  │ • sugge-│ │ │        ││  │  │
│  │ • authStore│  │ • new chat│  │  │   stions│ │ ├────────┤│  │  │
│  │ • chatStore│  │ • rename  │  │  └─────────┘ │ │ChatInpt││  │  │
│  └────────────┘  │ • delete  │  │              │ └────────┘│  │  │
│                  └───────────┘  │  ┌─────────────────────┐ │  │  │
│  ┌────────────┐                 │  │ Products            │ │  │  │
│  │Composables │                 │  │ • product-list      │ │  │  │
│  │ • useChat  │                 │  │ • product-detail    │ │  │  │
│  └────────────┘                 │  └─────────────────────┘ │  │  │
│                                 └─────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────┘
                       │ POST /api/ask, /api/auth/*, /api/chats/*
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Express.js Backend                          │
│                                                                  │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────┐    │
│  │  Middleware  │──▶│ Controllers  │──▶│     Services       │    │
│  │ • Rate Limit│   │ • ask        │   │ • knowledgeService │    │
│  │ • Validator │   │ • health     │   │ • aiService        │    │
│  │ • Auth (JWT)│   │ • auth       │   └────────┬───────────┘    │
│  └─────────────┘   │ • chats     │            │                │
│                    └──────────────┘            │                │
│  ┌──────────────┐   ┌──────────────────────┐  │                │
│  │    Logger     │   │  Knowledge Files    │  │                │
│  │ queries.log  │   │  /knowledge/*.md    │◀─┘                │
│  │ errors.log   │   └──────────────────────┘                   │
│  └──────────────┘   ┌──────────────────────┐                   │
│                     │  MongoDB             │                   │
│                     │ • users, chats, msgs │                   │
│                     └──────────────────────┘                   │
└──────────────────────┬─────────────────────────────────────────┘
                       │ API Call
                       ▼
             ┌──────────────────────┐
             │   AI Provider (LLM)  │
             │  • Groq (Llama 3.1)  │
             │  • OpenAI (GPT)      │
             │  • Anthropic (Claude)│
             └──────────────────────┘
```

---

## How It Works — Data Flow

### On Server Startup

1. **Knowledge Loading** — `knowledgeService.js` scans the `knowledge/` directory and reads all `.md` and `.txt` files into memory
2. Each document is stored as an object with its filename (as title) and full content
3. **AI Provider Initialization** — `aiService.js` reads the configured provider from `.env` and sets up the API client (Groq, OpenAI, or Anthropic)
4. **Express App Boot** — Middleware stack is mounted (rate limiter, validator, CORS, static file serving), routes are registered, and the server starts listening

### On User Question (Runtime)

```
User types question
       │
       ▼
[1] ChatInput.vue captures input, emits to App.vue
       │
       ▼
[2] App.vue sends POST /api/ask { question } to backend
       │
       ▼
[3] Rate Limiter checks if user has exceeded requests/min
       │  (rejects with 429 if exceeded)
       ▼
[4] Validator checks question is non-empty, within max length
       │  (rejects with 400 if invalid)
       ▼
[5] askController receives validated request
       │
       ▼
[6] knowledgeService.search(question)
       │  • keywords.js extracts key terms from the question
       │  • Scores each knowledge document by keyword match frequency
       │  • Returns top-N most relevant document chunks
       │
       ▼
[7] aiService.ask(question, relevantContext)
       │  • Constructs a system prompt: "You are an internal process assistant.
       │    Answer based ONLY on the provided context."
       │  • Sends system prompt + context + user question to the configured LLM
       │  • Receives generated answer
       │
       ▼
[8] Logger records: question, answer, duration, documents matched
       │
       ▼
[9] Response sent back: { success, answer, meta: { durationMs, documentsSearched } }
       │
       ▼
[10] App.vue receives response, pushes bot message to MessageList
        │
        ▼
[11] MessageList.vue renders the answer with formatting
```

---

## Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Natural Language Q&A** | Ask questions in plain English about any internal process, system, or workflow |
| **RAG (Retrieval-Augmented Generation)** | Answers are grounded in your actual documentation — not hallucinated |
| **Multi-Provider AI** | Swap between Groq (Llama 3.1), OpenAI (GPT), or Anthropic (Claude) with a single env var |
| **Keyword-Based Document Search** | Extracts meaningful keywords from questions, scores and ranks knowledge docs by relevance |
| **Real-time Chat UI** | Vue 3 chat interface with typing indicators, message history, and responsive design |
| **Knowledge Hot-Loading** | Drop `.md` or `.txt` files into `knowledge/` — server loads them on startup |

### Security & Reliability

| Feature | Description |
|---------|-------------|
| **JWT Authentication** | User login/register with JWT tokens and bcrypt password hashing |
| **Chat History Persistence** | Per-user chat sessions stored in MongoDB — create, rename, delete, switch between chats |
| **Rate Limiting** | Configurable requests-per-minute per IP to prevent abuse |
| **Input Validation** | Sanitizes and validates all user input (empty check, max length, character filtering) |
| **Error Handling** | Graceful error responses with proper HTTP status codes; errors never leak internals |
| **CORS Configuration** | Configurable cross-origin policies for dev and production |

### Observability

| Feature | Description |
|---------|-------------|
| **Query Logging** | Every question, response, duration, and matched documents logged to `logs/queries.log` |
| **Error Logging** | All errors captured with stack traces in `logs/errors.log` |
| **Health Endpoint** | `/api/health` returns server status, active AI provider, model, and loaded document count |
| **Response Metadata** | Every answer includes `durationMs` and `documentsSearched` for performance tracking |

---

## Project Structure

```
ai-process-bot/
│
├── server.js                      # Entry point — starts Express server
│
├── src/
│   ├── app.js                     # Express app setup (middleware, routes, static serving)
│   │
│   ├── config/
│   │   ├── index.js               # Centralized config (port, rate limits, AI settings from .env)
│   │   └── aiProviders.js         # Provider definitions (endpoints, headers, request formats)
│   │
│   ├── controllers/
│   │   ├── askController.js       # Handles POST /api/ask — orchestrates search + AI call
│   │   └── healthController.js    # Handles GET /api/health — returns server/provider status
│   │
│   ├── middleware/
│   │   ├── index.js               # Middleware barrel export
│   │   ├── rateLimiter.js         # IP-based rate limiting with configurable window/max
│   │   └── validator.js           # Request body validation (question field)
│   │
│   ├── services/
│   │   ├── aiService.js           # AI provider abstraction — prompt construction, API calls
│   │   └── knowledgeService.js    # Document loading, keyword search, relevance scoring
│   │
│   ├── utils/
│   │   ├── logger.js              # File-based logging (queries + errors with timestamps)
│   │   └── keywords.js            # Keyword extraction from natural language questions
│   │
│   └── routes/
│       └── index.js               # Route definitions (/api/ask, /api/health, /api/documents)
│
├── client/                        # Vue 3 Frontend (Vite)
│   ├── src/
│   │   ├── main.js                # Vue app initialization (creates app, mounts router/pinia)
│   │   ├── App.vue                # Root component — layout shell, auth gate, chat orchestration
│   │   │
│   │   ├── router/
│   │   │   └── index.js           # Vue Router config (routes for chat, products, question view)
│   │   │
│   │   ├── stores/                # Pinia state management
│   │   │   ├── authStore.js       # Auth state (login, register, logout, JWT token, user info)
│   │   │   └── chatStore.js       # Chat history CRUD (fetch, create, select, rename, delete)
│   │   │
│   │   ├── composables/
│   │   │   └── useChat.js         # Chat composable (messages array, sendMessage, clearMessages)
│   │   │
│   │   ├── views/
│   │   │   └── QuestionView.vue   # Product-specific question view (routed via /question/:product)
│   │   │
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── auth-modal.vue         # Login/Register modal template
│   │   │   │   ├── auth-modal.js          # Auth modal logic (form state, login/register calls)
│   │   │   │   └── auth-modal.css         # Auth modal styles (form layout, inputs, buttons)
│   │   │   │
│   │   │   ├── Header/
│   │   │   │   ├── app-header.vue         # Top nav bar template
│   │   │   │   ├── app-header.js          # Header logic (user info, logout, sidebar toggle)
│   │   │   │   └── app-header.css         # Header styles (nav layout, branding, responsive)
│   │   │   │
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.vue            # Sidebar template
│   │   │   │   ├── sidebar.js             # Sidebar logic (chat list, CRUD, active chat tracking)
│   │   │   │   └── sidebar.css            # Sidebar styles (panel layout, chat items, animations)
│   │   │   │
│   │   │   ├── Chat/
│   │   │   │   ├── welcome-screen/
│   │   │   │   │   ├── welcome-screen.vue # Landing view template
│   │   │   │   │   ├── welcome-screen.js  # Welcome logic (suggested questions, product cards)
│   │   │   │   │   └── welcome-screen.css # Welcome styles (cards grid, greeting, suggestions)
│   │   │   │   │
│   │   │   │   └── chat-screen/
│   │   │   │       ├── chat-screen.vue    # Chat screen wrapper template
│   │   │   │       ├── chat-screen.js     # Chat screen logic (props, emits, scroll handling)
│   │   │   │       ├── chat-screen.css    # Chat screen styles (layout, container)
│   │   │   │       │
│   │   │   │       ├── message-list/
│   │   │   │       │   ├── message-list.vue   # Message renderer template
│   │   │   │       │   ├── message-list.js    # Message list logic (auto-scroll, typing indicator)
│   │   │   │       │   └── message-list.css   # Message styles (bubbles, alignment, animations)
│   │   │   │       │
│   │   │   │       └── chat-input/
│   │   │   │           ├── chat-input.vue     # Text input template
│   │   │   │           ├── chat-input.js      # Input logic (auto-resize, keydown, emit send)
│   │   │   │           └── chat-input.css     # Input styles (textarea, send button, disabled state)
│   │   │   │
│   │   │   └── products/
│   │   │       ├── product-list/
│   │   │       │   ├── product-list.vue       # Product listing template
│   │   │       │   ├── product-list.js        # Product list logic (fetch products, navigate)
│   │   │       │   └── product-list.css       # Product list styles (grid layout, cards)
│   │   │       │
│   │   │       └── product-detail/
│   │   │           ├── product-detail.vue     # Product detail template
│   │   │           ├── product-detail.js      # Product detail logic (route params, CTA)
│   │   │           └── product-detail.css     # Product detail styles (layout, modules list)
│   │   │
│   │   └── assets/
│   │       └── styles.css         # Global styles, chat bubbles, sidebar, animations, responsive
│   │
│   ├── index.html                 # HTML entry point
│   ├── vite.config.js             # Vite config with API proxy for dev mode
│   └── package.json
│
├── knowledge/                     # Knowledge base directory (demo-safe by default)
│   ├── order-management.md          # Order Management (OM) — creation, processing, status, integrations
│   ├── shipment-management.md       # Shipment Management (SM) — fulfilment, carriers, tracking, returns
│   ├── billing-management.md        # Billing Management (BM) — invoicing, payments, cycles, reports
│   └── inventory-management.md      # Inventory Management (IM) — stock, warehouse, replenishment
│
├── logs/                          # Auto-created at runtime
│   ├── queries.log                # All Q&A interactions with timestamps
│   └── errors.log                 # Error traces
│
├── .env                           # Environment configuration (create manually — see Quick Start)
└── package.json
```

---

## Backend Deep Dive

### Entry Point (`server.js`)

Bootstraps the application:
- Loads environment variables from `.env`
- Imports the configured Express app from `src/app.js`
- Starts the HTTP server on the configured port
- Logs startup info (port, AI provider, loaded documents count)

### App Setup (`src/app.js`)

Configures the Express application stack:
- **JSON body parsing** with size limits
- **CORS** middleware for cross-origin requests
- **Rate limiter** middleware (applied to `/api/*` routes)
- **Static file serving** for the built Vue frontend (`client/dist`)
- **API route mounting** under `/api`
- **SPA fallback** — serves `index.html` for any non-API route (client-side routing support)

### Configuration (`src/config/`)

**`index.js`** — Single source of truth for all app configuration:
- `port` — Server port (default: 7000)
- `aiProvider` — Active provider name (`groq`, `openai`, `anthropic`)
- `aiModel` — Model identifier for the active provider
- `apiKeys` — Provider API keys from environment
- `rateLimit.windowMs` — Rate limit time window
- `rateLimit.max` — Max requests per window
- `knowledgePath` — Path to knowledge documents directory

**`aiProviders.js`** — Provider registry defining:
- API endpoint URLs for each provider
- Request header formats (auth patterns differ per provider)
- Request body structure (Groq/OpenAI use `messages[]`, Anthropic uses different format)
- Response parsing logic (how to extract the answer from each provider's response shape)

### Controllers (`src/controllers/`)

**`askController.js`** — Core request handler:
1. Receives validated question from request body
2. Calls `knowledgeService.search(question)` to find relevant documents
3. Calls `aiService.ask(question, context)` to get the LLM response
4. Measures total processing duration
5. Logs the interaction via `logger`
6. Returns structured response with answer and metadata

**`healthController.js`** — Diagnostics endpoint:
- Returns server uptime
- Active AI provider and model name
- Number of loaded knowledge documents
- Server timestamp

### Services (`src/services/`)

**`knowledgeService.js`** — Document retrieval engine:

| Method | Purpose |
|--------|---------|
| `loadDocuments()` | Reads all `.md`/`.txt` files from `knowledge/` into memory on startup |
| `search(question)` | Extracts keywords → scores each document by keyword match frequency → returns top-N relevant chunks |
| `getDocumentList()` | Returns list of loaded document names (for `/api/documents`) |

Scoring algorithm:
- Extracts keywords from the question (via `keywords.js`)
- For each document, counts how many keywords appear in the content (case-insensitive)
- Ranks documents by match count descending
- Returns the top-ranked documents' content as context for the LLM

**`aiService.js`** — AI provider abstraction layer:

| Method | Purpose |
|--------|---------|
| `ask(question, context)` | Constructs the prompt, calls the configured LLM API, returns the answer |

Prompt construction:
```
System: You are an internal process knowledge assistant. Answer the user's
question based ONLY on the provided context. If the context doesn't contain
relevant information, say so. Be clear and concise.

Context:
[relevant document excerpts from knowledgeService]

User: [the actual question]
```

Provider abstraction:
- Reads provider config from `aiProviders.js`
- Formats the request body according to the provider's expected schema
- Sends HTTP request to the provider's API endpoint
- Parses the response using provider-specific response extraction logic
- Returns the plain text answer

### Middleware (`src/middleware/`)

**`rateLimiter.js`**:
- Uses an in-memory store keyed by client IP
- Tracks request timestamps within a sliding window
- Returns `429 Too Many Requests` with a `Retry-After` header when exceeded
- Window and max requests configurable via `.env`

**`validator.js`**:
- Validates `question` field exists in request body
- Checks question is a non-empty string
- Enforces maximum question length
- Trims whitespace
- Returns `400 Bad Request` with descriptive error on failure

### Utilities (`src/utils/`)

**`logger.js`**:
- Creates `logs/` directory if it doesn't exist
- `logQuery(question, answer, duration, docsSearched)` — appends to `queries.log`
- `logError(error, context)` — appends to `errors.log` with stack trace
- Each log entry includes ISO timestamp

**`keywords.js`**:
- Tokenizes question into words
- Removes common stop words (the, is, a, an, how, what, etc.)
- Filters out short tokens (< 3 characters)
- Converts to lowercase for case-insensitive matching
- Returns array of meaningful keywords

---

## Frontend Deep Dive

### Tech Stack
- **Vue 3** with Composition API
- **Vite** for dev server and production builds
- **Pinia** for state management
- **Vue Router** for client-side routing
- **Vanilla CSS** — no UI framework dependency

### State Management

**`stores/authStore.js`** — Authentication state:
- `login(email, password)` — sends credentials to `/api/auth/login`, stores JWT token
- `register(name, email, password)` — creates account via `/api/auth/register`
- `logout()` — clears token and user state
- Persists JWT token (used in API request headers)
- Tracks current user info (name, email)

**`stores/chatStore.js`** — Chat history persistence:
- `fetchChats()` — loads all chat sessions for the logged-in user from backend
- `createChat()` — creates a new chat session
- `selectChat(chatId)` — switches active chat, loads its message history
- `renameChat(chatId, title)` — updates chat title
- `deleteChat(chatId)` — removes a chat session
- All operations are persisted to MongoDB via API calls

### Composables

**`composables/useChat.js`** — Real-time chat logic:
- `messages` — reactive array of current chat messages
- `sendMessage(question)` — pushes user message, calls `/api/ask`, pushes bot response
- `clearMessages()` — resets message array (used when switching chats)
- `isLoading` — tracks whether a response is pending (drives typing indicator)
- Handles API errors gracefully — shows error message in chat bubble

### Routing (`router/index.js`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `App.vue` (with `welcome-screen`) | Landing page with product cards and suggested questions |
| `/question/:product` | `QuestionView.vue` | Product-specific question interface |
| `/products` | `product-list.vue` | Grid of all available products/modules |
| `/products/:id` | `product-detail.vue` | Individual product detail page |

### Component Breakdown

**`App.vue`** — Root component and layout shell:
- Checks auth state on mount — shows `auth-modal` if not logged in
- Renders `app-header` + `sidebar` + main content area
- Orchestrates chat flow between sidebar (chat selection) and chat screen
- Conditionally renders `welcome-screen` (no active chat) or `chat-screen` (active chat)

**`components/auth/auth-modal.vue`** — Authentication modal:
- Toggle between Login and Register forms
- Form validation (email format, password length)
- Calls `authStore.login()` or `authStore.register()`
- Dismisses on successful authentication
- Shows inline error messages on failure

**`components/Header/app-header.vue`** — Top navigation bar:
- App name/branding
- User info display (name/email of logged-in user)
- Logout button — calls `authStore.logout()`
- Hamburger menu toggle for sidebar on mobile

**`components/sidebar/sidebar.vue`** — Left sidebar panel:
- "New Chat" button — creates a new chat session via `chatStore.createChat()`
- Lists all chat sessions for the current user (fetched from `chatStore`)
- Click a chat to switch to it (`chatStore.selectChat()`)
- Inline rename — double-click chat title to edit
- Delete chat — with confirmation
- Highlights the currently active chat
- Collapsible on mobile

**`components/Chat/welcome-screen/welcome-screen.vue`** — Landing state:
- Greeting message explaining what the bot can do
- Product cards — clickable tiles for each covered product/module
- Suggested starter questions (clickable — auto-sends the question)
- Shown when no chat is active or chat has no messages

**`components/Chat/chat-screen/chat-screen.vue`** + **`chat-screen.js`** — Chat screen:
- Layout wrapper for the message list and input area
- `chat-screen.js` contains the extracted `<script setup>` logic:
  - Props: receives current chat ID, messages, loading state
  - Emits: `send` event when user submits a question
  - Auto-scroll handling — scrolls to bottom on new messages
  - Refs for DOM elements (message container, input)

**`components/Chat/chat-screen/message-list/message-list.vue`** — Message renderer:
- Renders user messages (right-aligned, styled differently) and bot messages (left-aligned)
- Shows typing indicator (animated dots) while `isLoading` is true
- Auto-scrolls to the latest message using `scrollIntoView`
- Formats bot responses preserving line breaks, code blocks, and whitespace
- Displays timestamps on each message

**`components/Chat/chat-screen/chat-input/chat-input.vue`** — Input area:
- Auto-resizing `<textarea>` that grows with content
- Send button (disabled while loading or input is empty)
- `Enter` to send, `Shift+Enter` for new line
- Emits `send` event with the trimmed question text
- Clears input after sending
- Focuses input automatically when chat loads

**`components/products/product-list/product-list.vue`** — Product listing:
- Displays a grid of all available products/modules the bot covers
- Each card shows product name, description, and module count
- Click navigates to `product-detail` for that product
- Used for browsing what knowledge domains are available

**`components/products/product-detail/product-detail.vue`** — Product detail:
- Shows detailed info about a specific product/module
- Lists sub-modules or topics covered
- "Ask a Question" CTA — navigates to `QuestionView` scoped to that product
- Back button to return to product list

### Views

**`views/QuestionView.vue`** — Product-scoped question interface:
- Receives `:product` param from route
- Renders a chat interface pre-scoped to a specific product
- Questions are automatically tagged with the product context
- Uses `useChat` composable for message handling

### Vite Configuration (`vite.config.js`)

- **Dev server** — Runs on **http://localhost:7025**
- **Dev proxy** — Proxies `/api/*` requests to `http://localhost:7000` (Express backend). Both ports must match your `.env` and `vite.config.js`
- **Build output** — Compiles to `client/dist/` which can be served by Express in production

---

## API Reference

### `POST /api/ask`

Ask a question against the knowledge base.

**Request:**
```json
{
  "question": "What happens when an order is created in the system?"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "answer": "When an order is created, the system first validates the customer configuration, then routes the order through the dispatch automation pipeline...",
  "meta": {
    "durationMs": 1847,
    "documentsSearched": 3
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Question is required and must be a non-empty string"
}
```

**Rate Limited (429):**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "retryAfter": 30
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Failed to process your question. Please try again."
}
```

---

### `GET /api/health`

Server health check and diagnostics.

**Response (200):**
```json
{
  "status": "ok",
  "uptime": 3600,
  "provider": "groq",
  "model": "llama-3.1-8b-instant",
  "documentsLoaded": 5,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### `GET /api/documents`

List all loaded knowledge documents.

**Response (200):**
```json
{
  "success": true,
  "documents": [
    "order-management.md",
    "shipment-management.md",
    "billing-management.md",
    "inventory-management.md"
  ],
  "count": 4
}
```

---

### `POST /api/auth/register`

Create a new user account.

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": { "name": "Jane Doe", "email": "jane@example.com", "role": "user" },
  "token": "<jwt>"
}
```

---

### `POST /api/auth/login`

Authenticate and receive a JWT.

**Request:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { "name": "Jane Doe", "email": "jane@example.com", "role": "user" },
  "token": "<jwt>"
}
```

---

### `GET /api/auth/me`

Get the current user (requires `Authorization: Bearer <token>` header).

---

### `GET/POST/DELETE /api/chats/*`

Chat history endpoints — all require JWT authentication. See `src/routes/chatRoutes.js` for full list.

---

## AI Provider System

The bot supports three AI providers through a unified abstraction layer. Switching providers requires only changing environment variables — no code changes.

### Supported Providers

| Provider | Default Model | Best For | Speed |
|----------|---------------|----------|-------|
| **Groq** | `llama-3.1-8b-instant` | Fast inference, free tier available | ⚡ Fastest |
| **OpenAI** | `gpt-3.5-turbo` | Balanced quality and cost | 🟡 Medium |
| **Anthropic** | `claude-3-haiku-20240307` | Strong reasoning, safety | 🟡 Medium |

### How Provider Abstraction Works

```
aiProviders.js defines:
  ├── groq:     { endpoint, headers, buildBody(), parseResponse() }
  ├── openai:   { endpoint, headers, buildBody(), parseResponse() }
  └── anthropic: { endpoint, headers, buildBody(), parseResponse() }

aiService.js at runtime:
  1. Reads AI_PROVIDER from config
  2. Looks up provider definition from aiProviders.js
  3. Uses that provider's buildBody() to format the request
  4. Sends to that provider's endpoint with correct headers
  5. Uses that provider's parseResponse() to extract the answer
```

### Switching Providers

Edit `.env`:

```env
# Groq (default — fastest, free tier)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_key
AI_MODEL=llama-3.1-8b-instant

# OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
AI_MODEL=gpt-3.5-turbo

# Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_key
AI_MODEL=claude-3-haiku-20240307
```

Restart the server after changing providers.

---

## Knowledge Base System

### How It Works

1. **On startup**, the server reads every `.md` and `.txt` file from the `knowledge/` directory
2. Each file is stored in memory as `{ title: filename, content: fileContents }`
3. **On each question**, the keyword search engine:
   - Extracts meaningful keywords from the question (removing stop words)
   - Scans each document's content for keyword matches
   - Scores documents by match frequency
   - Returns the top-ranked documents as context
4. The context is injected into the LLM prompt so the answer is **grounded in your actual docs**

### Adding Knowledge

The repository ships with **demo-safe generic documentation** aligned to the four products in the UI:

```bash
knowledge/
├── order-management.md         # OM: creation, processing, status, integrations, reports
├── shipment-management.md      # SM: fulfilment, carriers, tracking, returns
├── billing-management.md       # BM: invoicing, payments, billing cycles, financial reports
├── inventory-management.md     # IM: stock, warehouse ops, replenishment
```

Each file maps to modules and starter questions in `client/src/data/productsData.js`, so the Q&A bot can answer sample questions out of the box.

**For your own deployment:** replace these files with real internal docs. Keep filenames descriptive — they appear in logs and search metadata.

**Best practices for knowledge files:**
- Use descriptive filenames (they're used as document titles in logs)
- Use clear headings and bullet points — helps keyword matching
- One product/domain per file (or split large domains into focused files)
- Include the terminology your team actually uses when asking questions
- Restart the server after adding/modifying knowledge files
- Do **not** commit confidential documentation to public repos

---

## Middleware & Security

### Rate Limiting

Prevents abuse and controls API usage:

```
Client IP → Rate Limiter → [Allow / 429 Reject]
```

- **Window-based** — tracks requests per IP within a sliding time window
- **Configurable** via `.env`:
  ```env
  RATE_LIMIT_WINDOW_MS=60000    # 1 minute window
  RATE_LIMIT_MAX=20             # Max 20 requests per window
  ```
- Returns `429 Too Many Requests` with `Retry-After` header
- In-memory store (resets on server restart)

### Input Validation

Every question goes through validation before processing:

| Check | Rule | Error |
|-------|------|-------|
| Presence | `question` field must exist | 400: "Question is required" |
| Type | Must be a string | 400: "Question must be a string" |
| Length | Must be non-empty after trimming | 400: "Question cannot be empty" |
| Max length | Cannot exceed configured max | 400: "Question too long" |

### Error Handling

- All controller methods are wrapped in try/catch
- Errors are logged to `errors.log` with full stack traces
- User-facing error responses never expose internal details
- AI provider failures return a generic "Failed to process" message

---

## Logging & Observability

### Query Log (`logs/queries.log`)

Every Q&A interaction is logged:

```
[2025-01-15T10:30:00.000Z] QUERY
  Question: What happens when an order is dispatched?
  Answer: When an order is dispatched, the system...
  Duration: 1847ms
  Documents Searched: 3
  ---
```

### Error Log (`logs/errors.log`)

All errors with context:

```
[2025-01-15T10:31:00.000Z] ERROR
  Context: askController.handleQuestion
  Message: GROQ API returned 429
  Stack: Error: GROQ API returned 429
    at aiService.ask (src/services/aiService.js:45:11)
    ...
  ---
```

### Health Monitoring

`GET /api/health` provides real-time diagnostics:
- Server uptime
- Active AI provider and model
- Number of loaded knowledge documents
- Useful for monitoring dashboards and alerts

---

## Quick Start (Clone & Run)

### Prerequisites

- **Node.js** v18+
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster
- An API key for at least one AI provider (Groq recommended — free tier at [console.groq.com](https://console.groq.com))

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/koshendra-ai-process-bot.git
cd koshendra-ai-process-bot
```

### 2. Install dependencies

```bash
# Backend (project root)
npm install

# Frontend
cd client && npm install && cd ..
```

### 3. Create `.env` in the project root

Create a `.env` file (this file is gitignored — never commit secrets):

```env
# Server
PORT=7000
NODE_ENV=development

# MongoDB (required for auth & chat history)
MONGODB_URI=mongodb://localhost:27017/koshendra
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/koshendra

# Auth
JWT_SECRET=change-this-to-a-long-random-string

# AI Provider
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
AI_MODEL=llama-3.1-8b-instant

# Optional
# ALLOWED_ORIGINS=http://localhost:7025,http://localhost:5173
# RATE_LIMIT_WINDOW_MS=60000
# RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Run in development (recommended)

Use **two terminals**:

```bash
# Terminal 1 — Backend API (port 7000)
npm run dev

# Terminal 2 — Vue frontend with hot reload (port 7025)
cd client && npm run start
```

Open **http://localhost:7025**

1. Register or sign in via the auth modal
2. Browse products/modules in the sidebar or welcome screen
3. Ask questions — answers are grounded in the demo knowledge files

> **Auth not working?** Ensure the backend is on port **7000** and `client/vite.config.js` proxy target is also `http://localhost:7000`. Restart the Vite dev server after any config change.

### 5. Production build (optional)

```bash
cd client && npm run build && cd ..
npm run dev   # or: node server.js
```

Serve the built frontend from `client/dist/` via your hosting setup, with the API on the same or proxied origin.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED` on login/register | Backend not running, or Vite proxy port mismatch (must be 7000) |
| MongoDB connection error | Check `MONGODB_URI` and network access (Atlas IP whitelist) |
| "I don't have information about that" | Question keywords may not match knowledge docs; try module starter questions |
| Rate limit (429) | Wait for retry or increase `RATE_LIMIT_MAX_REQUESTS` in `.env` |

---

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `7000` | Backend server port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_URI` | `mongodb://localhost:27017/ai-process-bot` | MongoDB connection string (required) |
| `JWT_SECRET` | *(fallback in code — set in production)* | Secret for signing JWT auth tokens |
| `AI_PROVIDER` | `groq` | AI provider (`groq`, `openai`, `anthropic`) |
| `AI_MODEL` | `llama-3.1-8b-instant` | Model identifier for the active provider |
| `GROQ_API_KEY` | — | Groq API key |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `ALLOWED_ORIGINS` | *(local defaults only)* | Comma-separated origins; supports wildcards e.g. `https://*.vercel.app` |
| `FRONTEND_URL` | — | Single frontend URL (alternative to `ALLOWED_ORIGINS`) |
| `ALLOW_VERCEL` | — | Set to `true` to allow all `https://*.vercel.app` origins |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per rate limit window |

---

## Development Mode

| Service | Command | URL |
|---------|---------|-----|
| Backend | `npm run dev` (root) | http://localhost:7000 |
| Frontend | `cd client && npm run start` | http://localhost:7025 |
| Health check | — | http://localhost:7000/api/health |
| API docs (manual) | — | See [API Reference](#api-reference) |

Vite proxies `/api/*` from port **7025** → **7000**. The frontend `axios` client uses `baseURL: '/api'`, so no hardcoded API URL is needed in dev.

**Useful npm scripts:**

```bash
npm run dev          # Start backend
npm run dev:server   # Backend with nodemon (auto-restart)
npm run dev:client   # Start Vite frontend
npm run build        # Install + build client
```

---

## Deployment (Render + Vercel)

**Short answer: you do not need port 7001 on Vercel or Render.**

| Environment | Port | Who sets it |
|-------------|------|-------------|
| **Local dev** | Backend `7000`, frontend `7025` | You (optional `PORT=7000` in `.env`) |
| **Render** | Dynamic (e.g. `10000`) | Render injects `process.env.PORT` automatically |
| **Vercel (frontend)** | No port | Static hosting — no Node server listening |

The backend already uses `process.env.PORT || 7000`, so on Render it listens on whatever port Render assigns. **Do not hardcode `PORT=7001` on Render** — it can break health checks.

### Recommended setup

```
┌─────────────────────┐         HTTPS          ┌──────────────────────────┐
│  Vercel (frontend)  │  ──────────────────▶   │  Render (Express API)    │
│  Vue static build   │   VITE_API_URL=/api      │  server.js + MongoDB     │
└─────────────────────┘                          └──────────────────────────┘
```

Deploy the **API on Render** and the **Vue app on Vercel**. They are two separate services.

---

### 1. Backend on Render

1. Create a **Web Service** on [Render](https://render.com) and connect your Git repo
2. Configure:

| Setting | Value |
|---------|-------|
| **Root directory** | `.` (repo root) |
| **Build command** | `npm install` |
| **Start command** | `npm start` |
| **Health check path** | `/health` |

3. Add **Environment variables** in Render dashboard:

```env
GROQ_API_KEY=your_key
MONGODB_URI=mongodb+srv://...
JWT_SECRET=long-random-secret
AI_PROVIDER=groq
NODE_ENV=production

# Option A — exact Vercel URL (no trailing slash)
FRONTEND_URL=https://your-app.vercel.app

# Option B — comma-separated list (supports wildcards for preview deploys)
ALLOWED_ORIGINS=https://your-app.vercel.app,https://*.vercel.app

# Option C — allow all Vercel app subdomains (easiest for Vercel)
ALLOW_VERCEL=true
FRONTEND_URL=https://your-app.vercel.app
```

> Do **not** set `PORT` — Render sets it for you.

4. After deploy, note your API URL, e.g. `https://koshendra-api.onrender.com`

---

### 2. Frontend on Vercel

1. Import the repo on [Vercel](https://vercel.com)
2. Configure:

| Setting | Value |
|---------|-------|
| **Root directory** | `client` |
| **Framework preset** | Vite |
| **Build command** | `npm run build` |
| **Output directory** | `dist` |

3. Add **Environment variable** (required — frontend and API are on different domains):

```env
VITE_API_URL=https://koshendra-api.onrender.com/api
```

Replace with your actual Render URL. Rebuild/redeploy after changing this variable.

4. Deploy — your app will be at `https://your-app.vercel.app`

5. Update Render `ALLOWED_ORIGINS` to include your Vercel URL (see step 1 above)

---

### Local vs production — port cheat sheet

```
LOCAL (two terminals):
  Backend:  http://localhost:7000     ← npm run dev
  Frontend: http://localhost:7025     ← cd client && npm run start
  Vite proxy: 7025/api → 7000         ← only for local dev

PRODUCTION:
  Frontend: https://xxx.vercel.app
  API:      https://xxx.onrender.com/api   ← set as VITE_API_URL
  Port 7000 / 7001: not used publicly
```

### Common deployment mistakes

| Mistake | Fix |
|---------|-----|
| Setting `PORT=7001` on Render | Remove it — let Render assign `PORT` |
| Auth works locally but not on Vercel | Set `VITE_API_URL` to Render URL + `/api` |
| CORS error in browser | Set `FRONTEND_URL` or `ALLOWED_ORIGINS` on Render; use `ALLOW_VERCEL=true` for Vercel preview URLs. Check Render logs for `[CORS] Blocked origin:` |
| Vite proxy `7001` in local dev | Proxy must match local backend (`7000`), not production |

---

## Roadmap & Improvements

Areas where the project can be strengthened next:

| Area | Improvement |
|------|-------------|
| **Retrieval quality** | Replace keyword search with vector embeddings (e.g. OpenAI embeddings + cosine similarity) for better semantic matching |
| **Dev experience** | Add `.env.example`, single `npm run dev:all` script (concurrently) to start backend + frontend together |
| **Auth UX** | Password reset, email verification, OAuth (Google/Microsoft SSO) for enterprise teams |
| **Chat features** | Implement rename chat API (UI stub exists), streaming LLM responses, markdown/code rendering in messages |
| **Knowledge admin** | Upload/edit knowledge files from an admin UI instead of manual file drops + server restart |
| **Testing** | Unit tests for `knowledgeService` scoring, integration tests for auth and `/api/ask` |
| **Deployment** | Docker Compose (API + MongoDB), CI pipeline, environment-specific configs |
| **Security** | Refresh tokens, stricter rate limits on auth routes, input sanitization audit |
| **Observability** | Structured JSON logs, request tracing, dashboard for query analytics |

---

## Potential New Features

Ideas that would increase innovation, impact, and product quality:

1. **Semantic search + citations** — Show which knowledge sections were used, with clickable source excerpts in the chat bubble
2. **Module-scoped RAG** — When user picks "Order Creation" module, restrict search to OM docs and inject module context into the prompt
3. **Multi-language support** — Detect question language and answer in the same language
4. **Process flow diagrams** — Auto-generate Mermaid flowcharts from knowledge docs for visual learners
5. **Slack / Teams bot** — Same RAG engine as a workplace integration for questions without opening the web app
6. **Feedback loop** — Thumbs up/down on answers; log gaps when users mark "not helpful" to improve docs
7. **Role-based knowledge** — Different doc visibility for ops vs finance vs warehouse roles
8. **Document upload pipeline** — Ingest PDF/Word exports, chunk automatically, refresh index on schedule
9. **Comparison mode** — "What's the difference between order cancellation and shipment return?" across domains
10. **Analytics dashboard** — Top unanswered questions, busiest modules, average response time, doc coverage heatmap

---

## License

MIT
