# Wealth Ledger: Autonomous Agentic Expense Tracker

A full-stack, Autonomous Financial Agent that intercepts natural language inputs, extracts structured financial data, executes deterministic database operations via tool-calling, and streams conversational updates back to a React PWA in real time.

Built **without** heavy AI orchestration wrappers (like LangChain) to maintain absolute control over memory management, protocol layers, and network latency.

---

## ⚡ Key Architectural Highlights

* **Custom Server-Sent Events (SSE) Streaming Engine:** Bypasses standard blocking HTTP loops to pipe live token streams from the cloud inference layer down to the client layout, character-by-character.
* **Stateful Tool-Calling Loop:** Implements an alternating multi-step message loop with MongoDB. Captures conversational queries, generates transient assistant `tool_calls` instructions, executes local Mongoose database tasks, injects structural results back to the context window, and streams final synthesized explanations.
* **Deterministic Categorization Rules:** Guided by strict system instructions to map semantic concepts (e.g., "Wheat", "Milk") to existing category ObjectIDs in MongoDB to completely eliminate duplicate categorization anomalies.
* **Authenticated Streaming Service Layer:** Native browser `EventSource` webhooks forbid custom HTTP headers. This architecture extends standard `fetch` using the **Streams API (`ReadableStream`)** and `TextDecoder` to handle robust JWT authorization headers during data stream delivery.
* **Immutability-Driven React State Updates:** Avoids common UI freezing and token-stutter bugs by enforcing deep copies during chunk aggregation, allowing smooth 60fps rendering on low-power mobile devices.

---

## 🛠️ The Production Tech Stack

* **Frontend:** React.js, Progressive Web App (PWA) Configuration, Web Streams API
* **Backend:** Node.js, Express.js, Groq Cloud SDK, Server-Sent Events Protocol
* **Database:** MongoDB Atlas, Mongoose ODM
* **Models:** `llama-3.3-70b-versatile` / `openai/gpt-oss-20b`

---

## 📂 Repository Structure

```text
personal-assistant-AI/
│
├── backend/            # Express Server, Groq SDK Orchestration, Mongoose Models
│   ├── models/         # Expense, Category, and stateful Message schemas
│   ├── controllers/    # Central router /talk handling state orchestration
│   ├── package.json
│   └── .env.example
│
├── frontend/           # React Mobile PWA Core
│   ├── src/
│   │   ├── components/ # AgenticDashboard chat UI, real-time status banners
│   │   └── services/   # MainServices wrapper handling ReadableStream decoding
│   ├── package.json
│   └── .env.example
│
└── README.md           # Project Documentation Storefront


[User Input] ──► PWA Interface (Sends Authenticated POST request via Streams API)
                     │
                     ▼
[Express Server] ──► Checks User Identity ──► Fetches Chronological Message History from DB
                     │
                     ▼
[Groq Inference] ──► Evaluates user intent against dynamic financial Category Blueprints
                     │
         ┌───────────┴───────────┐
         ▼ (Intent Matches Tool)  ▼ (Basic Conversational Prompt)
   [Emits tool_calls Object]    [Streams Plain Text Tokens]
         │                               │
         ▼                               ▼
   [Executes Local Code]        [Appends to React UI State]
   (e.g. logExpense into DB)             │
         │                               │
         ▼                               │
   [Injects Execution Outcome]           │
         │                               │
         ▼                               │
   [Generates Final Summary]             │
         │                               │
         └───────────────┬───────────────┘
                         ▼
             [Commits complete transaction log to MongoDB]