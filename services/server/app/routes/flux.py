from fastapi import APIRouter
from kubernetes.aio import client

router = APIRouter()

def get_flux_condition(resource: dict) -> dict:
    conditions = resource.get("status", {}).get("conditions", [])
    for condition in conditions:
        if condition.get("type", "") == "Ready":
            return condition
    return {}


@router.get("/api/flux")
async def flux():
    cluster = {
        "resources": [],
        "repository": None
    }

    async with client.ApiClient() as api:
        # List Flux GitRepositories and extract information
        co = client.CustomObjectsApi(api)
        objects = await co.list_cluster_custom_object(
            group="source.toolkit.fluxcd.io",
            version="v1",
            plural="gitrepositories"
        )

        if objects["items"]:
            repo = objects["items"][0]
            cluster["repository"] = {
                "url": repo.get("spec", {}).get("url", ""),
                "branch": repo.get("spec", {}).get("ref", {}).get("branch", ""),
                "revision":  repo.get("status", {}).get("artifact", {}).get("revision", "")
            }

        # List Flux HelmReleases and extract information
        objects = await co.list_cluster_custom_object(
            group="helm.toolkit.fluxcd.io",
            version="v2",
            plural="helmreleases"
        )

        for helm_release in objects["items"]:
            ready_condition = get_flux_condition(helm_release)
            resource = {
                "name": helm_release.get("metadata", {}).get("name", ""),
                "namespace": helm_release.get("metadata", {}).get("namespace", ""),
                "kind": "HelmRelease",
                "ready": ready_condition.get("status", "") == "True",
                "suspended": helm_release.get("spec", {}).get("suspend", False),
                "revision": helm_release.get("status", {}).get("lastAttemptedRevision", ""),
                "lastApplied": ready_condition.get("lastTransitionTime", ""),
                "message": ready_condition.get("message", "")
            }
            cluster["resources"].append(resource)

        # List Flux Kustomizations and extract information
        objects = await co.list_cluster_custom_object(
            group="kustomize.toolkit.fluxcd.io",
            version="v1",
            plural="kustomizations"
        )

        for kustomization in objects["items"]:
            ready_condition = get_flux_condition(kustomization)
            resource = {
                "name": kustomization.get("metadata", {}).get("name", ""),
                "namespace": kustomization.get("metadata", {}).get("namespace", ""),
                "kind": "Kustomization",
                "ready": ready_condition.get("status", "") == "True",
                "suspended": kustomization.get("spec", {}).get("suspend", False),
                "revision": kustomization.get("status", {}).get("lastAppliedRevision", ""),
                "lastApplied": ready_condition.get("lastTransitionTime", ""),
                "message": ready_condition.get("message", ""),
                "path": kustomization.get("spec", {}).get("path", "")
            }
            cluster["resources"].append(resource)

    return cluster
