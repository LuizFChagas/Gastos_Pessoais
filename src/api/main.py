from fastapi import FastAPI

from src.database.database import engine
from src.database.models import Base

from src.api.auth_routes import router as auth_router
from src.api.gastos_routes import router as gastos_router


Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Controle de Gastos")


app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(gastos_router, prefix="/gastos", tags=["Gastos"])