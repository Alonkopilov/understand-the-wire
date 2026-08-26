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
    # await config.load_kube_config("~/.kube/utw.yaml")

    # async with ApiClient() as api:
    #     v1 = client.CoreV1Api(api)
    #     ret = await v1.list_pod_for_all_namespaces()

    #     for p in ret.items:
    #         start_time = p.status.start_time
    #         details = {
    #             "status": p.status.phase,
    #             "version": p.metadata.resource_version,
    #             "pod": p.metadata.name,
    #             "node": p.spec.node_name,
    #             "zone": "eu-central-1",
    #             "uptimeSeconds": (datetime.now(start_time.tzinfo) - start_time).total_seconds()
    #         }

    #         print(details)


    return {
        "status": "Ready",
        "version": VERSION,
        "pod": POD,
        "node": NODE,
        "zone": "eu-central-1a",
        "uptimeSeconds": time.monotonic() - START_TIME
    }
