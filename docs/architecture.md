# Architecture — Regulatory Intelligence Compliance Agent

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                           │
│                    Person 2's responsibility                         │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ REST API (JSON)
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND                                  │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────────────┐    │
│  │ /api/health│  │ /api/items/* │  │ /api/pipeline/run         │    │
│  │ /api/chat  │  │ /api/stats   │  │ /api/pipeline/run-async   │    │
│  └────────────┘  └──────────────┘  └─────────┬─────────────────┘    │
│                                               │                      │
│  ┌────────────────────────────────────────────▼──────────────────┐   │
│  │                    CREW ORCHESTRATOR                           │   │
│  │                                                               │   │
│  │  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐   │   │
│  │  │ Regulatory  │──▶│  Compliance  │──▶│  Remediation    │   │   │
│  │  │ Analyst     │   │  Mapper      │   │  Planner        │   │   │
│  │  │ Agent       │   │  Agent       │   │  Agent          │   │   │
│  │  └──────┬──────┘   └──────┬───────┘   └────────┬────────┘   │   │
│  │         │                 │                     │            │   │
│  │    Structured        KB Query +             Action Plan      │   │
│  │    Intelligence      Control Mapping        Generation       │   │
│  └─────────┼─────────────────┼─────────────────────┼────────────┘   │
│            │                 │                     │                  │
│  ┌─────────▼─────────────────▼─────────────────────▼────────────┐   │
│  │                     SERVICES LAYER                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐   │   │
│  │  │ Scraper  │  │ Bedrock  │  │ KB       │  │ Chat       │   │   │
│  │  │ Service  │  │ Service  │  │ Service  │  │ Service    │   │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘   │   │
│  │       │              │             │               │          │   │
│  └───────┼──────────────┼─────────────┼───────────────┼──────────┘   │
│          │              │             │               │               │
└──────────┼──────────────┼─────────────┼───────────────┼──────────────┘
           │              │             │               │
           ▼              ▼             ▼               ▼
   ┌───────────┐  ┌──────────────┐  ┌──────────────────────┐
   │ RSS Feeds │  │ Amazon       │  │ Amazon Bedrock       │
   │ + Websites│  │ Bedrock LLM  │  │ Knowledge Base       │
   │ (5 live   │  │ (Nova Pro)   │  │ (OpenSearch          │
   │  sources) │  │              │  │  Serverless + S3)    │
   └───────────┘  └──────────────┘  └──────────────────────┘
```

## Data Flow

1. **Scrape** → RSS feeds (RBI, SEC, EUR-Lex) + websites (SEBI, MCA)
2. **Deduplicate** → Check SQLite for existing URLs
3. **Analyze** → Regulatory Analyst Agent extracts structured intelligence
4. **Map** → Compliance Mapper queries Bedrock KB for internal controls
5. **Plan** → Remediation Planner generates prioritized action items
6. **Persist** → Final RegulatoryItem saved to SQLite
7. **Serve** → FastAPI exposes items, stats, and chat via REST API

## AWS Resources

| Resource | Identifier |
|---|---|
| Region | us-east-1 |
| S3 Bucket | regulatory-compliance-kb-docs |
| Bedrock KB | regulatory-compliance-kb (ID: KODYLCVCD7) |
| Bedrock Model | amazon.nova-pro-v1:0 |
| Vector Store | OpenSearch Serverless (auto-created with KB) |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/health | Health check |
| POST | /api/pipeline/run | Run pipeline synchronously |
| POST | /api/pipeline/run-async | Run pipeline in background |
| GET | /api/pipeline/status | Check pipeline status |
| GET | /api/items | List items (filterable) |
| GET | /api/items/{id} | Get single item |
| PATCH | /api/items/{id}/status | Update item status |
| GET | /api/stats | Dashboard statistics |
| POST | /api/chat | RAG-powered Q&A |
