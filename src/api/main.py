from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.auth_routes import router as auth_router
from src.api.gastos_routes import router as gastos_router

from src.database.database import engine
from src.database.models import Base

from src.core.logging_config import setup_logging

setup_logging()

app = FastAPI(title="API Controle de Gastos")

Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(gastos_router, prefix="/gastos", tags=["Gastos"])


@app.get("/")
def home():
    return {"message": "API Controle de Gastos funcionando"}
