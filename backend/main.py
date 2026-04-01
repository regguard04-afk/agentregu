"""Application entry point — starts the FastAPI server."""

import uvicorn

from backend.config import API_HOST, API_PORT


def main():
    print(f"\n🚀 Starting Regulatory Intelligence API on {API_HOST}:{API_PORT}\n")
    uvicorn.run(
        "backend.api.main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
    )


if __name__ == "__main__":
    main()
