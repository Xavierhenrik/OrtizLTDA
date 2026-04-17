'use client';

import { SiteHeader } from '@/components/site-header';
import { FormEvent, useEffect, useState } from 'react';

export default function AdminLoginPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [shellVisible, setShellVisible] = useState(false);

  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShellVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

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
      const data = (await response.json()) as { message?: string; success?: boolean };

      if (response.ok) {
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
      <SiteHeader />

      <main
        className={`admin-login-shell${shellVisible ? ' admin-login-shell--visible' : ''}`}
      >
        <div className="admin-login-card-wrap">
          <div className="admin-login-card">
            <div className="login-header">
              <h1>Login administrativo</h1>
              <p className="login-sub">Acesso ao painel de projetos — Ortiz Ltda</p>
            </div>
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required autoComplete="email" />
              </div>
              <div className="form-group">
                <label htmlFor="password">Senha</label>
                <input
                  type="password"
                  id="password"
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
          </div>
        </div>
      </main>
    </>
  );
}
