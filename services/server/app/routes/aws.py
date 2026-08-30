from typing import Dict, List
from fastapi import APIRouter
import boto3

session = boto3.Session()
ec2 = session.client("ec2")
elbv2 = session.client("elbv2")
acm = session.client("acm")
sts = session.client("sts")
router = APIRouter()


def get_targets(load_balancer_arn: str) -> List[Dict]:
    targets = []
    target_groups = elbv2.describe_target_groups(LoadBalancerArn=load_balancer_arn)["TargetGroups"]

    for tg in target_groups:
        target_health = elbv2.describe_target_health(TargetGroupArn=tg["TargetGroupArn"])["TargetHealthDescriptions"]
        if tg["TargetType"] == "instance":
            for th in target_health:
                instance_id = th["Target"]["Id"]
                reservations = ec2.describe_instances(InstanceIds=[instance_id])["Reservations"]
                for r in reservations:
                    instances = r["Instances"]
                    for i in instances:
                        targets.append({
                            "id": i["InstanceId"],
                            "health": th["TargetHealth"]["State"],
                            "zone": i["Placement"]["AvailabilityZone"],
                            "port": th["Target"]["Port"]
                        })
    return targets
                


def is_subnet_public(subnet_id: str) -> bool:
    route_tables = ec2.describe_route_tables(Filters=[
        {
            "Name": "association.subnet-id",
            "Values": [subnet_id]
        }
    ])["RouteTables"]

    for rt in route_tables:
        routes = rt["Routes"]
        for r in routes:
            if r.get("DestinationCidrBlock") == "0.0.0.0/0" and "igw" in r.get("GatewayId", ""):
                return True
    return False


@router.get("/api/aws")
def aws():
    aws = {
        "region": "",
        "accountId": "",
        "vpc": {},
        "subnets": [],
        "loadBalancer": None,
        "certificate": None
    }

    aws["region"] = session.region_name
    aws["accountId"] = sts.get_caller_identity()["Account"]

    # Fetch VPC
    vpcs = ec2.describe_vpcs()["Vpcs"]
    for v in vpcs:
        aws["vpc"] = {
            "id": v["VpcId"],
            "cidr": v["CidrBlock"]
        }

        # Fetch Subnets
        subnets = ec2.describe_subnets(Filters=[
            {
                'Name': "vpc-id",
                "Values": [
                    v["VpcId"]
                ]
            }
        ])["Subnets"]

        for s in subnets:
            aws["subnets"].append({
                "id": s["SubnetId"],
                "cidr": s["CidrBlock"],
                "zone": s["AvailabilityZone"],
                "public": is_subnet_public(s["SubnetId"])
            })

    # Fetch Load Balancers
    load_balancers = elbv2.describe_load_balancers()["LoadBalancers"]
    for lb in load_balancers:
        aws["loadBalancer"] = {
            "name": lb["LoadBalancerName"],
            "dnsName": lb["DNSName"],
            "scheme": lb["Scheme"],
            "targets": get_targets(lb["LoadBalancerArn"])
        }

    # Fetch certificates
    certificates = acm.list_certificates()["CertificateSummaryList"]

    for c in certificates:
        aws["certificate"] = {
            "domain": c["DomainName"],
            "status": c["Status"],
            "notAfter": c.get("NotAfter")
        }

    return aws
