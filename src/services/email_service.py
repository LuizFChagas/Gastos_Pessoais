import os
import json
import urllib.request
import urllib.error
from datetime import datetime
from html import escape as _esc


def _enviar(destinatario: str, assunto: str, html: str):
    api_key = os.getenv("BREVO_API_KEY")
    remetente = os.getenv("SMTP_USER")

    if not api_key or not remetente:
        raise RuntimeError("Credenciais de email não configuradas (BREVO_API_KEY / SMTP_USER)")

    payload = json.dumps({
        "sender": {"name": "Finly", "email": remetente},
        "to": [{"email": destinatario}],
        "subject": assunto,
        "htmlContent": html,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        method="POST",
        headers={
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Brevo respondeu {e.code}: {detalhe}") from e


def enviar_otp(destinatario: str, codigo: str, nome: str):
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px;">
      <div style="font-size:22px;font-weight:800;color:#10b981;margin-bottom:8px;">Finly</div>
      <h2 style="margin:0 0 16px;font-size:18px;color:#f1f5f9;">Código de verificação</h2>
      <p style="color:#94a3b8;margin:0 0 24px;">Olá, <strong style="color:#f1f5f9;">{_esc(nome) or "usuário"}</strong>! Use o código abaixo para concluir o login.</p>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#10b981;">{codigo}</span>
      </div>
      <p style="color:#64748b;font-size:13px;margin:0;">Este código expira em <strong>10 minutos</strong>. Se não foi você, ignore este email.</p>
    </div>
    """
    _enviar(destinatario, f"{codigo} é seu código Finly", html)


def enviar_verificacao(destinatario: str, token: str, nome: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    link = f"{frontend_url}/verificar-email?token={token}"
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px;">
      <div style="font-size:22px;font-weight:800;color:#10b981;margin-bottom:8px;">Finly</div>
      <h2 style="margin:0 0 16px;font-size:18px;color:#f1f5f9;">Confirme seu email</h2>
      <p style="color:#94a3b8;margin:0 0 24px;">Olá, <strong style="color:#f1f5f9;">{_esc(nome) or "usuário"}</strong>! Clique no botão abaixo para ativar sua conta.</p>
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
        <p style="font-size:15px;color:#f1f5f9;margin:0;line-height:1.6;white-space:pre-wrap;">{_esc(texto)}</p>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">De: <strong style="color:#f1f5f9;">{_esc(nome_usuario)}</strong> &lt;{_esc(email_usuario)}&gt;</p>
      <p style="color:#64748b;font-size:12px;margin:0;">{data_hora}</p>
    </div>
    """
    _enviar(admin_email, "Nova sugestão — Finly", html)


def enviar_reset_senha(destinatario: str, token: str, nome: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    link = f"{frontend_url}/redefinir-senha?token={token}"
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px;">
      <div style="font-size:22px;font-weight:800;color:#10b981;margin-bottom:8px;">Finly</div>
      <h2 style="margin:0 0 16px;font-size:18px;color:#f1f5f9;">Redefinir senha</h2>
      <p style="color:#94a3b8;margin:0 0 24px;">Olá, <strong style="color:#f1f5f9;">{_esc(nome) or "usuário"}</strong>! Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
      <a href="{link}" style="display:inline-block;background:#10b981;color:white;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">Redefinir senha</a>
      <p style="color:#64748b;font-size:13px;margin:0;">Se não foi você, ignore este email. Sua senha não será alterada.</p>
    </div>
    """
    _enviar(destinatario, "Redefinir senha — Finly", html)
