from fastapi import APIRouter, Request
from datetime import datetime, timezone
import os


POD = os.environ.get("HOSTNAME", "local")
NODE = os.environ.get("NODE_NAME", "laptop")

router = APIRouter()


@router.get("/api/trace")
async def trace(request: Request):
    headers = request.headers
    host_header = headers.get("host", "")
    alb_trace_id = headers.get("x-amzn-trace-id", "")
    forwarded_server = headers.get("x-forwarded-server", "")
    forwarded_port = headers.get("x-forwarded-port", "")
    forwarded_protocol = headers.get("x-forwarded-proto", "")
    host = request.client.host if request.client else ""

    forwards = headers.get("x-forwarded-for", "").split(",")
    source_ip = forwards[-1].strip()

    hops = [
        {
            "id": "dns",
            "title": "Cloudflare DNS",
            "subtitle": "Contains the CNAME that points to the Load Balancer url in AWS",
            "nodeId": "cloudflare",
            "status": "ok" if host_header else "unknown",
            "facts": [
                {
                    "label": "Hostname",
                    "value": host_header,
                    "mono": True
                }
            ]
        },
        {
            "id": "alb",
            "title": "AWS Application Load Balancer",
            "subtitle": "Internet-facing ALB, automatically redirects HTTP to HTTPS, TLS is terminated from this point.",
            "nodeId": "alb",
            "status": "ok" if alb_trace_id else "unknown",
            "facts": [
                {
                    "label": "ALB Trace ID",
                    "value": alb_trace_id,
                    "mono": True
                },
                {
                    "label": "Protocol",
                    "value": forwarded_protocol,
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
            "status": "ok" if alb_trace_id else "unknown",
            "facts": []
        },
        {
            "id": "node",
            "title": "EC2 Node",
            "subtitle": "The nodes sit in private subnets, running Kubernetes with K3S",
            "nodeId": "ec2",
            "status": "ok" if NODE else "unknown",
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
            "status": "ok" if forwarded_server else "unknown",
            "facts": [
                {
                    "label": "Traefik Pod",
                    "value": forwarded_server,
                    "mono": True
                },
                {
                    "label": "Entered pod network via",
                    "value": source_ip,
                    "mono": True
                }
            ]
        },
        {
            "id": "pod",
            "title": "Server Pod",
            "subtitle": "The FastAPI process that produced this response",
            "nodeId": "apps",
            "status": "ok" if POD else "unknown",
            "facts": [
                {"label": "Pod", "value": POD, "mono": True},
                {"label": "Received from", "value": host, "mono": True},
            ],
        },
    ]
    
    return {
        "hops": hops,
        "servedAt": datetime.now(timezone.utc).isoformat()
    }
