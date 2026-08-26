from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os, time
from app.routes import health, cluster

origins = [
    "http://localhost:5173"
]

def create_application() -> FastAPI:
    application = FastAPI()

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
