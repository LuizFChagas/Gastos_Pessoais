from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from src.database.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    senha = Column(String)
    nome = Column(String, nullable=True)
    data_nascimento = Column(String, nullable=True)  # formato "YYYY-MM-DD"
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=True)
    two_fa_enabled = Column(Boolean, default=False, nullable=True)
    otp_code = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    email_verificado = Column(Boolean, default=False, nullable=True)
    verificacao_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    plano = Column(String, default="free", nullable=True)  # "free" | "premium"

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
    data_original = Column(DateTime, nullable=True)
    parcela = Column(String, nullable=True)
    transferencia_interna = Column(Boolean, default=False, nullable=True)
    categoria_manual = Column(Boolean, default=False, nullable=True)
    forma_pagamento = Column(String, nullable=True)  # debito | credito | pix | dinheiro | outro
    fixo = Column(Boolean, default=False, nullable=True)
    origem_id = Column(Integer, ForeignKey("gastos.id"), nullable=True, index=True)
    ajuste_saldo = Column(Boolean, default=False, nullable=True)
    motivo_ajuste = Column(String, nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)
    extrato_id = Column(Integer, ForeignKey("extratos.id"), nullable=True, index=True)

    usuario = relationship("Usuario", back_populates="gastos")
    extrato = relationship("Extrato", back_populates="gastos")


class CategoriaPersonalizada(Base):
    __tablename__ = "categorias_personalizadas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)
    nome = Column(String)
    cor = Column(String)
    criado_em = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario")


class Investimento(Base):
    __tablename__ = "investimentos"

    id                = Column(Integer, primary_key=True, index=True)
    usuario_id        = Column(Integer, ForeignKey("usuarios.id"), index=True)
    nome              = Column(String)
    ticker            = Column(String, nullable=True)
    tipo              = Column(String)           # renda_fixa | acoes | fiis | cripto | outros
    valor_investido   = Column(Float, default=0)
    valor_atual       = Column(Float, default=0)
    rentabilidade_mes = Column(Float, default=0) # % no mês
    rentabilidade_ano = Column(Float, default=0) # % no ano
    criado_em         = Column(DateTime, default=datetime.utcnow)

    usuario  = relationship("Usuario")
    aportes  = relationship("Aporte", back_populates="investimento", cascade="all, delete-orphan")


class Aporte(Base):
    __tablename__ = "aportes"

    id              = Column(Integer, primary_key=True, index=True)
    investimento_id = Column(Integer, ForeignKey("investimentos.id"), index=True)
    usuario_id      = Column(Integer, ForeignKey("usuarios.id"), index=True)
    data            = Column(DateTime, default=datetime.utcnow)
    quantidade      = Column(Float, nullable=True)    # nº de ações/cotas (opcional)
    preco_unitario  = Column(Float, nullable=True)    # preço por unidade (opcional)
    valor           = Column(Float)                   # valor total do aporte
    nota            = Column(String, nullable=True)

    investimento = relationship("Investimento", back_populates="aportes")


class Sugestao(Base):
    __tablename__ = "sugestoes"

    id         = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)
    texto      = Column(String)
    criado_em  = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario")