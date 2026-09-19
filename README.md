# MasmSpace — Collaborative Whiteboard with AI Workspace 🚀

MasmSpace is a next-generation real-time collaborative whiteboard platform featuring infinite canvas drawing (tldraw & React Flow), AI-assisted meeting summarization, RAG canvas search, and voice control.

---

## 📁 Project Structure

> ⚠️ **Note on Directory Layout**: The **Frontend** is located in the **root directory** of this repository. The **AI Backend** lives in the `ai-backend/` subfolder.

```text
WHITEBOARD PRATHOMIX SOLUTION/
├── src/                  # Next.js App Router frontend source code
├── public/               # Static assets
├── ai-backend/           # Python FastAPI AI Backend (Summarization & RAG)
│   ├── main.py           # FastAPI entrypoint
│   ├── rag_router.py     # Canvas vector search & RAG
│   ├── embeddings.py     # Hugging Face embeddings
│   ├── requirements.txt  # Python backend dependencies
│   └── .env.example      # Backend environment variables
├── .env.local.example    # Frontend environment template
├── package.json          # Frontend dependencies & scripts
└── README.md             # Project documentation
```

---

## ⚡ Quick Start Overview

To run the complete application, you will need **two terminal tabs**:
1. **Terminal 1**: Runs the Next.js Frontend (`http://localhost:3000`)
2. **Terminal 2**: Runs the FastAPI AI Backend (`http://localhost:8000`)

---

## 1️⃣ Frontend Setup (Next.js)

The frontend is located directly in the root directory.

### Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm**, **pnpm**, or **yarn**

### Steps:

1. **Stay in the root directory** (do not run `cd frontend`):
   ```bash
   # You are already in the project root
   npm install
   ```

2. **Set up Environment Variables**:
   Copy the example environment file:
   - **Windows (PowerShell / CMD)**:
     ```powershell
     copy .env.local.example .env.local
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.local.example .env.local
     ```

   Open `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:8000
   ```

3. **Start the Frontend Development Server**:
   ```bash
   npm run dev
   ```

   The frontend will be running at [http://localhost:3000](http://localhost:3000).

---

## 2️⃣ Backend Setup (FastAPI & AI Services)

The backend provides AI summarization (via Hugging Face Qwen/Llama models) and canvas RAG embeddings.

### Prerequisites
- **Python**: 3.10 or higher
- **Hugging Face Token**: [Get one here](https://huggingface.co/settings/tokens) (Free tier supported)

### Steps:

1. **Navigate to the `ai-backend` directory**:
   ```bash
   cd ai-backend
   ```

2. **Create and Activate a Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     # If you get a script execution policy error, run:
     # Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
     ```
   - **Windows (CMD)**:
     ```cmd
     python -m venv .venv
     .venv\Scripts\activate.bat
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Backend Environment Variables**:
   - **Windows**:
     ```powershell
     copy .env.example .env
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```

   Open `.env` inside `ai-backend/` and set:
   ```env
   # Required: Hugging Face access token
   HF_TOKEN=hf_your_token_here

   # Required: Supabase credentials
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

   # Optional (Defaults to http://localhost:3000)
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the Backend Server**:
   ```bash
   python main.py
   ```
   *Alternatively, using uvicorn directly:*
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   - **API Base URL**: [http://localhost:8000](http://localhost:8000)
   - **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
   - **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 14 (App Router) + React 18 |
| **Whiteboard Engines** | @tldraw/tldraw & @xyflow/react |
| **Styling** | Tailwind CSS + Framer Motion + Lucide React |
| **Database & Auth** | Supabase (PostgreSQL, Vector pgvector, Realtime) |
| **AI Backend** | Python FastAPI + Uvicorn + Pydantic v2 |
| **AI Inference** | Hugging Face Serverless API (Qwen 2.5 72B / Llama 3.3) |
| **Embeddings & RAG** | sentence-transformers (`all-mpnet-base-v2`) |

---

## 💡 Troubleshooting

- **Error: `Cannot find path '.../frontend' because it does not exist`**  
  The frontend is directly in the project root directory. Do not run `cd frontend`. Run `npm run dev` directly from the main project folder.
- **AI Summary taking 20-30 seconds on first request**  
  The Hugging Face Serverless Inference API may take a few seconds to warm up cold models. Subsequent requests are fast.
- **CORS Issues**  
  Ensure `NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:8000` in `.env.local` and `FRONTEND_URL=http://localhost:3000` in `ai-backend/.env`.
