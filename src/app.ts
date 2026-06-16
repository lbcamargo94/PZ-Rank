// ============================================================
//  app.ts — Lógica principal do PZ Community Rank
// ============================================================

import { dbFetchAll, dbUploadImage, dbInsert, parseTimeToMinutes, Entry, SortKey } from './db';

// ── Estado da aplicação ────────────────────────────────────
interface AppState {
  entries: Entry[];
  sortKey: SortKey;
  pendingFile: File | null;
  dbReady: boolean;
}

const state: AppState = {
  entries: [],
  sortKey: 'days',
  pendingFile: null,
  dbReady: false,
};

// ── Referências DOM ────────────────────────────────────────
function $<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const DOM = {
  rankList:     $<HTMLDivElement>('rank-list'),
  emptyState:   $<HTMLDivElement>('empty-state'),
  statsBar:     $<HTMLDivElement>('stats-bar'),
  statTotal:    $<HTMLSpanElement>('stat-total'),
  statRecord:   $<HTMLSpanElement>('stat-record'),
  statKills:    $<HTMLSpanElement>('stat-kills'),
  footerCount:  $<HTMLSpanElement>('footer-count'),
  connStatus:   $<HTMLSpanElement>('conn-status'),
  sortBtns:     document.querySelectorAll<HTMLButtonElement>('.sort-btn'),
  modalBg:      $<HTMLDivElement>('modal-bg'),
  imgModalBg:   $<HTMLDivElement>('img-modal-bg'),
  imgModalSrc:  $<HTMLImageElement>('img-modal-src'),
  toast:        $<HTMLDivElement>('toast'),
  // form fields
  inpName:      $<HTMLInputElement>('inp-name'),
  inpLive:      $<HTMLInputElement>('inp-live'),
  inpDays:      $<HTMLInputElement>('inp-days'),
  inpTime:      $<HTMLInputElement>('inp-time'),
  inpKills:     $<HTMLInputElement>('inp-kills'),
  inpFile:      $<HTMLInputElement>('inp-file'),
  filePreview:  $<HTMLImageElement>('file-preview'),
  uploadText:   $<HTMLSpanElement>('upload-text'),
  btnSave:      $<HTMLButtonElement>('btn-save'),
  btnSaveText:  $<HTMLSpanElement>('btn-save-text'),
  errName:      $<HTMLSpanElement>('err-name'),
  errLive:      $<HTMLSpanElement>('err-live'),
  errStats:     $<HTMLSpanElement>('err-stats'),
  errFile:      $<HTMLSpanElement>('err-file'),
};

// ── Inicialização ──────────────────────────────────────────
async function init(): Promise<void> {
  showSkeletons();
  try {
    state.entries = await dbFetchAll(state.sortKey);
    state.dbReady = true;
    setConnStatus('ok', 'conectado');
    render();
  } catch (e) {
    console.error(e);
    setConnStatus('err', 'sem conexão');
    showToast('Erro ao conectar com o banco de dados.', 'error');
  } finally {
    hideSkeletons();
  }
}

init();

// ── Carregar entradas ──────────────────────────────────────
async function loadEntries(): Promise<void> {
  try {
    state.entries = await dbFetchAll(state.sortKey);
    render();
  } catch (e) {
    console.error(e);
    showToast('Erro ao carregar os dados.', 'error');
  } finally {
    hideSkeletons();
  }
}

// ── Renderização ───────────────────────────────────────────
function render(): void {
  const list = DOM.rankList;

  // remove skeleton rows se existirem
  list.querySelectorAll('.skeleton-row').forEach(el => el.remove());

  if (!state.entries.length) {
    if (!DOM.emptyState.parentNode) list.appendChild(DOM.emptyState);
    DOM.emptyState.style.display = 'block';
    DOM.statsBar.style.display = 'none';
    DOM.footerCount.textContent = '0 sobreviventes registrados';
    return;
  }

  DOM.emptyState.style.display = 'none';
  DOM.statsBar.style.display = 'grid';

  // stats bar
  const total = state.entries.length;
  const topDays = state.entries.reduce((max, e) => Math.max(max, e.days || 0), 0);
  const totalKills = state.entries.reduce((sum, e) => sum + (e.kills || 0), 0);
  DOM.statTotal.textContent = String(total);
  DOM.statRecord.textContent = topDays + (topDays === 1 ? ' dia' : ' dias');
  DOM.statKills.textContent = totalKills.toLocaleString('pt-BR');
  DOM.footerCount.textContent = total + (total === 1 ? ' sobrevivente registrado' : ' sobreviventes registrados');

  // rows
  list.innerHTML = '';
  state.entries.forEach((entry, i) => {
    list.appendChild(buildRow(entry, i));
  });
}

