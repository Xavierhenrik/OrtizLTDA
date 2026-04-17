'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

type Projeto = {
  _id: string;
  title: string;
  category: string;
  description: string;
  imageUrls?: string[];
};

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'done'>('loading');
  const [shellVisible, setShellVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProjectImages, setCurrentProjectImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const galleryImagesRef = useRef<string[]>([]);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const carregarProjetos = useCallback(async () => {
    try {
      const resposta = await fetch('/api/projects');
      const data = (await resposta.json()) as Projeto[];
      setProjetos(Array.isArray(data) ? data : []);
    } catch {
      setProjetos([]);
    } finally {
      setLoadState('done');
    }
  }, []);

  useEffect(() => {
    carregarProjetos();
  }, [carregarProjetos]);

  useEffect(() => {
    galleryImagesRef.current = currentProjectImages;
  }, [currentProjectImages]);

  const closeGalleryModal = useCallback(() => {
    setModalOpen(false);
    setCurrentProjectImages([]);
    setCurrentImageIndex(0);
  }, []);

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

  useEffect(() => {
    if (!modalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGalleryModal();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [modalOpen, closeGalleryModal]);

  function openGalleryModal(projectId: string) {
    const project = projetos.find((p) => p._id === projectId);
    if (project?.imageUrls && project.imageUrls.length > 0) {
      setCurrentProjectImages(project.imageUrls);
      setCurrentImageIndex(0);
      setModalOpen(true);
    }
  }

  function changeImage(n: number) {
    setCurrentImageIndex((idx) => {
      const imgs = galleryImagesRef.current;
      if (imgs.length === 0) return idx;
      let next = idx + n;
      if (next >= imgs.length) next = 0;
      else if (next < 0) next = imgs.length - 1;
      return next;
    });
  }

  const gallerySrc = currentProjectImages[currentImageIndex] ?? '';

  function renderLista() {
    if (loadState === 'loading') {
      return (
        <div className="projetos-skeleton" aria-hidden>
          <div className="projetos-skeleton-card" />
          <div className="projetos-skeleton-card" />
          <div className="projetos-skeleton-card" />
        </div>
      );
    }
    if (projetos.length === 0) {
      return <p className="projetos-vazio">Nenhum projeto cadastrado ainda.</p>;
    }
    return projetos.map((p) => {
      const thumb = p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : null;
      return (
        <div className="projeto-card" key={p._id}>
          {thumb ? (
            <button
              type="button"
              className="projeto-card-thumb"
              onClick={() => openGalleryModal(p._id)}
              aria-label={`Abrir galeria de imagens: ${p.title}`}
            >
              <Image
                src={thumb}
                alt=""
                width={320}
                height={200}
                className="projeto-card__img"
                sizes="(max-width: 480px) 100vw, 320px"
                decoding="async"
              />
            </button>
          ) : (
            <div className="projeto-card__noimg" aria-hidden />
          )}
          <div className="info">
            <h3>{p.title}</h3>
            <div className="categoria">{p.category}</div>
            <div className="descricao">{p.description}</div>
          </div>
        </div>
      );
    });
  }

  return (
    <>
      <main
        className={`projetos-shell${shellVisible ? ' projetos-shell--visible' : ''}`}
      >
        <h1 className="titulo-pagina">Projetos Realizados</h1>
        <div className="projetos-lista" id="projetosLista">
          {renderLista()}
        </div>
      </main>

      <div
        id="galleryModal"
        className={`modal projetos-modal${modalOpen ? ' projetos-modal--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeGalleryModal();
        }}
      >
        <h2 id={titleId} className="projetos-modal-title">
          Galeria do projeto
        </h2>
        <button
          type="button"
          ref={closeBtnRef}
          className="close-btn"
          onClick={closeGalleryModal}
          aria-label="Fechar galeria"
        >
          &times;
        </button>
        <div className="modal-content">
          {gallerySrc ? (
            <Image
              src={gallerySrc}
              alt="Imagem do projeto na galeria"
              width={1200}
              height={800}
              className="projetos-modal-img"
              sizes="90vw"
              priority={modalOpen}
            />
          ) : null}
          <button type="button" className="prev" onClick={() => changeImage(-1)} aria-label="Imagem anterior">
            &#10094;
          </button>
          <button type="button" className="next" onClick={() => changeImage(1)} aria-label="Próxima imagem">
            &#10095;
          </button>
        </div>
      </div>
    </>
  );
}
