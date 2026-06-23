'use client';

import { SiteHeader } from '@/components/site-header';
import { useRestoreFocusWhenClosed } from '@/hooks/use-restore-focus-when-closed';
import { useShellReveal } from '@/hooks/use-shell-reveal';
import { useFocusTrap } from '@/lib/use-focus-trap';
import Image from 'next/image';
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  getFileRelativePath,
  groupFilesByFolder,
  processIncomingImageFiles,
} from '@/lib/projects/image-files';
import {
  BatchUploadError,
  uploadImagesInBatches,
  type BatchUploadProgress,
} from '@/lib/projects/client-upload';
import type { ProjectApi } from '@/types/project';

type ImportStats = {
  total: number;
  accepted: number;
  ignored: number;
  duplicates: number;
  folderCount: number;
};

type PendingImage = { id: string; file: File; relativePath?: string };

const PENDING_PREVIEW_LIMIT = 12;

function UploadProgressBar({ progress }: { progress: BatchUploadProgress }) {
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="admin-upload-progress" role="status" aria-live="polite">
      <div className="admin-upload-progress-header">
        <span className="admin-upload-progress-label">
          Enviando imagens {progress.completed}/{progress.total}
        </span>
        <span className="admin-upload-progress-pct">{pct}%</span>
      </div>
      <div
        className="admin-upload-progress-track"
        role="progressbar"
        aria-valuenow={progress.completed}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-label={`Envio de imagens: ${progress.completed} de ${progress.total}`}
      >
        <div className="admin-upload-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="admin-upload-progress-meta">
        Lote {progress.batchIndex}/{progress.batchTotal}
      </p>
    </div>
  );
}

function formatImportStats(stats: ImportStats): string {
  if (stats.accepted === 0) {
    const extras: string[] = [];
    if (stats.ignored > 0) extras.push(`${stats.ignored} ignorados`);
    if (stats.duplicates > 0) extras.push(`${stats.duplicates} duplicados`);
    const suffix = extras.length ? ` (${extras.join(', ')})` : '';
    return `Nenhuma imagem válida encontrada${suffix}`;
  }

  const base =
    stats.folderCount > 0
      ? stats.folderCount === 1
        ? `${stats.accepted} imagens adicionadas de 1 pasta`
        : `${stats.accepted} imagens adicionadas de ${stats.folderCount} pastas`
      : `${stats.accepted} imagens adicionadas`;

  const extras: string[] = [];
  if (stats.ignored > 0) extras.push(`${stats.ignored} ignorados`);
  if (stats.duplicates > 0) extras.push(`${stats.duplicates} duplicados`);

  return extras.length ? `${base} (${extras.join(', ')})` : base;
}

function PendingImagePreview({
  file,
  relativePath,
  onRemove,
}: {
  file: File;
  relativePath?: string;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div className="admin-pending-item">
      <div className="admin-pending-thumb-wrap">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="admin-pending-thumb" />
        ) : (
          <div className="admin-pending-thumb admin-pending-thumb--placeholder" aria-hidden />
        )}
        <button
          type="button"
          className="admin-pending-remove"
          onClick={onRemove}
          aria-label={`Remover ${file.name}`}
        >
          <i className="fas fa-times" aria-hidden />
        </button>
      </div>
      <span className="admin-pending-name" title={relativePath ?? getFileRelativePath(file)}>
        {file.name}
      </span>
    </div>
  );
}

