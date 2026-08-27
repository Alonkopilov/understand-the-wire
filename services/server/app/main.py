from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import os, time
from app.routes import health, cluster
from kubernetes.aio import config

origins = [
    "http://localhost:5173"
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        config.load_incluster_config()
    except config.ConfigException:
        await config.load_kube_config()
    yield


def create_application() -> FastAPI:
    application = FastAPI(lifespan=lifespan)

    application.include_router(health.router)
    application.include_router(cluster.router)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return application


app = create_application()
