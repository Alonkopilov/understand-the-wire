from typing import Dict, List

from fastapi import APIRouter
from kubernetes.aio import client, config
from kubernetes.aio.client.api_client import ApiClient
from kubernetes.client import V1Deployment, V1Node, V1Pod
from datetime import datetime, timezone
import os, time


router = APIRouter()


def is_node_ready(node: V1Node) -> bool:
    conditions = node.status.conditions
    for condition in conditions:
        if condition.type == "Ready" and condition.status == "True":
            return True
    return False

def is_pod_ready(pod: V1Pod) -> bool:
    conditions = pod.status.conditions
    for condition in conditions:
        if condition.type == "Ready" and condition.status == "True":
            return True
    return False


def get_pod_restarts(pod: V1Pod) -> int:
    containers = pod.status.container_statuses

    restarts = 0
    for container in containers:
        restarts += container.restart_count

    return restarts


def get_pod_age(pod: V1Pod) -> int:
    start_time = pod.status.start_time
    now = datetime.now(start_time.tzinfo)
    age = (now - start_time).total_seconds()

    return age


async def get_pods(api: client.ApiClient, namespace: str, deployment: V1Deployment) -> List[Dict]: # deployment.metadata.uid
    match_labels = ",".join([f"{k}={v}" for k, v in deployment.spec.selector.match_labels.items()])

    v1 = client.CoreV1Api(api)
    pods = await v1.list_namespaced_pod(namespace, label_selector=match_labels)

    pod_infos = []
    for pod in pods.items:
        pod_info = {
            "name": pod.metadata.name,
            "phase": pod.status.phase,
            "ready": is_pod_ready(pod),
            "restarts": get_pod_restarts(pod),
            "node": pod.spec.node_name,
            "ageSeconds": get_pod_age(pod)
        }
        pod_infos.append(pod_info)

    return pod_infos


@router.get("/api/cluster")
async def cluster():
    cluster = {
        "nodes": [],
        "workloads": []
    }

    async with client.ApiClient() as api:
        config.load_incluster_config()

        # List nodes and extract information
        v1 = client.CoreV1Api(api)
        nodes = await v1.list_node()

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
            cluster["nodes"].append(details)

        # List deployments and extract information and pods
        apps_v1 = client.AppsV1Api(api)
        deployments = await apps_v1.list_deployment_for_all_namespaces()
        
        for deployment in deployments.items:
            details = {
                "name": deployment.metadata.name,
                "namespace": deployment.metadata.namespace,
                "kind": deployment.kind,
                "ready": deployment.status.ready_replicas,
                "desired": deployment.spec.replicas,
                "pods": get_pods(api, deployment.metadata.namespace, deployment)
            }
            cluster["workloads"].append(details)

    return details
