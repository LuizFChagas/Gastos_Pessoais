from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from src.database.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    senha = Column(String)

    gastos = relationship("Gasto", back_populates="usuario")


class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String)
    valor = Column(Float)
    categoria = Column(String, index=True)
    banco = Column(String, index=True)
    tipo = Column(String, index=True)  # 👈 NOVO
    data_hora = Column(DateTime, default=datetime.utcnow, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)

    usuario = relationship("Usuario", back_populates="gastos")