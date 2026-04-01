# Regulatory Intelligence Compliance Agent

AI-powered system that monitors regulatory changes, maps them to internal compliance controls, and generates prioritized remediation action plans.

## 🚀 Quick Start

### 1. Clone & Setup

```bash
cd regulatory-intelligence-agent
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your AWS credentials (already pre-filled in .env.example)
```

### 3. Upload Knowledge Base Documents

Upload the policy documents in `knowledge_base/controls/` to your S3 bucket:

```bash
aws s3 sync knowledge_base/controls/ s3://regulatory-compliance-kb-docs/controls/
```

Then sync the Bedrock Knowledge Base data source from the AWS Console.

### 4. Start the API Server

```bash
python -m backend.main
```

The API will be available at `http://127.0.0.1:8000`.

### 5. Trigger the Pipeline

```bash
# Synchronous (waits for completion)
curl -X POST http://127.0.0.1:8000/api/pipeline/run?max_items=3

# Asynchronous (returns immediately)
curl -X POST http://127.0.0.1:8000/api/pipeline/run-async?max_items=5
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/pipeline/run` | Run pipeline (sync) |
| `POST` | `/api/pipeline/run-async` | Run pipeline (background) |
| `GET` | `/api/pipeline/status` | Pipeline run status |
| `GET` | `/api/items` | List regulatory items |
| `GET` | `/api/items/{id}` | Get single item |
| `PATCH` | `/api/items/{id}/status` | Update item status |
| `GET` | `/api/stats` | Dashboard statistics |
| `POST` | `/api/chat` | Ask compliance questions (RAG) |

### Query Parameters for `/api/items`

- `status` — Filter: `new`, `in_review`, `actioned`, `closed`
- `jurisdiction` — Filter: `India`, `EU`, `USA`, `Global`
- `urgency` — Filter: `critical`, `high`, `medium`, `low`
- `limit` — Results per page (default: 50)
- `offset` — Pagination offset

### Chat Example

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is our data retention policy for KYC records?"}'
```

## 🏗️ Architecture

### Three-Agent Pipeline (CrewAI)

1. **Regulatory Analyst** — Scrapes and analyzes regulatory updates, scores urgency/relevance, generates prediction signals
2. **Compliance Mapper** — Queries Bedrock Knowledge Base to map obligations to internal controls and identify gaps
3. **Remediation Planner** — Generates 3-7 prioritized action items with owners, deadlines, and evidence requirements

### Data Sources

- RBI Notifications (RSS)
- SEC EDGAR Filings (Atom)
- EUR-Lex Legislation (RSS)
- SEBI News (Web scrape)
- MCA India Updates (Web scrape)

### AWS Stack

- **Amazon Bedrock** — LLM (Nova Pro v1) + Knowledge Bases
- **S3** — Compliance policy document storage
- **OpenSearch Serverless** — Vector store for semantic search

## 📁 Project Structure

```
regulatory-intelligence-agent/
├── backend/
│   ├── agents/          # CrewAI agent definitions
│   ├── tasks/           # Task prompts for each agent
│   ├── services/        # Scraper, Bedrock, KB, Chat
│   ├── api/             # FastAPI routes
│   ├── models/          # Pydantic schemas
│   ├── utils/           # Helper functions
│   ├── crew.py          # Pipeline orchestrator
│   ├── config.py        # Environment configuration
│   ├── database.py      # SQLite persistence
│   └── main.py          # Application entry point
├── knowledge_base/
│   └── controls/        # Internal policy docs (→ S3 → Bedrock KB)
├── data/
│   ├── raw/             # Raw scraped data
│   └── processed/       # Processed outputs
├── docs/                # Architecture documentation
└── infra/               # IAM policy templates
```

## 👥 Team

- **Person 1** (Backend) — This codebase
- **Person 2** (Frontend) — Consumes the `/api/*` endpoints

## 📄 License

Hackathon project — internal use only.
