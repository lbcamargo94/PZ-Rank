interface PaginationProps {
  page:       number;
  totalPages: number;
  onChange:   (page: number) => void;
}

// Monta a lista de páginas com elipses (1 … 4 5 6 … 10) em vez de listar
// todas as páginas quando há muitas.
function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pz-pagination" aria-label="Paginação">
      <button
        className="pz-page-nav"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        <i className="ti ti-chevron-left" /> Anterior
      </button>

      <div className="pz-page-numbers">
        {buildPageList(page, totalPages).map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="pz-page-ellipsis">…</span>
            : <button
                key={p}
                className={`pz-page-num${page === p ? ' active' : ''}`}
                onClick={() => onChange(p)}
                aria-current={page === p ? 'page' : undefined}
              >
                {p}
              </button>
        )}
      </div>

      <button
        className="pz-page-nav"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Próximo <i className="ti ti-chevron-right" />
      </button>
    </nav>
  );
}
