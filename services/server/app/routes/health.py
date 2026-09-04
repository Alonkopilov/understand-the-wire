from fastapi import APIRouter, Response
import os, time


START_TIME = time.monotonic()
POD = os.environ.get("HOSTNAME", "local")
NODE = os.environ.get("NODE_NAME", "laptop")
VERSION = os.environ.get("VERSION", "-1")

router = APIRouter()


@router.get("/api/health")
async def health(response: Response):
    # The backend is down? - return a cached version for 24 hours
    response.headers["Cache-Control"] = "public, max-age=60, stale-if-error=86400"

    return {
        "status": "Ready",
        "version": VERSION,
        "pod": POD,
        "node": NODE,
        "zone": "eu-central-1a",
        "uptimeSeconds": time.monotonic() - START_TIME
    }
