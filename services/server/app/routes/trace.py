from fastapi import APIRouter, Request
from kubernetes.aio import client, config
from kubernetes.aio.client.api_client import ApiClient
from datetime import datetime, timezone
import os, time


START_TIME = time.monotonic()
POD = os.environ.get("HOSTNAME", "local")
NODE = os.environ.get("NODE_NAME", "laptop")
VERSION = os.environ.get("VERSION", "-1")

router = APIRouter()


@router.get("/api/trace")
async def trace(request: Request):
    headers = request.headers
    host = request.get("host", "")
    alb_trace_id = request.get("x-amzn-trace-id", "")
    forwarded_server = request.get("x-forwarded-server", "")
    
    return {
        "headers": headers,
        "pod": POD,
        "node": NODE,
        "version": VERSION
    }