function buildRow(entry: Entry, index: number): HTMLDivElement {
  const div = document.createElement('div');
  const rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
  const initials = (entry.name || '?').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  div.className = `rank-row ${rankClass}`;
  div.innerHTML = `
    <div class="td td-rank">${medal}</div>
    <div class="td td-player">
      <div class="avatar">${esc(initials)}</div>
      <div class="player-info">
        <div class="player-name">${esc(entry.name)}</div>
        ${entry.live_url
          ? `<a class="live-link" href="${esc(entry.live_url)}" target="_blank" rel="noopener noreferrer">
               <span class="live-dot"></span>LIVE / VOD
             </a>`
          : '<span style="font-size:10px;color:var(--text-4);font-family:var(--font-mono)">sem link</span>'
        }
      </div>
    </div>
    <div class="td td-stat td-days">${entry.days ?? '—'}</div>
    <div class="td td-stat">${esc(entry.time_str) || '—'}</div>
    <div class="td td-stat">${entry.kills != null ? Number(entry.kills).toLocaleString('pt-BR') : '—'}</div>
    <div class="td td-img">
      ${entry.image_url
        ? `<img class="thumb" src="${esc(entry.image_url)}" alt="Screenshot de ${esc(entry.name)}" loading="lazy" />`
        : '<span class="no-img">—</span>'
      }
    </div>
    <div class="td">
      ${entry.live_url
        ? `<a class="td-live-link" href="${esc(entry.live_url)}" target="_blank" rel="noopener noreferrer">
             <i class="ti ti-external-link" aria-hidden="true"></i>abrir
           </a>`
        : '<span style="color:var(--text-4);font-family:var(--font-mono);font-size:10px">—</span>'
      }
    </div>
  `;

  if (entry.image_url) {
    const thumb = div.querySelector<HTMLImageElement>('.thumb');
    thumb?.addEventListener('click', () => openImgModal(entry.image_url as string, entry.name));
  }

  return div;
}

function showSkeletons(): void {
  DOM.rankList.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'skeleton-row';
    row.innerHTML = `
      <div class="skeleton" style="width:28px;height:14px"></div>
      <div class="skeleton" style="height:14px"></div>
      <div class="skeleton" style="width:40px;height:14px"></div>
      <div class="skeleton" style="width:60px;height:14px"></div>
      <div class="skeleton" style="width:50px;height:14px"></div>
      <div class="skeleton" style="width:44px;height:32px"></div>
      <div class="skeleton" style="width:48px;height:14px"></div>
    `;
    DOM.rankList.appendChild(row);
  }
}

function hideSkeletons(): void {
  DOM.rankList.querySelectorAll('.skeleton-row').forEach(el => el.remove());
}

// ── Ordenação ──────────────────────────────────────────────
DOM.sortBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    state.sortKey = btn.dataset.sort as SortKey;
    DOM.sortBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showSkeletons();
    await loadEntries();
  });
});

// ── Modal de registro ──────────────────────────────────────
$('btn-open-modal').addEventListener('click', openModal);
$('btn-close-modal').addEventListener('click', closeModal);
$('btn-cancel').addEventListener('click', closeModal);

DOM.modalBg.addEventListener('click', e => {
  if (e.target === DOM.modalBg) closeModal();
});

function openModal(): void {
  DOM.modalBg.classList.add('open');
  DOM.inpName.focus();
}

function closeModal(): void {
  DOM.modalBg.classList.remove('open');
  resetForm();
}

function resetForm(): void {
  [DOM.inpName, DOM.inpLive, DOM.inpDays, DOM.inpTime, DOM.inpKills].forEach(el => {
    el.value = '';
    el.classList.remove('error');
  });
  [DOM.errName, DOM.errLive, DOM.errStats, DOM.errFile].forEach(el => el.textContent = '');
  DOM.filePreview.style.display = 'none';
  DOM.filePreview.src = '';
  DOM.uploadText.textContent = 'Clique para selecionar imagem (máx. 5 MB)';
  DOM.inpFile.value = '';
  state.pendingFile = null;
}

