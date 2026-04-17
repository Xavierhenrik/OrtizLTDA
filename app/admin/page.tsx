'use client';

import { SiteHeader } from '@/components/site-header';
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

type Project = {
  _id: string;
  title: string;
  description: string;
  category: string;
  imageUrls?: string[];
};

type PendingImage = { id: string; file: File };

function PendingImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
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
          // preview local (blob); next/image não aplica
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
          <i className="fas fa-times" />
        </button>
      </div>
      <span className="admin-pending-name" title={file.name}>
        {file.name}
      </span>
    </div>
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
          <i className="fas fa-times" />
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
          <i className="fas fa-arrow-left" />
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
          <i className="fas fa-arrow-right" />
        </button>
      </div>
    </li>
  );
}

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [shellVisible, setShellVisible] = useState(false);
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

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      const data = (await response.json()) as Project[];
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
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShellVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  function openModal(project?: Project) {
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
  }

  function closeModal() {
    if (enterAnimTimerRef.current) {
      clearTimeout(enterAnimTimerRef.current);
      enterAnimTimerRef.current = null;
    }
    setEnteringImageUrls([]);
    setModalOpen(false);
    setCurrentProjectId(null);
    setPendingImages([]);
    setKeptImageUrls([]);
  }

  function pushPendingFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setPendingImages((prev) => {
      const next = [...prev];
      files.forEach((file, i) => {
        next.push({ id: `${Date.now()}-${i}-${file.name}-${file.size}`, file });
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

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    if (currentProjectId) {
      formData.append('keepImageUrls', JSON.stringify(keptImageUrls));
    }
    for (const { file } of pendingImages) {
      formData.append('images', file);
    }

    const url = currentProjectId ? `/api/projects/${currentProjectId}` : '/api/projects';
    const method = currentProjectId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, { method, body: formData });
      if (response.ok) {
        const saved = (await response.json()) as Project;
        const prevKept = new Set(keptImageUrls);
        const nextUrls = saved.imageUrls?.length ? [...saved.imageUrls] : [];
        const newlyUploaded = nextUrls.filter((u) => !prevKept.has(u));

        setKeptImageUrls(nextUrls);
        setPendingImages([]);

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

        if (!currentProjectId && saved._id) {
          setCurrentProjectId(saved._id);
          setModalTitle('Editar Projeto');
        }

        loadProjects();
      } else {
        alert('Erro ao salvar projeto');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar projeto');
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (response.ok) loadProjects();
      else alert('Erro ao excluir projeto');
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir projeto');
    }
  }

  function logout() {
    window.location.href = '/admin/logout';
  }

  return (
    <>
      <SiteHeader />

      <main className={`admin-shell${shellVisible ? ' admin-shell--visible' : ''}`}>
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
              <i className="fas fa-arrow-left" /> Voltar ao site
            </button>
            <button type="button" className="btn-ortiz-outline" onClick={logout}>
              <i className="fas fa-sign-out-alt" /> Sair
            </button>
            <button type="button" className="btn-ortiz-primary btn-ortiz-static" onClick={() => openModal()}>
              <i className="fas fa-plus" /> Novo projeto
            </button>
          </div>
        </div>

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
                    <i className="fas fa-edit" /> Editar
                  </button>
                  <button
                    type="button"
                    className="btn-ortiz-danger"
                    onClick={() => deleteProject(project._id)}
                  >
                    <i className="fas fa-trash" /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div
        className={`admin-modal${modalOpen ? ' admin-modal--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!modalOpen}
      >
        <div className="admin-modal-inner">
          <div className="modal-header">
            <h2>{modalTitle}</h2>
            <button type="button" className="close-btn" onClick={closeModal} aria-label="Fechar">
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
                    <div className="admin-dropzone-icon" aria-hidden>
                      <i className="fas fa-cloud-upload-alt" />
                    </div>
                    <p className="admin-dropzone-title">Adicionar imagens</p>
                    <p className="admin-dropzone-text">
                      Arraste arquivos aqui ou use o botão — <strong>várias imagens</strong> de uma vez.
                    </p>
                    <button
                      type="button"
                      className="btn-ortiz-outline admin-dropzone-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-folder-open" /> Escolher arquivos
                    </button>
                  </div>

                  {pendingImages.length > 0 && (
                    <div className="admin-images-block admin-images-block--pending">
                      <span className="admin-images-block-title">Novas (envio ao salvar)</span>
                      <ul className="admin-pending-attachments" aria-live="polite">
                        {pendingImages.map((item) => (
                          <li key={item.id}>
                            <PendingImagePreview file={item.file} onRemove={() => removePendingImage(item.id)} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-ortiz-outline btn-modal-cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button type="submit" className="btn-ortiz-primary btn-ortiz-static btn-modal-save">
                <i className="fas fa-save" /> Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
