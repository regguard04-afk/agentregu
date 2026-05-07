# Regulatory Intelligence Compliance Agent

AI-powered system that monitors regulatory changes, maps them to internal compliance controls, and generates prioritized remediation action plans.

## 🤖 Built with CrewAI Multi-Agent Framework

This project uses the **[CrewAI](https://github.com/crewAIInc/crewAI)** framework for multi-agent orchestration. The entire agent pipeline is powered by real CrewAI components:

| CrewAI Component | Where It's Used | File |
|------------------|-----------------|------|
| `crewai.Agent` | 3 specialized agents (Analyst, Mapper, Planner) | `backend/agents/*.py` |
| `crewai.Task` | Structured task definitions with context chaining | `backend/tasks/*.py` |
| `crewai.Crew` | Multi-agent crew orchestration | `backend/crew.py` |
| `crewai.Process.sequential` | Sequential pipeline execution | `backend/crew.py` |
| `crewai.LLM` | AWS Bedrock integration (via litellm) | `backend/crew.py` |
| `crewai.tools.BaseTool` | Custom KB retrieval & scraper tools | `backend/tools/*.py` |

### Key CrewAI Imports (for judge reference)

```python
# backend/crew.py — Main orchestration
from crewai import Agent, Crew, LLM, Process, Task

# backend/agents/*.py — Agent definitions
from crewai import Agent, LLM

# backend/tasks/*.py — Task definitions
from crewai import Agent, Task

# backend/tools/*.py — Custom tools
from crewai.tools import BaseTool
```

## 🚀 Quick Start

### 1. Clone & Setup

```bash
cd regulatory-intelligence-agent
pip install -r requirements.txt
```

> **Note:** Requires Python ≥3.10 and <3.14. CrewAI is installed as a dependency.

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
| `POST` | `/api/pipeline/run` | Run CrewAI pipeline (sync) |
| `POST` | `/api/pipeline/run-async` | Run CrewAI pipeline (background) |
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

### CrewAI Three-Agent Pipeline

The pipeline uses **CrewAI's `Process.sequential`** execution mode, where each agent's output feeds into the next task via CrewAI's context chaining:

```
┌─────────────────────────────────────────────────────────┐
│                  CrewAI Crew (Sequential)                │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │  Agent 1:     │──▶│  Agent 2:     │──▶│  Agent 3:   │ │
│  │  Regulatory   │   │  Compliance   │   │  Remediation│ │
│  │  Analyst      │   │  Mapper       │   │  Planner    │ │
│  │              │   │              │   │             │ │
│  │  crewai.Agent│   │  crewai.Agent│   │ crewai.Agent│ │
│  └──────────────┘   └──────┬───────┘   └─────────────┘ │
│                            │                            │
│                    ┌───────▼────────┐                    │
│                    │  KBRetrievalTool│                    │
│                    │  (BaseTool)    │                    │
│                    └───────┬────────┘                    │
│                            │                            │
│                    ┌───────▼────────┐                    │
│                    │ Amazon Bedrock │                    │
│                    │ Knowledge Base │                    │
│                    └────────────────┘                    │
└─────────────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ crewai.LLM  │
                    │ (Bedrock)   │
                    └─────────────┘
```

1. **Regulatory Analyst Agent** (`crewai.Agent`) — Scrapes and analyzes regulatory updates, scores urgency/relevance, generates prediction signals
2. **Compliance Mapper Agent** (`crewai.Agent` + `BaseTool`) — Uses KBRetrievalTool to query Bedrock Knowledge Base, maps obligations to internal controls, identifies gaps
3. **Remediation Planner Agent** (`crewai.Agent`) — Generates 3-7 prioritized action items with owners, deadlines, and evidence requirements

### CrewAI Execution Flow

```python
# From backend/crew.py — this is how we run the pipeline

crew = Crew(
    agents=[analyst_agent, mapper_agent, planner_agent],
    tasks=[analyst_task, mapper_task, planner_task],
    process=Process.sequential,
    verbose=True,
)
result = crew.kickoff()
```

### Data Sources

- RBI Notifications (RSS)
- SEBI News (RSS + Web scrape)
- SEC Press Releases (RSS)
- FCA News (RSS)
- FATF Guidance (RSS)

### AWS Stack

- **Amazon Bedrock** — LLM (Nova Pro v1) via `crewai.LLM`
- **S3** — Compliance policy document storage
- **OpenSearch Serverless** — Vector store for semantic search

## 📁 Project Structure

```
regulatory-intelligence-agent/
├── backend/
│   ├── agents/          # CrewAI Agent definitions (crewai.Agent)
│   │   ├── regulatory_analyst.py   # from crewai import Agent, LLM
│   │   ├── compliance_mapper.py    # from crewai import Agent, LLM
│   │   └── remediation_planner.py  # from crewai import Agent, LLM
│   ├── tasks/           # CrewAI Task definitions (crewai.Task)
│   │   ├── analyst_tasks.py    # from crewai import Task
│   │   ├── mapper_tasks.py     # from crewai import Task (context chaining)
│   │   └── planner_tasks.py    # from crewai import Task (context chaining)
│   ├── tools/           # Custom CrewAI Tools (crewai.tools.BaseTool)
│   │   ├── kb_retrieval_tool.py    # KBRetrievalTool(BaseTool)
│   │   └── scraper_tool.py         # RegulatoryScraperTool(BaseTool)
│   ├── services/        # Scraper, Bedrock, KB, Chat
│   ├── api/             # FastAPI routes
│   ├── models/          # Pydantic schemas
│   ├── utils/           # Helper functions
│   ├── crew.py          # CrewAI Crew orchestrator (Crew, Process.sequential)
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


## 📄 License

Hackathon project — internal use only.