function PendingImagesList({
  items,
  onRemove,
}: {
  items: PendingImage[];
  onRemove: (id: string) => void;
}) {
  const files = items.map((p) => p.file);
  const fileGroups = groupFilesByFolder(files);
  const isFlat = fileGroups.size === 1 && fileGroups.has('');

  const lookup = new Map<string, PendingImage>();
  items.forEach((item) => {
    lookup.set(`${getFileRelativePath(item.file)}\0${item.file.size}`, item);
  });

  const renderItem = (item: PendingImage) => (
    <li key={item.id}>
      <PendingImagePreview
        file={item.file}
        relativePath={item.relativePath}
        onRemove={() => onRemove(item.id)}
      />
    </li>
  );

  if (isFlat) {
    return (
      <ul className="admin-pending-attachments" aria-live="polite">
        {items.map((item) => renderItem(item))}
      </ul>
    );
  }

  const folders = Array.from(fileGroups.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  return (
    <>
      {folders.map((folder) => {
        const groupFiles = fileGroups.get(folder)!;
        const groupItems = groupFiles.map(
          (f) => lookup.get(`${getFileRelativePath(f)}\0${f.size}`)!
        );
        const visible = groupItems.slice(0, PENDING_PREVIEW_LIMIT);
        const remaining = groupItems.length - visible.length;

        return (
          <div key={folder || '__root__'} className="admin-pending-folder-group">
            <span className="admin-pending-folder-title">{folder || '(raiz)'}</span>
            <ul className="admin-pending-attachments" aria-live="polite">
              {visible.map((item) => renderItem(item))}
            </ul>
            {remaining > 0 ? (
              <p className="admin-pending-more">e mais {remaining} imagens</p>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

function ExistingImageTile({
  url,
  index,
  total,
  onRemove,
  onReorder,
  animateEnter,
}: {
  url: string;
  index: number;
  total: number;
  onRemove: () => void;
  onReorder: (delta: number) => void;
  animateEnter?: boolean;
}) {
  return (
    <li className={`admin-gallery-item${animateEnter ? ' admin-gallery-item--enter' : ''}`}>
      <div className="admin-gallery-thumb-wrap">
        <Image
          src={url}
          alt=""
          width={96}
          height={96}
          className="admin-gallery-thumb"
          sizes="96px"
          unoptimized
        />
        <button type="button" className="admin-gallery-remove" onClick={onRemove} aria-label="Remover imagem">
          <i className="fas fa-times" aria-hidden />
        </button>
      </div>
      <div className="admin-gallery-order">
        <button
          type="button"
          className="admin-gallery-order-btn"
          disabled={index === 0}
          onClick={() => onReorder(-1)}
          aria-label="Mover antes na ordem"
        >
          <i className="fas fa-arrow-left" aria-hidden />
        </button>
        <span className="admin-gallery-order-label">
          {index + 1}/{total}
        </span>
        <button
          type="button"
          className="admin-gallery-order-btn"
          disabled={index >= total - 1}
          onClick={() => onReorder(1)}
          aria-label="Mover depois na ordem"
        >
          <i className="fas fa-arrow-right" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<ProjectApi[]>([]);
  const shellVisible = useShellReveal();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Novo Projeto');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('residencial');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [keptImageUrls, setKeptImageUrls] = useState<string[]>([]);
  const [dropActive, setDropActive] = useState(false);
  const [enteringImageUrls, setEnteringImageUrls] = useState<string[]>([]);
  const enterAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<BatchUploadProgress | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [saveError, setSaveError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const projectModalRef = useRef<HTMLDivElement>(null);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const confirmCancelRef = useRef<HTMLButtonElement>(null);

  const closeModal = useCallback(() => {
    if (enterAnimTimerRef.current) {
      clearTimeout(enterAnimTimerRef.current);
      enterAnimTimerRef.current = null;
    }
    setEnteringImageUrls([]);
    setModalOpen(false);
    setCurrentProjectId(null);
    setPendingImages([]);
    setKeptImageUrls([]);
    setImportStats(null);
    setSaveError('');
  }, []);

  const openModal = useCallback((project?: ProjectApi) => {
    setSaveError('');
    setImportStats(null);
    if (project) {
      setModalTitle('Editar Projeto');
      setCurrentProjectId(project._id);
      setTitle(project.title);
      setDescription(project.description);
      setCategory(project.category);
      setKeptImageUrls(project.imageUrls?.length ? [...project.imageUrls] : []);
    } else {
      setModalTitle('Novo Projeto');
      setCurrentProjectId(null);
      setTitle('');
      setDescription('');
      setCategory('residencial');
      setKeptImageUrls([]);
    }
    setPendingImages([]);
    setEnteringImageUrls([]);
    if (enterAnimTimerRef.current) {
      clearTimeout(enterAnimTimerRef.current);
      enterAnimTimerRef.current = null;
    }
    setModalOpen(true);
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      const data = (await response.json()) as ProjectApi[];
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    return () => {
      if (enterAnimTimerRef.current) {
        clearTimeout(enterAnimTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDeleteError('');
        setPendingDelete(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingDelete]);

  useRestoreFocusWhenClosed(modalOpen);
  useRestoreFocusWhenClosed(!!pendingDelete);

  useFocusTrap(projectModalRef, modalOpen);
  useFocusTrap(confirmDialogRef, !!pendingDelete);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, closeModal]);

  useEffect(() => {
    if (!modalOpen) return;
    const t = window.setTimeout(() => {
      document.getElementById('title')?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [modalOpen]);

  useEffect(() => {
    if (!pendingDelete) return;
    const t = window.setTimeout(() => confirmCancelRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [pendingDelete]);

  function pushPendingFiles(fileList: FileList | File[]) {
    const { files, stats } = processIncomingImageFiles(fileList);

    if (stats.accepted > 0 || stats.total > 0) {
      setImportStats(stats);
    }

    if (!files.length) return;

    setPendingImages((prev) => {
      const existingKeys = new Set(
        prev.map((p) => `${getFileRelativePath(p.file)}\0${p.file.size}`)
      );
      const next = [...prev];
      files.forEach((file, i) => {
        const relativePath = getFileRelativePath(file);
        const key = `${relativePath}\0${file.size}`;
        if (existingKeys.has(key)) return;
        existingKeys.add(key);
        next.push({
          id: `${Date.now()}-${i}-${relativePath}-${file.size}`,
          file,
          relativePath: relativePath !== file.name ? relativePath : undefined,
        });
      });
      return next;
    });
  }

  function onImageFilesChange(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list?.length) return;
    pushPendingFiles(list);
    e.target.value = '';
  }

  function onFolderFilesChange(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list?.length) return;
    pushPendingFiles(list);
    e.target.value = '';
  }

  function onDropzoneDrop(e: DragEvent) {
    e.preventDefault();
    setDropActive(false);
    if (e.dataTransfer.files?.length) {
      pushPendingFiles(e.dataTransfer.files);
    }
  }

  function onDropzoneDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function removePendingImage(id: string) {
    setPendingImages((prev) => prev.filter((p) => p.id !== id));
  }

  function removeKeptUrl(index: number) {
    setKeptImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function reorderKept(index: number, delta: number) {
    setKeptImageUrls((prev) => {
      const j = index + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function onSubmitProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setSaveError('');

    const pendingFiles = pendingImages.map((p) => p.file);
    const totalPending = pendingFiles.length;

    if (totalPending > 0) {
      setUploadProgress({ completed: 0, total: totalPending, batchIndex: 0, batchTotal: 0 });
    } else {
      setUploadProgress(null);
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    if (currentProjectId) {
      formData.append('keepImageUrls', JSON.stringify(keptImageUrls));
    }

    const url = currentProjectId ? `/api/projects/${currentProjectId}` : '/api/projects';
    const method = currentProjectId ? 'PUT' : 'POST';
    let saved: ProjectApi | null = null;

    try {
      const response = await fetch(url, { method, body: formData });
      if (!response.ok) {
        setSaveError('Erro ao salvar projeto. Tente novamente.');
        return;
      }

      saved = (await response.json()) as ProjectApi;
      const prevKept = new Set(keptImageUrls);
      let newlyUploaded: string[] = [];

      if (totalPending > 0) {
        const { imageUrls, uploadedUrls } = await uploadImagesInBatches(
          saved!._id,
          pendingFiles,
          setUploadProgress
        );
        saved = { ...saved!, imageUrls };
        newlyUploaded = uploadedUrls;
      } else {
        const nextUrls = saved!.imageUrls?.length ? [...saved!.imageUrls] : [];
        newlyUploaded = nextUrls.filter((u) => !prevKept.has(u));
      }

      const nextUrls = saved!.imageUrls?.length ? [...saved!.imageUrls] : [];

      setKeptImageUrls(nextUrls);
      setPendingImages([]);
      setImportStats(null);

      if (enterAnimTimerRef.current) {
        clearTimeout(enterAnimTimerRef.current);
      }
      if (newlyUploaded.length > 0) {
        setEnteringImageUrls(newlyUploaded);
        enterAnimTimerRef.current = setTimeout(() => {
          setEnteringImageUrls([]);
          enterAnimTimerRef.current = null;
        }, 750);
      } else {
        setEnteringImageUrls([]);
      }

      if (!currentProjectId && saved!._id) {
        setCurrentProjectId(saved!._id);
        setModalTitle('Editar Projeto');
      }

      loadProjects();
      setSaveError('');
    } catch (err) {
      console.error(err);

      if (err instanceof BatchUploadError && err.uploadedCount > 0) {
        setKeptImageUrls(err.imageUrls);
        setPendingImages((prev) => prev.slice(err.uploadedCount));
        if (!currentProjectId && saved?._id) {
          setCurrentProjectId(saved._id);
          setModalTitle('Editar Projeto');
        }
        loadProjects();
        setSaveError(
          `${err.uploadedCount} imagens enviadas; falha no restante. Clique em Salvar para continuar.`
        );
        return;
      }

      setSaveError(
        totalPending > 0
          ? 'Erro ao enviar imagens. O projeto foi salvo; tente adicionar as imagens restantes novamente.'
          : 'Erro ao salvar projeto. Tente novamente.'
      );
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  }

  async function executeDeleteProject() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setPendingDelete(null);
        setDeleteError('');
        loadProjects();
      } else {
        setDeleteError('Erro ao excluir projeto. Tente novamente.');
      }
    } catch (e) {
      console.error(e);
      setDeleteError('Erro ao excluir projeto. Tente novamente.');
    }
  }

  function logout() {
    window.location.href = '/admin/logout';
  }

  return (
    <>
      <SiteHeader />

      <main
        id="conteudo-principal"
        tabIndex={-1}
        className={`admin-shell${shellVisible ? ' admin-shell--visible' : ''}`}
      >
        <div className="admin-toolbar">
          <h1>Painel administrativo</h1>
          <div className="admin-toolbar-actions">
            <button
              type="button"
              className="btn-ortiz-outline"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              <i className="fas fa-arrow-left" aria-hidden /> Voltar ao site
            </button>
            <button type="button" className="btn-ortiz-outline" onClick={logout}>
              <i className="fas fa-sign-out-alt" aria-hidden /> Sair
            </button>
            <button type="button" className="btn-ortiz-primary btn-ortiz-static" onClick={() => openModal()}>
              <i className="fas fa-plus" aria-hidden /> Novo projeto
            </button>
          </div>
        </div>
        {saveError ? (
          <p className="admin-error-banner" role="alert">
            {saveError}
          </p>
        ) : null}
        {deleteError ? (
          <p className="admin-error-banner" role="alert">
            {deleteError}
          </p>
        ) : null}

        <div className="projects-grid-admin">
          {projects.map((project) => (
            <div className="project-card-admin" key={project._id}>
              {project.imageUrls && project.imageUrls.length > 0 ? (
                <Image
                  src={project.imageUrls[0]}
                  alt={project.title}
                  width={400}
                  height={200}
                  className="project-image"
                  sizes="(max-width: 900px) 100vw, 280px"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="project-image project-image--empty" aria-hidden />
              )}
              <div className="project-info">
                <h3 className="project-title">{project.title}</h3>
                <div className="project-category">{project.category}</div>
                <div className="project-actions">
                  <button
                    type="button"
                    className="btn-ortiz-success"
                    onClick={() => openModal(project)}
                  >
                    <i className="fas fa-edit" aria-hidden /> Editar
                  </button>
                  <button
                    type="button"
                    className="btn-ortiz-danger"
                    onClick={() => {
                      setDeleteError('');
                      setPendingDelete({ id: project._id, title: project.title });
                    }}
                  >
                    <i className="fas fa-trash" aria-hidden /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {pendingDelete && (
        <div
          className="admin-confirm-backdrop"
          role="presentation"
          onClick={() => {
            setDeleteError('');
            setPendingDelete(null);
          }}
        >
          <div
            ref={confirmDialogRef}
            className="admin-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-delete-title"
            aria-describedby="admin-confirm-delete-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="admin-confirm-delete-title" className="admin-confirm-title">
              Excluir projeto?
            </h2>
            <p id="admin-confirm-delete-desc" className="admin-confirm-text">
              O projeto <strong>{pendingDelete.title}</strong> será removido permanentemente, incluindo as imagens
              no armazenamento. Esta ação não pode ser desfeita.
            </p>
            <div className="admin-confirm-actions">
              <button
                ref={confirmCancelRef}
                type="button"
                className="btn-ortiz-outline btn-modal-cancel"
                onClick={() => {
                  setDeleteError('');
                  setPendingDelete(null);
                }}
              >
                Cancelar
              </button>
              <button type="button" className="btn-ortiz-danger admin-confirm-delete-btn" onClick={executeDeleteProject}>
                <i className="fas fa-trash" aria-hidden /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={projectModalRef}
        className={`admin-modal${modalOpen ? ' admin-modal--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-project-modal-title"
        aria-hidden={!modalOpen}
      >
        <div className="admin-modal-inner">
          <div className="modal-header">
            <h2 id="admin-project-modal-title">{modalTitle}</h2>
            <button type="button" className="close-btn" onClick={closeModal} aria-label="Fechar" disabled={isSaving}>
              &times;
            </button>
          </div>
          <form onSubmit={onSubmitProject}>
            <div className="admin-modal-body">
              <div className="admin-modal-col admin-modal-col--fields">
                <div className="form-group">
                  <label htmlFor="title">Título</label>
                  <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Descrição</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group form-group--last-field">
                  <label htmlFor="category">Categoria</label>
                  <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="instalacoes-rurais">Instalações Rurais</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-col admin-modal-col--images">
                <div className="form-group form-group--images">
                  <span className="form-label-block" id="images-label">
                    Imagens
                  </span>

                  {currentProjectId && keptImageUrls.length > 0 && (
                    <div className="admin-images-block">
                      <span className="admin-images-block-title">No site hoje</span>
                      <ul className="admin-existing-grid" aria-label="Imagens do projeto">
                        {keptImageUrls.map((url, index) => (
                          <ExistingImageTile
                            key={url}
                            url={url}
                            index={index}
                            total={keptImageUrls.length}
                            onRemove={() => removeKeptUrl(index)}
                            onReorder={(delta) => reorderKept(index, delta)}
                            animateEnter={enteringImageUrls.includes(url)}
                          />
                        ))}
                      </ul>
                    </div>
                  )}

                  <div
                    className={`admin-dropzone${dropActive ? ' admin-dropzone--active' : ''}`}
                    onDragEnter={() => setDropActive(true)}
                    onDragLeave={() => setDropActive(false)}
                    onDragOver={onDropzoneDragOver}
                    onDrop={onDropzoneDrop}
                  >
                    <input
                      ref={fileInputRef}
                      id="images"
                      name="images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="admin-file-input"
                      aria-labelledby="images-label"
                      onChange={onImageFilesChange}
                    />
                    <input
                      ref={folderInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      // @ts-expect-error webkitdirectory is non-standard
                      webkitdirectory=""
                      directory=""
                      className="admin-file-input"
                      aria-hidden
                      tabIndex={-1}
                      onChange={onFolderFilesChange}
                    />
                    <div className="admin-dropzone-icon" aria-hidden>
                      <i className="fas fa-cloud-upload-alt" aria-hidden />
                    </div>
                    <p className="admin-dropzone-title">Adicionar imagens</p>
                    <p className="admin-dropzone-text">
                      Arraste arquivos ou pastas aqui ou use os botões — <strong>várias imagens</strong> de uma
                      vez.
                    </p>
                    <div className="admin-dropzone-actions">
                      <button
                        type="button"
                        className="btn-ortiz-outline admin-dropzone-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <i className="fas fa-file-image" aria-hidden /> Escolher arquivos
                      </button>
                      <button
                        type="button"
                        className="btn-ortiz-outline admin-dropzone-btn"
                        onClick={() => folderInputRef.current?.click()}
                      >
                        <i className="fas fa-folder-open" aria-hidden /> Escolher pasta
                      </button>
                    </div>
                  </div>

                  {importStats ? (
                    <p className="admin-import-stats" role="status" aria-live="polite">
                      {formatImportStats(importStats)}
                    </p>
                  ) : null}

                  {pendingImages.length > 0 && (
                    <div className="admin-images-block admin-images-block--pending">
                      <span className="admin-images-block-title">Novas (envio ao salvar)</span>
                      <PendingImagesList items={pendingImages} onRemove={removePendingImage} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {uploadProgress ? <UploadProgressBar progress={uploadProgress} /> : null}
              <button
                type="button"
                className="btn-ortiz-outline btn-modal-cancel"
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-ortiz-primary btn-ortiz-static btn-modal-save"
                disabled={isSaving}
              >
                <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'}`} aria-hidden />{' '}
                {isSaving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
