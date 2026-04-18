'use client';

import './admin-login.css';
import './admin-login-modal.css';

import { AdminLoginForm } from '@/components/admin-login-form';
import { useRestoreFocusWhenClosed } from '@/hooks/use-restore-focus-when-closed';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type AdminLoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useRestoreFocusWhenClosed(open);

  useFocusTrap(panelRef, open && mounted);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLInputElement>('input[type="email"]');
      first?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="admin-login-modal-root admin-login-modal-root--open"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="admin-login-modal-inner"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-form-title"
      >
        <button type="button" className="admin-login-modal-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <div className="admin-login-modal-stack">
          <div className="admin-login-card-wrap">
            <div className="admin-login-card">
              <AdminLoginForm
                onSuccess={() => {
                  onClose();
                }}
              />
            </div>
          </div>
          <aside className="admin-login-modal-notice" role="status" aria-live="polite">
            <p className="admin-mobile-notice__text">
              <i className="fas fa-desktop admin-mobile-notice__icon" aria-hidden />
              <span>
                <strong>Experiência completa.</strong> Para revisar galerias e editar projetos com mais espaço na tela,
                recomendamos abrir o painel no computador ou em tablet.
              </span>
            </p>
          </aside>
        </div>
      </div>
    </div>,
    document.body
  );
}
