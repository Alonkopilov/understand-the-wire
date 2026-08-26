from fastapi import APIRouter
from kubernetes.aio import client, config
from kubernetes.aio.client.api_client import ApiClient
from datetime import datetime, timezone
import os, time


START_TIME = time.monotonic()
POD = os.environ.get("HOSTNAME", "local")
NODE = os.environ.get("NODE_NAME", "laptop")
VERSION = os.environ.get("VERSION", "-1")

router = APIRouter()


@router.get("/api/health")
async def health():
    return {
        "status": "Ready",
        "version": VERSION,
        "pod": POD,
        "node": NODE,
        "zone": "eu-central-1a",
        "uptimeSeconds": time.monotonic() - START_TIME
    }
