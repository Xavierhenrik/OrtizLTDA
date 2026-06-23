'use client';

import Image from 'next/image';
import { useProjetosModalInfoAlign } from '@/hooks/use-projetos-modal-info-align';
import { useProjetosModalLayout } from '@/hooks/use-projetos-modal-layout';
import { useRestoreFocusWhenClosed } from '@/hooks/use-restore-focus-when-closed';
import { useShellReveal } from '@/hooks/use-shell-reveal';
import { useFocusTrap } from '@/lib/use-focus-trap';
import type { ProjectApi } from '@/types/project';
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<ProjectApi[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'done'>('loading');
  const shellVisible = useShellReveal();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProjectImages, setCurrentProjectImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentProjectTitle, setCurrentProjectTitle] = useState('');
  const [currentProjectDescription, setCurrentProjectDescription] = useState('');
  const [currentProjectCategory, setCurrentProjectCategory] = useState('');
  const [imageSlideDir, setImageSlideDir] = useState<'prev' | 'next' | null>(null);
  const galleryImagesRef = useRef<string[]>([]);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const carregarProjetos = useCallback(async () => {
    try {
      const resposta = await fetch('/api/projects');
      const data = (await resposta.json()) as ProjectApi[];
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
    setCurrentProjectTitle('');
    setCurrentProjectDescription('');
    setCurrentProjectCategory('');
    setImageSlideDir(null);
  }, []);

  useRestoreFocusWhenClosed(modalOpen);

  useFocusTrap(modalRef, modalOpen);

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

  function openProjectModal(projectId: string) {
    const project = projetos.find((p) => p._id === projectId);
    if (!project) return;
    setCurrentProjectTitle(project.title);
    setCurrentProjectDescription(project.description);
    setCurrentProjectCategory(project.category);
    setCurrentProjectImages(project.imageUrls ?? []);
    setCurrentImageIndex(0);
    setImageSlideDir(null);
    setModalOpen(true);
  }

  function changeImage(n: number) {
    if (galleryImagesRef.current.length <= 1) return;
    setImageSlideDir(n > 0 ? 'next' : 'prev');
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
  const hasGallery = currentProjectImages.length > 0;
  const { layout: modalLayout, cssVars: modalCssVars } = useProjetosModalLayout({
    open: modalOpen,
    title: currentProjectTitle,
    description: currentProjectDescription,
    category: currentProjectCategory,
    hasGallery,
  });
  const infoContentKey = `${currentProjectTitle}|${currentProjectCategory}|${currentProjectDescription}`;
  const { columnRef: infoColumnRef, contentRef: infoContentRef, alignMode: infoAlignMode } =
    useProjetosModalInfoAlign(modalOpen, infoContentKey);
  const modalImageSizes =
    modalLayout.galleryFrameWidth > 0 ? `${Math.round(modalLayout.galleryFrameWidth)}px` : '90vw';
  const imageEnterClass =
    imageSlideDir === 'next'
      ? ' projetos-modal-img--enter-next'
      : imageSlideDir === 'prev'
        ? ' projetos-modal-img--enter-prev'
        : '';

  function renderLista() {
    if (loadState === 'loading') {
      return (
        <div className="projetos-loading" role="status" aria-live="polite">
          <div className="projetos-loading-spinner" aria-hidden="true" />
          <span className="projetos-loading-text">Carregando projetos...</span>
        </div>
      );
    }
    if (projetos.length === 0) {
      return <p className="projetos-vazio">Nenhum projeto cadastrado ainda.</p>;
    }
    return projetos.map((p) => {
      const thumb = p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : null;
      const headingId = `projeto-heading-${p._id}`;
      const isLongDescription = p.description.length > 140;
      return (
        <article className="projeto-card" key={p._id} aria-labelledby={headingId}>
          {thumb ? (
            <button
              type="button"
              className="projeto-card-thumb"
              onClick={() => openProjectModal(p._id)}
              aria-label={`Ver detalhes do projeto: ${p.title}`}
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
            <h3 id={headingId}>{p.title}</h3>
            <div className="categoria">{p.category}</div>
            <div className={`descricao-wrap${isLongDescription ? ' descricao-wrap--truncated' : ''}`}>
              <div className="descricao">{p.description}</div>
            </div>
            {isLongDescription ? (
              <button type="button" className="ler-mais" onClick={() => openProjectModal(p._id)}>
                Ler mais
              </button>
            ) : null}
          </div>
        </article>
      );
    });
  }

  return (
    <>
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className={`projetos-shell${shellVisible ? ' projetos-shell--visible' : ''}`}
      >
        <h1 id="titulo-projetos" className="titulo-pagina">
          Projetos Realizados
        </h1>
        <section className="projetos-lista" id="projetosLista" aria-labelledby="titulo-projetos">
          {renderLista()}
        </section>
      </main>

      <div
        id="galleryModal"
        ref={modalRef}
        className={`modal projetos-modal${modalOpen ? ' projetos-modal--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!modalOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeGalleryModal();
        }}
      >
        <div className="projetos-modal-inner" style={modalCssVars as CSSProperties}>
          <button
            type="button"
            ref={closeBtnRef}
            className="close-btn projetos-modal-close"
            onClick={closeGalleryModal}
            aria-label="Fechar detalhes do projeto"
          >
            &times;
          </button>
          <div className="projetos-modal-body">
            <div
              ref={infoColumnRef}
              className={`projetos-modal-col projetos-modal-col--info projetos-modal-col--info-${infoAlignMode}`}
            >
              <div ref={infoContentRef} className="projetos-modal-info-block">
                <h2 id={titleId} className="projetos-modal-titulo">
                  {currentProjectTitle || 'Projeto'}
                </h2>
                {currentProjectCategory ? (
                  <div className="projetos-modal-categoria">{currentProjectCategory}</div>
                ) : null}
                <div className="projetos-modal-descricao">{currentProjectDescription}</div>
              </div>
            </div>
            <div className="projetos-modal-col projetos-modal-col--gallery">
              {currentProjectImages.length > 0 ? (
                <div className="modal-content">
                  <div className="projetos-modal-frame">
                    {gallerySrc ? (
                      <Image
                        key={gallerySrc}
                        src={gallerySrc}
                        alt={
                          currentProjectTitle
                            ? `Foto do projeto: ${currentProjectTitle}`
                            : 'Imagem do projeto'
                        }
                        fill
                        className={`projetos-modal-img${imageEnterClass}`}
                        sizes={modalImageSizes}
                        priority={modalOpen}
                      />
                    ) : null}
                    <span className="projetos-modal-edge projetos-modal-edge--left" aria-hidden="true" />
                    <span className="projetos-modal-edge projetos-modal-edge--right" aria-hidden="true" />
                  </div>
                  {currentProjectImages.length > 1 ? (
                    <>
                      <button
                        type="button"
                        className="prev"
                        onClick={() => changeImage(-1)}
                        aria-label="Imagem anterior"
                      >
                        &#10094;
                      </button>
                      <button
                        type="button"
                        className="next"
                        onClick={() => changeImage(1)}
                        aria-label="Próxima imagem"
                      >
                        &#10095;
                      </button>
                    </>
                  ) : null}
                </div>
              ) : (
                <p className="projetos-modal-sem-imagem">Nenhuma imagem disponível para este projeto.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
