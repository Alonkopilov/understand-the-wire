from fastapi import APIRouter
from kubernetes.aio import client, config
from kubernetes.aio.client.api_client import ApiClient
from datetime import datetime, timezone

# def time_diff_str(dt: datetime, now: datetime = None) -> str:
#     if now is None:
#         now = datetime.now(dt.tzinfo)

#     delta = now - dt
#     seconds = delta.total_seconds()
#     abs_seconds = abs(seconds)

#     if abs_seconds < 60:
#         value, unit = seconds, "second"
#     elif abs_seconds < 3600:
#         value, unit = seconds / 60, "minute"
#     elif abs_seconds < 86400:
#         value, unit = seconds / 3600, "hour"
#     elif abs_seconds < 86400 * 30:
#         value, unit = seconds / 86400, "day"
#     elif abs_seconds < 86400 * 365:
#         value, unit = seconds / (86400 * 30), "month"
#     else:
#         value, unit = seconds / (86400 * 365), "year"

#     value = round(value)
#     unit += "" if abs(value) == 1 else "s"
    
#     return f"{value} {unit}"


router = APIRouter()

@router.get("/api/health")
async def health():
    await config.load_kube_config("~/.kube/utw.yaml")

    async with ApiClient() as api:
        v1 = client.CoreV1Api(api)
        ret = await v1.list_pod_for_all_namespaces()

        for p in ret.items:
            start_time = p.status.start_time
            details = {
                "status": p.status.phase,
                "version": p.metadata.resource_version,
                "pod": p.metadata.name,
                "node": p.spec.node_name,
                "zone": "eu-central-1",
                "uptimeSeconds": (datetime.now(start_time.tzinfo) - start_time).total_seconds()
            }

            print(details)


    return {
        "Status": "ON!"
    }