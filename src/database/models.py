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
    extratos = relationship("Extrato", back_populates="usuario")


class Extrato(Base):
    __tablename__ = "extratos"

    id = Column(Integer, primary_key=True, index=True)
    nome_arquivo = Column(String)
    banco = Column(String)
    data_importacao = Column(DateTime, default=datetime.utcnow)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)

    usuario = relationship("Usuario", back_populates="extratos")
    gastos = relationship("Gasto", back_populates="extrato", cascade="all, delete-orphan")


class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String)
    valor = Column(Float)
    categoria = Column(String, index=True)
    banco = Column(String, index=True)
    tipo = Column(String, index=True)
    data_hora = Column(DateTime, default=datetime.utcnow, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)
    extrato_id = Column(Integer, ForeignKey("extratos.id"), nullable=True, index=True)

    usuario = relationship("Usuario", back_populates="gastos")
    extrato = relationship("Extrato", back_populates="gastos")