from typing import List

from fastapi import APIRouter
from kubernetes.aio import client, config
from kubernetes.aio.client.api_client import ApiClient
from kubernetes.client import V1Node
from datetime import datetime, timezone
import os, time


router = APIRouter()


def is_node_ready(node: V1Node) -> bool:
    conditions = node.status.conditions
    for condition in conditions:
        if condition.type == "Ready" and condition.status == "True":
            return True
    return False


@router.get("/api/cluster")
async def cluster():
    async with client.ApiClient() as api:
        config.load_incluster_config()

        v1 = client.CoreV1Api(api)
        nodes = v1.list_node()

        cluster_nodes = []
        for n in nodes.items:
            details = {
                "name": n.metadata.name,
                "ready": is_node_ready(n),
                "kubeletVersion": n.status.node_info.kubelet_version
                # "instanceType": "",
                # "zone": "",
                # "cpuPercent": 0,
                # "memoryPercent": 0
            }
            cluster_nodes.append(details)

    print(details)

    return details
