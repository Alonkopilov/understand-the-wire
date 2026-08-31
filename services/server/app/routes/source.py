from typing import Dict
from functools import lru_cache
from urllib.error import HTTPError, URLError
from urllib.request import urlopen
import os
from fastapi import APIRouter, HTTPException

router = APIRouter()

OWNER = os.environ.get("REPO_OWNER")
REPO = os.environ.get("REPO_NAME")
BRANCH = os.environ.get("REPO_BRANCH")

ALLOWED_DIRS = ("infrastructure/", "k8s/", "services/")
ALLOWED_FILE_TYPES = (".tf", ".tfvars.example", ".yaml", ".yml", ".tpl", ".sh", ".py", ".ts", ".tsx", ".css", ".json")


def is_file_allowed(path: str) -> bool:
    return (
        ".." not in path
        and not path.startswith("/")
        and path.startswith(ALLOWED_DIRS)
        and path.endswith(ALLOWED_FILE_TYPES)
    )


def get_language(path: str) -> str:
    if path.endswith(".yaml") or path.endswith('.yml'):
        return "yaml"
    if path.endswith(".tf"):
        return "hcl"
    if path.endswith(".sh") or path.endswith(".tpl"):
        return "bash"
    return "text"


@lru_cache(maxsize=128)
def fetch_file_content(path: str) -> Dict[str, str]:
    url = f"https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}/{path}"

    with urlopen(url, timeout=5) as response:
        content = response.read().decode("utf-8")

    browser_url = f"https://github.com/{OWNER}/{REPO}/blob/{BRANCH}/{path}"

    result = {
        "url": browser_url,
        "content": content
    }

    return result


@router.get("/api/source")
def source(path: str):
    if not is_file_allowed(path):
        raise HTTPException(400, "Path is not allowed")

    try:
        data = fetch_file_content(path)
    except HTTPError as e:
        raise HTTPException(404, "Path does not exist or is not available at the moment")
    except URLError:
        raise HTTPException(502, "Could not reach the repository")
    
    return {
        "path": path,
        "language": get_language(path),
        "content": data["content"],
        "url": data["browser_url"]
    }
