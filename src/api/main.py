import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.auth_routes import router as auth_router
from src.api.gastos_routes import router as gastos_router
from src.api.investimentos_routes import router as investimentos_router
from src.api.sugestoes_routes import router as sugestoes_router

from src.database.database import engine
from src.database.models import Base

from src.core.logging_config import setup_logging

setup_logging()

_is_producao = os.getenv("ENVIRONMENT", "development") == "production"

app = FastAPI(
    title="API Controle de Gastos",
    docs_url=None if _is_producao else "/docs",
    redoc_url=None if _is_producao else "/redoc",
    openapi_url=None if _is_producao else "/openapi.json",
)

Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",
]

_extra_origins = os.getenv("FRONTEND_URLS", "")
origins += [o.strip() for o in _extra_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


app.include_router(auth_router,         prefix="/auth",         tags=["Auth"])
app.include_router(gastos_router,       prefix="/gastos",       tags=["Gastos"])
app.include_router(investimentos_router,prefix="/investimentos", tags=["Investimentos"])
app.include_router(sugestoes_router,    prefix="/sugestoes",    tags=["Sugestoes"])


@app.get("/")
def home():
    return {"message": "API Controle de Gastos funcionando"}
