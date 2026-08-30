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
    host = headers.get("host", "")
    alb_trace_id = headers.get("x-amzn-trace-id", "")
    forwarded_server = headers.get("x-forwarded-server", "")
    forwarded_port = headers.get("x-forwarded-port", "")
    forwarded_portocol = headers.get("x-forwarded-proto", "")
    real_ip = headers.get("x-real-ip", "")

    server_host, server_port = request.scope["server"]
    client_host, client_port = request.scope["client"]

    hops = [
        {
            "id": "dns",
            "title": "Cloudflare DNS",
            "subtitle": "Contains the CNAME that points to the Load Balancer url in AWS",
            "nodeId": "cloudflare",
            "facts": [
                {
                    "label": "Hostname",
                    "value": host,
                    "mono": True
                }
            ]
        },
        {
            "id": "alb",
            "title": "AWS Application Load Balancer",
            "subtitle": "Internet-facing ALB, automatically redirects HTTP to HTTPS, TLS is terminated from this point.",
            "nodeId": "alb",
            "facts": [
                {
                    "label": "ALB Trace ID",
                    "value": alb_trace_id,
                    "mono": True
                },
                {
                    "label": "Protocol",
                    "value": forwarded_portocol,
                    "mono": True
                },
                {
                    "label": "Port",
                    "value": forwarded_port,
                    "mono": True
                }
            ]
        },
        {
            "id": "tg",
            "title": "Target Group",
            "subtitle": "The ALB targets all requests to the nodes in the private subnet",
            "nodeId": "target-group",
            "facts": []
        },
        {
            "id": "node",
            "title": "EC2 Node",
            "subtitle": "The nodes sit in private subnets, running Kubernetes with K3S",
            "nodeId": "ec2",
            "facts": [
                {
                    "label": "Node Name",
                    "value": NODE,
                    "mono": True
                }
            ]
        },
        {
            "id": "traefik",
            "title": "Traefik Ingress",
            "subtitle": "The Traefik ingress controller routes requests to the relevant pods",
            "nodeId": "traefik",
            "facts": [
                {
                    "label": "Traefik Pod",
                    "value": forwarded_server,
                    "mono": True
                },
                {
                    "label": "The CNI Bridge IP (The 'default gateway' of the Node)",
                    "value": real_ip,
                    "mono": True
                }
            ]
        }
    ]
    
    return {
        "hops": hops,
        "servedAt": datetime.now().isoformat()
    }
