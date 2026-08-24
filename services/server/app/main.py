from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os, time
from app.routes import health

START_TIME = time.monotonic()
POD = os.environ.get("HOSTNAME", "local")

origins = [
    "http://localhost:5173"
]

def create_application() -> FastAPI:
    application = FastAPI()

    application.include_router(health.router)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return application


app = create_application()
