# MasmSpace AI Backend

FastAPI server that provides AI-powered meeting summarisation for the MasmSpace collaborative whiteboard.

## Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115 + Uvicorn |
| AI Model | Qwen/Qwen2.5-72B-Instruct (via Hugging Face Serverless Inference) |
| HTTP Client | httpx (async) |
| Validation | Pydantic v2 |

## Quick Start

```bash
# 1. Create & activate a virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env     # Windows
# cp .env.example .env     # macOS/Linux
# → Edit .env and set your HF_TOKEN

# 4. Start the server
python main.py
# or: uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

## Getting a Hugging Face Token

1. Go to https://huggingface.co/settings/tokens
2. Click **New token** → Name it "masmspace-ai" → Role: **Read**
3. Copy the token and paste it as `HF_TOKEN` in your `.env` file

The free tier of the Serverless Inference API supports Qwen2.5-72B-Instruct.  
First request may take 20-30s while the model warms up.

## Endpoints

### `POST /api/summarize`

Accepts tldraw canvas state and returns structured AI analysis.

**Request body:**
```json
{
  "canvas_text": "Sprint planning\nMilestone: v2.0 by Oct 15\nOwner: @alice",
  "shapes": [
    { "id": "shape:1", "type": "text", "props": { "text": "Ship feature X" } }
  ],
  "board_title": "Q4 Planning",
  "context": "Weekly engineering sync"
}
```

**Response:**
```json
{
  "summary": "The team conducted a Q4 planning session...",
  "key_points": ["Feature X targeted for v2.0 release", "..."],
  "action_items": [
    { "task": "Ship feature X", "owner": "alice", "due": "Oct 15", "priority": "high" }
  ],
  "decisions": ["v2.0 milestone set for Oct 15"],
  "next_steps": ["Schedule feature X review"],
  "mood": "planning",
  "model_used": "Qwen/Qwen2.5-72B-Instruct",
  "processing_time_ms": 4230
}
```

### `GET /health`

Returns `{"status": "ok", "hf_token_configured": true}`.

## Alternative Models

Change `HF_MODEL` in `.env` to use a different model:

| Model | Notes |
|---|---|
| `Qwen/Qwen2.5-72B-Instruct` | **Default** — best instruction following |
| `meta-llama/Llama-3.3-70B-Instruct` | Meta Llama 3.3 70B |
| `mistralai/Mistral-7B-Instruct-v0.3` | Faster, lighter |
| `microsoft/Phi-3.5-mini-instruct` | Very fast, smaller model |
