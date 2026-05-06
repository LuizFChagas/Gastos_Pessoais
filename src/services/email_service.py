import smtplib
import os
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def enviar_otp(destinatario: str, codigo: str, nome: str):
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    if not smtp_user or not smtp_pass:
        raise RuntimeError("Credenciais de email não configuradas (SMTP_USER / SMTP_PASS)")

    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px;">
      <div style="font-size:22px;font-weight:800;color:#10b981;margin-bottom:8px;">Finly</div>
      <h2 style="margin:0 0 16px;font-size:18px;color:#f1f5f9;">Código de verificação</h2>
      <p style="color:#94a3b8;margin:0 0 24px;">Olá, <strong style="color:#f1f5f9;">{nome or "usuário"}</strong>! Use o código abaixo para concluir o login.</p>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#10b981;">{codigo}</span>
      </div>
      <p style="color:#64748b;font-size:13px;margin:0;">Este código expira em <strong>10 minutos</strong>. Se não foi você, ignore este email.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{codigo} é seu código Finly"
    msg["From"] = f"Finly <{smtp_user}>"
    msg["To"] = destinatario
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, destinatario, msg.as_string())


def _enviar(destinatario: str, assunto: str, html: str):
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    if not smtp_user or not smtp_pass:
        raise RuntimeError("Credenciais de email não configuradas (SMTP_USER / SMTP_PASS)")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"] = f"Finly <{smtp_user}>"
    msg["To"] = destinatario
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, destinatario, msg.as_string())


def enviar_verificacao(destinatario: str, token: str, nome: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    link = f"{frontend_url}/verificar-email?token={token}"
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px;">
      <div style="font-size:22px;font-weight:800;color:#10b981;margin-bottom:8px;">Finly</div>
      <h2 style="margin:0 0 16px;font-size:18px;color:#f1f5f9;">Confirme seu email</h2>
      <p style="color:#94a3b8;margin:0 0 24px;">Olá, <strong style="color:#f1f5f9;">{nome or "usuário"}</strong>! Clique no botão abaixo para ativar sua conta.</p>
      <a href="{link}" style="display:inline-block;background:#10b981;color:white;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">Verificar email</a>
      <p style="color:#64748b;font-size:13px;margin:0;">Se não foi você quem criou esta conta, ignore este email.</p>
    </div>
    """
    _enviar(destinatario, "Confirme seu email — Finly", html)


def enviar_sugestao_admin(admin_email: str, texto: str, nome_usuario: str, email_usuario: str):
    data_hora = datetime.now().strftime("%d/%m/%Y %H:%M")
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px;">
      <div style="font-size:22px;font-weight:800;color:#10b981;margin-bottom:8px;">Finly</div>
      <h2 style="margin:0 0 16px;font-size:18px;color:#f1f5f9;">Nova sugestão recebida</h2>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="font-size:15px;color:#f1f5f9;margin:0;line-height:1.6;">{texto}</p>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">De: <strong style="color:#f1f5f9;">{nome_usuario}</strong> &lt;{email_usuario}&gt;</p>
      <p style="color:#64748b;font-size:12px;margin:0;">{data_hora}</p>
    </div>
    """
    _enviar(admin_email, f"Nova sugestão — Finly", html)


def enviar_reset_senha(destinatario: str, token: str, nome: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    link = f"{frontend_url}/redefinir-senha?token={token}"
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px;">
      <div style="font-size:22px;font-weight:800;color:#10b981;margin-bottom:8px;">Finly</div>
      <h2 style="margin:0 0 16px;font-size:18px;color:#f1f5f9;">Redefinir senha</h2>
      <p style="color:#94a3b8;margin:0 0 24px;">Olá, <strong style="color:#f1f5f9;">{nome or "usuário"}</strong>! Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
      <a href="{link}" style="display:inline-block;background:#10b981;color:white;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">Redefinir senha</a>
      <p style="color:#64748b;font-size:13px;margin:0;">Se não foi você, ignore este email. Sua senha não será alterada.</p>
    </div>
    """
    _enviar(destinatario, "Redefinir senha — Finly", html)
