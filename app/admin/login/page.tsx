'use client';

import { AdminLoginForm } from '@/components/admin-login-form';
import { SiteHeader } from '@/components/site-header';
import { useEffect, useState } from 'react';

export default function AdminLoginPage() {
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

  return (
    <>
      <SiteHeader />

      <main className={`admin-login-shell${shellVisible ? ' admin-login-shell--visible' : ''}`}>
        <div className="admin-login-card-wrap">
          <div className="admin-login-card">
            <AdminLoginForm />
          </div>
        </div>
      </main>
    </>
  );
}
