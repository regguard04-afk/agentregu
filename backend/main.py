"""Application entry point — starts the FastAPI server."""

import os

import uvicorn

from backend.config import API_HOST, API_PORT


def main():
    # Render sets the PORT env var — use it if available
    port = int(os.getenv("PORT", API_PORT))
    host = os.getenv("HOST", "0.0.0.0")

    print(f"\n🚀 Starting Regulatory Intelligence API on {host}:{port}\n")
    uvicorn.run(
        "backend.api.main:app",
        host=host,
        port=port,
        reload=False,
    )


if __name__ == "__main__":
    main()