// ── Upload de arquivo ──────────────────────────────────────
DOM.inpFile.addEventListener('change', e => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    DOM.errFile.textContent = 'Imagem muito grande. Máximo: 5 MB.';
    DOM.inpFile.value = '';
    return;
  }

  DOM.errFile.textContent = '';
  state.pendingFile = file;
  DOM.uploadText.textContent = file.name;

  const reader = new FileReader();
  reader.onload = ev => {
    DOM.filePreview.src = ev.target?.result as string;
    DOM.filePreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

// ── Salvar entrada ─────────────────────────────────────────
DOM.btnSave.addEventListener('click', async () => {
  if (!validateForm()) return;
  if (!state.dbReady) { showToast('Banco de dados não conectado.', 'error'); return; }

  setSaving(true);

  try {
    let imageUrl: string | null = null;
    if (state.pendingFile) {
      imageUrl = await dbUploadImage(state.pendingFile);
    }

    const timeStr = DOM.inpTime.value.trim();
    const entry: Entry = {
      name:     DOM.inpName.value.trim(),
      live_url: DOM.inpLive.value.trim() || null,
      days:     parseInt(DOM.inpDays.value) || 0,
      time_str: timeStr || null,
      time_raw: parseTimeToMinutes(timeStr),
      kills:    parseInt(DOM.inpKills.value) || 0,
      image_url: imageUrl,
    };

    await dbInsert(entry);
    showToast('Resultado registrado com sucesso!', 'success');
    closeModal();
    showSkeletons();
    await loadEntries();

  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar. Tente novamente.', 'error');
  } finally {
    setSaving(false);
  }
});

function validateForm(): boolean {
  let valid = true;

  if (!DOM.inpName.value.trim()) {
    DOM.errName.textContent = 'Nome obrigatório.';
    DOM.inpName.classList.add('error');
    valid = false;
  } else {
    DOM.errName.textContent = '';
    DOM.inpName.classList.remove('error');
  }

  const liveVal = DOM.inpLive.value.trim();
  if (liveVal && !isValidUrl(liveVal)) {
    DOM.errLive.textContent = 'URL inválida. Ex: https://twitch.tv/...';
    DOM.inpLive.classList.add('error');
    valid = false;
  } else {
    DOM.errLive.textContent = '';
    DOM.inpLive.classList.remove('error');
  }

  const days  = parseInt(DOM.inpDays.value);
  const kills = parseInt(DOM.inpKills.value);
  const time  = DOM.inpTime.value.trim();

  if (!days && !kills && !time) {
    DOM.errStats.textContent = 'Preencha pelo menos um campo de estatísticas.';
    valid = false;
  } else {
    DOM.errStats.textContent = '';
  }

  if (!state.pendingFile) {
    DOM.errFile.textContent = 'O print das habilidades é obrigatório.';
    valid = false;
  } else {
    DOM.errFile.textContent = '';
  }

  return valid;
}

function setSaving(saving: boolean): void {
  DOM.btnSave.disabled = saving;
  DOM.btnSaveText.textContent = saving ? 'Salvando...' : 'Confirmar';
}

function isValidUrl(str: string): boolean {
  try { new URL(str); return true; } catch { return false; }
}

// ── Modal de imagem ────────────────────────────────────────
function openImgModal(url: string, name: string): void {
  DOM.imgModalSrc.src = url;
  DOM.imgModalSrc.alt = `Screenshot das habilidades de ${name}`;
  DOM.imgModalBg.classList.add('open');
}

$('img-close').addEventListener('click', closeImgModal);
DOM.imgModalBg.addEventListener('click', e => {
  if (e.target === DOM.imgModalBg) closeImgModal();
});

function closeImgModal(): void {
  DOM.imgModalBg.classList.remove('open');
  setTimeout(() => { DOM.imgModalSrc.src = ''; }, 300);
}

// Fechar modais com ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (DOM.imgModalBg.classList.contains('open')) closeImgModal();
    else if (DOM.modalBg.classList.contains('open')) closeModal();
  }
});

// ── Toast ──────────────────────────────────────────────────
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(msg: string, type = ''): void {
  const t = DOM.toast;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ── Status de conexão ──────────────────────────────────────
function setConnStatus(type: string, label: string): void {
  DOM.connStatus.textContent = '';
  const icon = document.createElement('i');
  icon.className = 'ti ti-circle-filled';
  icon.setAttribute('aria-hidden', 'true');
  DOM.connStatus.appendChild(icon);
  DOM.connStatus.appendChild(document.createTextNode(' ' + label));
  DOM.connStatus.className = `footer-status ${type}`;
}

// ── Utilitários ────────────────────────────────────────────
function esc(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
