import type { Metadata } from 'next';
import './projetos.css';

export const metadata: Metadata = {
  title: 'Projetos — Ortiz Ltda',
};

export default function ProjetosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
