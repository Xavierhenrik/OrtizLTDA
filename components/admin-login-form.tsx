'use client';

import { FormEvent, useId, useState } from 'react';

type AdminLoginFormProps = {
  /** Chamado após login bem-sucedido (ex.: fechar modal antes do redirect). */
  onSuccess?: () => void;
};

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [errorMessage, setErrorMessage] = useState('');
  const baseId = useId();
  const emailId = `${baseId}-email`;
  const passwordId = `${baseId}-password`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;

    try {
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { message?: string };

      if (response.ok) {
        onSuccess?.();
        window.location.href = '/admin';
      } else {
        setErrorMessage(data.message ?? 'Erro ao entrar');
      }
    } catch {
      setErrorMessage('Erro ao fazer login. Tente novamente.');
    }
  }

  return (
    <>
      <div className="login-header">
        <h1 id="admin-login-form-title">Login administrativo</h1>
        <p className="login-sub">Acesso ao painel de projetos — Ortiz Ltda</p>
      </div>
      <form onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label htmlFor={emailId}>Email</label>
          <input type="email" id={emailId} name="email" required autoComplete="email" />
        </div>
        <div className="form-group">
          <label htmlFor={passwordId}>Senha</label>
          <input
            type="password"
            id={passwordId}
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn-ortiz-primary btn-ortiz-static btn-login-submit">
          Entrar
        </button>
        {errorMessage ? <div className="error-message">{errorMessage}</div> : null}
      </form>
    </>
  );
}
